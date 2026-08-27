import { createHash } from "node:crypto";
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

const failureResult = ({ reason, httpStatus = null, failureItems }) => ({
  ok: false,
  reason,
  httpStatus,
  failureItems,
});

const extractFailureItems = (body, fallback) => {
  if (!isObject(body)) return [fallback];

  const items = [];
  if (
    Number.isInteger(body.unknowns) &&
    Number.isInteger(body.total) &&
    body.unknowns > 0 &&
    body.total >= body.unknowns
  ) {
    items.push(
      `locations: ${body.unknowns}/${body.total} UNKNOWN (names unavailable from /api/health)`,
    );
  }

  if (isObject(body.source_health)) {
    const failedSources = ["ovation", "kp", "cloud"]
      .filter(
        (source) =>
          body.source_health[source] === "degraded" ||
          body.source_health[source] === "invalid",
      )
      .map((source) => `${source}=${body.source_health[source]}`);
    if (failedSources.length > 0) {
      items.push(`data sources: ${failedSources.join(", ")}`);
    }
  }

  if (
    body.persistence_health === "degraded" ||
    body.persistence_health === "unavailable"
  ) {
    items.push(`persistence: ${body.persistence_health}`);
  }

  return items.length > 0 ? items : [fallback];
};

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
    return failureResult({
      reason: "request failed",
      failureItems: ["request transport failed"],
    });
  }

  if (response.status !== 200) {
    const reason = sanitizeHttpReason(response.status);
    let body;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return failureResult({
      reason,
      httpStatus: Number.isInteger(response.status) ? response.status : null,
      failureItems: extractFailureItems(
        body,
        `health endpoint returned ${reason} without structured diagnostics`,
      ),
    });
  }

  let body;
  try {
    body = await response.json();
  } catch {
    return failureResult({
      reason: "invalid JSON",
      httpStatus: 200,
      failureItems: ["health response: invalid JSON"],
    });
  }

  if (!isObject(body)) {
    return failureResult({
      reason: "invalid JSON shape",
      httpStatus: 200,
      failureItems: ["health response: invalid JSON shape"],
    });
  }
  if (body.status !== "ok" && body.status !== "degraded") {
    return failureResult({
      reason: "invalid health status",
      httpStatus: 200,
      failureItems: extractFailureItems(body, "health response: invalid status"),
    });
  }
  if (
    typeof body.checked_age_seconds !== "number" ||
    !Number.isFinite(body.checked_age_seconds) ||
    body.checked_age_seconds < 0 ||
    body.checked_age_seconds >= 600
  ) {
    return failureResult({
      reason: "invalid checked age",
      httpStatus: 200,
      failureItems: extractFailureItems(body, "health response: invalid checked age"),
    });
  }

  return { ok: true };
}

const buildFailureSignature = ({ reason, httpStatus, failureItems }) =>
  createHash("sha256")
    .update(JSON.stringify([reason, httpStatus, failureItems]))
    .digest("hex")
    .slice(0, 16);

const buildAlertText = ({ failure, checkedAt, githubRunUrl, consecutiveFailures }) => {
  const failureSignature = buildFailureSignature(failure);
  return [
    "Northern Lights Tonight health monitor failure",
    `Reason: ${failure.reason}`,
    `Check time (ISO): ${checkedAt}`,
    `Triggered URL: ${HEALTH_URL}`,
    `HTTP status: ${failure.httpStatus ?? "unavailable"}`,
    `Failure items: ${failure.failureItems.join("; ")}`,
    `Consecutive failures (this run): ${consecutiveFailures}`,
    `Failure signature: ${failureSignature}`,
    `GitHub run URL: ${githubRunUrl}`,
  ].join("\n");
};

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
  dryRun = false,
}) {
  const normalizedWebhook = String(webhook ?? "").trim();
  if (!dryRun && !normalizedWebhook) {
    throw new Error("Health monitor configuration error");
  }
  const normalizedRunUrl = normalizeRunUrl(githubRunUrl);

  let lastFailure = failureResult({
    reason: "request failed",
    failureItems: ["request transport failed"],
  });
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const result = await checkHealthOnce(fetchImpl, { timeoutSignal });
    if (result.ok) return { ok: true, attempts: attempt };
    lastFailure = result;
  }

  const alertText = buildAlertText({
    failure: lastFailure,
    checkedAt: now().toISOString(),
    githubRunUrl: normalizedRunUrl,
    consecutiveFailures: MAX_ATTEMPTS,
  });
  logger.error(alertText);
  if (!dryRun) {
    await sendFeishuAlert({
      fetchImpl,
      webhook: normalizedWebhook,
      text: alertText,
      timeoutSignal,
    });
  }
  throw new Error("Health monitor reported failure");
}

export async function main(env = process.env, options = {}) {
  try {
    await runHealthMonitor({
      ...options,
      webhook: env.FEISHU_MONITOR_WEBHOOK,
      githubRunUrl: env.GITHUB_RUN_URL,
    });
    return 0;
  } catch {
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.env, {
    dryRun: process.argv.slice(2).includes("--dry-run"),
  });
}
