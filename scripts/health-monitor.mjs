import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

export const DEFAULT_HEALTH_URL =
  "https://aurora-tonight.mengyu699.workers.dev/api/health";
export const PUBLIC_HEALTH_URL = "https://aurora-tonight.com/api/health";
export const HEALTH_URL = DEFAULT_HEALTH_URL;
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 3;
const BODY_SNIPPET_MAX = 300;
const CLOUDFLARE_CHALLENGE_RE =
  /Just a moment|Attention Required|cf-chl|error code:\s*10\d{2}/i;

const isObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function resolveHealthUrl(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed || DEFAULT_HEALTH_URL;
}

export function headerValue(headers, name) {
  if (!headers) return null;
  const key = String(name).toLowerCase();
  if (typeof headers.get === "function") {
    const value = headers.get(name) ?? headers.get(key);
    if (value == null) return null;
    const text = String(value).trim();
    return text === "" ? null : text;
  }
  if (typeof headers === "object") {
    for (const [headerName, value] of Object.entries(headers)) {
      if (headerName.toLowerCase() === key) {
        if (value == null) return null;
        const text = String(value).trim();
        return text === "" ? null : text;
      }
    }
  }
  return null;
}

export function snippetFromBody(bodyText, maxLength = BODY_SNIPPET_MAX) {
  const stripped = String(bodyText ?? "").replace(/<[^>]*>/g, " ");
  const collapsed = stripped.replace(/\s+/g, " ").trim();
  return collapsed.slice(0, maxLength);
}

export function classifyMonitorFailure({
  httpStatus = null,
  contentType = null,
  cfMitigated = null,
  bodyText = "",
} = {}) {
  if (String(cfMitigated ?? "").trim() !== "") {
    return "cloudflare_blocked";
  }
  const html = /text\/html/i.test(String(contentType ?? ""));
  const challengeStatus = httpStatus === 403 || httpStatus === 503;
  if (challengeStatus && html && CLOUDFLARE_CHALLENGE_RE.test(String(bodyText ?? ""))) {
    return "cloudflare_blocked";
  }
  return "site_down";
}

const sanitizeHttpReason = (status) =>
  Number.isInteger(status) && status >= 100 && status <= 599
    ? `HTTP ${status}`
    : "invalid HTTP status";

const failureResult = ({
  reason,
  httpStatus = null,
  failureItems,
  kind = "site_down",
  contentType = null,
  server = null,
  cfRay = null,
  cfMitigated = null,
  bodySnippet = "",
}) => ({
  ok: false,
  reason,
  httpStatus,
  failureItems,
  kind,
  contentType,
  server,
  cfRay,
  cfMitigated,
  bodySnippet,
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

const readResponseText = async (response) => {
  if (typeof response?.text === "function") {
    return String(await response.text());
  }
  throw new Error("missing text()");
};

export async function checkHealthOnce(
  fetchImpl,
  { timeoutSignal = AbortSignal.timeout, healthUrl = DEFAULT_HEALTH_URL } = {},
) {
  let response;
  try {
    response = await fetchImpl(healthUrl, {
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
      kind: "site_down",
    });
  }

  let bodyText = "";
  try {
    bodyText = await readResponseText(response);
  } catch {
    bodyText = "";
  }

  const contentType = headerValue(response.headers, "content-type");
  const server = headerValue(response.headers, "server");
  const cfRay = headerValue(response.headers, "cf-ray");
  const cfMitigated = headerValue(response.headers, "cf-mitigated");
  const bodySnippet = snippetFromBody(bodyText);
  const kind = classifyMonitorFailure({
    httpStatus: response.status,
    contentType,
    cfMitigated,
    bodyText,
  });
  const diagnostics = {
    kind,
    contentType,
    server,
    cfRay,
    cfMitigated,
    bodySnippet,
  };

  let parsed = null;
  let jsonParseFailed = false;
  if (bodyText === "") {
    jsonParseFailed = true;
  } else {
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      jsonParseFailed = true;
    }
  }

  if (response.status !== 200) {
    const reason = sanitizeHttpReason(response.status);
    return failureResult({
      reason,
      httpStatus: Number.isInteger(response.status) ? response.status : null,
      failureItems: extractFailureItems(
        parsed,
        `health endpoint returned ${reason} without structured diagnostics`,
      ),
      ...diagnostics,
    });
  }

  if (jsonParseFailed) {
    return failureResult({
      reason: "invalid JSON",
      httpStatus: 200,
      failureItems: ["health response: invalid JSON"],
      ...diagnostics,
    });
  }

  if (!isObject(parsed)) {
    return failureResult({
      reason: "invalid JSON shape",
      httpStatus: 200,
      failureItems: ["health response: invalid JSON shape"],
      ...diagnostics,
    });
  }
  if (parsed.status !== "ok" && parsed.status !== "degraded") {
    return failureResult({
      reason: "invalid health status",
      httpStatus: 200,
      failureItems: extractFailureItems(parsed, "health response: invalid status"),
      ...diagnostics,
    });
  }
  if (
    typeof parsed.checked_age_seconds !== "number" ||
    !Number.isFinite(parsed.checked_age_seconds) ||
    parsed.checked_age_seconds < 0 ||
    parsed.checked_age_seconds >= 600
  ) {
    return failureResult({
      reason: "invalid checked age",
      httpStatus: 200,
      failureItems: extractFailureItems(parsed, "health response: invalid checked age"),
      ...diagnostics,
    });
  }

  return { ok: true };
}

const buildFailureSignature = ({ reason, httpStatus, failureItems, kind }) =>
  createHash("sha256")
    .update(JSON.stringify([kind, reason, httpStatus, failureItems]))
    .digest("hex")
    .slice(0, 16);

const buildAlertText = ({
  failure,
  checkedAt,
  githubRunUrl,
  consecutiveFailures,
  healthUrl,
  publicProbeNote,
}) => {
  const failureSignature = buildFailureSignature(failure);
  const lines =
    failure.kind === "cloudflare_blocked"
      ? ["监控被 Cloudflare 拦截（网站未必宕机）"]
      : ["Northern Lights Tonight health monitor failure"];
  lines.push(
    `Reason: ${failure.reason}`,
    `Check time (ISO): ${checkedAt}`,
    `Triggered URL: ${healthUrl}`,
    `HTTP status: ${failure.httpStatus ?? "unavailable"}`,
    `Failure items: ${failure.failureItems.join("; ")}`,
  );
  if (failure.kind === "cloudflare_blocked") {
    lines.push(
      `cf-ray: ${failure.cfRay ?? "unavailable"}`,
      `cf-mitigated: ${failure.cfMitigated ?? "unavailable"}`,
      `Body snippet: ${failure.bodySnippet || "unavailable"}`,
    );
  }
  if (publicProbeNote) {
    lines.push(publicProbeNote);
  }
  lines.push(
    `Consecutive failures (this run): ${consecutiveFailures}`,
    `Failure signature: ${failureSignature}`,
    `GitHub run URL: ${githubRunUrl}`,
  );
  return lines.join("\n");
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
    body = JSON.parse(await readResponseText(response));
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

const publicEdgeNote = (result, publicHealthUrl) => {
  if (!result || result.ok || result.kind !== "cloudflare_blocked") return null;
  const cfRay = result.cfRay ?? "unavailable";
  const cfMitigated = result.cfMitigated ?? "unavailable";
  return `Note: public edge blocked (${publicHealthUrl}; cf-ray=${cfRay}; cf-mitigated=${cfMitigated})`;
};

export async function runHealthMonitor({
  fetchImpl = fetch,
  webhook,
  githubRunUrl,
  now = () => new Date(),
  logger = console,
  timeoutSignal = AbortSignal.timeout,
  dryRun = false,
  healthUrl = DEFAULT_HEALTH_URL,
  publicHealthUrl = PUBLIC_HEALTH_URL,
  probePublicUrl = true,
}) {
  const normalizedWebhook = String(webhook ?? "").trim();
  if (!dryRun && !normalizedWebhook) {
    throw new Error("Health monitor configuration error");
  }
  const normalizedRunUrl = normalizeRunUrl(githubRunUrl);
  const resolvedHealthUrl = resolveHealthUrl(healthUrl);
  const resolvedPublicUrl = String(publicHealthUrl ?? "").trim() || PUBLIC_HEALTH_URL;

  let lastFailure = failureResult({
    reason: "request failed",
    failureItems: ["request transport failed"],
  });
  let succeeded = false;
  let attempts = 0;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    attempts = attempt;
    const result = await checkHealthOnce(fetchImpl, {
      timeoutSignal,
      healthUrl: resolvedHealthUrl,
    });
    if (result.ok) {
      succeeded = true;
      break;
    }
    lastFailure = result;
  }

  const shouldProbePublic =
    probePublicUrl && resolvedPublicUrl !== resolvedHealthUrl;
  const publicProbeNote = shouldProbePublic
    ? publicEdgeNote(
        await checkHealthOnce(fetchImpl, {
          timeoutSignal,
          healthUrl: resolvedPublicUrl,
        }),
        resolvedPublicUrl,
      )
    : null;

  if (succeeded) {
    if (publicProbeNote) {
      if (typeof logger.info === "function") logger.info(publicProbeNote);
      else if (typeof logger.log === "function") logger.log(publicProbeNote);
    }
    return {
      ok: true,
      attempts,
      ...(publicProbeNote ? { publicProbeNote } : {}),
    };
  }

  const alertText = buildAlertText({
    failure: lastFailure,
    checkedAt: now().toISOString(),
    githubRunUrl: normalizedRunUrl,
    consecutiveFailures: MAX_ATTEMPTS,
    healthUrl: resolvedHealthUrl,
    publicProbeNote,
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
      healthUrl: resolveHealthUrl(env.HEALTH_URL),
      webhook: env.FEISHU_MONITOR_WEBHOOK,
      githubRunUrl: env.GITHUB_RUN_URL,
      ...options,
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
