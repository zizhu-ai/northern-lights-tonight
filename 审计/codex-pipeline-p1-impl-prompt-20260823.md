Implement the approved spec `设计简报增补｜数据管道一期-20260823.md` (in this repo root). The spec passed cross-audit and is frozen: follow it exactly, especially §3 (design), §4 (file list), and the 执行备注 appendix. Do not redesign, do not add scope, do not edit anything outside §4's file list.

Hard constraints:
- Do NOT commit, push, or create branches. Leave changes in the working tree.
- No new npm dependencies.
- Do not touch page/component/copy/style files; only `lib/snapshots.ts`, `app/api/snapshots/latest/route.ts`, and `.github/workflows/refresh-aurora-snapshots.yml` (§3.5 is an ops step done later by us, not by you).
- Match the existing code style in `lib/snapshots.ts` (TypeScript, no semicolons-off changes, keep existing exports intact).

Verification you must run and report:
1. `npm run build` passes.
2. `next start` smoke: homepage and `/forecast/chicago` render 200.
3. Fault injection per spec §5.2: start with `SNAPSHOT_REMOTE_BASE=https://127.0.0.1:1`, homepage still renders 200 (bundled fallback), no unhandled errors.
4. §5.4: `/forecast/boston` still returns the 404 page.
5. §5.5: with the same fault injection, temporarily set bundled `snapshots/chicago.json` `valid_until` into the past, restart, `/forecast/chicago` shows UNKNOWN + `Source data is too old to treat as live.` — then restore the file byte-for-byte (use `git checkout -- snapshots/` after the test, since snapshots/ is tracked and otherwise untouched).
6. §5.6: raw homepage HTML contains `data-status=`.

Note: this machine's `next dev` cannot fetch Google Fonts (local network); use `next build && next start` for verification, not dev. Kill any process you start on ports 3000/3001 afterwards (`lsof -tnP -iTCP:<port> -sTCP:LISTEN | xargs kill`).

Report back: files changed (with a one-line summary each), and per acceptance item 1–6 above: PASS/FAIL with the exact evidence (command output snippets). Save the report to `审计/codex-pipeline-p1-impl-20260823.md` and also print it as your final message.
