# Northern Lights Tonight Launch Hardening Specification

**Status:** Approved and frozen on 2026-08-25 (Asia/Shanghai).

**Product:** `aurora-tonight.com`

**Baseline:** `origin/main` at `a92462e`

**Purpose:** Close the verified launch audit findings for a commercial SEO acquisition product without changing its URL inventory, forecast algorithm, Wave 1 place set, or visual direction.

## 1. Authority and supersession

After approval, this specification supersedes only these earlier decisions:

- `设计简报增补｜数据管道二期-20260823.md` §§2.1, 7.5, and 7.6 may no longer allow the first request after expiry to receive stale HTML or stale raw-cache state.
- The same document's §§1 and 9 no longer exclude Open-Meteo commercial licensing, independent monitoring, or truthful refresh copy from launch scope.
- `上线｜执行方案.md` no longer authorizes GA4 or continued commercial deployment on Vercel Hobby.

All other PRD and launch constraints remain binding, especially the 23-URL indexability whitelist, `/view` noindex behavior, `/forecast/boston` 404, current Wave 1 geography, and existing verdict-engine semantics.

## 2. Execution contract

```yaml
goal: Produce one reviewed release candidate that closes every P0/P1 and the enumerated P2 audit finding, then verify the deployed production artifact.
in_scope:
  - commercial hosting and weather-source compliance
  - truthful, hard-bounded request-time freshness
  - cookie-free, query-redacted analytics with a simple browser opt-out
  - monitoring and Blob persistence observability
  - sitemap, metadata, accessibility, CSP, README, and keyword-file hygiene
  - automated unit, engine, parity, SEO route, build, and deployed smoke checks
out_of_scope:
  - Wave 2 locations, maps, accounts, ads, subscriptions, or redesign
  - changing the scientific GO/MAYBE/NO algorithm or existing engine fixtures
  - Next.js 16 major upgrade or unrelated dependency cleanup
  - changing public URLs, canonical host, or GSC property
acceptance_criteria:
  - all criteria in sections 3 through 9 pass
  - Kimi K3 final audit reports no open P0/P1 and no unadjudicated in-scope P2
assumptions:
  - commercial intent follows the user's description "SEO 获客项目"
  - Vercel Pro and Open-Meteo API Standard are the minimum preferred paid services
  - external credentials are supplied only through sensitive server-side environment variables
risk_level: high
allowed_paths:
  - app/**
  - components/**
  - content/**
  - lib/**
  - scripts/**
  - .github/workflows/ci.yml
  - package.json
  - package-lock.json
  - next.config.ts
  - README.md
  - CODEX-HANDOFF.md
  - 上线｜执行方案.md
  - 设计简报增补｜数据管道二期-20260823.md
  - sem_关键词明细_northern-lights-tonight_20260820_13p1300r.csv
  - docs/operations/**
  - docs/superpowers/**
  - .superpowers/sdd/**
change_budget: No new runtime dependency other than the already-reviewed @vercel/analytics; keep @vercel/blob exactly pinned at 2.8.0; no schema or public API change beyond additive diagnostics fields.
validation_budget: Targeted tests per task, one full local suite after the final code change, one preview verification, one production verification.
approval_boundaries:
  - paid subscription or checkout
  - secret creation/rotation
  - external monitor creation
  - push, PR mutation, merge, or production deployment
  - deletion of the old public Blob store or closing superseded PRs
```

## 3. Commercial platform and data-source compliance

1. The Vercel team must be Pro or Enterprise before commercial launch. Hobby is not acceptable.
2. Production cloud data must use `https://customer-api.open-meteo.com/v1/forecast` with a valid commercial API key.
3. The free `api.open-meteo.com` endpoint is allowed only in local development, automated tests, and non-public preview evaluation.
4. Production misconfiguration must fail closed: no request may be sent to the free endpoint. Aurora-only evidence may still produce the existing conservative result; cloud absence must never permit GO.
5. Secrets use server-only names:
   - `OPEN_METEO_API_BASE`
   - `OPEN_METEO_API_KEY`
   - `AURORA_STATE_BLOB_READ_WRITE_TOKEN`
6. No secret or complete authenticated URL may appear in HTML, logs, error text, headers, Blob state, fingerprints, or source control.
7. Every page that renders Open-Meteo-derived verdicts carries linked credit to Open-Meteo and CC BY 4.0 plus an explicit adaptation statement. A shared footer on those pages is acceptable.

## 4. Hard freshness contract

1. Live-data pages are request-rendered, not Full Route Cache/ISR artifacts:
   - `/`
   - all 15 `/forecast/{slug}` pages
   - `/guides/where-to-see-northern-lights`
2. `/api/snapshots/latest` and `/api/health` are dynamic and `no-store`.
3. Raw-source state has a hard check TTL of 600 seconds. A state is expired when `request_now - checked_at >= 600_000 ms`; at that boundary the request waits for a refresh attempt and must not first return the expired state as though it were current.
4. A new private Vercel Blob store holds versioned state. Origin reads bypass CDN cache. The exactly pinned `@vercel/blob@2.8.0` uses its documented ETag/`ifMatch` conditional-write contract and `BlobPreconditionFailedError`; a 40-second lease prevents cross-isolate refresh stampedes. Initial creation is a non-overwriting fixed-path write, and an ambiguous creation error is resolved by an origin reread rather than guessed from an error string. Module-level `inflight` remains an optimization only.
5. A successful or failed upstream check advances `checked_at`; `last_success_at` advances only when at least one live source succeeds validation.
6. All-source failure sets `retry_after = checked_at + 60 seconds`; this earlier due time overrides the normal 600-second TTL. A negative state is reusable only while `now < retry_after`, and must refresh at equality. Scientifically valid LKG envelopes may be recomputed at the current `now` and must be labelled degraded. Invalid evidence fails closed to UNKNOWN/503, never an old unlabelled GO.
7. Existing source gates remain:
   - OVATION: degraded after 45 minutes, invalid after 90 minutes.
   - Kp: must cover `now` through `now + 18h`; a failed current check is degraded, not automatically invalid while coverage remains valid.
   - Cloud: degraded when the latest successful fetch is older than 30 minutes; invalid after 6 hours or when hourly coverage no longer includes the remaining local-night window.
8. `generated_at` remains computation time. `checked_at` is check time. `updated_at` remains the real contributing source time when degraded. These fields must never be substituted for one another.
9. Visible copy becomes truthful: it may say checks are reused for up to 10 minutes, but may not promise that an already-open document updates itself unless a client refresh mechanism is actually implemented.
10. Rendered live pages expose non-secret `data-snapshot-revision` and `data-snapshot-checked-at` markers for mechanical verification.

## 5. Privacy and analytics

1. Remove all GA4/GTM runtime code and Google analytics origins from CSP.
2. Use `@vercel/analytics` only after hydration with a `beforeSend` gate.
3. Page-view URLs must contain path only. `/view?lat=...&lng=...&name=...` must be recorded as `/view` with no query string.
4. Respect browser Do Not Track and a persistent browser-local opt-out exposed on `/privacy`.
5. Privacy copy names the categories actually reported by Vercel Web Analytics and does not claim more anonymity than the vendor documentation supports.
6. `GA_MEASUREMENT_ID` is removed from Vercel after the replacement deployment is verified.

## 6. Operations and security

1. Blob read, lease, CAS, validation, and write failures produce sanitized diagnostics.
2. `/api/health` exposes additive fields for snapshot revision, checked age, last-success age, source health, and persistence health.
3. Health is 503 when no scientifically usable aurora evidence exists, when checked age is at least 600 seconds at health evaluation, when the hard check contract cannot be established, or when the state store is unavailable and no in-contract state can be served.
4. A provider-independent monitoring runbook defines:
   - `GET /api/health` every 5 minutes;
   - alert after three consecutive failures;
   - named email receiver;
   - a separate rendered-page freshness check on a rotating forecast URL every 15 minutes.
   `/api/health` resolves through the same hard-refresh path as live pages, so it is legitimate request traffic and may keep state warm. It is not a correctness dependency: if monitoring stops, the next live page request still enforces the same 600-second contract. Idle-after-expiry first-hit behavior is proven in Preview and once against Production before monitoring is enabled.
5. The current Blob write token and all new tokens are Sensitive in Vercel.
6. The old public Blob store remains untouched for rollback until a later destructive cleanup approval.

## 7. SEO and content invariants

1. Exactly 23 URLs remain in sitemap and remain indexable.
2. `/view`, API routes, `/forecast/boston`, and unknown paths remain outside sitemap and noindex/404 as applicable.
3. Every indexable URL returns 200 with one H1, unique title, self-canonical, Open Graph image, and Twitter large-card metadata.
4. Sitemap omits `lastModified` unless a value is derived from a real significant content change. PR #33's `new Date()` behavior is forbidden.
5. Structured data remains valid JSON and visible FAQ text matches FAQPage data.
6. Search intent and content architecture remain unchanged.

## 8. Enumerated P2 closure

1. Backdrop dismissal of Find Place restores focus to its trigger.
2. The exact-duplicate keyword CSV rows are removed while preserving first-seen order: 830 data rows plus one header remain.
3. README and handoff documents describe the actual live/indexable architecture and current commands.
4. Old GA CSP origins are removed.
5. Three npm high advisories are documented as accepted, currently unreachable risk; Next 16 migration remains a separate post-launch project. This is risk closure, not a claim that the advisories disappeared.
6. PRs #27, #32, and #34 are incorporated or superseded. PR #33 is superseded, not merged as written.

## 9. Verification and release gate

### Local

- `npm ci`
- `npm test` runs unit, Python engine, and TypeScript/Python parity suites with zero failures.
- `npx tsc --noEmit`
- `npm run build`
- Production-mode `next start` route audit reports 23/23 valid indexable URLs and zero internal broken links.
- Fault tests prove TTL boundaries 599/600/601 seconds, negative-retry boundaries 59/60/61 seconds, lease takeover, CAS conflict handling, source ageing, Blob failure, and secret redaction.

### Preview

- Idle more than 10 minutes, then first-hit `/`, the where guide, and representative forecast pages: `checked_at` age is at most 600 seconds plus the measured synchronous request duration.
- 20 concurrent expiry requests create one winning revision and no late write overwrites it.
- Production-like missing commercial configuration sends zero requests to the free Open-Meteo endpoint.
- Fault injection never renders an out-of-contract GO.
- Mobile lab run: SEO, Accessibility, and Best Practices are 100; Performance is at least 90 and LCP at most 2.5 seconds, or a measured blocker remains open.

### Production

- Vercel plan is Pro/Enterprise.
- Commercial Open-Meteo endpoint, private Blob token, and analytics settings are present and Sensitive where applicable.
- Before enabling the external monitor, a controlled idle period longer than 10 minutes proves the exact Production SHA refreshes on its first live-page response. External monitor cadence and receiver are then evidenced for 24 hours.
- The deployed commit may differ after PR merge, but its Git tree hash must equal the final Kimi-reviewed release tree hash.
- Final deployed route matrix, headers, analytics network behavior, and first-hit freshness all pass against the exact deployed SHA.
- GSC sitemap remains successful with 23 discovered URLs.

### Cross-model completion rule

After every implementation task, Kimi K3 receives the frozen task brief, report, tests, and full diff through `cross-cli-audit`. A task is complete only when Kimi reports spec PASS, quality APPROVED, and no open Critical/Important finding. The final release candidate requires a fresh whole-branch Kimi audit. In-scope Minor findings are fixed; out-of-scope findings require an explicit recorded ruling rather than silent deferral.

## 10. Plan-audit execution notes

The final Kimi K3 plan audit returned PASS with no Critical or Important findings. Its remaining Minor findings are resolved in the implementation plan as follows:

1. `SourceResolution` is an explicit usable/failed-closed discriminated union; failed-closed output can only become sanitized bundled UNKNOWN with health 503.
2. `lib/snapshots.ts` has an explicit nullable-freshness type and cast-removal obligation.
3. The privacy toggle updates same-tab state directly; the browser `storage` event is cross-tab synchronization only.
4. Secret guards derive a fresh non-empty list from the two resolved server-side secret values at every call site.
5. The monitoring runbook records the bounded 60-second negative-retry request cost and the separate Blob-operations watch item.
