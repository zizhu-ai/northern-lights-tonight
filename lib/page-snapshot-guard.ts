import type { RefreshGiveUpDetail } from "./hard-refresh-resolver.ts";

export class UncacheableFallbackSnapshotError extends Error {
  readonly detail: RefreshGiveUpDetail | "bundled_fallback";

  constructor(detail: RefreshGiveUpDetail | "bundled_fallback") {
    super(`Uncacheable aurora fallback (${detail})`);
    this.name = "UncacheableFallbackSnapshotError";
    this.detail = detail;
  }
}

export function isProductionBuildPhase(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.NEXT_PHASE === "phase-production-build";
}

export type GuardableAuroraBundle = {
  snapshot_source: "live" | "lkg" | "bundled";
  freshness: { revision: string } | null;
  source_observations: {
    ovation: { health: string };
    kp: { health: string };
  };
};

export function isUnusableFallbackBundle(bundle: GuardableAuroraBundle): boolean {
  return (
    bundle.snapshot_source === "bundled" ||
    bundle.freshness === null ||
    bundle.freshness.revision === "unavailable" ||
    (bundle.source_observations.ovation.health === "invalid" &&
      bundle.source_observations.kp.health === "invalid")
  );
}

export function assertCacheableAuroraBundle<T extends GuardableAuroraBundle>(
  bundle: T,
): T {
  if (isUnusableFallbackBundle(bundle)) {
    throw new UncacheableFallbackSnapshotError("bundled_fallback");
  }
  return bundle;
}
