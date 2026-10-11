import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire, registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

// Load the actual Next entry points with the repo's alias and CJS semantics.
// Only local TypeScript is transpiled; NextResponse and search data are real.
const root = new URL("../", import.meta.url);
const require = createRequire(import.meta.url);
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const relative = specifier.slice(2);
      specifier = fileURLToPath(new URL(relative.endsWith(".json") ? relative : `${relative}.ts`, root));
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(root.href) && url.endsWith(".ts") && !url.includes("/node_modules/")) {
      return {
        format: "commonjs", shortCircuit: true,
        source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
          compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
        }).outputText,
      };
    }
    return nextLoad(url, context);
  },
});
const { middleware, config: middlewareConfig } = require("../middleware.ts") as typeof import("../middleware");
const { GET } = require("../app/api/search/route.ts") as typeof import("../app/api/search/route");
const config = (require("../next.config.ts") as typeof import("../next.config")).default;
const { INDEXNOW_KEY, INDEXNOW_KEY_PATH } = require("../lib/indexnow.ts") as typeof import("../lib/indexnow");
const { NextRequest } = require("next/server") as typeof import("next/server");
const { pathToRegexp } = require("next/dist/compiled/path-to-regexp");
hooks.deregister();

const origin = "https://aurora-tonight.com";

test("middleware only canonicalizes production requests", () => {
  const previous = process.env.VERCEL_ENV;
  try {
    for (const env of ["production", "preview", "development", undefined]) {
      if (env === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = env;
      const response = middleware(new NextRequest("https://www.aurora-tonight.com/about/?ref=gsc", {
        headers: { host: "www.aurora-tonight.com" },
      }));
      if (env === "production") {
        assert.equal(response.status, 308);
        assert.equal(response.headers.get("location"), `${origin}/about?ref=gsc`);
      } else {
        assert.equal(response.headers.get("location"), null, String(env));
        assert.equal(response.headers.get("x-middleware-next"), "1", String(env));
      }
    }
    process.env.VERCEL_ENV = "production";
    const canonical = middleware(new NextRequest(`${origin}/about`, { headers: { host: "aurora-tonight.com" } }));
    assert.equal(canonical.headers.get("location"), null);
    assert.equal(canonical.headers.get("x-middleware-next"), "1");
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});

test("search redirects carry API noindex on slug, place, error and ambiguous branches", () => {
  for (const [query, destination] of [
    ["?q=alaska", "/forecast/alaska"],
    ["?q=10001", "/view?lat=40.713&lng=-74.006&name=New+York%2C+NY"],
    ["?q=not-a-place", "/near-me?q=not-a-place"],
    ["?q=portland", "/near-me?q=portland"],
    ["?q=%20portland%20", "/near-me?q=portland"],
    ["", "/near-me"],
  ]) {
    const response = GET(new Request(`${origin}/api/search${query}`));
    assert.equal(response.status, 307, query);
    assert.equal(response.headers.get("location"), `${origin}${destination}`, query);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow", query);
  }
});

test("production middleware does not redirect the IndexNow key file", () => {
  const previous = process.env.VERCEL_ENV;
  try {
    process.env.VERCEL_ENV = "production";
    assert.equal(middlewareConfig.matcher.length, 1);
    assert.equal(
      middlewareConfig.matcher[0],
      `/((?!${INDEXNOW_KEY}\\.txt).*)`,
    );
    for (const [url, host] of [
      [`${origin}${INDEXNOW_KEY_PATH}`, "aurora-tonight.com"],
      [`https://www.aurora-tonight.com${INDEXNOW_KEY_PATH}`, "www.aurora-tonight.com"],
      [`https://northern-lights-tonight.vercel.app${INDEXNOW_KEY_PATH}`, "northern-lights-tonight.vercel.app"],
      [`${origin}${INDEXNOW_KEY_PATH}/`, "aurora-tonight.com"],
    ]) {
      const response = middleware(new NextRequest(url, { headers: { host } }));
      assert.equal(response.status, 200, url);
      assert.equal(response.headers.get("location"), null, url);
      assert.equal(response.headers.get("x-middleware-next"), "1", url);
    }
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});

test("configured noindex rules cover API paths but exclude public HTML", async () => {
  const rules = await config.headers!();
  const tagsFor = (pathname: string) => rules
    .filter((rule) => pathToRegexp(rule.source).test(pathname))
    .flatMap((rule) => rule.headers)
    .filter((header) => header.key.toLowerCase() === "x-robots-tag")
    .map((header) => header.value);
  for (const pathname of ["/api/search", "/api/no-such-route", "/api/nested/path"]) {
    assert.deepEqual(tagsFor(pathname), ["noindex, nofollow"], pathname);
  }
  for (const pathname of ["/", "/about", "/near-me", "/forecast/alaska", "/guides/best-time-to-see-northern-lights", "/apiary", INDEXNOW_KEY_PATH]) {
    assert.deepEqual(tagsFor(pathname), [], pathname);
  }
});
