import {
  analyticsAllowed,
  analyticsSessionGate,
  readAnalyticsOptOut,
  readBrowserDoNotTrack,
  sanitizePageLocation,
} from "@/lib/analytics-privacy";
import { ensureGtagInstalled, queueGtag, syncGtagPageLocation } from "@/lib/ga-client";
import { queryKind } from "@/lib/place-search";
import {
  trackProductEvent as emitProductEvent,
  type ProductEventName,
  type ProductEventProps,
  type SearchQueryKind,
} from "@/lib/search-event";

export type { ProductEventName, ProductEventProps, SearchQueryKind };
export {
  analyticsStateSlug,
  faqAnalyticsId,
  isAllowedProductEventName,
  pageTypeFromPath,
  PRODUCT_EVENT_NAMES,
  sanitizeProductEventProps,
} from "@/lib/search-event";

export function queryKindForAnalytics(query: string): SearchQueryKind {
  return queryKind(query);
}

export function trackProductEvent(
  name: ProductEventName,
  props: ProductEventProps,
  send: (event: string, data: Record<string, string>) => void = () => {},
): void {
  emitProductEvent(name, props, send, analyticsSessionGate.isDisabled());
}

export async function trackBrowserProductEvent(
  name: ProductEventName,
  props: ProductEventProps,
): Promise<void> {
  if (typeof window === "undefined") return;
  if (
    !analyticsAllowed({
      measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
      hostname: window.location.hostname,
      storageOptOut: readAnalyticsOptOut(),
      dnt: readBrowserDoNotTrack(),
      requireProductionHost: true,
    })
  ) {
    return;
  }
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
  trackProductEvent(name, props, (event, data) => {
    ensureGtagInstalled(measurementId);
    if (event === "forecast_view") {
      const page_location = sanitizePageLocation(
        data.page_location || window.location.href,
      );
      data = { ...data, page_location };
      syncGtagPageLocation(measurementId, page_location);
    }
    queueGtag("event", event, data);
  });
}
