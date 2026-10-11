# IndexNow

Bing Webmaster Tools flagged `aurora-tonight.com` for missing IndexNow. The
site now publishes a public ownership key and notifies IndexNow after
production deploys. The key is public by design; it is not a secret.

This path does not read Blob, Open-Meteo, NOAA, or any forecast upstream. It
does not run on the 10-minute live-data refresh. Snapshot workflows are
unrelated.

## Key file

Committed files:

- `lib/indexnow.ts` — `INDEXNOW_KEY`
- `public/<key>.txt` — body is the same key (UTF-8, `text/plain`)

Production URL:

```text
https://aurora-tonight.com/80782f4c69d9488dc026c5d3346d9a88.txt
```

Middleware does not canonicalize that path, so the key file stays HTTP 200
`text/plain` (including on www). `robots.txt` continues to `Allow: /`.
Existing security headers still apply; they must not change the 200 /
`text/plain` / body-equals-key contract.

## Submit

```bash
node scripts/indexnow-submit.mjs --offline --dry-run
node scripts/indexnow-submit.mjs --wait
```

`--wait` polls only the key file and `/sitemap.xml` until they match this
commit's `ACQUISITION_ROUTES`, then POSTs that URL list to
`https://api.indexnow.org/indexnow` with `host`, `key`, and `keyLocation`.
IndexNow should respond **200** or **202**.

`--offline` uses `ACQUISITION_ROUTES` without contacting production. `--dry-run`
prints the payload and does not POST.

## GitHub Action

`.github/workflows/indexnow.yml` runs on push to `main` and on
`workflow_dispatch`. It waits for the production deploy, then submits. It does
not run on pull requests or on snapshot/health schedules.

## Verify

After production has this commit:

```bash
curl -sSI https://aurora-tonight.com/80782f4c69d9488dc026c5d3346d9a88.txt
curl -sS https://aurora-tonight.com/80782f4c69d9488dc026c5d3346d9a88.txt
node scripts/indexnow-submit.mjs --wait
```

Expect HTTP 200, `content-type: text/plain`, a body equal to the key, and an
IndexNow status of 200 or 202. Manual dispatch of the IndexNow workflow is the
same submit path.
