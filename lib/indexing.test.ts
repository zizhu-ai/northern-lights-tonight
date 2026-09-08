import assert from "node:assert/strict";
import test from "node:test";

// Node's zero-dependency strip-types runner requires the explicit extension.
// @ts-ignore TS5097: the production build type-checks this test but does not emit it.
import {
  API_ROBOTS_TAG,
  PRIMARY_HOST,
  canonicalPathname,
  productionCanonicalRedirectUrl,
  siteRobots,
} from "./indexing.ts";
// @ts-ignore TS5097: see the strip-types runner note above.
import { SITE_URL } from "./site.ts";

test("robots.txt allows crawling so API noindex headers can be seen", () => {
  const policy = siteRobots();
  assert.equal(`https://${PRIMARY_HOST}`, SITE_URL);
  assert.equal(policy.sitemap, `${SITE_URL}/sitemap.xml`);
  assert.equal(policy.rules.userAgent, "*");
  assert.equal(policy.rules.allow, "/");
  assert.equal("disallow" in policy.rules, false);
});

test("API responses share a noindex robots tag", () => {
  assert.equal(API_ROBOTS_TAG, "noindex, nofollow");
});

test("canonical pathname keeps the homepage slash and strips extras", () => {
  assert.equal(canonicalPathname("/"), "/");
  assert.equal(canonicalPathname("/about"), "/about");
  assert.equal(canonicalPathname("/about/"), "/about");
  assert.equal(canonicalPathname("/forecast/alaska/"), "/forecast/alaska");
  assert.equal(canonicalPathname("/about//"), "/about");
});

test("production canonicalization redirects www, other hosts, and trailing slashes", () => {
  assert.equal(PRIMARY_HOST, "aurora-tonight.com");
  assert.equal(productionCanonicalRedirectUrl(PRIMARY_HOST, "/", ""), null);
  assert.equal(productionCanonicalRedirectUrl(PRIMARY_HOST, "/about", ""), null);
  assert.equal(
    productionCanonicalRedirectUrl(PRIMARY_HOST, "/about", "?utm=1"),
    null,
  );
  assert.equal(
    productionCanonicalRedirectUrl("www.aurora-tonight.com", "/", ""),
    `${SITE_URL}/`,
  );
  assert.equal(
    productionCanonicalRedirectUrl("www.aurora-tonight.com", "/about/", "?ref=gsc"),
    `${SITE_URL}/about?ref=gsc`,
  );
  assert.equal(
    productionCanonicalRedirectUrl(PRIMARY_HOST, "/about/", ""),
    `${SITE_URL}/about`,
  );
  assert.equal(
    productionCanonicalRedirectUrl("northern-lights-tonight.vercel.app", "/forecast/alaska", ""),
    `${SITE_URL}/forecast/alaska`,
  );
  assert.equal(
    productionCanonicalRedirectUrl("aurora-tonight.com:443", "/privacy", ""),
    null,
  );
});

test("malformed canonical paths cannot change the primary origin", () => {
  for (const pathname of [
    "//example.com/a", "///example.com/a/", "/\\example.com/a",
    "\\\\example.com/a", "https://example.com/a", "/%5Cexample.com/a",
    "/%2F%2Fexample.com/a", "//user:pass@example.com/a/", "/a?next=evil#fragment",
  ]) {
    const destination = productionCanonicalRedirectUrl(
      "www.aurora-tonight.com", pathname, "?next=https://example.com/#fragment",
    );
    assert.ok(destination);
    const url = new URL(destination);
    assert.equal(url.origin, SITE_URL, pathname);
    assert.equal(url.username, "", pathname);
    assert.equal(url.password, "", pathname);
    assert.equal(url.hash, "", pathname);
    assert.equal(url.searchParams.get("next"), "https://example.com/#fragment");
  }
});
