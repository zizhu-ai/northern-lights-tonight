# Codex handoff — Northern Lights Tonight

> **Superseded launch contract:** For current launch-hardening work, read [`docs/superpowers/specs/2026-08-24-launch-hardening.md`](docs/superpowers/specs/2026-08-24-launch-hardening.md). The older v1 documents remain historical context only.

The product is live and indexable at `https://aurora-tonight.com`. Do not start a new project or reintroduce the old site-wide noindex posture.

## Current runtime facts

- Request-time freshness, not Git commits, keeps the site live. `/`, the 15 forecast routes, and the where-to-see guide synchronously refresh expired raw-source state.
- The hard check TTL is 10 minutes. All-source failure retries after 60 seconds; only scientifically valid last-known-good evidence may be reused, labelled degraded.
- Private state uses `AURORA_STATE_BLOB_READ_WRITE_TOKEN`; production weather uses `OPEN_METEO_API_BASE` and `OPEN_METEO_API_KEY`.
- Git snapshots are only a bundled cold-start fallback. Do not add a commit/deploy scheduler as the liveness mechanism.
- Exactly 23 approved routes are indexable and in the sitemap. `/view` stays `noindex,follow`; unknown forecast routes and `/forecast/boston` stay 404.
- US English, no login, no ads, no percentage chances, and no request-path geocoder remain product constraints.

## Current local gate

```bash
npm ci
npm test
npx tsc --noEmit
npm run build
npm run start -- -p 3107
BASE_URL=http://127.0.0.1:3107 npm run test:seo
```

The npm audit acceptance and its exact five-advisory baseline are documented in `README.md`. A changed advisory set, Critical severity, or changed reachability is a blocker.
