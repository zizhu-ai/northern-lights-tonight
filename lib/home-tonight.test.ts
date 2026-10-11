import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import copy from "../content/ui-copy.json" with { type: "json" };

// @ts-ignore TS5097
import { clampWords, homeCityCards, homeDirectAnswer, overallHomeStatus, pickBestWindowPlace, wordCount, type HomePlaceReading } from "./home-overview.ts";
import type { ForecastDossier } from "./forecast-places";

const dossiers = (
  JSON.parse(readFileSync(new URL("../地点档案/wave1.json", import.meta.url), "utf8")) as {
    locations: ForecastDossier[];
  }
).locations;

function dossier(slug: string): ForecastDossier {
  const found = dossiers.find((item) => item.slug === slug);
  assert.ok(found, slug);
  return found;
}

function row(slug: string, status: "GO" | "MAYBE" | "NO" | "UNKNOWN"): HomePlaceReading {
  const place = dossier(slug);
  return {
    dossier: place,
    snapshot: {
      location_slug: slug,
      headline_point_name: place.sample_points[0]?.name ?? place.name,
      status,
      confidence: "medium",
      best_window_start: "2026-10-11T04:00:00.000Z",
      best_window_end: "2026-10-11T04:30:00.000Z",
      main_obstacle: status === "NO" ? "AURORA_NO_REACH" : "NONE",
      main_obstacle_text:
        status === "NO"
          ? "Aurora activity is not expected to reach this place tonight."
          : "Conditions line up well enough to try.",
      answer_sentence: `${status} in ${place.name}.`,
    },
  };
}

test("overall status prefers GO over MAYBE over NO over UNKNOWN", () => {
  assert.equal(overallHomeStatus([row("ohio", "NO"), row("fairbanks", "GO")]), "GO");
  assert.equal(overallHomeStatus([row("ohio", "NO"), row("wisconsin", "MAYBE")]), "MAYBE");
  assert.equal(overallHomeStatus([row("ohio", "NO"), row("indiana", "NO")]), "NO");
  assert.equal(
    overallHomeStatus([
      { dossier: dossier("ohio"), snapshot: null },
      { dossier: dossier("chicago"), snapshot: null },
    ]),
    "UNKNOWN",
  );
});

test("best window place is the highest-latitude GO, then MAYBE", () => {
  const best = pickBestWindowPlace([row("ohio", "NO"), row("fairbanks", "GO"), row("chicago", "MAYBE")]);
  assert.equal(best?.dossier.slug, "fairbanks");
});

test("homepage direct answer stays 40-60 words and names northern lights tonight", () => {
  const rows = [row("fairbanks", "GO"), row("ohio", "NO"), row("chicago", "NO")];
  const best = pickBestWindowPlace(rows);
  const answer = homeDirectAnswer(rows, best);
  assert.ok(answer.toLowerCase().includes("northern lights tonight"));
  const words = wordCount(answer);
  assert.ok(words >= 40, String(words));
  assert.ok(words <= 60, String(words));
  const unknown = homeDirectAnswer(
    [
      { dossier: dossier("ohio"), snapshot: null },
      { dossier: dossier("chicago"), snapshot: null },
    ],
    null,
  );
  assert.ok(unknown.toLowerCase().includes("northern lights tonight"));
  assert.ok(wordCount(unknown) >= 40 && wordCount(unknown) <= 60, String(wordCount(unknown)));
  assert.equal(clampWords("one two", 4, 6, "three four five"), "one two three four");
});

test("stale UNKNOWN homepage city cards keep magnetic latitude and drop leftover tonight values", () => {
  const ohio = dossier("ohio");
  const cards = homeCityCards([
    {
      dossier: ohio,
      snapshot: {
        location_slug: "ohio",
        headline_point_name: "Cleveland",
        status: "UNKNOWN",
        confidence: "low",
        best_window_start: "2026-10-10T04:00:00.000Z",
        best_window_end: "2026-10-10T04:30:00.000Z",
        main_obstacle: "AURORA_NO_REACH",
        main_obstacle_text: "Aurora activity is not expected to reach Ohio tonight.",
        answer_sentence: "UNKNOWN in Ohio.",
        points: [
          {
            id: "cleveland",
            name: "Cleveland",
            status: "UNKNOWN",
            confidence: "low",
            aurora_reach: "horizon",
            cloud_block: "socked",
            urban: true,
            main_obstacle: "CLOUD_BLOCKED",
          },
        ],
      },
    },
  ]);
  assert.equal(cards.length, 1);
  assert.equal(cards[0]?.city, "Cleveland");
  assert.equal(cards[0]?.status, "UNKNOWN");
  assert.ok(cards[0]?.reason.includes("50.7"));
  assert.ok(cards[0]?.reason.includes(copy.verdict.stale_main_issue));
  assert.equal(cards[0]?.reason.includes("not expected to reach"), false);
  assert.equal(cards[0]?.reason.includes("Cloud cover is likely to block"), false);
  assert.equal(cards[0]?.reason.includes("horizon"), false);
});
