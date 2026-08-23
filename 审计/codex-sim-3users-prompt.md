You are independent QA. Simulate THREE isolated users on the LIVE site after a ship. Do not edit the repo, commit, push, or fetch NOAA.

Production: https://northern-lights-tonight.vercel.app

**Do not use ego-browser. Do not use Codex in-app Browser / computer-use / node_repl browser bindings.**

Harness that works on this machine:
- Chrome: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- Node puppeteer-core at `/tmp/nlt-qa-tools` (`executablePath` = that Chrome, `headless: 'new'`)
- `context.overridePermissions(origin, ['geolocation'])` + `page.setGeolocation` for GPS
- python3 urllib for first-HTML / HTTP
- Screenshots: `/tmp/nlt-codex-sim3/` (create it). Do not write into git.

If Chrome cannot launch, stop and say so. Do not invent a walkthrough from source.

Just shipped (must verify on LIVE, not only source):
- M-01: Chicago What to do first bullet must NOT start with `Yes.` It should be leave-town advice like “Downtown, the Loop…” / “If you go out anyway…”. Card may still be NO.
- L-01: at 375×667 the sticky wordmark must show the full frozen string `Northern Lights Tonight`, not `Northern Lights Toni…`.

# Three users only

Play each fully. Record URL, clicks, exact status / window / main-issue / first What to do bullet, screenshot paths.

## Priya (phone, Chicago)

From `/near-me` or home, allow GPS 41.878, -87.630 → expect `/forecast/chicago`. Read the verdict card, then scroll to What to do. She will treat the first bullet as tonight’s permission. Also submit empty, `00000`, and deny GPS once (frozen English from `content/ui-copy.json`). Viewport 390×844 plus a 375 check of the header.

## Maya (Denver, 16:30)

Open `/` then `/forecast/colorado` at **375×667** and **390×844**. Without scrolling: H1, big GO/MAYBE/NO/UNKNOWN, full Best window row. Headline Fort Collins; Denver among other points. Header wordmark must be complete. No `Source data is too old to treat as live.` if the card is a live NO/MAYBE/GO.

## Chris (Boston)

Type `Boston` on home Find place / search → usable tonight page (Massachusetts). Then open `/forecast/boston` and confirm **first HTML** has `We do not have a dedicated Boston URL.` and `Massachusetts tonight`.

# Debrief

Only score what you opened. Severity: S = wrong go-out decision; M = main path / fold / What to do still reads as Yes on NO / Boston first paint / wordmark still clipped; L = nits.

Output Markdown in Chinese, UI quotes in English.

# 模拟用户测试 · 三用户复验（上线后）

date, URL, tools, viewports.

## 三个用户各自发生了什么

## 缺陷列表

id / S|M|L / who / URL / repro / actual / expected.

## 未测

## 一句话

Can Priya, Maya, and Chris decide tonight? Did M-01 and L-01 stay fixed on production?
