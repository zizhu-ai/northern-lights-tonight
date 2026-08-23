You are an independent architecture reviewer. A data-pipeline reliability question needs your evaluation and a recommendation. Read the actual code before answering; do not edit, commit, or push anything.

# Product

Aurora forecast site (Next.js 15, App Router), deployed on Vercel at https://aurora-tonight.com, repo zizhu-ai/northern-lights-tonight. Every page shows a GO/MAYBE/NO/UNKNOWN verdict computed from NOAA data snapshots. SEO matters: verdicts must be in server-rendered HTML.

# Current pipeline (verify against the code)

- `.github/workflows/refresh-aurora-snapshots.yml`: GitHub Actions cron `*/10 * * * *` runs `python3 engine/snapshot.py`, which fetches NOAA data and rewrites `snapshots/*.json` (one per location + `latest.json`), then commits `chore: refresh aurora snapshots` to `main` if anything changed. The push triggers a Vercel production deploy.
- Pages (`app/page.tsx`, `app/forecast/[slug]/page.tsx`) are `export const dynamic = "force-static"` + `export const revalidate = 600` (ISR, 10 min). They import the snapshot JSON baked into the deployment.
- Each snapshot has `generated_at` and `valid_until = generated_at + 25 min`. At render time, if `now > valid_until`, the page renders UNKNOWN with "Source data is too old to treat as live." (`DATA_STALE`).

# Observed incident (2026-08-23, times UTC)

- Snapshots committed steadily until 00:45/00:47. Then GitHub's scheduler produced NO runs for 80+ minutes (workflow state still `active`; all recent runs `success`).
- Consequence: from ~01:10 onward every page on the live site flipped to UNKNOWN, sitewide, until the next deploy. Site is a one-job product ("can I see aurora tonight") and its answer became "we don't know" for over an hour purely because the commit pipeline stalled — NOAA itself was fine.
- Structural fragility: site liveness is bounded by `valid_until` (25 min) and therefore requires a fresh commit + successful Vercel deploy within every 25-min window, forever. GitHub hosted cron is best-effort and frequently delayed; it also throttles high-frequency schedules.

# Three options on the table

1. **Remove "deploy = data".** Stop committing snapshots to the repo. Add a server-side data path (API route and/or ISR data fetch) that pulls NOAA on demand at render/revalidate time (or reads from an external store that the cron job updates, e.g. Vercel Blob/KV or a GitHub gist/raw file). Pages revalidate every ~10 min against fresh data without needing a new deployment.
2. **Loosen liveness semantics.** Keep the commit pipeline, but judge staleness from the NOAA upstream issuance/forecast time rather than our own `generated_at + 25min` — e.g. if the NOAA product's own issue time hasn't advanced, treat the existing snapshot as still live instead of going UNKNOWN. Think carefully about what "stale" should actually mean for each NOAA input (some update every few minutes, some hourly).
3. **Status quo.** Accept occasional sitewide UNKNOWN windows when the scheduler stutters.

# Your job

1. Read `engine/snapshot.py`, `app/page.tsx`, `app/forecast/[slug]/page.tsx`, `app/api/snapshots/latest/route.ts`, and the workflow file. Correct any mischaracterization above.
2. Evaluate each option on: reliability (what failure modes remain), engineering complexity in THIS codebase, runtime cost / NOAA rate limits / Vercel quotas, SEO requirement (verdict in first HTML), and what happens to the UNKNOWN state design (it exists for genuinely broken data — don't destroy that signal).
3. Consider hybrid variants if they beat the pure options (e.g. option 1 with a committed snapshot as build-time fallback; option 2 + longer valid window).
4. Recommend ONE direction, with a concrete implementation sketch: which files change, what the new data flow is, what the UNKNOWN trigger becomes, and how to verify on production after shipping.
5. Call out anything about the current design we have NOT asked about but should worry about.

Output in Chinese (keep code identifiers and UI strings in English). Save your full evaluation to `审计/codex-pipeline-options-20260823.md` (report file only; no other writes).
