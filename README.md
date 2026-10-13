# Northern Lights Tonight

US-English local aurora **GO / MAYBE / NO** tool + state/city SEO pages.

This repo is the product. The custom domain, **https://aurora-tonight.com**, is public and indexable. Its sitemap contains the 23 approved acquisition routes; transient `/view` URLs remain noindex.

## Runtime

Live-data pages perform the freshness check at request time. Raw-source state is reused for at most 10 minutes; at expiry, that request waits for a hard refresh attempt instead of serving the expired state first. An all-source failure retries after 60 seconds and may use scientifically valid last-known-good evidence with a degraded label. Git snapshots are a bundled cold-start fallback for APIs and health, not a cacheable page source: `/` and `/forecast/*` throw instead of writing fallback HTML into the 10-minute ISR cache, so a failed revalidation keeps the last good page. Those routes are not prerendered at build time.

The request-time live routes are `/`, all 15 `/forecast/{slug}` pages, and `/guides/where-to-see-northern-lights`. `/api/snapshots/latest` and `/api/health` are dynamic and `no-store`. Page markdown lives in `lib/bundled-markdown.json` so Workers do not read `content/` from disk.

The Cloudflare Workers target is `@opennextjs/cloudflare` 1.20.x. See [docs/deploy-cloudflare.md](docs/deploy-cloudflare.md) for the worker name, R2 buckets, env/secret list, and local `preview` acceptance. Production deploys via Cloudflare Workers Builds: every push to `main` builds and deploys automatically.

## Non-commercial validation production environment

The current public deployment and Open-Meteo free endpoint are for non-commercial validation only. Set:

- `APP_ENV=production`
- `OPEN_METEO_USAGE_MODE=noncommercial`

On Cloudflare, live source state uses the `AURORA_STATE_BUCKET` R2 binding (bucket `aurora-tonight-state`). To point an environment at the remote last-known-good (LKG) API instead, set all three of `AURORA_LKG_BASE_URL`, `AURORA_LKG_READ_TOKEN`, and `AURORA_LKG_WRITE_TOKEN`. See [docs/operations/lkg-store.md](docs/operations/lkg-store.md).

Do not set `OPEN_METEO_API_BASE` or `OPEN_METEO_API_KEY` in this mode. The application uses only `https://api.open-meteo.com/v1/forecast` and fails closed if a key or a different base URL is configured. Keep all server-side variables out of source control and client-visible variables.

Before adding advertising, subscriptions, affiliate revenue, sponsorship, paid lead generation, or any other commercial use, remove `OPEN_METEO_USAGE_MODE=noncommercial`, and configure `OPEN_METEO_API_BASE=https://customer-api.open-meteo.com/v1/forecast` plus a non-empty `OPEN_METEO_API_KEY`. Reassess the providers' current terms before monetization.

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
npm run lint
npm run cf-build
npm run test:worker-size
```

The SEO release check (`npm run start` + `npm run test:seo`) is intentionally not run as a serverless CI step. Cloudflare preview acceptance is `npm run preview` plus `BASE_URL=http://127.0.0.1:8787 npm run test:cf-preview`.

## Accepted npm audit baseline

`npm audit --omit=dev --json` currently reports three package-level High entries (`next`, transitive `postcss`, and transitive `sharp`), zero Critical entries, and exactly five underlying advisories:

- `GHSA-qx2v-qp2m-jg93`
- `GHSA-6g55-p6wh-862q`
- `GHSA-fxqj-rqcc-2cmp`
- `GHSA-r28c-9q8g-f849`
- `GHSA-f88m-g3jw-g9cj`

This is an accepted, currently unreachable launch risk, not a claim that the vulnerabilities are fixed. The PostCSS advisories require attacker-controlled CSS or source-map directives to be parsed/stringified with filesystem access; production only builds trusted repository CSS and accepts no user CSS. The sharp advisory requires attacker-controlled image bytes to reach sharp/libvips; the launch product accepts no uploads and performs no request-time transformation of user-supplied images. The `next` entry aggregates those two transitive paths and has no separate underlying advisory in this baseline.

Any new advisory ID, any Critical, or either precondition becoming reachable blocks release. This branch upgrades Next to 16.3.8 for the Cloudflare Workers adapter. Re-run `npm audit --omit=dev` after install and refresh this baseline if the advisory set changes. Do not use `npm audit fix --force`.
