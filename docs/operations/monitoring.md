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

The checker always requests exactly:

```text
https://aurora-tonight.com/api/health
```

It tries at most three times, with a 60-second timeout on each attempt. A check
succeeds only for HTTP 200 and a JSON object where:

- `status` is exactly `ok` or `degraded`; and
- `checked_age_seconds` is a finite number greater than or equal to 0 and less
  than 600.

A successful attempt exits zero immediately and sends no Feishu message. Only
after all three attempts fail does the checker send one text alert. The alert
contains only a bounded sanitized reason, UTC time, the fixed health URL, and
the GitHub run URL; raw response content and the webhook are never included.
After a successful alert, the process still exits nonzero so GitHub's own
failure notification remains a fallback. A missing webhook fails configuration
before any health request. Feishu HTTP failures, malformed responses, and
nonzero application error codes also fail generically without exposing the
secret or response body.

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
