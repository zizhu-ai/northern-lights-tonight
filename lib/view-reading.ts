import {
  REASON_COPY,
  parse_ovation,
  snapshot_location,
  type JsonObject,
  // @ts-ignore TS5097
} from "./aurora-engine/index.ts";
// @ts-ignore TS5097
import { farWindowHasNoReach, magneticLatitude } from "./magnetic-latitude.ts";
import type { ForecastSnapshot, ForecastWindow, SnapshotRow } from "./snapshots";

export type ViewReadingStatus = SnapshotRow["status"];

export type ViewReading = {
  status: ViewReadingStatus;
  confidence: SnapshotRow["confidence"];
  mainObstacle: string;
  mainIssue: string;
  answerSentence: string;
  bestWindowStart: string | null;
  bestWindowEnd: string | null;
  lookToward: string;
  generatedAt: string;
  windows: ForecastWindow[];
  magneticLatitude: number;
  source: "live" | "missing";
};

const MINUTE = 60_000;

export function coordinateLabel(lat: number, lng: number): string {
  return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
}

export function isCoordinateLabel(name: string, lat: number, lng: number): boolean {
  return name.trim() === coordinateLabel(lat, lng);
}

export function normalizeKpSeries(raw: unknown): JsonObject[] {
  if (!Array.isArray(raw)) return [];
  const rows: JsonObject[] = [];
  for (const row of raw) {
    if (row && typeof row === "object" && !Array.isArray(row) && "time_tag" in row) {
      rows.push(row as JsonObject);
      continue;
    }
    if (Array.isArray(row) && row.length >= 2 && row[0] !== "time_tag") {
      const kp = Number(row[1]);
      if (!Number.isFinite(kp)) continue;
      rows.push({
        time_tag: String(row[0]).replace(" ", "T"),
        kp,
        observed: row[2] ?? null,
      });
    }
  }
  return rows;
}

export function hasUsableKp(series: JsonObject[]): boolean {
  return series.some(
    (row) =>
      typeof row.time_tag === "string" &&
      Number.isFinite(Date.parse(String(row.time_tag))) &&
      Number.isFinite(Number(row.kp)),
  );
}

export function parseOvationForView(payload: JsonObject | null) {
  if (!payload) return null;
  try {
    const ovation = parse_ovation(payload);
    return ovation.obs === null ? null : ovation;
  } catch {
    return null;
  }
}

export function freshnessForOvation(
  ovation: ReturnType<typeof parse_ovation> | null,
  nowUtc: number,
): { ovationOk: boolean; stale45: boolean; stale90: boolean } {
  if (ovation?.obs === null || ovation?.obs === undefined) {
    return { ovationOk: false, stale45: true, stale90: true };
  }
  const age = nowUtc - ovation.obs;
  const stale45 = age > 45 * MINUTE;
  const stale90 = age > 90 * MINUTE;
  return { ovationOk: !stale90, stale45, stale90 };
}

export function unknownViewReading(
  name: string,
  lat: number,
  lng: number,
  generatedAt: string,
): ViewReading {
  return {
    status: "UNKNOWN",
    confidence: "low",
    mainObstacle: "DATA_MISSING_AURORA",
    mainIssue: REASON_COPY.DATA_MISSING_AURORA,
    answerSentence: `UNKNOWN. We are not guessing. ${REASON_COPY.DATA_MISSING_AURORA}`,
    bestWindowStart: null,
    bestWindowEnd: null,
    lookToward: "north",
    generatedAt,
    windows: [],
    magneticLatitude: magneticLatitude(lat, lng),
    source: "missing",
  };
}

export function computeViewReading(input: {
  lat: number;
  lng: number;
  name: string;
  timezone: string;
  urban?: boolean;
  now: Date;
  ovationPayload: JsonObject | null;
  kpPayload: unknown;
  clouds: JsonObject | null;
}): ViewReading {
  const { lat, lng, name, timezone, now } = input;
  const nowUtc = now.getTime();
  const generatedAt = now.toISOString();
  const magLat = magneticLatitude(lat, lng);
  const kpSeries = normalizeKpSeries(input.kpPayload);
  const ovation = parseOvationForView(input.ovationPayload);
  const freshness = freshnessForOvation(ovation, nowUtc);
  const usableAurora = freshness.ovationOk || hasUsableKp(kpSeries);

  if (!usableAurora && !farWindowHasNoReach(magLat)) {
    return unknownViewReading(name, lat, lng, generatedAt);
  }

  const location = {
    slug: "view",
    name,
    location_type: input.urban === false ? "pin" : "city",
    timezone,
    primary_verdict_point: "pin",
    sample_points: [
      {
        id: "pin",
        name,
        lat,
        lng,
        role: input.urban === false ? "dark" : "population",
      },
    ],
    typical_kp_horizon: null,
    typical_kp_overhead: null,
    aurora_zone: null,
  };
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const snapshot = snapshot_location(
    location,
    nowUtc,
    ovation,
    kpSeries,
    { [key]: input.clouds },
    freshness.ovationOk,
    freshness.stale45,
    freshness.stale90,
    { hasDossier: false, magneticLatitude: magLat },
  );

  return {
    status: snapshot.status as ViewReadingStatus,
    confidence: snapshot.confidence as SnapshotRow["confidence"],
    mainObstacle: String(snapshot.main_obstacle),
    mainIssue: String(
      snapshot.main_obstacle_text ?? REASON_COPY[String(snapshot.main_obstacle)] ?? REASON_COPY.NONE,
    ),
    answerSentence: String(snapshot.answer_sentence),
    bestWindowStart: snapshot.best_window_start ? String(snapshot.best_window_start) : null,
    bestWindowEnd: snapshot.best_window_end ? String(snapshot.best_window_end) : null,
    lookToward: "north",
    generatedAt: String(snapshot.generated_at ?? generatedAt),
    windows: (Array.isArray(snapshot.windows) ? snapshot.windows : []) as ForecastWindow[],
    magneticLatitude: magLat,
    source: "live",
  };
}

export function viewReadingToSnapshot(reading: ViewReading): ForecastSnapshot {
  return {
    location_slug: "view",
    headline_point_id: "pin",
    headline_point_name: "pin",
    generated_at: reading.generatedAt,
    valid_until: reading.generatedAt,
    status: reading.status,
    confidence: reading.confidence,
    best_window_start: reading.bestWindowStart,
    best_window_end: reading.bestWindowEnd,
    main_obstacle: reading.mainObstacle,
    main_obstacle_text: reading.mainIssue,
    reason_codes: [reading.mainObstacle],
    look_toward: reading.lookToward,
    answer_sentence: reading.answerSentence,
    points: [],
    windows: reading.windows,
    seo_indexable: false,
    updated_at: reading.generatedAt,
  };
}
