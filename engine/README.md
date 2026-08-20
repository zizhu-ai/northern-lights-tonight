# Snapshot engine

White-list Wave 1 only. No HTML. `seo_indexable` stays false.

```bash
python3 engine/snapshot.py
python3 engine/snapshot.py --slug colorado
python3 engine/snapshot.py --offline   # reuse engine/.cache
```

Writes `snapshots/<slug>.json` and `snapshots/latest.json`.
