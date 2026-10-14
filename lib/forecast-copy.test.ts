import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// @ts-ignore TS5097
import {
  forecastLead,
  h1For,
  nearbyAnchorText,
  nearbyWindowLine,
  ovalReachSentence,
  repeatedDossierSentences,
  showNorthSouthSplit,
  seoDescription,
  titleFor,
  whatTimeTonightCopy,
} from "./forecast-copy.ts";
import type { ForecastDossier } from "./forecast-places";

const dossiers = (
  JSON.parse(readFileSync(new URL("../地点档案/wave1.json", import.meta.url), "utf8")) as {
    locations: ForecastDossier[];
  }
).locations;

test("forecast titles and H1 contain Northern Lights Tonight", () => {
  for (const dossier of dossiers) {
    const title = titleFor(dossier);
    const h1 = h1For(dossier);
    assert.ok(title.toLowerCase().includes("northern lights tonight"), title);
    if (dossier.slug === "maine") {
      assert.equal(h1, "Can You See the Northern Lights in Maine Tonight?");
    } else {
      assert.equal(h1, `Northern Lights Tonight in ${dossier.name}`);
    }
    assert.ok(title.length <= 60, `${dossier.slug} title length ${title.length}: ${title}`);
  }
});

test("Illinois and Maine titles stay on the existing Visibility & Best Time form", () => {
  const illinois = dossiers.find((item) => item.slug === "illinois");
  const maine = dossiers.find((item) => item.slug === "maine");
  assert.ok(illinois && maine);
  assert.equal(titleFor(illinois), "Northern Lights Tonight in Illinois: Visibility & Best Time");
  assert.equal(titleFor(maine), "Northern Lights Tonight in Maine: Visibility & Best Time");
  assert.equal(h1For(illinois), "Northern Lights Tonight in Illinois");
});

test("forecast lead prefixes the main term when the verdict sentence omits it", () => {
  const ohio = dossiers.find((item) => item.slug === "ohio");
  assert.ok(ohio);
  const unknown =
    "Ohio · Cleveland area · cannot judge tonight. Source data is too old to treat as live.";
  const lead = forecastLead(ohio, unknown);
  assert.ok(lead.toLowerCase().includes("northern lights tonight"));
  assert.ok(lead.includes("cannot judge tonight"));
  const already = "Northern lights tonight in Ohio are not worth a special trip.";
  assert.equal(forecastLead(ohio, already), already);
});

test("template blocks do not reuse the same sentence", () => {
  for (const dossier of dossiers) {
    assert.deepEqual(repeatedDossierSentences(dossier), [], dossier.slug);
  }
});

test("seoDescription omits Best window when the window is unknown", () => {
  const ohio = dossiers.find((item) => item.slug === "ohio");
  assert.ok(ohio);
  const description = seoDescription(ohio, "Cleveland", {
    status: "NO",
    mainIssue: "Aurora activity is not expected to reach Ohio tonight.",
    bestWindow: "—",
  });
  assert.equal(description.includes("Best window"), false);
  assert.equal(description.includes("—."), false);
  assert.match(description, /Northern Lights Ohio tonight: NO from Cleveland\./);
  assert.match(description, /Aurora activity is not expected to reach Ohio tonight/);
});

test("seoDescription keeps Best window when a real window exists", () => {
  const ohio = dossiers.find((item) => item.slug === "ohio");
  assert.ok(ohio);
  const description = seoDescription(ohio, "Cleveland", {
    status: "MAYBE",
    mainIssue: "Clouds are the main uncertainty.",
    bestWindow: "10:00 PM–12:00 AM ET",
  });
  assert.match(description, /Best window 10:00 PM–12:00 AM ET\./);
});

test("nearby window line and anchors stay gated", () => {
  const ohio = dossiers.find((item) => item.slug === "ohio");
  const illinois = dossiers.find((item) => item.slug === "illinois");
  assert.ok(ohio && illinois);
  assert.equal(nearbyWindowLine("—"), null);
  assert.equal(nearbyWindowLine("10:00 PM–11:00 PM CT"), "Best window: 10:00 PM–11:00 PM CT");
  assert.equal(nearbyAnchorText(ohio, "Indiana"), "Indiana");
  assert.equal(nearbyAnchorText(illinois, "Wisconsin"), "Northern lights Wisconsin tonight");
});

test("Illinois and Maine descriptions stay natural, bind the verdict, and stay under 160 characters", () => {
  const illinois = dossiers.find((item) => item.slug === "illinois");
  const maine = dossiers.find((item) => item.slug === "maine");
  assert.ok(illinois && maine);
  const il = seoDescription(illinois, "Rockford", {
    status: "NO",
    mainIssue: "Aurora activity is not expected to reach Illinois tonight.",
    bestWindow: "—",
  });
  assert.ok(il.toLowerCase().includes("northern lights illinois"));
  assert.match(il, /\bNO\b/);
  assert.equal(il.includes("Northern Illinois, on strong storms"), false);
  assert.ok(il.length <= 160, il.length);
  assert.ok(il.length >= 70, il.length);
  const me = seoDescription(maine, "Bangor", {
    status: "NO",
    mainIssue: "Aurora activity is not expected to reach Maine tonight.",
    bestWindow: "—",
  });
  assert.ok(me.toLowerCase().includes("northern lights in maine"));
  assert.match(me, /\bNO\b/);
  assert.equal(me.includes("Tonight from Bangor:"), false);
  assert.match(me, /Bangor is NO tonight/);
  assert.ok(me.length <= 160, me.length);
  assert.ok(me.length >= 70, me.length);
});

test("Maine north-south split is hidden when both points share a status", () => {
  assert.equal(showNorthSouthSplit("NO", "NO"), false);
  assert.equal(showNorthSouthSplit("MAYBE", "NO"), true);
  assert.equal(showNorthSouthSplit(null, "NO"), false);
});

test("oval reach copy does not say is none", () => {
  assert.equal(
    ovalReachSentence("Rockford", "none"),
    "Tonight the oval does not reach Rockford.",
  );
  assert.equal(
    ovalReachSentence("Rockford", "horizon"),
    "Tonight the oval reaches the horizon at Rockford.",
  );
  assert.equal(
    ovalReachSentence("Rockford", null),
    "Tonight’s oval reach at Rockford is unknown in the current snapshot.",
  );
});

test("Maine lead uses in Maine tonight and what-time copy binds the window", () => {
  const maine = dossiers.find((item) => item.slug === "maine");
  const illinois = dossiers.find((item) => item.slug === "illinois");
  assert.ok(maine && illinois);
  assert.equal(
    forecastLead(maine, "NO (Bangor area). Not worth a special trip tonight."),
    "Northern lights in Maine tonight: NO (Bangor area). Not worth a special trip tonight.",
  );
  const noWindow = whatTimeTonightCopy(illinois, {
    status: "NO",
    bestWindow: "—",
    windows: [],
  });
  assert.match(noWindow, /no useful window in Illinois/);
  assert.equal(noWindow.includes("10 pm"), false);
  const withWindow = whatTimeTonightCopy(illinois, {
    status: "MAYBE",
    bestWindow: "10:00 PM–12:00 AM CT",
    windows: [
      { start: "2026-10-14T03:00:00.000Z", end: "2026-10-14T03:30:00.000Z", skip: false },
      { start: "2026-10-14T07:00:00.000Z", end: "2026-10-14T07:30:00.000Z", skip: false },
    ],
  });
  assert.match(withWindow, /best window in Illinois is 10:00 PM–12:00 AM CT/);
  assert.match(withWindow, /30-minute table/);
});
