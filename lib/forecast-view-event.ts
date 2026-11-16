// @ts-ignore TS5097
import { sanitizePageLocation } from "./analytics-privacy.ts";
import type {
  AnalyticsPageType,
  ProductEventProps,
  VerdictAnalyticsStatus,
} from "./search-event";

export type ForecastViewOnceState = { lastPageLocation: string | null };

export type ForecastViewInput = {
  pageType: Extract<AnalyticsPageType, "home" | "forecast" | "view">;
  /** US state slug, region, or explicit fallback such as `us` / `unknown`. */
  state?: string | null;
  /** Location slug for this view (`home`, `view`, or a forecast slug). */
  placeSlug?: string | null;
  verdict: VerdictAnalyticsStatus;
};

/** Shared once-per-view guard for the browser tracker. */
export const forecastViewOnce: ForecastViewOnceState = { lastPageLocation: null };

export function forecastViewKey(pageLocation: string): string {
  try {
    const parsed = new URL(pageLocation);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return pageLocation;
  }
}

export function prepareForecastViewEvent(
  href: string,
  input: ForecastViewInput,
  once: ForecastViewOnceState = forecastViewOnce,
): ProductEventProps | null {
  const page_location = sanitizePageLocation(href);
  const viewKey = forecastViewKey(page_location);
  if (once.lastPageLocation === viewKey) return null;
  once.lastPageLocation = viewKey;
  const trimmedState = input.state?.trim();
  const place_slug = input.placeSlug?.trim() || input.pageType;
  return {
    page_type: input.pageType,
    verdict: input.verdict,
    page_location,
    // Never omit state: GA4 shows (not set) when the param is absent/empty.
    state: trimmedState || "unknown",
    place_slug,
  };
}
