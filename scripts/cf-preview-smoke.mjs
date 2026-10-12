const origin = process.env.BASE_URL ?? "http://127.0.0.1:8787";
const canonicalOrigin = "https://aurora-tonight.com";

const pages = [
  "/",
  "/about",
  "/near-me",
  "/methodology",
  "/privacy",
  "/terms",
  "/forecast/alaska",
  "/forecast/fairbanks",
  "/guides/where-to-see-northern-lights",
  "/guides/how-to-see-northern-lights",
  "/guides/best-time-to-see-northern-lights",
  "/robots.txt",
  "/sitemap.xml",
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

async function fetchPage(path) {
  const response = await fetch(new URL(path, origin), { redirect: "manual" });
  const body = await response.text();
  return { response, body };
}

const { response: home, body: homeBody } = await fetchPage("/");
if (home.status !== 200) fail(`GET / expected 200, got ${home.status}`);
if (!homeBody.includes("rel=\"canonical\"") && !homeBody.includes(`href="${canonicalOrigin}`)) {
  fail("Homepage is missing a canonical link to https://aurora-tonight.com");
}
if (!homeBody.includes(canonicalOrigin)) {
  fail("Homepage does not mention the production canonical origin");
}

for (const path of pages) {
  const { response, body } = await fetchPage(path);
  if (response.status !== 200) {
    fail(`GET ${path} expected 200, got ${response.status}`);
    continue;
  }
  if (path === "/robots.txt") {
    if (!body.includes("Sitemap: https://aurora-tonight.com/sitemap.xml")) {
      fail("robots.txt is missing the production sitemap URL");
    }
    if (/disallow:\s*\/\s*$/im.test(body)) {
      fail("robots.txt must not Disallow /");
    }
  }
  if (path === "/sitemap.xml") {
    if (!body.includes(`${canonicalOrigin}/`)) {
      fail("sitemap.xml does not list the production origin");
    }
    if (!body.includes(`${canonicalOrigin}/forecast/alaska`)) {
      fail("sitemap.xml is missing /forecast/alaska");
    }
  }
  if (!["/robots.txt", "/sitemap.xml"].includes(path)) {
    const canonical = body.match(/rel="canonical"\s+href="([^"]+)"/)
      ?? body.match(/href="([^"]+)"\s+rel="canonical"/);
    if (canonical && !canonical[1].startsWith(canonicalOrigin)) {
      fail(`${path} canonical is ${canonical[1]}, expected ${canonicalOrigin}`);
    }
  }
}

if (process.exitCode) {
  throw new Error("Cloudflare preview smoke failed");
}
console.log(`Preview smoke passed against ${origin}`);
