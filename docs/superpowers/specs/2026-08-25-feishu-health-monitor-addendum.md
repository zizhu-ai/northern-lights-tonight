# Feishu health-monitor addendum

Approved by the project owner on 2026-08-25. This addendum replaces the
third-party uptime-provider monitoring design for the non-commercial validation
release. It does not alter application freshness, forecast, SEO, analytics, or
deployment behavior.

```yaml
goal: >-
  Check the production health endpoint every two hours with free GitHub Actions
  and send a sanitized failure alert to the owner's existing Feishu custom bot,
  without UptimeRobot or another monitoring subscription.
in_scope:
  - a scheduled and manually dispatchable GitHub Actions health-monitor workflow
  - a zero-dependency, testable Node health checker and Feishu notifier
  - repository documentation for the secret, enable gate, cadence, and failure semantics
  - storing the supplied webhook only as a GitHub Actions repository secret
  - targeted tests, CI coverage, local validation, and Kimi K3 audit
out_of_scope:
  - UptimeRobot account or monitor creation
  - creating or changing a Feishu group or bot
  - putting the webhook in source, artifacts, logs, errors, or application environment variables
  - Vercel/Blob/environment setup, push, PR, merge, deploy, Production enablement, GSC, or closing old PRs
  - success/recovery messages, public status pages, SMS, phone, or multi-region checks
acceptance_criteria:
  - schedule is every two hours at an off-hour-boundary minute and supports manual dispatch
  - scheduled execution remains disabled unless repository variable HEALTH_MONITOR_ENABLED equals true; manual dispatch remains available
  - workflow permissions are contents-read only, concurrency is bounded, and job timeout is at most five minutes
  - health target is fixed to https://aurora-tonight.com/api/health
  - one run makes at most three attempts, each with a 60-second timeout, and alerts only after all attempts fail
  - success requires HTTP 200 plus JSON status in [ok, degraded] and finite checked_age_seconds in [0, 600)
  - failure logs and the Feishu message contain only a bounded sanitized reason, UTC time, health URL, and GitHub run URL; never raw response content or the webhook
  - a missing webhook fails configuration before the health request; Feishu HTTP/nonzero application errors fail without exposing the secret
  - successful health sends no Feishu message and exits zero; an alerted unhealthy run exits nonzero so GitHub notifications remain a fallback
  - tests prove boundaries, retry behavior, one-alert behavior, secret hygiene, and Feishu response handling
  - CI runs the monitor tests; relevant tests, type-check/build if touched, diff check, and Kimi K3 audit pass with no open Critical or Important finding
assumptions:
  - the supplied webhook already targets the intended Feishu group
  - the bot accepts a text message containing the phrase Northern Lights Tonight
  - GitHub scheduled workflows may be delayed and run only from the default branch; this is acceptable for validation monitoring
risk_level: medium
allowed_paths:
  - .github/workflows/health-monitor.yml
  - .github/workflows/ci.yml
  - scripts/health-monitor.mjs
  - scripts/health-monitor.test.mjs
  - docs/operations/monitoring.md
  - docs/superpowers/specs/2026-08-25-feishu-health-monitor-addendum.md
  - .superpowers/sdd/2026-08-24-northern-lights-launch-hardening/**
change_budget: No dependency, application runtime, public API, algorithm, route, or schema change.
validation_budget: >-
  One red monitor-test run, one green monitor-test run, one relevant full test
  suite, one diff check, and one Kimi K3 audit; do not rerun unrelated passing
  build/SEO/browser checks because no application code changes.
approval_boundaries:
  - local commits and setting FEISHU_MONITOR_WEBHOOK as a repository secret are approved
  - do not push, open or mutate a PR, merge, deploy, or enable HEALTH_MONITOR_ENABLED without the existing release approval gate
  - do not send a manual test alert before the owner approves the exact destination/message at action time
```

## Supersession

For this validation release, this addendum replaces the static, rendered-page,
and external-provider sections of `docs/operations/monitoring.md`. The only
installed monitor is the two-hour health check described here. The application
still enforces the 600-second request-time freshness contract independently of
monitoring.
