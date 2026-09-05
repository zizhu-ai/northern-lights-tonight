import assert from "node:assert/strict";
import test from "node:test";

// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
import { sanitizeBundledLocationRow } from "./bundled-sanitize.ts";
// @ts-ignore TS5097
import { nightSurfacesAgree, resolveNightStatus, shouldTrustStoredAnswer, windowsForNight } from "./verdict-consistency.ts";

/**
 * Production-shaped Michigan row: live engine wrote NO, then a stale/bundled
 * path flipped only `status` to UNKNOWN. Title + hourly stayed NO.
 */
const michiganContradictory = {
  location_slug: "michigan",
  headline_point_name: "Traverse City",
  status: "UNKNOWN" as const,
  confidence: "low" as const,
  main_obstacle: "AURORA_NO_REACH",
  main_obstacle_text: "Aurora activity is not expected to reach Michigan tonight.",
  answer_sentence:
    "NO (Traverse City area). Not worth a special trip tonight. Aurora activity is not expected to reach Michigan tonight.",
  best_window_start: null,
  best_window_end: null,
  windows: [
    {
      start: "2026-09-06T01:45:00.000Z",
      end: "2026-09-06T02:15:00.000Z",
      skip: true,
      status: null,
      codes: ["NOT_DARK_YET"],
    },
    {
      start: "2026-09-06T02:15:00.000Z",
      end: "2026-09-06T02:45:00.000Z",
      skip: false,
      status: "NO" as const,
      codes: ["AURORA_NO_REACH"],
    },
    {
      start: "2026-09-06T02:45:00.000Z",
      end: "2026-09-06T03:15:00.000Z",
      skip: false,
      status: "NO" as const,
      codes: ["AURORA_NO_REACH"],
    },
  ],
};

test("Michigan-style leftover NO title/hours do not mix with an UNKNOWN night", () => {
  const status = resolveNightStatus({ snapshotStatus: michiganContradictory.status });
  assert.equal(status, "UNKNOWN");
  assert.equal(
    shouldTrustStoredAnswer(michiganContradictory.answer_sentence, status),
    false,
  );

  const windows = windowsForNight(michiganContradictory.windows, status);
  assert.equal(windows[0]?.skip, true);
  assert.equal(windows[0]?.status, null);
  assert.ok(
    windows
      .filter((window) => !window.skip)
      .every((window) => (window.status as string | null) === "UNKNOWN"),
  );

  const rebuilt =
    "Michigan · Traverse City area · cannot judge tonight. Source data is too old to treat as live.";
  assert.equal(
    nightSurfacesAgree({
      status,
      answerSentence: rebuilt,
      windows,
    }),
    true,
  );
  assert.equal(
    nightSurfacesAgree({
      status,
      answerSentence: michiganContradictory.answer_sentence,
      windows: michiganContradictory.windows,
    }),
    false,
  );
});

test("sanitize of a stale Michigan NO row rewrites title, hours, and obstacle together", () => {
  const now = new Date("2026-09-05T16:00:00.000Z");
  const generatedAt = new Date(now.getTime() - 13 * 60 * 60_000).toISOString();
  const result = sanitizeBundledLocationRow(
    {
      ...michiganContradictory,
      status: "NO",
    },
    {
      now,
      generatedAt,
      sourceTime: "2026-09-04T20:00:00.000Z",
      auroraUnavailable: true,
    },
  );

  assert.equal(result.status, "UNKNOWN");
  assert.equal(result.main_obstacle, "DATA_STALE");
  assert.match(String(result.answer_sentence), /Cannot judge tonight/);
  assert.doesNotMatch(String(result.answer_sentence), /^NO\b/);
  const windows = result.windows as typeof michiganContradictory.windows;
  assert.equal(windows[0]?.skip, true);
  assert.ok(
    windows
      .filter((window) => !window.skip)
      .every((window) => (window.status as string | null) === "UNKNOWN"),
  );
  assert.equal(
    nightSurfacesAgree({
      status: "UNKNOWN",
      answerSentence: String(result.answer_sentence),
      windows,
    }),
    true,
  );
});

test("a live NO night keeps title, card, and hourly aligned", () => {
  const status = resolveNightStatus({ snapshotStatus: "NO" });
  assert.equal(status, "NO");
  assert.equal(
    shouldTrustStoredAnswer(michiganContradictory.answer_sentence.replace("UNKNOWN", "NO"), status),
    true,
  );
  const windows = windowsForNight(
    [
      { skip: true, status: null },
      { skip: false, status: "NO" as const },
    ],
    status,
  );
  assert.equal(
    nightSurfacesAgree({
      status,
      answerSentence:
        "NO (Traverse City area). Not worth a special trip tonight. Aurora activity is not expected to reach Michigan tonight.",
      windows,
    }),
    true,
  );
});
