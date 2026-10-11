import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// @ts-ignore TS5097
import {
  forecastLead,
  h1For,
  repeatedDossierSentences,
  titleFor,
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
    assert.equal(h1, `Northern Lights Tonight in ${dossier.name}`);
    assert.ok(title.length <= 60, `${dossier.slug} title length ${title.length}: ${title}`);
  }
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
