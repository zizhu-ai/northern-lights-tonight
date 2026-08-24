import assert from "node:assert/strict";
import test from "node:test";

// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
import { BUNDLED_EXPLICIT_NO_MAX_AGE_MS, isBundledTooOldToAssert, sanitizeBundledLocationRow } from "./bundled-sanitize.ts";

const now = new Date("2026-08-24T12:00:00.000Z");

const explicitNoRow = {
  location_slug: "colorado",
  status: "NO",
  main_obstacle: "AURORA_NO_REACH",
  confidence: "high",
  best_window_start: "2026-08-23T04:00:00.000Z",
  best_window_end: "2026-08-23T07:00:00.000Z",
};

const auroraUnavailable = true;

test("fresh bundled snapshot: explicit NO / AURORA_NO_REACH still passes through", () => {
  const generatedAt = new Date(now.getTime() - 60 * 60_000).toISOString(); // 1h
  const result = sanitizeBundledLocationRow(explicitNoRow, {
    now,
    generatedAt,
    sourceTime: null,
    auroraUnavailable,
  });
  assert.equal(result.status, "NO");
  assert.equal(result.main_obstacle, "AURORA_NO_REACH");
  assert.equal(result.confidence, "high");
  assert.equal(result.updated_at, generatedAt);
});

test("exactly 12h old: explicit NO still passes through", () => {
  const generatedAt = new Date(
    now.getTime() - BUNDLED_EXPLICIT_NO_MAX_AGE_MS,
  ).toISOString();
  assert.equal(isBundledTooOldToAssert(generatedAt, now), false);
  const result = sanitizeBundledLocationRow(explicitNoRow, {
    now,
    generatedAt,
    sourceTime: null,
    auroraUnavailable,
  });
  assert.equal(result.status, "NO");
  assert.equal(result.main_obstacle, "AURORA_NO_REACH");
});

test("older than 12h: explicit NO degrades to UNKNOWN", () => {
  const generatedAt = new Date(
    now.getTime() - BUNDLED_EXPLICIT_NO_MAX_AGE_MS - 1,
  ).toISOString();
  assert.equal(isBundledTooOldToAssert(generatedAt, now), true);
  const result = sanitizeBundledLocationRow(explicitNoRow, {
    now,
    generatedAt,
    sourceTime: null,
    auroraUnavailable,
  });
  assert.equal(result.status, "UNKNOWN");
  assert.equal(result.confidence, "low");
  assert.equal(result.best_window_start, null);
  assert.equal(result.best_window_end, null);
  assert.equal(result.updated_at, generatedAt);
  // Obstacle left as-is; status/windows are what the UI gates on.
  assert.equal(result.main_obstacle, "AURORA_NO_REACH");
});

test("invalid generated_at counts as expired: explicit NO degrades", () => {
  assert.equal(isBundledTooOldToAssert("not-a-date", now), true);
  const result = sanitizeBundledLocationRow(explicitNoRow, {
    now,
    generatedAt: "not-a-date",
    sourceTime: null,
    auroraUnavailable,
  });
  assert.equal(result.status, "UNKNOWN");
  assert.equal(result.confidence, "low");
});

test("stale non-NO rows still degrade to UNKNOWN", () => {
  const generatedAt = new Date(
    now.getTime() - BUNDLED_EXPLICIT_NO_MAX_AGE_MS - 1,
  ).toISOString();
  const maybeRow = {
    location_slug: "alaska",
    status: "MAYBE",
    main_obstacle: "CLOUD_BLOCKED",
    confidence: "medium",
    best_window_start: "2026-08-23T04:00:00.000Z",
    best_window_end: "2026-08-23T07:00:00.000Z",
  };
  const result = sanitizeBundledLocationRow(maybeRow, {
    now,
    generatedAt,
    sourceTime: "2026-08-23T10:00:00.000Z",
    auroraUnavailable,
  });
  assert.equal(result.status, "UNKNOWN");
  assert.equal(result.confidence, "low");
  assert.equal(result.updated_at, "2026-08-23T10:00:00.000Z");
});

test("when aurora is available, fresh rows pass through without age gate", () => {
  const generatedAt = new Date(
    now.getTime() - BUNDLED_EXPLICIT_NO_MAX_AGE_MS - 1,
  ).toISOString();
  const result = sanitizeBundledLocationRow(explicitNoRow, {
    now,
    generatedAt,
    sourceTime: null,
    auroraUnavailable: false,
  });
  // Age gate only applies on the degrade path (auroraUnavailable / expired GO).
  assert.equal(result.status, "NO");
});
