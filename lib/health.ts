export type HealthSource = "live" | "lkg" | "bundled";

export type HealthBody = {
  source: HealthSource;
  unknowns: number;
  total: number;
  generated_at: string;
};

export type HealthAssessment = {
  body: HealthBody;
  status: 200 | 503;
};

/**
 * Probe-facing health: 503 only for durable degradation (bundled cold-start
 * fallback, or every location UNKNOWN). Brief LKG takeover stays 200 so
 * external monitors can require consecutive failures before alerting.
 */
export function assessHealth(
  data: { locations: { status: string }[]; generated_at: string },
  source: HealthSource,
): HealthAssessment {
  const unknowns = data.locations.filter((l) => l.status === "UNKNOWN").length;
  const total = data.locations.length;
  const degraded = source === "bundled" || unknowns === total;
  return {
    body: {
      source,
      unknowns,
      total,
      generated_at: data.generated_at,
    },
    status: degraded ? 503 : 200,
  };
}
