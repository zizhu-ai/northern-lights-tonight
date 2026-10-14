import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// @ts-ignore TS5097
import { closestTypedPlaceInData, findPlaceInData, queryKind, suggestPlacesInData, type PlaceData } from "./place-match.ts";

const placeData = JSON.parse(
  readFileSync(new URL("../data/us-places.json", import.meta.url), "utf8"),
) as PlaceData;

test("queryKind never returns the raw ZIP", () => {
  assert.equal(queryKind("80521"), "zip");
  assert.equal(queryKind("Fairbanks"), "text");
  assert.equal(queryKind("   "), "empty");
});

test("exact unique places still resolve to one destination", () => {
  const michigan = findPlaceInData(placeData, "michigan");
  assert.equal(michigan.kind, "slug");
  if (michigan.kind === "slug") assert.equal(michigan.slug, "michigan");

  const columbus = findPlaceInData(placeData, "columbus");
  assert.equal(columbus.kind, "slug");
  if (columbus.kind === "slug") assert.equal(columbus.slug, "ohio");
});

test("wave-2 city searches map to state pages, not new city URLs", () => {
  const newYork = findPlaceInData(placeData, "new york");
  assert.equal(newYork.kind, "slug");
  if (newYork.kind === "slug") assert.equal(newYork.slug, "new-york");

  const philadelphia = findPlaceInData(placeData, "philadelphia");
  assert.equal(philadelphia.kind, "slug");
  if (philadelphia.kind === "slug") assert.equal(philadelphia.slug, "pennsylvania");

  const madison = findPlaceInData(placeData, "madison");
  assert.equal(madison.kind, "slug");
  if (madison.kind === "slug") assert.equal(madison.slug, "wisconsin");
});

test("portland is an ambiguous city match", () => {
  const result = findPlaceInData(placeData, "portland");
  assert.equal(result.kind, "ambiguous");
  if (result.kind === "ambiguous") {
    const names = result.places.map((place) => place.name).sort();
    assert.ok(names.includes("Portland, ME"));
    assert.ok(names.includes("Portland, OR"));
  }
});

test("typed suggestions stay in-place and include state slugs", () => {
  const suggestions = suggestPlacesInData(placeData, "oh", 8);
  assert.ok(suggestions.some((place) => place.slug === "ohio"));
  const york = suggestPlacesInData(placeData, "new yo", 8);
  assert.ok(york.some((place) => place.slug === "new-york"));
});

test("New York ZIP stays a live pin, not a new city forecast URL", () => {
  const zip = findPlaceInData(placeData, "10001");
  assert.equal(zip.kind, "place");
  if (zip.kind === "place") {
    assert.equal(zip.place.slug, null);
    assert.equal(zip.place.name, "New York, NY");
  }
});

test("near-miss city names suggest the closest covered or pin place", () => {
  const fairbanks = closestTypedPlaceInData(placeData, "fairbnks");
  assert.ok(fairbanks);
  assert.match(fairbanks.name, /fairbanks/i);
});

test("empty and unknown queries keep a typed-input error code", () => {
  assert.deepEqual(findPlaceInData(placeData, "   "), { kind: "error", code: "search_empty" });
  assert.deepEqual(findPlaceInData(placeData, "atlantis"), { kind: "error", code: "search_no_match" });
  assert.deepEqual(findPlaceInData(placeData, "00000"), { kind: "error", code: "zip_not_found" });
});
