import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// @ts-ignore TS5097
import { findPlaceInData, queryKind, type PlaceData } from "./place-match.ts";

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

test("portland is an ambiguous city match", () => {
  const result = findPlaceInData(placeData, "portland");
  assert.equal(result.kind, "ambiguous");
  if (result.kind === "ambiguous") {
    const names = result.places.map((place) => place.name).sort();
    assert.ok(names.includes("Portland, ME"));
    assert.ok(names.includes("Portland, OR"));
  }
});

test("empty and unknown queries keep a typed-input error code", () => {
  assert.deepEqual(findPlaceInData(placeData, "   "), { kind: "error", code: "search_empty" });
  assert.deepEqual(findPlaceInData(placeData, "atlantis"), { kind: "error", code: "search_no_match" });
  assert.deepEqual(findPlaceInData(placeData, "00000"), { kind: "error", code: "zip_not_found" });
});
