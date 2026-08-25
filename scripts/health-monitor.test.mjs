import assert from "node:assert/strict";
import test from "node:test";

const HEALTH_URL = "https://aurora-tonight.com/api/health";
const WEBHOOK = "https://open.feishu.cn/open-apis/bot/v2/hook/TEST_SECRET_SENTINEL";
const RUN_URL = "https://github.com/example/aurora/actions/runs/123456";
const NOW = new Date("2026-08-25T08:00:00.000Z");

const loadMonitor = () => import("./health-monitor.mjs");

const response = (status, body) => ({
  status,
  async json() {
    if (body instanceof Error) throw body;
    return body;
  },
});

const healthyBody = (checkedAgeSeconds = 0, status = "ok") => ({
  status,
  checked_age_seconds: checkedAgeSeconds,
});

const options = (overrides = {}) => ({
  webhook: WEBHOOK,
  githubRunUrl: RUN_URL,
  now: () => NOW,
  logger: { error() {} },
  timeoutSignal: (milliseconds) => {
    assert.equal(milliseconds, 60_000);
    return { timeout: milliseconds };
  },
  ...overrides,
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
    assert.deepEqual(
      await checkHealthOnce(async () => response(200, body), {
        timeoutSignal: () => ({ timeout: 60_000 }),
      }),
      { ok: false, reason },
    );
  }

  assert.deepEqual(
    await checkHealthOnce(async () => response(503, healthyBody()), {
      timeoutSignal: () => ({ timeout: 60_000 }),
    }),
    { ok: false, reason: "HTTP 503" },
  );
  assert.deepEqual(
    await checkHealthOnce(async () => response(200, new Error("RAW_BODY_MUST_NOT_LEAK")), {
      timeoutSignal: () => ({ timeout: 60_000 }),
    }),
    { ok: false, reason: "invalid JSON" },
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
        logger: { error: (line) => logs.push(line) },
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
  assert.deepEqual(calls.slice(0, 3).map(({ url }) => url), [HEALTH_URL, HEALTH_URL, HEALTH_URL]);
  assert.equal(calls[3].url, WEBHOOK);
  assert.equal(calls[3].init.method, "POST");
  assert.equal(calls[3].init.headers["content-type"], "application/json");

  const payload = JSON.parse(calls[3].init.body);
  assert.equal(payload.msg_type, "text");
  assert.match(payload.content.text, /Northern Lights Tonight/);
  assert.match(payload.content.text, /request failed/);
  assert.match(payload.content.text, new RegExp(NOW.toISOString()));
  assert.match(payload.content.text, new RegExp(HEALTH_URL.replaceAll("/", "\\/")));
  assert.match(payload.content.text, new RegExp(RUN_URL.replaceAll("/", "\\/")));

  const emitted = JSON.stringify({ logs, payload });
  assert.doesNotMatch(emitted, /RAW_ERROR_AND_SECRET_MUST_NOT_LEAK/);
  assert.doesNotMatch(emitted, /TEST_SECRET_SENTINEL/);
  assert.ok(payload.content.text.length < 1_000);
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
        logger: { error: (line) => logs.push(line) },
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
