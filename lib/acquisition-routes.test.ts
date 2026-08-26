import assert from "node:assert/strict";
import test from "node:test";

// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
import {
  ACQUISITION_ROUTES,
  isAcquisitionRoute,
} from "./acquisition-routes.ts";

const EXPECTED_INDEXABLE_PATHS = [
  "/",
  "/about",
  "/near-me",
  "/guides/best-time-to-see-northern-lights",
  "/guides/how-to-see-northern-lights",
  "/guides/where-to-see-northern-lights",
  "/methodology",
  "/privacy",
  "/terms",
  "/forecast/colorado",
  "/forecast/ohio",
  "/forecast/indiana",
  "/forecast/michigan",
  "/forecast/chicago",
  "/forecast/seattle",
  "/forecast/wisconsin",
  "/forecast/massachusetts",
  "/forecast/maine",
  "/forecast/minnesota",
  "/forecast/illinois",
  "/forecast/oregon",
  "/forecast/utah",
  "/forecast/alaska",
  "/forecast/fairbanks",
];

test("the acquisition registry exposes exactly the 24 indexable routes", () => {
  assert.deepEqual(
    ACQUISITION_ROUTES.map(({ path }) => path),
    EXPECTED_INDEXABLE_PATHS,
  );
});

test("the acquisition route guard excludes utility and error pages", () => {
  assert.equal(isAcquisitionRoute("/"), true);
  assert.equal(isAcquisitionRoute("/forecast/alaska"), true);
  assert.equal(isAcquisitionRoute("/view"), false);
  assert.equal(isAcquisitionRoute("/__adsense-precheck-404__"), false);
  assert.equal(isAcquisitionRoute("/missing"), false);
});
