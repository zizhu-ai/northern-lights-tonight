#!/usr/bin/env python3
"""Point city searches at new state forecast slugs. Keep NYC ZIP → /view."""
from __future__ import annotations

import json
from pathlib import Path

PATH = Path(__file__).resolve().parents[1] / "data" / "us-places.json"


def state_place(name, lat, lng, tz, slug, keys, zips):
    return {
        "name": name,
        "lat": lat,
        "lng": lng,
        "tz": tz,
        "slug": slug,
        "keys": keys,
        "zips": zips,
    }


def main():
    data = json.loads(PATH.read_text())
    aliases = data["aliases"]
    places = data["places"]

    extra_aliases = [
        {
            "keys": [
                "new york",
                "ny",
                "new york state",
                "nyc",
                "new york city",
                "buffalo",
                "buffalo ny",
                "albany",
                "albany ny",
                "syracuse",
                "rochester ny",
            ],
            "slug": "new-york",
        },
        {
            "keys": [
                "philadelphia",
                "philly",
                "philadelphia pa",
                "pittsburgh",
                "pittsburgh pa",
                "erie pa",
                "pennsylvania",
                "pa",
            ],
            "slug": "pennsylvania",
        },
        {
            "keys": ["vermont", "vt", "burlington vt", "burlington"],
            "slug": "vermont",
        },
        {
            "keys": [
                "new hampshire",
                "nh",
                "manchester nh",
                "concord nh",
            ],
            "slug": "new-hampshire",
        },
        {
            "keys": ["montana", "mt", "billings", "billings mt", "missoula"],
            "slug": "montana",
        },
        {
            "keys": ["idaho", "id", "boise", "boise id"],
            "slug": "idaho",
        },
        {
            "keys": ["north dakota", "nd", "fargo", "fargo nd", "bismarck", "minot"],
            "slug": "north-dakota",
        },
        {
            "keys": [
                "south dakota",
                "sd",
                "sioux falls",
                "rapid city",
                "aberdeen sd",
            ],
            "slug": "south-dakota",
        },
        {
            "keys": [
                "iowa",
                "ia",
                "des moines",
                "des moines ia",
                "cedar rapids",
                "iowa city",
            ],
            "slug": "iowa",
        },
        {
            "keys": ["fort wayne", "fort wayne in", "madison wi"],
            "slug": "indiana",
        },
        {
            "keys": ["madison", "madison wi"],
            "slug": "wisconsin",
        },
        {
            "keys": ["cleveland", "cleveland oh"],
            "slug": "ohio",
        },
    ]

    existing_alias_slugs = {(a["slug"], tuple(a["keys"])) for a in aliases}
    for alias in extra_aliases:
        key = (alias["slug"], tuple(alias["keys"]))
        if key not in existing_alias_slugs:
            aliases.append(alias)

    # Keep ZIP 10001 on the NYC pin → /view. Remove text keys that would steal
    # "new york" / "nyc" from the state page. Other city pins gain the state
    # slug so searches stay on the indexed state URL, not a new city page.
    city_slugs = {
        "Philadelphia, PA": "pennsylvania",
        "Pittsburgh, PA": "pennsylvania",
        "Buffalo, NY": "new-york",
        "Rochester, NY": "new-york",
        "Albany, NY": "new-york",
        "Burlington, VT": "vermont",
        "Billings, MT": "montana",
        "Boise, ID": "idaho",
        "Fargo, ND": "north-dakota",
        "Sioux Falls, SD": "south-dakota",
        "Des Moines, IA": "iowa",
        "Iowa City, IA": "iowa",
        "Cedar Rapids, IA": "iowa",
        "Madison, WI": "wisconsin",
        "Cleveland, OH": "ohio",
        "Fort Wayne, IN": "indiana",
        "Rapid City, SD": "south-dakota",
    }
    for place in places:
        if place.get("name") == "New York, NY":
            # ZIP 10001 still resolves this pin to /view. Do not keep a
            # "new york …" key: keyMatches is prefix-based and would steal
            # the state-page alias.
            place["keys"] = []
            place["slug"] = None
            continue
        mapped = city_slugs.get(place.get("name"))
        if mapped:
            place["slug"] = mapped

    new_places = [
        state_place(
            "New York",
            44.6995,
            -73.4529,
            "America/New_York",
            "new-york",
            ["new york state", "ny"],
            [],
        ),
        state_place(
            "Pennsylvania",
            42.1292,
            -80.0851,
            "America/New_York",
            "pennsylvania",
            ["pennsylvania", "pa"],
            [],
        ),
        state_place(
            "Vermont",
            44.9364,
            -72.2051,
            "America/New_York",
            "vermont",
            ["vermont", "vt"],
            [],
        ),
        state_place(
            "New Hampshire",
            45.0512,
            -71.3914,
            "America/New_York",
            "new-hampshire",
            ["new hampshire", "nh"],
            [],
        ),
        state_place(
            "Montana",
            48.1969,
            -106.6367,
            "America/Denver",
            "montana",
            ["montana", "mt"],
            [],
        ),
        state_place(
            "Idaho",
            48.2766,
            -116.5533,
            "America/Los_Angeles",
            "idaho",
            ["idaho", "id"],
            [],
        ),
        state_place(
            "North Dakota",
            48.2325,
            -101.2963,
            "America/Chicago",
            "north-dakota",
            ["north dakota", "nd"],
            [],
        ),
        state_place(
            "South Dakota",
            45.4647,
            -98.4865,
            "America/Chicago",
            "south-dakota",
            ["south dakota", "sd"],
            [],
        ),
        state_place(
            "Iowa",
            43.1536,
            -93.201,
            "America/Chicago",
            "iowa",
            ["iowa", "ia"],
            [],
        ),
    ]
    have_names = {p.get("name") for p in places}
    for place in new_places:
        if place["name"] not in have_names:
            places.append(place)

    # madison alias was added twice-ish; that's ok (uniquePlaces).
    # Fix the mistaken fort wayne → indiana plus madison wi on indiana.
    for alias in aliases:
        if alias["slug"] == "indiana" and "madison wi" in alias["keys"]:
            alias["keys"] = [k for k in alias["keys"] if k != "madison wi"]

    PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {PATH} aliases={len(data['aliases'])} places={len(data['places'])}")


if __name__ == "__main__":
    main()
