import assert from "node:assert/strict";
import test from "node:test";

// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
import { resolveViewParams } from "./view-params.ts";

test("view coordinates accept the inclusive latitude and longitude limits", () => {
  assert.equal(resolveViewParams({ lat: "-90", lng: "-180" }).hasCoords, true);
  assert.equal(resolveViewParams({ lat: "90", lng: "180" }).hasCoords, true);
});

test("view coordinates reject values outside latitude and longitude limits", () => {
  for (const params of [
    { lat: "-90.001", lng: "0" },
    { lat: "90.001", lng: "0" },
    { lat: "0", lng: "-180.001" },
    { lat: "0", lng: "180.001" },
    { lat: "999", lng: "999" },
  ]) {
    assert.deepEqual(resolveViewParams(params), { hasCoords: false });
  }
});
