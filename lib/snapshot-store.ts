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

const SNAPSHOT_PATHNAME = "aurora/state/source-state-v2.json";
const SOURCE_NAMES: readonly SourceName[] = ["ovation", "kp", "cloud"];

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

function sanitizedReadError(): Error {
  return new Error("Snapshot store read failed");
}

function sanitizedWriteError(): Error {
  return new Error("Snapshot store write failed");
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
      if (!isValidSnapshotState(parsed) || result.etag.length === 0) {
        throw sanitizedReadError();
      }
      assertSafeState(parsed, secrets);
      return { state: parsed, etag: result.etag };
    } catch {
      throw sanitizedReadError();
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
          throw sanitizedWriteError();
        }
        try {
          if ((await read()) !== null) return "conflict";
          throw sanitizedWriteError();
        } catch {
          throw sanitizedWriteError();
        }
      }
    },
  };
}
