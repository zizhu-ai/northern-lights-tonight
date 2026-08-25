# Northern Lights Tonight Launch Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce and verify a commercially compliant, privacy-safe, hard-fresh release candidate for `aurora-tonight.com`, then prove the exact production deployment meets every frozen launch criterion.

**Architecture:** Replace two layers of stale-while-revalidate with dynamic server rendering backed by a private Blob `SnapshotStateV2` hard-TTL store. A request may reuse a check for 600 seconds; after expiry it synchronously establishes a fresh check before rendering, with ETag/CAS lease coordination and conservative LKG fallback. Existing product fixes are integrated, then privacy, operations, SEO, accessibility, and documentation are closed in small reviewed commits.

**Tech Stack:** Next.js 15.5.x App Router, React 19, TypeScript 5.9, Node 22 built-in test runner, Python 3.12 unittest, exactly pinned Vercel Blob 2.8.0, Vercel Web Analytics 2.x.

**Spec:** `docs/superpowers/specs/2026-08-24-launch-hardening.md`

## Global Constraints

- Work only in the dedicated `codex/launch-hardening` worktree based on `origin/main` `a92462e`.
- Codex Sol (`gpt-5.6-sol`, reasoning `medium`) implements every code task; it must not spawn subagents.
- Kimi K3 audits every task through `cross-cli-audit`; Kimi never edits files and receives a prompt smaller than 256 KiB.
- Preserve exactly 23 indexable URLs, `/view` noindex, `/forecast/boston` 404, and the current Wave 1 place set.
- Do not change the scientific forecast algorithm, golden fixtures, or verdict meaning.
- Do not add a scheduler as a data-correctness dependency.
- Do not add runtime packages beyond `@vercel/analytics`; retain `@vercel/blob` exactly pinned at `2.8.0`.
- Do not perform a Next.js 16 major upgrade in this plan.
- Never place credentials in git, client bundles, logs, errors, headers, Blob contents, or review artifacts.
- Local commits are authorized. Push, PR mutation, paid checkout, secret changes, monitor creation, merge, and production release require the approval recorded in Task 7.
- Per-task Kimi gate: `SPEC: PASS`, `QUALITY: APPROVED`, no Critical/Important findings. Fix loops use the same Sol medium implementer for rounds 1–3 and a fresh Sol medium implementer for rounds 4–5.

---

### Task 1: Assemble the safe candidate and replace analytics

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/privacy/page.tsx`
- Modify: `app/page.tsx`
- Modify: `app/view/page.tsx`
- Modify: `app/near-me/page.tsx`
- Modify: `app/methodology/page.tsx`
- Modify: `app/terms/page.tsx`
- Modify: `app/guides/best-time-to-see-northern-lights/page.tsx`
- Modify: `app/guides/how-to-see-northern-lights/page.tsx`
- Modify: `app/guides/where-to-see-northern-lights/page.tsx`
- Modify: `components/verdict-card.tsx`
- Modify: `content/ui-copy.json`
- Modify: `lib/site.ts`
- Modify: `next.config.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `lib/analytics-privacy.ts`
- Create: `lib/analytics-privacy.test.ts`
- Create: `components/privacy-analytics.tsx`
- Create: `components/analytics-preference.tsx`
- Integrate commits: `00df88f`, `7ea94e9`, `5d9079e`

**Interfaces:**
- Consumes: existing root layout, privacy page, CSP, and the three reviewed PR commits.
- Produces:

```ts
export const ANALYTICS_OPT_OUT_KEY = "nlt_analytics_opt_out";

export type AnalyticsPageEvent = { url: string; [key: string]: unknown };

export function sanitizeAnalyticsEvent<T extends AnalyticsPageEvent>(
  event: T,
  disabled: boolean,
): T | null;

export function browserAnalyticsDisabled(storageValue: string | null, dnt: string | null): boolean;
```

- `PrivacyAnalytics` renders `@vercel/analytics` with `beforeSend` and never sends a URL query string.
- `AnalyticsPreference` exposes one keyboard-operable button on `/privacy` that toggles the browser-local opt-out.

- [ ] **Step 1: Integrate the three reviewed commits**

Preflight before any cherry-pick:

```bash
git worktree list
git branch --show-current
git rev-parse HEAD
git merge-base --is-ancestor a92462e HEAD
```

Expected: the resolved current worktree is `/private/tmp/nlt-launch-hardening.V59n14`, current branch is `codex/launch-hardening`, `HEAD` is exactly `a92462e40057b213476cb103b72af32a421b3350`, and the ancestry check exits zero. Stop on any mismatch.

Run, in this order:

```bash
git cherry-pick 00df88fef41374d45b3b2d0965d528280896b8f8
git cherry-pick 7ea94e9af128d5ecbf04d20ce84838b3ad364ca6
git cherry-pick 5d9079e7c8a3ce07160c3f1d84c67dfe45ea4215
```

Expected: three clean commits; the cherry-picks introduce nothing from PR #33.

- [ ] **Step 2: Write failing privacy tests**

Create `lib/analytics-privacy.test.ts` with these cases:

```ts
test("drops events when local opt-out is enabled", () => {
  assert.equal(sanitizeAnalyticsEvent({ url: "/" }, true), null);
});

test("strips every query and hash from page URLs", () => {
  assert.deepEqual(
    sanitizeAnalyticsEvent({ url: "/view?lat=42&lng=-71&name=Home#forecast" }, false),
    { url: "/view" },
  );
});

test("treats DNT=1 and stored 1 as disabled", () => {
  assert.equal(browserAnalyticsDisabled(null, "1"), true);
  assert.equal(browserAnalyticsDisabled(null, "yes"), true);
  assert.equal(browserAnalyticsDisabled("1", "0"), true);
  assert.equal(browserAnalyticsDisabled(null, "0"), false);
});
```

- [ ] **Step 3: Run the tests and confirm red state**

Run:

```bash
node --experimental-strip-types --test lib/analytics-privacy.test.ts
```

Expected: FAIL because `lib/analytics-privacy.ts` does not exist.

- [ ] **Step 4: Implement privacy-safe analytics**

Implement `sanitizeAnalyticsEvent` with `new URL(event.url, "https://aurora-tonight.com")`, returning the original event fields with `url: parsed.pathname`; invalid URLs return `null`. Implement `PrivacyAnalytics` as a client component that checks DNT and `localStorage` in `beforeSend`. Implement `AnalyticsPreference` with `aria-pressed`, opt-out/opt-in labels, immediate local component-state updates after its own toggle, and a `storage` listener only for cross-tab synchronization.

Replace the direct `<Analytics />` introduced by cherry-picked commit `00df88f` (PR #27) with `<PrivacyAnalytics />`; PR #33 is never integrated. Add `<AnalyticsPreference />` below the Analytics paragraph. Privacy prose must disclose anonymous path, referrer, coarse location/device categories, no third-party cookies, no stored IP, and the opt-out.

Remove all `googletagmanager.com`, `google-analytics.com`, and `analytics.google.com` origins from `next.config.ts` CSP. Do not add a third-party Vercel origin because intake is same-origin.

- [ ] **Step 5: Prove Task 1 behavior**

Run:

```bash
node --experimental-strip-types --test lib/analytics-privacy.test.ts
npx tsc --noEmit
npm run build
rg -n "gtag|googletagmanager|google-analytics|GA_MEASUREMENT_ID" app components lib next.config.ts
```

Expected: tests, type-check, and build PASS; final `rg` has no runtime-code match.

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx app/privacy/page.tsx components/privacy-analytics.tsx components/analytics-preference.tsx lib/analytics-privacy.ts lib/analytics-privacy.test.ts next.config.ts package.json package-lock.json
git commit -m "fix: make analytics privacy-safe"
```

After the commit, generate the task review package and run the Kimi K3 gate. Resolve findings before Task 2.

---

### Task 2: Enforce commercial Open-Meteo configuration and attribution

**Files:**
- Create: `lib/open-meteo-config.ts`
- Create: `lib/open-meteo-config.test.ts`
- Modify: `lib/aurora-sources.ts`
- Modify: `components/site-chrome.tsx`
- Modify: `content/ui-copy.json`
- Modify: `app/privacy/page.tsx`
- Modify: `content/guides/methodology.md`

**Interfaces:**

```ts
export type OpenMeteoEnvironment = {
  VERCEL_ENV?: string;
  OPEN_METEO_API_BASE?: string;
  OPEN_METEO_API_KEY?: string;
  AURORA_CLOUD_URL?: string;
};

export type OpenMeteoConfig = {
  baseUrl: string;
  apiKey: string | null;
};

export function resolveOpenMeteoConfig(env: OpenMeteoEnvironment): OpenMeteoConfig;
export function appendOpenMeteoCredential(url: URL, config: OpenMeteoConfig): URL;
export function redactOpenMeteoError(error: unknown, secret?: string): string;
```

- Production means `VERCEL_ENV === "production"`.
- Production accepts only hostname `customer-api.open-meteo.com` and a non-empty key.
- Local/test/preview may default to `https://api.open-meteo.com/v1/forecast` for evaluation.
- `AURORA_CLOUD_URL` is a fault-injection override only outside production. Production ignores it outright and resolves solely from `OPEN_METEO_API_BASE` plus the required key, then validates the customer hostname.
- The key is appended only after all non-secret query parameters are constructed.

- [ ] **Step 1: Write failing configuration and redaction tests**

Cover:

```ts
test("production rejects the free endpoint");
test("production rejects a missing API key");
test("production returns customer endpoint and appends apikey");
test("preview may use the free evaluation endpoint");
test("fault-injection override works outside production");
test("production ignores AURORA_CLOUD_URL even when it names the free endpoint");
test("redacted errors never contain sentinel key or authenticated URL");
```

Use `SENTINEL_OPEN_METEO_KEY_DO_NOT_LEAK` and assert it is absent from every serialized error and returned non-request object.

- [ ] **Step 2: Run the tests and confirm red state**

```bash
node --experimental-strip-types --test lib/open-meteo-config.test.ts
```

Expected: FAIL because the module is absent.

- [ ] **Step 3: Implement commercial endpoint enforcement**

Move cloud configuration out of `sourceUrl()` into `resolveOpenMeteoConfig()`. `fetchCloud()` constructs every latitude/longitude/hourly/timezone parameter on a URL from `config.baseUrl`, then calls `appendOpenMeteoCredential()` as the final URL-building step. It catches configuration errors as a cloud-source failure before invoking `fetch`; production misconfiguration therefore sends zero requests to the free endpoint and follows the existing missing-cloud conservative gate.

Never include the API key in the source fingerprint; fingerprint only validated response payload.

- [ ] **Step 4: Add linked attribution**

Replace the plain footer source sentence with rendered links and this meaning:

```text
Aurora data: NOAA SWPC. Cloud-cover data adapted from Open-Meteo under CC BY 4.0.
```

`Open-Meteo` links to `https://open-meteo.com/`; `CC BY 4.0` links to `https://creativecommons.org/licenses/by/4.0/`. Add the same adaptation fact to privacy and methodology, without duplicating full legal prose.

- [ ] **Step 5: Prove Task 2 behavior**

```bash
node --experimental-strip-types --test lib/open-meteo-config.test.ts
npx tsc --noEmit
npm run build
rg -n "api\.open-meteo\.com|customer-api\.open-meteo\.com|OPEN_METEO_API_KEY" app components content lib
```

Expected: tests/build PASS; matches are limited to configuration code, tests, and truthful documentation; no key value exists.

- [ ] **Step 6: Commit**

```bash
git add lib/open-meteo-config.ts lib/open-meteo-config.test.ts lib/aurora-sources.ts components/site-chrome.tsx content/ui-copy.json app/privacy/page.tsx content/guides/methodology.md
git commit -m "fix: enforce licensed weather source"
```

Run the Kimi K3 task gate and resolve findings before Task 3.

---

### Task 3: Build the private Blob hard-TTL state store

**Files:**
- Create: `lib/snapshot-store.ts`
- Create: `lib/snapshot-store.test.ts`
- Modify: `lib/aurora-sources.ts` only if a shared source-outcome type is needed

**Interfaces:**

```ts
export const SNAPSHOT_STATE_SCHEMA_VERSION = 2 as const;
export const CHECK_TTL_MS = 600_000;
export const NEGATIVE_RETRY_MS = 60_000;
export const LEASE_TTL_MS = 40_000;

export type SourceOutcome = {
  status: "ok" | "error";
  checked_at: string;
  error_code: string | null;
};

export type SnapshotStateV2 = {
  schema_version: 2;
  revision: string;
  checked_at: string;
  last_success_at: string | null;
  retry_after: string | null;
  envelopes: RawSourceEnvelopes;
  outcomes: Record<SourceName, SourceOutcome>;
  lease: { owner: string; expires_at: string } | null;
};

export type StoredSnapshotState = { state: SnapshotStateV2; etag: string };

export interface SnapshotStore {
  read(): Promise<StoredSnapshotState | null>;
  compareAndSwap(expectedEtag: string | null, next: SnapshotStateV2): Promise<"written" | "conflict">;
}

export function createVercelSnapshotStore(env?: NodeJS.ProcessEnv): SnapshotStore;
export function isCheckFresh(state: SnapshotStateV2, now: Date): boolean;
export function canAcquireLease(state: SnapshotStateV2 | null, now: Date): boolean;
export function stateContainsAnySecret(state: SnapshotStateV2, secrets: readonly string[]): boolean;
```

The production store uses pathname `aurora/state/source-state-v2.json`, `access: "private"`, and `AURORA_STATE_BLOB_READ_WRITE_TOKEN`. Reads use `useCache: false`. Existing-state writes use `addRandomSuffix: false` plus the read ETag as `ifMatch`; `ifMatch` implies overwrite permission in the pinned SDK. A missing-state write uses the same fixed pathname with `allowOverwrite: false` as an atomic create-only operation. The official Vercel contracts are [Conditional writes](https://vercel.com/docs/vercel-blob#conditional-writes) and the [`@vercel/blob` SDK error contract](https://vercel.com/docs/vercel-blob/using-blob-sdk#handling-errors); the pinned 2.8.0 declaration and implementation must expose `ifMatch` and `BlobPreconditionFailedError` before adapter work begins.

`isCheckFresh()` computes one due time: `retry_after` for an all-source-negative state, otherwise `checked_at + CHECK_TTL_MS`. It returns true only while `now < due`; equality is stale. This makes the 60-second negative retry override the otherwise fresh 10-minute `checked_at`.

Every persistence call first requires a resolved, non-empty `AURORA_STATE_BLOB_READ_WRITE_TOKEN`, then builds the secret-scan list at call time from that value plus `OPEN_METEO_API_KEY` when set. Unit tests pass explicit sentinel values. No empty, cached, or arbitrary caller-selected list may weaken this guard.

The 40-second lease is deliberately shorter than the 60-second function budget. Normal source work is bounded below 40 seconds by the existing parallel 8-second-per-attempt fetch policy. If a slow but still-alive winner crosses 40 seconds, one takeover may duplicate upstream fetches; ETag/CAS still permits only the current lease ETag to publish, so this is an accepted bounded cost, not a correctness failure. The late-writer test must prove that guarantee.

- [ ] **Step 1: Write failing pure contract tests**

Test exact 599/600/601-second TTL boundaries, 59/60/61-second negative-retry boundaries, future-clock rejection, expired/live leases, runtime schema rejection, multi-secret scanning, and initial/existing CAS semantics using a fake store. Include a missing-state race where an ambiguous create error is followed by a reread that observes the winner and returns `"conflict"`.

- [ ] **Step 2: Confirm red state**

```bash
node --experimental-strip-types --test lib/snapshot-store.test.ts
```

Expected: FAIL because the store module is absent.

- [ ] **Step 3: Implement state validation and the Vercel adapter**

First compile a direct import/use of `put(..., { ifMatch })` and `BlobPreconditionFailedError` against the installed exact SDK. Use manual runtime guards; do not add a schema package. Map `BlobPreconditionFailedError` to `"conflict"`. For an initial create-only write error, reread from origin: return `"conflict"` only if valid state now exists, otherwise rethrow a sanitized internal error. Rethrow auth, network, and validation failures as sanitized internal errors. No raw vendor error object may cross this adapter.

- [ ] **Step 4: Prove Task 3 behavior**

```bash
node --experimental-strip-types --test lib/snapshot-store.test.ts
npx tsc --noEmit
```

Expected: PASS, including zero sentinel-secret occurrences in serialized state/errors.

- [ ] **Step 5: Commit**

```bash
git add lib/snapshot-store.ts lib/snapshot-store.test.ts lib/aurora-sources.ts
git commit -m "feat: add hard-ttl snapshot state store"
```

Run the Kimi K3 task gate and resolve findings before Task 4.

---

### Task 4: Replace ISR freshness with synchronous hard-refresh rendering

**Files:**
- Create: `lib/hard-refresh-resolver.ts`
- Create: `lib/hard-refresh-resolver.test.ts`
- Modify: `lib/live-snapshots.ts`
- Modify: `lib/snapshots.ts`
- Modify: `app/page.tsx`
- Modify: `app/forecast/[slug]/page.tsx`
- Modify: `app/guides/where-to-see-northern-lights/page.tsx`
- Modify: `app/api/snapshots/latest/route.ts`
- Modify: `content/ui-copy.json`

**Interfaces:**

```ts
export type SnapshotFreshness = {
  revision: string;
  checked_at: string;
  last_success_at: string | null;
  persistence_health: "ok" | "degraded" | "unavailable";
};

export type HardRefreshRuntime = {
  now(): Date;
  ownerId(): string;
  sleep(milliseconds: number): Promise<void>;
  store: SnapshotStore;
  fetchSources: typeof fetchAuroraSources;
};

export type SourceResolution =
  | {
      kind: "usable";
      mode: "fresh_hit" | "refreshed" | "degraded_lkg";
      source: "live" | "lkg";
      envelopes: RawSourceEnvelopes;
      outcomes: Record<SourceName, SourceOutcome>;
      freshness: SnapshotFreshness;
    }
  | {
      kind: "failed_closed";
      mode: "failed_closed";
      reason: "state_unavailable" | "no_usable_aurora" | "refresh_unresolved";
      fallback: "bundled_unknown";
      persistence_health: "degraded" | "unavailable";
    };

// Exported from lib/hard-refresh-resolver.ts; this module uses only erased
// type imports and injected runtime functions so Node's strip-types runner
// never has to resolve Next's @/* alias.
export function createSourceResolver(runtime: HardRefreshRuntime): () => Promise<SourceResolution>;
export const getAuroraBundle: () => Promise<AuroraBundle>;
```

`lib/live-snapshots.ts` converts a usable resolution into the computed `AuroraBundle`. A failed-closed resolution goes only through the existing bundled-sanitization path, which must force every scientifically unsafe verdict to UNKNOWN and health to 503; it never fabricates a revision or check time. `AuroraBundle` therefore gains `freshness: SnapshotFreshness | null`. Existing fields and source labels remain available.

- [ ] **Step 1: Write failing resolver tests with injected fakes**

Tests must prove:

1. fresh state at 599 seconds causes zero upstream calls;
2. state at 600/601 seconds waits for a refresh attempt;
3. 20 concurrent calls in one isolate invoke `fetchSources` once;
4. a live foreign lease is polled, an expired lease is acquired;
5. winner crash permits takeover after 40 seconds;
6. late CAS write cannot replace a newer revision, including an original winner that finishes at 50 seconds after a 40-second takeover;
7. all-source failure sets 60-second retry, is reusable at 59 seconds, and forces a new attempt at 60/61 seconds while using only scientifically valid LKG;
8. OVATION >90m cannot drive GO;
9. cloud >30m is degraded and >6h/coverage-missing is invalid;
10. Blob failure without in-contract state fails closed;
11. sentinel credentials are absent from state and diagnostics.

- [ ] **Step 2: Confirm red state**

```bash
node --experimental-strip-types --test lib/hard-refresh-resolver.test.ts
```

Expected: FAIL because the pure hard-refresh resolver module is absent.

- [ ] **Step 3: Implement the hard-refresh resolver**

Implement the lease/CAS state machine in `lib/hard-refresh-resolver.ts` using injected functions and erased type-only imports. Remove the `unstable_cache` import and `cachedSourceEnvelopes` from `lib/live-snapshots.ts`; make it the Next/data adapter around the pure resolver. In `lib/snapshots.ts`, add `freshness: SnapshotFreshness | null` to `SnapshotBundle`, import that type, preserve it through `loadLatestWithMeta()`, and remove the unsafe cast if the concrete types now align. Keep React `cache()` for request/render deduplication and module `inflight` for same-isolate collapse.

When refresh completes, compute observations from the chosen envelopes at the current request `now`. `checked_at` records the attempt; UI `updated_at` continues to use source time on degradation. Never use `checked_at` to make old source data look new.

- [ ] **Step 4: Make every live-data route dynamic**

For `/`, forecast pages, and the where guide:

```ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;
```

Remove `force-static` and `revalidate=600`. Add `data-snapshot-revision` and `data-snapshot-checked-at` to the live page's top-level `<main>` or live section; use the literal `unavailable` for both only on the failed-closed/null-freshness path. Make `/api/snapshots/latest` dynamic/no-store and add:

```text
X-Snapshot-Revision
X-Snapshot-Checked-At
X-Snapshot-Last-Success-At
Cache-Control: private, no-store, max-age=0
```

Change `auto_refresh` copy to: `Sources are checked when requested and checks are reused for up to 10 minutes.`

- [ ] **Step 5: Prove Task 4 behavior**

```bash
node --experimental-strip-types --test lib/snapshot-store.test.ts lib/hard-refresh-resolver.test.ts
npm run test:engine
npm run test:parity
npx tsc --noEmit
npm run build
```

Expected: all PASS; build marks the three live page families and `/api/snapshots/latest` dynamic, not ISR. `/api/health` is changed and asserted in Task 5.

- [ ] **Step 6: Commit**

```bash
git add lib/hard-refresh-resolver.ts lib/hard-refresh-resolver.test.ts lib/live-snapshots.ts lib/snapshots.ts app/page.tsx 'app/forecast/[slug]/page.tsx' app/guides/where-to-see-northern-lights/page.tsx app/api/snapshots/latest/route.ts content/ui-copy.json
git commit -m "fix: enforce first-request forecast freshness"
```

Run the Kimi K3 task gate and resolve findings before Task 5.

---

### Task 5: Expose persistence health and define independent monitoring

**Files:**
- Modify: `lib/health.ts`
- Modify: `lib/health.test.ts`
- Modify: `app/api/health/route.ts`
- Create: `docs/operations/monitoring.md`

**Interfaces:**

```ts
export type HealthInput = {
  source: SnapshotSource;
  generated_at: string;
  freshness: SnapshotFreshness | null;
  locations: { status: string }[];
  source_observations: Record<SourceName, SourceObservation>;
};

export type HealthBody = {
  status: "ok" | "degraded" | "unhealthy";
  snapshot_revision: string;
  checked_at: string | null;
  checked_age_seconds: number | null;
  last_success_at: string | null;
  persistence_health: SnapshotFreshness["persistence_health"];
  source: SnapshotSource;
  total: number;
  unknowns: number;
};
```

- [ ] **Step 1: Write failing health tests**

Add cases for fresh healthy state at 599 seconds (200), degraded but usable state (200 with `status=degraded`), checked age at exactly 600 and 601 seconds (503), unavailable persistence with no in-contract state (503), all UNKNOWN (503), and future clock values (503).

- [ ] **Step 2: Confirm red state**

```bash
node --experimental-strip-types --test lib/health.test.ts
```

- [ ] **Step 3: Implement additive diagnostics**

Make the route `force-dynamic`, `revalidate=0`, `maxDuration=60`, and explicitly set `Cache-Control: private, no-store, max-age=0` plus `X-Robots-Tag: noindex, nofollow`. `/api/health` must call the same hard-refresh resolver as the live pages before assessment; a health request may therefore refresh expired state. Preserve existing `source`, `unknowns`, `total`, and `generated_at` fields for monitor compatibility. The monitor is still not a correctness dependency because live pages enforce the same resolver when the monitor is absent.

- [ ] **Step 4: Write the exact monitoring runbook**

`docs/operations/monitoring.md` must define provider-neutral values:

```text
URL: https://aurora-tonight.com/api/health
Interval: 5 minutes
Timeout: 60 seconds
Success: HTTP 200 and JSON status in ["ok", "degraded"] and checked_age_seconds < 600
Incident: 3 consecutive failures
Recovery: 2 consecutive successes
Receiver: project owner email selected during Task 7
```

Define a separate rendered-page check every 15 minutes that chooses a rotating forecast slug and requires a 200 response whose `data-snapshot-checked-at` marker age is below 600 seconds at response completion. Do not wait for organically stale state: the 5-minute health request legitimately keeps the shared state warm. State explicitly that monitoring supplies ordinary request traffic but is not the refresh correctness mechanism; Preview and the controlled pre-monitor Production window prove the idle first-hit path.

Record the outage-abuse bound: with a 60-second negative retry and two current Open-Meteo batches, steady unauthenticated traffic can cause about 86,400 Open-Meteo HTTP requests per 30 days; one late lease takeover per cycle would conservatively double that to 172,800, still below the 1M plan allowance. Monitor Vercel Blob operations separately, and re-check the vendor's billable-unit definition at checkout.

- [ ] **Step 5: Prove Task 5 behavior**

```bash
node --experimental-strip-types --test lib/health.test.ts
npx tsc --noEmit
npm run build
```

Expected: PASS; the build output classifies `/api/health` as dynamic, and a production-mode response carries `Cache-Control: private, no-store, max-age=0` plus `X-Robots-Tag: noindex, nofollow`.

- [ ] **Step 6: Commit**

```bash
git add lib/health.ts lib/health.test.ts app/api/health/route.ts docs/operations/monitoring.md
git commit -m "feat: expose actionable forecast health"
```

Run the Kimi K3 task gate and resolve findings before Task 6.

---

### Task 6: Close SEO, accessibility, data, test, and documentation debt

**Files:**
- Modify: `components/find-place.tsx`
- Create: `scripts/check-seo.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `sem_关键词明细_northern-lights-tonight_20260820_13p1300r.csv`
- Modify: `README.md`
- Modify: `CODEX-HANDOFF.md`
- Modify: `上线｜执行方案.md`
- Modify: `设计简报增补｜数据管道二期-20260823.md`

**Interfaces:**

```text
npm run test:unit
BASE_URL=http://127.0.0.1:3107 npm run test:seo
```

`test:unit` runs every `lib/*.test.ts` file through Node's strip-types test runner. `check-seo.mjs` exits nonzero on any route invariant failure and prints one JSON summary.

- [ ] **Step 1: Fix focus restoration**

Replace backdrop `onClick={close}` with a handler that calls `close()` and then `triggerRef.current?.focus()`. Preserve Escape, close-button, and Tab-trap behavior.

- [ ] **Step 2: Add the SEO route checker**

The script must:

1. read the served sitemap;
2. require exactly 23 unique URLs on `https://aurora-tonight.com` paths;
3. fetch each path from `BASE_URL`;
4. require 200, `index,follow`, self-canonical, one H1, unique title/H1, OG image, `summary_large_image`, and valid JSON-LD;
5. crawl all internal anchor paths and reject any 4xx/5xx;
6. require `/view` and coordinate `/view` to be `noindex,follow` without canonical;
7. require `/forecast/boston` and an unknown path to return 404;
8. require sitemap entries to omit `lastmod` unless an allowlisted, content-derived value is later added.

- [ ] **Step 3: Run the pre-change checker and record expected failures**

Start the production build on port 3107, then run:

```bash
BASE_URL=http://127.0.0.1:3107 node scripts/check-seo.mjs
```

Expected before all metadata commits are integrated: at least the intended social-metadata invariant fails; after Task 1 integration it may already pass. Record the actual outcome rather than manufacturing a failure.

- [ ] **Step 4: Make all unit tests part of normal test and CI**

Set scripts to:

```json
{
  "test:unit": "node --experimental-strip-types --test lib/*.test.ts",
  "test": "npm run test:unit && npm run test:engine && npm run test:parity",
  "test:seo": "node scripts/check-seo.mjs"
}
```

Add `npm run test:unit` to CI before engine/parity. Do not run the server-based SEO check in GitHub CI unless the same task also adds deterministic server lifecycle management; it remains a release check otherwise.

- [ ] **Step 5: Deduplicate the keyword source file**

Remove exact duplicate full rows while preserving the BOM, header, and first-seen order. Verify:

```bash
wc -l sem_关键词明细_northern-lights-tonight_20260820_13p1300r.csv
tail -n +2 sem_关键词明细_northern-lights-tonight_20260820_13p1300r.csv | sort | uniq -d | wc -l
```

Expected: `831` newline-terminated lines total and `0` exact duplicate rows. The count is derived from the frozen input (1,301 logical rows including the header, 830 unique data rows), not a permanent product invariant.

- [ ] **Step 6: Correct operational documentation**

README must state that the custom domain is public/indexable, describe the hard-refresh runtime, list all required environment variable names without values, and give current test/build commands. Add a supersession banner to both old execution/design documents pointing to the approved spec. Update `CODEX-HANDOFF.md` so it no longer tells agents that Git snapshot commits are the liveness source.

Document the three package-level npm high vulnerabilities as an accepted unreachable-at-launch risk with their required preconditions and a separate Next 16 follow-up; do not run `npm audit fix --force`. Baseline the current five underlying advisory IDs: `GHSA-qx2v-qp2m-jg93`, `GHSA-6g55-p6wh-862q`, `GHSA-fxqj-rqcc-2cmp`, `GHSA-r28c-9q8g-f849`, and `GHSA-f88m-g3jw-g9cj`; any new ID, any Critical, or any changed reachability is a new blocker.

- [ ] **Step 7: Prove Task 6 behavior**

```bash
npm test
npx tsc --noEmit
npm run build
BASE_URL=http://127.0.0.1:3107 npm run test:seo
```

Keyboard/browser acceptance: open Find Place, click backdrop, and assert `document.activeElement` is the trigger. Repeat Escape and close-button paths.

- [ ] **Step 8: Commit**

```bash
git add components/find-place.tsx scripts/check-seo.mjs package.json .github/workflows/ci.yml sem_关键词明细_northern-lights-tonight_20260820_13p1300r.csv README.md CODEX-HANDOFF.md '上线｜执行方案.md' '设计简报增补｜数据管道二期-20260823.md'
git commit -m "chore: close launch audit debt"
```

Run the Kimi K3 task gate and resolve findings before Task 7.

---

### Task 7: Final local audit, approved external setup, and production proof

**Files:**
- No source edits unless the final review identifies an in-scope defect.
- Create scratch evidence only under this plan's `.superpowers/sdd/` workspace and `/tmp`.

**Interfaces:**
- Consumes: Tasks 1–6 reviewed commits.
- Produces: one reviewed release commit/tree pair, one deployed commit/tree pair, and a production evidence bundle.

- [ ] **Step 1: Run the fresh whole-branch local gate**

```bash
npm ci
npm test
npx tsc --noEmit
npm run build
npm audit --omit=dev --json
```

The audit command is expected to exit `1` for the frozen three-package/five-advisory baseline. Parse the JSON: only the five documented IDs with zero Critical findings is accepted; command exit alone does not decide the gate.

Start `next start` and run the SEO matrix. Run browser checks at desktop, 375px, and 320px if the connected browser supports it. Run mobile Lighthouse against the release candidate.

Fetch `origin/main` immediately before freezing the candidate. If it has advanced beyond the candidate's recorded base, integrate that exact tip locally, rerun every affected task gate plus this whole-branch gate, and obtain a fresh Kimi GO. Record reviewed commit `R` and `T=$(git rev-parse R^{tree})`; these exact identifiers are what Step 3 asks the user to release.

- [ ] **Step 2: Run the final Kimi K3 whole-branch audit**

Build a prompt containing the immutable spec, task ledger, complete diff from `a92462e`, concise test summaries, route matrix, dependency reachability, and performance evidence. Keep every Kimi input under 256 KiB. Prefer the full diff and compact/hash bulky logs; if spec plus full diff still exceeds 240 KiB, split the complete diff deterministically by file group into <=180 KiB Kimi audits, then give the final Kimi synthesis prompt the immutable spec, every chunk verdict/finding, diff manifest/hash, and compact verification evidence.

```bash
/Users/zizhu/.mirasim/skills/cross-cli-audit/scripts/run-audit.sh kimi /tmp/nlt-final-kimi-prompt.md nlt-launch-hardening-final /tmp/nlt-launch-hardening-audit readonly
```

Require `exit=0`, `stopReason=end_turn`, `VERDICT: GO` for the local candidate, and zero open P0/P1 or unadjudicated in-scope P2. Follow the five-round Sol/Kimi fix loop if required.

- [ ] **Step 3: Stop for the bundled external approval**

Present these exact actions and current costs/risks to the user. Approval may cover any subset, but Production launch is blocked until items 1–7 are all approved and completed. Partial approval only advances the corresponding pre-release work; it never authorizes a knowingly degraded commercial launch.

1. upgrade Vercel team `team_NqkWqLqodmx4EluSA0BiTk5Y` from Hobby to Pro (currently listed at USD 20/month plus usage);
2. purchase Open-Meteo API Standard (1M calls/month; checkout price must be shown by the vendor before purchase);
3. create and attach a private Vercel Blob store named `nlt-aurora-state-v2`;
4. set `OPEN_METEO_API_BASE`, `OPEN_METEO_API_KEY`, and `AURORA_STATE_BLOB_READ_WRITE_TOKEN` as Sensitive for Preview and Production;
5. mark the existing `BLOB_READ_WRITE_TOKEN` Sensitive and remove `GA_MEASUREMENT_ID` after the GA-free artifact is verified;
6. create the external monitor from `docs/operations/monitoring.md` and name the alert receiver;
7. push the reviewed commit `R`, open/update a PR, merge to `main`, and deploy Production; merge/squash/rebase is acceptable only if the resulting deployed commit's tree equals reviewed tree `T`. This approval also authorizes immediate rollback to the previously healthy Vercel Production deployment if any Production proof fails. A code fix creates a new `R`/`T` and requires a fresh release approval.
8. close superseded PRs #27, #32, #33, and #34 after the replacement PR is merged.
9. confirm read access to the existing Google Search Console property for the final sitemap check; if access is unavailable, stop at the GSC evidence gate rather than substituting an unauthenticated inference.

Do not execute unapproved items.

- [ ] **Step 4: Verify Preview after approved setup**

Run all Preview criteria from spec §9, including idle first-hit, 20-way concurrency, secret leak scan, fault injection, route matrix, analytics URL capture, and mobile lab performance. Before app concurrency tests, prove the attached private store contract on a throwaway pathname: create-only permits one winner, origin reread observes it, and two writes using the same ETag yield exactly one success plus one `BlobPreconditionFailedError`. Kimi K3 audits the frozen Preview evidence; every in-scope finding enters the five-round Sol/Kimi loop, and the complete Preview matrix is rerun after the final code-changing round.

- [ ] **Step 5: Verify the exact Production tree and behavior**

After approved merge/deploy, obtain the Vercel deployment's reported commit `D` and prove `git rev-parse D^{tree}` equals reviewed `T`; commit identity may differ after a merge, squash, or rebase, but tree identity may not. Before enabling the 5-minute monitor, leave the deployment without live-data requests for more than 10 minutes, then prove the first live-page response refreshed within the hard contract. Run the production route matrix, headers, analytics network check, and GSC sitemap check; then enable the monitor and observe its cadence for 24 hours.

If tree identity or any Production criterion fails, use the pre-approved Vercel rollback to restore the previously healthy Production deployment before entering the Sol/Kimi fix loop. Record the failed deployment and rollback in the evidence bundle. Do not redeploy a fixed candidate until it has a new local GO and the user approves its new `R`/`T`.

- [ ] **Step 6: Complete the Goal**

Run one final Kimi K3 audit over the Production evidence. Complete only when it returns GO and every immutable acceptance criterion is proven. Preserve the implementation branch until the user chooses the finishing action; do not delete the old public Blob store without a separate destructive approval.
