import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import copy from "../content/ui-copy.json" with { type: "json" };

// @ts-ignore TS5097
import { cityFaqHeading, localFaqsForPage, stateKeywordFaqs } from "./city-faq.ts";
import {
  h1For,
  nearbyAnchorText,
  nearbyWindowLine,
  seoDescription,
  seoLeadPhrase,
  titleFor,
} from "./forecast-copy.ts";
import type { ForecastDossier } from "./forecast-places.ts";
import { getHeadlinePoint, SEO_BLOCK_FLAGS } from "./forecast-places.ts";
import { clampSeoSentences } from "./site.ts";

const dossiers = (
  JSON.parse(readFileSync(new URL("../地点档案/wave1.json", import.meta.url), "utf8")) as {
    locations: ForecastDossier[];
  }
).locations;

const OTHER_PAGES = dossiers.filter(
  (dossier) => dossier.slug !== "illinois" && dossier.slug !== "maine",
);

function expectedDescription(
  dossier: ForecastDossier,
  headline: string,
  state: { status: string; mainIssue: string; bestWindow: string },
): string {
  const windowBit =
    state.bestWindow && state.bestWindow !== copy.verdict.unknown_window
      ? ` Best window ${state.bestWindow}.`
      : "";
  const lead = seoLeadPhrase(dossier.primary_keyword);
  return clampSeoSentences(
    `${lead}: ${state.status} from ${headline} (aurora borealis).${windowBit} ${state.mainIssue}`,
    70,
    160,
  );
}

test("other 22 forecast pages keep scoped SEO blocks and the new description contract", () => {
  assert.equal(OTHER_PAGES.length, 22);
  for (const dossier of OTHER_PAGES) {
    const headline = getHeadlinePoint(dossier).name;
    const noWindow = {
      status: "NO",
      mainIssue: `Aurora activity is not expected to reach ${dossier.name} tonight.`,
      bestWindow: copy.verdict.unknown_window,
    };
    const newNo = seoDescription(dossier, headline, noWindow);
    assert.equal(newNo.includes("Best window"), false, dossier.slug);
    assert.equal(newNo.includes("Tonight " + dossier.name + " tonight"), false, dossier.slug);
    assert.match(newNo, /aurora borealis/i);
    assert.equal(newNo, expectedDescription(dossier, headline, noWindow), dossier.slug);
    assert.ok(newNo.length <= 160, `${dossier.slug} ${newNo.length}`);
    assert.ok(newNo.length >= 70, `${dossier.slug} ${newNo.length}`);

    const withWindow = {
      status: "MAYBE",
      mainIssue: "Clouds are the main uncertainty.",
      bestWindow: "10:00 PM–12:00 AM ET",
    };
    const withWindowDesc = seoDescription(dossier, headline, withWindow);
    assert.equal(
      withWindowDesc,
      expectedDescription(dossier, headline, withWindow),
      `${dossier.slug} keeps the window sentence when a window exists`,
    );
    assert.match(withWindowDesc, /Best window 10:00 PM–12:00 AM ET\./);
    assert.match(withWindowDesc, /aurora borealis/i);

    assert.equal(titleFor(dossier), titleFor({ ...dossier, faqMerge: true }));
    if (dossier.slug !== "alaska") {
      assert.ok(titleFor(dossier).endsWith(": Visibility & Best Time"), dossier.slug);
    }
    assert.equal(h1For(dossier), `Northern Lights Tonight in ${dossier.name}`);
    assert.equal(cityFaqHeading(dossier), cityFaqHeading({ ...dossier, faqMerge: true }));
    assert.equal(nearbyAnchorText(dossier, "Wisconsin"), "Wisconsin");
    assert.equal(nearbyWindowLine(copy.verdict.unknown_window), null);
    assert.equal(nearbyWindowLine("9:00 PM–10:00 PM ET"), "Best window: 9:00 PM–10:00 PM ET");

    const faqs = localFaqsForPage(dossier, null);
    const questions = faqs.map((faq) => faq.q);
    assert.ok(questions.some((question) => /is it worth going out/i.test(question)), dossier.slug);
    assert.ok(questions.some((question) => /aurora borealis/i.test(question)), dossier.slug);
    assert.ok(questions.some((question) => /statewide yes/i.test(question)), dossier.slug);
    assert.equal(
      questions.some((question) => /^Can you see the northern lights in /.test(question) && !/tonight/i.test(question)),
      false,
      dossier.slug,
    );
    for (const flag of SEO_BLOCK_FLAGS) {
      assert.equal(Boolean(dossier[flag]), false, `${dossier.slug} ${flag}`);
    }
    assert.equal(stateKeywordFaqs(dossier, null).length, 3);
  }
});

test("sitewide SEO descriptions name aurora borealis without dropping the main term", () => {
  for (const [key, value] of Object.entries(copy.seo)) {
    assert.match(value, /aurora borealis/i, key);
    assert.ok(value.length <= 160, `${key} ${value.length}`);
    if (key !== "fallback_description") {
      assert.ok(value.length >= 70, `${key} ${value.length}`);
    }
  }
  assert.match(copy.seo.home, /^Check northern lights tonight/);
  assert.match(copy.seo.how_to, /^How to see northern lights tonight/);
  assert.match(copy.seo.best_time, /^Best time to see the northern lights/);
  assert.match(copy.seo.where, /^Where to see northern lights/);
});

test("Michigan nearby data links Illinois and Maine", () => {
  const michigan = dossiers.find((item) => item.slug === "michigan");
  const illinois = dossiers.find((item) => item.slug === "illinois");
  const maine = dossiers.find((item) => item.slug === "maine");
  assert.ok(michigan && illinois && maine);
  assert.ok(michigan.nearby_slugs.includes("illinois"));
  assert.ok(michigan.nearby_slugs.includes("maine"));
  assert.ok(illinois.nearby_slugs.includes("michigan"));
  assert.ok(maine.nearby_slugs.includes("michigan"));
});
