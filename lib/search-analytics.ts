import { analyticsSessionGate } from "@/lib/analytics-privacy";
import { queryKind } from "@/lib/place-search";
import {
  sanitizeProductEventProps,
  type ProductEventName,
  type ProductEventProps,
  type SearchQueryKind,
} from "@/lib/search-event";

export type { ProductEventName, ProductEventProps, SearchQueryKind };
export { sanitizeProductEventProps };

export function queryKindForAnalytics(query: string): SearchQueryKind {
  return queryKind(query);
}

export function trackProductEvent(
  name: ProductEventName,
  props: ProductEventProps,
  send: (event: string, data: Record<string, string>) => void = () => {},
): void {
  if (analyticsSessionGate.isDisabled()) return;
  send(name, sanitizeProductEventProps(props));
}

export async function trackBrowserProductEvent(
  name: ProductEventName,
  props: ProductEventProps,
): Promise<void> {
  if (typeof window === "undefined" || analyticsSessionGate.isDisabled()) return;
  try {
    const { track } = await import("@vercel/analytics");
    track(name, sanitizeProductEventProps(props));
  } catch {
    // Analytics must never break search.
  }
}
