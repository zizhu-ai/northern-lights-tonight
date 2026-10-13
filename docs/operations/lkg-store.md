# Last-known-good snapshot store

The request-time resolver (`SnapshotStore.read` + `compareAndSwap`) can persist schema-version-2 source state in either the Cloudflare R2 binding or the remote HTTPS LKG API. Selection is explicit and fail-closed.

## Default (Cloudflare R2)

When `AURORA_LKG_BASE_URL`, `AURORA_LKG_READ_TOKEN`, and `AURORA_LKG_WRITE_TOKEN` are all unset, the app uses the `AURORA_STATE_BUCKET` R2 binding (bucket `aurora-tonight-state`, key `aurora/state/source-state-v2.json`). See [docs/deploy-cloudflare.md](../deploy-cloudflare.md) for bucket creation and Blob → R2 copy steps.

**Leave the remote LKG variables unset in Production** until a later, deliberate cutover.

## Preview: remote LKG

The remote API is deployed on the VPS behind Caddy for `https://lkg.aurora-tonight.com`. DNS for that hostname may still be pending; do not treat NXDOMAIN as a product-code failure. Set Preview env only after you can reach the API (hostname or a temporary HTTPS origin that speaks the same contract).

In the Vercel project, Preview environment only (not Production):

| Variable | Example / notes |
| --- | --- |
| `AURORA_LKG_BASE_URL` | `https://lkg.aurora-tonight.com` — origin only, no path, no credentials in the URL |
| `AURORA_LKG_READ_TOKEN` | Bearer token for `GET /v1/state`. Mark Sensitive. |
| `AURORA_LKG_WRITE_TOKEN` | Bearer token for `PUT /v1/state`. Mark Sensitive. |

All three must be non-empty. A partial set fails closed (`Snapshot store is not configured`) instead of silently using R2.

While the remote trio is set, R2 is not used. After unsetting it, the worker returns to `AURORA_STATE_BUCKET`.

Do not put these values in source control, client-visible `NEXT_PUBLIC_*` variables, HTML, logs, or snapshot JSON.

## API contract used by the adapter

- `GET /healthz` → `{"ok":true}` (ops probe; the Next.js app does not call this on the request path)
- `GET /v1/state` — `Authorization: Bearer <read token>`; JSON + strong ETag; `404` if missing
- `PUT /v1/state` — `Authorization: Bearer <write token>`; `If-Match` for updates; `If-None-Match: *` for create; `412` on conflict; ~256KiB body cap; `schema_version` 2

Lease CAS semantics are unchanged: a 412 is `"conflict"`; 401/403 are sanitized failures, not conflicts.

The remote API accepts ~256KiB JSON bodies. Live NOAA OVATION is a global
grid (~2–3MiB). The remote adapter keeps the Wave 1 interpolation neighborhood
(sample points plus 8° north) and only then drops cloud/OVATION if the body
still exceeds the cap. Lease writes are tiny and are never the oversized path.
A completed publish still clears `lease` so an empty store cannot stay stuck.

## Error classification

Sanitized store errors may include a `code` that is safe to log:

- `blob_suspended` — vendor disable / limits text (legacy Blob classifier; R2 failures usually stay generic)
- `remote_lkg_unauthorized` — remote 401/403
- `remote_lkg_down` — remote 5xx/429 or network/timeout

Public `/api/health` still reports `persistence_health` as `ok` / `degraded` / `unavailable`. A failed-closed request continues to serve the bundled snapshot.

## Production cutover checklist

1. Confirm Preview with the remote trio set: `/api/health` is 200 or degraded with in-contract `checked_age_seconds`, not bundled-unknown 503 from store unavailability.
2. Confirm `GET https://lkg.aurora-tonight.com/healthz` and authenticated `GET /v1/state` from a trusted network.
3. Seed or verify schema-version-2 state exists, or allow the first Preview/cron refresh to create it. An empty key uses `If-None-Match: *`; an invalid placeholder is overwritten so NOAA/Open-Meteo can cold-start without a copied Blob object.
4. Set the same three variables on Production. Keep the R2 bucket until remote LKG has been Production-healthy through at least one 10-minute refresh cycle.
5. Watch `/api/health` and the Feishu monitor. If remote LKG is down, the app fail-closes to bundled and health is 503.
6. Only after that window, optionally stop writing the R2 state object. That cleanup is a separate change.

## Rollback

Unset the three `AURORA_LKG_*` variables on the affected environment and redeploy so the process sees the empty config. The app returns to the R2 adapter immediately. Partial unsets (leaving `AURORA_LKG_BASE_URL` alone) will fail closed until the set is complete or fully removed.
