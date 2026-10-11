#!/usr/bin/env python3
"""Append wave-2 state dossiers and Fort Wayne. One-shot editor, not runtime."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "地点档案" / "wave1.json"


def point(id, name, lat, lng, role, magnetic_latitude):
    return {
        "id": id,
        "name": name,
        "lat": lat,
        "lng": lng,
        "role": role,
        "magnetic_latitude": magnetic_latitude,
    }


def loc(**kwargs):
    kwargs.setdefault("index_wave", 2)
    kwargs.setdefault("country", "US")
    kwargs.setdefault("viewing_direction", "north")
    kwargs.setdefault("seo_indexable", False)
    kwargs.setdefault("status", "dossier_filled")
    kwargs.setdefault("parent_slug", None)
    kwargs.setdefault("page_template", "tonight_local")
    kwargs.setdefault("short_summer_nights", False)
    kwargs.setdefault("cluster_volume", 0)
    kwargs.setdefault("weighted_kd", 0)
    kwargs.setdefault("cannibalization_pair", None)
    return kwargs


NEW = [
    loc(
        slug="new-york",
        name="New York",
        location_type="state",
        timezone="America/New_York",
        latitude=44.6995,
        longitude=-73.4529,
        primary_verdict_point="plattsburgh",
        sample_points=[
            point("plattsburgh", "Plattsburgh", 44.6995, -73.4529, "verdict_north", 54.0),
            point("buffalo", "Buffalo", 42.8864, -78.8784, "dark_sky", 52.2),
            point("albany", "Albany", 42.6526, -73.7562, "population", 52.0),
            point("new-york-city", "New York City", 40.7128, -74.006, "population", 50.1),
        ],
        magnetic_latitude=54.0,
        aurora_zone="sub_oval",
        typical_kp_horizon=5,
        typical_kp_overhead=7,
        primary_keyword="northern lights tonight new york",
        variant_keywords=[
            "aurora borealis new york",
            "new york northern lights",
            "northern lights tonight nyc",
            "northern lights buffalo",
        ],
        nearby_slugs=["pennsylvania", "massachusetts", "vermont"],
        light_pollution_note="New York City–Long Island is a severe light dome. Albany and the Hudson corridor are still urban. The North Country (Plattsburgh, the Adirondacks) and a dark Lake Ontario shore near Buffalo are the realistic in-state options.",
        leave_city_advice="Leave New York City. Drive north toward the Adirondacks or the Canadian border, not out onto Long Island. A North Country dark horizon beats any borough rooftop.",
        north_south_split="Northern New York is a sub-oval, event-capable latitude. NYC and Long Island are mid-latitude and extreme-event only. A maybe in Plattsburgh is usually a no in Manhattan.",
        local_obstacles="NYC skyglow; Adirondack trees closing the north horizon; lake-effect cloud off Ontario and Erie; humid summer haze downstate.",
        best_months_note="Longer nights September–March. The North Country stays useful later into spring than the city. Summer twilight is not polar, but downstate haze is a real limiter.",
        local_faqs=[
            {
                "q": "Should I go to Canada instead of staying in New York?",
                "a": "If you can cross and continue north, Quebec and eastern Ontario are closer to the oval than NYC. On a marginal night, north beats staying in the metro.",
            },
        ],
    ),
    loc(
        slug="pennsylvania",
        name="Pennsylvania",
        location_type="state",
        timezone="America/New_York",
        latitude=42.1292,
        longitude=-80.0851,
        primary_verdict_point="erie",
        sample_points=[
            point("erie", "Erie", 42.1292, -80.0851, "verdict_north", 51.4),
            point("pittsburgh", "Pittsburgh", 40.4406, -79.9959, "dark_sky", 49.7),
            point("philadelphia", "Philadelphia", 39.9526, -75.1652, "population", 49.3),
        ],
        magnetic_latitude=51.4,
        aurora_zone="midlatitude_event",
        typical_kp_horizon=6,
        typical_kp_overhead=8,
        primary_keyword="northern lights tonight pennsylvania",
        variant_keywords=[
            "aurora borealis pennsylvania",
            "pennsylvania northern lights",
            "northern lights philadelphia",
            "northern lights pittsburgh",
        ],
        nearby_slugs=["ohio", "new-york"],
        light_pollution_note="Philadelphia and Pittsburgh are bright urban basins. Erie can be slightly better if you look north over Lake Erie, but the city glow still dominates near town.",
        leave_city_advice="Leave Philadelphia. Northern Pennsylvania near Lake Erie is the realistic part of the state. Do not treat a Pittsburgh ridge as dark sky if the northern horizon is still orange.",
        north_south_split="Erie and the northern tier are meaningfully closer to the oval than Philadelphia. Southern and southeastern Pennsylvania are extreme-event locations only.",
        local_obstacles="Lake-effect cloud along Erie; Appalachian ridges blocking a north view; two large metro light domes; humid haze.",
        best_months_note="September–March brings longer nights. Lake-effect overcast can ruin an otherwise usable winter storm along the snow belt.",
        local_faqs=[
            {
                "q": "Is looking over Lake Erie enough in Pennsylvania?",
                "a": "A north-facing lake horizon removes some ground lights in that direction. It does not cancel Erie’s skyglow or a socked-in snow band.",
            },
        ],
    ),
    loc(
        slug="vermont",
        name="Vermont",
        location_type="state",
        timezone="America/New_York",
        latitude=44.9364,
        longitude=-72.2051,
        primary_verdict_point="newport",
        sample_points=[
            point("newport", "Newport", 44.9364, -72.2051, "verdict_north", 54.3),
            point("burlington", "Burlington", 44.4759, -73.2121, "population", 53.8),
            point("rutland", "Rutland", 43.6106, -72.9726, "dark_sky", 53.0),
        ],
        magnetic_latitude=54.3,
        aurora_zone="sub_oval",
        typical_kp_horizon=5,
        typical_kp_overhead=7,
        primary_keyword="northern lights tonight vermont",
        variant_keywords=[
            "aurora borealis vermont",
            "vermont northern lights",
            "northern lights burlington",
        ],
        nearby_slugs=["new-hampshire", "maine", "new-york"],
        light_pollution_note="Vermont is dark by Lower 48 standards. Burlington is the main in-state light island; the Northeast Kingdom is darker than the Champlain shore.",
        leave_city_advice="Leave Burlington. Go north toward the Northeast Kingdom or find a dark north horizon away from the lake-shore towns, not a downtown waterfront.",
        north_south_split="The Northeast Kingdom is the best in-state latitude. Southern Vermont is only a little worse magnetically but has more trees and more village glow.",
        local_obstacles="Tree-closed north horizons; lake cloud off Champlain; winter travel on rural roads; Burlington glow.",
        best_months_note="Long nights September–March. Northern Vermont can work on weaker storms than Ohio or Pennsylvania.",
        local_faqs=[
            {
                "q": "Are the Green Mountains enough?",
                "a": "Only with a dark, unobstructed north view. A south-facing slope or a summit above a valley’s lights does not help.",
            },
        ],
    ),
    loc(
        slug="new-hampshire",
        name="New Hampshire",
        location_type="state",
        timezone="America/New_York",
        latitude=45.0512,
        longitude=-71.3914,
        primary_verdict_point="pittsburg",
        sample_points=[
            point("pittsburg", "Pittsburg", 45.0512, -71.3914, "verdict_north", 54.4),
            point("north-conway", "North Conway", 44.0537, -71.1284, "dark_sky", 53.4),
            point("manchester", "Manchester", 42.9956, -71.4548, "population", 52.3),
        ],
        magnetic_latitude=54.4,
        aurora_zone="sub_oval",
        typical_kp_horizon=5,
        typical_kp_overhead=7,
        primary_keyword="northern lights tonight new hampshire",
        variant_keywords=[
            "aurora borealis new hampshire",
            "new hampshire northern lights",
            "northern lights manchester nh",
        ],
        nearby_slugs=["vermont", "maine", "massachusetts"],
        light_pollution_note="Manchester–Nashua shares Boston-adjacent glow. The White Mountains and the far north (Pittsburg, the Connecticut Lakes) are the dark part of the state.",
        leave_city_advice="Leave Manchester. North toward the White Mountains or the Canadian border is the correct direction, not the seacoast suburbs.",
        north_south_split="Far-north New Hampshire is a sub-oval latitude similar to northern Vermont. The seacoast and Manchester are event-heavier and brighter.",
        local_obstacles="Mountain weather socking in peaks; trees closing the north view; Boston-adjacent glow in the south; winter travel in the north.",
        best_months_note="September–March. The far north stays useful later into spring than Massachusetts.",
        local_faqs=[
            {
                "q": "White Mountains or farther north?",
                "a": "North Conway is already a step north of Manchester. Pittsburg and the Connecticut Lakes are darker and slightly better magnetically.",
            },
        ],
    ),
    loc(
        slug="montana",
        name="Montana",
        location_type="state",
        timezone="America/Denver",
        latitude=48.1969,
        longitude=-106.6367,
        primary_verdict_point="glasgow",
        sample_points=[
            point("glasgow", "Glasgow", 48.1969, -106.6367, "verdict_north", 55.6),
            point("kalispell", "Kalispell", 48.1919, -114.3168, "dark_sky", 54.7),
            point("billings", "Billings", 45.7833, -108.5007, "population", 53.0),
        ],
        magnetic_latitude=55.6,
        aurora_zone="sub_oval",
        typical_kp_horizon=4,
        typical_kp_overhead=6,
        primary_keyword="northern lights tonight montana",
        variant_keywords=[
            "aurora borealis montana",
            "montana northern lights",
            "northern lights billings",
        ],
        nearby_slugs=["north-dakota", "idaho"],
        light_pollution_note="Billings is the large in-state dome. The Hi-Line (Glasgow, the northern plains) and the Flathead / Whitefish country are much darker; mountains still block a north view if you sit on the wrong slope.",
        leave_city_advice="Leave Billings. Go north onto the plains with a clear north horizon. Do not drive south expecting a better oval.",
        north_south_split="The northern plains are the realistic aurora latitude. Southern Montana is only a little worse magnetically but is the wrong direction when a storm is marginal.",
        local_obstacles="Mountain weather in the west; wind and blowing snow on the Hi-Line; Billings glow; ridges blocking north.",
        best_months_note="Long, dark nights September–March. Dry air on the plains is an advantage versus the Midwest when a storm does arrive.",
        local_faqs=[
            {
                "q": "Are the mountains better than the plains?",
                "a": "Only if the north horizon is open and dark. A pretty peak facing south is worse than a flat Hi-Line field looking north.",
            },
        ],
    ),
    loc(
        slug="idaho",
        name="Idaho",
        location_type="state",
        timezone="America/Los_Angeles",
        latitude=48.2766,
        longitude=-116.5533,
        primary_verdict_point="sandpoint",
        sample_points=[
            point("sandpoint", "Sandpoint", 48.2766, -116.5533, "verdict_north", 54.5),
            point("stanley", "Stanley", 44.2157, -114.9374, "dark_sky", 50.7),
            point("boise", "Boise", 43.615, -116.2023, "population", 50.0),
        ],
        magnetic_latitude=54.5,
        aurora_zone="sub_oval",
        typical_kp_horizon=5,
        typical_kp_overhead=7,
        primary_keyword="northern lights tonight idaho",
        variant_keywords=[
            "aurora borealis idaho",
            "idaho northern lights",
            "northern lights boise",
        ],
        nearby_slugs=["montana", "utah", "oregon"],
        light_pollution_note="Boise is the main light island. The Panhandle (Sandpoint) is darker and farther north. The Sawtooth country around Stanley is very dark but magnetically farther from the oval than Sandpoint.",
        leave_city_advice="Leave Boise. North toward the Panhandle is the magnetic upgrade. Do not drive south into the Snake River Plain expecting a better oval.",
        north_south_split="The Panhandle is the realistic aurora latitude. Boise and southern Idaho need a stronger storm. Times on this page use Pacific, matching Sandpoint; southern Idaho is Mountain Time.",
        local_obstacles="Two time zones; Boise glow; mountain weather; trees and ridges blocking north in the central mountains.",
        best_months_note="September–March. The Panhandle can work on weaker storms than Utah or Colorado.",
        local_faqs=[
            {
                "q": "Is Stanley better than Sandpoint because it is darker?",
                "a": "Stanley is darker, but it is magnetically farther from the oval. On a moderate night, north beats a darker southern basin.",
            },
        ],
    ),
    loc(
        slug="north-dakota",
        name="North Dakota",
        location_type="state",
        timezone="America/Chicago",
        latitude=48.2325,
        longitude=-101.2963,
        primary_verdict_point="minot",
        sample_points=[
            point("minot", "Minot", 48.2325, -101.2963, "verdict_north", 56.2),
            point("bismarck", "Bismarck", 46.8083, -100.7837, "dark_sky", 54.8),
            point("fargo", "Fargo", 46.8772, -96.7898, "population", 55.2),
        ],
        magnetic_latitude=56.2,
        aurora_zone="sub_oval",
        typical_kp_horizon=4,
        typical_kp_overhead=6,
        primary_keyword="northern lights tonight north dakota",
        variant_keywords=[
            "aurora borealis north dakota",
            "north dakota northern lights",
            "northern lights fargo",
        ],
        nearby_slugs=["minnesota", "south-dakota", "montana"],
        light_pollution_note="Fargo is the largest glow. Minot and the open northwest are darker. Bismarck is a small capital dome, not a Lower 48 mega-metro.",
        leave_city_advice="Leave Fargo. North and west onto dark prairie with a clear north horizon is the correct move. Do not sit under the interstate glow.",
        north_south_split="The north of the state is among the best Lower 48 latitudes in this set. Fargo is still sub-oval, but the city itself is the wrong place to stand.",
        local_obstacles="Prairie wind and blowing snow; Fargo glow; occasional ice fog; long empty-road winter travel.",
        best_months_note="August–April. Northern North Dakota can work on weaker storms than Iowa or Illinois.",
        local_faqs=[
            {
                "q": "Is North Dakota as good as northern Minnesota?",
                "a": "Magnetically it is in the same conversation. Clouds, wind, and whether you actually leave town still decide the night.",
            },
        ],
    ),
    loc(
        slug="south-dakota",
        name="South Dakota",
        location_type="state",
        timezone="America/Chicago",
        latitude=45.4647,
        longitude=-98.4865,
        primary_verdict_point="aberdeen",
        sample_points=[
            point("aberdeen", "Aberdeen", 45.4647, -98.4865, "verdict_north", 53.7),
            point("rapid-city", "Rapid City", 44.0805, -103.231, "dark_sky", 51.9),
            point("sioux-falls", "Sioux Falls", 43.5446, -96.7311, "population", 51.9),
        ],
        magnetic_latitude=53.7,
        aurora_zone="sub_oval",
        typical_kp_horizon=5,
        typical_kp_overhead=7,
        primary_keyword="northern lights tonight south dakota",
        variant_keywords=[
            "aurora borealis south dakota",
            "south dakota northern lights",
            "northern lights sioux falls",
        ],
        nearby_slugs=["north-dakota", "iowa", "minnesota"],
        light_pollution_note="Sioux Falls is the main eastern dome. Rapid City is a smaller west-side city with dark prairie nearby, but it is Mountain Time and farther from the oval than Aberdeen.",
        leave_city_advice="Leave Sioux Falls. North toward Aberdeen and the state line is the magnetic upgrade. The Black Hills are darker locally but not farther north.",
        north_south_split="The north of the state is the realistic latitude. Sioux Falls is event-heavier. Times on this page use Central; Rapid City is Mountain Time.",
        local_obstacles="Two time zones; Sioux Falls glow; prairie wind; Black Hills ridges blocking a north view if you pick the wrong canyon.",
        best_months_note="September–March. A clear, cold night after a storm beats a hazy warm one.",
        local_faqs=[
            {
                "q": "Black Hills or the northern prairie?",
                "a": "The Hills can be dark, but Aberdeen is farther north. On a marginal night, latitude beats a scenic canyon that faces the wrong way.",
            },
        ],
    ),
    loc(
        slug="iowa",
        name="Iowa",
        location_type="state",
        timezone="America/Chicago",
        latitude=43.1536,
        longitude=-93.201,
        primary_verdict_point="mason-city",
        sample_points=[
            point("mason-city", "Mason City", 43.1536, -93.201, "verdict_north", 51.8),
            point("dubuque", "Dubuque", 42.5006, -90.6648, "dark_sky", 51.3),
            point("des-moines", "Des Moines", 41.5868, -93.625, "population", 50.2),
        ],
        magnetic_latitude=51.8,
        aurora_zone="midlatitude_event",
        typical_kp_horizon=6,
        typical_kp_overhead=8,
        primary_keyword="northern lights tonight iowa",
        variant_keywords=[
            "aurora borealis iowa",
            "iowa northern lights",
            "northern lights des moines",
        ],
        nearby_slugs=["illinois", "minnesota", "wisconsin", "south-dakota"],
        light_pollution_note="Des Moines is the large central dome. Cedar Rapids and Iowa City add eastern glow. Northern Iowa (Mason City) and the Mississippi palisades near Dubuque are the better in-state options.",
        leave_city_advice="Leave Des Moines. Go north, not south. A dark north horizon in northern Iowa beats any downtown riverwalk.",
        north_south_split="Northern Iowa is an event location similar to northern Illinois. Des Moines and southern Iowa need a stronger storm.",
        local_obstacles="Midwest clouds; humidity and haze on the horizon; Des Moines glow; few truly dark corridors compared with the Dakotas.",
        best_months_note="Long nights September–March. Clouds, not darkness, are the usual limiter.",
        local_faqs=[
            {
                "q": "Should I drive to Minnesota instead?",
                "a": "If you can, yes — northern Minnesota is closer to the oval. On a marginal night, driving north beats staying in Des Moines.",
            },
        ],
    ),
]


def add_nearby(entry, extra):
    seen = list(entry.get("nearby_slugs") or [])
    for slug in extra:
        if slug not in seen:
            seen.append(slug)
    entry["nearby_slugs"] = seen


def main():
    data = json.loads(PATH.read_text())
    by_slug = {item["slug"]: item for item in data["locations"]}

    indiana = by_slug["indiana"]
    ids = {p["id"] for p in indiana["sample_points"]}
    if "fort-wayne" not in ids:
        indiana["sample_points"].append(
            point("fort-wayne", "Fort Wayne", 41.0793, -85.1394, "population", 50.2)
        )

    add_nearby(by_slug["ohio"], ["pennsylvania"])
    add_nearby(by_slug["maine"], ["new-hampshire", "vermont"])
    add_nearby(by_slug["massachusetts"], ["new-hampshire", "new-york", "vermont"])
    add_nearby(by_slug["wisconsin"], ["iowa"])
    add_nearby(by_slug["minnesota"], ["north-dakota", "iowa"])
    add_nearby(by_slug["illinois"], ["iowa"])
    add_nearby(by_slug["utah"], ["idaho"])
    add_nearby(by_slug["oregon"], ["idaho"])

    existing = {item["slug"] for item in data["locations"]}
    for item in NEW:
        if item["slug"] in existing:
            raise SystemExit(f"duplicate slug {item['slug']}")
        data["locations"].append(item)

    slugs = [item["slug"] for item in data["locations"]]
    assert len(slugs) == len(set(slugs)) == 24, len(slugs)
    for item in data["locations"]:
        for nb in item["nearby_slugs"]:
            assert nb in slugs, (item["slug"], nb)
        if item["location_type"] == "state":
            assert len(item["sample_points"]) >= 2, item["slug"]

    data["meta"]["status"] = "wave1-plus-wave2-states"
    data["meta"]["notes"] = list(data["meta"].get("notes") or []) + [
        "Wave 2 state pages (NY, PA, VT, NH, MT, ID, ND, SD, IA) reuse the tonight_local template. magnetic_latitude uses the same centered-dipole estimate as Wave 1."
    ]
    PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {PATH} n={len(data['locations'])}")


if __name__ == "__main__":
    main()
