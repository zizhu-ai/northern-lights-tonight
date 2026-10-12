# Deploy aurora-tonight.com on Cloudflare Workers

This app targets `@opennextjs/cloudflare` 1.20.x. DNS and Vercel stay unchanged until a later, explicit cutover. This repository does not contain Cloudflare tokens; do not commit values for any secret listed below.

Worker name: `aurora-tonight`.

## Commands

```bash
npm ci
npm run lint
npm test
npm run cf-build          # full OpenNext build (runs next build; do not pass --skipNextBuild)
npm run test:worker-size  # uncompressed worker must stay under 64 MiB
npm run preview           # local wrangler preview
BASE_URL=http://127.0.0.1:8787 npm run test:cf-preview
```

`npm run deploy` is the production publish path. It requires Cloudflare credentials that this repo does not store.

## Cloudflare resources to create

Create these in the same account that will own the worker. Local `preview` uses Wrangler’s simulated R2 and Durable Objects and does not need the remote resources.

| Resource | Name / binding | Purpose |
| --- | --- | --- |
| Worker | `aurora-tonight` | OpenNext server |
| R2 bucket | `aurora-tonight-next-cache` bound as `NEXT_INC_CACHE_R2_BUCKET` | Next.js ISR / incremental cache |
| R2 bucket | `aurora-tonight-state` bound as `AURORA_STATE_BUCKET` | Live aurora source-state CAS (replaces Vercel Blob) |
| Durable Object | `DOQueueHandler` bound as `NEXT_CACHE_DO_QUEUE` | ISR revalidation queue |

No D1 / tag cache. The site uses time-based `revalidate = 600` only (`/`, `/forecast/[slug]`, `/guides/where-to-see-northern-lights`). Nothing calls `revalidateTag` or `revalidatePath`.

No database. Snapshot state is one JSON object in R2 (or the remote LKG HTTPS API). Connections are opened per request through the R2 binding or `fetch`.

## R2 data migration (Vercel Blob → `aurora-tonight-state`)

Production Blob object:

- pathname: `aurora/state/source-state-v2.json`
- token (do not commit): former `AURORA_STATE_BLOB_READ_WRITE_TOKEN`

Copy the current object, then upload to R2 at the same key:

```bash
# after downloading the Blob body to ./source-state-v2.json
npx wrangler r2 object put aurora-tonight-state/aurora/state/source-state-v2.json \
  --file=./source-state-v2.json \
  --content-type=application/json
```

If remote LKG (`AURORA_LKG_*`) is already the source of truth, skip the Blob copy; the worker will keep using LKG until those vars are unset.

## Environment and secrets

Set Worker vars / secrets in the Cloudflare dashboard or `wrangler secret put`. Never commit values. Local overrides belong in gitignored `.dev.vars` (see `.dev.vars.example`).

### Required on the production worker

| Name | Kind | Notes |
| --- | --- | --- |
| `APP_ENV` | var | Must be `production` on the custom domain. `wrangler.jsonc` defaults it. Local preview uses `preview` via `.dev.vars`. |
| `OPEN_METEO_USAGE_MODE` | var | `noncommercial` while the site stays on the free Open-Meteo endpoint. |

### Required before commercial Open-Meteo

| Name | Kind | Notes |
| --- | --- | --- |
| `OPEN_METEO_API_BASE` | var | `https://customer-api.open-meteo.com/v1/forecast` |
| `OPEN_METEO_API_KEY` | secret | Commercial key. Forbidden while `OPEN_METEO_USAGE_MODE=noncommercial`. |

### Optional persistence

| Name | Kind | Notes |
| --- | --- | --- |
| `AURORA_LKG_BASE_URL` | var | Remote last-known-good origin, e.g. `https://lkg.aurora-tonight.com` |
| `AURORA_LKG_READ_TOKEN` | secret | Bearer for `GET /v1/state` |
| `AURORA_LKG_WRITE_TOKEN` | secret | Bearer for `PUT /v1/state` |

All three LKG vars must be set together or all unset. A partial set fails closed.

### Optional / retired

| Name | Kind | Notes |
| --- | --- | --- |
| `AURORA_OVATION_URL` | var | Override NOAA OVATION URL |
| `AURORA_KP_URL` | var | Override NOAA Kp URL |
| `AURORA_CLOUD_URL` | var | Fault-injection only when `APP_ENV` is not `production` |
| `SNAPSHOT_REMOTE_BASE` | var | Fault-injection base for bundled `latest.json` |
| `AURORA_STATE_BLOB_READ_WRITE_TOKEN` | — | Retired. Do not set on Cloudflare. Still redacted if present in leftover env. |
| `VERCEL_ENV` | — | Unused. Host + `APP_ENV` decide redirects and noindex. |

`.dev.vars` for local preview:

```
NEXTJS_ENV=development
APP_ENV=preview
```

## Host, redirects, and noindex

Middleware is Edge-compatible (`NextRequest` / `NextResponse` only).

- `APP_ENV=production` and a non-preview host: 308 to `https://aurora-tonight.com` when the host or trailing slash is wrong.
- `*.workers.dev`, localhost, and `APP_ENV !== production`: no canonical redirect; `X-Robots-Tag: noindex, nofollow`.
- IndexNow key file stays 200 and is never 308’d.

## Images, ISR, and CPU

- `next/image` is unused. `images.unoptimized` is set; no Cloudflare Images binding.
- ISR uses the R2 incremental cache + Durable Object queue. `enableCacheInterception` is `false`.
- Heavy CPU is `compute_bundle` / `parse_ovation` on `/`, `/forecast/[slug]`, `/guides/where-to-see-northern-lights`, `/api/snapshots/latest`, and `/api/health`. `/view` does not run the engine.
- Mitigations: 600s ISR in R2, 60s isolate memo of the computed bundle, and OVATION grid clipped to the Wave 1 interpolation neighborhood before parse. Live verdicts cannot be build-time static.

## Preview acceptance

Against local wrangler preview (`APP_ENV=preview`):

- Key pages return 200.
- HTML canonical / sitemap / robots still name `https://aurora-tonight.com`.
- Preview host sends `X-Robots-Tag: noindex, nofollow`.
- Uncompressed worker stays under 64 MiB; record the gzip size from `npm run test:worker-size`.
