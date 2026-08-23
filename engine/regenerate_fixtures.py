#!/usr/bin/env python3
"""Initialize fixed raw fixtures once, or regenerate expected JSON from them."""
from __future__ import annotations

import argparse
import json
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from snapshot import compute_bundle


ENGINE = Path(__file__).resolve().parent
ROOT = ENGINE.parent
FIXTURES = ENGINE / "fixtures"
CACHE = ENGINE / ".cache"
DOSSIER_SOURCE = ROOT / "地点档案" / "wave1.json"

CASES = {
    "happy_fresh": "2026-08-21T03:10:00+00:00",
    "cross_midnight": "2026-08-21T04:40:00+00:00",
    "dst_spring_forward": "2026-03-08T06:40:00+00:00",
    "dst_fall_back": "2026-11-01T05:40:00+00:00",
    "best_window_elapsed": "2026-08-22T18:00:00+00:00",
    "ovation_missing": "2026-08-21T03:10:00+00:00",
    "kp_missing": "2026-08-21T03:10:00+00:00",
    "aurora_both_missing": "2026-08-21T03:10:00+00:00",
    "cloud_partial_missing": "2026-08-21T03:10:00+00:00",
    "cloud_all_missing": "2026-08-21T03:10:00+00:00",
    "ovation_age_46m": "2026-08-21T03:45:00+00:00",
    "ovation_age_91m": "2026-08-21T04:30:00+00:00",
    "kp_slots_missing": "2026-08-21T03:10:00+00:00",
    "malformed_ovation": "2026-08-21T03:10:00+00:00",
}


def _dump(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def _load(path: Path):
    return json.loads(path.read_text())


def _point_key(location: dict, point: dict) -> str:
    return f"{location['slug']}/{point['id']}"


def _cached_clouds(dossiers: dict) -> dict:
    result = {}
    for location in dossiers["locations"]:
        for point in location["sample_points"]:
            name = f"om_{round(point['lat'], 3)}_{round(point['lng'], 3)}.json"
            result[_point_key(location, point)] = _load(CACHE / name)
    return result


def _synthetic_clouds(dossiers: dict, now: datetime, value: int = 10) -> dict:
    result = {}
    for location in dossiers["locations"]:
        local = now.astimezone(ZoneInfo(location["timezone"]))
        start = (local - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        times = [(start + timedelta(hours=hour)).strftime("%Y-%m-%dT%H:%M") for hour in range(72)]
        for point in location["sample_points"]:
            values = [value] * len(times)
            result[_point_key(location, point)] = {
                "latitude": point["lat"],
                "longitude": point["lng"],
                "timezone": location["timezone"],
                "hourly": {
                    "time": times,
                    "cloud_cover": values,
                    "cloud_cover_low": values,
                    "cloud_cover_mid": values,
                    "cloud_cover_high": values,
                },
            }
    return result


def _synthetic_kp(now: datetime) -> list:
    cursor = (now - timedelta(hours=24)).replace(minute=0, second=0, microsecond=0)
    cursor -= timedelta(hours=cursor.hour % 3)
    return [
        {
            "time_tag": (cursor + timedelta(hours=3 * index)).strftime("%Y-%m-%dT%H:%M:%S"),
            "kp": 6.0,
            "observed": "predicted",
            "noaa_scale": None,
        }
        for index in range(25)
    ]


def _ovation_for(base: dict, now: datetime) -> dict:
    result = deepcopy(base)
    result["Observation Time"] = (now - timedelta(minutes=20)).strftime("%Y-%m-%dT%H:%M:%SZ")
    result["Forecast Time"] = (now + timedelta(minutes=35)).strftime("%Y-%m-%dT%H:%M:%SZ")
    return result


def initialize_raw() -> None:
    if FIXTURES.exists():
        raise SystemExit("engine/fixtures already exists; fixed raw fixtures were not overwritten")

    dossiers = _load(DOSSIER_SOURCE)
    base_ovation = _load(CACHE / "ovation.json")
    base_kp = _load(CACHE / "kp.json")
    base_clouds = _cached_clouds(dossiers)
    _dump(FIXTURES / "dossiers.json", dossiers)

    for case_id, now_text in CASES.items():
        now = datetime.fromisoformat(now_text).astimezone(timezone.utc)
        ovation = _ovation_for(base_ovation, now)
        kp = _synthetic_kp(now)
        clouds = _synthetic_clouds(dossiers, now)

        if case_id in {
            "happy_fresh",
            "best_window_elapsed",
            "cross_midnight",
            "ovation_missing",
            "kp_missing",
            "aurora_both_missing",
            "cloud_partial_missing",
            "cloud_all_missing",
            "ovation_age_46m",
            "ovation_age_91m",
            "kp_slots_missing",
            "malformed_ovation",
        }:
            ovation, kp, clouds = deepcopy(base_ovation), deepcopy(base_kp), deepcopy(base_clouds)

        if case_id == "ovation_missing":
            ovation = None
        elif case_id == "kp_missing":
            kp = None
        elif case_id == "aurora_both_missing":
            ovation, kp = None, None
        elif case_id == "cloud_partial_missing":
            for index, key in enumerate(clouds):
                if index % 3 == 0:
                    clouds[key] = None
        elif case_id == "cloud_all_missing":
            clouds = {key: None for key in clouds}
        elif case_id == "kp_slots_missing":
            kp = [
                {
                    "time_tag": "2026-08-25T00:00:00",
                    "kp": 9.0,
                    "observed": "predicted",
                    "noaa_scale": None,
                }
            ]
        elif case_id == "malformed_ovation":
            ovation = {"Observation Time": "not-a-time", "Forecast Time": "2026-08-21T03:54:00Z"}

        case = FIXTURES / case_id
        _dump(case / "case.json", {"id": case_id, "now": now_text})
        _dump(case / "raw" / "ovation.json", ovation)
        _dump(case / "raw" / "kp.json", kp)
        _dump(case / "raw" / "clouds.json", clouds)

def regenerate_expected() -> None:
    dossiers = _load(FIXTURES / "dossiers.json")
    for case_id in CASES:
        case = FIXTURES / case_id
        now = datetime.fromisoformat(_load(case / "case.json")["now"])
        bundle = compute_bundle(
            now,
            _load(case / "raw" / "ovation.json"),
            _load(case / "raw" / "kp.json"),
            _load(case / "raw" / "clouds.json"),
            dossiers,
        )
        expected = case / "expected"
        _dump(expected / "latest.json", bundle)
        for snapshot in bundle["locations"]:
            _dump(expected / f"{snapshot['location_slug']}.json", snapshot)
        print(f"generated {case_id}: {len(bundle['locations'])} locations")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--initialize",
        action="store_true",
        help="one-time creation of fixed raw fixtures; refuses to overwrite them",
    )
    args = parser.parse_args()
    if args.initialize:
        initialize_raw()
    regenerate_expected()


if __name__ == "__main__":
    main()
