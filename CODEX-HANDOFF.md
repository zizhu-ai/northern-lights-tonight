# Codex handoff — Northern Lights Tonight v1

Read **`需求｜v1-Codex实现.md` first.** That file is the implementation contract.

Then implement it in this repo (already on GitHub + Vercel). Do not start a new project.

## Non-negotiables

- US English site. No login, no map route, no ads, no percentage chances.
- Keep `engine/snapshot.py`; add a GitHub Action to refresh `snapshots/` on a schedule.
- Replace the current homepage stub with the real pages from `线框图｜首版.md`.
- **Stay noindex.** Do not allow `robots.txt` to index. Do not set `seo_indexable: true`.
- Homepage SSR must be the same for everyone (no IP city verdict).
- State page headline = `primary_verdict_point` (Oregon = Baker City). Never max() sample points.
- All verdicts and the 15-row US table must be in server HTML.
- `/view` with no snapshot file → UNKNOWN only. Never compute aurora on the request path.
- Unknown `/forecast/[slug]` → 404. Alias Boston→massachusetts etc. before routing.
- Titles: section 5 of the Chinese contract (no “Live” / “Near You” on home).

## Done when

The checklist in section 8 of `需求｜v1-Codex实现.md` is all ticked, production on `main` is updated, and Actions can refresh snapshots.
