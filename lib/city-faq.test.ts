import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// @ts-ignore TS5097
import { cityTonightAnswer, localFaqsForPage } from "./city-faq.ts";
import type { ForecastDossier } from "./forecast-places";
import type { ForecastPoint, ForecastSnapshot } from "./snapshots";

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

function point(id: string, name: string, status: ForecastPoint["status"], extras: Partial<ForecastPoint> = {}): ForecastPoint {
  return {
    id,
    name,
    status,
    confidence: "medium",
    aurora_reach: "horizon",
    cloud_block: "mixed",
    urban: id === "columbus" || id === "indianapolis",
    main_obstacle: status === "NO" ? "AURORA_NO_REACH" : "CLOUD_MIXED",
    ...extras,
  };
}

test("Ohio city FAQ answers differ by magnetic latitude and are not the state leave-city sentence", () => {
  const ohio = dossier("ohio");
  const cleveland = ohio.sample_points.find((item) => item.id === "cleveland");
  const columbus = ohio.sample_points.find((item) => item.id === "columbus");
  assert.ok(cleveland && columbus);
  const clevelandAnswer = cityTonightAnswer(cleveland, point("cleveland", "Cleveland", "MAYBE", { urban: true, cloud_block: "clear" }), ohio);
  const columbusAnswer = cityTonightAnswer(columbus, point("columbus", "Columbus", "NO", { urban: true, cloud_block: "socked", aurora_reach: "none" }), ohio);
  assert.notEqual(clevelandAnswer, columbusAnswer);
  assert.ok(clevelandAnswer.includes("50.7"));
  assert.ok(columbusAnswer.includes("49.1"));
  assert.ok(columbusAnswer.includes("south of Cleveland"));
  assert.equal(columbusAnswer.includes(ohio.leave_city_advice), false);
  assert.equal(clevelandAnswer.includes(ohio.light_pollution_note), false);
  assert.ok(columbusAnswer.toLowerCase().includes("cloud"));
});

test("state pages emit real-phrasing city questions from sample points", () => {
  const wisconsin = dossier("wisconsin");
  const snapshot = {
    location_slug: "wisconsin",
    headline_point_name: "Madison",
    status: "MAYBE",
    confidence: "medium",
    best_window_start: null,
    best_window_end: null,
    main_obstacle: "CLOUD_MIXED",
    main_obstacle_text: "Clouds are the main uncertainty.",
    answer_sentence: "MAYBE in Wisconsin.",
    headline_point_id: "madison",
    generated_at: "2026-10-11T00:00:00.000Z",
    valid_until: "2026-10-11T01:00:00.000Z",
    reason_codes: ["CLOUD_MIXED"],
    look_toward: "north",
    points: [
      point("bayfield", "Bayfield", "MAYBE", { urban: false, cloud_block: "clear" }),
      point("madison", "Madison", "NO", { urban: true }),
      point("milwaukee", "Milwaukee", "NO", { urban: true, cloud_block: "socked" }),
    ],
    windows: [],
    seo_indexable: false as const,
  } satisfies ForecastSnapshot;
  const faqs = localFaqsForPage(wisconsin, snapshot);
  const questions = faqs.map((faq) => faq.q);
  assert.ok(questions.includes("Can you see the northern lights in Madison tonight?"));
  assert.ok(questions.includes("Can you see the northern lights in Milwaukee tonight?"));
  const madison = faqs.find((faq) => faq.q.includes("Madison"))?.a ?? "";
  const milwaukee = faqs.find((faq) => faq.q.includes("Milwaukee"))?.a ?? "";
  assert.notEqual(madison, milwaukee);
  assert.ok(madison.includes("52.0"));
  assert.equal(madison.includes(wisconsin.leave_city_advice), false);
});

test("Ohio, Indiana, and New York FAQs cover the high-volume city searches", () => {
  const ohio = localFaqsForPage(dossier("ohio"), null);
  const indiana = localFaqsForPage(dossier("indiana"), null);
  const york = localFaqsForPage(dossier("new-york"), null);
  const questions = (faqs: { q: string }[]) => faqs.map((faq) => faq.q);
  for (const question of [
    "Can you see the northern lights in Columbus tonight?",
    "Can you see the northern lights in Cleveland tonight?",
  ]) {
    assert.ok(questions(ohio).includes(question), question);
  }
  for (const question of [
    "Can you see the northern lights in Indianapolis tonight?",
    "Can you see the northern lights in Fort Wayne tonight?",
  ]) {
    assert.ok(questions(indiana).includes(question), question);
  }
  assert.ok(questions(york).includes("Can you see the northern lights in New York City tonight?"));
  assert.ok(questions(york).some((question) => /northern lights tonight new york/i.test(question)));
  assert.ok(questions(york).some((question) => /aurora borealis new york/i.test(question)));
  assert.ok(questions(york).some((question) => /New York northern lights/i.test(question)));
  const columbus = ohio.find((faq) => faq.q.includes("Columbus"))?.a ?? "";
  const cleveland = ohio.find((faq) => faq.q.includes("Cleveland"))?.a ?? "";
  assert.notEqual(columbus, cleveland);
  assert.ok(columbus.includes("49.1"));
  assert.ok(cleveland.includes("50.7"));
});

test("stale UNKNOWN city FAQs keep magnetic latitude and drop leftover tonight values", () => {
  const ohio = dossier("ohio");
  const cleveland = ohio.sample_points.find((item) => item.id === "cleveland");
  assert.ok(cleveland);
  const leftover = point("cleveland", "Cleveland", "UNKNOWN", {
    urban: true,
    cloud_block: "socked",
    aurora_reach: "horizon",
    main_obstacle: "AURORA_NO_REACH",
  });
  const snapshot = {
    location_slug: "ohio",
    headline_point_name: "Cleveland",
    status: "UNKNOWN" as const,
    confidence: "low" as const,
    best_window_start: null,
    best_window_end: null,
    main_obstacle: "AURORA_NO_REACH",
    main_obstacle_text: "Aurora activity is not expected to reach Ohio tonight.",
    answer_sentence: "UNKNOWN in Ohio.",
    headline_point_id: "cleveland",
    generated_at: "2026-10-10T00:00:00.000Z",
    valid_until: "2026-10-10T01:00:00.000Z",
    reason_codes: ["AURORA_NO_REACH"],
    look_toward: "north",
    points: [leftover],
    windows: [],
    seo_indexable: false as const,
  } satisfies ForecastSnapshot;
  const answer = cityTonightAnswer(cleveland, leftover, ohio, snapshot.status);
  assert.ok(answer.includes("We cannot judge Cleveland tonight."));
  assert.ok(answer.includes("50.7"));
  assert.ok(answer.includes("cannot be judged"));
  assert.equal(answer.includes("Oval reach at this coordinate"), false);
  assert.equal(answer.includes("Cloud cover is likely blocking"), false);
  assert.equal(answer.includes("not expected to reach"), false);
  const faqs = localFaqsForPage(ohio, snapshot);
  const clevelandFaq = faqs.find((faq) => faq.q.includes("Cleveland"))?.a ?? "";
  assert.ok(clevelandFaq.includes("50.7"));
  assert.equal(clevelandFaq.includes("Oval reach at this coordinate"), false);
  assert.equal(clevelandFaq.includes("not expected to reach"), false);
  const worthGoing = faqs.find((faq) => /is it worth going out/i.test(faq.q))?.a ?? "";
  assert.ok(worthGoing.includes("UNKNOWN"));
  assert.ok(worthGoing.includes("Source data is too old to treat as live."));
  assert.equal(worthGoing.includes("not expected to reach"), false);
});
