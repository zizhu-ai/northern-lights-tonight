import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
import { ACQUISITION_ROUTES } from "./acquisition-routes.ts";
// @ts-ignore TS5097: see the strip-types runner note above.
import { PRIMARY_HOST, productionCanonicalRedirectUrl, siteRobots } from "./indexing.ts";
// @ts-ignore TS5097: see the strip-types runner note above.
import { INDEXNOW_ENDPOINT, INDEXNOW_HOST, INDEXNOW_KEY, INDEXNOW_KEY_FILENAME, INDEXNOW_KEY_LOCATION, INDEXNOW_KEY_PATH, indexNowPayload, indexNowUrlList, isIndexNowKeyPath } from "./indexnow.ts";
// @ts-ignore TS5097: see the strip-types runner note above.
import { SITE_URL } from "./site.ts";

const root = fileURLToPath(new URL("../", import.meta.url));

test("IndexNow key is a committed 32-hex string and matches the public file", () => {
  assert.match(INDEXNOW_KEY, /^[a-f0-9]{32}$/);
  assert.equal(INDEXNOW_KEY_FILENAME, `${INDEXNOW_KEY}.txt`);
  assert.equal(INDEXNOW_KEY_PATH, `/${INDEXNOW_KEY}.txt`);
  const publicDir = join(root, "public");
  const keyFiles = readdirSync(publicDir).filter((name) =>
    /^[a-f0-9]{32}\.txt$/.test(name),
  );
  assert.deepEqual(keyFiles, [INDEXNOW_KEY_FILENAME]);
  const raw = readFileSync(join(publicDir, INDEXNOW_KEY_FILENAME));
  assert.equal(raw.length, 32);
  assert.equal(raw.toString("utf8"), INDEXNOW_KEY);
});

test("IndexNow payload lists every sitemap acquisition URL on the primary host", () => {
  const urls = indexNowUrlList();
  assert.equal(INDEXNOW_HOST, PRIMARY_HOST);
  assert.equal(INDEXNOW_KEY_LOCATION, `${SITE_URL}${INDEXNOW_KEY_PATH}`);
  assert.equal(INDEXNOW_ENDPOINT, "https://api.indexnow.org/indexnow");
  assert.equal(urls.length, ACQUISITION_ROUTES.length);
  assert.equal(urls.length, 33);
  assert.ok(urls.includes(`${SITE_URL}/forecast/new-york`));
  assert.ok(urls.includes(`${SITE_URL}/forecast/iowa`));
  assert.deepEqual(
    urls,
    ACQUISITION_ROUTES.map(({ path }) => new URL(path, SITE_URL).href),
  );
  const payload = indexNowPayload();
  assert.deepEqual(payload, {
    host: PRIMARY_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: urls,
  });
});

test("robots and canonical redirects leave the IndexNow key file fetchable", () => {
  const policy = siteRobots();
  assert.equal(policy.rules.allow, "/");
  assert.equal("disallow" in policy.rules, false);
  assert.equal(isIndexNowKeyPath(INDEXNOW_KEY_PATH), true);
  assert.equal(isIndexNowKeyPath(`${INDEXNOW_KEY_PATH}/`), true);
  assert.equal(isIndexNowKeyPath("/about"), false);
  assert.equal(
    productionCanonicalRedirectUrl(PRIMARY_HOST, INDEXNOW_KEY_PATH, ""),
    null,
  );
});
