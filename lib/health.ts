import type { SourceName } from "./aurora-sources.ts";
import type { SnapshotFreshness } from "./hard-refresh-resolver.ts";
import type {
  SnapshotSource,
  SourceObservation,
} from "./live-snapshots.ts";

export type HealthInput = {
  source: SnapshotSource;
  generated_at: string;
  freshness: SnapshotFreshness | null;
  locations: { status: string }[];
  source_observations: Record<SourceName, SourceObservation>;
};

export type HealthBody = {
  status: "ok" | "degraded" | "unhealthy";
  snapshot_revision: string;
  checked_at: string | null;
  checked_age_seconds: number | null;
  last_success_at: string | null;
  last_success_age_seconds: number | null;
  persistence_health: SnapshotFreshness["persistence_health"];
  source_health: Record<SourceName, SourceObservation["health"]>;
  source: SnapshotSource;
  total: number;
  unknowns: number;
  generated_at: string;
};

export type HealthAssessment = {
  body: HealthBody;
  status: 200 | 503;
};

function ageSeconds(iso: string | null, evaluatedAt: Date): number | null {
  if (!iso) return null;
  const timestamp = Date.parse(iso);
  const ageMilliseconds = evaluatedAt.getTime() - timestamp;
  if (!Number.isFinite(timestamp) || ageMilliseconds < 0) return null;
  return Math.floor(ageMilliseconds / 1_000);
}

export function assessHealth(
  input: HealthInput,
  evaluatedAt: Date = new Date(),
): HealthAssessment {
  const unknowns = input.locations.filter(
    (location) => location.status === "UNKNOWN",
  ).length;
  const total = input.locations.length;
  const freshness = input.freshness;
  const checkedAgeSeconds = ageSeconds(freshness?.checked_at ?? null, evaluatedAt);
  const sourceHealth = {
    ovation: input.source_observations.ovation.health,
    kp: input.source_observations.kp.health,
    cloud: input.source_observations.cloud.health,
  };
  const inContract =
    checkedAgeSeconds !== null && checkedAgeSeconds < 600;
  const hasUsableAurora =
    sourceHealth.ovation !== "invalid" || sourceHealth.kp !== "invalid";
  const scientificallyUsable =
    input.source !== "bundled" &&
    total > 0 &&
    unknowns < total &&
    hasUsableAurora;
  const unhealthy = !inContract || !scientificallyUsable;
  const degraded =
    !unhealthy &&
    (input.source !== "live" ||
      freshness?.persistence_health !== "ok" ||
      Object.values(sourceHealth).some((health) => health !== "ok"));

  return {
    body: {
      status: unhealthy ? "unhealthy" : degraded ? "degraded" : "ok",
      snapshot_revision: freshness?.revision ?? "unavailable",
      checked_at: freshness?.checked_at ?? null,
      checked_age_seconds: checkedAgeSeconds,
      last_success_at: freshness?.last_success_at ?? null,
      last_success_age_seconds: ageSeconds(
        freshness?.last_success_at ?? null,
        evaluatedAt,
      ),
      persistence_health: freshness?.persistence_health ?? "unavailable",
      source_health: sourceHealth,
      source: input.source,
      total,
      unknowns,
      generated_at: input.generated_at,
    },
    status: unhealthy ? 503 : 200,
  };
}
