# Forecast monitoring

Configure the checks below in any independent monitoring provider. Do not
make the monitor part of application refresh logic.

## Health check

```text
URL: https://aurora-tonight.com/api/health
Interval: 5 minutes
Timeout: 60 seconds
Success: HTTP 200 and JSON status in ["ok", "degraded"] and checked_age_seconds < 600
Incident: 3 consecutive failures
Recovery: 2 consecutive successes
Receiver: project owner email selected during Task 7
```

The health request is ordinary request traffic and legitimately keeps shared
state warm by passing through the same hard-refresh resolver as live pages.
It is not the refresh correctness mechanism: if monitoring stops, the next
live request still enforces the 600-second contract. Prove the idle first-hit
path in Preview and during the controlled pre-monitor Production window; do
not wait for organically stale state after enabling the 5-minute check.

## Rendered-page check

Every 15 minutes, choose the next slug from a rotating set of forecast slugs
and request its rendered forecast page. Success requires both:

- an HTTP 200 response; and
- a `data-snapshot-checked-at` marker whose age is below 600 seconds at
  response completion.

Use the response-completion time, not monitor start time, to calculate marker
age. Treat a missing, invalid, or future marker as failure.

## Outage and abuse bound

With a 60-second negative retry and the current two Open-Meteo batches, steady
unauthenticated traffic can cause about 86,400 Open-Meteo HTTP requests per 30
days (about 2,880 per day). One late lease takeover per cycle would
conservatively double that to 172,800 per 30 days (about 5,760 per day). Both
bounds remain below the free non-commercial allowance of 10,000 calls per day
and 300,000 calls per month.

Monitor Vercel Blob operations separately. Re-check the vendor's definition
of a counted call, including how multi-coordinate requests are counted, before
relying on this allowance.
