import assert from "node:assert/strict";
import test from "node:test";

// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
import { browserAnalyticsDisabled, createAnalyticsSessionGate, reconcileAnalyticsStorageEvent, sanitizeAnalyticsEvent } from "./analytics-privacy.ts";

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

test("treats DNT=1 and stored 1 as disabled", () => {
  assert.equal(browserAnalyticsDisabled(null, "1"), true);
  assert.equal(browserAnalyticsDisabled(null, "yes"), true);
  assert.equal(browserAnalyticsDisabled("1", "0"), true);
  assert.equal(browserAnalyticsDisabled(null, "0"), false);
});
