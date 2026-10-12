import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = join(root, "content");
const output = join(root, "lib/bundled-markdown.json");

function walkMarkdown(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      files.push(...walkMarkdown(full));
    } else if (name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

const documents = {};
for (const file of walkMarkdown(contentRoot).sort()) {
  const key = relative(contentRoot, file).replaceAll("\\", "/");
  documents[key] = readFileSync(file, "utf8");
}

writeFileSync(output, `${JSON.stringify(documents, null, 2)}\n`);
console.log(`Wrote ${Object.keys(documents).length} markdown files to lib/bundled-markdown.json`);
