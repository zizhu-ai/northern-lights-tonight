# Production health monitoring

The validation release uses GitHub Actions and the owner's existing Feishu
custom bot. Do not create an UptimeRobot monitor or another third-party monitor.
Monitoring is independent of application refresh logic: every live request
continues to enforce the 600-second freshness contract even if the workflow is
delayed or disabled.

## Repository configuration

1. Store the existing bot webhook only in the GitHub Actions repository secret
   `FEISHU_MONITOR_WEBHOOK`. Never put it in source, workflow literals,
   artifacts, logs, errors, or application/Vercel environment variables.
2. Leave the repository variable `HEALTH_MONITOR_ENABLED` absent or unequal to
   `true` until the existing release approval gate is complete. Set it to the
   exact string `true` to enable scheduled runs.
3. `workflow_dispatch` remains available regardless of the enable variable,
   but it still requires the repository secret. Do not manually dispatch it to
   send a test alert without approval of the exact destination and message.

GitHub scheduled workflows run from the default branch and may be delayed. The
workflow runs at minute 17 every two hours, has read-only repository permission,
a single bounded concurrency group, and a five-minute job timeout.

## Health and failure contract

The checker requests:

```text
https://aurora-tonight.mengyu699.workers.dev/api/health
```

That workers.dev URL is the default because Cloudflare free Bot Fight Mode
managed-challenges GitHub Actions runner IPs on `aurora-tonight.com/api/health`
and cannot be skipped. Override the target with the `HEALTH_URL` environment
variable (workflow default is the workers.dev URL; a repository variable of the
same name also overrides it). Expected-JSON checks are unchanged.

It tries at most three times, with a 60-second timeout on each attempt. A check
succeeds only for HTTP 200 and a JSON object where:

- `status` is exactly `ok` or `degraded`; and
- `checked_age_seconds` is a finite number greater than or equal to 0 and less
  than 600.

On non-200 or non-JSON responses the checker records status, `content-type`,
`server`, `cf-ray`, `cf-mitigated`, and a ~300-character stripped body snippet.
It reads the body as text first and only then attempts `JSON.parse`.

A successful attempt exits zero immediately and sends no Feishu message. Only
after all three attempts fail does the checker send one text alert. Site-down
alerts keep the existing wording (bounded reason, UTC time, health URL, GitHub
run URL). Cloudflare challenge responses (`cf-mitigated` present, or HTTP
403/503 HTML containing "Just a moment" / "Attention Required" / "cf-chl" /
"error code: 10xx") use the title "监控被 Cloudflare 拦截（网站未必宕机）" and
include cf-ray, cf-mitigated, and the snippet so they are not paged as outages.
The webhook is never included. After a successful alert, the process still
exits nonzero so GitHub's own failure notification remains a fallback.

The checker also probes the public `https://aurora-tonight.com/api/health` once.
A public-edge Cloudflare block is recorded only as a `Note: public edge blocked`
line (or an info log when the workers.dev check succeeded). It never sends a
down alert by itself.

A missing webhook fails configuration before any health request. Feishu HTTP
failures, malformed responses, and nonzero application error codes also fail
generically without exposing the secret or response body.

Preview may persist last-known-good state on the remote LKG API instead of
Hobby Blob when `AURORA_LKG_BASE_URL` and both LKG tokens are set. Production
stays on Blob until that cutover. See [lkg-store.md](lkg-store.md).

## Hobby Blob budget

At one health run every two hours, the monitor runs about 360 times per rolling
30 days. Even if every run triggers a stale refresh, the current resolver's
minimum two gets and two puts produce about 720 simple and 720 advanced Blob
operations without contention. This monitor-only bound remains below the Hobby
allowances of 10,000 simple and 2,000 advanced operations per rolling 30 days.

Real traffic, retries, failures, lease competition, and takeovers are additional
and are not included in that bound. If either rolling-30-day counter reaches 70%
of its allowance, or traffic predicts either will exceed its allowance, stop
expanding traffic and upgrade or redesign before continuing.

## Open-Meteo outage and abuse bound

With a 60-second negative retry and the current two Open-Meteo batches, steady
unauthenticated traffic can cause about 86,400 Open-Meteo HTTP requests per 30
days (about 2,880 per day). One late lease takeover per cycle would
conservatively double that to 172,800 per 30 days (about 5,760 per day). Both
bounds remain below the free non-commercial allowance of 10,000 calls per day
and 300,000 calls per month.

Re-check the vendor's definition of a counted call, including how
multi-coordinate requests are counted, before relying on this allowance.
