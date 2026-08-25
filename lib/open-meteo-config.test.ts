import assert from "node:assert/strict";
import test from "node:test";

import {
  appendOpenMeteoCredential,
  redactOpenMeteoError,
  resolveOpenMeteoConfig,
// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
} from "./open-meteo-config.ts";

const SENTINEL_KEY = "SENTINEL_OPEN_METEO_KEY_DO_NOT_LEAK";
const CUSTOMER_URL = "https://customer-api.open-meteo.com/v1/forecast";
const FREE_URL = "https://api.open-meteo.com/v1/forecast";

test("production rejects the free endpoint", () => {
  assert.throws(
    () =>
      resolveOpenMeteoConfig({
        VERCEL_ENV: "production",
        OPEN_METEO_API_BASE: FREE_URL,
        OPEN_METEO_API_KEY: SENTINEL_KEY,
      }),
    /commercial Open-Meteo endpoint/i,
  );
});

test("production noncommercial mode uses only the canonical free endpoint without a key", () => {
  const config = resolveOpenMeteoConfig({
    VERCEL_ENV: "production",
    OPEN_METEO_USAGE_MODE: "noncommercial",
  });
  const requestUrl = new URL(config.baseUrl);
  requestUrl.searchParams.set("latitude", "64.8400");

  const result = appendOpenMeteoCredential(requestUrl, config);

  assert.deepEqual(config, { baseUrl: FREE_URL, apiKey: null });
  assert.equal(result.searchParams.get("apikey"), null);
});

test("production noncommercial mode rejects any configured API key", () => {
  assert.throws(
    () =>
      resolveOpenMeteoConfig({
        VERCEL_ENV: "production",
        OPEN_METEO_USAGE_MODE: "noncommercial",
        OPEN_METEO_API_KEY: SENTINEL_KEY,
      }),
    /API key.*noncommercial|noncommercial.*API key/i,
  );
});

test("production noncommercial mode rejects a noncanonical configured endpoint", () => {
  for (const baseUrl of [
    CUSTOMER_URL,
    "https://api.open-meteo.com/v1/not-forecast",
    `${FREE_URL}?apikey=embedded`,
  ]) {
    assert.throws(
      () =>
        resolveOpenMeteoConfig({
          VERCEL_ENV: "production",
          OPEN_METEO_USAGE_MODE: "noncommercial",
          OPEN_METEO_API_BASE: baseUrl,
        }),
      /canonical.*free|free.*endpoint/i,
    );
  }
});

test("production rejects invalid Open-Meteo usage modes", () => {
  for (const usageMode of ["commercial", "NonCommercial", "invalid", " "]) {
    assert.throws(
      () =>
        resolveOpenMeteoConfig({
          VERCEL_ENV: "production",
          OPEN_METEO_USAGE_MODE: usageMode,
          OPEN_METEO_API_BASE: CUSTOMER_URL,
          OPEN_METEO_API_KEY: SENTINEL_KEY,
        }),
      /usage mode/i,
    );
  }
});

test("production rejects a noncanonical customer endpoint", () => {
  for (const baseUrl of [
    "https://customer-api.open-meteo.com/v1/not-forecast",
    "https://customer-api.open-meteo.com:444/v1/forecast",
    "https://customer-api.open-meteo.com/v1/forecast?apikey=embedded",
  ]) {
    assert.throws(
      () =>
        resolveOpenMeteoConfig({
          VERCEL_ENV: "production",
          OPEN_METEO_API_BASE: baseUrl,
          OPEN_METEO_API_KEY: SENTINEL_KEY,
        }),
      /commercial Open-Meteo endpoint/i,
    );
  }
});

test("production rejects a missing API key", () => {
  assert.throws(
    () =>
      resolveOpenMeteoConfig({
        VERCEL_ENV: "production",
        OPEN_METEO_API_BASE: CUSTOMER_URL,
        OPEN_METEO_API_KEY: "   ",
      }),
    /API key/i,
  );
});

test("production returns customer endpoint and appends apikey", () => {
  const config = resolveOpenMeteoConfig({
    VERCEL_ENV: "production",
    OPEN_METEO_API_BASE: CUSTOMER_URL,
    OPEN_METEO_API_KEY: SENTINEL_KEY,
  });
  const unsigned = new URL(config.baseUrl);
  unsigned.searchParams.set("apikey", "PREMATURE_CREDENTIAL_MUST_BE_REPLACED");
  unsigned.searchParams.set("latitude", "64.8400");
  unsigned.searchParams.set("timezone", "America/Anchorage");

  const authenticated = appendOpenMeteoCredential(unsigned, config);

  assert.equal(config.baseUrl, CUSTOMER_URL);
  assert.equal(authenticated.hostname, "customer-api.open-meteo.com");
  assert.equal(authenticated.searchParams.get("apikey"), SENTINEL_KEY);
  assert.deepEqual(authenticated.searchParams.getAll("apikey"), [SENTINEL_KEY]);
  assert.match(authenticated.search, /latitude=.*&timezone=.*&apikey=[^&]+$/);
});

test("preview may use the free evaluation endpoint", () => {
  assert.deepEqual(resolveOpenMeteoConfig({ VERCEL_ENV: "preview" }), {
    baseUrl: FREE_URL,
    apiKey: null,
  });
});

test("usage mode does not change preview behavior", () => {
  assert.deepEqual(
    resolveOpenMeteoConfig({
      VERCEL_ENV: "preview",
      OPEN_METEO_USAGE_MODE: "invalid-outside-production",
    }),
    { baseUrl: FREE_URL, apiKey: null },
  );
});

test("fault-injection override works outside production", () => {
  const faultUrl = "https://fault.invalid/open-meteo";
  assert.deepEqual(
    resolveOpenMeteoConfig({
      VERCEL_ENV: "development",
      OPEN_METEO_API_BASE: FREE_URL,
      AURORA_CLOUD_URL: faultUrl,
    }),
    { baseUrl: faultUrl, apiKey: null },
  );
});

test("fault-injection override never receives a configured API key", () => {
  const config = resolveOpenMeteoConfig({
    VERCEL_ENV: "preview",
    OPEN_METEO_API_KEY: SENTINEL_KEY,
    AURORA_CLOUD_URL: "https://fault.invalid/open-meteo",
  });
  const requestUrl = new URL(config.baseUrl);
  requestUrl.searchParams.set("latitude", "64.8400");

  const result = appendOpenMeteoCredential(requestUrl, config);
  const serialized = JSON.stringify({ url: result.toString() });

  assert.equal(result.searchParams.get("apikey"), null);
  assert.doesNotMatch(serialized, new RegExp(SENTINEL_KEY));
});

for (const { label, url } of [
  {
    label: "HTTP",
    url: "http://customer-api.open-meteo.com/v1/forecast",
  },
  {
    label: "non-default port",
    url: "https://customer-api.open-meteo.com:444/v1/forecast",
  },
  {
    label: "userinfo",
    url: "https://user:password@customer-api.open-meteo.com/v1/forecast",
  },
  {
    label: "wrong path",
    url: "https://customer-api.open-meteo.com/v1/not-forecast",
  },
  {
    label: "hash",
    url: "https://customer-api.open-meteo.com/v1/forecast#fragment",
  },
]) {
  test(`noncanonical ${label} customer URL never receives a configured API key`, () => {
    const config = resolveOpenMeteoConfig({
      VERCEL_ENV: "preview",
      OPEN_METEO_API_BASE: CUSTOMER_URL,
      OPEN_METEO_API_KEY: SENTINEL_KEY,
    });
    const requestUrl = new URL(url);
    requestUrl.searchParams.set("apikey", "PREMATURE_CREDENTIAL_MUST_BE_REMOVED");
    requestUrl.searchParams.set("latitude", "64.8400");

    const result = appendOpenMeteoCredential(requestUrl, config);
    const serialized = JSON.stringify({ url: result.toString() });

    assert.equal(result.searchParams.get("latitude"), "64.8400");
    assert.equal(result.searchParams.get("apikey"), null);
    assert.doesNotMatch(serialized, new RegExp(SENTINEL_KEY));
  });
}

test("production ignores AURORA_CLOUD_URL even when it names the free endpoint", () => {
  assert.deepEqual(
    resolveOpenMeteoConfig({
      VERCEL_ENV: "production",
      OPEN_METEO_API_BASE: CUSTOMER_URL,
      OPEN_METEO_API_KEY: SENTINEL_KEY,
      AURORA_CLOUD_URL: FREE_URL,
    }),
    { baseUrl: CUSTOMER_URL, apiKey: SENTINEL_KEY },
  );
});

test("redacted errors never contain sentinel key or authenticated URL", () => {
  const authenticatedUrl = `${CUSTOMER_URL}?latitude=64.84&apikey=${SENTINEL_KEY}`;
  const redacted = redactOpenMeteoError(
    new Error(`request failed: ${authenticatedUrl}`),
    SENTINEL_KEY,
  );
  const serialized = JSON.stringify({ ok: false, error: redacted });

  assert.doesNotMatch(serialized, new RegExp(SENTINEL_KEY));
  assert.doesNotMatch(serialized, /customer-api\.open-meteo\.com\/v1\/forecast\?/);
  assert.equal(redacted, "Open-Meteo request failed");
});
