# Non-commercial validation launch addendum

Approved by the project owner on 2026-08-25. This addendum changes only the
commercial-launch assumptions in the 2026-08-24 launch-hardening specification.
The original specification and its prior local audit evidence remain immutable.
Where they conflict, this addendum supersedes specification section 3 items 1–3
and implementation-plan Task 7 approval items 1, 2, and the Open-Meteo portion
of item 4 for this validation release only. All other release gates remain.

```yaml
goal: >-
  Permit an explicitly non-commercial public validation release to use the
  canonical Open-Meteo free endpoint on Vercel Hobby without buying Vercel Pro
  or an Open-Meteo subscription.
in_scope:
  - an explicit production-only non-commercial Open-Meteo mode
  - canonical free-endpoint and no-credential enforcement in that mode
  - documentation of the non-commercial boundary and commercial upgrade trigger
  - targeted regression tests, relevant full local gates, and Kimi K3 audit
out_of_scope:
  - Vercel or Open-Meteo checkout
  - advertising, subscriptions, affiliate revenue, sponsorship, paid lead generation, or other commercial use
  - weather algorithm, data freshness, SEO route inventory, analytics, or UI changes
  - push, PR mutation, merge, deployment, monitor creation, GSC mutation, or credential changes
acceptance_criteria:
  - production permits the canonical free endpoint only when OPEN_METEO_USAGE_MODE=noncommercial
  - non-commercial production never accepts, appends, logs, or persists an Open-Meteo API key
  - non-commercial production rejects a non-canonical endpoint and invalid usage modes
  - production without the explicit non-commercial mode retains the existing fail-closed commercial endpoint and key contract
  - preview, development, attribution, refresh bounds, and conservative missing-cloud behavior remain unchanged
  - documentation says commercial activity requires removing non-commercial mode and configuring the customer endpoint and API key before launch
  - targeted tests, the relevant full suite, type-check, build, and Kimi K3 audit pass with no open Critical or Important finding
assumptions:
  - the public validation site remains free of advertising and all other commercial activity during this mode
  - the owner will reassess provider terms before monetization
  - provider interpretation of promotional activity remains an external licensing risk; this patch does not claim legal advice
risk_level: medium
allowed_paths:
  - lib/open-meteo-config.ts
  - lib/open-meteo-config.test.ts
  - lib/aurora-sources.ts
  - README.md
  - docs/operations/monitoring.md
  - docs/superpowers/specs/2026-08-25-noncommercial-validation-addendum.md
  - .superpowers/sdd/2026-08-24-northern-lights-launch-hardening/**
change_budget: No dependency, public API, algorithm, route, or schema change.
validation_budget: >-
  One red targeted test run, one green targeted test run, one relevant full test
  suite, one type-check, one production build, and one Kimi K3 audit; repeat only
  checks invalidated by later code changes.
approval_boundaries:
  - all external writes and purchases remain unapproved
  - any monetization or commercial promotion requires a new scope decision
```

## Runtime contract

- `OPEN_METEO_USAGE_MODE=noncommercial` is the sole production opt-in for the
  free API during this validation phase.
- In that mode the application uses exactly
  `https://api.open-meteo.com/v1/forecast`, rejects an API key, and rejects a
  different configured base URL.
- With the mode absent, production continues to require exactly
  `https://customer-api.open-meteo.com/v1/forecast` and a non-empty key.
- Existing Open-Meteo and CC BY 4.0 attribution remains mandatory.
- Before any advertising or other commercial activity, remove the
  non-commercial mode and configure the commercial endpoint and key.

## Revised external gate for this validation release

- Do not upgrade Vercel and do not purchase an Open-Meteo subscription.
- Production must set `OPEN_METEO_USAGE_MODE=noncommercial` and must not set
  `OPEN_METEO_API_BASE` or `OPEN_METEO_API_KEY`.
- Private Blob setup, its server-only token, analytics cleanup, Preview proof,
  release approval, Production proof, monitoring, and GSC evidence remain
  required under the original plan.
