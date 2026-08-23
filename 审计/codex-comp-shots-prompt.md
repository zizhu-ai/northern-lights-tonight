# Task: screenshot competitor first folds (no analysis)

You are Codex. Capture first-fold screenshots of aurora forecast websites. Do not write a design essay. Do not edit the Next.js app.

## Output directory (create if missing)

`/Users/zizhu/AGI/1-出海AI产品/产品-northern lights tonight/视觉稿/alts/shots/`

Save PNGs with these exact filenames. Desktop viewport ~1280×900, full first fold (no need for full-page). If a site is a cookie wall, accept/dismiss once then shoot.

| File | URL |
|---|---|
| `comp-swl.png` | https://www.spaceweatherlive.com/en/auroral-activity.html |
| `comp-noaa.png` | https://www.swpc.noaa.gov/products/aurora-30-minute-forecast |
| `comp-aurorame.png` | https://auroraforecast.me/us/co |
| `comp-anorth.png` | https://astronomynorth.ca/aurora-forecast/ |
| `comp-hunter.png` | https://www.aurorahunter.com/northern-lights-prediction.html |
| `comp-polar.png` | https://polarforecast.com/ |
| `comp-softserve.png` | https://www.softservenews.com/ |

If Chrome/Playwright/`screenshot` CLI is available, use it. Headless Chrome example:

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,900 --virtual-time-budget=12000 --screenshot=OUT.png URL
```

If one URL hangs > 25s, skip it and continue. Do not block the batch on one site.

## Done when

Print a markdown list: filename, bytes, whether the shot actually shows the live page (not a blank/error/captcha). No design commentary.
