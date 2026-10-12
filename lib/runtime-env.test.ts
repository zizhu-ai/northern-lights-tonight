import assert from "node:assert/strict";
import test from "node:test";

// @ts-ignore TS5097
import {
  hostnameFromHostHeader,
  isPreviewHost,
  isProductionAppEnv,
  resolveAppEnv,
  shouldApplyProductionCanonicalRedirect,
  shouldSendPreviewNoindex,
} from "./runtime-env.ts";

test("APP_ENV production is explicit and case-insensitive", () => {
  assert.equal(resolveAppEnv({ APP_ENV: "production" }), "production");
  assert.equal(resolveAppEnv({ APP_ENV: " Production " }), "production");
  assert.equal(isProductionAppEnv({ APP_ENV: "production" }), true);
  assert.equal(isProductionAppEnv({ APP_ENV: "preview" }), false);
  assert.equal(isProductionAppEnv({}), false);
});

test("preview hosts include workers.dev and loopback", () => {
  assert.equal(hostnameFromHostHeader("aurora-tonight.workers.dev:443"), "aurora-tonight.workers.dev");
  assert.equal(isPreviewHost("aurora-tonight.workers.dev"), true);
  assert.equal(isPreviewHost("localhost"), true);
  assert.equal(isPreviewHost("127.0.0.1"), true);
  assert.equal(isPreviewHost("aurora-tonight.com"), false);
  assert.equal(isPreviewHost("www.aurora-tonight.com"), false);
});

test("canonical redirects run only for production APP_ENV off preview hosts", () => {
  assert.equal(
    shouldApplyProductionCanonicalRedirect("www.aurora-tonight.com", { APP_ENV: "production" }),
    true,
  );
  assert.equal(
    shouldApplyProductionCanonicalRedirect("aurora-tonight.workers.dev", { APP_ENV: "production" }),
    false,
  );
  assert.equal(
    shouldApplyProductionCanonicalRedirect("www.aurora-tonight.com", { APP_ENV: "preview" }),
    false,
  );
  assert.equal(shouldApplyProductionCanonicalRedirect("localhost", { APP_ENV: "production" }), false);
});

test("workers.dev and non-production APP_ENV send noindex", () => {
  assert.equal(
    shouldSendPreviewNoindex("aurora-tonight.workers.dev", { APP_ENV: "production" }),
    true,
  );
  assert.equal(shouldSendPreviewNoindex("aurora-tonight.com", { APP_ENV: "production" }), false);
  assert.equal(shouldSendPreviewNoindex("aurora-tonight.com", { APP_ENV: "preview" }), true);
  assert.equal(shouldSendPreviewNoindex("localhost", {}), true);
});
