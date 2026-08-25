import { pathToFileURL } from "node:url";

export const HEALTH_URL = "https://aurora-tonight.com/api/health";
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 3;

const isObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sanitizeHttpReason = (status) =>
  Number.isInteger(status) && status >= 100 && status <= 599
    ? `HTTP ${status}`
    : "invalid HTTP status";

const normalizeRunUrl = (value) => {
  try {
    const url = new URL(String(value ?? "").trim());
    if (
      url.protocol !== "https:" ||
      url.username !== "" ||
      url.password !== "" ||
      url.hash !== "" ||
      url.toString().length > 500
    ) {
      throw new Error();
    }
    return url.toString();
  } catch {
    throw new Error("Health monitor configuration error");
  }
};

export async function checkHealthOnce(
  fetchImpl,
  { timeoutSignal = AbortSignal.timeout } = {},
) {
  let response;
  try {
    response = await fetchImpl(HEALTH_URL, {
      method: "GET",
      headers: { accept: "application/json" },
      redirect: "error",
      cache: "no-store",
      signal: timeoutSignal(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, reason: "request failed" };
  }

  if (response.status !== 200) {
    return { ok: false, reason: sanitizeHttpReason(response.status) };
  }

  let body;
  try {
    body = await response.json();
  } catch {
    return { ok: false, reason: "invalid JSON" };
  }

  if (!isObject(body)) return { ok: false, reason: "invalid JSON shape" };
  if (body.status !== "ok" && body.status !== "degraded") {
    return { ok: false, reason: "invalid health status" };
  }
  if (
    typeof body.checked_age_seconds !== "number" ||
    !Number.isFinite(body.checked_age_seconds) ||
    body.checked_age_seconds < 0 ||
    body.checked_age_seconds >= 600
  ) {
    return { ok: false, reason: "invalid checked age" };
  }

  return { ok: true };
}

const buildAlertText = ({ reason, utcTime, githubRunUrl }) =>
  [
    "Northern Lights Tonight health monitor failure",
    `Reason: ${reason}`,
    `UTC time: ${utcTime}`,
    `Health URL: ${HEALTH_URL}`,
    `GitHub run URL: ${githubRunUrl}`,
  ].join("\n");

const sendFeishuAlert = async ({ fetchImpl, webhook, text, timeoutSignal }) => {
  let response;
  try {
    response = await fetchImpl(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ msg_type: "text", content: { text } }),
      redirect: "error",
      signal: timeoutSignal(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Error("Health monitor alert delivery failed");
  }

  if (response.status < 200 || response.status >= 300) {
    throw new Error("Health monitor alert delivery failed");
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("Health monitor alert delivery failed");
  }

  const hasCode = isObject(body) && Object.hasOwn(body, "code");
  const hasStatusCode = isObject(body) && Object.hasOwn(body, "StatusCode");
  if (
    (!hasCode && !hasStatusCode) ||
    (hasCode && body.code !== 0) ||
    (hasStatusCode && body.StatusCode !== 0)
  ) {
    throw new Error("Health monitor alert delivery failed");
  }
};

export async function runHealthMonitor({
  fetchImpl = fetch,
  webhook,
  githubRunUrl,
  now = () => new Date(),
  logger = console,
  timeoutSignal = AbortSignal.timeout,
}) {
  const normalizedWebhook = String(webhook ?? "").trim();
  if (!normalizedWebhook) throw new Error("Health monitor configuration error");
  const normalizedRunUrl = normalizeRunUrl(githubRunUrl);

  let lastFailure = { ok: false, reason: "request failed" };
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const result = await checkHealthOnce(fetchImpl, { timeoutSignal });
    if (result.ok) return { ok: true, attempts: attempt };
    lastFailure = result;
  }

  const alertText = buildAlertText({
    reason: lastFailure.reason,
    utcTime: now().toISOString(),
    githubRunUrl: normalizedRunUrl,
  });
  logger.error(alertText);
  await sendFeishuAlert({
    fetchImpl,
    webhook: normalizedWebhook,
    text: alertText,
    timeoutSignal,
  });
  throw new Error("Health monitor reported failure");
}

export async function main(env = process.env) {
  try {
    await runHealthMonitor({
      webhook: env.FEISHU_MONITOR_WEBHOOK,
      githubRunUrl: env.GITHUB_RUN_URL,
    });
    return 0;
  } catch {
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
