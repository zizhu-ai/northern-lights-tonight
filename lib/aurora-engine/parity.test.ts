import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
import { compute_bundle } from "./index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = resolve(here, "../../engine/fixtures");
const cases = [
  "happy_fresh",
  "cross_midnight",
  "dst_spring_forward",
  "dst_fall_back",
  "best_window_elapsed",
  "ovation_missing",
  "kp_missing",
  "aurora_both_missing",
  "cloud_partial_missing",
  "cloud_all_missing",
  "ovation_age_46m",
  "ovation_age_91m",
  "kp_slots_missing",
  "malformed_ovation",
  "signals_conflict",
] as const;

const readJson = (path: string): any => JSON.parse(readFileSync(path, "utf8"));
const dossiers = readJson(join(fixtures, "dossiers.json"));
const slugs: string[] = dossiers.locations.map((location: any) => location.slug);

const projectSnapshot = (snapshot: any): any => ({
  status: snapshot.status,
  confidence: snapshot.confidence,
  reason_codes: snapshot.reason_codes,
  best_window_start: snapshot.best_window_start,
  best_window_end: snapshot.best_window_end,
  answer_sentence: snapshot.answer_sentence,
  points: snapshot.points.map((point: any) => ({
    id: point.id,
    status: point.status,
    confidence: point.confidence,
    aurora_reach: point.aurora_reach,
    cloud_block: point.cloud_block,
    main_obstacle: point.main_obstacle,
  })),
  windows: snapshot.windows.map((window: any) => ({
    start: window.start,
    end: window.end,
    skip: window.skip,
    status: window.status,
    aurora_reach: window.aurora_reach,
    cloud_block: window.cloud_block,
    source: window.source,
    codes: window.codes,
  })),
});

for (const caseId of cases) {
  test(`${caseId}: 15/15 locations match Python goldens`, () => {
    const root = join(fixtures, caseId);
    const metadata = readJson(join(root, "case.json"));
    const actual = compute_bundle(
      metadata.now,
      readJson(join(root, "raw/ovation.json")),
      readJson(join(root, "raw/kp.json")),
      readJson(join(root, "raw/clouds.json")),
      dossiers,
    );
    const expectedLatest = readJson(join(root, "expected/latest.json"));
    assert.equal(actual.ovation_ok, expectedLatest.ovation_ok, `${caseId}/ovation expiration path`);
    if (caseId === "best_window_elapsed") assert.equal(actual.ovation_ok, false, "39h-old OVATION must use stale_90 path");
    assert.equal(actual.locations.length, 15);
    if (caseId === "signals_conflict") {
      const conflicts = actual.locations.filter((snapshot: any) => snapshot.reason_codes.includes("SIGNALS_CONFLICT"));
      assert.ok(conflicts.length > 0, "fixture must exercise near-NO versus far-GO conflict");
      for (const snapshot of conflicts) {
        assert.equal(snapshot.status, "MAYBE");
        assert.equal(snapshot.confidence, "low");
      }
    }
    assert.deepEqual(actual.locations.map((snapshot: any) => snapshot.location_slug), slugs);
    for (const snapshot of actual.locations) {
      const expected = readJson(join(root, `expected/${snapshot.location_slug}.json`));
      assert.deepEqual(projectSnapshot(snapshot), projectSnapshot(expected), `${caseId}/${snapshot.location_slug}`);
    }
  });
}

test("fixture matrix is exactly 15 cases x 15 locations", () => {
  assert.equal(cases.length, 15);
  assert.equal(slugs.length, 15);
  for (const caseId of cases) {
    const expectedFiles = readdirSync(join(fixtures, caseId, "expected")).filter((name) => name !== "latest.json" && name.endsWith(".json"));
    assert.equal(expectedFiles.length, 15, caseId);
  }
});
