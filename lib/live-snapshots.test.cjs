const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveProjectAlias(request, parent, isMain, options) {
  return resolveFilename.call(
    this,
    request.startsWith("@/") ? path.join(root, request.slice(2)) : request,
    parent,
    isMain,
    options,
  );
};
Module._extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = readFileSync(filename, "utf8");
  module._compile(
    ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: filename,
    }).outputText,
    filename,
  );
};

const { sanitizeBundledBundle } = require("./live-snapshots.ts");
const bundled = require("../snapshots/latest.json");

test("bundled NO older than 12 hours degrades to UNKNOWN", () => {
  const generatedAt = "2026-08-23T00:00:00.000Z";
  const raw = {
    ...bundled,
    generated_at: generatedAt,
    locations: bundled.locations.map((row) => ({
      ...row,
      status: "NO",
      main_obstacle: "AURORA_NO_REACH",
    })),
  };

  const actual = sanitizeBundledBundle(raw, new Date("2026-08-24T00:00:00.001Z"));

  assert.equal(actual.locations[0].status, "UNKNOWN");
  assert.equal(actual.locations[0].confidence, "low");
  assert.equal(actual.locations[0].best_window_start, null);
  assert.equal(actual.locations[0].best_window_end, null);
});
