/**
 * Pure helpers for the deployment-bundled snapshot fallback.
 * Kept dependency-free so Node strip-types tests can import this module
 * without pulling Next / Blob / React.
 */

export const BUNDLED_EXPLICIT_NO_MAX_AGE_MS = 12 * 60 * 60 * 1000;

/** Missing/invalid generated_at, or age strictly greater than 12h. */
export function isBundledTooOldToAssert(
  generatedAt: string,
  now: Date,
): boolean {
  const bundledAgeMs = now.getTime() - Date.parse(generatedAt);
  return (
    !Number.isFinite(bundledAgeMs) ||
    bundledAgeMs > BUNDLED_EXPLICIT_NO_MAX_AGE_MS
  );
}

function unknownAnswerForRow(row: Record<string, unknown>): string {
  const headline =
    typeof row.headline_point_name === "string" && row.headline_point_name
      ? row.headline_point_name
      : null;
  const place =
    typeof row.location_slug === "string" && row.location_slug
      ? row.location_slug.replace(/-/g, " ")
      : "this place";
  const where = headline ? `${headline} area` : place;
  return `UNKNOWN (${where}). Cannot judge tonight. Source data is too old to treat as live.`;
}

function degradeUnknownSurfaces(
  row: Record<string, unknown>,
  updated_at: string,
): Record<string, unknown> {
  const windows = Array.isArray(row.windows)
    ? row.windows.map((window) => {
        if (!window || typeof window !== "object") return window;
        const item = window as Record<string, unknown>;
        if (item.skip === true) return item;
        return { ...item, status: "UNKNOWN" };
      })
    : row.windows;
  const points = Array.isArray(row.points)
    ? row.points.map((point) => {
        if (!point || typeof point !== "object") return point;
        return { ...(point as Record<string, unknown>), status: "UNKNOWN", confidence: "low" };
      })
    : row.points;

  return {
    ...row,
    status: "UNKNOWN",
    confidence: "low",
    best_window_start: null,
    best_window_end: null,
    updated_at,
    main_obstacle: "DATA_STALE",
    main_obstacle_text: "Source data is too old to treat as live.",
    answer_sentence: unknownAnswerForRow(row),
    windows,
    points,
  };
}

export function sanitizeBundledLocationRow(
  row: Record<string, unknown>,
  opts: {
    now: Date;
    generatedAt: string;
    sourceTime: string | null;
    auroraUnavailable: boolean;
  },
): Record<string, unknown> {
  const bestEnd =
    typeof row.best_window_end === "string"
      ? Date.parse(row.best_window_end)
      : null;
  const expiredGo =
    row.status === "GO" && (bestEnd === null || bestEnd <= opts.now.getTime());
  const updated_at = opts.sourceTime ?? opts.generatedAt;
  if (!expiredGo && !opts.auroraUnavailable) {
    return { ...row, updated_at };
  }
  const explicitNo =
    !isBundledTooOldToAssert(opts.generatedAt, opts.now) &&
    row.status === "NO" &&
    row.main_obstacle === "AURORA_NO_REACH";
  return explicitNo ? { ...row, updated_at } : degradeUnknownSurfaces(row, updated_at);
}
