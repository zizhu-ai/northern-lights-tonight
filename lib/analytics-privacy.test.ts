import assert from "node:assert/strict";
import test from "node:test";

// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
import { browserAnalyticsDisabled, sanitizeAnalyticsEvent } from "./analytics-privacy.ts";

test("drops events when local opt-out is enabled", () => {
  assert.equal(sanitizeAnalyticsEvent({ url: "/" }, true), null);
});

test("strips every query and hash from page URLs", () => {
  assert.deepEqual(
    sanitizeAnalyticsEvent(
      { url: "/view?lat=42&lng=-71&name=Home#forecast" },
      false,
    ),
    { url: "/view" },
  );
});

test("treats DNT=1 and stored 1 as disabled", () => {
  assert.equal(browserAnalyticsDisabled(null, "1"), true);
  assert.equal(browserAnalyticsDisabled(null, "yes"), true);
  assert.equal(browserAnalyticsDisabled("1", "0"), true);
  assert.equal(browserAnalyticsDisabled(null, "0"), false);
});
