import { readFile } from "node:fs/promises";
import path from "node:path";

import { get, put } from "@vercel/blob";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import dossierJson from "@/地点档案/wave1.json";
import { compute_bundle } from "@/lib/aurora-engine";
import {
  fetchAuroraSources,
  fingerprintPayload,
  isValidRawSourceEnvelopes,
  SOURCE_SCHEMA_VERSION,
  type JsonObject,
  type RawSourceEnvelopes,
  type SourceEnvelope,
  type SourceFetchResult,
  type SourceName,
} from "@/lib/aurora-sources";

export type SnapshotSource = "live" | "lkg" | "bundled";
export type SourceHealth = "ok" | "degraded" | "invalid";

export type SourceObservation = {
  source_time: string | null;
  fetched_at: string | null;
  age_seconds: number | null;
  health: SourceHealth;
  fallback_used: boolean;
  fingerprint: string | null;
  coverage: JsonObject | null;
};

export type AuroraBundle = JsonObject & {
  generated_at: string;
  ovation_ok: boolean;
  seo_indexable: false;
  locations: JsonObject[];
  snapshot_source: SnapshotSource;
  fallback_used: boolean;
  source_observations: Record<SourceName, SourceObservation>;
};

type RawResolution = {
  kind: "raw";
  source: "live" | "lkg";
  envelopes: RawSourceEnvelopes;
  observations: Record<SourceName, SourceObservation>;
};

type BundledResolution = {
  kind: "bundled";
  bundle: AuroraBundle;
};

export type SourceResolution = RawResolution | BundledResolution;

const BLOB_PATH = "aurora/lkg/source-envelopes-v1.json";
const dossiers = dossierJson.locations;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isoAgeSeconds = (iso: string | null, now: Date): number | null => {
  if (!iso) return null;
  const milliseconds = Date.parse(iso);
  return Number.isFinite(milliseconds)
    ? Math.max(0, Math.floor((now.getTime() - milliseconds) / 1000))
    : null;
};

const emptyObservation = (): SourceObservation => ({
  source_time: null,
  fetched_at: null,
  age_seconds: null,
  health: "invalid",
  fallback_used: false,
  fingerprint: null,
  coverage: null,
});

const observationFor = (
  envelope: SourceEnvelope<unknown> | null,
  now: Date,
  health: SourceHealth,
  fallbackUsed: boolean,
): SourceObservation => {
  if (!envelope) return { ...emptyObservation(), fallback_used: fallbackUsed };
  const ageAnchor = envelope.source_time ?? envelope.fetched_at;
  return {
    source_time: envelope.source_time,
    fetched_at: envelope.fetched_at,
    age_seconds: isoAgeSeconds(ageAnchor, now),
    health,
    fallback_used: fallbackUsed,
    fingerprint: envelope.fingerprint,
    coverage: envelope.coverage,
  };
};

async function readBlobLkg(): Promise<RawSourceEnvelopes | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const result = await get(BLOB_PATH, {
      access: "private",
      token,
      useCache: false,
    });
    if (!result || result.statusCode !== 200) return null;
    const value: unknown = JSON.parse(await new Response(result.stream).text());
    return isValidRawSourceEnvelopes(value) ? value : null;
  } catch {
    return null;
  }
}

async function writeBlobLkg(envelopes: RawSourceEnvelopes): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || !isValidRawSourceEnvelopes(envelopes)) return;
  try {
    await put(BLOB_PATH, JSON.stringify(envelopes), {
      access: "private",
      token,
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
  } catch {
    // Persistence is a degradation aid. A Blob outage must not fail the page.
  }
}

function isKpCovered(envelope: SourceEnvelope<unknown[]>, now: Date): boolean {
  const start = envelope.coverage.start;
  const end = envelope.coverage.end;
  if (typeof start !== "string" || typeof end !== "string") return false;
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  // NOAA publishes a multi-day product. Requiring the next 18 hours prevents
  // kp_at() from carrying an old 3-hour slot forward into tonight.
  return (
    Number.isFinite(startMs) &&
    Number.isFinite(endMs) &&
    startMs <= now.getTime() &&
    endMs >= now.getTime() + 18 * 60 * 60_000
  );
}

function isOvationUsable(envelope: SourceEnvelope<JsonObject>, now: Date): boolean {
  const age = isoAgeSeconds(envelope.source_time, now);
  return age !== null && age <= 90 * 60;
}

function cloudCoverageComplete(
  envelope: SourceEnvelope<Record<string, JsonObject | null>>,
  now: Date,
): boolean {
  if (envelope.coverage.complete !== true) return false;
  const points = new Map<string, { timezone: string }>();
  for (const location of dossiers) {
    for (const point of location.sample_points) {
      points.set(`${point.lat.toFixed(3)},${point.lng.toFixed(3)}`, {
        timezone: location.timezone,
      });
    }
  }
  const localHour = (date: Date, timeZone: string): string => {
    const values: Record<string, string> = {};
    for (const part of new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date)) {
      if (part.type !== "literal") values[part.type] = part.value;
    }
    return `${values.year}-${values.month}-${values.day}T${values.hour}:00`;
  };
  return [...points].every(([coordinate, point]) => {
    const payload = envelope.payload[coordinate];
    if (!payload || !isObject(payload.hourly) || !Array.isArray(payload.hourly.time)) {
      return false;
    }
    const times = payload.hourly.time as unknown[];
    const first = String(times[0] ?? "");
    const last = String(times.at(-1) ?? "");
    return (
      first <= localHour(now, point.timezone) &&
      last >= localHour(new Date(now.getTime() + 18 * 60 * 60_000), point.timezone)
    );
  });
}

function chooseEnvelope<T>(
  live: SourceFetchResult<T>,
  previous: SourceEnvelope<T> | null,
): { envelope: SourceEnvelope<T> | null; fallback: boolean; live: boolean } {
  if (live.ok) return { envelope: live.envelope, fallback: false, live: true };
  if (previous) return { envelope: previous, fallback: true, live: false };
  return { envelope: null, fallback: false, live: false };
}

function isBundledBundle(value: unknown): value is JsonObject & {
  generated_at: string;
  ovation_ok: boolean;
  seo_indexable: boolean;
  locations: JsonObject[];
} {
  return (
    isObject(value) &&
    typeof value.generated_at === "string" &&
    Number.isFinite(Date.parse(value.generated_at)) &&
    typeof value.ovation_ok === "boolean" &&
    value.seo_indexable === false &&
    Array.isArray(value.locations) &&
    value.locations.length === dossiers.length &&
    value.locations.every(
      (row) =>
        isObject(row) &&
        typeof row.location_slug === "string" &&
        ["GO", "MAYBE", "NO", "UNKNOWN"].includes(String(row.status)),
    )
  );
}

async function readBundledLatest(): Promise<unknown> {
  // Explicit only: retained as the phase-one fault-injection seam, not as the
  // default production data path.
  if (process.env.SNAPSHOT_REMOTE_BASE) {
    try {
      const response = await fetch(`${process.env.SNAPSHOT_REMOTE_BASE}/latest.json`, {
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
      if (response.ok) return await response.json();
    } catch {
      // Fall through to the deployment-bundled copy.
    }
  }
  const raw = await readFile(path.join(process.cwd(), "snapshots", "latest.json"), "utf8");
  return JSON.parse(raw);
}

const sourceTimeFromBundled = (bundle: JsonObject & { locations: JsonObject[] }) => {
  const sources = bundle.locations[0]?.sources;
  return isObject(sources) && typeof sources.ovation_obs === "string"
    ? sources.ovation_obs
    : null;
};

function sanitizeBundledBundle(
  raw: JsonObject & {
    generated_at: string;
    ovation_ok: boolean;
    seo_indexable: boolean;
    locations: JsonObject[];
  },
  now: Date,
): AuroraBundle {
  const sourceTime = sourceTimeFromBundled(raw);
  const ovationHardInvalid =
    sourceTime === null || (isoAgeSeconds(sourceTime, now) ?? Number.POSITIVE_INFINITY) > 90 * 60;
  const observations: Record<SourceName, SourceObservation> = {
    ovation: {
      source_time: sourceTime,
      fetched_at: ovationHardInvalid ? null : raw.generated_at,
      age_seconds: isoAgeSeconds(sourceTime, now),
      health: ovationHardInvalid ? "invalid" : "degraded",
      fallback_used: true,
      fingerprint: fingerprintPayload({ source_time: sourceTime }),
      coverage: null,
    },
    kp: {
      source_time: null,
      fetched_at: null,
      age_seconds: null,
      // A derived bundled snapshot has no raw time_tag coverage proof.
      health: "invalid",
      fallback_used: true,
      fingerprint: fingerprintPayload(raw.locations.map((row) => row.windows ?? null)),
      coverage: null,
    },
    cloud: {
      source_time: null,
      fetched_at: null,
      age_seconds: null,
      // A derived bundled snapshot has no hourly coverage contract to validate.
      health: "invalid",
      fallback_used: true,
      fingerprint: fingerprintPayload(raw.locations.map((row) => row.points ?? null)),
      coverage: null,
    },
  };
  const locations = raw.locations.map((row) => {
    const bestEnd = typeof row.best_window_end === "string" ? Date.parse(row.best_window_end) : null;
    const expiredGo = row.status === "GO" && (bestEnd === null || bestEnd <= now.getTime());
    const auroraUnavailable = ovationHardInvalid && observations.kp.health === "invalid";
    if (!expiredGo && !auroraUnavailable) {
      return { ...row, updated_at: sourceTime ?? raw.generated_at };
    }
    const explicitNo = row.status === "NO" && row.main_obstacle === "AURORA_NO_REACH";
    return explicitNo
      ? { ...row, updated_at: sourceTime ?? raw.generated_at }
      : {
          ...row,
          status: "UNKNOWN",
          confidence: "low",
          best_window_start: null,
          best_window_end: null,
          updated_at: sourceTime ?? raw.generated_at,
        };
  });
  return {
    ...raw,
    seo_indexable: false,
    locations,
    snapshot_source: "bundled",
    fallback_used: true,
    source_observations: observations,
  };
}

async function bundledResolution(now: Date): Promise<BundledResolution> {
  const raw = await readBundledLatest();
  if (!isBundledBundle(raw)) throw new Error("Invalid bundled snapshots/latest.json");
  return { kind: "bundled", bundle: sanitizeBundledBundle(raw, now) };
}

async function refreshSourceEnvelopes(): Promise<SourceResolution> {
  const now = new Date();
  const previous = await readBlobLkg();
  const fetched = await fetchAuroraSources(dossiers, previous);
  const ovation = chooseEnvelope(fetched.ovation, previous?.ovation ?? null);
  const kp = chooseEnvelope(fetched.kp, previous?.kp ?? null);
  const cloud = chooseEnvelope(fetched.cloud, previous?.cloud ?? null);

  const ovationUsable = ovation.envelope ? isOvationUsable(ovation.envelope, now) : false;
  const kpCovered = kp.envelope ? isKpCovered(kp.envelope, now) : false;
  const cloudComplete = cloud.envelope ? cloudCoverageComplete(cloud.envelope, now) : false;

  if (!ovationUsable && !kpCovered) return bundledResolution(now);

  const envelopes: RawSourceEnvelopes = {
    schema_version: SOURCE_SCHEMA_VERSION,
    ovation: ovation.envelope,
    kp: kp.envelope,
    cloud: cloud.envelope,
  };
  if (ovation.live || kp.live || cloud.live) await writeBlobLkg(envelopes);

  const observations: Record<SourceName, SourceObservation> = {
    ovation: observationFor(
      ovation.envelope,
      now,
      ovationUsable ? (ovation.fallback ? "degraded" : "ok") : "invalid",
      ovation.fallback,
    ),
    kp: observationFor(
      kp.envelope,
      now,
      kpCovered ? (kp.fallback ? "degraded" : "ok") : "invalid",
      kp.fallback,
    ),
    cloud: observationFor(
      cloud.envelope,
      now,
      cloud.envelope
        ? cloudComplete && !cloud.fallback
          ? "ok"
          : "degraded"
        : "invalid",
      cloud.fallback,
    ),
  };
  const usedFallback = Object.values(observations).some((item) => item.fallback_used);
  // A mixed live/LKG set is reported as lkg at bundle level: the most
  // conservative of the three closed-set source labels wins.
  return {
    kind: "raw",
    source: usedFallback ? "lkg" : "live",
    envelopes,
    observations,
  };
}

const cachedSourceEnvelopes = unstable_cache(
  refreshSourceEnvelopes,
  ["aurora-source-envelopes-v1"],
  { revalidate: 600 },
);

let inflight: Promise<SourceResolution> | null = null;

export async function getSourceEnvelopes(): Promise<SourceResolution> {
  if (inflight) return inflight;
  inflight = cachedSourceEnvelopes();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

const downgradedConfidence = (confidence: unknown): unknown =>
  confidence === "high" ? "medium" : confidence;

function observationsAt(
  resolution: RawResolution,
  now: Date,
): Record<SourceName, SourceObservation> {
  const { envelopes } = resolution;
  const ovationFallback = resolution.observations.ovation.fallback_used;
  const kpFallback = resolution.observations.kp.fallback_used;
  const cloudFallback = resolution.observations.cloud.fallback_used;
  const ovationUsable = envelopes.ovation
    ? isOvationUsable(envelopes.ovation, now)
    : false;
  const kpCovered = envelopes.kp ? isKpCovered(envelopes.kp, now) : false;
  const cloudComplete = envelopes.cloud
    ? cloudCoverageComplete(envelopes.cloud, now)
    : false;
  return {
    ovation: observationFor(
      envelopes.ovation,
      now,
      ovationUsable ? (ovationFallback ? "degraded" : "ok") : "invalid",
      ovationFallback,
    ),
    kp: observationFor(
      envelopes.kp,
      now,
      kpCovered ? (kpFallback ? "degraded" : "ok") : "invalid",
      kpFallback,
    ),
    cloud: observationFor(
      envelopes.cloud,
      now,
      envelopes.cloud
        ? cloudComplete && !cloudFallback
          ? "ok"
          : "degraded"
        : "invalid",
      cloudFallback,
    ),
  };
}

function updatedAtForLocation(
  snapshot: JsonObject,
  observations: Record<SourceName, SourceObservation>,
  generatedAt: string,
): string {
  if (Object.values(observations).every((item) => item.health === "ok")) return generatedAt;
  const windows = Array.isArray(snapshot.windows) ? snapshot.windows : [];
  const used = new Set<SourceName>();
  for (const window of windows) {
    if (isObject(window) && (window.source === "ovation" || window.source === "kp")) {
      used.add(window.source);
    }
  }
  used.add("cloud");
  const times = [...used]
    .map((source) => observations[source].source_time ?? observations[source].fetched_at)
    .filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value as string)))
    .sort((a, b) => Date.parse(a) - Date.parse(b));
  return times[0] ?? generatedAt;
}

export const getAuroraBundle = cache(async (): Promise<AuroraBundle> => {
  let resolution = await getSourceEnvelopes();
  if (resolution.kind === "bundled") return resolution.bundle;

  const now = new Date();
  const observations = observationsAt(resolution, now);
  if (observations.ovation.health === "invalid" && observations.kp.health === "invalid") {
    resolution = await bundledResolution(now);
    return resolution.bundle;
  }
  const { envelopes } = resolution;
  const computed = compute_bundle(
    now,
    observations.ovation.health === "invalid" ? null : envelopes.ovation?.payload ?? null,
    observations.kp.health === "invalid" ? null : envelopes.kp?.payload ?? null,
    observations.cloud.health === "invalid" ? {} : envelopes.cloud?.payload ?? {},
    dossierJson,
  ) as JsonObject;
  if (!Array.isArray(computed.locations) || typeof computed.generated_at !== "string") {
    throw new Error("Aurora engine returned an invalid bundle");
  }
  const degraded = Object.values(observations).some((item) => item.health !== "ok");
  const locations = computed.locations.map((value) => {
    if (!isObject(value)) return value;
    const updatedAt = updatedAtForLocation(value, observations, computed.generated_at as string);
    if (!degraded) return { ...value, updated_at: updatedAt };
    return {
      ...value,
      confidence: downgradedConfidence(value.confidence),
      updated_at: updatedAt,
    };
  });
  return {
    ...computed,
    generated_at: computed.generated_at,
    ovation_ok: computed.ovation_ok === true,
    seo_indexable: false,
    locations: locations as JsonObject[],
    snapshot_source: resolution.source,
    fallback_used: Object.values(observations).some((item) => item.fallback_used),
    source_observations: observations,
  };
});
