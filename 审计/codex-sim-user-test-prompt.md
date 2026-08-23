You are independent QA. Simulate real, mutually unaware users on the LIVE site. Do not implement features. Do not edit this repo. Do not commit, push, open a PR, change robots/indexing, or fetch NOAA/SWPC from the browser.

# Target

https://northern-lights-tonight.vercel.app

v1 is still noindex. US English. No login, no map, no ads, no percentage “chance of seeing it.”

Money-page slugs (only these have `/forecast/[slug]`):
colorado, ohio, indiana, michigan, chicago, seattle, wisconsin, massachusetts, maine, minnesota, illinois, oregon, utah, alaska, fairbanks

Aliases apply only on search submit, not URL rewrite:
Boston → massachusetts; Minneapolis / Duluth → minnesota; Columbus → ohio; Indianapolis → indiana; Salt Lake City → utah; Northern Michigan → michigan.

`/forecast/boston` must be a not-found page whose **first HTML** contains “We do not have a dedicated Boston URL.” and a “Massachusetts tonight” link. Other unknown slugs → real HTTP 404.

# How to test

Prefer a real browser (Playwright, Puppeteer, or system Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`). Click, type, wait for navigation, screenshot.

If a headed browser is unavailable, use headless Chrome and curl as supporting evidence. If you cannot open the site at all, stop and say so — do not invent a walkthrough from source.

Viewports:
- phone: 375×667 and 390×844
- desktop: ≥1280 wide

Save screenshots under `/tmp/nlt-codex-sim/` (create it). Do not write into the git working tree.

You MAY read `content/ui-copy.json` in this repo to compare frozen error strings. Do not change it.

Network to `northern-lights-tonight.vercel.app` is required and allowed. Do not request `services.swpc.noaa.gov` from the page or from your tools as part of “computing aurora.”

# Phase 1 — be the user

Play each person separately. Do not carry a checklist into their clicks. If they fail, do what that person would do (retry, change query, give up). Record URL, actions, the exact status / window / main-issue text, and screenshot paths.

## User A · Maya (Denver, Friday 16:30)

Coworkers want to drive north for aurora. Open `/` then `/forecast/colorado` (or land on Colorado directly). She needs tonight’s go/no: big GO/MAYBE/NO/UNKNOWN, Best window, Main issue. Check whether Fort Collins is the headline and Denver appears among other points. On 375×667 and 390×844, without scrolling she must see H1, the big status word, and the full Best window row (the answer line may be clipped). She may tap Share. She hates percentages and maps.

## User B · Chris (Boston)

Searches “northern lights boston tonight.” On home or Find place, type Boston — he expects a usable tonight page. Then deliberately open `/forecast/boston` and see whether it is a dead end, and whether the first screen already tells him to use Massachusetts. Do not invent a Boston forecast page.

## User C · Priya (phone, will not spell state names)

Use Near me. Submit empty, then `00000`, then `zzzznotaplace`. Then allow location near Chicago (41.878, -87.630) and see if she lands on Chicago, not a Wisconsin GO. Deny location once and see if she is stuck. Close the Find place overlay after starting location; a late GPS callback must not navigate her away.

## User D · Tom (Sydney, southern hemisphere)

Use location or open:
https://northern-lights-tonight.vercel.app/view?lat=-33.869&lng=151.209&name=Sydney
He must understand this is not a southern-hemisphere score. Not 404. Not GO. Header and footer still present.

## User E · Lena (Alaska trip vs Fairbanks tonight)

Open `/forecast/alaska` and `/forecast/fairbanks` side by side. Alaska’s card should include `Statewide · headline: Fairbanks Interior`. Fairbanks must not. Titles must differ. Also open Oregon and confirm the headline is Baker City, not Portland.

## User F · Owen (doesn’t trust forecasts)

From the footer open methodology and one guide. English, readable, not a percentage toy, no login wall. Confirm the home Title/H1 has no “Live” and no “Near You,” and is not IP-personalized into “you are in City tonight MAYBE.”

# Phase 2 — debrief (out of character)

Score only what you actually opened. Mark untested items. Do not pretend.

Invariants (a break is a defect):

1. Verdicts are only GO | MAYBE | NO | UNKNOWN. Southern hemisphere displays UNAVAILABLE (not a fifth engine status). No WAIT, no xx% chance.
2. Home’s 15-row table with statuses and links is in server HTML; same for everyone; no IP city verdict.
3. State headline = representative point: Colorado → Fort Collins; Oregon → Baker City. Never max() sample points.
4. While the snapshot is still within `valid_until`, the Colorado card must not show “Source data is too old to treat as live.” A lagging NOAA product may yield the engine’s own NO/MAYBE/UNKNOWN, but must not fake whole-file expiry.
5. `/view` with no snapshot → UNKNOWN. Request path must not compute aurora.
6. Failure copy must match the site English exactly (no paraphrases):
   - Enter a US city, state, or ZIP.
   - No match for that place. Try a city, state, or 5-digit ZIP.
   - That ZIP is not in our list yet. Try the city name.
   - Location permission is off. Search a city or ZIP instead.
   - Could not read your location. Search a city or ZIP instead.
7. `robots.txt` Disallow: / ; no sitemap; no `/map`; no login.
8. Light page + dark verdict card. Not an all-black stub.
9. Chicago’s card must not carry Wisconsin’s GO. Nearby Illinois links are fine.
10. 375×667 and 390×844: H1, big status, and the full Best window row visible without scrolling.

Severity:
- S: wrong go-out decision, home vs money-page contradiction, south/stale/missing snapshot scored as GO
- M: main path broken, above-the-fold missing, error copy not the frozen English, Boston first paint missing the CTA
- L: wording/layout nits that do not change the decision

# Output

Write the entire final answer in Markdown, in Chinese. Keep quoted UI in English.

# 模拟用户测试 · Northern Lights Tonight

Date, production URL, browser/viewport actually used.

## 六个用户各自发生了什么

For each: motive → path (URLs) → what they understood → where they stuck → screenshot paths.

## 缺陷列表

id / severity / who hit it / URL / repro / actual / expected (invariants only; do not invent new product requirements).

## 未测与环境限制

## 一句话

Can an American use this tonight to decide whether to go out? No empty praise.

Constraints:
- Read-only against production. Report S/M; do not patch unless this prompt is later extended.
- Do not mutate the DOM or cache to fake a fresh deploy.
- Do not discuss SEO rankings or turning indexing on.
