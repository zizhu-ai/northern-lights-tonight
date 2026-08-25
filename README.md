# Northern Lights Tonight

US-English local aurora **GO / MAYBE / NO** tool + state/city SEO pages.

This repo is the product. The custom domain, **https://aurora-tonight.com**, is public and indexable. Its sitemap contains the 23 approved acquisition routes; transient `/view` URLs remain noindex.

## Runtime

Live-data pages perform the freshness check at request time. Raw-source state is reused for at most 10 minutes; at expiry, that request waits for a hard refresh attempt instead of serving the expired state first. An all-source failure retries after 60 seconds and may use scientifically valid last-known-good evidence with a degraded label. Git snapshots are a bundled cold-start fallback, not the site's liveness source.

The request-time live routes are `/`, all 15 `/forecast/{slug}` pages, and `/guides/where-to-see-northern-lights`. `/api/snapshots/latest` and `/api/health` are dynamic and `no-store`.

## Non-commercial validation production environment

The current Vercel Hobby deployment and Open-Meteo free endpoint are for non-commercial validation only. Set:

- `OPEN_METEO_USAGE_MODE=noncommercial`
- `AURORA_STATE_BLOB_READ_WRITE_TOKEN`

Do not set `OPEN_METEO_API_BASE` or `OPEN_METEO_API_KEY` in this mode. The application uses only `https://api.open-meteo.com/v1/forecast` and fails closed if a key or a different base URL is configured. Keep all server-side variables out of source control and client-visible variables; mark the Blob token Sensitive in Vercel.

Before adding advertising, subscriptions, affiliate revenue, sponsorship, paid lead generation, or any other commercial use, upgrade Vercel to an appropriate commercial plan, remove `OPEN_METEO_USAGE_MODE=noncommercial`, and configure `OPEN_METEO_API_BASE=https://customer-api.open-meteo.com/v1/forecast` plus a non-empty `OPEN_METEO_API_KEY`. Reassess the providers' current terms before monetization.

## Develop

```bash
npm ci
npm run dev
```

## Verify

```bash
npm run test:unit
npm run test:engine
npm run test:parity
npm test
npx tsc --noEmit
npm run build
npm run start -- -p 3107
BASE_URL=http://127.0.0.1:3107 npm run test:seo
```

The SEO release check requires the production server lifecycle shown above; it is intentionally not run as a serverless CI step.

## Accepted npm audit baseline

`npm audit --omit=dev --json` currently reports three package-level High entries (`next`, transitive `postcss`, and transitive `sharp`), zero Critical entries, and exactly five underlying advisories:

- `GHSA-qx2v-qp2m-jg93`
- `GHSA-6g55-p6wh-862q`
- `GHSA-fxqj-rqcc-2cmp`
- `GHSA-r28c-9q8g-f849`
- `GHSA-f88m-g3jw-g9cj`

This is an accepted, currently unreachable launch risk, not a claim that the vulnerabilities are fixed. The PostCSS advisories require attacker-controlled CSS or source-map directives to be parsed/stringified with filesystem access; production only builds trusted repository CSS and accepts no user CSS. The sharp advisory requires attacker-controlled image bytes to reach sharp/libvips; the launch product accepts no uploads and performs no request-time transformation of user-supplied images. The `next` entry aggregates those two transitive paths and has no separate underlying advisory in this baseline.

Any new advisory ID, any Critical, or either precondition becoming reachable blocks release. The available fix is a semver-major upgrade to Next 16; that migration is a separate post-launch project with its own compatibility and regression work. Do not use `npm audit fix --force` to fold it into launch hardening.
