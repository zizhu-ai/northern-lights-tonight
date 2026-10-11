import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// @ts-ignore TS5097
import sitemap from "../app/sitemap.ts";
// @ts-ignore TS5097
import { ACQUISITION_ROUTES } from "./acquisition-routes.ts";
// @ts-ignore TS5097
import { CONTENT_REVISIONS, CONTENT_SOURCES } from "./content-revisions.ts";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

function gitLatestIso(files: readonly string[]): string | null {
  try {
    const output = execFileSync("git", ["log", "-1", "--format=%cI", "--", ...files], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }).trim();
    if (!output) return null;
    const stamp = new Date(output);
    if (Number.isNaN(stamp.getTime())) return null;
    return stamp.toISOString();
  } catch {
    return null;
  }
}

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

test("static lastmod matches the latest git revision of each page’s sources", () => {
  assert.deepEqual(Object.keys(CONTENT_REVISIONS).sort(), Object.keys(CONTENT_SOURCES).sort());
  const aboutSources = CONTENT_SOURCES["/about"];
  assert.ok(aboutSources.includes("app/about/page.tsx"));
  assert.ok(aboutSources.includes("content/ui-copy.json"));
  for (const [path, files] of Object.entries(CONTENT_SOURCES)) {
    assert.ok(files.length > 0, path);
    for (const file of files) {
      assert.ok(existsSync(join(REPO_ROOT, file)), `${path} source missing: ${file}`);
    }
    const gitIso = gitLatestIso(files);
    if (!gitIso) continue;
    assert.equal(CONTENT_REVISIONS[path], gitIso, `${path} lastmod should be ${gitIso}`);
  }
  const aboutPageIso = gitLatestIso(["app/about/page.tsx"]);
  if (aboutPageIso) {
    assert.ok(
      new Date(CONTENT_REVISIONS["/about"]).getTime() >= new Date(aboutPageIso).getTime(),
      "/about lastmod must cover the about page module",
    );
  }
});
