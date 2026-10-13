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
  state?: string;
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
  return {
    page_type: input.pageType,
    verdict: input.verdict,
    page_location,
    ...(input.state ? { state: input.state } : {}),
  };
}
