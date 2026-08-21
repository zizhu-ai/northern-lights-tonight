#!/usr/bin/env python3
"""Wave 1 aurora snapshot engine. No HTML. Stdlib only."""
from __future__ import annotations

import argparse
import json
import math
import ssl
import sys
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path(__file__).resolve().parent / ".cache"
OUT = ROOT / "snapshots"
DOSSIER = ROOT / "地点档案" / "wave1.json"

OVATION_URL = "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json"
KP_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json"
UA = "NorthernLightsTonight/0.1 (snapshot; local research)"

REASON_COPY = {
    "AURORA_NO_REACH": "Aurora activity is not expected to reach {place} tonight.",
    "AURORA_HORIZON_ONLY": "Any display would likely stay low on the northern horizon.",
    "AURORA_OVERHEAD": "Aurora may reach overhead or high in the northern sky.",
    "CLOUD_BLOCKED": "Cloud cover is likely to block the sky for the rest of the night.",
    "CLOUD_MIXED": "Clouds are the main uncertainty.",
    "NEVER_DARK": "The sky will not get dark enough tonight.",
    "NOT_DARK_YET": "It is not dark yet; the viewing window starts later.",
    "MOON_BRIGHT": "Bright moonlight will wash out fainter aurora.",
    "LIGHT_POLLUTION": "City skyglow will hide a weak display; leaving town helps.",
    "FORECAST_FAR": "Later hours rely on a coarser forecast, not the live oval.",
    "DATA_MISSING_AURORA": "Aurora data is unavailable, so we are not guessing.",
    "DATA_MISSING_WEATHER": "Cloud data is missing; activity may still be in range.",
    "DATA_STALE": "Source data is too old to treat as live.",
    "SIGNALS_CONFLICT": "Short-term and overnight signals disagree.",
    "NONE": "Conditions line up well enough to try.",
}

SSL = ssl.create_default_context()


# --- fetch -----------------------------------------------------------------

def _get(url: str, cache_name: str, max_age_min: int = 10) -> dict | list:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / cache_name
    if path.exists():
        age = datetime.now(timezone.utc).timestamp() - path.stat().st_mtime
        if age < max_age_min * 60:
            return json.loads(path.read_text())
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, context=SSL, timeout=45) as resp:
        raw = resp.read()
    path.write_bytes(raw)
    return json.loads(raw.decode())


def fetch_clouds(lat: float, lng: float, tz_name: str, offline: bool) -> dict:
    key = f"om_{round(lat, 3)}_{round(lng, 3)}.json"
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / key
    if path.exists():
        age = datetime.now(timezone.utc).timestamp() - path.stat().st_mtime
        if args_offline_or_fresh(offline, age, 25 * 60):
            return json.loads(path.read_text())
    if offline:
        raise RuntimeError(f"no cloud cache for {key}")
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat:.4f}&longitude={lng:.4f}"
        "&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high"
        f"&forecast_days=2&timezone={urllib.parse.quote(tz_name)}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, context=SSL, timeout=45) as resp:
        raw = resp.read()
    path.write_bytes(raw)
    return json.loads(raw.decode())


def args_offline_or_fresh(offline: bool, age: float, max_age: float) -> bool:
    return offline or age < max_age


# --- astro -----------------------------------------------------------------

def _julian(dt: datetime) -> float:
    if dt.tzinfo is None:
        raise ValueError("aware datetime required")
    utc = dt.astimezone(timezone.utc)
    y, m, d = utc.year, utc.month, utc.day
    hr = utc.hour + utc.minute / 60 + utc.second / 3600
    if m <= 2:
        y -= 1
        m += 12
    A = y // 100
    B = 2 - A + A // 4
    return int(365.25 * (y + 4716)) + int(30.6001 * (m + 1)) + d + B - 1524.5 + hr / 24


def sun_altitude(lat: float, lon: float, dt: datetime) -> float:
    """Apparent solar altitude, degrees. Compact NOAA-style."""
    jd = _julian(dt)
    n = jd - 2451545.0
    L = (280.460 + 0.9856474 * n) % 360
    g = math.radians((357.528 + 0.9856003 * n) % 360)
    lam = math.radians(L + 1.915 * math.sin(g) + 0.020 * math.sin(2 * g))
    eps = math.radians(23.439 - 0.0000004 * n)
    ra = math.atan2(math.cos(eps) * math.sin(lam), math.cos(lam))
    dec = math.asin(math.sin(eps) * math.sin(lam))
    gmst = (18.697374558 + 24.06570982441908 * n) % 24
    lst = (gmst + lon / 15.0) % 24
    ha = math.radians(lst * 15.0 - math.degrees(ra))
    phi = math.radians(lat)
    alt = math.asin(math.sin(phi) * math.sin(dec) + math.cos(phi) * math.cos(dec) * math.cos(ha))
    return math.degrees(alt)


def moon_illumination(dt: datetime) -> float:
    """0 new … 1 full. Synodic-month cosine approximation."""
    jd = _julian(dt)
    phase = (jd - 2451550.1) / 29.53058867
    phase -= math.floor(phase)
    return (1 - math.cos(2 * math.pi * phase)) / 2


def moon_altitude(lat: float, lon: float, dt: datetime) -> float:
    """Low-precision moon altitude (degrees)."""
    jd = _julian(dt)
    t = (jd - 2451545.0) / 36525
    L = math.radians((218.316 + 481267.881 * t) % 360)
    M = math.radians((134.963 + 477198.868 * t) % 360)
    F = math.radians((93.272 + 483202.018 * t) % 360)
    lon_e = L + math.radians(6.289) * math.sin(M)
    lat_e = math.radians(5.128) * math.sin(F)
    dec = math.asin(math.sin(lat_e) * math.cos(math.radians(23.44)) + math.cos(lat_e) * math.sin(math.radians(23.44)) * math.sin(lon_e))
    ra = math.atan2(
        math.sin(lon_e) * math.cos(math.radians(23.44)) - math.tan(lat_e) * math.sin(math.radians(23.44)),
        math.cos(lon_e),
    )
    n = jd - 2451545.0
    gmst = (18.697374558 + 24.06570982441908 * n) % 24
    lst = (gmst + lon / 15.0) % 24
    ha = math.radians(lst * 15.0 - math.degrees(ra))
    phi = math.radians(lat)
    alt = math.asin(math.sin(phi) * math.sin(dec) + math.cos(phi) * math.cos(dec) * math.cos(ha))
    return math.degrees(alt)


# --- ovation / kp ----------------------------------------------------------

def parse_ovation(raw: dict) -> dict:
    obs = _parse_z(raw.get("Observation Time") or raw.get("Observation_Time"))
    fcst = _parse_z(raw.get("Forecast Time") or raw.get("Forecast_Time"))
    grid: dict[tuple[int, int], float] = {}
    for lon, lat, val in raw["coordinates"]:
        grid[(int(lon), int(lat))] = float(val)
    return {"obs": obs, "fcst": fcst, "grid": grid}


def _parse_z(s: str | None) -> datetime | None:
    if not s:
        return None
    s = s.replace("Z", "+00:00")
    if "T" in s and "+" not in s[-6:] and s[-1] != "Z":
        s = s + "+00:00"
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def ovation_at(grid: dict, lat: float, lon: float) -> float:
    lon360 = lon % 360
    if lon360 < 0:
        lon360 += 360
    x0 = math.floor(lon360)
    y0 = math.floor(lat)
    x1 = (x0 + 1) % 360
    y1 = min(90, y0 + 1)
    tx = lon360 - x0
    ty = lat - y0
    v00 = grid.get((x0, y0), 0.0)
    v10 = grid.get((x1, y0), v00)
    v01 = grid.get((x0, y1), v00)
    v11 = grid.get((x1, y1), v10)
    return (1 - tx) * (1 - ty) * v00 + tx * (1 - ty) * v10 + (1 - tx) * ty * v01 + tx * ty * v11


def ovation_reach(grid: dict, lat: float, lon: float) -> str:
    here = ovation_at(grid, lat, lon)
    north = max(ovation_at(grid, min(90.0, lat + d), lon) for d in range(0, 9))
    if here < 5 and north < 10:
        return "none"
    if here < 8 and north >= 15:
        return "horizon"
    if here >= 15:
        return "overhead"
    return "weak"


def kp_reach(kp: float | None, horizon: int | None, overhead: int | None) -> str | None:
    if kp is None or horizon is None or overhead is None:
        return None
    if kp < horizon - 1:
        return "none"
    if kp < horizon:
        return "weak"
    if kp < overhead:
        return "horizon"
    return "overhead"


def kp_at(series: list, when: datetime) -> tuple[float | None, str | None]:
    """Return (kp, observed|estimated|predicted) for the 3h slot containing when."""
    when = when.astimezone(timezone.utc)
    best = None
    for row in series:
        tag = row.get("time_tag")
        if not tag:
            continue
        t = _parse_z(tag if "T" in tag else tag.replace(" ", "T") + "Z")
        if t is None:
            continue
        if t <= when < t + timedelta(hours=3):
            return float(row["kp"]), row.get("observed")
        if t <= when:
            best = (float(row["kp"]), row.get("observed"), t)
    if best:
        return best[0], best[1]
    return None, None


def cloud_block_at(om: dict | None, local_mid: datetime) -> tuple[str | None, float | None]:
    if not om or "hourly" not in om:
        return None, None
    h = om["hourly"]
    times = h.get("time") or []
    tot = h.get("cloud_cover") or []
    low = h.get("cloud_cover_low") or []
    mid = h.get("cloud_cover_mid") or []
    high = h.get("cloud_cover_high") or []
    stamp = local_mid.replace(minute=0, second=0, microsecond=0)
    nxt = stamp + timedelta(hours=1)
    def idx(dt):
        key = dt.strftime("%Y-%m-%dT%H:%M")
        try:
            return times.index(key)
        except ValueError:
            key2 = dt.strftime("%Y-%m-%dT%H:00")
            try:
                return times.index(key2)
            except ValueError:
                return None

    i0, i1 = idx(stamp), idx(nxt)
    if i0 is None:
        return None, None
    frac = (local_mid - stamp).total_seconds() / 3600.0

    def lerp(arr):
        if i0 is None or i0 >= len(arr) or arr[i0] is None:
            return None
        a = float(arr[i0])
        if i1 is None or i1 >= len(arr) or arr[i1] is None:
            return a
        return a * (1 - frac) + float(arr[i1]) * frac

    lo, mi, hi, t = lerp(low), lerp(mid), lerp(high), lerp(tot)
    if lo is not None and mi is not None and hi is not None:
        blocking = 0.50 * lo + 0.35 * mi + 0.15 * hi
    elif t is not None:
        blocking = t
    else:
        return None, None
    if blocking < 40:
        return "clear", blocking
    if blocking < 75:
        return "mixed", blocking
    return "socked", blocking


# --- classify --------------------------------------------------------------

RANK = {"GO": 3, "MAYBE": 2, "NO": 1, "UNKNOWN": 0}


def classify_window(
    *,
    sun_alt: float,
    is_near: bool,
    ovation_ok: bool,
    ovation_stale_90: bool,
    grid: dict | None,
    lat: float,
    lon: float,
    kp: float | None,
    kp_kind: str | None,
    has_dossier: bool,
    horizon_kp: int | None,
    overhead_kp: int | None,
    zone: str | None,
    cloud: str | None,
    urban: bool,
    bright_moon: bool,
) -> dict:
    if sun_alt > -12:
        return {"skip": True, "status": None, "aurora_reach": None, "cloud_block": cloud, "source": None, "codes": ["NOT_DARK_YET"]}

    source = None
    reach = None
    codes: list[str] = []

    if is_near:
        if (not ovation_ok) or ovation_stale_90 or grid is None:
            return {
                "skip": False,
                "status": "UNKNOWN",
                "aurora_reach": None,
                "cloud_block": cloud,
                "source": None,
                "codes": ["DATA_MISSING_AURORA"],
            }
        reach = ovation_reach(grid, lat, lon)
        source = "ovation"
    else:
        if not has_dossier:
            # far window, no archive: cap MAYBE unless clouds kill
            if cloud == "socked":
                return {"skip": False, "status": "NO", "aurora_reach": None, "cloud_block": "socked", "source": "none", "codes": ["CLOUD_BLOCKED"]}
            return {
                "skip": False,
                "status": "MAYBE",
                "aurora_reach": None,
                "cloud_block": cloud,
                "source": "kp_forecast" if kp is not None else "none",
                "codes": ["FORECAST_FAR"],
            }
        if kp is None:
            return {
                "skip": False,
                "status": "UNKNOWN",
                "aurora_reach": None,
                "cloud_block": cloud,
                "source": None,
                "codes": ["DATA_MISSING_AURORA"],
            }
        reach = kp_reach(kp, horizon_kp, overhead_kp)
        source = "kp_forecast" if kp_kind == "predicted" else "kp"

    if cloud is None:
        if reach == "none":
            return {"skip": False, "status": "NO", "aurora_reach": "none", "cloud_block": None, "source": source, "codes": ["AURORA_NO_REACH", "DATA_MISSING_WEATHER"]}
        return {
            "skip": False,
            "status": "MAYBE",
            "aurora_reach": reach,
            "cloud_block": None,
            "source": source,
            "codes": ["DATA_MISSING_WEATHER"],
        }

    if reach == "none":
        return {"skip": False, "status": "NO", "aurora_reach": "none", "cloud_block": cloud, "source": source, "codes": ["AURORA_NO_REACH"]}
    if cloud == "socked":
        return {"skip": False, "status": "NO", "aurora_reach": reach, "cloud_block": "socked", "source": source, "codes": ["CLOUD_BLOCKED"]}

    codes = []
    if reach == "overhead":
        codes.append("AURORA_OVERHEAD")
    elif reach == "horizon":
        codes.append("AURORA_HORIZON_ONLY")
    if cloud == "mixed":
        codes.append("CLOUD_MIXED")
    if urban and reach == "horizon":
        codes.append("LIGHT_POLLUTION")
    if bright_moon and reach == "horizon":
        codes.append("MOON_BRIGHT")
    if not is_near:
        codes.append("FORECAST_FAR")

    can_go = (
        reach in ("overhead", "horizon")
        and not (reach == "horizon" and (urban or bright_moon))
        and cloud == "clear"
        and (is_near or (has_dossier and zone == "oval"))
    )
    if can_go:
        if not codes:
            codes = ["NONE"]
        return {"skip": False, "status": "GO", "aurora_reach": reach, "cloud_block": cloud, "source": source, "codes": codes}

    if not codes:
        codes = ["FORECAST_FAR"] if not is_near else ["AURORA_HORIZON_ONLY"]
    return {"skip": False, "status": "MAYBE", "aurora_reach": reach, "cloud_block": cloud, "source": source, "codes": codes}


def demote_conf(base: str, cuts: list[bool], floors: list[str]) -> str:
    order = ["high", "medium", "low"]
    i = 0
    for cut, floor in zip(cuts, floors):
        if cut:
            i = max(i, order.index(floor))
    return order[i]


def rollup(windows: list[dict], now_local: datetime) -> dict:
    live = [w for w in windows if w["end"] > now_local]
    scored = [w for w in live if not w.get("skip")]
    if not scored:
        return {
            "status": "NO",
            "confidence": "high",
            "best_window": None,
            "main_obstacle": "NEVER_DARK",
            "reason_codes": ["NEVER_DARK"],
        }

    statuses = [w["status"] for w in scored]
    all_none = all("AURORA_NO_REACH" in w.get("codes", []) for w in scored)
    has_unknown = "UNKNOWN" in statuses
    has_go = "GO" in statuses
    has_maybe = "MAYBE" in statuses

    if (not has_go) and has_unknown and (not all_none):
        status = "UNKNOWN"
    elif has_go:
        status = "GO"
    elif has_maybe:
        status = "MAYBE"
    else:
        status = "NO"

    # longest consecutive target
    target = "GO" if has_go else ("MAYBE" if has_maybe else None)
    best = None
    if target:
        run = []
        best_run = []
        for w in scored:
            if w["status"] == target:
                run.append(w)
                if len(run) > len(best_run):
                    best_run = list(run)
            else:
                run = []
        if best_run:
            best = {"start": best_run[0]["start"], "end": best_run[-1]["end"]}

    # main obstacle
    if status == "GO":
        extra = [c for w in scored if w["status"] == "GO" for c in w["codes"] if c not in ("NONE", "AURORA_OVERHEAD")]
        main = extra[0] if extra else "NONE"
    elif status == "MAYBE":
        c = Counter(code for w in scored if w["status"] == "MAYBE" for code in w["codes"])
        main = c.most_common(1)[0][0] if c else "FORECAST_FAR"
    elif status == "UNKNOWN":
        main = "DATA_MISSING_AURORA"
    else:
        codes = [c for w in scored for c in w["codes"]]
        if "AURORA_NO_REACH" in codes:
            main = "AURORA_NO_REACH"
        elif "CLOUD_BLOCKED" in codes:
            main = "CLOUD_BLOCKED"
        else:
            main = "NEVER_DARK"

    # confidence: NO from a clear gate stays high
    conf = "high"
    if status != "NO":
        if any(w.get("source") == "kp_forecast" for w in scored):
            conf = "medium"
        if any("DATA_MISSING" in c for w in scored for c in w.get("codes", [])):
            conf = "low"
        if best and (best["start"] - now_local) > timedelta(hours=6):
            conf = "low"
    elif any(w["status"] == "UNKNOWN" for w in scored):
        conf = "low"

    reasons = []
    for w in scored:
        for c in w.get("codes", []):
            if c not in reasons:
                reasons.append(c)
    if main not in reasons:
        reasons.insert(0, main)

    return {
        "status": status,
        "confidence": conf,
        "best_window": best,
        "main_obstacle": main,
        "reason_codes": reasons[:8],
    }


def apply_midlat_confidence(conf: str, zone: str | None, windows: list, now_local: datetime) -> str:
    order = ["high", "medium", "low"]
    i = order.index(conf)
    far = [w for w in windows if (not w.get("skip")) and w.get("source") in ("kp_forecast", "kp") and w["end"] > now_local]
    if far and zone in ("midlatitude_event", "sub_oval", "rare"):
        i = max(i, order.index("low"))
    return order[i]


# --- point / location ------------------------------------------------------

def night_slots(tz: ZoneInfo, now_utc: datetime, lat: float, lon: float) -> list[datetime]:
    """30-min midpoints for the current remaining night, or the next night if this one is over / never dark enough."""
    now_local = now_utc.astimezone(tz)
    t0 = now_local.replace(second=0, microsecond=0)
    t0 -= timedelta(minutes=t0.minute % 30)
    samples: list[tuple[datetime, float]] = []
    for i in range(96):  # 48h
        tt = t0 + timedelta(minutes=30 * i)
        samples.append((tt, sun_altitude(lat, lon, tt)))
    groups: list[list[datetime]] = []
    cur: list[datetime] = []
    for tt, alt in samples:
        if alt <= 0:
            cur.append(tt)
        elif cur:
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    if not groups:
        return []

    def has_dark(group: list[datetime]) -> bool:
        return any(sun_altitude(lat, lon, m) <= -12 for m in group if m + timedelta(minutes=15) > now_local)

    # prefer current/remaining night if it still has nautical-dark slots
    for g in groups:
        if g[-1] + timedelta(minutes=15) <= now_local:
            continue
        if has_dark(g):
            return [m for m in g if m + timedelta(minutes=15) > now_local]
    # polar-ish: no nautical dark in the next 48h
    return []


def snapshot_point(
    point: dict,
    loc: dict,
    now_utc: datetime,
    ovation: dict | None,
    kp_series: list,
    clouds: dict | None,
    ovation_ok: bool,
    ovation_stale_45: bool,
    ovation_stale_90: bool,
) -> dict:
    lat, lon = point["lat"], point["lng"]
    tz = ZoneInfo(loc["timezone"])
    now_local = now_utc.astimezone(tz)
    urban = loc["location_type"] == "city" or point.get("role") == "population"
    has_dossier = True  # wave1 points always have dossier
    zone = loc.get("aurora_zone")
    mids = night_slots(tz, now_utc, lat, lon)
    fcst = ovation["fcst"] if ovation else None

    windows = []
    for mid in mids:
        start = mid - timedelta(minutes=15)
        end = mid + timedelta(minutes=15)
        sun = sun_altitude(lat, lon, mid)
        illum = moon_illumination(mid)
        malt = moon_altitude(lat, lon, mid)
        bright_moon = malt > 10 and illum > 0.70
        is_near = bool(fcst) and mid.astimezone(timezone.utc) <= fcst + timedelta(minutes=30)
        kp, kp_kind = kp_at(kp_series, mid.astimezone(timezone.utc))
        cloud, _blk = cloud_block_at(clouds, mid)
        w = classify_window(
            sun_alt=sun,
            is_near=is_near,
            ovation_ok=ovation_ok,
            ovation_stale_90=ovation_stale_90,
            grid=ovation["grid"] if ovation else None,
            lat=lat,
            lon=lon,
            kp=kp,
            kp_kind=kp_kind,
            has_dossier=has_dossier,
            horizon_kp=loc.get("typical_kp_horizon"),
            overhead_kp=loc.get("typical_kp_overhead"),
            zone=zone,
            cloud=cloud,
            urban=urban,
            bright_moon=bright_moon,
        )
        windows.append(
            {
                "start": start,
                "end": end,
                "mid": mid,
                "skip": w["skip"],
                "status": w["status"],
                "aurora_reach": w["aurora_reach"],
                "cloud_block": w["cloud_block"],
                "source": w["source"],
                "codes": w["codes"],
                "sun_alt": round(sun, 1),
            }
        )

    summary = rollup(windows, now_local)
    if summary["status"] != "NO":
        summary["confidence"] = apply_midlat_confidence(summary["confidence"], zone, windows, now_local)
        if ovation_stale_45 and summary["confidence"] == "high":
            summary["confidence"] = "medium"

    live = [w for w in windows if w["end"] > now_local]
    return {
        "id": point["id"],
        "name": point["name"],
        "role": point.get("role"),
        "urban": urban,
        "status": summary["status"],
        "confidence": summary["confidence"],
        "aurora_reach": next((w["aurora_reach"] for w in live if not w.get("skip") and w.get("aurora_reach")), None),
        "cloud_block": next((w["cloud_block"] for w in live if not w.get("skip") and w.get("cloud_block")), None),
        "best_window": summary["best_window"],
        "main_obstacle": summary["main_obstacle"],
        "reason_codes": summary["reason_codes"],
        "windows": live,
    }


def serialize_window(w: dict) -> dict:
    return {
        "start": w["start"].isoformat(),
        "end": w["end"].isoformat(),
        "skip": w["skip"],
        "status": w["status"],
        "aurora_reach": w["aurora_reach"],
        "cloud_block": w["cloud_block"],
        "source": w["source"],
        "codes": w["codes"],
    }


def snapshot_location(loc: dict, now_utc: datetime, ovation, kp_series, cloud_by_key, ovation_ok, s45, s90) -> dict:
    tz = ZoneInfo(loc["timezone"])
    now_local = now_utc.astimezone(tz)
    points_out = []
    for p in loc["sample_points"]:
        key = f"{p['lat']:.3f},{p['lng']:.3f}"
        clouds = cloud_by_key.get(key)
        points_out.append(
            snapshot_point(p, loc, now_utc, ovation, kp_series, clouds, ovation_ok, s45, s90)
        )

    headline_id = loc["primary_verdict_point"]
    head = next(p for p in points_out if p["id"] == headline_id)

    generated = now_utc
    valid = generated + timedelta(minutes=25)
    if ovation and ovation.get("fcst"):
        cap = ovation["fcst"] + timedelta(minutes=40)
        if valid > cap:
            valid = cap

    bw = head["best_window"]
    sentence = REASON_COPY.get(head["main_obstacle"], REASON_COPY["NONE"]).format(place=loc["name"])
    qualifier = head["name"]
    return {
        "location_slug": loc["slug"],
        "headline_point_id": headline_id,
        "headline_point_name": qualifier,
        "generated_at": generated.isoformat(),
        "valid_until": valid.isoformat(),
        "status": head["status"],
        "confidence": head["confidence"],
        "best_window_start": bw["start"].isoformat() if bw else None,
        "best_window_end": bw["end"].isoformat() if bw else None,
        "main_obstacle": head["main_obstacle"],
        "main_obstacle_text": sentence,
        "reason_codes": head["reason_codes"],
        "look_toward": "north",
        "answer_sentence": _answer(loc, head, now_local),
        "sources": {
            "ovation_obs": ovation["obs"].isoformat() if ovation and ovation.get("obs") else None,
            "ovation_fcst": ovation["fcst"].isoformat() if ovation and ovation.get("fcst") else None,
            "ovation_ok": ovation_ok,
        },
        "points": [
            {
                "id": p["id"],
                "name": p["name"],
                "status": p["status"],
                "confidence": p["confidence"],
                "aurora_reach": p["aurora_reach"],
                "cloud_block": p["cloud_block"],
                "urban": p["urban"],
                "main_obstacle": p["main_obstacle"],
            }
            for p in points_out
        ],
        "windows": [serialize_window(w) for w in head["windows"]],
        "seo_indexable": False,
    }


def _answer(loc: dict, head: dict, now_local: datetime) -> str:
    place = loc["name"]
    extra = ""
    if loc["location_type"] == "state":
        extra = f" ({head['name']} area)"
    st = head["status"]
    bw = head["best_window"]
    win = ""
    if bw:
        win = f" Best window {bw['start'].strftime('%-I:%M %p')}–{bw['end'].strftime('%-I:%M %p')} {now_local.tzname()}."
    issue = REASON_COPY.get(head["main_obstacle"], "").format(place=place)
    if st == "GO":
        return f"GO{extra}.{win} {issue}".strip()
    if st == "MAYBE":
        return f"MAYBE in {place}{extra}.{win} Main issue: {issue}"
    if st == "NO":
        return f"NO{extra}. Not worth a special trip tonight. {issue}"
    return f"UNKNOWN{extra}. We are not guessing. {issue}"


def fmt_table(snaps: list[dict]) -> str:
    lines = [f"{'slug':16} {'pt':16} {'st':8} {'conf':7} {'obstacle':22} window"]
    for s in snaps:
        win = "—"
        if s["best_window_start"]:
            a = datetime.fromisoformat(s["best_window_start"])
            b = datetime.fromisoformat(s["best_window_end"])
            win = f"{a.strftime('%-I:%M%p')}–{b.strftime('%-I:%M%p')}"
        lines.append(
            f"{s['location_slug']:16} {s['headline_point_id']:16} {s['status']:8} {s['confidence']:7} {s['main_obstacle']:22} {win}"
        )
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", help="only this location")
    ap.add_argument("--offline", action="store_true")
    args = ap.parse_args()

    now = datetime.now(timezone.utc)
    dossier = json.loads(DOSSIER.read_text())
    locs = dossier["locations"]
    if args.slug:
        locs = [l for l in locs if l["slug"] == args.slug]
        if not locs:
            sys.exit(f"unknown slug {args.slug}")

    ovation_raw = None
    kp_series = []
    try:
        ovation_raw = _get(OVATION_URL, "ovation.json", 8) if not args.offline else json.loads((CACHE / "ovation.json").read_text())
        kp_series = _get(KP_URL, "kp.json", 15) if not args.offline else json.loads((CACHE / "kp.json").read_text())
    except Exception as e:
        print(f"aurora fetch failed: {e}", file=sys.stderr)

    ovation = parse_ovation(ovation_raw) if ovation_raw else None
    ovation_ok = False
    s45 = s90 = True
    if ovation and ovation.get("obs"):
        age = now - ovation["obs"]
        s45 = age > timedelta(minutes=45)
        s90 = age > timedelta(minutes=90)
        ovation_ok = not s90

    cloud_by_key = {}
    for loc in locs:
        for p in loc["sample_points"]:
            key = f"{p['lat']:.3f},{p['lng']:.3f}"
            if key in cloud_by_key:
                continue
            try:
                cloud_by_key[key] = fetch_clouds(p["lat"], p["lng"], loc["timezone"], args.offline)
            except Exception as e:
                print(f"cloud fail {key}: {e}", file=sys.stderr)
                cloud_by_key[key] = None

    OUT.mkdir(parents=True, exist_ok=True)
    snaps = []
    for loc in locs:
        snap = snapshot_location(loc, now, ovation, kp_series, cloud_by_key, ovation_ok, s45, s90)
        snaps.append(snap)
        (OUT / f"{loc['slug']}.json").write_text(json.dumps(snap, ensure_ascii=False, indent=2) + "\n")

    bundle = {
        "generated_at": now.isoformat(),
        "ovation_ok": ovation_ok,
        "seo_indexable": False,
        "locations": snaps,
    }
    (OUT / "latest.json").write_text(json.dumps(bundle, ensure_ascii=False, indent=2) + "\n")
    print(fmt_table(snaps))
    print(f"\nwrote {len(snaps)} snapshots → {OUT}")


if __name__ == "__main__":
    main()
