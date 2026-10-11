import assert from "node:assert/strict";
import test from "node:test";

// @ts-ignore TS5097
import sitemap from "../app/sitemap.ts";
// @ts-ignore TS5097
import { ACQUISITION_ROUTES } from "./acquisition-routes.ts";
// @ts-ignore TS5097
import { CONTENT_REVISIONS } from "./content-revisions.ts";

test("sitemap stays complete and only stamps real content revisions", async () => {
  const expected = ACQUISITION_ROUTES.map(({ path }) => {
    const revision = CONTENT_REVISIONS[path];
    return revision
      ? { url: new URL(path, "https://aurora-tonight.com").href, lastModified: new Date(revision) }
      : { url: new URL(path, "https://aurora-tonight.com").href };
  });
  const first = await sitemap();
  assert.equal(first.length, 33);
  assert.deepEqual(first, expected);
  for (const entry of first) {
    const path = new URL(entry.url).pathname;
    if (path === "/" || path.startsWith("/forecast/")) {
      assert.equal("lastModified" in entry, false, path);
    } else {
      assert.ok(entry.lastModified instanceof Date, path);
    }
  }
});
