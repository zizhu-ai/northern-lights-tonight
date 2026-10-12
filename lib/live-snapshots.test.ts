import assert from "node:assert/strict";
import test from "node:test";

import {
  UncacheableFallbackSnapshotError,
  assertCacheableAuroraBundle,
  isProductionBuildPhase,
  isUnusableFallbackBundle,
  type GuardableAuroraBundle,
} from "./page-snapshot-guard.ts";

const invalid = { health: "invalid" };
const ok = { health: "ok" };

function bundle(overrides: Partial<GuardableAuroraBundle> = {}): GuardableAuroraBundle {
  return {
    snapshot_source: "live",
    freshness: { revision: "rev-live" },
    source_observations: { ovation: ok, kp: ok },
    ...overrides,
  };
}

test("isProductionBuildPhase is true only during next build", () => {
  assert.equal(isProductionBuildPhase({}), false);
  assert.equal(isProductionBuildPhase({ NEXT_PHASE: "phase-production-server" }), false);
  assert.equal(isProductionBuildPhase({ NEXT_PHASE: "phase-production-build" }), true);
});

test("bundled and unavailable-revision bundles are unusable fallbacks", () => {
  assert.equal(isUnusableFallbackBundle(bundle({ snapshot_source: "bundled" })), true);
  assert.equal(isUnusableFallbackBundle(bundle({ freshness: null })), true);
  assert.equal(
    isUnusableFallbackBundle(bundle({ freshness: { revision: "unavailable" } })),
    true,
  );
  assert.equal(
    isUnusableFallbackBundle(
      bundle({ source_observations: { ovation: invalid, kp: invalid } }),
    ),
    true,
  );
  assert.equal(isUnusableFallbackBundle(bundle()), false);
  assert.equal(isUnusableFallbackBundle(bundle({ snapshot_source: "lkg" })), false);
});

test("assertCacheableAuroraBundle throws so ISR cannot store fallback HTML", () => {
  assert.equal(assertCacheableAuroraBundle(bundle()).snapshot_source, "live");
  assert.throws(
    () => assertCacheableAuroraBundle(bundle({ snapshot_source: "bundled", freshness: null })),
    (error: unknown) => {
      assert.ok(error instanceof UncacheableFallbackSnapshotError);
      assert.equal(error.detail, "bundled_fallback");
      assert.match(error.message, /Uncacheable aurora fallback/);
      return true;
    },
  );
});
