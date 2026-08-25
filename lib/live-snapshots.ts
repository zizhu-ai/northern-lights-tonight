import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { cache } from "react";

import dossierJson from "@/地点档案/wave1.json";
import { compute_bundle } from "@/lib/aurora-engine";
import {
  fetchAuroraSources,
  fingerprintPayload,
  type JsonObject,
  type SourceEnvelope,
  type SourceName,
} from "@/lib/aurora-sources";
import { sanitizeBundledLocationRow } from "@/lib/bundled-sanitize";
import {
  createSourceResolver,
  type SnapshotFreshness,
  type SourceResolution,
} from "@/lib/hard-refresh-resolver";
import { createVercelSnapshotStore } from "@/lib/snapshot-store";
import type { SnapshotRow } from "@/lib/snapshots";

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
  locations: SnapshotRow[];
  snapshot_source: SnapshotSource;
  fallback_used: boolean;
  source_observations: Record<SourceName, SourceObservation>;
  freshness: SnapshotFreshness | null;
};

type BundledResolution = {
  kind: "bundled";
  bundle: AuroraBundle;
};

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
  const observations: Record<SourceName, SourceObservation> = {
    ovation: {
      source_time: sourceTime,
      fetched_at: null,
      age_seconds: isoAgeSeconds(sourceTime, now),
      // A derived bundle cannot prove raw aurora validity for this request.
      health: "invalid",
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
  const locations = raw.locations.map((row) =>
    sanitizeBundledLocationRow(row, {
      now,
      generatedAt: raw.generated_at,
      sourceTime,
      auroraUnavailable: true,
    }),
  );
  return {
    ...raw,
    seo_indexable: false,
    locations: locations as SnapshotRow[],
    snapshot_source: "bundled",
    fallback_used: true,
    source_observations: observations,
    freshness: null,
  };
}

async function bundledResolution(now: Date): Promise<BundledResolution> {
  const raw = await readBundledLatest();
  if (!isBundledBundle(raw)) throw new Error("Invalid bundled snapshots/latest.json");
  return { kind: "bundled", bundle: sanitizeBundledBundle(raw, now) };
}

const sourceResolver = createSourceResolver({
  now: () => new Date(),
  ownerId: () => randomUUID(),
  sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  store: createVercelSnapshotStore(),
  fetchSources: (_unused, previous) => fetchAuroraSources(dossiers, previous),
});

export const getSourceEnvelopes = sourceResolver;

const downgradedConfidence = (confidence: unknown): unknown =>
  confidence === "high" ? "medium" : confidence;

function observationsAt(
  resolution: Extract<SourceResolution, { kind: "usable" }>,
  now: Date,
): Record<SourceName, SourceObservation> {
  const { envelopes } = resolution;
  const ovationFallback = resolution.outcomes.ovation.status === "error";
  const kpFallback = resolution.outcomes.kp.status === "error";
  const cloudFallback = resolution.outcomes.cloud.status === "error";
  const ovationUsable = envelopes.ovation
    ? isOvationUsable(envelopes.ovation, now)
    : false;
  const ovationAge = envelopes.ovation
    ? isoAgeSeconds(envelopes.ovation.source_time, now)
    : null;
  const kpCovered = envelopes.kp ? isKpCovered(envelopes.kp, now) : false;
  const cloudComplete = envelopes.cloud
    ? cloudCoverageComplete(envelopes.cloud, now)
    : false;
  const cloudAge = envelopes.cloud
    ? isoAgeSeconds(envelopes.cloud.fetched_at, now)
    : null;
  return {
    ovation: observationFor(
      envelopes.ovation,
      now,
      ovationUsable
        ? ovationFallback || (ovationAge ?? Number.POSITIVE_INFINITY) > 45 * 60
          ? "degraded"
          : "ok"
        : "invalid",
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
        ? cloudComplete && !cloudFallback && (cloudAge ?? Number.POSITIVE_INFINITY) <= 30 * 60
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
  if (resolution.kind === "failed_closed") return (await bundledResolution(new Date())).bundle;

  const now = new Date();
  const observations = observationsAt(resolution, now);
  if (observations.ovation.health === "invalid" && observations.kp.health === "invalid") {
    return (await bundledResolution(now)).bundle;
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
    locations: locations as SnapshotRow[],
    snapshot_source: resolution.source,
    fallback_used: Object.values(observations).some((item) => item.fallback_used),
    source_observations: observations,
    freshness: resolution.freshness,
  };
});
