/*
 * Pure TypeScript port of engine/snapshot.py's compute path.
 *
 * Deliberately keeps the Python engine's wall-clock arithmetic around DST.
 * In particular, ZoneInfo arithmetic can retain nonexistent spring-forward
 * wall times.  The golden fixtures define that behaviour, so this module does
 * not normalize those times through JavaScript Date arithmetic.
 */

export type JsonObject = Record<string, any>;

type WallTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  zone: string;
};

type ParsedOvation = {
  obs: number | null;
  fcst: number | null;
  grid: Map<string, number>;
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const SNAPSHOT_TTL = 25 * MINUTE;

export const REASON_COPY: Record<string, string> = {
  AURORA_NO_REACH: "Aurora activity is not expected to reach {place} tonight.",
  AURORA_HORIZON_ONLY: "Any display would likely stay low on the northern horizon.",
  AURORA_OVERHEAD: "Aurora may reach overhead or high in the northern sky.",
  CLOUD_BLOCKED: "Cloud cover is likely to block the sky for the rest of the night.",
  CLOUD_MIXED: "Clouds are the main uncertainty.",
  NEVER_DARK: "The sky will not get dark enough tonight.",
  NOT_DARK_YET: "It is not dark yet; the viewing window starts later.",
  MOON_BRIGHT: "Bright moonlight will wash out fainter aurora.",
  LIGHT_POLLUTION: "City skyglow will hide a weak display; leaving town helps.",
  FORECAST_FAR: "Later hours rely on a coarser forecast, not the live oval.",
  DATA_MISSING_AURORA: "Aurora data is unavailable, so we are not guessing.",
  DATA_MISSING_WEATHER: "Cloud data is missing; activity may still be in range.",
  DATA_STALE: "Source data is too old to treat as live.",
  SIGNALS_CONFLICT: "Short-term and overnight signals disagree.",
  NONE: "Conditions line up well enough to try.",
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const utcIso = (epoch: number): string => {
  const d = new Date(epoch);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}+00:00`;
};

const wallNumber = (wall: WallTime): number =>
  Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);

const wallCompare = (a: WallTime, b: WallTime): number => wallNumber(a) - wallNumber(b);

const addWallMinutes = (wall: WallTime, minutes: number): WallTime => {
  const d = new Date(wallNumber(wall) + minutes * MINUTE);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    zone: wall.zone,
  };
};

const partsFormatter = new Map<string, Intl.DateTimeFormat>();
const shortZoneFormatter = new Map<string, Intl.DateTimeFormat>();

const getPartsFormatter = (zone: string): Intl.DateTimeFormat => {
  let formatter = partsFormatter.get(zone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    partsFormatter.set(zone, formatter);
  }
  return formatter;
};

const utcToWall = (epoch: number, zone: string): WallTime => {
  const values: Record<string, number> = {};
  for (const part of getPartsFormatter(zone).formatToParts(new Date(epoch))) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
    zone,
  };
};

const offsetAt = (epoch: number, zone: string): number => {
  const wall = utcToWall(epoch, zone);
  return wallNumber(wall) - epoch;
};

const sameWall = (a: WallTime, b: WallTime): boolean =>
  a.year === b.year &&
  a.month === b.month &&
  a.day === b.day &&
  a.hour === b.hour &&
  a.minute === b.minute &&
  a.second === b.second;

/* ZoneInfo's default fold=0 selects the earlier instant for repeated hours.
 * For nonexistent spring-forward times Python retains the pre-transition
 * offset; offsetAt(the naive UTC wall value) reproduces that choice in US TZs.
 */
const wallOffset = (wall: WallTime): number => {
  const naive = wallNumber(wall);
  const offsets = new Set<number>();
  for (const delta of [-18, -12, -6, 0, 6, 12, 18]) {
    offsets.add(offsetAt(naive + delta * HOUR, wall.zone));
  }
  const matches = [...offsets]
    .map((offset) => ({ offset, epoch: naive - offset }))
    .filter(({ epoch }) => sameWall(utcToWall(epoch, wall.zone), wall))
    .sort((a, b) => a.epoch - b.epoch);
  return matches.length ? matches[0].offset : offsetAt(naive, wall.zone);
};

const wallToEpoch = (wall: WallTime): number => wallNumber(wall) - wallOffset(wall);

const wallIso = (wall: WallTime): string => {
  const offsetMinutes = wallOffset(wall) / MINUTE;
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  return `${wall.year}-${pad2(wall.month)}-${pad2(wall.day)}T${pad2(wall.hour)}:${pad2(wall.minute)}:${pad2(wall.second)}${sign}${pad2(Math.floor(absolute / 60))}:${pad2(absolute % 60)}`;
};

const timezoneName = (epoch: number, zone: string): string => {
  let formatter = shortZoneFormatter.get(zone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "short" });
    shortZoneFormatter.set(zone, formatter);
  }
  return formatter.formatToParts(new Date(epoch)).find((part) => part.type === "timeZoneName")?.value ?? "UTC";
};

const parseUtc = (value: unknown): number | null => {
  if (typeof value !== "string" || !value) return null;
  let normalized = value.replace(" ", "T");
  if (!/(Z|[+-]\d\d:\d\d)$/.test(normalized)) normalized += "Z";
  const epoch = Date.parse(normalized);
  return Number.isFinite(epoch) ? epoch : null;
};

const julian = (epoch: number): number => {
  const utc = new Date(epoch);
  let year = utc.getUTCFullYear();
  let month = utc.getUTCMonth() + 1;
  const day = utc.getUTCDate();
  const hour = utc.getUTCHours() + utc.getUTCMinutes() / 60 + utc.getUTCSeconds() / 3600;
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.trunc(365.25 * (year + 4716)) + Math.trunc(30.6001 * (month + 1)) + day + b - 1524.5 + hour / 24;
};

export function sun_altitude(lat: number, lon: number, when: number | WallTime): number {
  const epoch = typeof when === "number" ? when : wallToEpoch(when);
  const jd = julian(epoch);
  const n = jd - 2451545.0;
  const l = ((280.460 + 0.9856474 * n) % 360 + 360) % 360;
  const g = ((((357.528 + 0.9856003 * n) % 360) + 360) % 360) * Math.PI / 180;
  const lambda = (l + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
  const epsilon = (23.439 - 0.0000004 * n) * Math.PI / 180;
  const ra = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(epsilon) * Math.sin(lambda));
  const gmst = ((18.697374558 + 24.06570982441908 * n) % 24 + 24) % 24;
  const lst = ((gmst + lon / 15) % 24 + 24) % 24;
  const ha = (lst * 15 - ra * 180 / Math.PI) * Math.PI / 180;
  const phi = lat * Math.PI / 180;
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha)) * 180 / Math.PI;
}

export function moon_illumination(when: number | WallTime): number {
  const epoch = typeof when === "number" ? when : wallToEpoch(when);
  let phase = (julian(epoch) - 2451550.1) / 29.53058867;
  phase -= Math.floor(phase);
  return (1 - Math.cos(2 * Math.PI * phase)) / 2;
}

export function moon_altitude(lat: number, lon: number, when: number | WallTime): number {
  const epoch = typeof when === "number" ? when : wallToEpoch(when);
  const jd = julian(epoch);
  const t = (jd - 2451545.0) / 36525;
  const l = (((218.316 + 481267.881 * t) % 360 + 360) % 360) * Math.PI / 180;
  const m = (((134.963 + 477198.868 * t) % 360 + 360) % 360) * Math.PI / 180;
  const f = (((93.272 + 483202.018 * t) % 360 + 360) % 360) * Math.PI / 180;
  const lonE = l + 6.289 * Math.PI / 180 * Math.sin(m);
  const latE = 5.128 * Math.PI / 180 * Math.sin(f);
  const obliquity = 23.44 * Math.PI / 180;
  const dec = Math.asin(Math.sin(latE) * Math.cos(obliquity) + Math.cos(latE) * Math.sin(obliquity) * Math.sin(lonE));
  const ra = Math.atan2(Math.sin(lonE) * Math.cos(obliquity) - Math.tan(latE) * Math.sin(obliquity), Math.cos(lonE));
  const n = jd - 2451545.0;
  const gmst = ((18.697374558 + 24.06570982441908 * n) % 24 + 24) % 24;
  const lst = ((gmst + lon / 15) % 24 + 24) % 24;
  const ha = (lst * 15 - ra * 180 / Math.PI) * Math.PI / 180;
  const phi = lat * Math.PI / 180;
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha)) * 180 / Math.PI;
}

const gridKey = (lon: number, lat: number): string => `${lon},${lat}`;

export function parse_ovation(raw: JsonObject): ParsedOvation {
  if (!Array.isArray(raw.coordinates)) throw new TypeError("coordinates missing");
  const grid = new Map<string, number>();
  for (const row of raw.coordinates) {
    if (!Array.isArray(row) || row.length < 3) throw new TypeError("invalid coordinate");
    grid.set(gridKey(Math.trunc(Number(row[0])), Math.trunc(Number(row[1]))), Number(row[2]));
  }
  return {
    obs: parseUtc(raw["Observation Time"] ?? raw.Observation_Time),
    fcst: parseUtc(raw["Forecast Time"] ?? raw.Forecast_Time),
    grid,
  };
}

export function ovation_at(grid: Map<string, number>, lat: number, lon: number): number {
  const lon360 = ((lon % 360) + 360) % 360;
  const x0 = Math.floor(lon360);
  const y0 = Math.floor(lat);
  const x1 = (x0 + 1) % 360;
  const y1 = Math.min(90, y0 + 1);
  const tx = lon360 - x0;
  const ty = lat - y0;
  const v00 = grid.get(gridKey(x0, y0)) ?? 0;
  const v10 = grid.get(gridKey(x1, y0)) ?? v00;
  const v01 = grid.get(gridKey(x0, y1)) ?? v00;
  const v11 = grid.get(gridKey(x1, y1)) ?? v10;
  return (1 - tx) * (1 - ty) * v00 + tx * (1 - ty) * v10 + (1 - tx) * ty * v01 + tx * ty * v11;
}

export function ovation_reach(grid: Map<string, number>, lat: number, lon: number): string {
  const here = ovation_at(grid, lat, lon);
  let north = -Infinity;
  for (let d = 0; d < 9; d += 1) north = Math.max(north, ovation_at(grid, Math.min(90, lat + d), lon));
  if (here < 5 && north < 10) return "none";
  if (here < 8 && north >= 15) return "horizon";
  if (here >= 15) return "overhead";
  return "weak";
}

export function kp_reach(kp: number | null, horizon: number | null, overhead: number | null): string | null {
  if (kp === null || horizon === null || overhead === null) return null;
  if (kp < horizon - 1) return "none";
  if (kp < horizon) return "weak";
  if (kp < overhead) return "horizon";
  return "overhead";
}

export function kp_at(series: any[], whenEpoch: number): [number | null, string | null] {
  let best: [number, string | null, number] | null = null;
  for (const row of series) {
    if (!row?.time_tag) continue;
    const tag = String(row.time_tag);
    const epoch = parseUtc(tag.includes("T") ? tag : `${tag.replace(" ", "T")}Z`);
    if (epoch === null) continue;
    if (epoch <= whenEpoch && whenEpoch < epoch + 3 * HOUR) return [Number(row.kp), row.observed ?? null];
    if (epoch <= whenEpoch) best = [Number(row.kp), row.observed ?? null, epoch];
  }
  return best ? [best[0], best[1]] : [null, null];
}

const cloudTimeKey = (wall: WallTime): string =>
  `${wall.year}-${pad2(wall.month)}-${pad2(wall.day)}T${pad2(wall.hour)}:${pad2(wall.minute)}`;

export function cloud_block_at(om: JsonObject | null, localMid: WallTime): [string | null, number | null] {
  if (!om?.hourly) return [null, null];
  const hourly = om.hourly;
  const times: any[] = hourly.time ?? [];
  const stamp = { ...localMid, minute: 0, second: 0 };
  const next = addWallMinutes(stamp, 60);
  const indexOf = (wall: WallTime): number | null => {
    const index = times.indexOf(cloudTimeKey(wall));
    if (index >= 0) return index;
    const key = cloudTimeKey(wall).replace(/:\d\d$/, ":00");
    const fallback = times.indexOf(key);
    return fallback >= 0 ? fallback : null;
  };
  const i0 = indexOf(stamp);
  const i1 = indexOf(next);
  if (i0 === null) return [null, null];
  const fraction = (wallNumber(localMid) - wallNumber(stamp)) / HOUR;
  const lerp = (array: any[]): number | null => {
    if (i0 >= array.length || array[i0] === null || array[i0] === undefined) return null;
    const a = Number(array[i0]);
    if (i1 === null || i1 >= array.length || array[i1] === null || array[i1] === undefined) return a;
    return a * (1 - fraction) + Number(array[i1]) * fraction;
  };
  const low = lerp(hourly.cloud_cover_low ?? []);
  const mid = lerp(hourly.cloud_cover_mid ?? []);
  const high = lerp(hourly.cloud_cover_high ?? []);
  const total = lerp(hourly.cloud_cover ?? []);
  const blocking = low !== null && mid !== null && high !== null
    ? 0.50 * low + 0.35 * mid + 0.15 * high
    : total;
  if (blocking === null) return [null, null];
  if (blocking < 40) return ["clear", blocking];
  if (blocking < 75) return ["mixed", blocking];
  return ["socked", blocking];
}

export function classify_window(args: JsonObject): JsonObject {
  const {
    sun_alt: sunAlt, is_near: isNear, ovation_ok: ovationOk,
    ovation_stale_90: stale90, grid, lat, lon, kp, kp_kind: kpKind,
    has_dossier: hasDossier, horizon_kp: horizonKp, overhead_kp: overheadKp,
    zone, cloud, urban, bright_moon: brightMoon,
  } = args;
  if (sunAlt > -12) return { skip: true, status: null, aurora_reach: null, cloud_block: cloud, source: null, codes: ["NOT_DARK_YET"] };
  let source: string | null = null;
  let reach: string | null = null;
  if (isNear) {
    if (!ovationOk || stale90 || !grid) {
      return { skip: false, status: "UNKNOWN", aurora_reach: null, cloud_block: cloud, source: null, codes: ["DATA_MISSING_AURORA"] };
    }
    reach = ovation_reach(grid, lat, lon);
    source = "ovation";
  } else {
    if (!hasDossier) {
      if (cloud === "socked") return { skip: false, status: "NO", aurora_reach: null, cloud_block: "socked", source: "none", codes: ["CLOUD_BLOCKED"] };
      return { skip: false, status: "MAYBE", aurora_reach: null, cloud_block: cloud, source: kp !== null ? "kp_forecast" : "none", codes: ["FORECAST_FAR"] };
    }
    if (kp === null) return { skip: false, status: "UNKNOWN", aurora_reach: null, cloud_block: cloud, source: null, codes: ["DATA_MISSING_AURORA"] };
    reach = kp_reach(kp, horizonKp ?? null, overheadKp ?? null);
    source = kpKind === "predicted" ? "kp_forecast" : "kp";
  }
  if (cloud === null) {
    if (reach === "none") return { skip: false, status: "NO", aurora_reach: "none", cloud_block: null, source, codes: ["AURORA_NO_REACH", "DATA_MISSING_WEATHER"] };
    return { skip: false, status: "MAYBE", aurora_reach: reach, cloud_block: null, source, codes: ["DATA_MISSING_WEATHER"] };
  }
  if (reach === "none") return { skip: false, status: "NO", aurora_reach: "none", cloud_block: cloud, source, codes: ["AURORA_NO_REACH"] };
  if (cloud === "socked") return { skip: false, status: "NO", aurora_reach: reach, cloud_block: "socked", source, codes: ["CLOUD_BLOCKED"] };
  const codes: string[] = [];
  if (reach === "overhead") codes.push("AURORA_OVERHEAD");
  else if (reach === "horizon") codes.push("AURORA_HORIZON_ONLY");
  if (cloud === "mixed") codes.push("CLOUD_MIXED");
  if (urban && reach === "horizon") codes.push("LIGHT_POLLUTION");
  if (brightMoon && reach === "horizon") codes.push("MOON_BRIGHT");
  if (!isNear) codes.push("FORECAST_FAR");
  const canGo = ["overhead", "horizon"].includes(reach ?? "")
    && !(reach === "horizon" && (urban || brightMoon))
    && cloud === "clear"
    && (isNear || (hasDossier && zone === "oval"));
  if (canGo) return { skip: false, status: "GO", aurora_reach: reach, cloud_block: cloud, source, codes: codes.length ? codes : ["NONE"] };
  if (!codes.length) codes.push(isNear ? "AURORA_HORIZON_ONLY" : "FORECAST_FAR");
  return { skip: false, status: "MAYBE", aurora_reach: reach, cloud_block: cloud, source, codes };
}

export function rollup(windows: JsonObject[], nowLocal: WallTime): JsonObject {
  const live = windows.filter((window) => wallCompare(window.end, nowLocal) > 0);
  const scored = live.filter((window) => !window.skip);
  if (!scored.length) return { status: "NO", confidence: "high", best_window: null, main_obstacle: "NEVER_DARK", reason_codes: ["NEVER_DARK"] };
  const statuses = scored.map((window) => window.status);
  const allNone = scored.every((window) => window.codes.includes("AURORA_NO_REACH"));
  const hasUnknown = statuses.includes("UNKNOWN");
  const hasGo = statuses.includes("GO");
  const hasMaybe = statuses.includes("MAYBE");
  const status = !hasGo && hasUnknown && !allNone ? "UNKNOWN" : hasGo ? "GO" : hasMaybe ? "MAYBE" : "NO";
  const target = hasGo ? "GO" : hasMaybe ? "MAYBE" : null;
  let best: JsonObject | null = null;
  if (target) {
    let run: JsonObject[] = [];
    let bestRun: JsonObject[] = [];
    for (const window of scored) {
      if (window.status === target) {
        run.push(window);
        if (run.length > bestRun.length) bestRun = [...run];
      } else run = [];
    }
    if (bestRun.length) best = { start: bestRun[0].start, end: bestRun[bestRun.length - 1].end };
  }
  let main: string;
  if (status === "GO") {
    const extra = scored.flatMap((window) => window.status === "GO" ? window.codes.filter((code: string) => !["NONE", "AURORA_OVERHEAD"].includes(code)) : []);
    main = extra[0] ?? "NONE";
  } else if (status === "MAYBE") {
    const counts = new Map<string, number>();
    for (const window of scored) {
      if (window.status !== "MAYBE") continue;
      for (const code of window.codes) counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    let maximum = 0;
    main = "FORECAST_FAR";
    for (const [code, count] of counts) {
      if (count > maximum) {
        maximum = count;
        main = code;
      }
    }
  } else if (status === "UNKNOWN") main = "DATA_MISSING_AURORA";
  else {
    const codes = scored.flatMap((window) => window.codes);
    main = codes.includes("AURORA_NO_REACH") ? "AURORA_NO_REACH" : codes.includes("CLOUD_BLOCKED") ? "CLOUD_BLOCKED" : "NEVER_DARK";
  }
  let confidence = "high";
  if (status !== "NO") {
    if (scored.some((window) => window.source === "kp_forecast")) confidence = "medium";
    if (scored.some((window) => window.codes.some((code: string) => code.includes("DATA_MISSING")))) confidence = "low";
    if (best && wallCompare(best.start, nowLocal) > 6 * HOUR) confidence = "low";
  } else if (scored.some((window) => window.status === "UNKNOWN")) confidence = "low";
  const reasons: string[] = [];
  for (const window of scored) for (const code of window.codes) if (!reasons.includes(code)) reasons.push(code);
  if (!reasons.includes(main)) reasons.unshift(main);
  return { status, confidence, best_window: best, main_obstacle: main, reason_codes: reasons.slice(0, 8) };
}

export function apply_midlat_confidence(confidence: string, zone: string | null, windows: JsonObject[], nowLocal: WallTime): string {
  const order = ["high", "medium", "low"];
  let index = order.indexOf(confidence);
  const far = windows.filter((window) => !window.skip && ["kp_forecast", "kp"].includes(window.source) && wallCompare(window.end, nowLocal) > 0);
  if (far.length && ["midlatitude_event", "sub_oval", "rare"].includes(zone ?? "")) index = Math.max(index, 2);
  return order[index];
}

export function night_slots(zone: string, nowUtc: number, lat: number, lon: number): WallTime[] {
  const nowLocal = utcToWall(nowUtc, zone);
  let start = { ...nowLocal, second: 0 };
  start = addWallMinutes(start, -(start.minute % 30));
  const samples: Array<[WallTime, number]> = [];
  for (let index = 0; index < 96; index += 1) {
    const wall = addWallMinutes(start, 30 * index);
    samples.push([wall, sun_altitude(lat, lon, wall)]);
  }
  const groups: WallTime[][] = [];
  let current: WallTime[] = [];
  for (const [wall, altitude] of samples) {
    if (altitude <= 0) current.push(wall);
    else if (current.length) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length) groups.push(current);
  for (const group of groups) {
    if (wallCompare(addWallMinutes(group[group.length - 1], 15), nowLocal) <= 0) continue;
    const hasDark = group.some((mid) => wallCompare(addWallMinutes(mid, 15), nowLocal) > 0 && sun_altitude(lat, lon, mid) <= -12);
    if (hasDark) return group.filter((mid) => wallCompare(addWallMinutes(mid, 15), nowLocal) > 0);
  }
  return [];
}

export function snapshot_point(
  point: JsonObject,
  location: JsonObject,
  nowUtc: number,
  ovation: ParsedOvation | null,
  kpSeries: any[],
  clouds: JsonObject | null,
  ovationOk: boolean,
  stale45: boolean,
  stale90: boolean,
): JsonObject {
  const lat = Number(point.lat);
  const lon = Number(point.lng);
  const zoneName = String(location.timezone);
  const nowLocal = utcToWall(nowUtc, zoneName);
  const urban = location.location_type === "city" || point.role === "population";
  const mids = night_slots(zoneName, nowUtc, lat, lon);
  const windows: JsonObject[] = [];
  for (const mid of mids) {
    const start = addWallMinutes(mid, -15);
    const end = addWallMinutes(mid, 15);
    const sun = sun_altitude(lat, lon, mid);
    const brightMoon = moon_altitude(lat, lon, mid) > 10 && moon_illumination(mid) > 0.70;
    const midEpoch = wallToEpoch(mid);
    const isNear = ovation?.fcst !== null && ovation?.fcst !== undefined && midEpoch <= ovation.fcst + 30 * MINUTE;
    const [kp, kpKind] = kp_at(kpSeries, midEpoch);
    const [cloud] = cloud_block_at(clouds, mid);
    const classified = classify_window({
      sun_alt: sun,
      is_near: isNear,
      ovation_ok: ovationOk,
      ovation_stale_90: stale90,
      grid: ovation?.grid ?? null,
      lat,
      lon,
      kp,
      kp_kind: kpKind,
      has_dossier: true,
      horizon_kp: location.typical_kp_horizon ?? null,
      overhead_kp: location.typical_kp_overhead ?? null,
      zone: location.aurora_zone ?? null,
      cloud,
      urban,
      bright_moon: brightMoon,
    });
    windows.push({
      start,
      end,
      mid,
      skip: classified.skip,
      status: classified.status,
      aurora_reach: classified.aurora_reach,
      cloud_block: classified.cloud_block,
      source: classified.source,
      codes: classified.codes,
      sun_alt: Math.round(sun * 10) / 10,
    });
  }
  const summary = rollup(windows, nowLocal);
  if (summary.status !== "NO") {
    summary.confidence = apply_midlat_confidence(summary.confidence, location.aurora_zone ?? null, windows, nowLocal);
    if (stale45 && summary.confidence === "high") summary.confidence = "medium";
  }
  const live = windows.filter((window) => wallCompare(window.end, nowLocal) > 0);
  return {
    id: point.id,
    name: point.name,
    role: point.role ?? null,
    urban,
    status: summary.status,
    confidence: summary.confidence,
    aurora_reach: live.find((window) => !window.skip && window.aurora_reach)?.aurora_reach ?? null,
    cloud_block: live.find((window) => !window.skip && window.cloud_block)?.cloud_block ?? null,
    best_window: summary.best_window,
    main_obstacle: summary.main_obstacle,
    reason_codes: summary.reason_codes,
    windows: live,
  };
}

export function serialize_window(window: JsonObject): JsonObject {
  return {
    start: wallIso(window.start),
    end: wallIso(window.end),
    skip: window.skip,
    status: window.status,
    aurora_reach: window.aurora_reach,
    cloud_block: window.cloud_block,
    source: window.source,
    codes: window.codes,
  };
}

const formatClock = (wall: WallTime): string => {
  const hour = wall.hour % 12 || 12;
  return `${hour}:${pad2(wall.minute)} ${wall.hour < 12 ? "AM" : "PM"}`;
};

export function _answer(location: JsonObject, headline: JsonObject, nowLocal: WallTime, nowUtc?: number): string {
  const place = String(location.name);
  const extra = location.location_type === "state" ? ` (${headline.name} area)` : "";
  const best = headline.best_window;
  const window = best
    ? ` Best window ${formatClock(best.start)}–${formatClock(best.end)} ${timezoneName(nowUtc ?? wallToEpoch(nowLocal), nowLocal.zone)}.`
    : "";
  const issue = (REASON_COPY[headline.main_obstacle] ?? "").replace("{place}", place);
  if (headline.status === "GO") return `GO${extra}.${window} ${issue}`.trim();
  if (headline.status === "MAYBE") return `MAYBE in ${place}${extra}.${window} Main issue: ${issue}`;
  if (headline.status === "NO") return `NO${extra}. Not worth a special trip tonight. ${issue}`;
  return `UNKNOWN${extra}. We are not guessing. ${issue}`;
}

export function snapshot_location(
  location: JsonObject,
  nowUtc: number,
  ovation: ParsedOvation | null,
  kpSeries: any[],
  cloudByKey: JsonObject,
  ovationOk: boolean,
  stale45: boolean,
  stale90: boolean,
): JsonObject {
  const nowLocal = utcToWall(nowUtc, String(location.timezone));
  const points = location.sample_points.map((point: JsonObject) => {
    const key = `${Number(point.lat).toFixed(3)},${Number(point.lng).toFixed(3)}`;
    return snapshot_point(point, location, nowUtc, ovation, kpSeries, cloudByKey[key] ?? null, ovationOk, stale45, stale90);
  });
  const headline = points.find((point: JsonObject) => point.id === location.primary_verdict_point);
  if (!headline) throw new Error(`headline point missing for ${location.slug}`);
  const best = headline.best_window;
  const sentence = (REASON_COPY[headline.main_obstacle] ?? REASON_COPY.NONE).replace("{place}", String(location.name));
  return {
    location_slug: location.slug,
    headline_point_id: location.primary_verdict_point,
    headline_point_name: headline.name,
    generated_at: utcIso(nowUtc),
    valid_until: utcIso(nowUtc + SNAPSHOT_TTL),
    status: headline.status,
    confidence: headline.confidence,
    best_window_start: best ? wallIso(best.start) : null,
    best_window_end: best ? wallIso(best.end) : null,
    main_obstacle: headline.main_obstacle,
    main_obstacle_text: sentence,
    reason_codes: headline.reason_codes,
    look_toward: "north",
    answer_sentence: _answer(location, headline, nowLocal, nowUtc),
    sources: {
      ovation_obs: ovation?.obs !== null && ovation?.obs !== undefined ? utcIso(ovation.obs) : null,
      ovation_fcst: ovation?.fcst !== null && ovation?.fcst !== undefined ? utcIso(ovation.fcst) : null,
      ovation_ok: ovationOk,
    },
    points: points.map((point: JsonObject) => ({
      id: point.id,
      name: point.name,
      status: point.status,
      confidence: point.confidence,
      aurora_reach: point.aurora_reach,
      cloud_block: point.cloud_block,
      urban: point.urban,
      main_obstacle: point.main_obstacle,
    })),
    windows: headline.windows.map(serialize_window),
    seo_indexable: false,
  };
}

const pointKey = (location: JsonObject, point: JsonObject): string => `${location.slug}/${point.id}`;

export function compute_bundle(
  now: string | Date,
  ovationEnvelope: JsonObject | null,
  kpEnvelope: any[] | null,
  cloudEnvelopes: JsonObject,
  dossiers: JsonObject | JsonObject[],
): JsonObject {
  const nowUtc = now instanceof Date ? now.getTime() : Date.parse(now);
  if (!Number.isFinite(nowUtc)) throw new ValueError("now must be timezone-aware");
  const locations = Array.isArray(dossiers) ? dossiers : dossiers.locations;
  let ovation: ParsedOvation | null = null;
  if (ovationEnvelope !== null) {
    try {
      const candidate = parse_ovation(ovationEnvelope);
      if (candidate.obs !== null) ovation = candidate;
    } catch {
      ovation = null;
    }
  }
  const kpSeries = Array.isArray(kpEnvelope) ? kpEnvelope : [];
  let ovationOk = false;
  let stale45 = true;
  let stale90 = true;
  if (ovation?.obs !== null && ovation?.obs !== undefined) {
    const age = nowUtc - ovation.obs;
    stale45 = age > 45 * MINUTE;
    stale90 = age > 90 * MINUTE;
    ovationOk = !stale90;
  }
  const snapshots = locations.map((location: JsonObject) => {
    const clouds: JsonObject = {};
    for (const point of location.sample_points) {
      const coordinate = `${Number(point.lat).toFixed(3)},${Number(point.lng).toFixed(3)}`;
      const scopedKey = pointKey(location, point);
      clouds[coordinate] = Object.hasOwn(cloudEnvelopes, scopedKey)
        ? cloudEnvelopes[scopedKey]
        : (cloudEnvelopes[coordinate] ?? null);
    }
    return snapshot_location(location, nowUtc, ovation, kpSeries, clouds, ovationOk, stale45, stale90);
  });
  return {
    generated_at: utcIso(nowUtc),
    ovation_ok: ovationOk,
    seo_indexable: false,
    locations: snapshots,
  };
}

class ValueError extends Error {}

// Camel-case alias for later TypeScript callers; parity is anchored to Python's name.
export const computeBundle = compute_bundle;
