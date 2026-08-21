# Codex handoff — Northern Lights Tonight v1

Read **`需求｜v1-Codex实现.md` first.** That file is the implementation contract. Conflict order is in its header.

Then implement it in this repo (already on GitHub + Vercel). Do not start a new project.

## Non-negotiables

- US English site. No login, no map route, no ads, no percentage chances.
- Keep `engine/snapshot.py`; add a GitHub Action every **10 minutes** that always commits if `generated_at` changed. `valid_until` is `generated_at + 25 minutes` (our refresh TTL). Do not cap it by OVATION forecast time. NOAA staleness is `ovation_ok` / near-window UNKNOWN, not a whole-file `DATA_STALE`.
- Replace the homepage stub with the real pages. Layout from `设计｜页面架构线框与后端.md`; **skin from `设计｜视觉与UI规范.md`** (light page + dark verdict card). Do not ship the `视觉稿/` HTML as the app.
- Copy: `content/ui-copy.json` and `content/guides/*.md`. Do not LLM-rewrite.
- Places lookup: `data/us-places.json` only. No request-path geocoder.
- **Stay noindex.** Do not allow `robots.txt` to index. Do not set `seo_indexable: true`.
- Homepage SSR must be the same for everyone (no IP city verdict, no IP prefills).
- State page headline = `primary_verdict_point` (Oregon = Baker City). Never max() sample points.
- All verdicts and the 15-row US table must be in server HTML.
- `/view` with no snapshot file → UNKNOWN only. `lat < 0` → UNAVAILABLE copy, not 404, not GO. Never compute aurora on the request path.
- Unknown `/forecast/[slug]` → 404. `/forecast/boston` is a dedicated not-found page with the Massachusetts CTA in the first HTML. Alias Boston→massachusetts etc. only on Find place / near-me submit.
- Titles: section 5 of the Chinese contract (Alaska vs Fairbanks titles must differ; no “Live” / “Near You” on home). Alaska card must render `verdict.alaska_kicker`; Fairbanks must not.

## Done when

The checklist in section 8 of `需求｜v1-Codex实现.md` is all ticked, production on `main` is updated, and Actions can refresh snapshots.
