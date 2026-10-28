import assert from "node:assert/strict";
import test from "node:test";

const HEALTH_URL = "https://aurora-tonight.com/api/health";
const PUBLIC_HEALTH_URL = HEALTH_URL;
const WORKERS_DEV_HEALTH_URL =
  "https://aurora-tonight.mengyu699.workers.dev/api/health";
const WEBHOOK = "https://open.feishu.cn/open-apis/bot/v2/hook/TEST_SECRET_SENTINEL";
const RUN_URL = "https://github.com/example/aurora/actions/runs/123456";
const NOW = new Date("2026-08-25T08:00:00.000Z");

const loadMonitor = () => import("./health-monitor.mjs");

const response = (status, body, headers = {}) => {
  const isError = body instanceof Error;
  const isString = typeof body === "string";
  const rawText = isError ? "" : isString ? body : JSON.stringify(body);
  const headerMap = {
    ...(isString
      ? { "content-type": "text/html; charset=UTF-8" }
      : { "content-type": "application/json" }),
    ...Object.fromEntries(
      Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
    ),
  };
  return {
    status,
    headers: {
      get(name) {
        return headerMap[String(name).toLowerCase()] ?? null;
      },
    },
    async text() {
      if (isError) throw body;
      return rawText;
    },
  };
};

const healthyBody = (checkedAgeSeconds = 0, status = "ok") => ({
  status,
  snapshot_revision: "snapshot-healthy",
  checked_at: "2026-08-25T07:59:59.000Z",
  checked_age_seconds: checkedAgeSeconds,
  last_success_at: "2026-08-25T07:59:59.000Z",
  last_success_age_seconds: 1,
  persistence_health: "ok",
  source_health: { ovation: "ok", kp: "ok", cloud: "ok" },
  source: "live",
  total: 50,
  unknowns: 0,
  generated_at: "2026-08-25T07:59:59.000Z",
});

const unhealthyBody = () => ({
  ...healthyBody(601, "unhealthy"),
  persistence_health: "degraded",
  source_health: { ovation: "invalid", kp: "invalid", cloud: "degraded" },
  source: "lkg",
  unknowns: 50,
});

const challengeHtml = `<!DOCTYPE html>
<html>
  <head><title>Just a moment...</title></head>
  <body>
    <div id="cf-wrapper">Attention Required</div>
    <script src="/cdn-cgi/challenge-platform/h/b/orchestrate/chl_page/v1"></script>
    <div class="cf-chl-widget">error code: 1020</div>
  </body>
</html>`;

const workersDevDisabledHtml = `<!DOCTYPE html>
<html>
  <head><title>Error 1042</title></head>
  <body>error code: 1042</body>
</html>`;

const diagnosticsFor = async (status, body, headers = {}, healthUrl = HEALTH_URL) => {
  const { snippetFromBody, classifyMonitorFailure, headerValue } = await loadMonitor();
  const res = response(status, body, headers);
  const bodyText = typeof body === "string" ? body : JSON.stringify(body);
  return {
    kind: classifyMonitorFailure({
      httpStatus: status,
      contentType: headerValue(res.headers, "content-type"),
      cfMitigated: headerValue(res.headers, "cf-mitigated"),
      bodyText,
      healthUrl,
    }),
    contentType: headerValue(res.headers, "content-type"),
    server: headerValue(res.headers, "server"),
    cfRay: headerValue(res.headers, "cf-ray"),
    cfMitigated: headerValue(res.headers, "cf-mitigated"),
    bodySnippet: snippetFromBody(bodyText),
  };
};

const options = (overrides = {}) => ({
  webhook: WEBHOOK,
  githubRunUrl: RUN_URL,
  now: () => NOW,
  logger: { error() {}, info() {}, log() {} },
  timeoutSignal: (milliseconds) => {
    assert.equal(milliseconds, 60_000);
    return { timeout: milliseconds };
  },
  ...overrides,
});

test("monitor defaults to the public custom-domain health URL", async () => {
  const {
    DEFAULT_HEALTH_URL,
    HEALTH_URL: exported,
    PUBLIC_HEALTH_URL: exportedPublic,
    WORKERS_DEV_HEALTH_URL: exportedWorkers,
    resolveHealthUrl,
  } = await loadMonitor();
  assert.equal(DEFAULT_HEALTH_URL, HEALTH_URL);
  assert.equal(exported, HEALTH_URL);
  assert.equal(exportedPublic, HEALTH_URL);
  assert.equal(exportedWorkers, WORKERS_DEV_HEALTH_URL);
  assert.equal(resolveHealthUrl(undefined), HEALTH_URL);
  assert.equal(resolveHealthUrl("  "), HEALTH_URL);
  assert.equal(resolveHealthUrl(WORKERS_DEV_HEALTH_URL), WORKERS_DEV_HEALTH_URL);
});

test("classifier treats challenge HTML 403 as Cloudflare blocked", async () => {
  const { checkHealthOnce, classifyMonitorFailure } = await loadMonitor();

  assert.equal(
    classifyMonitorFailure({
      httpStatus: 403,
      contentType: "text/html; charset=UTF-8",
      bodyText: challengeHtml,
    }),
    "cloudflare_blocked",
  );

  const result = await checkHealthOnce(
    async () =>
      response(403, challengeHtml, {
        server: "cloudflare",
        "cf-ray": "8f1a2b3c4d5e6f7a-SJC",
      }),
    { timeoutSignal: () => ({ timeout: 60_000 }) },
  );
  assert.equal(result.ok, false);
  assert.equal(result.kind, "cloudflare_blocked");
  assert.equal(result.reason, "HTTP 403");
  assert.equal(result.httpStatus, 403);
  assert.equal(result.server, "cloudflare");
  assert.equal(result.cfRay, "8f1a2b3c4d5e6f7a-SJC");
  assert.match(result.bodySnippet, /Just a moment/);
  assert.doesNotMatch(result.bodySnippet, /<div|<script/i);
});

test("classifier treats cf-mitigated header as Cloudflare blocked", async () => {
  const { checkHealthOnce, classifyMonitorFailure } = await loadMonitor();

  assert.equal(
    classifyMonitorFailure({
      httpStatus: 403,
      contentType: "text/html",
      cfMitigated: "challenge",
      bodyText: "<html></html>",
    }),
    "cloudflare_blocked",
  );

  const result = await checkHealthOnce(
    async () =>
      response(403, "<html>blocked</html>", {
        "content-type": "text/html",
        "cf-mitigated": "challenge",
        "cf-ray": "aabbccdd11223344-LAX",
        server: "cloudflare",
      }),
    { timeoutSignal: () => ({ timeout: 60_000 }) },
  );
  assert.equal(result.kind, "cloudflare_blocked");
  assert.equal(result.cfMitigated, "challenge");
  assert.equal(result.cfRay, "aabbccdd11223344-LAX");
});

test("classifier treats workers.dev 1042 as bypass unavailable, not site down", async () => {
  const { checkHealthOnce, classifyMonitorFailure } = await loadMonitor();

  assert.equal(
    classifyMonitorFailure({
      httpStatus: 404,
      contentType: "text/html",
      bodyText: workersDevDisabledHtml,
      healthUrl: WORKERS_DEV_HEALTH_URL,
    }),
    "cloudflare_bypass_unavailable",
  );
  assert.equal(
    classifyMonitorFailure({
      httpStatus: 404,
      contentType: "text/plain",
      bodyText: "error code: 1042",
      healthUrl: WORKERS_DEV_HEALTH_URL,
    }),
    "cloudflare_bypass_unavailable",
  );
  assert.equal(
    classifyMonitorFailure({
      httpStatus: 404,
      contentType: "text/html",
      bodyText: "",
      healthUrl: WORKERS_DEV_HEALTH_URL,
    }),
    "cloudflare_bypass_unavailable",
  );

  const result = await checkHealthOnce(
    async () => response(404, workersDevDisabledHtml, { server: "cloudflare" }),
    { timeoutSignal: () => ({ timeout: 60_000 }), healthUrl: WORKERS_DEV_HEALTH_URL },
  );
  assert.equal(result.ok, false);
  assert.equal(result.kind, "cloudflare_bypass_unavailable");
  assert.equal(result.httpStatus, 404);
  assert.match(result.bodySnippet, /error code: 1042/);
});

test("classifier treats an app 404 on the custom domain as site down", async () => {
  const { checkHealthOnce, classifyMonitorFailure } = await loadMonitor();

  assert.equal(
    classifyMonitorFailure({
      httpStatus: 404,
      contentType: "application/json",
      bodyText: JSON.stringify({ error: "not found" }),
      healthUrl: PUBLIC_HEALTH_URL,
    }),
    "site_down",
  );

  const result = await checkHealthOnce(async () => response(404, { error: "not found" }), {
    timeoutSignal: () => ({ timeout: 60_000 }),
    healthUrl: PUBLIC_HEALTH_URL,
  });
  assert.equal(result.kind, "site_down");
  assert.equal(result.reason, "HTTP 404");
});

test("classifier treats 503 JSON as site down", async () => {
  const { checkHealthOnce, classifyMonitorFailure } = await loadMonitor();

  assert.equal(
    classifyMonitorFailure({
      httpStatus: 503,
      contentType: "application/json",
      bodyText: JSON.stringify(unhealthyBody()),
    }),
    "site_down",
  );

  const result = await checkHealthOnce(async () => response(503, unhealthyBody()), {
    timeoutSignal: () => ({ timeout: 60_000 }),
  });
  assert.equal(result.kind, "site_down");
  assert.equal(result.reason, "HTTP 503");
});

test("classifier treats timeout as site down", async () => {
  const { checkHealthOnce, classifyMonitorFailure } = await loadMonitor();

  assert.equal(classifyMonitorFailure({}), "site_down");
  assert.equal(
    classifyMonitorFailure({ httpStatus: null, bodyText: "" }),
    "site_down",
  );

  const result = await checkHealthOnce(
    async () => {
      throw new Error("The operation was aborted due to timeout");
    },
    { timeoutSignal: () => ({ timeout: 60_000 }) },
  );
  assert.equal(result.ok, false);
  assert.equal(result.kind, "site_down");
  assert.equal(result.reason, "request failed");
  assert.equal(result.httpStatus, null);
});

test("health validation accepts only HTTP 200 with strict status and age boundaries", async () => {
  const { checkHealthOnce } = await loadMonitor();

  for (const [status, age] of [
    ["ok", 0],
    ["ok", 599.999],
    ["degraded", 42],
  ]) {
    assert.deepEqual(
      await checkHealthOnce(async () => response(200, healthyBody(age, status)), {
        timeoutSignal: () => ({ timeout: 60_000 }),
      }),
      { ok: true },
    );
  }

  for (const [body, reason] of [
    [healthyBody(600), "invalid checked age"],
    [healthyBody(-0.001), "invalid checked age"],
    [healthyBody(Number.NaN), "invalid checked age"],
    [healthyBody(Number.POSITIVE_INFINITY), "invalid checked age"],
    [healthyBody("1"), "invalid checked age"],
    [healthyBody(1, "unknown"), "invalid health status"],
    [null, "invalid JSON shape"],
    [[healthyBody(1)], "invalid JSON shape"],
  ]) {
    const result = await checkHealthOnce(async () => response(200, body), {
      timeoutSignal: () => ({ timeout: 60_000 }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.reason, reason);
    assert.equal(result.httpStatus, 200);
    assert.equal(result.kind, "site_down");
    assert.ok(result.failureItems.length > 0);
  }

  const expected = await diagnosticsFor(503, unhealthyBody());
  assert.deepEqual(
    await checkHealthOnce(async () => response(503, unhealthyBody()), {
      timeoutSignal: () => ({ timeout: 60_000 }),
    }),
    {
      ok: false,
      reason: "HTTP 503",
      httpStatus: 503,
      failureItems: [
        "locations: 50/50 UNKNOWN (names unavailable from /api/health)",
        "data sources: ovation=invalid, kp=invalid, cloud=degraded",
        "persistence: degraded",
      ],
      ...expected,
    },
  );
  assert.deepEqual(
    await checkHealthOnce(async () => response(200, new Error("RAW_BODY_MUST_NOT_LEAK")), {
      timeoutSignal: () => ({ timeout: 60_000 }),
    }),
    {
      ok: false,
      reason: "invalid JSON",
      httpStatus: 200,
      failureItems: ["health response: invalid JSON"],
      kind: "site_down",
      contentType: "application/json",
      server: null,
      cfRay: null,
      cfMitigated: null,
      bodySnippet: "",
    },
  );
});

test("a successful first attempt sends no Feishu request", async () => {
  const { runHealthMonitor } = await loadMonitor();
  const calls = [];

  const result = await runHealthMonitor(
    options({
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return response(200, healthyBody(599.999, "degraded"));
      },
    }),
  );

  assert.deepEqual(result, { ok: true, attempts: 1 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, HEALTH_URL);
  assert.equal(calls[0].init.signal.timeout, 60_000);
});

test("a later successful retry exits cleanly without alerting", async () => {
  const { runHealthMonitor } = await loadMonitor();
  const urls = [];

  const result = await runHealthMonitor(
    options({
      fetchImpl: async (url) => {
        urls.push(url);
        return urls.length === 1
          ? response(503, { raw: "do not log" })
          : response(200, healthyBody(1));
      },
    }),
  );

  assert.deepEqual(result, { ok: true, attempts: 2 });
  assert.deepEqual(urls, [HEALTH_URL, HEALTH_URL]);
});

test("three failed attempts send exactly one sanitized alert and still reject", async () => {
  const { runHealthMonitor } = await loadMonitor();
  const calls = [];
  const logs = [];

  await assert.rejects(
    runHealthMonitor(
      options({
        logger: { error: (line) => logs.push(line), info() {} },
        fetchImpl: async (url, init) => {
          calls.push({ url, init });
          if (url === HEALTH_URL) throw new Error("RAW_ERROR_AND_SECRET_MUST_NOT_LEAK");
          return response(200, { code: 0 });
        },
      }),
    ),
    /health monitor reported failure/i,
  );

  assert.equal(calls.length, 4);
  assert.deepEqual(
    calls.slice(0, 3).map(({ url }) => url),
    [HEALTH_URL, HEALTH_URL, HEALTH_URL],
  );
  assert.equal(calls[3].url, WEBHOOK);
  assert.equal(calls[3].init.method, "POST");
  assert.equal(calls[3].init.headers["content-type"], "application/json");

  const payload = JSON.parse(calls[3].init.body);
  assert.equal(payload.msg_type, "text");
  assert.match(payload.content.text, /Northern Lights Tonight/);
  assert.match(payload.content.text, /request failed/);
  assert.match(payload.content.text, new RegExp(`Check time \\(ISO\\): ${NOW.toISOString()}`));
  assert.match(payload.content.text, new RegExp(HEALTH_URL.replaceAll("/", "\\/")));
  assert.match(payload.content.text, new RegExp(RUN_URL.replaceAll("/", "\\/")));
  assert.match(payload.content.text, /HTTP status: unavailable/);
  assert.match(payload.content.text, /Failure items: request transport failed/);
  assert.match(payload.content.text, /Consecutive failures \(this run\): 3/);
  assert.match(payload.content.text, /Failure signature: [a-f0-9]{16}/);
  assert.doesNotMatch(payload.content.text, /监控被 Cloudflare/);
  assert.doesNotMatch(payload.content.text, /not treating as site down/);

  const emitted = JSON.stringify({ logs, payload });
  assert.doesNotMatch(emitted, /RAW_ERROR_AND_SECRET_MUST_NOT_LEAK/);
  assert.doesNotMatch(emitted, /TEST_SECRET_SENTINEL/);
  assert.ok(payload.content.text.length < 1_000);
});

test("HTTP failures include status and structured location and data-source details", async () => {
  const { runHealthMonitor } = await loadMonitor();
  let alertText;

  await assert.rejects(
    runHealthMonitor(
      options({
        fetchImpl: async (url, init) => {
          if (url === HEALTH_URL) return response(503, unhealthyBody());
          alertText = JSON.parse(init.body).content.text;
          return response(200, { code: 0 });
        },
      }),
    ),
    /health monitor reported failure/i,
  );

  assert.match(alertText, /Northern Lights Tonight health monitor failure/);
  assert.match(alertText, /HTTP status: 503/);
  assert.match(
    alertText,
    /locations: 50\/50 UNKNOWN \(names unavailable from \/api\/health\)/,
  );
  assert.match(
    alertText,
    /data sources: ovation=invalid, kp=invalid, cloud=degraded/,
  );
  assert.match(alertText, /persistence: degraded/);
  assert.doesNotMatch(alertText, /监控被 Cloudflare/);
});

test("Cloudflare challenge on the public URL logs and exits successfully without Feishu", async () => {
  const { runHealthMonitor } = await loadMonitor();
  const calls = [];
  const infos = [];

  const result = await runHealthMonitor(
    options({
      logger: { error() {}, info: (line) => infos.push(line) },
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        if (url === WEBHOOK) {
          throw new Error("Feishu must not be called for a Cloudflare challenge");
        }
        return response(403, challengeHtml, {
          "cf-mitigated": "challenge",
          "cf-ray": "deadbeef12345678-IAD",
          server: "cloudflare",
        });
      },
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.skippedAlert, true);
  assert.equal(result.kind, "cloudflare_blocked");
  assert.equal(result.cfMitigated, "challenge");
  assert.equal(result.cfRay, "deadbeef12345678-IAD");
  assert.equal(calls.length, 3);
  assert.deepEqual(
    calls.map(({ url }) => url),
    [HEALTH_URL, HEALTH_URL, HEALTH_URL],
  );
  assert.equal(infos.length, 1);
  assert.match(infos[0], /Cloudflare challenge \(not treating as site down\)/);
  assert.match(infos[0], /cf-ray: deadbeef12345678-IAD/);
  assert.match(infos[0], /cf-mitigated: challenge/);
  assert.match(infos[0], /Just a moment/);
  assert.doesNotMatch(infos[0], /Northern Lights Tonight health monitor failure/);
});

test("workers.dev 1042 plus public Cloudflare challenge does not page as site down", async () => {
  const { runHealthMonitor } = await loadMonitor();
  const calls = [];
  const infos = [];

  const result = await runHealthMonitor(
    options({
      healthUrl: WORKERS_DEV_HEALTH_URL,
      logger: { error() {}, info: (line) => infos.push(line) },
      fetchImpl: async (url) => {
        calls.push(url);
        if (url === WORKERS_DEV_HEALTH_URL) {
          return response(404, workersDevDisabledHtml, { server: "cloudflare" });
        }
        if (url === PUBLIC_HEALTH_URL) {
          return response(403, challengeHtml, {
            "cf-mitigated": "challenge",
            "cf-ray": "a51662ea5a6b44fb-ATL",
          });
        }
        throw new Error("Feishu must not be called for bypass-unavailable plus challenge");
      },
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.skippedAlert, true);
  assert.equal(result.kind, "cloudflare_bypass_unavailable");
  assert.match(result.publicProbeNote, /Note: public edge blocked/);
  assert.match(result.publicProbeNote, /a51662ea5a6b44fb-ATL/);
  assert.deepEqual(calls, [
    WORKERS_DEV_HEALTH_URL,
    WORKERS_DEV_HEALTH_URL,
    WORKERS_DEV_HEALTH_URL,
    PUBLIC_HEALTH_URL,
  ]);
  assert.match(infos[0], /bypass unavailable \(not treating as site down\)/);
  assert.match(infos[0], /error code: 1042/);
});

test("workers.dev 1042 succeeds when the public edge returns healthy JSON", async () => {
  const { runHealthMonitor } = await loadMonitor();
  const calls = [];

  const result = await runHealthMonitor(
    options({
      healthUrl: WORKERS_DEV_HEALTH_URL,
      fetchImpl: async (url) => {
        calls.push(url);
        if (url === WORKERS_DEV_HEALTH_URL) {
          return response(404, "error code: 1042");
        }
        if (url === PUBLIC_HEALTH_URL) return response(200, healthyBody(1));
        throw new Error("Feishu must not be called when the public edge is healthy");
      },
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.skippedAlert, true);
  assert.equal(result.publicConfirmed, true);
  assert.equal(result.kind, "cloudflare_bypass_unavailable");
  assert.deepEqual(calls, [
    WORKERS_DEV_HEALTH_URL,
    WORKERS_DEV_HEALTH_URL,
    WORKERS_DEV_HEALTH_URL,
    PUBLIC_HEALTH_URL,
  ]);
});

test("workers.dev 1042 still alerts when the public edge returns a real outage", async () => {
  const { runHealthMonitor } = await loadMonitor();
  let alertText;

  await assert.rejects(
    runHealthMonitor(
      options({
        healthUrl: WORKERS_DEV_HEALTH_URL,
        fetchImpl: async (url, init) => {
          if (url === WORKERS_DEV_HEALTH_URL) {
            return response(404, workersDevDisabledHtml);
          }
          if (url === PUBLIC_HEALTH_URL) return response(503, unhealthyBody());
          alertText = JSON.parse(init.body).content.text;
          return response(200, { code: 0 });
        },
      }),
    ),
    /health monitor reported failure/i,
  );

  assert.match(alertText, /Northern Lights Tonight health monitor failure/);
  assert.match(alertText, new RegExp(PUBLIC_HEALTH_URL.replaceAll("/", "\\/")));
  assert.match(alertText, /HTTP status: 503/);
  assert.match(alertText, /persistence: degraded/);
});

test("HEALTH_URL override that is healthy does not page a public-edge challenge", async () => {
  const { runHealthMonitor } = await loadMonitor();
  const calls = [];
  const infos = [];

  const result = await runHealthMonitor(
    options({
      healthUrl: WORKERS_DEV_HEALTH_URL,
      logger: { error() {}, info: (line) => infos.push(line) },
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        if (url === WORKERS_DEV_HEALTH_URL) return response(200, healthyBody(1));
        if (url === PUBLIC_HEALTH_URL) {
          return response(403, challengeHtml, {
            "cf-mitigated": "challenge",
            "cf-ray": "publicedge0001-SJC",
          });
        }
        throw new Error("Feishu must not be called for a public-edge-only block");
      },
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.attempts, 1);
  assert.match(result.publicProbeNote, /Note: public edge blocked/);
  assert.match(result.publicProbeNote, /publicedge0001-SJC/);
  assert.deepEqual(infos, [result.publicProbeNote]);
  assert.deepEqual(
    calls.map(({ url }) => url),
    [WORKERS_DEV_HEALTH_URL, PUBLIC_HEALTH_URL],
  );
});

test("HEALTH_URL env override is used for the primary probe", async () => {
  const { main } = await loadMonitor();
  const urls = [];
  const custom = "https://example.test/api/health";

  const exitCode = await main(
    { GITHUB_RUN_URL: RUN_URL, HEALTH_URL: custom },
    {
      dryRun: true,
      fetchImpl: async (url) => {
        urls.push(url);
        return response(200, healthyBody(1));
      },
      now: () => NOW,
      logger: { error() {}, info() {} },
      timeoutSignal: () => ({ timeout: 60_000 }),
    },
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(urls, [custom, PUBLIC_HEALTH_URL]);
});

test("dry-run skips webhook delivery but preserves the failing exit code", async () => {
  const { main } = await loadMonitor();
  const urls = [];

  const exitCode = await main(
    { GITHUB_RUN_URL: RUN_URL },
    {
      dryRun: true,
      fetchImpl: async (url) => {
        urls.push(url);
        throw new Error("simulated request failure");
      },
      now: () => NOW,
      logger: { error() {}, info() {} },
      timeoutSignal: () => ({ timeout: 60_000 }),
    },
  );

  assert.equal(exitCode, 1);
  assert.deepEqual(urls, [HEALTH_URL, HEALTH_URL, HEALTH_URL]);
});

test("a missing webhook fails before any health request", async () => {
  const { runHealthMonitor } = await loadMonitor();
  let fetchCount = 0;

  await assert.rejects(
    runHealthMonitor(
      options({
        webhook: "   ",
        fetchImpl: async () => {
          fetchCount += 1;
          return response(200, healthyBody());
        },
      }),
    ),
    /configuration/i,
  );
  assert.equal(fetchCount, 0);
});

test("health response content and webhook never enter errors or logs", async () => {
  const { runHealthMonitor } = await loadMonitor();
  const rawSentinel = "RAW_RESPONSE_SENTINEL";
  const logs = [];
  let thrown;

  try {
    await runHealthMonitor(
      options({
        logger: { error: (line) => logs.push(line), info() {} },
        fetchImpl: async (url) => {
          if (url === HEALTH_URL) return response(200, new Error(rawSentinel));
          return response(200, { StatusCode: 0 });
        },
      }),
    );
  } catch (error) {
    thrown = error;
  }

  const emitted = JSON.stringify({ logs, error: String(thrown) });
  assert.doesNotMatch(emitted, new RegExp(rawSentinel));
  assert.doesNotMatch(emitted, /TEST_SECRET_SENTINEL/);
});

test("Feishu HTTP, malformed JSON, and nonzero application errors fail generically", async () => {
  const { runHealthMonitor } = await loadMonitor();

  for (const feishuResponse of [
    response(500, { code: 0 }),
    response(200, new Error("FEISHU_RAW_RESPONSE_MUST_NOT_LEAK")),
    response(200, { code: 19001, msg: "WEBHOOK_OR_RESPONSE_MUST_NOT_LEAK" }),
    response(200, { StatusCode: 1, StatusMessage: "SECRET_MUST_NOT_LEAK" }),
  ]) {
    let healthAttempts = 0;
    await assert.rejects(
      runHealthMonitor(
        options({
          fetchImpl: async (url) => {
            if (url === HEALTH_URL) {
              healthAttempts += 1;
              return response(503, { private: "content" });
            }
            return feishuResponse;
          },
        }),
      ),
      (error) => {
        const serialized = String(error);
        assert.match(serialized, /alert delivery failed/i);
        assert.doesNotMatch(serialized, /TEST_SECRET_SENTINEL|FEISHU_RAW|WEBHOOK_OR_RESPONSE|SECRET_MUST_NOT_LEAK/);
        return true;
      },
    );
    assert.equal(healthAttempts, 3);
  }
});

test("HTTP 200 challenge HTML is inconclusive and does not page Feishu", async () => {
  const { runHealthMonitor } = await loadMonitor();
  const infos = [];

  const result = await runHealthMonitor(
    options({
      logger: { error() {}, info: (line) => infos.push(line) },
      fetchImpl: async (url) => {
        if (url === WEBHOOK) throw new Error("Feishu must not be called for 200 challenge HTML");
        return response(200, challengeHtml, { "content-type": "text/html; charset=UTF-8" });
      },
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.skippedAlert, true);
  assert.equal(result.kind, "cloudflare_blocked");
  assert.match(infos[0], /Cloudflare challenge \(not treating as site down\)/);
});

test("invalid JSON without a Cloudflare challenge still fails the job", async () => {
  const { main } = await loadMonitor();
  const urls = [];

  const exitCode = await main(
    { GITHUB_RUN_URL: RUN_URL },
    {
      dryRun: true,
      fetchImpl: async (url) => {
        urls.push(url);
        return response(200, "not-json", { "content-type": "text/plain" });
      },
      now: () => NOW,
      logger: { error() {}, info() {} },
      timeoutSignal: () => ({ timeout: 60_000 }),
    },
  );

  assert.equal(exitCode, 1);
  assert.deepEqual(urls, [HEALTH_URL, HEALTH_URL, HEALTH_URL]);
});
