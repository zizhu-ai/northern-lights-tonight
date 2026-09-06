import assert from "node:assert/strict";
import test from "node:test";

import {
  SNAPSHOT_STATE_SCHEMA_VERSION,
  createRemoteLkgSnapshotStore,
  createSnapshotStore,
  isRemoteLkgConfigured,
  type SnapshotStateV2,
  type SnapshotStore,
  type SnapshotStoreErrorCode,
// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
} from "./snapshot-store.ts";

const READ_TOKEN = "lkg_read_SENTINEL";
const WRITE_TOKEN = "lkg_write_SENTINEL";
const BASE_URL = "https://lkg.example.test";
const STATE_URL = "https://lkg.example.test/v1/state";
const BASE_TIME = Date.parse("2026-08-25T00:10:00.000Z");
const TEST_ENV = {
  NODE_ENV: "test",
  AURORA_LKG_BASE_URL: BASE_URL,
  AURORA_LKG_READ_TOKEN: READ_TOKEN,
  AURORA_LKG_WRITE_TOKEN: WRITE_TOKEN,
} satisfies NodeJS.ProcessEnv;

type HttpCall = { url: string; init: RequestInit };

type HttpOperations = {
  request(url: string, init: RequestInit): Promise<Response>;
};

const createRemoteWithFake = createRemoteLkgSnapshotStore as unknown as (
  env: NodeJS.ProcessEnv,
  operations: HttpOperations,
) => SnapshotStore;

function stateAt(checkedAtMs: number, revision = "revision-1"): SnapshotStateV2 {
  const checkedAt = new Date(checkedAtMs).toISOString();
  return {
    schema_version: SNAPSHOT_STATE_SCHEMA_VERSION,
    revision,
    checked_at: checkedAt,
    last_success_at: checkedAt,
    retry_after: null,
    envelopes: { schema_version: 1, ovation: null, kp: null, cloud: null },
    outcomes: {
      ovation: { status: "ok", checked_at: checkedAt, error_code: null },
      kp: { status: "ok", checked_at: checkedAt, error_code: null },
      cloud: { status: "ok", checked_at: checkedAt, error_code: null },
    },
    lease: null,
  };
}

function header(init: RequestInit, name: string): string | null {
  return new Headers(init.headers).get(name);
}

function jsonResponse(
  status: number,
  body: unknown,
  etag?: string,
): Response {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (etag !== undefined) headers.set("ETag", etag);
  return new Response(body === null ? null : JSON.stringify(body), { status, headers });
}

function errorCode(error: unknown): SnapshotStoreErrorCode | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    return (error as { code?: SnapshotStoreErrorCode }).code;
  }
  return undefined;
}

function assertErrorDoesNotExpose(error: unknown, forbidden: RegExp): void {
  assert.ok(error instanceof Error);
  const observableError = [error.name, error.message, error.stack ?? "", String(error)].join(
    "\n",
  );
  assert.doesNotMatch(observableError, forbidden);
}

test("remote LKG is configured only when base URL and both tokens are present", () => {
  assert.equal(isRemoteLkgConfigured({ NODE_ENV: "test" }), false);
  assert.equal(
    isRemoteLkgConfigured({ NODE_ENV: "test", AURORA_LKG_BASE_URL: BASE_URL }),
    false,
  );
  assert.equal(
    isRemoteLkgConfigured({
      NODE_ENV: "test",
      AURORA_LKG_BASE_URL: BASE_URL,
      AURORA_LKG_READ_TOKEN: READ_TOKEN,
    }),
    false,
  );
  assert.equal(isRemoteLkgConfigured(TEST_ENV), true);
  assert.equal(
    isRemoteLkgConfigured({
      ...TEST_ENV,
      AURORA_LKG_WRITE_TOKEN: "  ",
    }),
    false,
  );
});

test("createSnapshotStore keeps the Blob path when remote LKG env is unset", async () => {
  const store = createSnapshotStore({ NODE_ENV: "test" });
  await assert.rejects(() => store.read(), { message: "Snapshot store is not configured" });
});

test("createSnapshotStore rejects a partial remote LKG config instead of falling through to Blob", () => {
  assert.throws(
    () =>
      createSnapshotStore({
        NODE_ENV: "test",
        AURORA_LKG_BASE_URL: BASE_URL,
      }),
    { message: "Snapshot store is not configured" },
  );
});

test("createSnapshotStore uses GET /v1/state when remote LKG env is complete", async () => {
  const originalFetch = globalThis.fetch;
  const calls: HttpCall[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} });
    return new Response(null, { status: 404 });
  }) as typeof fetch;
  try {
    const store = createSnapshotStore({ ...TEST_ENV });
    assert.equal(await store.read(), null);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, STATE_URL);
    assert.equal(calls[0]?.init.method, "GET");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("GET 404 is a missing snapshot, not a store failure", async () => {
  const calls: HttpCall[] = [];
  const store = createRemoteWithFake(
    { ...TEST_ENV },
    {
      async request(url, init) {
        calls.push({ url, init });
        return new Response(null, { status: 404 });
      },
    },
  );
  assert.equal(await store.read(), null);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, STATE_URL);
  assert.equal(calls[0]?.init.method, "GET");
  assert.equal(header(calls[0]!.init, "Authorization"), `Bearer ${READ_TOKEN}`);
  assert.notEqual(header(calls[0]!.init, "Authorization"), `Bearer ${WRITE_TOKEN}`);
});

test("GET 401 is a sanitized unauthorized failure and does not expose the token", async () => {
  const store = createRemoteWithFake(
    { ...TEST_ENV },
    {
      async request() {
        return new Response(`denied ${READ_TOKEN}`, { status: 401 });
      },
    },
  );
  await assert.rejects(
    () => store.read(),
    (error: unknown) => {
      assert.equal(error instanceof Error && error.message, "Snapshot store read failed");
      assert.equal(errorCode(error), "remote_lkg_unauthorized");
      assertErrorDoesNotExpose(error, /lkg_read_SENTINEL|lkg_write_SENTINEL/);
      return true;
    },
  );
});

test("GET 503 is classified as remote_lkg_down without leaking the body", async () => {
  const store = createRemoteWithFake(
    { ...TEST_ENV },
    {
      async request() {
        return new Response(`upstream ${WRITE_TOKEN}`, { status: 503 });
      },
    },
  );
  await assert.rejects(
    () => store.read(),
    (error: unknown) => {
      assert.equal(error instanceof Error && error.message, "Snapshot store read failed");
      assert.equal(errorCode(error), "remote_lkg_down");
      assertErrorDoesNotExpose(error, /lkg_write_SENTINEL/);
      return true;
    },
  );
});

test("read returns validated state and a strong ETag", async () => {
  const current = stateAt(BASE_TIME, "current");
  const store = createRemoteWithFake(
    { ...TEST_ENV },
    {
      async request() {
        return jsonResponse(200, current, '"etag-origin"');
      },
    },
  );
  assert.deepEqual(await store.read(), { state: current, etag: '"etag-origin"' });
});

test("read normalizes a weak ETag before compare-and-swap", async () => {
  const calls: HttpCall[] = [];
  const current = stateAt(BASE_TIME, "current");
  const store = createRemoteWithFake(
    { ...TEST_ENV },
    {
      async request(url, init) {
        calls.push({ url, init });
        if (init.method === "GET") return jsonResponse(200, current, 'W/"etag-origin"');
        return new Response(null, { status: 204 });
      },
    },
  );
  const observed = await store.read();
  assert.ok(observed);
  assert.equal(observed.etag, '"etag-origin"');
  assert.equal(await store.compareAndSwap(observed.etag, current), "written");
  assert.equal(header(calls[1]!.init, "If-Match"), '"etag-origin"');
  assert.equal(header(calls[1]!.init, "If-None-Match"), null);
});

test("PUT 412 maps to conflict and does not reread", async () => {
  const calls: HttpCall[] = [];
  const store = createRemoteWithFake(
    { ...TEST_ENV },
    {
      async request(url, init) {
        calls.push({ url, init });
        return new Response("precondition failed", { status: 412 });
      },
    },
  );
  assert.equal(await store.compareAndSwap('"etag-expected"', stateAt(BASE_TIME)), "conflict");
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.init.method, "PUT");
  assert.equal(header(calls[0]!.init, "If-Match"), '"etag-expected"');
  assert.equal(header(calls[0]!.init, "Authorization"), `Bearer ${WRITE_TOKEN}`);
  assert.notEqual(header(calls[0]!.init, "Authorization"), `Bearer ${READ_TOKEN}`);
});

test("initial create sends If-None-Match * and treats 412 as conflict", async () => {
  const calls: HttpCall[] = [];
  const store = createRemoteWithFake(
    { ...TEST_ENV },
    {
      async request(url, init) {
        calls.push({ url, init });
        return new Response(null, { status: 412 });
      },
    },
  );
  assert.equal(await store.compareAndSwap(null, stateAt(BASE_TIME)), "conflict");
  assert.equal(header(calls[0]!.init, "If-None-Match"), "*");
  assert.equal(header(calls[0]!.init, "If-Match"), null);
});

test("PUT 401 is a sanitized write failure, not a CAS conflict", async () => {
  const calls: HttpCall[] = [];
  const store = createRemoteWithFake(
    { ...TEST_ENV },
    {
      async request(url, init) {
        calls.push({ url, init });
        return new Response(`denied ${WRITE_TOKEN}`, { status: 401 });
      },
    },
  );
  await assert.rejects(
    () => store.compareAndSwap('"etag-expected"', stateAt(BASE_TIME)),
    (error: unknown) => {
      assert.equal(error instanceof Error && error.message, "Snapshot store write failed");
      assert.equal(errorCode(error), "remote_lkg_unauthorized");
      assertErrorDoesNotExpose(error, /lkg_write_SENTINEL|lkg_read_SENTINEL/);
      return true;
    },
  );
  assert.equal(calls.length, 1);
});

test("existing ETag CAS writes on 204", async () => {
  const calls: HttpCall[] = [];
  const next = stateAt(BASE_TIME, "next");
  const store = createRemoteWithFake(
    { ...TEST_ENV },
    {
      async request(url, init) {
        calls.push({ url, init });
        return new Response(null, { status: 204 });
      },
    },
  );
  assert.equal(await store.compareAndSwap('"etag-origin"', next), "written");
  assert.equal(calls[0]?.url, STATE_URL);
  assert.equal(calls[0]?.init.method, "PUT");
  assert.equal(header(calls[0]!.init, "If-Match"), '"etag-origin"');
  assert.equal(header(calls[0]!.init, "Content-Type"), "application/json");
  assert.deepEqual(JSON.parse(String(calls[0]?.init.body)), next);
});

test("network failures are classified as remote_lkg_down and stay sanitized", async () => {
  const store = createRemoteWithFake(
    { ...TEST_ENV },
    {
      async request() {
        throw new TypeError(`fetch failed ${READ_TOKEN}`);
      },
    },
  );
  await assert.rejects(
    () => store.read(),
    (error: unknown) => {
      assert.equal(error instanceof Error && error.message, "Snapshot store read failed");
      assert.equal(errorCode(error), "remote_lkg_down");
      assertErrorDoesNotExpose(error, /lkg_read_SENTINEL/);
      return true;
    },
  );
});

test("ambiguous existing-write errors are conflict only when origin has a different ETag", async () => {
  const winner = stateAt(BASE_TIME, "winner");
  const store = createRemoteWithFake(
    { ...TEST_ENV },
    {
      async request(_url, init) {
        if (init.method === "PUT") throw new TypeError("fetch failed");
        return jsonResponse(200, winner, '"etag-winner"');
      },
    },
  );
  assert.equal(
    await store.compareAndSwap('"etag-expected"', stateAt(BASE_TIME, "loser")),
    "conflict",
  );
});

test("each remote write rebuilds its secret scan from the current tokens", async () => {
  const env: NodeJS.ProcessEnv = { ...TEST_ENV };
  let operationCalls = 0;
  const store = createRemoteWithFake(env, {
    async request() {
      operationCalls += 1;
      return new Response(null, { status: 204 });
    },
  });
  const leaked = stateAt(BASE_TIME);
  leaked.outcomes.cloud.error_code = `leak-${WRITE_TOKEN}`;
  await assert.rejects(
    () => store.compareAndSwap(null, leaked),
    { message: "Snapshot state contains a secret" },
  );
  const rotated = "lkg_write_ROTATED_SENTINEL";
  env.AURORA_LKG_WRITE_TOKEN = rotated;
  const rotatedLeak = stateAt(BASE_TIME);
  rotatedLeak.outcomes.kp.error_code = `leak-${rotated}`;
  await assert.rejects(
    () => store.compareAndSwap(null, rotatedLeak),
    (error: unknown) => {
      assert.equal(error instanceof Error && error.message, "Snapshot state contains a secret");
      assertErrorDoesNotExpose(error, /ROTATED_SENTINEL|lkg_write_SENTINEL|lkg_read_SENTINEL/);
      return true;
    },
  );
  assert.equal(operationCalls, 0);
});
