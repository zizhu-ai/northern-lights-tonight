import assert from "node:assert/strict";
import test from "node:test";

// @ts-ignore TS5097
import { checkingAfterLookup, planLocate, planTypedSubmit } from "./place-search-flow.ts";

test("typed submit while idle cancels in-flight GPS and proceeds", () => {
  assert.deepEqual(planTypedSubmit(false), { proceed: true, cancelGps: true });
});

test("typed submit while already checking is ignored and does not cancel GPS twice", () => {
  assert.deepEqual(planTypedSubmit(true), { proceed: false, cancelGps: false });
});

test("locate is blocked while a typed navigation is in flight", () => {
  assert.deepEqual(planLocate(true), { proceed: false });
  assert.deepEqual(planLocate(false), { proceed: true });
});

test("checking stays on only for a successful navigate", () => {
  assert.equal(checkingAfterLookup("error"), false);
  assert.equal(checkingAfterLookup("ambiguous"), false);
  assert.equal(checkingAfterLookup("navigate"), true);
});
