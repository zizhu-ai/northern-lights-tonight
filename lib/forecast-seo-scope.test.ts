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
  titleFor,
} from "./forecast-copy.ts";
import type { ForecastDossier } from "./forecast-places.ts";
import { getHeadlinePoint } from "./forecast-places.ts";
import { clampSeoText, titleCasePhrase } from "./site.ts";

const dossiers = (
  JSON.parse(readFileSync(new URL("../地点档案/wave1.json", import.meta.url), "utf8")) as {
    locations: ForecastDossier[];
  }
).locations;

const OTHER_PAGES = dossiers.filter(
  (dossier) => dossier.slug !== "illinois" && dossier.slug !== "maine",
);

function legacyDescription(
  dossier: ForecastDossier,
  headline: string,
  state: { status: string; mainIssue: string; bestWindow: string },
): string {
  const phrase = titleCasePhrase(dossier.primary_keyword);
  return `${phrase} tonight: ${state.status} from ${headline}. Best window ${state.bestWindow}. ${state.mainIssue}`;
}

test("other 22 forecast pages only change the Best-window fragment", () => {
  assert.equal(OTHER_PAGES.length, 22);
  for (const dossier of OTHER_PAGES) {
    const headline = getHeadlinePoint(dossier).name;
    const noWindow = {
      status: "NO",
      mainIssue: `Aurora activity is not expected to reach ${dossier.name} tonight.`,
      bestWindow: copy.verdict.unknown_window,
    };
    const oldNo = legacyDescription(dossier, headline, noWindow);
    const newNo = seoDescription(dossier, headline, noWindow);
    assert.ok(oldNo.includes(`Best window ${copy.verdict.unknown_window}.`), dossier.slug);
    assert.equal(newNo.includes("Best window"), false, dossier.slug);
    assert.equal(
      newNo,
      clampSeoText(oldNo.replace(` Best window ${copy.verdict.unknown_window}.`, ""), 70, 160),
      `${dossier.slug} description should differ only by omitting Best window —.`,
    );

    const withWindow = {
      status: "MAYBE",
      mainIssue: "Clouds are the main uncertainty.",
      bestWindow: "10:00 PM–12:00 AM ET",
    };
    assert.equal(
      seoDescription(dossier, headline, withWindow),
      clampSeoText(legacyDescription(dossier, headline, withWindow), 70, 160),
      `${dossier.slug} keeps the window sentence when a window exists`,
    );

    assert.equal(titleFor(dossier), titleFor({ ...dossier, faqMerge: true }));
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
    assert.equal(Boolean(dossier.faqMerge), false, dossier.slug);
    assert.equal(Boolean(dossier.topToolEntry), false, dossier.slug);
    assert.equal(Boolean(dossier.descriptiveNearbyAnchors), false, dossier.slug);
    assert.equal(stateKeywordFaqs(dossier, null).length, 3);
  }
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
