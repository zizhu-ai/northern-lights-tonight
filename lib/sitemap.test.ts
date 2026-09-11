import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire, registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const require = createRequire(import.meta.url);

test("sitemap stays static, complete and free of untrusted modification dates", async (t) => {
  // Enforce an offline dependency boundary, including during module initialization.
  // New content revision metadata can be explicitly added here when it is trustworthy.
  const allowed = new Set(["app/sitemap.ts", "lib/acquisition-routes.ts", "lib/site.ts"]
    .map((path) => new URL(path, root).href));
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier.startsWith("@/")) {
        specifier = fileURLToPath(new URL(`${specifier.slice(2)}.ts`, root));
      }
      const resolved = nextResolve(specifier, context);
      assert.ok(allowed.has(resolved.url), `Unexpected sitemap dependency: ${resolved.url}`);
      return resolved;
    },
    load(url) {
      assert.ok(allowed.has(url), `Unexpected sitemap module: ${url}`);
      return {
        format: "commonjs", shortCircuit: true,
        source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
          compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText,
      };
    },
  });
  t.mock.method(globalThis, "fetch", () => { throw new Error("Sitemap must not fetch upstream data"); });
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-08-29T00:00:00Z") });
  try {
    const sitemap = (require("../app/sitemap.ts") as typeof import("../app/sitemap")).default;
    const { ACQUISITION_ROUTES } = require("./acquisition-routes.ts") as typeof import("./acquisition-routes");
    const expected = ACQUISITION_ROUTES.map(({ path }) => ({ url: new URL(path, "https://aurora-tonight.com").href }));
    const first = await sitemap();
    assert.equal(first.length, 24);
    assert.deepEqual(first, expected); // No lastModified, even as an undefined property.
    t.mock.timers.setTime(new Date("2027-09-11T00:00:00Z").getTime());
    assert.deepEqual(await sitemap(), first);
  } finally {
    hooks.deregister();
  }
});
