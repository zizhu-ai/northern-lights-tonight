import assert from "node:assert/strict";
import test from "node:test";

import {
  createSourceResolver,
  type HardRefreshRuntime,
  type SourceResolution,
// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
} from "./hard-refresh-resolver.ts";
import {
  AURORA_SOURCE_FETCH_WORST_CASE_MS,
  fingerprintPayload,
  isValidRawSourceEnvelopes,
// @ts-ignore TS5097: the canonical validator is Node-strip-types compatible.
} from "./aurora-sources.ts";
import type {
  JsonObject,
  RawSourceEnvelopes,
  SourceEnvelope,
  SourceFetchResults,
// @ts-ignore TS5097: see the strip-types runner note above.
} from "./aurora-sources.ts";
import type {
  SnapshotStateV2,
  SnapshotStore,
  StoredSnapshotState,
// @ts-ignore TS5097: see the strip-types runner note above.
} from "./snapshot-store.ts";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const BASE = Date.parse("2026-08-25T03:00:00.000Z");
const SENTINEL_TOKEN = "BLOB_TOKEN_SENTINEL_DO_NOT_PERSIST";
const SENTINEL_KEY = "WEATHER_KEY_SENTINEL_DO_NOT_PERSIST";

function ovation(at: number): SourceEnvelope<JsonObject> {
  const payload = { "Observation Time": new Date(at).toISOString(), coordinates: [[0, 0, 1]] };
  return {
    schema_version: 1,
    source: "ovation",
    fetched_at: new Date(at).toISOString(),
    source_time: new Date(at).toISOString(),
    fingerprint: fingerprintPayload(payload),
    coverage: {},
    payload,
  };
}

function kp(at: number): SourceEnvelope<unknown[]> {
  const payload = [{ time_tag: new Date(at).toISOString(), kp: 4 }];
  return {
    schema_version: 1,
    source: "kp",
    fetched_at: new Date(at).toISOString(),
    source_time: new Date(at).toISOString(),
    fingerprint: fingerprintPayload(payload),
    coverage: {
      start: new Date(at - HOUR).toISOString(),
      end: new Date(at + 24 * HOUR).toISOString(),
    },
    payload,
  };
}

function cloud(
  at: number,
  options: {
    complete?: boolean;
    end?: number;
    nullPoint?: boolean;
    coveredPoints?: number;
    pointEnd?: string;
  } = {},
): SourceEnvelope<Record<string, JsonObject | null>> {
  const payload = {
    "1.000,2.000": options.nullPoint
      ? null
      : {
          hourly: {
            time: ["2026-08-25T00:00", options.pointEnd ?? "2026-08-26T23:00"],
            cloud_cover: [10, 20],
            cloud_cover_low: [5, 10],
            cloud_cover_mid: [5, 10],
            cloud_cover_high: [5, 10],
          },
        },
  };
  return {
    schema_version: 1,
    source: "cloud",
    fetched_at: new Date(at).toISOString(),
    source_time: new Date(at).toISOString(),
    fingerprint: fingerprintPayload(payload),
    coverage: {
      complete: options.complete ?? true,
      expected_points: 1,
      covered_points: options.coveredPoints ?? (options.complete === false ? 0 : 1),
      start: new Date(at - HOUR).toISOString(),
      end: new Date(options.end ?? at + 24 * HOUR).toISOString(),
      points: { "1.000,2.000": { timezone: "UTC" } },
    },
    payload,
  };
}

function envelopes(at: number): RawSourceEnvelopes {
  return { schema_version: 1, ovation: ovation(at), kp: kp(at), cloud: cloud(at) };
}

function outcomes(at: number, status: "ok" | "error" = "ok") {
  const checkedAt = new Date(at).toISOString();
  const item = { status, checked_at: checkedAt, error_code: status === "ok" ? null : "unavailable" };
  return { ovation: { ...item }, kp: { ...item }, cloud: { ...item } };
}

function stateAt(
  checkedAt: number,
  options: {
    revision?: string;
    envelopes?: RawSourceEnvelopes;
    allNegative?: boolean;
    retryAfter?: number | null;
    lease?: SnapshotStateV2["lease"];
    lastSuccessAt?: number | null;
  } = {},
): SnapshotStateV2 {
  const allNegative = options.allNegative ?? false;
  return {
    schema_version: 2,
    revision: options.revision ?? "revision-existing",
    checked_at: new Date(checkedAt).toISOString(),
    last_success_at: new Date(options.lastSuccessAt ?? checkedAt).toISOString(),
    retry_after:
      options.retryAfter === undefined
        ? null
        : options.retryAfter === null
          ? null
          : new Date(options.retryAfter).toISOString(),
    envelopes: options.envelopes ?? envelopes(checkedAt),
    outcomes: outcomes(checkedAt, allNegative ? "error" : "ok"),
    lease: options.lease ?? null,
  };
}

class MemoryStore implements SnapshotStore {
  current: StoredSnapshotState | null;
  writes: SnapshotStateV2[] = [];
  reads = 0;
  private sequence = 0;

  constructor(state: SnapshotStateV2 | null = null) {
    this.current = state ? { state: structuredClone(state), etag: "etag-0" } : null;
  }

  async read(): Promise<StoredSnapshotState | null> {
    this.reads += 1;
    return this.current ? structuredClone(this.current) : null;
  }

  async compareAndSwap(expectedEtag: string | null, next: SnapshotStateV2) {
    if ((this.current?.etag ?? null) !== expectedEtag) return "conflict" as const;
    if (!isValidRawSourceEnvelopes(next.envelopes)) throw new Error("canonical validation failed");
    this.writes.push(structuredClone(next));
    this.sequence += 1;
    this.current = { state: structuredClone(next), etag: `etag-${this.sequence}` };
    return "written" as const;
  }
}

const success = (at: number): SourceFetchResults => ({
  ovation: { ok: true, envelope: ovation(at) },
  kp: { ok: true, envelope: kp(at) },
  cloud: { ok: true, envelope: cloud(at) },
});

const failure = (message = "upstream unavailable"): SourceFetchResults => ({
  ovation: { ok: false, error: message },
  kp: { ok: false, error: message },
  cloud: { ok: false, error: message },
});

function harness(options: {
  now?: number;
  store?: SnapshotStore;
  fetched?: SourceFetchResults | (() => Promise<SourceFetchResults>);
  owner?: string;
}) {
  let now = options.now ?? BASE;
  let calls = 0;
  const runtime: HardRefreshRuntime = {
    now: () => new Date(now),
    ownerId: () => options.owner ?? "test-owner",
    sleep: async (milliseconds) => {
      now += milliseconds;
    },
    store: options.store ?? new MemoryStore(),
    fetchSources: async () => {
      calls += 1;
      return typeof options.fetched === "function"
        ? options.fetched()
        : options.fetched ?? success(now);
    },
  };
  return {
    resolve: createSourceResolver(runtime),
    calls: () => calls,
    now: () => now,
    setNow: (value: number) => { now = value; },
  };
}

function usable(result: SourceResolution) {
  assert.equal(result.kind, "usable");
  return result;
}

test("the canonical parallel source retry policy fits the resolver's 26-second work budget", () => {
  assert.equal(AURORA_SOURCE_FETCH_WORST_CASE_MS, 24_948);
  assert.ok(AURORA_SOURCE_FETCH_WORST_CASE_MS <= 26_000);
});

test("a state checked 599 seconds ago is reused without an upstream call", async () => {
  const h = harness({ now: BASE, store: new MemoryStore(stateAt(BASE - 599_000)) });
  const result = usable(await h.resolve());
  assert.equal(result.mode, "fresh_hit");
  assert.equal(result.freshness.checked_at, new Date(BASE - 599_000).toISOString());
  assert.equal(h.calls(), 0);
});

test("states checked 600 or 601 seconds ago wait for a completed refresh", async () => {
  for (const age of [600_000, 601_000]) {
    const store = new MemoryStore(stateAt(BASE - age));
    const h = harness({ now: BASE, store, fetched: success(BASE) });
    const result = usable(await h.resolve());
    assert.equal(result.mode, "refreshed");
    assert.equal(result.freshness.checked_at, new Date(BASE).toISOString());
    assert.equal(h.calls(), 1);
  }
});

test("twenty concurrent calls in one isolate share one upstream refresh", async () => {
  let release!: (value: SourceFetchResults) => void;
  const gate = new Promise<SourceFetchResults>((resolve) => { release = resolve; });
  const h = harness({ store: new MemoryStore(stateAt(BASE - 600_000)), fetched: () => gate });
  const pending = Array.from({ length: 20 }, () => h.resolve());
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(h.calls(), 1);
  release(success(BASE));
  const results = await Promise.all(pending);
  assert.equal(results.every((result) => result.kind === "usable"), true);
  assert.equal(h.calls(), 1);
});

test("a live foreign lease is polled and an expired lease is acquired", async () => {
  const liveLeaseStore = new MemoryStore(stateAt(BASE - 600_000, {
    lease: { owner: "foreign", expires_at: new Date(BASE + 2_000).toISOString() },
  }));
  const originalRead = liveLeaseStore.read.bind(liveLeaseStore);
  liveLeaseStore.read = async () => {
    const value = await originalRead();
    if (liveLeaseStore.reads === 2 && liveLeaseStore.current) {
      liveLeaseStore.current = {
        state: stateAt(BASE + 1_000, { revision: "foreign-winner" }),
        etag: "etag-foreign-winner",
      };
      return structuredClone(liveLeaseStore.current);
    }
    return value;
  };
  const polled = harness({ now: BASE, store: liveLeaseStore });
  const foreignResult = usable(await polled.resolve());
  assert.equal(foreignResult.freshness.revision, "foreign-winner");
  assert.equal(polled.calls(), 0);

  const expiredStore = new MemoryStore(stateAt(BASE - 600_000, {
    lease: { owner: "foreign", expires_at: new Date(BASE).toISOString() },
  }));
  const takeover = harness({ now: BASE, store: expiredStore, owner: "takeover" });
  assert.equal(usable(await takeover.resolve()).mode, "refreshed");
  assert.equal(expiredStore.writes[0]?.lease?.owner, "takeover");
  assert.equal(takeover.calls(), 1);
});

test("a crashed winner can be taken over exactly when its 40-second lease expires", async () => {
  const store = new MemoryStore(stateAt(BASE - 600_000, {
    lease: { owner: "crashed", expires_at: new Date(BASE + 40_000).toISOString() },
  }));
  const exhausted = harness({ now: BASE, store, owner: "too-early" });
  const exhaustedResult = await exhausted.resolve();
  assert.equal(exhaustedResult.kind, "failed_closed");
  assert.equal(exhausted.calls(), 0);
  assert.equal(exhausted.now(), BASE);

  const h = harness({ now: BASE + 40_000, store, owner: "rescuer" });
  const result = usable(await h.resolve());
  assert.equal(result.mode, "refreshed");
  assert.equal(h.now(), BASE + 40_000);
  assert.equal(store.writes[0]?.lease?.owner, "rescuer");
});

test("a delayed post-acquisition reread never borrows a takeover lease ETag", async () => {
  const store = new MemoryStore(stateAt(BASE - 600_000));
  const originalRead = store.read.bind(store);
  store.read = async () => {
    const value = await originalRead();
    if (store.reads === 2) {
      store.current = {
        state: stateAt(BASE - 600_000, {
          lease: { owner: "takeover", expires_at: new Date(BASE + 2_000).toISOString() },
        }),
        etag: "etag-takeover-lease",
      };
      return structuredClone(store.current);
    }
    if (store.reads === 3) {
      store.current = {
        state: stateAt(BASE + 1_000, { revision: "takeover-winner" }),
        etag: "etag-takeover-winner",
      };
      return structuredClone(store.current);
    }
    return value;
  };
  const h = harness({ now: BASE, store, owner: "original" });
  const result = usable(await h.resolve());
  assert.equal(h.calls(), 0);
  assert.equal(result.freshness.revision, "takeover-winner");
  assert.equal(store.current?.state.revision, "takeover-winner");
  assert.equal(store.writes.length, 1);
});

test("post-acquisition persistence delay cannot start upstream work outside the request budget", async () => {
  const store = new MemoryStore(stateAt(BASE - 600_000));
  const originalRead = store.read.bind(store);
  let advanceClock!: (value: number) => void;
  store.read = async () => {
    const value = await originalRead();
    if (store.reads === 2) advanceClock(BASE + 33_001);
    return value;
  };
  const h = harness({ now: BASE, store });
  advanceClock = h.setNow;
  const result = await h.resolve();
  assert.equal(result.kind, "failed_closed");
  assert.equal(h.calls(), 0);
});

test("a 50-second original winner cannot overwrite a revision published by a 40-second takeover", async () => {
  const store = new MemoryStore(stateAt(BASE - 600_000));
  let releaseOriginal!: (value: SourceFetchResults) => void;
  const originalGate = new Promise<SourceFetchResults>((resolve) => { releaseOriginal = resolve; });
  const original = harness({ now: BASE, store, owner: "original", fetched: () => originalGate });
  const originalPending = original.resolve();
  await new Promise<void>((resolve) => setImmediate(resolve));

  const takeover = harness({ now: BASE + 40_000, store, owner: "takeover", fetched: success(BASE + 40_000) });
  const takeoverResult = usable(await takeover.resolve());
  assert.equal(takeoverResult.mode, "refreshed");
  const takeoverRevision = takeoverResult.freshness.revision;

  original.setNow(BASE + 50_000);
  releaseOriginal(success(BASE + 50_000));
  const lateResult = usable(await originalPending);
  assert.equal(lateResult.freshness.revision, takeoverRevision);
  assert.equal(store.current?.state.revision, takeoverRevision);
  assert.equal(store.writes.at(-1)?.revision, takeoverRevision);
});

test("all-source failure retries at 60 seconds and reuses only valid LKG before then", async () => {
  for (const age of [59_000, 60_000, 61_000]) {
    const checkedAt = BASE - age;
    const negative = stateAt(checkedAt, {
      allNegative: true,
      retryAfter: checkedAt + 60_000,
      envelopes: { schema_version: 1, ovation: ovation(BASE - 30 * MINUTE), kp: null, cloud: null },
      lastSuccessAt: checkedAt - MINUTE,
    });
    const h = harness({ now: BASE, store: new MemoryStore(negative), fetched: failure() });
    const result = usable(await h.resolve());
    assert.equal(result.source, "lkg");
    assert.equal(h.calls(), age === 59_000 ? 0 : 1);
    if (age >= 60_000) {
      assert.equal(result.freshness.checked_at, new Date(BASE).toISOString());
      assert.equal(result.freshness.last_success_at, new Date(checkedAt - MINUTE).toISOString());
    }
  }

  const store = new MemoryStore(stateAt(BASE - 600_000, {
    envelopes: { schema_version: 1, ovation: ovation(BASE - 30 * MINUTE), kp: null, cloud: null },
  }));
  const h = harness({ now: BASE, store, fetched: failure() });
  await h.resolve();
  assert.equal(
    store.current?.state.retry_after,
    new Date(BASE + 60_000).toISOString(),
  );
});

test("OVATION older than 90 minutes cannot provide usable aurora evidence", async () => {
  const stale = stateAt(BASE - 100_000, {
    envelopes: { schema_version: 1, ovation: ovation(BASE - 90 * MINUTE - 1), kp: null, cloud: cloud(BASE) },
  });
  const h = harness({ now: BASE, store: new MemoryStore(stale) });
  const result = await h.resolve();
  assert.deepEqual(result, {
    kind: "failed_closed",
    mode: "failed_closed",
    reason: "no_usable_aurora",
    fallback: "bundled_unknown",
    persistence_health: "degraded",
  });

  const malformed = ovation(BASE);
  malformed.payload = { coordinates: [] };
  const malformedState = stateAt(BASE - 100_000, {
    envelopes: { schema_version: 1, ovation: malformed, kp: null, cloud: cloud(BASE) },
  });
  assert.equal(
    (await harness({ now: BASE, store: new MemoryStore(malformedState) }).resolve()).kind,
    "failed_closed",
  );
});

test("a fetched envelope with a mismatched canonical fingerprint is never published", async () => {
  const store = new MemoryStore(stateAt(BASE - 600_000));
  const bad = ovation(BASE);
  bad.fingerprint = "f".repeat(64);
  const h = harness({
    now: BASE,
    store,
    fetched: {
      ovation: { ok: true, envelope: bad },
      kp: { ok: false, error: "unavailable" },
      cloud: { ok: false, error: "unavailable" },
    },
  });
  const result = await h.resolve();
  assert.equal(result.kind, "failed_closed");
  assert.equal(store.current?.state.revision, "revision-existing");
  assert.equal(store.current?.state.lease?.owner, "test-owner");
});

test("cloud older than 30 minutes is retained as degraded but invalid after 6 hours or missing coverage", async () => {
  const cases = [
    { cloud: cloud(BASE - 30 * MINUTE - 1), retained: true },
    { cloud: cloud(BASE - 6 * HOUR - 1), retained: false },
    { cloud: cloud(BASE, { complete: false }), retained: false },
    { cloud: cloud(BASE, { end: BASE + 17 * HOUR }), retained: false },
    { cloud: cloud(BASE, { nullPoint: true }), retained: false },
    { cloud: cloud(BASE, { coveredPoints: 0 }), retained: false },
    {
      cloud: cloud(BASE, {
        end: BASE + 24 * HOUR,
        pointEnd: "2026-08-25T20:00",
      }),
      retained: false,
    },
  ];
  for (const item of cases) {
    const state = stateAt(BASE - 100_000, {
      envelopes: { schema_version: 1, ovation: ovation(BASE), kp: null, cloud: item.cloud },
    });
    const result = usable(await harness({ now: BASE, store: new MemoryStore(state) }).resolve());
    assert.equal(result.envelopes.cloud !== null, item.retained);
    if (item.retained) {
      assert.equal(result.mode, "degraded_lkg");
      assert.equal(result.source, "lkg");
    }
  }
});

test("a Blob read failure with no in-contract state fails closed", async () => {
  const store: SnapshotStore = {
    read: async () => { throw new Error(`blob failed ${SENTINEL_TOKEN}`); },
    compareAndSwap: async () => { throw new Error("unexpected write"); },
  };
  const result = await harness({ store }).resolve();
  assert.deepEqual(result, {
    kind: "failed_closed",
    mode: "failed_closed",
    reason: "state_unavailable",
    fallback: "bundled_unknown",
    persistence_health: "unavailable",
  });
});

test("upstream credential sentinels never enter persisted state or diagnostics", async () => {
  const store = new MemoryStore(stateAt(BASE - 600_000, {
    envelopes: { schema_version: 1, ovation: ovation(BASE - 30 * MINUTE), kp: null, cloud: null },
  }));
  const message = `${SENTINEL_TOKEN} ${SENTINEL_KEY}`;
  const result = await harness({ now: BASE, store, fetched: failure(message) }).resolve();
  assert.equal(JSON.stringify(result).includes(SENTINEL_TOKEN), false);
  assert.equal(JSON.stringify(result).includes(SENTINEL_KEY), false);
  assert.equal(JSON.stringify(store.current?.state).includes(SENTINEL_TOKEN), false);
  assert.equal(JSON.stringify(store.current?.state).includes(SENTINEL_KEY), false);
  assert.deepEqual(store.current?.state.outcomes.ovation.error_code, "unavailable");
});
