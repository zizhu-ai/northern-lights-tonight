import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { ForecastDossier } from "./forecast-places";
// @ts-ignore TS5097
import { prepareForecastViewEvent } from "./forecast-view-event.ts";
// @ts-ignore TS5097
import {
  analyticsStateSlug,
  faqAnalyticsId,
  isAllowedProductEventName,
  pageTypeFromPath,
  PRODUCT_EVENT_NAMES,
  sanitizeProductEventProps,
  trackProductEvent,
  type ProductEventName,
  type ProductEventProps,
} from "./search-event.ts";

function capture(name: ProductEventName, props: ProductEventProps, disabled = false) {
  const sent: Array<{ name: string; props: Record<string, string> }> = [];
  trackProductEvent(
    name,
    props,
    (event, data) => {
      sent.push({ name: event, props: data });
    },
    disabled,
  );
  return sent;
}

test("product events drop raw query, ZIP, and coordinates", () => {
  const safe = sanitizeProductEventProps({
    source: "home",
    query_kind: "zip",
    result: "success",
    destination: "forecast",
    q: "80521",
    zip: "80521",
    lat: "40.585",
    lng: "-105.084",
  });
  assert.deepEqual(safe, {
    source: "home",
    query_kind: "zip",
    result: "success",
    destination: "forecast",
  });
  assert.equal("q" in safe, false);
  assert.equal("zip" in safe, false);
  assert.equal("lat" in safe, false);
});

test("event name allowlist includes new events and rejects city_search and outbound_click", () => {
  for (const name of [
    "search_submit",
    "search_match",
    "forecast_view",
    "state_nav",
    "faq_expand",
    "scroll_depth",
    "engaged_60s",
  ] as const) {
    assert.equal(isAllowedProductEventName(name), true);
    assert.equal(PRODUCT_EVENT_NAMES.includes(name), true);
  }
  assert.equal(isAllowedProductEventName("city_search"), false);
  assert.equal(isAllowedProductEventName("outbound_click"), false);
  const sent: string[] = [];
  trackProductEvent("city_search" as ProductEventName, { q: "secret" }, (name) => {
    sent.push(name);
  });
  assert.deepEqual(sent, []);
});

test("trackProductEvent is a no-op when the session gate is disabled", () => {
  assert.deepEqual(capture("forecast_view", { page_type: "home", verdict: "GO" }, true), []);
});

test("forecast_view after SPA navigation uses the new sanitized page_location once per view", () => {
  const once = { lastPageLocation: null as string | null };

  const ohio = prepareForecastViewEvent(
    "https://aurora-tonight.com/forecast/ohio",
    { pageType: "forecast", state: "ohio", verdict: "GO" },
    once,
  );
  assert.deepEqual(ohio, {
    page_type: "forecast",
    state: "ohio",
    verdict: "GO",
    page_location: "https://aurora-tonight.com/forecast/ohio",
  });
  assert.deepEqual(
    capture("forecast_view", ohio!),
    [{ name: "forecast_view", props: ohio }],
  );

  assert.equal(
    prepareForecastViewEvent(
      "https://aurora-tonight.com/forecast/ohio?utm_source=share",
      { pageType: "forecast", state: "ohio", verdict: "MAYBE" },
      once,
    ),
    null,
  );

  const indiana = prepareForecastViewEvent(
    "https://aurora-tonight.com/forecast/indiana",
    { pageType: "forecast", state: "indiana", verdict: "NO" },
    once,
  );
  assert.equal(indiana?.page_location, "https://aurora-tonight.com/forecast/indiana");
  assert.equal(indiana?.state, "indiana");
  assert.deepEqual(capture("forecast_view", indiana!), [
    { name: "forecast_view", props: indiana },
  ]);

  const pin = prepareForecastViewEvent(
    "https://aurora-tonight.com/view?lat=40.123&lng=-86.100&name=Home",
    { pageType: "view", verdict: "UNKNOWN" },
    once,
  );
  assert.equal(pin?.page_location, "https://aurora-tonight.com/view");
  assert.equal("lat" in (pin ?? {}), false);
  assert.equal("name" in (pin ?? {}), false);
});

test("forecast_view param shape is page_type, optional state, and verdict", () => {
  const home = capture("forecast_view", {
    page_type: "home",
    verdict: "MAYBE",
    q: "fort collins",
  });
  assert.deepEqual(home, [
    { name: "forecast_view", props: { page_type: "home", verdict: "MAYBE" } },
  ]);

  const forecast = capture("forecast_view", {
    page_type: "forecast",
    state: "ohio",
    verdict: "GO",
  });
  assert.deepEqual(forecast, [
    {
      name: "forecast_view",
      props: { page_type: "forecast", state: "ohio", verdict: "GO" },
    },
  ]);

  const view = capture("forecast_view", {
    page_type: "view",
    verdict: "UNAVAILABLE",
  });
  assert.deepEqual(view[0]?.props, { page_type: "view", verdict: "UNAVAILABLE" });
  assert.equal("state" in (view[0]?.props ?? {}), false);
});

test("search_submit and search_match expose source method query_kind and destination without the raw query", () => {
  const submit = capture("search_submit", {
    source: "view",
    query_kind: "zip",
    method: "typed",
    q: "80521",
  });
  assert.deepEqual(submit, [
    {
      name: "search_submit",
      props: { source: "view", query_kind: "zip", method: "typed" },
    },
  ]);

  const match = capture("search_match", {
    source: "not_found",
    result: "success",
    query_kind: "text",
    method: "typed",
    destination: "forecast",
    name: "Cleveland",
  });
  assert.deepEqual(match, [
    {
      name: "search_match",
      props: {
        source: "not_found",
        result: "success",
        query_kind: "text",
        method: "typed",
        destination: "forecast",
      },
    },
  ]);
  assert.equal("name" in (match[0]?.props ?? {}), false);
});

test("state_nav param shape is from_page_type and to_state", () => {
  assert.deepEqual(
    capture("state_nav", { from_page_type: "home", to_state: "illinois" }),
    [{ name: "state_nav", props: { from_page_type: "home", to_state: "illinois" } }],
  );
});

test("faq_expand sends a short slug id instead of free-text answers", () => {
  const id = faqAnalyticsId("Can you see the northern lights in Cleveland tonight?", 0);
  assert.equal(id, "can-you-see-the-northern-lights-in-cleveland-ton");
  assert.ok(id.length <= 48);
  assert.match(id, /^[a-z0-9-]+$/);
  assert.deepEqual(capture("faq_expand", { faq_id: id }), [
    { name: "faq_expand", props: { faq_id: id } },
  ]);
});

test("scroll_depth is 50 percent only and engaged_60s carries page_type", () => {
  assert.deepEqual(capture("scroll_depth", { percent: "50", page_type: "forecast" }), [
    { name: "scroll_depth", props: { percent: "50", page_type: "forecast" } },
  ]);
  assert.deepEqual(capture("engaged_60s", { page_type: "home" }), [
    { name: "engaged_60s", props: { page_type: "home" } },
  ]);
});

test("pageTypeFromPath maps known routes", () => {
  assert.equal(pageTypeFromPath("/"), "home");
  assert.equal(pageTypeFromPath("/forecast/ohio"), "forecast");
  assert.equal(pageTypeFromPath("/view"), "view");
  assert.equal(pageTypeFromPath("/near-me"), "near_me");
  assert.equal(pageTypeFromPath("/guides/where-to-see-northern-lights"), "guides");
  assert.equal(pageTypeFromPath("/privacy"), "other");
});

test("analyticsStateSlug uses parent_slug for city dossiers and omits unmapped cities", () => {
  const dossiers = (
    JSON.parse(readFileSync(new URL("../地点档案/wave1.json", import.meta.url), "utf8")) as {
      locations: ForecastDossier[];
    }
  ).locations;
  const bySlug = (slug: string) => {
    const found = dossiers.find((item) => item.slug === slug);
    assert.ok(found, slug);
    return found;
  };
  assert.equal(analyticsStateSlug(bySlug("ohio")), "ohio");
  assert.equal(analyticsStateSlug(bySlug("chicago")), "illinois");
  assert.equal(analyticsStateSlug(bySlug("fairbanks")), "alaska");
  assert.equal(analyticsStateSlug(bySlug("seattle")), undefined);
});
