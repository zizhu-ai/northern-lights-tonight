import assert from "node:assert/strict";
import test from "node:test";
import { BlobPreconditionFailedError } from "@vercel/blob";

import {
  CHECK_TTL_MS,
  LEASE_TTL_MS,
  NEGATIVE_RETRY_MS,
  SNAPSHOT_STATE_SCHEMA_VERSION,
  canAcquireLease,
  createVercelSnapshotStore,
  isCheckFresh,
  stateContainsAnySecret,
// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
} from "./snapshot-store.ts";
import type {
  SnapshotStateV2,
  SnapshotStore,
  StoredSnapshotState,
// @ts-ignore TS5097: see the strip-types runner note above.
} from "./snapshot-store.ts";

const TOKEN = "vercel_blob_rw_teststore_BLOB_TOKEN_SENTINEL";
const WEATHER_KEY = "WEATHER_KEY_SENTINEL";
const PATHNAME = "aurora/state/source-state-v2.json";
const BASE_TIME = Date.parse("2026-08-25T00:10:00.000Z");
const TEST_ENV = {
  NODE_ENV: "test",
  AURORA_STATE_BLOB_READ_WRITE_TOKEN: TOKEN,
} satisfies NodeJS.ProcessEnv;

type FakeBlobOperations = {
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

const createStoreWithFake = createVercelSnapshotStore as unknown as (
  env: NodeJS.ProcessEnv,
  operations: FakeBlobOperations,
) => SnapshotStore;

function stateAt(
  checkedAtMs: number,
  options: {
    revision?: string;
    allNegative?: boolean;
    retryAfterMs?: number | null;
    lease?: SnapshotStateV2["lease"];
  } = {},
): SnapshotStateV2 {
  const allNegative = options.allNegative ?? false;
  const checkedAt = new Date(checkedAtMs).toISOString();
  return {
    schema_version: SNAPSHOT_STATE_SCHEMA_VERSION,
    revision: options.revision ?? "revision-1",
    checked_at: checkedAt,
    last_success_at: allNegative ? null : checkedAt,
    retry_after:
      options.retryAfterMs === undefined
        ? null
        : options.retryAfterMs === null
          ? null
          : new Date(options.retryAfterMs).toISOString(),
    envelopes: { schema_version: 1, ovation: null, kp: null, cloud: null },
    outcomes: {
      ovation: {
        status: allNegative ? "error" : "ok",
        checked_at: checkedAt,
        error_code: allNegative ? "unavailable" : null,
      },
      kp: {
        status: allNegative ? "error" : "ok",
        checked_at: checkedAt,
        error_code: allNegative ? "unavailable" : null,
      },
      cloud: {
        status: allNegative ? "error" : "ok",
        checked_at: checkedAt,
        error_code: allNegative ? "unavailable" : null,
      },
    },
    lease: options.lease ?? null,
  };
}

class FakeSnapshotStore implements SnapshotStore {
  private current: StoredSnapshotState | null;
  private etagSequence = 0;

  constructor(initial: StoredSnapshotState | null = null) {
    this.current = initial;
  }

  async read(): Promise<StoredSnapshotState | null> {
    return this.current === null ? null : structuredClone(this.current);
  }

  async compareAndSwap(
    expectedEtag: string | null,
    next: SnapshotStateV2,
  ): Promise<"written" | "conflict"> {
    if ((this.current?.etag ?? null) !== expectedEtag) return "conflict";
    this.etagSequence += 1;
    this.current = {
      state: structuredClone(next),
      etag: `fake-etag-${this.etagSequence}`,
    };
    return "written";
  }
}

function storedBlob(state: SnapshotStateV2, etag = "etag-origin") {
  const stream = new Response(JSON.stringify(state)).body;
  assert.ok(stream);
  return { stream, etag };
}

function assertErrorDoesNotExpose(error: unknown, forbidden: RegExp): void {
  assert.ok(error instanceof Error);
  const observableError = [error.name, error.message, error.stack ?? "", String(error)].join("\n");
  assert.doesNotMatch(observableError, forbidden);
}

test("hard TTL is fresh at 599 seconds and stale at 600 and 601 seconds", () => {
  const state = stateAt(BASE_TIME - CHECK_TTL_MS);
  assert.equal(isCheckFresh(state, new Date(BASE_TIME - 1_000)), true);
  assert.equal(isCheckFresh(state, new Date(BASE_TIME)), false);
  assert.equal(isCheckFresh(state, new Date(BASE_TIME + 1_000)), false);
});

test("all-source-negative retry is fresh at 59 seconds and stale at 60 and 61 seconds", () => {
  const checkedAt = BASE_TIME - NEGATIVE_RETRY_MS;
  const state = stateAt(checkedAt, {
    allNegative: true,
    retryAfterMs: checkedAt + NEGATIVE_RETRY_MS,
  });
  assert.equal(isCheckFresh(state, new Date(BASE_TIME - 1_000)), true);
  assert.equal(isCheckFresh(state, new Date(BASE_TIME)), false);
  assert.equal(isCheckFresh(state, new Date(BASE_TIME + 1_000)), false);
});

test("a future checked_at clock is never treated as fresh", () => {
  const state = stateAt(BASE_TIME + 1, {
    allNegative: true,
    retryAfterMs: BASE_TIME + NEGATIVE_RETRY_MS,
  });
  assert.equal(isCheckFresh(state, new Date(BASE_TIME)), false);
});

test("lease acquisition allows absent and expired leases but rejects a live lease", () => {
  assert.equal(canAcquireLease(null, new Date(BASE_TIME)), true);
  assert.equal(canAcquireLease(stateAt(BASE_TIME), new Date(BASE_TIME)), true);
  assert.equal(
    canAcquireLease(
      stateAt(BASE_TIME, {
        lease: { owner: "worker-a", expires_at: new Date(BASE_TIME + LEASE_TTL_MS).toISOString() },
      }),
      new Date(BASE_TIME),
    ),
    false,
  );
  assert.equal(
    canAcquireLease(
      stateAt(BASE_TIME, {
        lease: { owner: "worker-a", expires_at: new Date(BASE_TIME).toISOString() },
      }),
      new Date(BASE_TIME),
    ),
    true,
  );
});

test("secret scan checks every supplied non-empty secret", () => {
  const state = stateAt(BASE_TIME);
  state.outcomes.cloud.error_code = `prefix-${WEATHER_KEY}-suffix`;
  assert.equal(stateContainsAnySecret(state, ["", TOKEN, WEATHER_KEY]), true);
  assert.equal(stateContainsAnySecret(stateAt(BASE_TIME), [TOKEN, WEATHER_KEY]), false);
});

test("secret scan detects quote, backslash, and control-character secrets after JSON escaping", () => {
  const secrets = [
    'QUOTE_"_SENTINEL',
    "BACKSLASH_\\_SENTINEL",
    "CONTROL_\n\t_SENTINEL",
  ];
  for (const secret of secrets) {
    const state = stateAt(BASE_TIME);
    state.outcomes.cloud.error_code = `prefix-${secret}-suffix`;
    assert.equal(stateContainsAnySecret(state, [secret]), true, JSON.stringify(secret));
  }
});

test("fake store enforces initial create-only and existing ETag CAS semantics", async () => {
  const store = new FakeSnapshotStore();
  const first = stateAt(BASE_TIME, { revision: "first" });
  const loser = stateAt(BASE_TIME, { revision: "loser" });
  assert.equal(await store.compareAndSwap(null, first), "written");
  assert.equal(await store.compareAndSwap(null, loser), "conflict");
  const observed = await store.read();
  assert.ok(observed);
  assert.equal(await store.compareAndSwap("wrong-etag", loser), "conflict");
  assert.equal(await store.compareAndSwap(observed.etag, loser), "written");
});

test("an expired-lease takeover prevents the late original writer from publishing", async () => {
  const leased = stateAt(BASE_TIME, {
    revision: "leased-by-a",
    lease: { owner: "worker-a", expires_at: new Date(BASE_TIME + LEASE_TTL_MS).toISOString() },
  });
  const store = new FakeSnapshotStore({ state: leased, etag: "lease-a-etag" });
  const takeoverRead = await store.read();
  assert.ok(takeoverRead);
  const takeoverNow = BASE_TIME + LEASE_TTL_MS;
  assert.equal(canAcquireLease(takeoverRead.state, new Date(takeoverNow)), true);
  const leaseB = stateAt(takeoverNow, {
    revision: "leased-by-b",
    lease: { owner: "worker-b", expires_at: new Date(takeoverNow + LEASE_TTL_MS).toISOString() },
  });
  assert.equal(await store.compareAndSwap(takeoverRead.etag, leaseB), "written");
  const winnerRead = await store.read();
  assert.ok(winnerRead);
  const lateA = stateAt(takeoverNow, { revision: "late-a" });
  assert.equal(await store.compareAndSwap("lease-a-etag", lateA), "conflict");
  const winner = await store.read();
  assert.equal(winner?.state.revision, "leased-by-b");
});

test("read uses the private fixed path, bypasses cache, and rejects invalid runtime schema", async () => {
  const reads: Array<{ pathname: string; options: unknown }> = [];
  const invalid = { ...stateAt(BASE_TIME), schema_version: 1 };
  const store = createStoreWithFake(
    { ...TEST_ENV },
    {
      async read(pathname, options) {
        reads.push({ pathname, options });
        return storedBlob(invalid as unknown as SnapshotStateV2);
      },
      async write() {
        throw new Error("not used");
      },
    },
  );
  await assert.rejects(
    () => store.read(),
    (error: unknown) => {
      assert.equal(error instanceof Error && error.message, "Snapshot store read failed");
      assertErrorDoesNotExpose(error, /BLOB_TOKEN_SENTINEL/);
      return true;
    },
  );
  assert.deepEqual(reads, [
    {
      pathname: PATHNAME,
      options: { access: "private", token: TOKEN, useCache: false },
    },
  ]);
});

test("runtime validation accepts the declared nullable error_code contract", async () => {
  const valid = stateAt(BASE_TIME, { allNegative: true, retryAfterMs: BASE_TIME + 1 });
  valid.outcomes.ovation.error_code = null;
  valid.outcomes.kp.error_code = null;
  valid.outcomes.cloud.error_code = null;
  const store = createStoreWithFake(
    { ...TEST_ENV },
    {
      async read() {
        return storedBlob(valid);
      },
      async write() {
        throw new Error("not used");
      },
    },
  );
  assert.deepEqual((await store.read())?.state, valid);
});

test("existing writes use fixed-path ifMatch and map the SDK precondition error to conflict", async () => {
  const writes: Array<{ pathname: string; body: string; options: Record<string, unknown> }> = [];
  const store = createStoreWithFake(
    { ...TEST_ENV },
    {
      async read() {
        throw new Error("not used");
      },
      async write(pathname, body, options) {
        writes.push({ pathname, body, options });
        throw new BlobPreconditionFailedError();
      },
    },
  );
  const result = await store.compareAndSwap("etag-expected", stateAt(BASE_TIME));
  assert.equal(result, "conflict");
  assert.equal(writes.length, 1);
  assert.equal(writes[0]?.pathname, PATHNAME);
  assert.equal(writes[0]?.options.ifMatch, "etag-expected");
  assert.equal(writes[0]?.options.allowOverwrite, undefined);
  assert.equal(writes[0]?.options.addRandomSuffix, false);
  assert.equal(writes[0]?.options.access, "private");
});

test("an ambiguous existing-write error is a conflict only when origin has a different ETag", async () => {
  class BlobError extends Error {}
  let reads = 0;
  const winner = stateAt(BASE_TIME, { revision: "winner" });
  const store = createStoreWithFake(
    { ...TEST_ENV },
    {
      async read() {
        reads += 1;
        return storedBlob(winner, "etag-winner");
      },
      async write() {
        throw new BlobError("opaque Blob failure");
      },
    },
  );

  assert.equal(
    await store.compareAndSwap("etag-expected", stateAt(BASE_TIME, { revision: "loser" })),
    "conflict",
  );
  assert.equal(reads, 1);
});

test("ambiguous existing-write errors stay sanitized unless reread proves a changed ETag", async () => {
  const invalid = { ...stateAt(BASE_TIME), schema_version: 1 } as unknown as SnapshotStateV2;
  const cases: Array<{
    label: string;
    read: () => Promise<{ stream: ReadableStream; etag: string } | null>;
  }> = [
    {
      label: "missing origin",
      read: async () => null,
    },
    {
      label: "unchanged ETag",
      read: async () => storedBlob(stateAt(BASE_TIME), "etag-expected"),
    },
    {
      label: "invalid origin",
      read: async () => storedBlob(invalid, "etag-winner"),
    },
    {
      label: "failed reread",
      read: async () => {
        throw new Error(`origin failure ${TOKEN}`);
      },
    },
  ];

  for (const { label, read } of cases) {
    let reads = 0;
    const store = createStoreWithFake(
      { ...TEST_ENV },
      {
        async read() {
          reads += 1;
          return read();
        },
        async write() {
          throw new Error(`ambiguous write failure ${TOKEN}`);
        },
      },
    );

    await assert.rejects(
      () => store.compareAndSwap("etag-expected", stateAt(BASE_TIME)),
      (error: unknown) => {
        assert.equal(error instanceof Error && error.message, "Snapshot store write failed", label);
        assertErrorDoesNotExpose(error, /BLOB_TOKEN_SENTINEL/);
        return true;
      },
    );
    assert.equal(reads, 1, label);
  }
});

test("initial create uses non-overwriting fixed-path semantics", async () => {
  const writes: Array<{ pathname: string; options: Record<string, unknown> }> = [];
  const store = createStoreWithFake(
    { ...TEST_ENV },
    {
      async read() {
        throw new Error("not used");
      },
      async write(pathname, _body, options) {
        writes.push({ pathname, options });
      },
    },
  );
  assert.equal(
    await store.compareAndSwap(null, stateAt(BASE_TIME)),
    "written",
  );
  assert.equal(writes[0]?.pathname, PATHNAME);
  assert.equal(writes[0]?.options.ifMatch, undefined);
  assert.equal(writes[0]?.options.allowOverwrite, false);
  assert.equal(writes[0]?.options.addRandomSuffix, false);
});

test("ambiguous initial-create errors reread origin and return conflict only for a valid winner", async () => {
  let reads = 0;
  let writes = 0;
  const winner = stateAt(BASE_TIME, { revision: "winner" });
  const store = createStoreWithFake(
    { ...TEST_ENV },
    {
      async read() {
        reads += 1;
        return storedBlob(winner, "winner-etag");
      },
      async write() {
        writes += 1;
        throw new Error("not a conflict-looking message");
      },
    },
  );
  const result = await store.compareAndSwap(null, stateAt(BASE_TIME, { revision: "loser" }));
  assert.equal(result, "conflict");
  assert.equal(writes, 1);
  assert.equal(reads, 1);
});

test("ambiguous initial-create errors are sanitized when the origin has no valid winner", async () => {
  const store = createStoreWithFake(
    { ...TEST_ENV },
    {
      async read() {
        return null;
      },
      async write() {
        throw new TypeError(`network ${TOKEN}`);
      },
    },
  );
  await assert.rejects(
    () => store.compareAndSwap(null, stateAt(BASE_TIME)),
    (error: unknown) => {
      assert.equal(error instanceof Error && error.message, "Snapshot store write failed");
      assertErrorDoesNotExpose(error, /BLOB_TOKEN_SENTINEL/);
      return true;
    },
  );
});

test("every persistence call requires a current non-empty token", async () => {
  const env: NodeJS.ProcessEnv = { ...TEST_ENV };
  let operationCalls = 0;
  const store = createStoreWithFake(env, {
    async read() {
      operationCalls += 1;
      return null;
    },
    async write() {
      operationCalls += 1;
    },
  });
  env.AURORA_STATE_BLOB_READ_WRITE_TOKEN = "   ";
  await assert.rejects(
    () => store.read(),
    { message: "Snapshot store is not configured" },
  );
  assert.equal(operationCalls, 0);
});

test("each write rebuilds its guard from the current Blob token and optional weather key", async () => {
  const env: NodeJS.ProcessEnv = {
    NODE_ENV: "test",
    AURORA_STATE_BLOB_READ_WRITE_TOKEN: TOKEN,
    OPEN_METEO_API_KEY: WEATHER_KEY,
  };
  let operationCalls = 0;
  const store = createStoreWithFake(env, {
    async read() {
      operationCalls += 1;
      return null;
    },
    async write() {
      operationCalls += 1;
    },
  });
  const weatherLeak = stateAt(BASE_TIME);
  weatherLeak.outcomes.cloud.error_code = `leak-${WEATHER_KEY}`;
  await assert.rejects(
    () => store.compareAndSwap(null, weatherLeak),
    { message: "Snapshot state contains a secret" },
  );
  const rotatedToken = "vercel_blob_rw_teststore_ROTATED_TOKEN_SENTINEL";
  env.AURORA_STATE_BLOB_READ_WRITE_TOKEN = rotatedToken;
  const tokenLeak = stateAt(BASE_TIME);
  tokenLeak.outcomes.kp.error_code = `leak-${rotatedToken}`;
  await assert.rejects(
    () => store.compareAndSwap(null, tokenLeak),
    (error: unknown) => {
      assert.equal(error instanceof Error && error.message, "Snapshot state contains a secret");
      assertErrorDoesNotExpose(error, /ROTATED_TOKEN_SENTINEL|WEATHER_KEY_SENTINEL/);
      return true;
    },
  );
  assert.equal(operationCalls, 0);
});
