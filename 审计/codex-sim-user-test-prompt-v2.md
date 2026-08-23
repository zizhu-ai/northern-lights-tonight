You are independent QA simulating real users on the LIVE site. Do not edit this repo, commit, push, open a PR, change indexing, or fetch NOAA.

Previous attempt failed because ego-browser screenshots time out and Codex in-app Chrome needs a permission grant. **Do not use ego-browser. Do not use Codex in-app Browser / computer-use / node_repl browser bindings.** If those skills appear, ignore them.

# Allowed harness (this machine already works)

Chrome:
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

Headless screenshot example:
```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --window-size=375,667 --screenshot=/tmp/nlt-codex-sim/foo.png --virtual-time-budget=5000 "https://northern-lights-tonight.vercel.app/forecast/colorado"
```

Clicks, forms, GPS, viewports: Node + puppeteer-core already installed at `/tmp/nlt-qa-tools` with `executablePath` = that Chrome. Example pattern: `require('puppeteer-core')`, `headless: 'new'`, `context.overridePermissions(origin, ['geolocation'])`, `page.setGeolocation`, `page.setViewport({width, height, deviceScaleFactor: 2, isMobile: true})`.

HTML/HTTP facts: `python3` + `urllib` (not NOAA).

Create `/tmp/nlt-codex-sim/` for screenshots. Do not write into the git tree. You MAY read `content/ui-copy.json`.

If Chrome/puppeteer cannot launch, say so and stop. Do not invent walkthroughs from source.

# Target

https://northern-lights-tonight.vercel.app

noindex. US English. No login, no map, no ads, no percentage chance.

Wave 1 slugs: colorado ohio indiana michigan chicago seattle wisconsin massachusetts maine minnesota illinois oregon utah alaska fairbanks

Aliases on **search submit only**: Boston→massachusetts, Minneapolis/Duluth→minnesota, Columbus→ohio, Indianapolis→indiana, Salt Lake City→utah, Northern Michigan→michigan.

`/forecast/boston` first HTML must contain “We do not have a dedicated Boston URL.” and “Massachusetts tonight”. Other unknown slugs → HTTP 404.

Viewports to use: 375×667, 390×844, desktop ≥1280.

# Phase 1 — six isolated users

Play each fully with the harness above. Record URL, actions, exact on-page status/window/main-issue, screenshot paths.

**Maya (Denver 16:30)** — `/` then `/forecast/colorado`. Needs GO/MAYBE/NO/UNKNOWN, Best window, Main issue, Fort Collins headline, Denver in other points. On 375 and 390 without scrolling: H1, big status, full Best window row (answer may clip). May click Share. Hates % and maps.

**Chris (Boston)** — type Boston in Find place / home search (expect a usable tonight page). Then open `/forecast/boston` and check first paint CTA. Do not invent a Boston forecast.

**Priya (phone)** — `/near-me`: empty submit, `00000`, `zzzznotaplace`. GPS grant Chicago 41.878,-87.630 → should be Chicago not Wisconsin GO. GPS deny → frozen English, not stuck. Start Use my location in Find place, close overlay, delayed callback must not navigate away.

**Tom (Sydney)** — open `/view?lat=-33.869&lng=151.209&name=Sydney` (and/or GPS south). UNAVAILABLE, not 404, not GO, chrome present.

**Lena** — `/forecast/alaska` vs `/forecast/fairbanks`. Alaska card has `Statewide · headline: Fairbanks Interior`; Fairbanks does not. Titles differ. Oregon headline is Baker City not Portland.

**Owen** — footer methodology + one guide. English, no login. Home Title/H1 have no Live / Near You and no IP city verdict.

# Phase 2 — debrief

Only score what you opened. Invariants:

1. Statuses GO|MAYBE|NO|UNKNOWN; south displays UNAVAILABLE. No WAIT, no xx% chance.
2. Home 15-row table in server HTML; same for everyone; no IP city.
3. Colorado headline Fort Collins; Oregon Baker City.
4. Within snapshot `valid_until`, Colorado must not show “Source data is too old to treat as live.”
5. `/view` without snapshot → UNKNOWN; no request-path aurora compute.
6. Exact error strings from ui-copy.json (empty, no match, zip, gps denied, gps unavailable).
7. robots Disallow: / ; no sitemap; no /map; no login.
8. Light page + dark verdict card.
9. Chicago card must not show Wisconsin GO.
10. 375 and 390: H1, status, Best window row above the fold.

S = wrong go-out decision or GO on south/stale/missing. M = main path / fold / frozen copy / Boston first paint. L = nits.

# Output

Final answer: Markdown in Chinese, UI quotes in English.

# 模拟用户测试 · Northern Lights Tonight
date, URL, actual tool (headless Chrome / puppeteer), viewports.

## 六个用户各自发生了什么
motive, path, what they understood, where stuck, screenshot paths.

## 缺陷列表
id / S|M|L / who / URL / repro / actual / expected.

## 未测与环境限制

## 一句话
Can an American decide tonight whether to go out? No empty praise.

Complete all six users in this turn. Do not stop after the homepage.
