# Forecast monitoring

Configure the checks below in any independent monitoring provider. Do not
make the monitor part of application refresh logic.

## Static availability check

```text
URL: https://aurora-tonight.com/privacy
Interval: 5 minutes
Timeout: 60 seconds
Success: HTTP 200
Incident: 3 consecutive failures
Recovery: 2 consecutive successes
Receiver: project owner email selected during Task 7
```

This static route checks basic site availability without entering the live-data
resolver or touching its Blob state.

## Health check

```text
URL: https://aurora-tonight.com/api/health
Interval: 2 hours
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
not wait for organically stale state after enabling the live-data checks.

## Rendered-page check

Every 6 hours, choose the next slug from a rotating set of forecast slugs and
request its rendered forecast page. When possible, schedule it 5 minutes after
the latest health check so it can reuse the freshly checked shared state.
Success requires both:

- an HTTP 200 response; and
- a `data-snapshot-checked-at` marker whose age is below 600 seconds at
  response completion.

Use the response-completion time, not monitor start time, to calculate marker
age. Treat a missing, invalid, or future marker as failure.

## Hobby Blob budget

Vercel Hobby includes 10,000 simple Blob operations and 2,000 advanced Blob
operations per rolling 30 days. At the validation cadence, the health check
runs about 360 times and the rendered-page check about 120 times per 30 days.
Even if every one of those 480 live probes independently triggers a refresh,
with no concurrency or lease contention, the current resolver's minimum two
gets and two puts per refresh produce about 960 simple and 960 advanced
operations. The monitor-only no-contention bound is therefore below both Hobby
allowances.

Real traffic, retries, failures, lease competition, and takeovers are additional
and are not included in that bound. Monitor both rolling-30-day counters. If
either simple or advanced operations reach 70% of its allowance, or current
traffic predicts that either will exceed its allowance, stop expanding traffic
and upgrade the plan or redesign the refresh and persistence strategy before
continuing.

After moving to an appropriate commercial/Pro plan and confirming its current
limits, the denser 5-minute health and 15-minute rendered-page cadence may be
restored.

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
