import { createHash } from "node:crypto";

import {
  appendOpenMeteoCredential,
  redactOpenMeteoError,
  resolveOpenMeteoConfig,
} from "./open-meteo-config";
import type { OpenMeteoConfig } from "./open-meteo-config";

export const SOURCE_SCHEMA_VERSION = 1 as const;

export type JsonObject = Record<string, unknown>;
export type SourceName = "ovation" | "kp" | "cloud";

export type SourceEnvelope<T> = {
  schema_version: typeof SOURCE_SCHEMA_VERSION;
  source: SourceName;
  fetched_at: string;
  source_time: string | null;
  fingerprint: string;
  etag?: string;
  last_modified?: string;
  coverage: JsonObject;
  payload: T;
};

export type RawSourceEnvelopes = {
  schema_version: typeof SOURCE_SCHEMA_VERSION;
  ovation: SourceEnvelope<JsonObject> | null;
  kp: SourceEnvelope<unknown[]> | null;
  cloud: SourceEnvelope<Record<string, JsonObject | null>> | null;
};

export type SourceFetchResult<T> =
  | { ok: true; envelope: SourceEnvelope<T> }
  | { ok: false; error: string };

export type SourceFetchResults = {
  ovation: SourceFetchResult<JsonObject>;
  kp: SourceFetchResult<unknown[]>;
  cloud: SourceFetchResult<Record<string, JsonObject | null>>;
};

type Dossier = {
  slug: string;
  timezone: string;
  sample_points: Array<{ id: string; lat: number; lng: number }>;
};

type RequestResult = {
  body: unknown;
  etag?: string;
  lastModified?: string;
};

const USER_AGENT =
  "NorthernLightsTonight/1.0 (+https://aurora-tonight.com; aurora forecast)";
const DEFAULT_OVATION_URL =
  "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json";
const DEFAULT_KP_URL =
  "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json";
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_ATTEMPTS = 3;
const CLOUD_BATCH_SIZE = 20;
const conditionalResponses = new Map<string, RequestResult>();

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isIso = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

const stableJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

export const fingerprintPayload = (value: unknown): string =>
  createHash("sha256").update(stableJson(value)).digest("hex");

export function isValidOvationPayload(value: unknown): value is JsonObject {
  if (!isObject(value)) return false;
  const sourceTime = value["Observation Time"] ?? value.Observation_Time;
  if (!isIso(sourceTime) || !Array.isArray(value.coordinates) || value.coordinates.length === 0) {
    return false;
  }
  return value.coordinates.every(
    (row) =>
      Array.isArray(row) &&
      row.length >= 3 &&
      row.slice(0, 3).every((item) => Number.isFinite(Number(item))),
  );
}

export function isValidKpPayload(value: unknown): value is unknown[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.some(
    (row) =>
      Array.isArray(row) ||
      (isObject(row) && isIso(String(row.time_tag ?? "")) && Number.isFinite(Number(row.kp))),
  );
}

function hasCloudHourly(value: unknown): value is JsonObject {
  if (!isObject(value) || !isObject(value.hourly)) return false;
  const hourly = value.hourly;
  const times = hourly.time;
  if (!Array.isArray(times) || times.length === 0 || !times.every((time) => typeof time === "string")) {
    return false;
  }
  return ["cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high"].every(
    (key) => Array.isArray(hourly[key]) && (hourly[key] as unknown[]).length === times.length,
  );
}

export function isValidCloudPayload(
  value: unknown,
): value is Record<string, JsonObject | null> {
  if (!isObject(value)) return false;
  const entries = Object.values(value);
  return entries.length > 0 && entries.every((item) => item === null || hasCloudHourly(item));
}

export function isValidSourceEnvelope(value: unknown, source: "ovation"): value is SourceEnvelope<JsonObject>;
export function isValidSourceEnvelope(value: unknown, source: "kp"): value is SourceEnvelope<unknown[]>;
export function isValidSourceEnvelope(
  value: unknown,
  source: "cloud",
): value is SourceEnvelope<Record<string, JsonObject | null>>;
export function isValidSourceEnvelope(
  value: unknown,
  source: SourceName,
): value is SourceEnvelope<JsonObject | unknown[] | Record<string, JsonObject | null>> {
  if (!isObject(value)) return false;
  if (
    value.schema_version !== SOURCE_SCHEMA_VERSION ||
    value.source !== source ||
    !isIso(value.fetched_at) ||
    (value.source_time !== null && !isIso(value.source_time)) ||
    typeof value.fingerprint !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.fingerprint) ||
    !isObject(value.coverage)
  ) {
    return false;
  }
  const validPayload =
    source === "ovation"
      ? isValidOvationPayload(value.payload)
      : source === "kp"
        ? isValidKpPayload(value.payload)
        : isValidCloudPayload(value.payload);
  return validPayload && fingerprintPayload(value.payload) === value.fingerprint;
}

export function isValidRawSourceEnvelopes(value: unknown): value is RawSourceEnvelopes {
  return (
    isObject(value) &&
    value.schema_version === SOURCE_SCHEMA_VERSION &&
    (value.ovation === null || isValidSourceEnvelope(value.ovation, "ovation")) &&
    (value.kp === null || isValidSourceEnvelope(value.kp, "kp")) &&
    (value.cloud === null || isValidSourceEnvelope(value.cloud, "cloud"))
  );
}

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchJson(
  url: string,
  previous?: SourceEnvelope<unknown>,
): Promise<RequestResult> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const conditional = previous
        ? {
            body: previous.payload,
            etag: previous.etag,
            lastModified: previous.last_modified,
          }
        : conditionalResponses.get(url);
      const headers: Record<string, string> = {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      };
      if (conditional?.etag) headers["If-None-Match"] = conditional.etag;
      if (conditional?.lastModified) headers["If-Modified-Since"] = conditional.lastModified;
      const response = await fetch(url, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.status === 304 && conditional) {
        return conditional;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = {
        body: await response.json(),
        etag: response.headers.get("etag") ?? undefined,
        lastModified: response.headers.get("last-modified") ?? undefined,
      };
      conditionalResponses.set(url, result);
      return result;
    } catch (error) {
      lastError = error;
      if (attempt + 1 < MAX_ATTEMPTS) {
        await sleep(150 * 2 ** attempt + Math.floor(Math.random() * 250));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

const sourceUrl = (name: Exclude<SourceName, "cloud">): string => {
  if (name === "ovation") return process.env.AURORA_OVATION_URL ?? DEFAULT_OVATION_URL;
  return process.env.AURORA_KP_URL ?? DEFAULT_KP_URL;
};

const sourceTimeFromOvation = (payload: JsonObject): string =>
  String(payload["Observation Time"] ?? payload.Observation_Time);

const kpTimeTags = (payload: unknown[]): number[] =>
  payload
    .map((row) => {
      if (!isObject(row)) return Number.NaN;
      return Date.parse(String(row.time_tag ?? ""));
    })
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

async function fetchOvation(
  previous: SourceEnvelope<JsonObject> | null,
): Promise<SourceFetchResult<JsonObject>> {
  try {
    const response = await fetchJson(sourceUrl("ovation"), previous ?? undefined);
    if (!isValidOvationPayload(response.body)) throw new Error("schema validation failed");
    const payload = response.body;
    return {
      ok: true,
      envelope: {
        schema_version: SOURCE_SCHEMA_VERSION,
        source: "ovation",
        fetched_at: new Date().toISOString(),
        source_time: sourceTimeFromOvation(payload),
        fingerprint: fingerprintPayload(payload),
        ...(response.etag ? { etag: response.etag } : {}),
        ...(response.lastModified ? { last_modified: response.lastModified } : {}),
        coverage: {
          coordinate_count: Array.isArray(payload.coordinates)
            ? payload.coordinates.length
            : 0,
        },
        payload,
      },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function fetchKp(
  previous: SourceEnvelope<unknown[]> | null,
): Promise<SourceFetchResult<unknown[]>> {
  try {
    const response = await fetchJson(sourceUrl("kp"), previous ?? undefined);
    if (!isValidKpPayload(response.body)) throw new Error("schema validation failed");
    const payload = response.body;
    const tags = kpTimeTags(payload);
    return {
      ok: true,
      envelope: {
        schema_version: SOURCE_SCHEMA_VERSION,
        source: "kp",
        fetched_at: new Date().toISOString(),
        source_time: null,
        fingerprint: fingerprintPayload(payload),
        ...(response.etag ? { etag: response.etag } : {}),
        ...(response.lastModified ? { last_modified: response.lastModified } : {}),
        coverage: {
          slot_count: tags.length,
          start: tags.length ? new Date(tags[0]).toISOString() : null,
          end: tags.length ? new Date(tags[tags.length - 1] + 3 * 60 * 60_000).toISOString() : null,
        },
        payload,
      },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

type CloudPoint = {
  pointKey: string;
  coordinateKey: string;
  lat: number;
  lng: number;
  timezone: string;
};

const cloudPoints = (dossiers: Dossier[]): CloudPoint[] => {
  const unique = new Map<string, CloudPoint>();
  for (const location of dossiers) {
    for (const point of location.sample_points) {
      const coordinateKey = `${point.lat.toFixed(3)},${point.lng.toFixed(3)}`;
      if (!unique.has(coordinateKey)) {
        unique.set(coordinateKey, {
          pointKey: `${location.slug}/${point.id}`,
          coordinateKey,
          lat: point.lat,
          lng: point.lng,
          timezone: location.timezone,
        });
      }
    }
  }
  return [...unique.values()];
};

const cloudUrl = (points: CloudPoint[], config: OpenMeteoConfig): string => {
  const url = new URL(config.baseUrl);
  url.searchParams.set("latitude", points.map((point) => point.lat.toFixed(4)).join(","));
  url.searchParams.set("longitude", points.map((point) => point.lng.toFixed(4)).join(","));
  url.searchParams.set(
    "hourly",
    "cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high",
  );
  url.searchParams.set("forecast_days", "2");
  url.searchParams.set("timezone", points.map((point) => point.timezone).join(","));
  return appendOpenMeteoCredential(url, config).toString();
};

async function fetchCloud(dossiers: Dossier[]): Promise<SourceFetchResult<Record<string, JsonObject | null>>> {
  try {
    const config = resolveOpenMeteoConfig({
      VERCEL_ENV: process.env.VERCEL_ENV,
      OPEN_METEO_API_BASE: process.env.OPEN_METEO_API_BASE,
      OPEN_METEO_API_KEY: process.env.OPEN_METEO_API_KEY,
      AURORA_CLOUD_URL: process.env.AURORA_CLOUD_URL,
    });
    const points = cloudPoints(dossiers);
    const batches: CloudPoint[][] = [];
    for (let index = 0; index < points.length; index += CLOUD_BATCH_SIZE) {
      batches.push(points.slice(index, index + CLOUD_BATCH_SIZE));
    }
    // Two bounded multi-coordinate requests replace 39 serial requests.
    const settled = await Promise.allSettled(
      batches.map(async (batch) => ({ batch, response: await fetchJson(cloudUrl(batch, config)) })),
    );
    const payload: Record<string, JsonObject | null> = {};
    let successfulPoints = 0;
    for (const result of settled) {
      if (result.status === "rejected") continue;
      const { batch, response } = result.value;
      const rows = Array.isArray(response.body) ? response.body : [response.body];
      for (let index = 0; index < batch.length; index += 1) {
        const row = rows[index];
        const value = hasCloudHourly(row) ? row : null;
        payload[batch[index].coordinateKey] = value;
        if (value) successfulPoints += 1;
      }
    }
    if (successfulPoints === 0) throw new Error("all Open-Meteo batches failed validation");
    for (const point of points) payload[point.coordinateKey] ??= null;
    const covered = Object.values(payload).filter(hasCloudHourly);
    const starts = covered.map((item) => {
      const times = (item.hourly as JsonObject).time as unknown[];
      return String(times[0] ?? "");
    });
    const ends = covered.map((item) => {
      const times = (item.hourly as JsonObject).time as unknown[];
      return String(times[times.length - 1] ?? "");
    });
    return {
      ok: true,
      envelope: {
        schema_version: SOURCE_SCHEMA_VERSION,
        source: "cloud",
        fetched_at: new Date().toISOString(),
        source_time: null,
        fingerprint: fingerprintPayload(payload),
        coverage: {
          expected_points: points.length,
          covered_points: successfulPoints,
          complete: successfulPoints === points.length,
          start: starts.sort()[0] ?? null,
          end: ends.sort().at(-1) ?? null,
          batches: batches.length,
        },
        payload,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: redactOpenMeteoError(error, process.env.OPEN_METEO_API_KEY),
    };
  }
}

export async function fetchAuroraSources(
  dossiers: Dossier[],
  previous: RawSourceEnvelopes | null = null,
): Promise<SourceFetchResults> {
  const [ovation, kp, cloud] = await Promise.all([
    fetchOvation(previous?.ovation ?? null),
    fetchKp(previous?.kp ?? null),
    fetchCloud(dossiers),
  ]);
  return { ovation, kp, cloud };
}
