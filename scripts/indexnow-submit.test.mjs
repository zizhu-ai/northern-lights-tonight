import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const {
  INDEXNOW_ENDPOINT,
  INDEXNOW_HOST,
  PRODUCTION_ORIGIN,
  assertSameUrlList,
  indexNowPayload,
  parseAcquisitionPaths,
  parseSitemapUrls,
  readCommittedIndexNowKey,
  readKeyFile,
  runIndexNowSubmit,
  submitIndexNow,
  urlsFromAcquisitionPaths,
  waitForProductionIndexNow,
} = await import("./indexnow-submit.mjs");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const routesSource = readFileSync(join(root, "lib/acquisition-routes.ts"), "utf8");
const indexnowSource = readFileSync(join(root, "lib/indexnow.ts"), "utf8");
const KEY = "80782f4c69d9488dc026c5d3346d9a88";

const expectedPaths = [
  "/",
  "/about",
  "/near-me",
  "/guides/best-time-to-see-northern-lights",
  "/guides/how-to-see-northern-lights",
  "/guides/where-to-see-northern-lights",
  "/methodology",
  "/privacy",
  "/terms",
  "/forecast/colorado",
  "/forecast/ohio",
  "/forecast/indiana",
  "/forecast/michigan",
  "/forecast/chicago",
  "/forecast/seattle",
  "/forecast/wisconsin",
  "/forecast/massachusetts",
  "/forecast/maine",
  "/forecast/minnesota",
  "/forecast/illinois",
  "/forecast/oregon",
  "/forecast/utah",
  "/forecast/alaska",
  "/forecast/fairbanks",
  "/forecast/new-york",
  "/forecast/pennsylvania",
  "/forecast/vermont",
  "/forecast/new-hampshire",
  "/forecast/montana",
  "/forecast/idaho",
  "/forecast/north-dakota",
  "/forecast/south-dakota",
  "/forecast/iowa",
];
const expectedUrls = expectedPaths.map((path) => `${PRODUCTION_ORIGIN}${path === "/" ? "/" : path}`);

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${expectedUrls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>
`;

const response = ({ status, body = "", headers = {} }) => ({
  status,
  headers: {
    get(name) {
      const match = Object.keys(headers).find(
        (key) => key.toLowerCase() === name.toLowerCase(),
      );
      return match ? headers[match] : null;
    },
  },
  async text() {
    return body;
  },
});

test("committed key file and ACQUISITION_ROUTES produce the live sitemap URL list", () => {
  assert.equal(readCommittedIndexNowKey(), KEY);
  const paths = parseAcquisitionPaths(routesSource);
  assert.deepEqual(paths, expectedPaths);
  const urls = urlsFromAcquisitionPaths(paths);
  assert.equal(urls.length, 33);
  assert.deepEqual(urls, expectedUrls);
  assert.deepEqual(parseSitemapUrls(sitemapXml), expectedUrls);
  const declaredKey = /export const INDEXNOW_KEY = "([a-f0-9]{32})";/.exec(
    indexnowSource,
  )?.[1];
  assert.equal(declaredKey, KEY);
});

test("IndexNow payload targets api.indexnow.org with host, key, and keyLocation", () => {
  const payload = indexNowPayload({ key: KEY, urlList: expectedUrls });
  assert.equal(INDEXNOW_HOST, "aurora-tonight.com");
  assert.equal(INDEXNOW_ENDPOINT, "https://api.indexnow.org/indexnow");
  assert.deepEqual(payload, {
    host: "aurora-tonight.com",
    key: KEY,
    keyLocation: `https://aurora-tonight.com/${KEY}.txt`,
    urlList: expectedUrls,
  });
});

test("key file probe requires 200 text/plain whose body is the key", async () => {
  await assert.rejects(
    () =>
      readKeyFile(
        async () =>
          response({
            status: 308,
            headers: { location: `https://aurora-tonight.com/${KEY}.txt` },
          }),
        PRODUCTION_ORIGIN,
        KEY,
        () => ({ timeout: 30_000 }),
      ),
    /key file HTTP 308/,
  );
  await assert.rejects(
    () =>
      readKeyFile(
        async () =>
          response({
            status: 200,
            headers: { "content-type": "text/html" },
            body: KEY,
          }),
        PRODUCTION_ORIGIN,
        KEY,
        () => ({ timeout: 30_000 }),
      ),
    /content-type/,
  );
  assert.equal(
    await readKeyFile(
      async () =>
        response({
          status: 200,
          headers: { "content-type": "text/plain; charset=utf-8" },
          body: `${KEY}\n`,
        }),
      PRODUCTION_ORIGIN,
      KEY,
      () => ({ timeout: 30_000 }),
    ),
    KEY,
  );
});

test("wait-for-production polls only the key file and sitemap, then IndexNow accepts 200/202", async () => {
  const seen = [];
  const fetchImpl = async (url, init = {}) => {
    seen.push({ url: String(url), method: init.method ?? "GET" });
    if (String(url) === `https://aurora-tonight.com/${KEY}.txt`) {
      return response({
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
        body: KEY,
      });
    }
    if (String(url) === "https://aurora-tonight.com/sitemap.xml") {
      return response({ status: 200, body: sitemapXml });
    }
    if (String(url) === INDEXNOW_ENDPOINT) {
      assert.equal(init.method, "POST");
      const payload = JSON.parse(init.body);
      assertSameUrlList(payload.urlList, expectedUrls);
      return response({ status: 202, body: "" });
    }
    throw new Error(`unexpected fetch ${url}`);
  };

  const urls = await waitForProductionIndexNow({
    fetchImpl,
    origin: PRODUCTION_ORIGIN,
    key: KEY,
    expectedUrls,
    timeoutMs: 1_000,
    intervalMs: 1,
    sleep: async () => {},
    timeoutSignal: () => ({ timeout: 30_000 }),
  });
  assert.deepEqual(urls, expectedUrls);

  for (const status of [200, 202]) {
    const result = await submitIndexNow({
      fetchImpl: async () => response({ status }),
      payload: indexNowPayload({ key: KEY, urlList: expectedUrls }),
      timeoutSignal: () => ({ timeout: 30_000 }),
    });
    assert.equal(result.status, status);
    assert.equal(result.ok, true);
  }

  const submitted = await runIndexNowSubmit({
    argv: ["--wait"],
    fetchImpl,
    logger: { log() {}, error() {} },
    timeoutSignal: () => ({ timeout: 30_000 }),
    sleep: async () => {},
  });
  assert.equal(submitted.status, 202);
  assert.deepEqual(
    seen.map((item) => item.url).sort(),
    [
      INDEXNOW_ENDPOINT,
      `https://aurora-tonight.com/${KEY}.txt`,
      `https://aurora-tonight.com/${KEY}.txt`,
      "https://aurora-tonight.com/sitemap.xml",
      "https://aurora-tonight.com/sitemap.xml",
    ].sort(),
  );
  assert.equal(
    seen.some((item) => /blob|open-meteo|ovation|swpc|forecast/i.test(item.url)),
    false,
  );
});

test("offline dry-run submits the acquisition URL list without touching forecast or Blob", async () => {
  const seen = [];
  const result = await runIndexNowSubmit({
    argv: ["--offline", "--dry-run"],
    fetchImpl: async (url) => {
      seen.push(String(url));
      throw new Error(`offline dry-run must not fetch ${url}`);
    },
    logger: { log() {}, error() {} },
  });
  assert.deepEqual(result, { ok: true, dryRun: true, status: null, attempts: 0 });
  assert.deepEqual(seen, []);
});
