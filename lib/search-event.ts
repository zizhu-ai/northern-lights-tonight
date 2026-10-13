export type SearchQueryKind = "empty" | "zip" | "text";

export type SearchAnalyticsSource =
  | "home"
  | "find_place"
  | "change_place"
  | "near_me"
  | "view"
  | "not_found";

export type AnalyticsPageType =
  | "home"
  | "forecast"
  | "view"
  | "near_me"
  | "not_found"
  | "guides"
  | "other";

export type ProductEventName =
  | "search_submit"
  | "search_match"
  | "result_shown"
  | "locate_fail"
  | "change_place"
  | "forecast_view"
  | "state_nav"
  | "faq_expand"
  | "scroll_depth"
  | "engaged_60s";

export const PRODUCT_EVENT_NAMES = [
  "search_submit",
  "search_match",
  "result_shown",
  "locate_fail",
  "change_place",
  "forecast_view",
  "state_nav",
  "faq_expand",
  "scroll_depth",
  "engaged_60s",
] as const satisfies readonly ProductEventName[];

export type VerdictAnalyticsStatus = "GO" | "MAYBE" | "NO" | "UNKNOWN" | "UNAVAILABLE";

export type SearchMatchMethod = "typed" | "gps" | "suggestion";

export type ProductEventProps = {
  source?: SearchAnalyticsSource;
  query_kind?: SearchQueryKind;
  result?: "success" | "fail" | "ambiguous";
  failure_type?:
    | "empty"
    | "no_match"
    | "zip_not_found"
    | "gps_denied"
    | "gps_unavailable"
    | "gps_timeout";
  destination?: "forecast" | "view";
  via?: "card" | "sticky";
  method?: SearchMatchMethod;
  page_type?: AnalyticsPageType;
  from_page_type?: AnalyticsPageType;
  state?: string;
  to_state?: string;
  verdict?: VerdictAnalyticsStatus;
  faq_id?: string;
  percent?: "50";
};

const BLOCKED_KEYS = new Set([
  "q",
  "query",
  "zip",
  "lat",
  "lng",
  "coords",
  "name",
  "place",
]);

export function isAllowedProductEventName(name: string): name is ProductEventName {
  return (PRODUCT_EVENT_NAMES as readonly string[]).includes(name);
}

export function sanitizeProductEventProps(
  props: ProductEventProps & Record<string, unknown>,
): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(props)) {
    if (BLOCKED_KEYS.has(key) || value === undefined) continue;
    safe[key] = String(value);
  }
  return safe;
}

export function trackProductEvent(
  name: ProductEventName,
  props: ProductEventProps,
  send: (event: string, data: Record<string, string>) => void = () => {},
  disabled = false,
): void {
  if (!isAllowedProductEventName(name) || disabled) return;
  send(name, sanitizeProductEventProps(props));
}

export function pageTypeFromPath(pathname: string): AnalyticsPageType {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/forecast/")) return "forecast";
  if (pathname === "/view" || pathname.startsWith("/view/")) return "view";
  if (pathname === "/near-me") return "near_me";
  if (pathname.startsWith("/guides/")) return "guides";
  return "other";
}

export function faqAnalyticsId(question: string, index: number): string {
  const slug = question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || `faq-${index}`;
}

export function analyticsStateSlug(dossier: {
  slug: string;
  location_type: "state" | "city";
  parent_slug?: string | null;
}): string | undefined {
  if (dossier.location_type === "state") return dossier.slug;
  if (dossier.parent_slug) return dossier.parent_slug;
  return undefined;
}
