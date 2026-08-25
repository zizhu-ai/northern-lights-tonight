import { randomUUID } from "node:crypto";

import { del, get, put } from "@vercel/blob";

import {
  createVercelSnapshotStore,
  type SnapshotStateV2,
  type SnapshotStore,
// Node's strip-types runner requires the explicit extension.
// @ts-ignore TS5097: Next's bundler resolves this source import without emitting it.
} from "./snapshot-store.ts";

type StageCode = "ok" | "missing" | "written" | "conflict" | "error" | "skipped";

type DiagnosticEnvironment = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  AURORA_STATE_BLOB_READ_WRITE_TOKEN?: string;
};

export type PreviewBlobDiagnosticBody = {
  token_present: boolean;
  token_prefix_format: boolean;
  state_read: StageCode;
  scratch_create: StageCode;
  scratch_origin_get: StageCode;
  scratch_cas: StageCode;
  scratch_delete: StageCode;
  state_cas: StageCode;
};

type ScratchOperations = {
  create(pathname: string, body: string, token: string): Promise<void>;
  originGet(
    pathname: string,
    expectedBody: string,
    token: string,
  ): Promise<{ etag: string } | null>;
  compareAndSwap(
    pathname: string,
    etag: string,
    body: string,
    token: string,
  ): Promise<void>;
  remove(pathname: string, token: string): Promise<void>;
};

type DiagnosticDependencies = {
  randomId(): string;
  createStore(env: DiagnosticEnvironment): SnapshotStore;
  scratch: ScratchOperations;
};

const SCRATCH_BODY = JSON.stringify({ diagnostic: true });

const scratchOperations: ScratchOperations = {
  async create(pathname, body, token) {
    await put(pathname, body, {
      access: "private",
      token,
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
    });
  },
  async originGet(pathname, expectedBody, token) {
    const result = await get(pathname, { access: "private", token, useCache: false });
    if (result === null || result.stream === null || result.blob.etag.length === 0) return null;
    if ((await new Response(result.stream).text()) !== expectedBody) return null;
    return { etag: result.blob.etag };
  },
  async compareAndSwap(pathname, etag, body, token) {
    await put(pathname, body, {
      access: "private",
      token,
      addRandomSuffix: false,
      contentType: "application/json",
      ifMatch: etag,
    });
  },
  async remove(pathname, token) {
    await del(pathname, { token });
  },
};

const defaultDependencies: DiagnosticDependencies = {
  randomId: randomUUID,
  createStore: (env) => createVercelSnapshotStore(env as NodeJS.ProcessEnv),
  scratch: scratchOperations,
};

const emptyBody = (tokenPresent: boolean, tokenPrefixFormat: boolean): PreviewBlobDiagnosticBody => ({
  token_present: tokenPresent,
  token_prefix_format: tokenPrefixFormat,
  state_read: "skipped",
  scratch_create: "skipped",
  scratch_origin_get: "skipped",
  scratch_cas: "skipped",
  scratch_delete: "skipped",
  state_cas: "skipped",
});

export const isPreviewEnvironment = (env: DiagnosticEnvironment): boolean =>
  env.VERCEL_ENV === "preview";

export async function runPreviewBlobDiagnostic(
  env: DiagnosticEnvironment,
  dependencies: DiagnosticDependencies = defaultDependencies,
): Promise<{ status: 200 | 503; body: PreviewBlobDiagnosticBody }> {
  const token = env.AURORA_STATE_BLOB_READ_WRITE_TOKEN?.trim() ?? "";
  const tokenPresent = token.length > 0;
  const tokenPrefixFormat = token.startsWith("vercel_blob_rw_");
  const body = emptyBody(tokenPresent, tokenPrefixFormat);
  if (!tokenPresent || !tokenPrefixFormat) return { status: 503, body };

  let store: SnapshotStore | null = null;
  let stored: { state: SnapshotStateV2; etag: string } | null = null;
  try {
    store = dependencies.createStore(env);
    stored = await store.read();
    body.state_read = stored === null ? "missing" : "ok";
  } catch {
    body.state_read = "error";
  }

  let pathname: string | null = null;
  try {
    pathname = `aurora/test/preview-diagnostic-${dependencies.randomId()}.json`;
    await dependencies.scratch.create(pathname, SCRATCH_BODY, token);
    body.scratch_create = "ok";

    const origin = await dependencies.scratch.originGet(pathname, SCRATCH_BODY, token);
    if (origin === null) {
      body.scratch_origin_get = "error";
    } else {
      body.scratch_origin_get = "ok";
      try {
        await dependencies.scratch.compareAndSwap(pathname, origin.etag, SCRATCH_BODY, token);
        body.scratch_cas = "ok";
      } catch {
        body.scratch_cas = "error";
      }
    }
  } catch {
    if (body.scratch_create === "skipped") {
      body.scratch_create = "error";
    } else if (body.scratch_origin_get === "skipped") {
      body.scratch_origin_get = "error";
    }
  } finally {
    if (pathname !== null) {
      try {
        await dependencies.scratch.remove(pathname, token);
        body.scratch_delete = "ok";
      } catch {
        body.scratch_delete = "error";
      }
    }
  }

  if (store !== null && stored !== null) {
    try {
      body.state_cas = await store.compareAndSwap(stored.etag, stored.state);
    } catch {
      body.state_cas = "error";
    }
  }

  const ok =
    body.state_read === "ok" &&
    body.scratch_create === "ok" &&
    body.scratch_origin_get === "ok" &&
    body.scratch_cas === "ok" &&
    body.scratch_delete === "ok" &&
    (body.state_cas === "written" || body.state_cas === "conflict");
  return { status: ok ? 200 : 503, body };
}
