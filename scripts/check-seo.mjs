const CANONICAL_ORIGIN = "https://aurora-tonight.com";
const EXPECTED_SITEMAP_PATHS = 23;
const VIEW_PROBES = [
  "/view",
  "/view?lat=64.840&lng=-147.720&name=Fairbanks%2C+Alaska",
];
const NOT_FOUND_PROBES = ["/forecast/boston", "/route-that-must-not-exist"];

const summary = {
  ok: false,
  sitemap: { status: null, urls: 0, uniquePaths: 0, lastmod: 0 },
  indexable: { expected: EXPECTED_SITEMAP_PATHS, checked: 0, valid: 0 },
  internalLinks: { discovered: 0, checked: 0, broken: 0 },
  view: { checked: 0, valid: 0 },
  notFound: { checked: 0, valid: 0 },
  errors: [],
};

function violation(scope, message) {
  summary.errors.push({ scope, message });
}

function normalizeText(value) {
  return decodeEntities(value).replace(/\s+/g, " ").trim();
}

function decodeEntities(value) {
  const named = new Map([
    ["amp", "&"],
    ["apos", "'"],
    ["gt", ">"],
    ["lt", "<"],
    ["nbsp", " "],
    ["quot", '"'],
  ]);
  return value.replace(/&(#(?:x[0-9a-f]+|[0-9]+)|[a-z][a-z0-9]+);/gi, (entity, body) => {
    if (body[0] === "#") {
      const hex = body[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
        throw new Error(`invalid numeric HTML entity ${entity}`);
      }
      return String.fromCodePoint(codePoint);
    }
    return named.get(body.toLowerCase()) ?? entity;
  });
}

function readTag(source, start) {
  let cursor = start + 1;
  let closing = false;
  if (source[cursor] === "/") {
    closing = true;
    cursor += 1;
  }
  while (/\s/.test(source[cursor] ?? "")) cursor += 1;
  const nameMatch = /^[a-z][a-z0-9:-]*/i.exec(source.slice(cursor));
  if (!nameMatch) throw new Error(`malformed tag at byte ${start}`);
  const name = nameMatch[0].toLowerCase();
  cursor += nameMatch[0].length;
  const attrs = new Map();
  let selfClosing = false;

  while (cursor < source.length) {
    while (/\s/.test(source[cursor] ?? "")) cursor += 1;
    if (source[cursor] === ">") return { attrs, closing, end: cursor + 1, name, selfClosing };
    if (source[cursor] === "/" && source[cursor + 1] === ">") {
      selfClosing = true;
      return { attrs, closing, end: cursor + 2, name, selfClosing };
    }
    if (closing) throw new Error(`closing </${name}> tag has attributes`);

    const attrMatch = /^[^\s"'=<>`/]+/.exec(source.slice(cursor));
    if (!attrMatch) throw new Error(`malformed attribute on <${name}> at byte ${cursor}`);
    const attrName = attrMatch[0].toLowerCase();
    if (attrs.has(attrName)) throw new Error(`duplicate ${attrName} attribute on <${name}>`);
    cursor += attrMatch[0].length;
    while (/\s/.test(source[cursor] ?? "")) cursor += 1;

    let value = "";
    if (source[cursor] === "=") {
      cursor += 1;
      while (/\s/.test(source[cursor] ?? "")) cursor += 1;
      const quote = source[cursor];
      if (quote === '"' || quote === "'") {
        const end = source.indexOf(quote, cursor + 1);
        if (end === -1) throw new Error(`unterminated ${attrName} attribute on <${name}>`);
        value = source.slice(cursor + 1, end);
        cursor = end + 1;
      } else {
        const valueMatch = /^[^\s"'=<>`]+/.exec(source.slice(cursor));
        if (!valueMatch) throw new Error(`missing ${attrName} value on <${name}>`);
        value = valueMatch[0];
        cursor += value.length;
      }
    }
    attrs.set(attrName, decodeEntities(value));
  }
  throw new Error(`unterminated <${name}> tag`);
}

function parseHtml(html) {
  if (!/^\s*<!doctype html(?:\s[^>]*)?>/i.test(html)) throw new Error("missing HTML doctype");
  const document = { anchors: [], canonical: [], h1: [], jsonLd: [], ogImages: [], robots: [], titles: [], twitterCards: [] };
  const textContexts = [];
  let cursor = 0;

  while (cursor < html.length) {
    const open = html.indexOf("<", cursor);
    const textEnd = open === -1 ? html.length : open;
    if (textContexts.length) textContexts[textContexts.length - 1].text += html.slice(cursor, textEnd);
    if (open === -1) break;
    if (html.startsWith("<!--", open)) {
      const end = html.indexOf("-->", open + 4);
      if (end === -1) throw new Error("unterminated HTML comment");
      cursor = end + 3;
      continue;
    }
    if (/^<!doctype\b/i.test(html.slice(open))) {
      const end = html.indexOf(">", open + 2);
      if (end === -1) throw new Error("unterminated doctype");
      cursor = end + 1;
      continue;
    }
    const tag = readTag(html, open);
    cursor = tag.end;

    if (tag.closing) {
      if (tag.name === "title" || tag.name === "h1") {
        const context = textContexts.pop();
        if (!context || context.name !== tag.name) throw new Error(`unbalanced </${tag.name}> tag`);
        document[tag.name === "title" ? "titles" : "h1"].push(normalizeText(context.text));
      }
      continue;
    }

    if (tag.name === "title" || tag.name === "h1") {
      textContexts.push({ name: tag.name, text: "" });
    }
    if (tag.name === "a" && tag.attrs.has("href")) document.anchors.push(tag.attrs.get("href"));
    if (tag.name === "link") {
      const rel = new Set((tag.attrs.get("rel") ?? "").toLowerCase().split(/\s+/).filter(Boolean));
      if (rel.has("canonical")) document.canonical.push(tag.attrs.get("href") ?? "");
    }
    if (tag.name === "meta") {
      const content = tag.attrs.get("content") ?? "";
      const name = (tag.attrs.get("name") ?? "").toLowerCase();
      const property = (tag.attrs.get("property") ?? "").toLowerCase();
      if (name === "robots") document.robots.push(content);
      if (name === "twitter:card") document.twitterCards.push(content);
      if (property === "og:image") document.ogImages.push(content);
    }
    if (tag.name === "script" || tag.name === "style") {
      const closePattern = new RegExp(`<\\/${tag.name}\\s*>`, "ig");
      closePattern.lastIndex = cursor;
      const close = closePattern.exec(html);
      if (!close) throw new Error(`unterminated <${tag.name}> block`);
      const body = html.slice(cursor, close.index);
      if (tag.name === "script" && (tag.attrs.get("type") ?? "").toLowerCase() === "application/ld+json") {
        document.jsonLd.push(body);
      }
      cursor = close.index + close[0].length;
    }
  }
  if (textContexts.length) throw new Error(`unclosed <${textContexts.at(-1).name}> tag`);
  return document;
}

function parseSitemap(xml) {
  if (!/^\s*<\?xml\b[^?]*\?>/i.test(xml)) throw new Error("sitemap is missing its XML declaration");
  if (!/<urlset\b[^>]*xmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["'][^>]*>/i.test(xml)) {
    throw new Error("sitemap is missing the standard urlset namespace");
  }
  const urlBlocks = [...xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url\s*>/gi)].map((match) => match[1]);
  if (!urlBlocks.length) throw new Error("sitemap has no url entries");
  const urls = urlBlocks.map((block, index) => {
    const locs = [...block.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc\s*>/gi)];
    if (locs.length !== 1) throw new Error(`sitemap entry ${index + 1} has ${locs.length} loc elements`);
    return decodeEntities(locs[0][1].trim());
  });
  const lastmod = [...xml.matchAll(/<lastmod\b/gi)].length;
  return { lastmod, urls };
}

function directiveSet(value) {
  return new Set(value.toLowerCase().split(",").map((part) => part.trim()).filter(Boolean));
}

function requireRobots(document, expected, scope) {
  if (document.robots.length !== 1) {
    violation(scope, `expected exactly one robots meta tag, found ${document.robots.length}`);
    return false;
  }
  const actual = directiveSet(document.robots[0]);
  const valid = actual.size === expected.length && expected.every((item) => actual.has(item));
  if (!valid) violation(scope, `robots must be exactly ${expected.join(",")}; received ${document.robots[0] || "<empty>"}`);
  return valid;
}

async function fetchRoute(baseUrl, pathAndQuery) {
  const response = await fetch(new URL(pathAndQuery, baseUrl), { redirect: "follow", signal: AbortSignal.timeout(30_000) });
  return { response, text: await response.text() };
}

function validateIndexable(path, html, status, titles, h1Values) {
  const scope = `indexable:${path}`;
  let valid = true;
  if (status !== 200) {
    violation(scope, `expected 200, received ${status}`);
    return { anchors: [], valid: false };
  }
  let document;
  try {
    document = parseHtml(html);
  } catch (error) {
    violation(scope, `HTML parse failed: ${error.message}`);
    return { anchors: [], valid: false };
  }
  if (!requireRobots(document, ["index", "follow"], scope)) valid = false;
  if (document.titles.length !== 1 || !document.titles[0]) {
    violation(scope, `expected one non-empty title, found ${document.titles.length}`);
    valid = false;
  } else if (titles.has(document.titles[0])) {
    violation(scope, `duplicate title shared with ${titles.get(document.titles[0])}: ${document.titles[0]}`);
    valid = false;
  } else titles.set(document.titles[0], path);
  if (document.h1.length !== 1 || !document.h1[0]) {
    violation(scope, `expected one non-empty H1, found ${document.h1.length}`);
    valid = false;
  } else if (h1Values.has(document.h1[0])) {
    violation(scope, `duplicate H1 shared with ${h1Values.get(document.h1[0])}: ${document.h1[0]}`);
    valid = false;
  } else h1Values.set(document.h1[0], path);
  const expectedCanonical = new URL(path, CANONICAL_ORIGIN);
  let canonicalValid = document.canonical.length === 1;
  if (canonicalValid) {
    try {
      const canonical = new URL(document.canonical[0]);
      canonicalValid = canonical.origin === expectedCanonical.origin
        && canonical.pathname === expectedCanonical.pathname
        && canonical.search === ""
        && canonical.hash === ""
        && canonical.username === ""
        && canonical.password === "";
    } catch {
      canonicalValid = false;
    }
  }
  if (!canonicalValid) {
    violation(scope, `canonical must identify ${expectedCanonical.href} without query or hash; received ${JSON.stringify(document.canonical)}`);
    valid = false;
  }
  if (!document.ogImages.length) {
    violation(scope, "missing og:image");
    valid = false;
  } else {
    for (const image of document.ogImages) {
      try {
        const url = new URL(image);
        if (!/^https?:$/.test(url.protocol)) throw new Error("unsupported protocol");
      } catch {
        violation(scope, `invalid absolute og:image URL: ${image || "<empty>"}`);
        valid = false;
      }
    }
  }
  if (document.twitterCards.length !== 1 || document.twitterCards[0].toLowerCase() !== "summary_large_image") {
    violation(scope, `twitter:card must be summary_large_image; received ${JSON.stringify(document.twitterCards)}`);
    valid = false;
  }
  for (const [index, block] of document.jsonLd.entries()) {
    try {
      if (!block.trim()) throw new Error("empty JSON-LD block");
      JSON.parse(block);
    } catch (error) {
      violation(scope, `JSON-LD block ${index + 1} is invalid: ${error.message}`);
      valid = false;
    }
  }
  return { anchors: document.anchors, valid };
}

function internalTarget(href, pagePath) {
  if (!href || href.startsWith("#")) return null;
  let target;
  try {
    target = new URL(href, `${CANONICAL_ORIGIN}${pagePath}`);
  } catch {
    return null;
  }
  if (target.origin !== CANONICAL_ORIGIN) return null;
  target.hash = "";
  return `${target.pathname}${target.search}`;
}

async function main() {
  let baseUrl;
  try {
    baseUrl = new URL(process.env.BASE_URL ?? "http://127.0.0.1:3107");
    if (!/^https?:$/.test(baseUrl.protocol) || baseUrl.pathname !== "/" || baseUrl.search || baseUrl.hash) {
      throw new Error("BASE_URL must be an HTTP(S) origin without a path, query, or hash");
    }
  } catch (error) {
    violation("configuration", error.message);
    return;
  }

  let sitemap;
  try {
    const result = await fetchRoute(baseUrl, "/sitemap.xml");
    summary.sitemap.status = result.response.status;
    if (result.response.status !== 200) throw new Error(`expected 200, received ${result.response.status}`);
    sitemap = parseSitemap(result.text);
  } catch (error) {
    violation("sitemap", error.message);
    return;
  }

  summary.sitemap.urls = sitemap.urls.length;
  summary.sitemap.lastmod = sitemap.lastmod;
  if (sitemap.lastmod !== 0) violation("sitemap", `lastmod is forbidden; found ${sitemap.lastmod}`);
  const paths = [];
  for (const value of sitemap.urls) {
    try {
      const url = new URL(value);
      if (url.origin !== CANONICAL_ORIGIN || url.search || url.hash || url.username || url.password) {
        throw new Error("must be a canonical-origin URL containing only a path");
      }
      if (url.href !== `${CANONICAL_ORIGIN}${url.pathname}`) throw new Error("must use normalized canonical-origin form");
      paths.push(url.pathname);
    } catch (error) {
      violation("sitemap", `${value}: ${error.message}`);
    }
  }
  const uniquePaths = [...new Set(paths)];
  summary.sitemap.uniquePaths = uniquePaths.length;
  if (sitemap.urls.length !== EXPECTED_SITEMAP_PATHS) violation("sitemap", `expected ${EXPECTED_SITEMAP_PATHS} URLs, found ${sitemap.urls.length}`);
  if (uniquePaths.length !== EXPECTED_SITEMAP_PATHS) violation("sitemap", `expected ${EXPECTED_SITEMAP_PATHS} unique canonical-origin paths, found ${uniquePaths.length}`);

  const titles = new Map();
  const h1Values = new Map();
  const discovered = new Set();
  for (const path of uniquePaths) {
    try {
      const result = await fetchRoute(baseUrl, path);
      summary.indexable.checked += 1;
      const validation = validateIndexable(path, result.text, result.response.status, titles, h1Values);
      if (validation.valid) summary.indexable.valid += 1;
      for (const href of validation.anchors) {
        const target = internalTarget(href, path);
        if (target) discovered.add(target);
      }
    } catch (error) {
      violation(`indexable:${path}`, `request failed: ${error.message}`);
    }
  }

  for (const path of VIEW_PROBES) {
    const scope = `view:${path}`;
    try {
      const result = await fetchRoute(baseUrl, path);
      summary.view.checked += 1;
      let valid = true;
      if (result.response.status !== 200) {
        violation(scope, `expected 200, received ${result.response.status}`);
        valid = false;
      }
      let document;
      try {
        document = parseHtml(result.text);
      } catch (error) {
        violation(scope, `HTML parse failed: ${error.message}`);
        valid = false;
      }
      if (document) {
        if (!requireRobots(document, ["noindex", "follow"], scope)) valid = false;
        if (document.canonical.length !== 0) {
          violation(scope, `expected no canonical, received ${JSON.stringify(document.canonical)}`);
          valid = false;
        }
        for (const href of document.anchors) {
          const target = internalTarget(href, new URL(path, CANONICAL_ORIGIN).pathname);
          if (target) discovered.add(target);
        }
      }
      if (valid) summary.view.valid += 1;
    } catch (error) {
      violation(scope, `request failed: ${error.message}`);
    }
  }

  const crawlQueue = [...discovered].sort();
  const crawled = new Set();
  while (crawlQueue.length) {
    const path = crawlQueue.shift();
    if (crawled.has(path)) continue;
    crawled.add(path);
    try {
      const result = await fetchRoute(baseUrl, path);
      summary.internalLinks.checked += 1;
      if (result.response.status >= 400) {
        summary.internalLinks.broken += 1;
        violation(`anchor:${path}`, `internal anchor returned ${result.response.status}`);
        continue;
      }
      const contentType = result.response.headers.get("content-type") ?? "";
      if (contentType.toLowerCase().includes("text/html")) {
        const document = parseHtml(result.text);
        for (const href of document.anchors) {
          const target = internalTarget(href, new URL(path, CANONICAL_ORIGIN).pathname);
          if (target && !crawled.has(target) && !discovered.has(target)) {
            discovered.add(target);
            crawlQueue.push(target);
            crawlQueue.sort();
          }
        }
      }
    } catch (error) {
      summary.internalLinks.broken += 1;
      violation(`anchor:${path}`, `request or parse failed: ${error.message}`);
    }
  }
  summary.internalLinks.discovered = discovered.size;

  for (const path of NOT_FOUND_PROBES) {
    try {
      const result = await fetchRoute(baseUrl, path);
      summary.notFound.checked += 1;
      if (result.response.status === 404) summary.notFound.valid += 1;
      else violation(`notFound:${path}`, `expected 404, received ${result.response.status}`);
    } catch (error) {
      violation(`notFound:${path}`, `request failed: ${error.message}`);
    }
  }
}

try {
  await main();
} catch (error) {
  violation("checker", error instanceof Error ? error.message : String(error));
}
summary.ok = summary.errors.length === 0;
process.stdout.write(`${JSON.stringify(summary)}\n`);
if (!summary.ok) process.exitCode = 1;
