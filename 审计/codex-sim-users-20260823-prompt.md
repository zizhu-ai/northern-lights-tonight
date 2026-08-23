You are independent QA. Simulate FIVE isolated users on the LIVE production site. Do not edit the repo, commit, push, or fetch NOAA directly.

Production: https://aurora-tonight.com

**Do not use ego-browser. Do not use Codex in-app Browser / computer-use / node_repl browser bindings.**

Harness that works on this machine (use Playwright, not puppeteer):
- Node + Playwright chromium: `require('/Users/zizhu/AGI/1-出海AI产品/html-runner/node_modules/@playwright/test')` — write plain `.cjs` scripts and run with `node`.
- `context.grantPermissions(['geolocation'])` + `context.setGeolocation({latitude, longitude})` for GPS.
- python3 urllib or curl for first-HTML / HTTP status checks.
- Screenshots: `/tmp/nlt-codex-sim-20260823/` (create it). Do not write into the repo.

If Playwright chromium cannot launch, stop and say so. Do not invent a walkthrough from source.

# Context: what just shipped (verify on LIVE, not source)

A full visual redesign ("twilight band"): top of key pages is a flat twilight-blue band; a near-black verdict card straddles the band edge; below is a white background with tables. All type is sans-serif (Inter), no serif anywhere. Also a cleanup batch shipped:
- `/forecast/boston` is now a REAL 404 (HTTP 404), no longer an absorption page.
- The fake "Try again" placebo button was removed from location-search error states.
- On desktop forecast pages, the Nearby column must sit BELOW the twilight band, never overlap it.

# Regression checks (must stay fixed)

- R1: On a NO verdict, the first "What to do" bullet must NOT start with `Yes.`
- R2: At 375×667 the sticky header wordmark must show the full string `Northern Lights Tonight`, not clipped.
- R3: A live GO/MAYBE/NO card must NOT show `Source data is too old to treat as live.`

# Five users

Play each fully in its own fresh BrowserContext. Record URL, viewport, verdict status, window row, first What-to-do bullet, computed `font-family` of body and H1, console errors / failed requests, screenshot paths.

## U1 Priya (phone, night, Chicago)

390×844, dark-ish ambient (you cannot simulate ambient light — judge the design). From `/near-me` or home, grant GPS 41.878, -87.630 → expect `/forecast/chicago`. Read the verdict card: is the GO/MAYBE/NO/UNKNOWN word instantly findable? Scroll to What to do, record first bullet (R1). Then on home, submit empty and `00000` in the place search: record exact error copy, and confirm there is NO "Try again" style placebo button (cleanup regression). Also a 375×667 header check (R2).

## U2 Maya (desktop, dusk, first visit)

1440×900. Open `/`. Without scrolling: describe what she sees in the twilight band, whether the near-black verdict card visibly straddles the band edge, and whether the verdict word reads instantly. Check R3. Scroll down: the table must sit on a white background. Measure computed `font-family` on body, H1, and the big verdict word — all must be sans (Inter stack); flag ANY serif (Times etc.) as a defect. Record the band's background color and the card's background color (computed), and judge whether card-vs-band contrast is obvious.

## U3 Chris (desktop, forecast page)

1440×900 and 1280×800. Open `/forecast/colorado`. Critical regression: the Nearby column / section must NOT overlap the twilight band — check bounding boxes: no Nearby element's top edge may sit above the bottom edge of the band. Without scrolling: H1, big verdict word, full Best-window row visible. Headline Fort Collins; Denver among other points. Then `/forecast/minnesota` at 1440×900, same checks.

## U4 Tom (phone, Boston searcher)

390×844. On home, type `Boston` in Find place / search: record what happens (absorption copy? redirect? listing?). Then GET `/forecast/boston` with curl: HTTP status MUST be 404 (cleanup regression — it used to be a 200 absorption page). Render the 404 page in the browser: does it give a useful next step (link home / to Massachusetts)? Screenshot it.

## U5 Elena (phone, reader)

390×844. Open `/guides/how-to-see-northern-lights` and `/methodology`. Judge readability: measure computed max-width / line length of the body text column (expect roughly ≤ 68ch per the design brief), font-family sans, heading hierarchy visible. Note anything that looks broken or unreadably wide on a phone.

# State check (any user)

If any visited card is UNKNOWN: the page must still explain why and give a next step — it must not look like a dead/broken page. Record which slugs you saw in which state.

# Debrief

Only score what you actually opened. Severity:
- S = wrong go-out decision possible, or a shipped regression (R1/R2/R3, Nearby overlap, Boston 404) is back.
- M = main path / fold / readability / font-spec violations on a page a real user lands on.
- L = nits.

Output Markdown in Chinese, UI quotes in English. Structure:

# 模拟用户测试 · 五用户复验（暮色带上线后）
date, URL, tools, viewports.

## 五个用户各自发生了什么
## 缺陷列表
id / S|M|L / who / URL / repro / actual / expected / screenshot.
## 回归核对
R1/R2/R3 + Nearby不压带 + Boston真404 + 无Try again安慰剂 — each pass/fail with evidence.
## 未测
## 一句话
Can all five users decide tonight, and does the twilight-band design hold up on real screens?

Save this report to `审计/codex-sim-users-20260823-report.md` in the repo working dir (report file only — no screenshots, no scripts in the repo).
