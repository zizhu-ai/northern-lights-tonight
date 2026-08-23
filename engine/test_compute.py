from __future__ import annotations

import json
import io
import sys
import unittest
from contextlib import redirect_stderr, redirect_stdout
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

from engine import snapshot
from engine.snapshot import compute_bundle


FIXTURES = Path(__file__).resolve().parent / "fixtures"
CASES = (
    "happy_fresh",
    "cross_midnight",
    "dst_spring_forward",
    "dst_fall_back",
    "best_window_elapsed",
    "ovation_missing",
    "kp_missing",
    "aurora_both_missing",
    "cloud_partial_missing",
    "cloud_all_missing",
    "ovation_age_46m",
    "ovation_age_91m",
    "kp_slots_missing",
    "malformed_ovation",
)


def load_json(path: Path):
    return json.loads(path.read_text())


class GoldenComputeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dossiers = load_json(FIXTURES / "dossiers.json")
        cls.slugs = [location["slug"] for location in cls.dossiers["locations"]]
        cls.point_count = sum(len(location["sample_points"]) for location in cls.dossiers["locations"])

    def assert_case_matches(self, case_id: str) -> None:
        case = FIXTURES / case_id
        metadata = load_json(case / "case.json")
        clouds = load_json(case / "raw" / "clouds.json")
        self.assertEqual(39, self.point_count)
        self.assertEqual(39, len(clouds), f"{case_id} must retain all dossier sample points")

        actual = compute_bundle(
            datetime.fromisoformat(metadata["now"]),
            load_json(case / "raw" / "ovation.json"),
            load_json(case / "raw" / "kp.json"),
            clouds,
            self.dossiers,
        )
        expected = load_json(case / "expected" / "latest.json")
        self.assertEqual(expected, actual)
        self.assertEqual(15, len(actual["locations"]))

        by_slug = {snapshot["location_slug"]: snapshot for snapshot in actual["locations"]}
        self.assertEqual(self.slugs, list(by_slug))
        for slug in self.slugs:
            # Full snapshot comparison includes answer_sentence, ordered reason_codes,
            # every required point field, and every required headline window field.
            self.assertEqual(
                load_json(case / "expected" / f"{slug}.json"),
                by_slug[slug],
                f"{case_id}/{slug}",
            )
            snapshot = by_slug[slug]
            self.assertTrue(
                {
                    "status",
                    "confidence",
                    "reason_codes",
                    "best_window_start",
                    "best_window_end",
                    "answer_sentence",
                    "points",
                    "windows",
                }.issubset(snapshot)
            )
            for point in snapshot["points"]:
                self.assertTrue(
                    {
                        "id",
                        "status",
                        "confidence",
                        "aurora_reach",
                        "cloud_block",
                        "main_obstacle",
                    }.issubset(point)
                )
            for window in snapshot["windows"]:
                self.assertEqual(
                    {
                        "start",
                        "end",
                        "skip",
                        "status",
                        "aurora_reach",
                        "cloud_block",
                        "source",
                        "codes",
                    },
                    set(window),
                )

    def test_happy_and_elapsed_share_raw(self) -> None:
        happy = FIXTURES / "happy_fresh" / "raw"
        elapsed = FIXTURES / "best_window_elapsed" / "raw"
        for filename in ("ovation.json", "kp.json", "clouds.json"):
            self.assertEqual((happy / filename).read_bytes(), (elapsed / filename).read_bytes())

        before = load_json(FIXTURES / "happy_fresh" / "expected" / "latest.json")
        after = load_json(FIXTURES / "best_window_elapsed" / "expected" / "latest.json")
        before_rows = {
            row["location_slug"]: (row["status"], row["best_window_start"], row["best_window_end"])
            for row in before["locations"]
        }
        after_rows = {
            row["location_slug"]: (row["status"], row["best_window_start"], row["best_window_end"])
            for row in after["locations"]
        }
        self.assertNotEqual(before_rows, after_rows)

    def test_ovation_age_boundaries(self) -> None:
        age_46 = load_json(FIXTURES / "ovation_age_46m" / "expected" / "latest.json")
        age_91 = load_json(FIXTURES / "ovation_age_91m" / "expected" / "latest.json")
        self.assertTrue(age_46["ovation_ok"])
        self.assertFalse(age_91["ovation_ok"])

    def test_fetch_keeps_ovation_and_kp_independent(self) -> None:
        def fake_get(url: str, _cache_name: str, _max_age_min: int):
            if url == snapshot.OVATION_URL:
                raise OSError("ovation down")
            if url == snapshot.KP_URL:
                return [{"time_tag": "2026-08-21T03:00:00", "kp": 2.0}]
            self.fail(f"unexpected URL {url}")

        with patch.object(snapshot, "_get", side_effect=fake_get):
            ovation, kp, clouds, errors = snapshot.fetch_sources([], offline=False)

        self.assertIsNone(ovation)
        self.assertEqual(2.0, kp[0]["kp"])
        self.assertEqual({}, clouds)
        self.assertEqual(1, len(errors))
        self.assertIn("ovation fetch failed", errors[0])

    def test_cli_returns_nonzero_after_source_failure(self) -> None:
        degraded = {
            "generated_at": "2026-08-21T03:10:00+00:00",
            "ovation_ok": False,
            "seo_indexable": False,
            "locations": [],
        }
        with redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            with (
                patch.object(sys, "argv", ["engine/snapshot.py", "--offline"]),
                patch.object(snapshot, "fetch_sources", return_value=(None, [], {}, ["ovation failed"])),
                patch.object(snapshot, "compute_bundle", return_value=degraded),
                patch.object(snapshot, "write_bundle") as write_bundle,
            ):
                exit_code = snapshot.main()

        self.assertEqual(1, exit_code)
        write_bundle.assert_called_once_with(degraded)


def _make_case_test(case_id: str):
    def test(self: GoldenComputeTests) -> None:
        self.assert_case_matches(case_id)

    test.__name__ = f"test_golden_{case_id}"
    return test


for _case_id in CASES:
    setattr(GoldenComputeTests, f"test_golden_{_case_id}", _make_case_test(_case_id))


if __name__ == "__main__":
    unittest.main()
