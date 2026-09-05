export type SearchQueryKind = "empty" | "zip" | "text";

export type SearchAnalyticsSource = "home" | "find_place" | "change_place" | "near_me";

export type ProductEventName =
  | "search_submit"
  | "search_match"
  | "result_shown"
  | "locate_fail"
  | "change_place";

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
