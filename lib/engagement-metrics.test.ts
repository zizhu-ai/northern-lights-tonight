import assert from "node:assert/strict";
import test from "node:test";

// @ts-ignore TS5097
import {
  createVisibleTimeTracker,
  shouldEmitScrollDepth50,
  visibleScrollPercent,
} from "./engagement-metrics.ts";

test("scroll depth 50 fires once when the user has scrolled halfway", () => {
  assert.equal(visibleScrollPercent(0, 800, 2000), 0);
  assert.equal(visibleScrollPercent(600, 800, 2000), 50);
  assert.equal(visibleScrollPercent(1200, 800, 2000), 100);
  assert.equal(visibleScrollPercent(0, 800, 800), null);
  assert.equal(shouldEmitScrollDepth50(50, false), true);
  assert.equal(shouldEmitScrollDepth50(49, false), false);
  assert.equal(shouldEmitScrollDepth50(90, true), false);
  assert.equal(shouldEmitScrollDepth50(null, false), false);
});

test("engaged_60s counts only visible time and fires once", () => {
  const tracker = createVisibleTimeTracker(60_000);
  tracker.onVisible(0);
  assert.equal(tracker.tick(30_000), false);
  tracker.onHidden(30_000);
  tracker.onVisible(90_000);
  assert.equal(tracker.tick(119_000), false);
  assert.equal(tracker.tick(120_000), true);
  assert.equal(tracker.tick(180_000), false);
});
