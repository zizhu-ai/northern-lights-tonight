import { readFile } from "node:fs/promises";
import path from "node:path";

import copy from "@/content/ui-copy.json";

export type SnapshotRow = {
  location_slug: string;
  headline_point_name: string;
  status: "GO" | "MAYBE" | "NO" | "UNKNOWN";
  confidence: "high" | "medium" | "low";
  best_window_start: string | null;
  best_window_end: string | null;
  main_obstacle: string;
  main_obstacle_text?: string;
  answer_sentence: string;
  look_toward?: string;
  generated_at?: string;
  valid_until?: string;
};

export type SnapshotBundle = {
  generated_at: string;
  ovation_ok: boolean;
  seo_indexable: boolean;
  locations: SnapshotRow[];
};

export type ForecastWindow = {
  start: string;
  end: string;
  skip: boolean;
  status: SnapshotRow["status"] | null;
  aurora_reach: "none" | "horizon" | "overhead" | null;
  cloud_block: "clear" | "mixed" | "blocked" | "unknown" | null;
  source: string | null;
  codes: string[];
};

export type ForecastPoint = {
  id: string;
  name: string;
  status: SnapshotRow["status"];
  confidence: SnapshotRow["confidence"];
  aurora_reach: "none" | "horizon" | "overhead" | null;
  cloud_block: "clear" | "mixed" | "blocked" | "unknown" | null;
  urban: boolean;
  main_obstacle: string;
};

export type ForecastSnapshot = SnapshotRow & {
  headline_point_id: string;
  generated_at: string;
  valid_until: string;
  main_obstacle_text: string;
  reason_codes: string[];
  look_toward: string;
  points: ForecastPoint[];
  windows: ForecastWindow[];
  seo_indexable: false;
};

const SNAPSHOT_REMOTE_BASE =
  process.env.SNAPSHOT_REMOTE_BASE ??
  "https://raw.githubusercontent.com/zizhu-ai/northern-lights-tonight/main/snapshots";

function hasValidGeneratedAt(value: unknown): value is { generated_at: string } {
  if (!value || typeof value !== "object") return false;
  const generatedAt = (value as { generated_at?: unknown }).generated_at;
  return (
    typeof generatedAt === "string" && Number.isFinite(Date.parse(generatedAt))
  );
}

async function fetchSnapshot<T extends { generated_at: string }>(
  fileName: string,
  validate: (value: unknown) => value is T,
): Promise<T | null> {
  try {
    const response = await fetch(`${SNAPSHOT_REMOTE_BASE}/${fileName}`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;

    const value: unknown = await response.json();
    return validate(value) ? value : null;
  } catch {
    return null;
  }
}

async function readBundledSnapshot<T extends { generated_at: string }>(
  fileName: string,
  validate: (value: unknown) => value is T,
): Promise<T> {
  const file = path.join(process.cwd(), "snapshots", fileName);
  const raw = await readFile(file, "utf8");
  const value: unknown = JSON.parse(raw);
  if (!validate(value)) throw new Error(`Invalid bundled snapshot: ${fileName}`);
  return value;
}

async function loadSnapshot<T extends { generated_at: string }>(
  fileName: string,
  validate: (value: unknown) => value is T,
): Promise<{ data: T; source: "remote" | "bundled" }> {
  const [remote, bundled] = await Promise.allSettled([
    fetchSnapshot(fileName, validate),
    readBundledSnapshot(fileName, validate),
  ]);
  const remoteData = remote.status === "fulfilled" ? remote.value : null;
  const bundledData = bundled.status === "fulfilled" ? bundled.value : null;

  if (
    remoteData &&
    (!bundledData ||
      Date.parse(remoteData.generated_at) >=
        Date.parse(bundledData.generated_at))
  ) {
    return { data: remoteData, source: "remote" };
  }
  if (bundledData) return { data: bundledData, source: "bundled" };

  if (bundled.status === "rejected") throw bundled.reason;
  throw new Error(`Snapshot unavailable: ${fileName}`);
}

function isSnapshotBundle(value: unknown): value is SnapshotBundle {
  return (
    hasValidGeneratedAt(value) &&
    Array.isArray((value as { locations?: unknown }).locations)
  );
}

function isForecastSnapshot(value: unknown): value is ForecastSnapshot {
  return hasValidGeneratedAt(value);
}

export async function loadLatestWithMeta(): Promise<{
  data: SnapshotBundle;
  source: "remote" | "bundled";
}> {
  return loadSnapshot("latest.json", isSnapshotBundle);
}

export async function loadLatest(): Promise<SnapshotBundle> {
  return (await loadLatestWithMeta()).data;
}

export async function loadForecastSnapshot(
  slug: string,
): Promise<ForecastSnapshot | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;

  try {
    return (await loadSnapshot(`${slug}.json`, isForecastSnapshot)).data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export function isSnapshotFresh(
  snapshot: { valid_until?: string },
  now: Date = new Date(),
): boolean {
  if (!snapshot.valid_until) return false;
  const validUntil = Date.parse(snapshot.valid_until);
  return Number.isFinite(validUntil) && now.getTime() <= validUntil;
}

export function formatWindow(
  start: string | null,
  end: string | null,
  timeZone?: string,
): string {
  if (!start || !end) return "—";
  const a = new Date(start);
  const b = new Date(end);
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...(timeZone ? { timeZone } : {}),
  });
  const window = `${formatter.format(a)}–${formatter.format(b)}`;
  return timeZone
    ? `${window} ${formatZoneAbbreviation(b, timeZone)}`
    : window;
}

export function formatUpdatedAt(
  iso: string | undefined | null,
  timeZone: string = "America/New_York",
  now: Date = new Date(),
): string {
  if (!iso) return "Updated —";
  const generatedAt = Date.parse(iso);
  if (!Number.isFinite(generatedAt)) return "Updated —";

  const minutes = Math.max(0, Math.floor((now.getTime() - generatedAt) / 60_000));
  if (minutes < 1) return copy.verdict.updated_just_now;
  if (minutes < 60) {
    return copy.verdict.updated_minutes.replace("{n}", String(minutes));
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1
      ? copy.verdict.updated_hour
      : copy.verdict.updated_hours.replace("{n}", String(hours));
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
    timeZoneName: "shortGeneric",
  }).formatToParts(new Date(generatedAt));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `Updated ${pick("weekday")} ${pick("hour")}:${pick("minute")} ${pick("dayPeriod")} ${pick("timeZoneName")}`;
}

export function formatZoneAbbreviation(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortGeneric",
  });
  return (
    formatter
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? timeZone
  );
}
