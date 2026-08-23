You are implementing ONLY Part 1 of the frozen v1 contract in this repo.

Read first:
- `需求｜v1-Codex实现.md` §3「线上刷新」and §8 checklist items about GitHub Action
- `CODEX-HANDOFF.md`
- `engine/snapshot.py` (keep it; valid_until is already generated_at + 25 minutes, capped at OVATION forecast + 40 minutes)
- `engine/README.md`

## Goal
Add a GitHub Action that refreshes Wave 1 snapshots on a schedule. Do not build pages.

## Must
1. Workflow file under `.github/workflows/` (one file).
2. Triggers: `schedule` cron `*/10 * * * *` AND `workflow_dispatch`.
3. `permissions: contents: write`.
4. Runs `python3 engine/snapshot.py` on ubuntu-latest with Python 3.12.
5. If `snapshots/` changed (including only `generated_at` / `valid_until`), commit and **push only `main`**.
6. Commit message exactly: `chore: refresh aurora snapshots`
7. Configure git as github-actions[bot].
8. Failures must be visible in Actions (no `|| true` swallowing).
9. Do **not** add `engine/.cache/` (already gitignored).
10. Guard so a run on a non-main ref does not push to a random branch. Only push `main`.
11. Use `GITHUB_TOKEN` from the job. Do not invent secrets.

## Do not
- Rewrite `engine/snapshot.py` algorithm or HTML/Next pages
- Change `robots.txt`, `seo_indexable`, or indexing
- Create `/map`, login, database
- Commit or push git yourself
- Edit spec markdown except if a workflow comment is required (prefer no spec edits)

## Done when
- Workflow YAML exists and matches the rules above
- `python3 engine/snapshot.py --help` still works (or the existing CLI flags still work)
- Print a short summary of files changed

Work only in this repository.
