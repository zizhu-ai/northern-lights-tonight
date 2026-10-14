import assert from "node:assert/strict";
import test from "node:test";

// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
import {
  analyticsAllowed,
  browserAnalyticsDisabled,
  createAnalyticsSessionGate,
  createPageViewSequence,
  ga4ConfigFields,
  isDoNotTrackEnabled,
  isGaProductionHost,
  isValidGaMeasurementId,
  readBrowserDoNotTrack,
  reconcileAnalyticsStorageEvent,
  sanitizeAnalyticsEvent,
  sanitizePageLocation,
  shouldLoadGoogleAnalytics,
} from "./analytics-privacy.ts";

test("session gate defaults enabled and can be disabled", () => {
  const gate = createAnalyticsSessionGate();

  assert.equal(gate.isDisabled(), false);
  gate.disable();
  assert.equal(gate.isDisabled(), true);
});

test("session gate can be re-enabled after explicit opt-in", () => {
  const gate = createAnalyticsSessionGate();

  gate.disable();
  gate.enable();
  assert.equal(gate.isDisabled(), false);
});

test("storage events reconcile from the current readable value", () => {
  const gate = createAnalyticsSessionGate();

  assert.equal(reconcileAnalyticsStorageEvent(gate, () => "1"), "disabled");
  assert.equal(gate.isDisabled(), true);
  assert.equal(reconcileAnalyticsStorageEvent(gate, () => null), "enabled");
  assert.equal(gate.isDisabled(), false);
});

test("storage event read failures stay unavailable and fail closed", () => {
  const gate = createAnalyticsSessionGate();

  assert.equal(
    reconcileAnalyticsStorageEvent(gate, () => {
      throw new Error("storage denied");
    }),
    "unavailable",
  );
  assert.equal(gate.isDisabled(), true);
});

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

test("sanitizePageLocation strips lat lng name q zip and similar keys", () => {
  assert.equal(
    sanitizePageLocation(
      "https://aurora-tonight.com/view?lat=42.123&lng=-71.456&name=Home&q=80521&recheck=1#hash",
    ),
    "https://aurora-tonight.com/view",
  );
  assert.equal(
    sanitizePageLocation("/api/search?q=fort+collins&zip=80521"),
    "https://aurora-tonight.com/api/search",
  );
  assert.equal(
    sanitizePageLocation("https://aurora-tonight.com/view?latitude=40&longitude=-105&place=x"),
    "https://aurora-tonight.com/view",
  );
});

test("sanitizePageLocation keeps non-PII query params", () => {
  assert.equal(
    sanitizePageLocation("https://aurora-tonight.com/forecast/ohio?utm_source=share&lat=40"),
    "https://aurora-tonight.com/forecast/ohio?utm_source=share",
  );
});

test("treats DNT=1 and stored 1 as disabled", () => {
  assert.equal(browserAnalyticsDisabled(null, "1"), true);
  assert.equal(browserAnalyticsDisabled(null, "yes"), true);
  assert.equal(browserAnalyticsDisabled("1", "0"), true);
  assert.equal(browserAnalyticsDisabled(null, "0"), false);
});

test("readBrowserDoNotTrack checks navigator, window, and msDoNotTrack", () => {
  assert.equal(readBrowserDoNotTrack({ doNotTrack: "1" }, { doNotTrack: "0" }), "1");
  assert.equal(readBrowserDoNotTrack({ doNotTrack: null }, { doNotTrack: "1" }), "1");
  assert.equal(readBrowserDoNotTrack({ msDoNotTrack: "1" }, {}), "1");
  assert.equal(readBrowserDoNotTrack({ doNotTrack: "unspecified" }, {}), "unspecified");
  assert.equal(isDoNotTrackEnabled("1"), true);
  assert.equal(isDoNotTrackEnabled("yes"), true);
  assert.equal(isDoNotTrackEnabled("0"), false);
  assert.equal(isDoNotTrackEnabled("unspecified"), false);
});

test("DNT keeps analytics off even when the stored opt-out is cleared", () => {
  const gate = createAnalyticsSessionGate();
  assert.equal(
    reconcileAnalyticsStorageEvent(gate, () => null, "1", "aurora-tonight.com"),
    "disabled",
  );
  assert.equal(gate.isDisabled(), true);
});

test("preview and workers.dev hosts keep the session gate disabled", () => {
  const gate = createAnalyticsSessionGate();
  assert.equal(
    reconcileAnalyticsStorageEvent(gate, () => null, null, "aurora-tonight.workers.dev"),
    "disabled",
  );
  assert.equal(
    reconcileAnalyticsStorageEvent(gate, () => null, null, "aurora-tonight.com"),
    "enabled",
  );
});

test("host gating only loads GA on aurora-tonight production hosts", () => {
  assert.equal(isGaProductionHost("aurora-tonight.com"), true);
  assert.equal(isGaProductionHost("www.aurora-tonight.com"), true);
  assert.equal(isGaProductionHost("aurora-tonight.workers.dev"), false);
  assert.equal(isGaProductionHost("localhost"), false);
  assert.equal(isValidGaMeasurementId("G-PLGHFD5FZ8"), true);
  assert.equal(isValidGaMeasurementId(""), false);
  assert.equal(isValidGaMeasurementId("GTM-XXXX"), false);

  const allowed = {
    measurementId: "G-PLGHFD5FZ8",
    storageOptOut: null,
    dnt: null,
  };
  assert.equal(
    shouldLoadGoogleAnalytics({ ...allowed, hostname: "aurora-tonight.com" }),
    true,
  );
  assert.equal(
    shouldLoadGoogleAnalytics({ ...allowed, hostname: "www.aurora-tonight.com" }),
    true,
  );
  assert.equal(
    shouldLoadGoogleAnalytics({ ...allowed, hostname: "aurora-tonight.workers.dev" }),
    false,
  );
  assert.equal(
    shouldLoadGoogleAnalytics({ ...allowed, hostname: "preview.aurora-tonight.workers.dev" }),
    false,
  );
  assert.equal(
    analyticsAllowed({
      ...allowed,
      hostname: "aurora-tonight.com",
      storageOptOut: "1",
    }),
    false,
  );
  assert.equal(
    analyticsAllowed({
      ...allowed,
      hostname: "aurora-tonight.com",
      dnt: "1",
    }),
    false,
  );
});

test("gtag config disables automatic page_view and uses sanitized URLs", () => {
  const sequence = createPageViewSequence();
  const page = sequence.next(
    "https://aurora-tonight.com/view?lat=40.123&lng=-105.084&name=Fort+Collins",
    "https://aurora-tonight.com/?q=80521",
  );
  assert.deepEqual(page, {
    page_location: "https://aurora-tonight.com/view",
    page_referrer: "https://aurora-tonight.com/",
  });
  assert.deepEqual(ga4ConfigFields(page), {
    send_page_view: false,
    page_location: "https://aurora-tonight.com/view",
    page_referrer: "https://aurora-tonight.com/",
  });

  const next = sequence.next("https://aurora-tonight.com/forecast/ohio", "https://ignored.example");
  assert.equal(next.page_location, "https://aurora-tonight.com/forecast/ohio");
  assert.equal(next.page_referrer, "https://aurora-tonight.com/view");
});
