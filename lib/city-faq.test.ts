import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// @ts-ignore TS5097
import {
  cityFaqHeading,
  cityTonightAnswer,
  localFaqsForPage,
  stateKeywordFaqs,
  wordCount,
} from "./city-faq.ts";
import { h1For, titleFor } from "./forecast-copy.ts";
import { SEO_BLOCK_FLAGS, type ForecastDossier } from "./forecast-places.ts";
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

test("FAQ merge and city H2 stay off except Illinois and Maine", () => {
  for (const item of dossiers) {
    const enabled = item.slug === "illinois" || item.slug === "maine";
    for (const flag of SEO_BLOCK_FLAGS) {
      if (flag === "predictionBlock" || flag === "leadInNameTonight") continue;
      assert.equal(Boolean(item[flag]), enabled, `${item.slug} ${flag}`);
    }
    assert.equal(Boolean(item.predictionBlock), item.slug === "illinois", item.slug);
    assert.equal(Boolean(item.leadInNameTonight), item.slug === "maine", item.slug);
    if (item.slug === "maine") {
      assert.equal(
        item.cityH2Override,
        "Can you see the northern lights in Portland, Bangor, or Aroostook?",
      );
      assert.equal(item.h1Override, "Can You See the Northern Lights in Maine Tonight?");
    } else {
      assert.equal(item.cityH2Override, undefined, item.slug);
      assert.equal(item.h1Override, undefined, item.slug);
    }
  }
});

test("other state keyword FAQs and city H2 stay on the original template", () => {
  const ohio = localFaqsForPage(dossier("ohio"), null);
  const questions = ohio.map((faq) => faq.q);
  assert.ok(questions.includes("Northern lights tonight ohio — is it worth going out?"));
  assert.ok(questions.includes("Aurora borealis ohio — can you see it tonight?"));
  assert.ok(questions.includes("Ohio northern lights: is tonight a statewide yes?"));
  assert.equal(
    questions.includes("Can you see the northern lights in Ohio?"),
    false,
  );
  assert.equal(
    questions.includes("When is the best time to see the northern lights in Ohio?"),
    false,
  );
  assert.match(
    cityFaqHeading(dossier("ohio")),
    /^Northern lights tonight in /,
  );
  assert.equal(cityFaqHeading(dossier("ohio")).includes("Aroostook"), false);
  assert.equal(titleFor(dossier("ohio")).includes("Visibility & Best Time"), true);
  assert.equal(h1For(dossier("wisconsin")), "Northern Lights Tonight in Wisconsin");
});

test("Illinois and Maine merged FAQs are 30–50 words and conclusion-first", () => {
  const statuses = ["GO", "MAYBE", "NO", "UNKNOWN"] as const;
  for (const slug of ["illinois", "maine"] as const) {
    const item = dossier(slug);
    for (const status of statuses) {
      const snapshot = {
        location_slug: slug,
        headline_point_name: slug === "illinois" ? "Rockford" : "Bangor",
        status,
        confidence: "medium" as const,
        best_window_start: null,
        best_window_end: null,
        main_obstacle: status === "UNKNOWN" ? "DATA_STALE" : "AURORA_NO_REACH",
        main_obstacle_text:
          status === "UNKNOWN"
            ? "Source data is too old to treat as live."
            : `Aurora activity is not expected to reach ${item.name} tonight.`,
        answer_sentence: `${status} in ${item.name}.`,
        headline_point_id: slug === "illinois" ? "rockford" : "bangor",
        generated_at: "2026-10-11T00:00:00.000Z",
        valid_until: "2026-10-11T01:00:00.000Z",
        reason_codes: ["AURORA_NO_REACH"],
        look_toward: "north",
        points: [],
        windows: [],
        seo_indexable: false as const,
      } satisfies ForecastSnapshot;
      const keywords = stateKeywordFaqs(item, snapshot);
      assert.equal(keywords.length, 3);
      assert.equal(keywords[0]?.q, `Can you see the northern lights in ${item.name}?`);
      assert.equal(
        keywords[2]?.q,
        `When is the best time to see the northern lights in ${item.name}?`,
      );
      assert.equal(
        keywords.some((faq) => /aurora borealis/i.test(faq.q)),
        false,
      );
      assert.equal(
        keywords.some((faq) => /statewide yes/i.test(faq.q)),
        false,
      );
      for (const faq of keywords) {
        const words = wordCount(faq.a);
        assert.ok(
          words >= 30 && words <= 50,
          `${slug} ${status} “${faq.q}” is ${words} words: ${faq.a}`,
        );
      }
      assert.match(keywords[0]?.a ?? "", /^(Yes|No|It depends)\b/);
      assert.match(keywords[2]?.a ?? "", /^It depends\b/);
    }
  }
});

test("Maine city H2 override and Aroostook label", () => {
  const maine = dossier("maine");
  assert.equal(
    cityFaqHeading(maine),
    "Can you see the northern lights in Portland, Bangor, or Aroostook?",
  );
  assert.ok(maine.sample_points.some((point) => point.id === "presque-isle"));
  assert.ok(
    maine.sample_points.some((point) => point.name === "Aroostook (Presque Isle)"),
  );
  const faqs = localFaqsForPage(maine, null);
  assert.ok(
    faqs.some((faq) => faq.q.includes("Aroostook (Presque Isle)")),
  );
});
