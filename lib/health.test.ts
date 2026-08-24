import assert from "node:assert/strict";
import test from "node:test";

// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
import { assessHealth } from "./health.ts";

const generated_at = "2026-08-24T11:00:00Z";

function locations(
  statuses: Array<"GO" | "MAYBE" | "NO" | "UNKNOWN">,
): { status: string }[] {
  return statuses.map((status) => ({ status }));
}

test("live with mixed statuses returns 200", () => {
  const result = assessHealth(
    {
      locations: locations(["GO", "MAYBE", "NO", "UNKNOWN"]),
      generated_at,
    },
    "live",
  );
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    source: "live",
    unknowns: 1,
    total: 4,
    generated_at,
  });
});

test("lkg takeover with usable verdicts returns 200 (no brief-LKG alert)", () => {
  const result = assessHealth(
    {
      locations: locations(["GO", "MAYBE", "NO"]),
      generated_at,
    },
    "lkg",
  );
  assert.equal(result.status, 200);
  assert.equal(result.body.source, "lkg");
  assert.equal(result.body.unknowns, 0);
  assert.equal(result.body.total, 3);
});

test("bundled source returns 503 even when locations are not all UNKNOWN", () => {
  const result = assessHealth(
    {
      locations: locations(["GO", "MAYBE"]),
      generated_at,
    },
    "bundled",
  );
  assert.equal(result.status, 503);
  assert.deepEqual(result.body, {
    source: "bundled",
    unknowns: 0,
    total: 2,
    generated_at,
  });
});

test("all locations UNKNOWN returns 503 for live", () => {
  const result = assessHealth(
    {
      locations: locations(["UNKNOWN", "UNKNOWN", "UNKNOWN"]),
      generated_at,
    },
    "live",
  );
  assert.equal(result.status, 503);
  assert.equal(result.body.unknowns, 3);
  assert.equal(result.body.total, 3);
  assert.equal(result.body.source, "live");
});

test("all locations UNKNOWN returns 503 for lkg", () => {
  const result = assessHealth(
    {
      locations: locations(["UNKNOWN", "UNKNOWN"]),
      generated_at,
    },
    "lkg",
  );
  assert.equal(result.status, 503);
  assert.equal(result.body.source, "lkg");
});
