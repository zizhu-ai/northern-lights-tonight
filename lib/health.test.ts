import assert from "node:assert/strict";
import test from "node:test";

// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
import { assessHealth, type HealthInput } from "./health.ts";

const evaluatedAt = new Date("2026-08-24T12:00:00Z");
const generated_at = "2026-08-24T11:59:50Z";

function observation(
  health: "ok" | "degraded" | "invalid",
): HealthInput["source_observations"]["ovation"] {
  return {
    source_time: "2026-08-24T11:55:00Z",
    fetched_at: "2026-08-24T11:55:05Z",
    age_seconds: 300,
    health,
    fallback_used: health !== "ok",
    fingerprint: "a".repeat(64),
    coverage: {},
  };
}

function input(overrides: Partial<HealthInput> = {}): HealthInput {
  return {
    source: "live",
    generated_at,
    freshness: {
      revision: "snapshot-healthy",
      checked_at: "2026-08-24T11:50:01Z",
      last_success_at: "2026-08-24T11:55:00Z",
      persistence_health: "ok",
    },
    locations: [{ status: "GO" }, { status: "UNKNOWN" }],
    source_observations: {
      ovation: observation("ok"),
      kp: observation("ok"),
      cloud: observation("ok"),
    },
    ...overrides,
  } as HealthInput;
}

test("fresh healthy state at 599 seconds returns compatible diagnostics", () => {
  const result = assessHealth(input(), evaluatedAt);

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    status: "ok",
    snapshot_revision: "snapshot-healthy",
    checked_at: "2026-08-24T11:50:01Z",
    checked_age_seconds: 599,
    last_success_at: "2026-08-24T11:55:00Z",
    last_success_age_seconds: 300,
    persistence_health: "ok",
    source_health: { ovation: "ok", kp: "ok", cloud: "ok" },
    source: "live",
    total: 2,
    unknowns: 1,
    generated_at,
  });
});

test("usable state with degraded source health returns degraded 200", () => {
  const result = assessHealth(
    input({
      source: "lkg",
      source_observations: {
        ovation: observation("degraded"),
        kp: observation("ok"),
        cloud: observation("ok"),
      },
    }),
    evaluatedAt,
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.status, "degraded");
  assert.deepEqual(result.body.source_health, {
    ovation: "degraded",
    kp: "ok",
    cloud: "ok",
  });
});

for (const seconds of [600, 601]) {
  test(`checked age at ${seconds} seconds returns unhealthy 503`, () => {
    const checked_at = new Date(evaluatedAt.getTime() - seconds * 1_000).toISOString();
    const result = assessHealth(
      input({ freshness: { ...input().freshness!, checked_at } }),
      evaluatedAt,
    );

    assert.equal(result.status, 503);
    assert.equal(result.body.status, "unhealthy");
    assert.equal(result.body.checked_age_seconds, seconds);
  });
}

test("unavailable persistence with no in-contract state returns unhealthy 503", () => {
  const result = assessHealth(
    input({ source: "bundled", freshness: null }),
    evaluatedAt,
  );

  assert.equal(result.status, 503);
  assert.deepEqual(result.body, {
    status: "unhealthy",
    snapshot_revision: "unavailable",
    checked_at: null,
    checked_age_seconds: null,
    last_success_at: null,
    last_success_age_seconds: null,
    persistence_health: "unavailable",
    source_health: { ovation: "ok", kp: "ok", cloud: "ok" },
    source: "bundled",
    total: 2,
    unknowns: 1,
    generated_at,
  });
});

test("all UNKNOWN locations return unhealthy 503", () => {
  const result = assessHealth(
    input({ locations: [{ status: "UNKNOWN" }, { status: "UNKNOWN" }] }),
    evaluatedAt,
  );

  assert.equal(result.status, 503);
  assert.equal(result.body.status, "unhealthy");
  assert.equal(result.body.unknowns, 2);
  assert.equal(result.body.total, 2);
});

test("both aurora sources invalid return unhealthy despite non-UNKNOWN rows", () => {
  const result = assessHealth(
    input({
      source_observations: {
        ovation: observation("invalid"),
        kp: observation("invalid"),
        cloud: observation("ok"),
      },
    }),
    evaluatedAt,
  );

  assert.equal(result.status, 503);
  assert.equal(result.body.status, "unhealthy");
});

test("one usable aurora source with the other invalid returns degraded 200", () => {
  const result = assessHealth(
    input({
      source_observations: {
        ovation: observation("invalid"),
        kp: observation("ok"),
        cloud: observation("ok"),
      },
    }),
    evaluatedAt,
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.status, "degraded");
});

test("future checked clock returns unhealthy 503 instead of a zero age", () => {
  const result = assessHealth(
    input({
      freshness: {
        ...input().freshness!,
        checked_at: "2026-08-24T12:00:01Z",
      },
    }),
    evaluatedAt,
  );

  assert.equal(result.status, 503);
  assert.equal(result.body.status, "unhealthy");
  assert.equal(result.body.checked_age_seconds, null);
});

test("invalid and future last-success clocks produce null diagnostic ages", () => {
  for (const last_success_at of ["not-a-date", "2026-08-24T12:00:01Z"]) {
    const result = assessHealth(
      input({ freshness: { ...input().freshness!, last_success_at } }),
      evaluatedAt,
    );

    assert.equal(result.body.last_success_at, last_success_at);
    assert.equal(result.body.last_success_age_seconds, null);
  }
});
