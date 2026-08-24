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
  return explicitNo
    ? { ...row, updated_at }
    : {
        ...row,
        status: "UNKNOWN",
        confidence: "low",
        best_window_start: null,
        best_window_end: null,
        updated_at,
      };
}
