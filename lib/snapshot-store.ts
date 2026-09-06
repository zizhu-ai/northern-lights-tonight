import { BlobPreconditionFailedError, get, put } from "@vercel/blob";

import {
  isValidRawSourceEnvelopes,
  type RawSourceEnvelopes,
  type SourceName,
// Node's strip-types runner requires a runtime TypeScript import extension.
// @ts-ignore TS5097: Next's bundler resolves this source import without emitting it.
} from "./aurora-sources.ts";

export const SNAPSHOT_STATE_SCHEMA_VERSION = 2 as const;
export const CHECK_TTL_MS = 600_000;
export const NEGATIVE_RETRY_MS = 60_000;
export const LEASE_TTL_MS = 40_000;
export const REMOTE_LKG_MAX_BODY_BYTES = 256 * 1024;
export const REMOTE_LKG_TIMEOUT_MS = 8_000;

const SNAPSHOT_PATHNAME = "aurora/state/source-state-v2.json";
const REMOTE_LKG_STATE_PATH = "/v1/state";
const SOURCE_NAMES: readonly SourceName[] = ["ovation", "kp", "cloud"];
const REMOTE_LKG_USER_AGENT =
  "NorthernLightsTonight/1.0 (+https://aurora-tonight.com; aurora lkg)";

export type SnapshotStoreErrorCode =
  | "blob_suspended"
  | "remote_lkg_down"
  | "remote_lkg_unauthorized";

export type SourceOutcome = {
  status: "ok" | "error";
  checked_at: string;
  error_code: string | null;
};

export type SnapshotStateV2 = {
  schema_version: 2;
  revision: string;
  checked_at: string;
  last_success_at: string | null;
  retry_after: string | null;
  envelopes: RawSourceEnvelopes;
  outcomes: Record<SourceName, SourceOutcome>;
  lease: { owner: string; expires_at: string } | null;
};

export type StoredSnapshotState = { state: SnapshotStateV2; etag: string };

export interface SnapshotStore {
  read(): Promise<StoredSnapshotState | null>;
  compareAndSwap(
    expectedEtag: string | null,
    next: SnapshotStateV2,
  ): Promise<"written" | "conflict">;
}

export function isRemoteLkgConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env.AURORA_LKG_BASE_URL?.trim() &&
      env.AURORA_LKG_READ_TOKEN?.trim() &&
      env.AURORA_LKG_WRITE_TOKEN?.trim(),
  );
}

function hasPartialRemoteLkgConfig(env: NodeJS.ProcessEnv): boolean {
  const present = [
    env.AURORA_LKG_BASE_URL?.trim(),
    env.AURORA_LKG_READ_TOKEN?.trim(),
    env.AURORA_LKG_WRITE_TOKEN?.trim(),
  ].filter(Boolean).length;
  return present > 0 && present < 3;
}

function storeErrorCode(error: unknown): SnapshotStoreErrorCode | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (
      code === "blob_suspended" ||
      code === "remote_lkg_down" ||
      code === "remote_lkg_unauthorized"
    ) {
      return code;
    }
  }
  return undefined;
}

function normalizeStrongEtag(etag: string): string {
  return etag.startsWith("W/") ? etag.slice(2) : etag;
}

function isBlobSuspendedError(error: unknown): boolean {
  const text =
    error instanceof Error
      ? `${error.name}\n${error.message}\n${error.stack ?? ""}`
      : String(error);
  return /limits-exceeded-suspended|store has been disabled|blob[^.\n]*suspend/i.test(
    text,
  );
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

const isNullableIsoDate = (value: unknown): value is string | null =>
  value === null || isIsoDate(value);

function isValidSourceOutcome(value: unknown): value is SourceOutcome {
  return (
    isObject(value) &&
    (value.status === "ok" || value.status === "error") &&
    isIsoDate(value.checked_at) &&
    (value.error_code === null || typeof value.error_code === "string")
  );
}

function isValidSnapshotState(value: unknown): value is SnapshotStateV2 {
  if (
    !isObject(value) ||
    value.schema_version !== SNAPSHOT_STATE_SCHEMA_VERSION ||
    typeof value.revision !== "string" ||
    value.revision.length === 0 ||
    !isIsoDate(value.checked_at) ||
    !isNullableIsoDate(value.last_success_at) ||
    !isNullableIsoDate(value.retry_after) ||
    !isValidRawSourceEnvelopes(value.envelopes) ||
    !isObject(value.outcomes)
  ) {
    return false;
  }
  const outcomes = value.outcomes;
  if (!SOURCE_NAMES.every((name) => isValidSourceOutcome(outcomes[name]))) {
    return false;
  }
  if (value.lease === null) return true;
  return (
    isObject(value.lease) &&
    typeof value.lease.owner === "string" &&
    value.lease.owner.length > 0 &&
    isIsoDate(value.lease.expires_at)
  );
}

const allSourcesNegative = (state: SnapshotStateV2): boolean =>
  SOURCE_NAMES.every((name) => state.outcomes[name].status === "error");

export function isCheckFresh(state: SnapshotStateV2, now: Date): boolean {
  const nowMs = now.getTime();
  const checkedAtMs = Date.parse(state.checked_at);
  if (!Number.isFinite(nowMs) || !Number.isFinite(checkedAtMs) || checkedAtMs > nowMs) {
    return false;
  }
  const dueMs = allSourcesNegative(state)
    ? state.retry_after === null
      ? Number.NaN
      : Date.parse(state.retry_after)
    : checkedAtMs + CHECK_TTL_MS;
  return Number.isFinite(dueMs) && nowMs < dueMs;
}

export function canAcquireLease(state: SnapshotStateV2 | null, now: Date): boolean {
  if (state?.lease === null || state === null) return true;
  const nowMs = now.getTime();
  const expiresAtMs = Date.parse(state.lease.expires_at);
  return Number.isFinite(nowMs) && Number.isFinite(expiresAtMs) && nowMs >= expiresAtMs;
}

export function stateContainsAnySecret(
  state: SnapshotStateV2,
  secrets: readonly string[],
): boolean {
  const serialized = JSON.stringify(state);
  return secrets.some((secret) => {
    if (secret.length === 0) return false;
    const escapedSecret = JSON.stringify(secret).slice(1, -1);
    return serialized.includes(secret) || serialized.includes(escapedSecret);
  });
}

type PersistenceContext = { token: string; secrets: readonly string[] };

function resolvePersistenceContext(env: NodeJS.ProcessEnv): PersistenceContext {
  const token = env.AURORA_STATE_BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error("Snapshot store is not configured");
  const weatherKey = env.OPEN_METEO_API_KEY?.trim();
  return { token, secrets: weatherKey ? [token, weatherKey] : [token] };
}

function assertSafeState(state: SnapshotStateV2, secrets: readonly string[]): void {
  if (stateContainsAnySecret(state, secrets)) {
    throw new Error("Snapshot state contains a secret");
  }
  if (!isValidSnapshotState(state)) throw new Error("Snapshot state validation failed");
}

function sanitizedReadError(code?: SnapshotStoreErrorCode): Error {
  const error = new Error("Snapshot store read failed");
  if (code) Object.assign(error, { code });
  return error;
}

function sanitizedWriteError(code?: SnapshotStoreErrorCode): Error {
  const error = new Error("Snapshot store write failed");
  if (code) Object.assign(error, { code });
  return error;
}

function classifyBlobFailure(error: unknown): SnapshotStoreErrorCode | undefined {
  return isBlobSuspendedError(error) ? "blob_suspended" : undefined;
}

function classifyRemoteStatus(status: number): SnapshotStoreErrorCode | undefined {
  if (status === 401 || status === 403) return "remote_lkg_unauthorized";
  if (status >= 500 || status === 429) return "remote_lkg_down";
  return undefined;
}

function classifyRemoteNetworkFailure(error: unknown): SnapshotStoreErrorCode | undefined {
  const existing = storeErrorCode(error);
  if (existing) return existing;
  if (error instanceof TypeError) return "remote_lkg_down";
  if (
    error instanceof Error &&
    (error.name === "AbortError" ||
      /timeout|aborted|fetch failed|network/i.test(error.message))
  ) {
    return "remote_lkg_down";
  }
  return undefined;
}

function rethrowIfSanitizedStoreError(error: unknown, fallback: Error): never {
  if (
    error instanceof Error &&
    (error.message === "Snapshot store read failed" ||
      error.message === "Snapshot store write failed" ||
      error.message === "Snapshot store is not configured" ||
      error.message === "Snapshot state contains a secret")
  ) {
    throw error;
  }
  throw fallback;
}

type BlobOperations = {
  read(
    pathname: string,
    options: { access: "private"; token: string; useCache: false },
  ): Promise<{ stream: ReadableStream; etag: string } | null>;
  write(
    pathname: string,
    body: string,
    options: {
      access: "private";
      token: string;
      addRandomSuffix: false;
      contentType: "application/json";
      allowOverwrite?: false;
      ifMatch?: string;
    },
  ): Promise<void>;
};

const vercelBlobOperations: BlobOperations = {
  async read(pathname, options) {
    const result = await get(pathname, options);
    if (result === null) return null;
    if (result.stream === null) throw new Error("Blob response stream is missing");
    return { stream: result.stream, etag: result.blob.etag };
  },
  async write(pathname, body, options) {
    await put(pathname, body, options);
  },
};

export function createVercelSnapshotStore(env?: NodeJS.ProcessEnv): SnapshotStore;
export function createVercelSnapshotStore(
  env: NodeJS.ProcessEnv = process.env,
  operations: BlobOperations = vercelBlobOperations,
): SnapshotStore {
  const read = async (): Promise<StoredSnapshotState | null> => {
    const { token, secrets } = resolvePersistenceContext(env);
    try {
      const result = await operations.read(SNAPSHOT_PATHNAME, {
        access: "private",
        token,
        useCache: false,
      });
      if (result === null) return null;
      const parsed: unknown = await new Response(result.stream).json();
      // Large private Blob reads may return weak validators, but Blob ifMatch requires the strong form.
      const etag = normalizeStrongEtag(result.etag);
      if (!isValidSnapshotState(parsed) || etag.length === 0) {
        throw sanitizedReadError();
      }
      assertSafeState(parsed, secrets);
      return { state: parsed, etag };
    } catch (error) {
      throw sanitizedReadError(classifyBlobFailure(error));
    }
  };

  return {
    read,
    async compareAndSwap(expectedEtag, next) {
      const { token, secrets } = resolvePersistenceContext(env);
      assertSafeState(next, secrets);
      try {
        await operations.write(SNAPSHOT_PATHNAME, JSON.stringify(next), {
          access: "private",
          token,
          addRandomSuffix: false,
          contentType: "application/json",
          ...(expectedEtag === null
            ? { allowOverwrite: false }
            : { ifMatch: expectedEtag }),
        });
        return "written";
      } catch (error) {
        if (expectedEtag !== null) {
          if (error instanceof BlobPreconditionFailedError) return "conflict";
          try {
            const observed = await read();
            if (observed !== null && observed.etag !== expectedEtag) return "conflict";
          } catch {
            // An ambiguous write is a conflict only when a valid reread proves a new winner.
          }
          throw sanitizedWriteError(classifyBlobFailure(error));
        }
        try {
          if ((await read()) !== null) return "conflict";
          throw sanitizedWriteError(classifyBlobFailure(error));
        } catch {
          throw sanitizedWriteError(classifyBlobFailure(error));
        }
      }
    },
  };
}

type RemoteLkgContext = {
  stateUrl: string;
  readToken: string;
  writeToken: string;
  secrets: readonly string[];
};

function resolveRemoteLkgContext(env: NodeJS.ProcessEnv): RemoteLkgContext {
  const baseUrl = env.AURORA_LKG_BASE_URL?.trim();
  const readToken = env.AURORA_LKG_READ_TOKEN?.trim();
  const writeToken = env.AURORA_LKG_WRITE_TOKEN?.trim();
  if (!baseUrl || !readToken || !writeToken) {
    throw new Error("Snapshot store is not configured");
  }
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error("Snapshot store is not configured");
  }
  if (
    (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
    parsed.username !== "" ||
    parsed.password !== ""
  ) {
    throw new Error("Snapshot store is not configured");
  }
  const originAndPath = `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/$/, "")}`;
  const weatherKey = env.OPEN_METEO_API_KEY?.trim();
  const blobToken = env.AURORA_STATE_BLOB_READ_WRITE_TOKEN?.trim();
  const secrets = [readToken, writeToken];
  if (blobToken) secrets.push(blobToken);
  if (weatherKey) secrets.push(weatherKey);
  return {
    stateUrl: `${originAndPath}${REMOTE_LKG_STATE_PATH}`,
    readToken,
    writeToken,
    secrets,
  };
}

type HttpOperations = {
  request(url: string, init: RequestInit): Promise<Response>;
};

const remoteLkgHttpOperations: HttpOperations = {
  async request(url, init) {
    return globalThis.fetch(url, {
      ...init,
      cache: "no-store",
      redirect: "error",
      signal: init.signal ?? AbortSignal.timeout(REMOTE_LKG_TIMEOUT_MS),
    });
  },
};

function remoteHeaders(token: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");
  headers.set("User-Agent", REMOTE_LKG_USER_AGENT);
  return headers;
}

async function consumeBody(response: Response): Promise<void> {
  try {
    await response.arrayBuffer();
  } catch {
    // Drain failures must not mask the HTTP status already observed.
  }
}

export function createRemoteLkgSnapshotStore(env?: NodeJS.ProcessEnv): SnapshotStore;
export function createRemoteLkgSnapshotStore(
  env: NodeJS.ProcessEnv = process.env,
  operations: HttpOperations = remoteLkgHttpOperations,
): SnapshotStore {
  const read = async (): Promise<StoredSnapshotState | null> => {
    const { stateUrl, readToken, secrets } = resolveRemoteLkgContext(env);
    try {
      const response = await operations.request(stateUrl, {
        method: "GET",
        headers: remoteHeaders(readToken),
      });
      if (response.status === 404) {
        await consumeBody(response);
        return null;
      }
      if (response.status === 401 || response.status === 403) {
        await consumeBody(response);
        throw sanitizedReadError("remote_lkg_unauthorized");
      }
      if (!response.ok) {
        await consumeBody(response);
        throw sanitizedReadError(classifyRemoteStatus(response.status));
      }
      const declaredLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(declaredLength) && declaredLength > REMOTE_LKG_MAX_BODY_BYTES) {
        await consumeBody(response);
        throw sanitizedReadError();
      }
      const text = await response.text();
      if (utf8ByteLength(text) > REMOTE_LKG_MAX_BODY_BYTES) {
        throw sanitizedReadError();
      }
      const parsed: unknown = JSON.parse(text) as unknown;
      const etag = normalizeStrongEtag((response.headers.get("etag") ?? "").trim());
      if (!isValidSnapshotState(parsed) || etag.length === 0) {
        throw sanitizedReadError();
      }
      assertSafeState(parsed, secrets);
      return { state: parsed, etag };
    } catch (error) {
      rethrowIfSanitizedStoreError(
        error,
        sanitizedReadError(classifyRemoteNetworkFailure(error)),
      );
    }
  };

  return {
    read,
    async compareAndSwap(expectedEtag, next) {
      const { stateUrl, writeToken, secrets } = resolveRemoteLkgContext(env);
      assertSafeState(next, secrets);
      const body = JSON.stringify(next);
      if (utf8ByteLength(body) > REMOTE_LKG_MAX_BODY_BYTES) {
        throw sanitizedWriteError();
      }
      const headers = remoteHeaders(writeToken, {
        "Content-Type": "application/json",
      });
      if (expectedEtag === null) {
        headers.set("If-None-Match", "*");
      } else {
        headers.set("If-Match", expectedEtag);
      }
      try {
        const response = await operations.request(stateUrl, {
          method: "PUT",
          headers,
          body,
        });
        if (response.status === 412) {
          await consumeBody(response);
          return "conflict";
        }
        if (response.status === 401 || response.status === 403) {
          await consumeBody(response);
          throw sanitizedWriteError("remote_lkg_unauthorized");
        }
        if (!response.ok) {
          await consumeBody(response);
          throw sanitizedWriteError(classifyRemoteStatus(response.status));
        }
        await consumeBody(response);
        return "written";
      } catch (error) {
        if (error instanceof Error && error.message === "Snapshot store write failed") {
          throw error;
        }
        if (expectedEtag !== null) {
          try {
            const observed = await read();
            if (observed !== null && observed.etag !== expectedEtag) return "conflict";
          } catch {
            // An ambiguous write is a conflict only when a valid reread proves a new winner.
          }
          rethrowIfSanitizedStoreError(
            error,
            sanitizedWriteError(classifyRemoteNetworkFailure(error)),
          );
        }
        try {
          if ((await read()) !== null) return "conflict";
          rethrowIfSanitizedStoreError(
            error,
            sanitizedWriteError(classifyRemoteNetworkFailure(error)),
          );
        } catch (rereadError) {
          if (
            rereadError instanceof Error &&
            rereadError.message === "Snapshot store write failed"
          ) {
            throw rereadError;
          }
          throw sanitizedWriteError(classifyRemoteNetworkFailure(error));
        }
      }
    },
  };
}

export function createSnapshotStore(env: NodeJS.ProcessEnv = process.env): SnapshotStore {
  if (hasPartialRemoteLkgConfig(env)) {
    throw new Error("Snapshot store is not configured");
  }
  if (isRemoteLkgConfigured(env)) {
    return createRemoteLkgSnapshotStore(env);
  }
  return createVercelSnapshotStore(env);
}
