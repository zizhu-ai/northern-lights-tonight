import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  bundledMarkdownPaths,
  loadGuideContent,
  loadMarkdownBody,
  readBundledMarkdown,
} from "./bundled-markdown.ts";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const CONTENT_ROOT = join(REPO_ROOT, "content");

function walkMarkdown(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      files.push(...walkMarkdown(full));
    } else if (name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files.sort();
}

function walkSource(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "node_modules" || name === ".next" || name === ".open-next") continue;
      walkSource(full, acc);
    } else if (/\.(ts|tsx|js|mjs)$/.test(name) && !name.endsWith(".test.ts")) {
      acc.push(full);
    }
  }
  return acc;
}

test("bundled markdown matches every content/*.md file", () => {
  const disk = walkMarkdown(CONTENT_ROOT);
  const keys = disk.map((file) => relative(CONTENT_ROOT, file).replaceAll("\\", "/"));
  assert.deepEqual(bundledMarkdownPaths(), keys);
  for (const [file, key] of disk.map((file, index) => [file, keys[index]] as const)) {
    assert.equal(readBundledMarkdown(key), readFileSync(file, "utf8"), key);
  }
});

test("guide frontmatter and page bodies load from the bundle", () => {
  const home = loadMarkdownBody("pages/home.md");
  assert.match(home, /Northern lights tonight is a local question/);
  const where = loadGuideContent("where-to-see-northern-lights.md");
  assert.equal(where.title, "Where to See the Northern Lights in the US Tonight");
  assert.equal(where.h1, where.title);
  assert.match(where.body, /Ranked from our live local readings/);
  assert.throws(() => readBundledMarkdown("pages/missing.md"), /Bundled markdown missing/);
});

test("request-time app and component modules do not read content from disk", () => {
  const roots = ["app", "components", "lib"].map((dir) => join(REPO_ROOT, dir));
  const offenders: string[] = [];
  for (const root of roots) {
    for (const file of walkSource(root)) {
      const source = readFileSync(file, "utf8");
      if (!/from ["']node:fs(?:\/promises)?["']/.test(source)) continue;
      if (file.endsWith(".test.ts")) continue;
      offenders.push(relative(REPO_ROOT, file));
    }
  }
  assert.deepEqual(offenders, []);
});
