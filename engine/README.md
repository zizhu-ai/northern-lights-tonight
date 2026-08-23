# Snapshot engine

Wave 1 only. No HTML. `seo_indexable` stays false.

`snapshot.py` has three explicit layers:

- `fetch_sources()` independently fetches OVATION, Kp, and the 39 dossier sample-point cloud payloads. Every source failure is recorded.
- `compute_bundle(now, ovation_envelope, kp_envelope, cloud_envelopes, dossiers)` is pure. It performs no network, cache, or file access.
- `write_bundle()` serializes the computed bundle to `snapshots/` in the existing format.

The CLI remains the producer entry point:

```bash
python3 engine/snapshot.py
python3 engine/snapshot.py --slug colorado
python3 engine/snapshot.py --offline   # read engine/.cache for fixture/oracle work
```

It writes `snapshots/<slug>.json` and `snapshots/latest.json`. If any requested source fails, it still computes and writes the complete degraded output, then exits nonzero.

`valid_until` remains `generated_at + 25 minutes` in this Python oracle so its output stays byte-compatible with the pre-split producer.

## Golden fixtures

Each `engine/fixtures/<case>/` contains a fixed `case.json`, immutable raw `ovation.json`, `kp.json`, and 39-key `clouds.json`, plus generated `expected/latest.json` and all 15 `expected/<slug>.json` files. The shared fixed dossiers are in `engine/fixtures/dossiers.json`.

Regenerate expected output only after an intentional compute change:

```bash
python3 engine/regenerate_fixtures.py
python3 -m unittest engine/test_compute.py -v
```

Do not hand-edit files under `expected/`. `--initialize` is a one-time bootstrap command and refuses to overwrite an existing fixture tree; it is not part of normal regeneration.
