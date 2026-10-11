import copy from "../content/ui-copy.json" with { type: "json" };

// @ts-ignore TS5097
import type { ForecastDossier } from "./forecast-places.ts";
// @ts-ignore TS5097
import { reasonText } from "./reason-text.ts";
import type { ForecastSnapshot, SnapshotRow } from "./snapshots";

export type HomePlaceReading = {
  dossier: ForecastDossier;
  snapshot: (SnapshotRow & Partial<ForecastSnapshot>) | null;
};

export type HomeCityCard = {
  city: string;
  stateName: string;
  slug: string;
  status: SnapshotRow["status"];
  reason: string;
};

export const HOME_CITY_CARDS: ReadonlyArray<{
  slug: string;
  pointId: string;
  city: string;
}> = [
  { slug: "fairbanks", pointId: "fairbanks", city: "Fairbanks" },
  { slug: "chicago", pointId: "chicago", city: "Chicago" },
  { slug: "ohio", pointId: "cleveland", city: "Cleveland" },
  { slug: "wisconsin", pointId: "madison", city: "Madison" },
  { slug: "indiana", pointId: "indianapolis", city: "Indianapolis" },
];

const STATUS_RANK: Record<SnapshotRow["status"], number> = {
  GO: 0,
  MAYBE: 1,
  NO: 2,
  UNKNOWN: 3,
};

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function clampWords(text: string, min: number, max: number, pad: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length > max) return words.slice(0, max).join(" ");
  if (words.length >= min) return words.join(" ");
  const extra = pad.trim().split(/\s+/).filter(Boolean);
  while (words.length < min && extra.length) words.push(extra.shift() as string);
  return words.join(" ");
}

function statusOf(row: HomePlaceReading): SnapshotRow["status"] {
  return row.snapshot?.status ?? "UNKNOWN";
}

export function overallHomeStatus(rows: HomePlaceReading[]): SnapshotRow["status"] {
  const statuses = rows.map(statusOf);
  if (statuses.some((status) => status === "GO")) return "GO";
  if (statuses.some((status) => status === "MAYBE")) return "MAYBE";
  if (statuses.length > 0 && statuses.every((status) => status === "UNKNOWN")) return "UNKNOWN";
  if (statuses.some((status) => status === "NO")) return "NO";
  return "UNKNOWN";
}

export function pickBestWindowPlace(rows: HomePlaceReading[]): HomePlaceReading | null {
  if (rows.length === 0) return null;
  const ranked = [...rows].sort((a, b) => {
    const statusDelta = STATUS_RANK[statusOf(a)] - STATUS_RANK[statusOf(b)];
    if (statusDelta !== 0) return statusDelta;
    return b.dossier.magnetic_latitude - a.dossier.magnetic_latitude;
  });
  return ranked[0] ?? null;
}

function listNames(rows: HomePlaceReading[], limit = 3): string {
  const names = rows.map((row) => row.dossier.name);
  const shown = names.slice(0, limit);
  if (names.length > limit) shown.push(`and ${names.length - limit} more`);
  if (shown.length === 1) return shown[0];
  if (shown.length === 2) return `${shown[0]} and ${shown[1]}`;
  return `${shown.slice(0, -1).join(", ")}, ${shown.at(-1)}`;
}

export function overallHomeReason(rows: HomePlaceReading[]): string {
  const overall = overallHomeStatus(rows);
  const go = rows.filter((row) => statusOf(row) === "GO");
  const maybe = rows.filter((row) => statusOf(row) === "MAYBE");
  const no = rows.filter((row) => statusOf(row) === "NO");
  if (overall === "GO") {
    return `Visible tonight in ${listNames(go)}.`;
  }
  if (overall === "MAYBE") {
    return `Possible tonight in ${listNames(maybe)}, not a sure show.`;
  }
  if (overall === "NO") {
    const sample = no[0];
    const issue = sample?.snapshot
      ? sample.snapshot.main_obstacle_text ??
        reasonText(sample.snapshot.main_obstacle, "covered US places")
      : copy.verdict.no_human;
    return `Not visible tonight in covered US places. ${issue}`;
  }
  return copy.verdict.stale_main_issue;
}

function formatHomeWindow(
  start: string | null | undefined,
  end: string | null | undefined,
  timeZone: string,
): string {
  if (!start || !end) return copy.verdict.unknown_window;
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
  return `${formatter.format(new Date(start))}–${formatter.format(new Date(end))}`;
}

const ANSWER_PAD =
  "Mid-latitude states still need a strong storm and a dark north horizon. We do not invent a nationwide showtime.";

export function homeDirectAnswer(
  rows: HomePlaceReading[],
  best: HomePlaceReading | null,
  options: { sitePaused?: boolean } = {},
): string {
  const overall = options.sitePaused ? "UNKNOWN" : overallHomeStatus(rows);
  const go = rows.filter((row) => statusOf(row) === "GO");
  const maybe = rows.filter((row) => statusOf(row) === "MAYBE");
  const no = rows.filter((row) => statusOf(row) === "NO");
  const visibleWord =
    overall === "GO"
      ? "visible"
      : overall === "MAYBE"
        ? "possible"
        : overall === "NO"
          ? "not worth a special trip"
          : "unjudgeable";
  const window = best
    ? formatHomeWindow(
        best.snapshot?.best_window_start,
        best.snapshot?.best_window_end,
        best.dossier.timezone,
      )
    : copy.verdict.unknown_window;
  const place = best ? best.dossier.name : "a covered place";
  let summary: string;
  if (overall === "UNKNOWN") {
    summary = "Covered US rows cannot be judged from the current snapshot.";
  } else {
    const parts: string[] = [];
    if (go.length) parts.push(`GO in ${listNames(go)}`);
    if (maybe.length) parts.push(`MAYBE in ${listNames(maybe)}`);
    if (no.length) parts.push(`NO in ${listNames(no)}`);
    summary = `${parts.join("; ")}.`;
  }
  const raw =
    `Northern lights tonight are ${visibleWord} in the US places we cover. ${summary} ` +
    `Best remaining half-hour window: ${window} in ${place}. ` +
    `Readings use NOAA SWPC oval and Kp data plus Open-Meteo cloud cover and local darkness, not one national Kp number.`;
  return clampWords(raw, 40, 60, ANSWER_PAD);
}

export function homeCityCards(rows: HomePlaceReading[]): HomeCityCard[] {
  const bySlug = new Map(rows.map((row) => [row.dossier.slug, row]));
  const cards: HomeCityCard[] = [];
  for (const spec of HOME_CITY_CARDS) {
    const row = bySlug.get(spec.slug);
    if (!row) continue;
    const point = row.snapshot?.points?.find((item) => item.id === spec.pointId);
    const status = point?.status ?? statusOf(row);
    const reason = point
      ? reasonText(point.main_obstacle, spec.city) ||
        `Magnetic latitude ${row.dossier.sample_points.find((item) => item.id === spec.pointId)?.magnetic_latitude.toFixed(1) ?? row.dossier.magnetic_latitude.toFixed(1)}.`
      : row.snapshot
        ? row.snapshot.main_obstacle_text ??
          reasonText(row.snapshot.main_obstacle, spec.city)
        : copy.verdict.stale_main_issue;
    cards.push({
      city: spec.city,
      stateName: spec.slug === "fairbanks" ? "Alaska" : row.dossier.name,
      slug: spec.slug,
      status,
      reason,
    });
  }
  return cards;
}
