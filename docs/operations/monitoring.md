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
workflow runs once per day at 03:17 UTC, has read-only repository permission,
a single bounded concurrency group, and a five-minute job timeout.

## Health and failure contract

The authoritative checker target is the public custom domain:

```text
https://aurora-tonight.com/api/health
```

Override the target with the `HEALTH_URL` environment variable (workflow
default is the custom-domain URL; a repository variable of the same name also
overrides it). `*.workers.dev` is not the production health URL. If a run still
points at workers.dev, a Cloudflare disabled-subdomain response (HTTP 404 with
`error code: 1042`, or any 404 on a `*.workers.dev` host) is a bypass/config
issue, not a site outage.

It tries at most three times, with a 60-second timeout on each attempt. A check
succeeds only for HTTP 200 and a JSON object where:

- `status` is exactly `ok` or `degraded`; and
- `checked_age_seconds` is a finite number greater than or equal to 0 and less
  than 600.

On non-200 or non-JSON responses the checker records status, `content-type`,
`server`, `cf-ray`, `cf-mitigated`, and a ~300-character stripped body snippet.
It reads the body as text first and only then attempts `JSON.parse`.

A successful attempt exits zero immediately and sends no Feishu message. GitHub
Actions runner IPs are often managed-challenged by Cloudflare Bot Fight Mode on
the public edge. Those responses (`cf-mitigated` present, challenge HTML such as
"Just a moment" / "Attention Required" / "cf-chl", or workers.dev 1042/404 as
above) are inconclusive: the job logs the URL, status, cf-ray, cf-mitigated, and
snippet, then exits zero without a Feishu page. They must not be titled
"Northern Lights Tonight health monitor failure".

Only a confirmed outage sends one text alert after all three attempts fail:
invalid or missing health JSON, `status` outside `[ok, degraded]`, stale
`checked_age_seconds`, degraded/invalid sources or persistence reported by a
real health body, HTTP errors that are not a Cloudflare challenge, or a
transport failure that is not a challenge. Site-down alerts keep the existing
wording (bounded reason, UTC time, health URL, GitHub run URL) plus cf-ray /
cf-mitigated when those headers are present. The webhook is never included.
After a successful alert, the process still exits nonzero so GitHub's own
failure notification remains a fallback.

If `HEALTH_URL` is overridden to a different URL than the public edge, the
checker probes `https://aurora-tonight.com/api/health` once for diagnostics. A
public-edge Cloudflare block is recorded only as a `Note: public edge blocked`
line (or an info log when the override check succeeded). If the override is
inconclusive (challenge or workers.dev 1042) and the public edge returns a real
unhealthy JSON body, that public result is treated as the outage.

A missing webhook fails configuration before any health request. Feishu HTTP
failures, malformed responses, and nonzero application error codes also fail
generically without exposing the secret or response body.

Preview may persist last-known-good state on the remote LKG API instead of
Hobby Blob when `AURORA_LKG_BASE_URL` and both LKG tokens are set. Production
stays on Blob until that cutover. See [lkg-store.md](lkg-store.md).

## Hobby Blob budget

At one health run per day, the monitor runs about 30 times per rolling 30 days.
Even if every run triggers a stale refresh, the current resolver's minimum two
gets and two puts produce about 60 simple and 60 advanced Blob operations
without contention. This monitor-only bound remains below the Hobby allowances
of 10,000 simple and 2,000 advanced operations per rolling 30 days.

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
