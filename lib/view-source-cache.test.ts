import assert from "node:assert/strict";
import test from "node:test";

import type { JsonObject, SourceFetchResult } from "./aurora-sources.ts";
// @ts-ignore TS5097
import {
  VIEW_CACHE_TTL_MS,
  VIEW_RECHECK_MIN_INTERVAL_MS,
  loadCachedAuroraProducts,
  loadCachedViewClouds,
  resetViewSourceCache,
  roundedViewCoordinate,
  shouldRefreshViewCache,
  viewCloudCacheKey,
  viewCloudLookupKey,
} from "./view-source-cache.ts";

test("view cache keys round coordinates to one decimal", () => {
  assert.equal(roundedViewCoordinate(34.052), 34.1);
  assert.equal(roundedViewCoordinate(-118.244), -118.2);
  assert.equal(viewCloudCacheKey(34.052, -118.244), "34.1,-118.2");
  assert.equal(viewCloudCacheKey(34.149, -118.249), "34.1,-118.2");
  assert.equal(viewCloudLookupKey(34.052, -118.244), "34.100,-118.200");
});

test("normal visits reuse the 10-minute cache and Recheck is bounded to one minute", () => {
  const fetchedAt = 1_000_000;
  assert.equal(shouldRefreshViewCache(undefined, fetchedAt, false), true);
  assert.equal(shouldRefreshViewCache(fetchedAt, fetchedAt + 59_000, false), false);
  assert.equal(shouldRefreshViewCache(fetchedAt, fetchedAt + VIEW_CACHE_TTL_MS - 1, false), false);
  assert.equal(shouldRefreshViewCache(fetchedAt, fetchedAt + VIEW_CACHE_TTL_MS, false), true);

  assert.equal(shouldRefreshViewCache(fetchedAt, fetchedAt + 59_000, true), false);
  assert.equal(
    shouldRefreshViewCache(fetchedAt, fetchedAt + VIEW_RECHECK_MIN_INTERVAL_MS, true),
    true,
  );
});

test("aurora products are shared across pins until TTL or a bounded Recheck", async () => {
  resetViewSourceCache();
  let calls = 0;
  const fetchProducts = async () => {
    calls += 1;
    return {
      ovation: { ok: false as const, error: `ovation-${calls}` },
      kp: { ok: false as const, error: `kp-${calls}` },
    };
  };

  const first = await loadCachedAuroraProducts({
    now: 10_000,
    fetchProducts,
  });
  const second = await loadCachedAuroraProducts({
    now: 10_000 + 30_000,
    fetchProducts,
  });
  assert.equal(calls, 1);
  assert.deepEqual(first, second);

  const earlyRecheck = await loadCachedAuroraProducts({
    now: 10_000 + 30_000,
    recheck: true,
    fetchProducts,
  });
  assert.equal(calls, 1);
  assert.deepEqual(earlyRecheck, first);

  const lateRecheck = await loadCachedAuroraProducts({
    now: 10_000 + VIEW_RECHECK_MIN_INTERVAL_MS,
    recheck: true,
    fetchProducts,
  });
  assert.equal(calls, 2);
  assert.equal(lateRecheck.ovation.ok, false);
  if (!lateRecheck.ovation.ok) assert.equal(lateRecheck.ovation.error, "ovation-2");
});

test("Open-Meteo cloud fetches share a 1-decimal key", async () => {
  resetViewSourceCache();
  let calls = 0;
  const fetchClouds = async () => {
    calls += 1;
    const result: SourceFetchResult<Record<string, JsonObject | null>> = {
      ok: true,
      envelope: {
        schema_version: 1,
        source: "cloud",
        fetched_at: "2026-10-14T00:00:00.000Z",
        source_time: null,
        fingerprint: "a".repeat(64),
        coverage: { complete: true },
        payload: { "34.100,-118.200": { hourly: { time: ["2026-10-14T00:00"] } } },
      },
    };
    return result;
  };

  await loadCachedViewClouds({
    lat: 34.052,
    lng: -118.244,
    timezone: "America/Los_Angeles",
    now: 20_000,
    fetchClouds,
  });
  await loadCachedViewClouds({
    lat: 34.149,
    lng: -118.151,
    timezone: "America/Los_Angeles",
    now: 20_000 + 5_000,
    fetchClouds,
  });
  assert.equal(calls, 1);

  await loadCachedViewClouds({
    lat: 34.052,
    lng: -118.244,
    timezone: "America/Los_Angeles",
    now: 20_000 + 30_000,
    recheck: true,
    fetchClouds,
  });
  assert.equal(calls, 1);

  await loadCachedViewClouds({
    lat: 40.713,
    lng: -74.006,
    timezone: "America/New_York",
    now: 20_000,
    fetchClouds,
  });
  assert.equal(calls, 2);
});
