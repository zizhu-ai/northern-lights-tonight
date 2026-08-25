import assert from "node:assert/strict";
import test from "node:test";

import type {
  SnapshotStateV2,
  SnapshotStore,
// @ts-ignore TS5097: Node's strip-types runner requires the explicit extension.
} from "./snapshot-store.ts";

const TOKEN = "vercel_blob_rw_PREVIEW_DIAGNOSTIC_SECRET_SENTINEL";
const ETAG = "PRIVATE_ETAG_SENTINEL";
const SCRATCH_PATH = "aurora/test/preview-diagnostic-fixed-test-id.json";
const RAW_ERROR = "RAW_ERROR_MESSAGE_MUST_NOT_LEAK";

// @ts-ignore TS5097: Node's strip-types runner requires the explicit extension.
const loadDiagnostic = () => import("./preview-blob-diagnostic.ts");

const state = { schema_version: 2, owner: "OWNER_MUST_NOT_LEAK" } as unknown as SnapshotStateV2;

type StoreBehavior = {
  read?: () => ReturnType<SnapshotStore["read"]>;
  compareAndSwap?: SnapshotStore["compareAndSwap"];
};

function fakeStore(behavior: StoreBehavior = {}): SnapshotStore {
  return {
    read: behavior.read ?? (async () => ({ state, etag: ETAG })),
    compareAndSwap: behavior.compareAndSwap ?? (async () => "written"),
  };
}

function assertSafeOutput(value: unknown): void {
  const expectedKeys = [
    "scratch_cas",
    "scratch_create",
    "scratch_delete",
    "scratch_origin_get",
    "state_cas",
    "state_read",
    "token_prefix_format",
    "token_present",
  ];
  assert.deepEqual(Object.keys(value as object).sort(), expectedKeys);
  const serialized = JSON.stringify(value);
  assert.doesNotMatch(
    serialized,
    /PREVIEW_DIAGNOSTIC_SECRET_SENTINEL|PRIVATE_ETAG_SENTINEL|OWNER_MUST_NOT_LEAK|RAW_ERROR_MESSAGE_MUST_NOT_LEAK|aurora\/test|source-state|https?:\/\//,
  );
  assert.doesNotMatch(serialized, /token_(?:length|value)|etag|owner|payload|pathname|url|message|stack/i);
}

function dependencies(overrides: Record<string, unknown> = {}) {
  const calls: string[] = [];
  return {
    calls,
    deps: {
      randomId: () => "fixed-test-id",
      createStore: () => fakeStore(),
      scratch: {
        async create(pathname: string) {
          calls.push(`create:${pathname}`);
        },
        async originGet(pathname: string) {
          calls.push(`get:${pathname}`);
          return { etag: ETAG };
        },
        async compareAndSwap(pathname: string) {
          calls.push(`cas:${pathname}`);
        },
        async remove(pathname: string) {
          calls.push(`delete:${pathname}`);
        },
      },
      ...overrides,
    },
  };
}

test("environment gate recognizes Preview only", async () => {
  const { isPreviewEnvironment } = await loadDiagnostic();
  assert.equal(isPreviewEnvironment({ VERCEL_ENV: "preview" }), true);
  assert.equal(isPreviewEnvironment({ VERCEL_ENV: "production" }), false);
  assert.equal(isPreviewEnvironment({ VERCEL_ENV: "development" }), false);
  assert.equal(isPreviewEnvironment({}), false);
});

test("missing or malformed token fails safely before Blob operations", async () => {
  const { runPreviewBlobDiagnostic } = await loadDiagnostic();

  for (const token of [undefined, "   ", "not-a-vercel-blob-token"]) {
    let operationCalls = 0;
    const result = await runPreviewBlobDiagnostic(
      { AURORA_STATE_BLOB_READ_WRITE_TOKEN: token },
      {
        randomId: () => "not-used",
        createStore: () => {
          operationCalls += 1;
          return fakeStore();
        },
        scratch: {
          async create() { operationCalls += 1; },
          async originGet() { operationCalls += 1; return { etag: ETAG }; },
          async compareAndSwap() { operationCalls += 1; },
          async remove() { operationCalls += 1; },
        },
      },
    );

    assert.equal(result.status, 503);
    assert.deepEqual(result.body, {
      token_present: Boolean(token?.trim()),
      token_prefix_format: false,
      state_read: "skipped",
      scratch_create: "skipped",
      scratch_origin_get: "skipped",
      scratch_cas: "skipped",
      scratch_delete: "skipped",
      state_cas: "skipped",
    });
    assert.equal(operationCalls, 0);
    assertSafeOutput(result.body);
  }
});

test("successful diagnostic uses create-only, origin get, same-ETag CAS, cleanup, and same-state CAS", async () => {
  const { runPreviewBlobDiagnostic } = await loadDiagnostic();
  const calls: Array<{ stage: string; args: unknown[] }> = [];
  const store = fakeStore({
    async read() {
      calls.push({ stage: "state-read", args: [] });
      return { state, etag: ETAG };
    },
    async compareAndSwap(expectedEtag, next) {
      calls.push({ stage: "state-cas", args: [expectedEtag, next] });
      return "written";
    },
  });
  const result = await runPreviewBlobDiagnostic(
    { AURORA_STATE_BLOB_READ_WRITE_TOKEN: TOKEN },
    {
      randomId: () => "fixed-test-id",
      createStore: () => store,
      scratch: {
        async create(...args) { calls.push({ stage: "create", args }); },
        async originGet(...args) {
          calls.push({ stage: "get", args });
          return { etag: ETAG };
        },
        async compareAndSwap(...args) { calls.push({ stage: "scratch-cas", args }); },
        async remove(...args) { calls.push({ stage: "delete", args }); },
      },
    },
  );

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    token_present: true,
    token_prefix_format: true,
    state_read: "ok",
    scratch_create: "ok",
    scratch_origin_get: "ok",
    scratch_cas: "ok",
    scratch_delete: "ok",
    state_cas: "written",
  });
  assert.deepEqual(calls.map(({ stage }) => stage), [
    "state-read",
    "create",
    "get",
    "scratch-cas",
    "delete",
    "state-cas",
  ]);
  assert.equal(calls[1]?.args[0], SCRATCH_PATH);
  assert.equal(calls[2]?.args[0], SCRATCH_PATH);
  assert.equal(calls[3]?.args[0], SCRATCH_PATH);
  assert.equal(calls[4]?.args[0], SCRATCH_PATH);
  assert.equal(calls[3]?.args[1], ETAG);
  assert.equal(calls[3]?.args[2], calls[1]?.args[1]);
  assert.equal(calls[5]?.args[0], ETAG);
  assert.equal(calls[5]?.args[1], state);
  assertSafeOutput(result.body);
});

test("a real-state CAS conflict is reported without failing otherwise successful diagnostics", async () => {
  const { runPreviewBlobDiagnostic } = await loadDiagnostic();
  const { deps } = dependencies({
    createStore: () => fakeStore({ compareAndSwap: async () => "conflict" }),
  });
  const result = await runPreviewBlobDiagnostic(
    { AURORA_STATE_BLOB_READ_WRITE_TOKEN: TOKEN },
    deps,
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.state_cas, "conflict");
  assertSafeOutput(result.body);
});

test("state read missing and errors use fixed codes without exposing details", async () => {
  const { runPreviewBlobDiagnostic } = await loadDiagnostic();

  for (const { read, expected } of [
    { read: async () => null, expected: "missing" },
    { read: async () => { throw new Error(RAW_ERROR); }, expected: "error" },
  ] as const) {
    const { deps } = dependencies({ createStore: () => fakeStore({ read }) });
    const result = await runPreviewBlobDiagnostic(
      { AURORA_STATE_BLOB_READ_WRITE_TOKEN: TOKEN },
      deps,
    );

    assert.equal(result.status, 503);
    assert.equal(result.body.state_read, expected);
    assert.equal(result.body.state_cas, "skipped");
    assertSafeOutput(result.body);
  }
});

test("each scratch failure is a fixed code and cleanup is always attempted", async () => {
  const { runPreviewBlobDiagnostic } = await loadDiagnostic();
  const cases = [
    { stage: "create", expected: { scratch_create: "error", scratch_origin_get: "skipped", scratch_cas: "skipped" } },
    { stage: "get", expected: { scratch_create: "ok", scratch_origin_get: "error", scratch_cas: "skipped" } },
    { stage: "cas", expected: { scratch_create: "ok", scratch_origin_get: "ok", scratch_cas: "error" } },
    { stage: "delete", expected: { scratch_create: "ok", scratch_origin_get: "ok", scratch_cas: "ok", scratch_delete: "error" } },
  ];

  for (const { stage, expected } of cases) {
    const calls: string[] = [];
    const { deps } = dependencies({
      scratch: {
        async create() {
          calls.push("create");
          if (stage === "create") throw new Error(RAW_ERROR);
        },
        async originGet() {
          calls.push("get");
          if (stage === "get") throw new Error(RAW_ERROR);
          return { etag: ETAG };
        },
        async compareAndSwap() {
          calls.push("cas");
          if (stage === "cas") throw new Error(RAW_ERROR);
        },
        async remove() {
          calls.push("delete");
          if (stage === "delete") throw new Error(RAW_ERROR);
        },
      },
    });
    const result = await runPreviewBlobDiagnostic(
      { AURORA_STATE_BLOB_READ_WRITE_TOKEN: TOKEN },
      deps,
    );

    assert.equal(result.status, 503, stage);
    const expectedBody = Object.assign({
      token_present: true,
      token_prefix_format: true,
      state_read: "ok",
      scratch_create: "skipped",
      scratch_origin_get: "skipped",
      scratch_cas: "skipped",
      scratch_delete: "ok",
      state_cas: "written",
    }, expected);
    assert.deepEqual(result.body, expectedBody);
    assert.equal(calls.at(-1), "delete", stage);
    assertSafeOutput(result.body);
  }
});

test("state CAS errors are sanitized to a fixed stage code", async () => {
  const { runPreviewBlobDiagnostic } = await loadDiagnostic();
  const { deps } = dependencies({
    createStore: () => fakeStore({
      compareAndSwap: async () => { throw new Error(RAW_ERROR); },
    }),
  });
  const result = await runPreviewBlobDiagnostic(
    { AURORA_STATE_BLOB_READ_WRITE_TOKEN: TOKEN },
    deps,
  );

  assert.equal(result.status, 503);
  assert.equal(result.body.state_cas, "error");
  assertSafeOutput(result.body);
});
