# Snapshot engine

White-list Wave 1 only. No HTML. `seo_indexable` stays false.

```bash
python3 engine/snapshot.py
python3 engine/snapshot.py --slug colorado
python3 engine/snapshot.py --offline   # reuse engine/.cache
```

Writes `snapshots/<slug>.json` and `snapshots/latest.json`.

`valid_until` is `generated_at + 25 minutes` (refresh TTL). NOAA product age does not shorten that timestamp; it only sets `ovation_ok` / near-window UNKNOWN.
