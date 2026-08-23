# Task: screenshot competitor first folds with Playwright only

Do **not** use Codex in-app Chrome, computer-use, or any browser allowlist. Those blocked spaceweatherlive.com last run.

Use Playwright CLI (npx playwright 1.62 is available). Chromium is already cached under `~/Library/Caches/ms-playwright`.

## Command pattern

```
cd "/Users/zizhu/AGI/1-出海AI产品/产品-northern lights tonight"
npx playwright screenshot --browser chromium --viewport-size=1280,900 \
  --timeout 25000 \
  "URL" \
  "视觉稿/alts/shots/FILENAME.png"
```

If `screenshot` subcommand fails, write a 20-line node script using `playwright` package (`chromium.launch({headless:true})`, `page.setViewportSize({width:1280,height:900})`, `goto waitUntil domcontentloaded`, `page.screenshot({path})`). One site at a time. 25s timeout per site. Skip and continue on failure.

## Files (exact names)

Dir: `/Users/zizhu/AGI/1-出海AI产品/产品-northern lights tonight/视觉稿/alts/shots/`

1. `comp-swl.png` — https://www.spaceweatherlive.com/en/auroral-activity.html
2. `comp-noaa.png` — https://www.swpc.noaa.gov/products/aurora-30-minute-forecast
3. `comp-aurorame.png` — https://auroraforecast.me/us/co
4. `comp-anorth.png` — https://astronomynorth.ca/aurora-forecast/
5. `comp-hunter.png` — https://www.aurorahunter.com/northern-lights-prediction.html
6. `comp-polar.png` — https://polarforecast.com/
7. `comp-softserve.png` — https://www.softservenews.com/

## Done

List each file: exists? bytes? (use `stat`). No design analysis.
