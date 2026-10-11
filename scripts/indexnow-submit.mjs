import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const INDEXNOW_HOST = "aurora-tonight.com";
export const PRODUCTION_ORIGIN = `https://${INDEXNOW_HOST}`;
export const SITEMAP_PATH = "/sitemap.xml";

const KEY_PATTERN = /^[a-f0-9]{32}$/;
const DEFAULT_TIMEOUT_MS = 30_000;
const WAIT_TIMEOUT_MS = 8 * 60 * 1000;
const WAIT_INTERVAL_MS = 15_000;
const POST_ATTEMPTS = 3;
const RETRYABLE_STATUS = new Set([403, 429, 500, 502, 503, 504]);

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const isObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function parseAcquisitionPaths(source) {
  const match = /export const ACQUISITION_ROUTES = \[([\s\S]*?)\] as const;/.exec(
    source,
  );
  if (!match) {
    throw new Error("ACQUISITION_ROUTES export not found");
  }
  const paths = [...match[1].matchAll(/\{\s*path:\s*"(\/[^"]*)"\s*\}/g)].map(
    (item) => item[1],
  );
  if (paths.length === 0) {
    throw new Error("ACQUISITION_ROUTES contains no paths");
  }
  return paths;
}

export function urlsFromAcquisitionPaths(paths, origin = PRODUCTION_ORIGIN) {
  return paths.map((path) => new URL(path, origin).href);
}

export function parseSitemapUrls(xml) {
  if (typeof xml !== "string" || !xml.trim()) {
    throw new Error("sitemap is empty");
  }
  const blocks = [...xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url\s*>/gi)].map(
    (match) => match[1],
  );
  if (blocks.length === 0) {
    throw new Error("sitemap has no url entries");
  }
  return blocks.map((block, index) => {
    const locs = [...block.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc\s*>/gi)];
    if (locs.length !== 1) {
      throw new Error(`sitemap entry ${index + 1} has ${locs.length} loc elements`);
    }
    const value = locs[0][1]
      .trim()
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    const url = new URL(value);
    if (
      url.origin !== PRODUCTION_ORIGIN ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    ) {
      throw new Error(`sitemap loc is not a canonical production URL: ${value}`);
    }
    return url.href;
  });
}

export function assertSameUrlList(actual, expected) {
  if (actual.length !== expected.length) {
    throw new Error(
      `URL list length ${actual.length} does not match expected ${expected.length}`,
    );
  }
  for (const [index, url] of expected.entries()) {
    if (actual[index] !== url) {
      throw new Error(`URL list mismatch at ${index}: ${actual[index]} !== ${url}`);
    }
  }
}

export function readCommittedIndexNowKey({
  publicDir = join(repoRoot, "public"),
  indexnowSource = readFileSync(join(repoRoot, "lib/indexnow.ts"), "utf8"),
} = {}) {
  const declared = /export const INDEXNOW_KEY = "([a-f0-9]{32})";/.exec(
    indexnowSource,
  )?.[1];
  if (!declared || !KEY_PATTERN.test(declared)) {
    throw new Error("INDEXNOW_KEY must be a 32-character lowercase hex string");
  }
  const body = readFileSync(join(publicDir, `${declared}.txt`), "utf8").replace(
    /\r?\n$/,
    "",
  );
  if (body !== declared) {
    throw new Error("IndexNow key file body must equal the committed key");
  }
  return declared;
}

export function indexNowPayload({ key, urlList }) {
  if (!KEY_PATTERN.test(key)) {
    throw new Error("IndexNow key must be a 32-character lowercase hex string");
  }
  if (!Array.isArray(urlList) || urlList.length === 0) {
    throw new Error("IndexNow urlList must be a non-empty array");
  }
  return {
    host: INDEXNOW_HOST,
    key,
    keyLocation: `${PRODUCTION_ORIGIN}/${key}.txt`,
    urlList: [...urlList],
  };
}

const headerValue = (headers, name) => {
  if (!headers) return "";
  if (typeof headers.get === "function") return headers.get(name) ?? "";
  const record = isObject(headers) ? headers : {};
  const match = Object.keys(record).find(
    (key) => key.toLowerCase() === name.toLowerCase(),
  );
  return match ? String(record[match] ?? "") : "";
};

export async function readKeyFile(fetchImpl, origin, key, timeoutSignal) {
  const response = await fetchImpl(`${origin}/${key}.txt`, {
    method: "GET",
    redirect: "manual",
    cache: "no-store",
    signal: timeoutSignal(DEFAULT_TIMEOUT_MS),
  });
  if (response.status !== 200) {
    throw new Error(`key file HTTP ${response.status}`);
  }
  const contentType = headerValue(response.headers, "content-type").toLowerCase();
  if (!contentType.includes("text/plain")) {
    throw new Error(`key file content-type ${contentType || "<missing>"}`);
  }
  const body = String(await response.text()).replace(/\r?\n$/, "");
  if (body !== key) {
    throw new Error("key file body does not match the committed key");
  }
  return body;
}

export async function readLiveSitemapUrls(fetchImpl, origin, timeoutSignal) {
  const response = await fetchImpl(`${origin}${SITEMAP_PATH}`, {
    method: "GET",
    redirect: "manual",
    cache: "no-store",
    signal: timeoutSignal(DEFAULT_TIMEOUT_MS),
  });
  if (response.status !== 200) {
    throw new Error(`sitemap HTTP ${response.status}`);
  }
  return parseSitemapUrls(await response.text());
}

export async function waitForProductionIndexNow({
  fetchImpl,
  origin,
  key,
  expectedUrls,
  timeoutMs = WAIT_TIMEOUT_MS,
  intervalMs = WAIT_INTERVAL_MS,
  now = Date.now,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  timeoutSignal = AbortSignal.timeout,
} = {}) {
  const deadline = now() + timeoutMs;
  let lastError = new Error("production IndexNow assets were not ready");
  while (now() <= deadline) {
    try {
      await readKeyFile(fetchImpl, origin, key, timeoutSignal);
      const liveUrls = await readLiveSitemapUrls(fetchImpl, origin, timeoutSignal);
      assertSameUrlList(liveUrls, expectedUrls);
      return liveUrls;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (now() + intervalMs > deadline) break;
      await sleep(intervalMs);
    }
  }
  throw lastError;
}

export async function submitIndexNow({
  fetchImpl,
  payload,
  dryRun = false,
  attempts = POST_ATTEMPTS,
  timeoutSignal = AbortSignal.timeout,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  if (dryRun) {
    return { ok: true, dryRun: true, status: null, attempts: 0 };
  }
  let lastStatus = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "error",
        cache: "no-store",
        signal: timeoutSignal(DEFAULT_TIMEOUT_MS),
      });
    } catch {
      if (attempt === attempts) {
        throw new Error("IndexNow request failed");
      }
      await sleep(1_000 * attempt);
      continue;
    }
    lastStatus = response.status;
    if (response.status === 200 || response.status === 202) {
      return { ok: true, dryRun: false, status: response.status, attempts: attempt };
    }
    if (!RETRYABLE_STATUS.has(response.status) || attempt === attempts) {
      throw new Error(`IndexNow HTTP ${response.status}`);
    }
    await sleep(1_000 * attempt);
  }
  throw new Error(`IndexNow HTTP ${lastStatus}`);
}

const parseArgs = (argv) => {
  const options = {
    wait: false,
    dryRun: false,
    offline: false,
    origin: PRODUCTION_ORIGIN,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--wait") options.wait = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--offline") options.offline = true;
    else if (arg === "--base-url") {
      const value = argv[index + 1];
      if (!value) throw new Error("--base-url requires a URL");
      options.origin = new URL(value).origin;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
};

export async function runIndexNowSubmit({
  argv = [],
  env = process.env,
  fetchImpl = fetch,
  logger = console,
  readRoutesSource = () =>
    readFileSync(join(repoRoot, "lib/acquisition-routes.ts"), "utf8"),
  timeoutSignal = AbortSignal.timeout,
  sleep,
  now,
} = {}) {
  const options = parseArgs(argv);
  const origin = options.origin || env.INDEXNOW_BASE_URL || PRODUCTION_ORIGIN;
  const key = readCommittedIndexNowKey();
  const expectedUrls = urlsFromAcquisitionPaths(parseAcquisitionPaths(readRoutesSource()));
  let urlList = expectedUrls;

  if (options.wait) {
    urlList = await waitForProductionIndexNow({
      fetchImpl,
      origin,
      key,
      expectedUrls,
      timeoutSignal,
      sleep,
      now,
    });
  } else if (!options.offline) {
    urlList = await readLiveSitemapUrls(fetchImpl, origin, timeoutSignal);
    assertSameUrlList(urlList, expectedUrls);
  }

  const payload = indexNowPayload({ key, urlList });
  const result = await submitIndexNow({
    fetchImpl,
    payload,
    dryRun: options.dryRun,
    timeoutSignal,
    sleep,
  });
  logger.log(
    JSON.stringify({
      ok: true,
      dryRun: result.dryRun,
      status: result.status,
      host: payload.host,
      keyLocation: payload.keyLocation,
      urlCount: payload.urlList.length,
      endpoint: INDEXNOW_ENDPOINT,
    }),
  );
  return result;
}

export async function main(argv = process.argv.slice(2), options = {}) {
  try {
    await runIndexNowSubmit({ ...options, argv });
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    (options.logger ?? console).error(message);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
