import assert from "node:assert/strict";
import test from "node:test";

// @ts-ignore TS5097
import { computeViewReading, isCoordinateLabel, unknownViewReading } from "./view-reading.ts";

const LA = { lat: 34.052, lng: -118.244, name: "Los Angeles, CA", timezone: "America/Los_Angeles" };
const ANCHORAGE = { lat: 61.218, lng: -149.9, name: "Anchorage, AK", timezone: "America/Anchorage" };

test("coordinate labels match the three-decimal fallback used in /view URLs", () => {
  assert.equal(isCoordinateLabel("34.052, -118.244", 34.052, -118.244), true);
  assert.equal(isCoordinateLabel("Los Angeles, CA", 34.052, -118.244), false);
});

test("Los Angeles is NO from magnetic latitude even without aurora products", () => {
  const reading = computeViewReading({
    ...LA,
    now: new Date("2026-01-15T10:00:00.000Z"),
    ovationPayload: null,
    kpPayload: null,
    clouds: null,
  });
  assert.equal(reading.status, "NO");
  assert.equal(reading.mainObstacle, "AURORA_NO_REACH");
  assert.match(reading.mainIssue, /not expected to reach/i);
  assert.ok(reading.magneticLatitude < 45);
  assert.notEqual(reading.generatedAt, "");
});

test("a northern pin without aurora data stays UNKNOWN", () => {
  const reading = computeViewReading({
    ...ANCHORAGE,
    now: new Date("2026-01-15T10:00:00.000Z"),
    ovationPayload: null,
    kpPayload: null,
    clouds: null,
  });
  assert.equal(reading.status, "UNKNOWN");
  assert.equal(reading.mainObstacle, "DATA_MISSING_AURORA");
  assert.equal(reading.source, "missing");
});

test("unknown helper does not invent a GO or MAYBE", () => {
  const reading = unknownViewReading(ANCHORAGE.name, ANCHORAGE.lat, ANCHORAGE.lng, "2026-01-15T10:00:00.000Z");
  assert.equal(reading.status, "UNKNOWN");
  assert.equal(reading.source, "missing");
});

test("fresh OVATION with no reach still yields NO for Los Angeles", () => {
  const now = new Date("2026-01-15T10:00:00.000Z");
  const reading = computeViewReading({
    ...LA,
    now,
    ovationPayload: {
      "Observation Time": "2026-01-15T09:40:00Z",
      "Forecast Time": "2026-01-15T10:30:00Z",
      coordinates: [
        [242, 34, 0],
        [242, 35, 0],
        [241, 34, 0],
        [241, 42, 0],
      ],
    },
    kpPayload: [{ time_tag: "2026-01-15T09:00:00", kp: 2, observed: "observed" }],
    clouds: null,
  });
  assert.equal(reading.status, "NO");
  assert.equal(reading.mainObstacle, "AURORA_NO_REACH");
  assert.equal(reading.source, "live");
});
