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

export async function loadLatest(): Promise<SnapshotBundle> {
  const file = path.join(process.cwd(), "snapshots", "latest.json");
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw) as SnapshotBundle;
}

export async function loadForecastSnapshot(
  slug: string,
): Promise<ForecastSnapshot | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;

  const file = path.join(process.cwd(), "snapshots", `${slug}.json`);
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as ForecastSnapshot;
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
