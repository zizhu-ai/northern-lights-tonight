import assert from "node:assert/strict";
import test from "node:test";

// @ts-ignore TS5097
import { sanitizeProductEventProps } from "./search-event.ts";

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
