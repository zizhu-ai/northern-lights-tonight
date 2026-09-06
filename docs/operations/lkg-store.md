# Last-known-good snapshot store

The request-time resolver (`SnapshotStore.read` + `compareAndSwap`) can persist schema-version-2 source state in either Vercel Blob or the remote HTTPS LKG API. Selection is explicit and fail-closed.

## Default (unchanged Production)

When `AURORA_LKG_BASE_URL`, `AURORA_LKG_READ_TOKEN`, and `AURORA_LKG_WRITE_TOKEN` are all unset, the app uses the existing private Blob store (`AURORA_STATE_BLOB_READ_WRITE_TOKEN`, pathname `aurora/state/source-state-v2.json`).

**Leave the remote LKG variables unset in Production** until a later, deliberate cutover. This PR does not change Production behavior by default.

## Preview: remote LKG

The remote API is deployed on the VPS behind Caddy for `https://lkg.aurora-tonight.com`. DNS for that hostname may still be pending; do not treat NXDOMAIN as a product-code failure. Set Preview env only after you can reach the API (hostname or a temporary HTTPS origin that speaks the same contract).

In the Vercel project, Preview environment only (not Production):

| Variable | Example / notes |
| --- | --- |
| `AURORA_LKG_BASE_URL` | `https://lkg.aurora-tonight.com` — origin only, no path, no credentials in the URL |
| `AURORA_LKG_READ_TOKEN` | Bearer token for `GET /v1/state`. Mark Sensitive. |
| `AURORA_LKG_WRITE_TOKEN` | Bearer token for `PUT /v1/state`. Mark Sensitive. |

All three must be non-empty. A partial set fails closed (`Snapshot store is not configured`) instead of silently using Blob.

Keep `AURORA_STATE_BLOB_READ_WRITE_TOKEN` on Preview if you still want a Blob fallback path after unsetting the remote trio. While the remote trio is set, Blob is not used.

Do not put these values in source control, client-visible `NEXT_PUBLIC_*` variables, HTML, logs, or snapshot JSON.

## API contract used by the adapter

- `GET /healthz` → `{"ok":true}` (ops probe; the Next.js app does not call this on the request path)
- `GET /v1/state` — `Authorization: Bearer <read token>`; JSON + strong ETag; `404` if missing
- `PUT /v1/state` — `Authorization: Bearer <write token>`; `If-Match` for updates; `If-None-Match: *` for create; `412` on conflict; ~256KiB body cap; `schema_version` 2

Lease CAS semantics are unchanged: a 412 is `"conflict"`; 401/403 are sanitized failures, not conflicts.

## Error classification

Sanitized store errors may include a `code` that is safe to log:

- `blob_suspended` — Blob vendor error looks like a limits/suspension disable
- `remote_lkg_unauthorized` — remote 401/403
- `remote_lkg_down` — remote 5xx/429 or network/timeout

Public `/api/health` still reports `persistence_health` as `ok` / `degraded` / `unavailable`. A failed-closed request continues to serve the bundled snapshot.

## Production cutover checklist

1. Confirm Preview with the remote trio set: `/api/health` is 200 or degraded with in-contract `checked_age_seconds`, not bundled-unknown 503 from store unavailability.
2. Confirm `GET https://lkg.aurora-tonight.com/healthz` and authenticated `GET /v1/state` from a trusted network.
3. Seed or verify schema-version-2 state exists (or allow the first Preview refresh to create it via `If-None-Match: *`).
4. Set the same three variables on Production. Do not remove `AURORA_STATE_BLOB_READ_WRITE_TOKEN` until remote LKG has been Production-healthy through at least one 10-minute refresh cycle.
5. Watch `/api/health` and the Feishu monitor. If remote LKG is down, the app fail-closes to bundled and health is 503 — same as a suspended Blob store.
6. Only after that window, optionally remove Blob usage and the Hobby store. That cleanup is a separate change.

## Rollback

Unset the three `AURORA_LKG_*` variables on the affected environment and redeploy so the process sees the empty config. The app returns to the Blob adapter immediately. Partial unsets (leaving `AURORA_LKG_BASE_URL` alone) will fail closed until the set is complete or fully removed.
