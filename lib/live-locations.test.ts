import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// @ts-ignore TS5097
import { compute_bundle } from "./aurora-engine/index.ts";

const WAVE_TWO_SLUGS = [
  "new-york",
  "pennsylvania",
  "vermont",
  "new-hampshire",
  "montana",
  "idaho",
  "north-dakota",
  "south-dakota",
  "iowa",
] as const;

const wave1 = JSON.parse(
  readFileSync(new URL("../地点档案/wave1.json", import.meta.url), "utf8"),
) as { locations: Array<{ slug: string; sample_points: unknown[] }> };

test("live NOAA/Open-Meteo compute uses every wave1 dossier, including the nine new states", () => {
  const slugs = wave1.locations.map((location) => location.slug);
  assert.equal(slugs.length, 24);
  for (const slug of WAVE_TWO_SLUGS) {
    assert.ok(slugs.includes(slug), slug);
  }
  const bundle = compute_bundle("2026-10-11T04:00:00.000Z", null, [], {}, wave1);
  const computed = (bundle.locations as Array<{ location_slug: string }>).map(
    (row) => row.location_slug,
  );
  assert.equal(computed.length, 24);
  assert.deepEqual(computed, slugs);
  const points = wave1.locations.flatMap((loc) => loc.sample_points as Array<{ lat: number; lng: number }>);
  assert.equal(points.length, 68);
  const unique = new Set(points.map((point) => `${point.lat.toFixed(3)},${point.lng.toFixed(3)}`));
  assert.equal(unique.size, 67);
});
