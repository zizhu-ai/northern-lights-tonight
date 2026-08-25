import type {
  JsonObject,
  RawSourceEnvelopes,
  SourceEnvelope,
  SourceFetchResults,
  SourceName,
  fetchAuroraSources,
// Node's strip-types runner requires the explicit extension for runtime imports;
// this import is erased, so Next and Node both avoid loading adapter modules.
// @ts-ignore TS5097: Next's bundler type-checks this source without emitting it.
} from "./aurora-sources.ts";
import type {
  SnapshotStateV2,
  SnapshotStore,
  SourceOutcome,
  StoredSnapshotState,
// @ts-ignore TS5097: see the strip-types runner note above.
} from "./snapshot-store.ts";

const CHECK_TTL_MS = 600_000;
const NEGATIVE_RETRY_MS = 60_000;
const LEASE_TTL_MS = 40_000;
const POLL_MS = 1_000;
const SOURCE_NAMES: readonly SourceName[] = ["ovation", "kp", "cloud"];

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

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

function basicEnvelopeValid(
  envelope: SourceEnvelope<unknown> | null,
  source: SourceName,
): envelope is SourceEnvelope<unknown> {
  return Boolean(
    envelope &&
      envelope.schema_version === 1 &&
      envelope.source === source &&
      validDate(envelope.fetched_at) &&
      (envelope.source_time === null || validDate(envelope.source_time)) &&
      /^[a-f0-9]{64}$/.test(envelope.fingerprint) &&
      isObject(envelope.coverage),
  );
}

function ovationPayloadValid(value: unknown): boolean {
  if (!isObject(value)) return false;
  const sourceTime = value["Observation Time"] ?? value.Observation_Time;
  return (
    validDate(sourceTime) &&
    Array.isArray(value.coordinates) &&
    value.coordinates.length > 0 &&
    value.coordinates.every(
      (row) =>
        Array.isArray(row) &&
        row.length >= 3 &&
        row.slice(0, 3).every((item) => Number.isFinite(Number(item))),
    )
  );
}

function kpPayloadValid(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.some(
      (row) =>
        Array.isArray(row) ||
        (isObject(row) && validDate(row.time_tag) && Number.isFinite(Number(row.kp))),
    )
  );
}

function cloudPayloadValid(value: unknown): boolean {
  if (!isObject(value) || Object.keys(value).length === 0) return false;
  return Object.values(value).every((point) => {
    if (point === null) return true;
    if (!isObject(point) || !isObject(point.hourly)) return false;
    const hourly = point.hourly;
    const times = hourly.time;
    return (
      Array.isArray(times) &&
      times.length > 0 &&
      times.every((time) => typeof time === "string") &&
      ["cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high"].every(
        (key) => Array.isArray(hourly[key]) && hourly[key].length === times.length,
      )
    );
  });
}

function ovationValid(envelope: SourceEnvelope<JsonObject> | null, now: Date): boolean {
  if (
    !basicEnvelopeValid(envelope, "ovation") ||
    !validDate(envelope.source_time) ||
    !ovationPayloadValid(envelope.payload)
  ) {
    return false;
  }
  const age = now.getTime() - Date.parse(envelope.source_time);
  return age >= 0 && age <= 90 * 60_000;
}

function kpValid(envelope: SourceEnvelope<unknown[]> | null, now: Date): boolean {
  if (!basicEnvelopeValid(envelope, "kp") || !kpPayloadValid(envelope.payload)) return false;
  const start = envelope.coverage.start;
  const end = envelope.coverage.end;
  return (
    validDate(start) &&
    validDate(end) &&
    Date.parse(start) <= now.getTime() &&
    Date.parse(end) >= now.getTime() + 18 * 60 * 60_000
  );
}

function cloudValid(
  envelope: SourceEnvelope<Record<string, JsonObject | null>> | null,
  now: Date,
): boolean {
  if (!basicEnvelopeValid(envelope, "cloud") || !cloudPayloadValid(envelope.payload)) return false;
  const fetchedAt = Date.parse(envelope.fetched_at);
  const end = envelope.coverage.end;
  const expectedPoints = envelope.coverage.expected_points;
  const coveredPoints = envelope.coverage.covered_points;
  return (
    now.getTime() - fetchedAt >= 0 &&
    now.getTime() - fetchedAt <= 6 * 60 * 60_000 &&
    envelope.coverage.complete === true &&
    typeof expectedPoints === "number" &&
    expectedPoints > 0 &&
    coveredPoints === expectedPoints &&
    validDate(end) &&
    Date.parse(end) >= now.getTime() + 18 * 60 * 60_000
  );
}

function scientificallyValid(envelopes: RawSourceEnvelopes, now: Date): RawSourceEnvelopes {
  return {
    schema_version: 1,
    ovation: ovationValid(envelopes.ovation, now) ? envelopes.ovation : null,
    kp: kpValid(envelopes.kp, now) ? envelopes.kp : null,
    cloud: cloudValid(envelopes.cloud, now) ? envelopes.cloud : null,
  };
}

const hasUsableAurora = (envelopes: RawSourceEnvelopes): boolean =>
  envelopes.ovation !== null || envelopes.kp !== null;

const allNegative = (state: SnapshotStateV2): boolean =>
  SOURCE_NAMES.every((source) => state.outcomes[source].status === "error");

function hasAgedEvidence(envelopes: RawSourceEnvelopes, now: Date): boolean {
  const ovationAge = envelopes.ovation?.source_time
    ? now.getTime() - Date.parse(envelopes.ovation.source_time)
    : 0;
  const cloudAge = envelopes.cloud
    ? now.getTime() - Date.parse(envelopes.cloud.fetched_at)
    : 0;
  return ovationAge > 45 * 60_000 || cloudAge > 30 * 60_000;
}

function isFresh(state: SnapshotStateV2, now: Date): boolean {
  const checkedAt = Date.parse(state.checked_at);
  if (!Number.isFinite(checkedAt) || checkedAt > now.getTime()) return false;
  const due = allNegative(state)
    ? state.retry_after === null
      ? Number.NaN
      : Date.parse(state.retry_after)
    : checkedAt + CHECK_TTL_MS;
  return Number.isFinite(due) && now.getTime() < due;
}

const leaseAcquirable = (state: SnapshotStateV2 | null, now: Date): boolean =>
  state === null ||
  state.lease === null ||
  (validDate(state.lease.expires_at) && now.getTime() >= Date.parse(state.lease.expires_at));

function freshness(
  state: SnapshotStateV2,
  persistenceHealth: SnapshotFreshness["persistence_health"],
): SnapshotFreshness {
  return {
    revision: state.revision,
    checked_at: state.checked_at,
    last_success_at: state.last_success_at,
    persistence_health: persistenceHealth,
  };
}

function failed(
  reason: Extract<SourceResolution, { kind: "failed_closed" }>["reason"],
  persistenceHealth: "degraded" | "unavailable",
): SourceResolution {
  return {
    kind: "failed_closed",
    mode: "failed_closed",
    reason,
    fallback: "bundled_unknown",
    persistence_health: persistenceHealth,
  };
}

function resolveState(
  state: SnapshotStateV2,
  now: Date,
  mode: "fresh_hit" | "refreshed",
  persistenceHealth: SnapshotFreshness["persistence_health"] = "ok",
): SourceResolution {
  const envelopes = scientificallyValid(state.envelopes, now);
  if (!hasUsableAurora(envelopes)) return failed("no_usable_aurora", "degraded");
  const degraded =
    allNegative(state) ||
    SOURCE_NAMES.some((name) => state.outcomes[name].status === "error") ||
    hasAgedEvidence(envelopes, now);
  return {
    kind: "usable",
    mode: degraded ? "degraded_lkg" : mode,
    source: degraded ? "lkg" : "live",
    envelopes,
    outcomes: state.outcomes,
    freshness: freshness(state, persistenceHealth),
  };
}

function emptyLeaseState(now: Date): SnapshotStateV2 {
  const epoch = new Date(0).toISOString();
  const item: SourceOutcome = { status: "error", checked_at: epoch, error_code: "unavailable" };
  return {
    schema_version: 2,
    revision: `pending-${now.getTime()}`,
    checked_at: epoch,
    last_success_at: null,
    retry_after: epoch,
    envelopes: { schema_version: 1, ovation: null, kp: null, cloud: null },
    outcomes: { ovation: { ...item }, kp: { ...item }, cloud: { ...item } },
    lease: null,
  };
}

let revisionSequence = 0;
function nextRevision(now: Date): string {
  revisionSequence += 1;
  return `snapshot-${now.getTime().toString(36)}-${revisionSequence.toString(36)}`;
}

function resultEnvelope(
  fetched: SourceFetchResults,
  source: SourceName,
): SourceEnvelope<unknown> | null {
  const result = fetched[source];
  if (!result.ok || !basicEnvelopeValid(result.envelope, source)) return null;
  return result.envelope as SourceEnvelope<unknown>;
}

function completedState(
  leased: SnapshotStateV2,
  fetched: SourceFetchResults,
  now: Date,
): SnapshotStateV2 {
  const checkedAt = now.toISOString();
  const previous = scientificallyValid(leased.envelopes, now);
  const fetchedOvation = resultEnvelope(fetched, "ovation") as SourceEnvelope<JsonObject> | null;
  const fetchedKp = resultEnvelope(fetched, "kp") as SourceEnvelope<unknown[]> | null;
  const fetchedCloud = resultEnvelope(fetched, "cloud") as SourceEnvelope<Record<string, JsonObject | null>> | null;
  const validFetched = {
    ovation: ovationValid(fetchedOvation, now) ? fetchedOvation : null,
    kp: kpValid(fetchedKp, now) ? fetchedKp : null,
    cloud: cloudValid(fetchedCloud, now) ? fetchedCloud : null,
  };
  const statuses: Record<SourceName, boolean> = {
    ovation: validFetched.ovation !== null,
    kp: validFetched.kp !== null,
    cloud: validFetched.cloud !== null,
  };
  const anySuccess = SOURCE_NAMES.some((source) => statuses[source]);
  const outcomeFor = (source: SourceName): SourceOutcome => ({
    status: statuses[source] ? "ok" : "error",
    checked_at: checkedAt,
    error_code: statuses[source] ? null : "unavailable",
  });
  return {
    schema_version: 2,
    revision: nextRevision(now),
    checked_at: checkedAt,
    last_success_at: anySuccess ? checkedAt : leased.last_success_at,
    retry_after: anySuccess ? null : new Date(now.getTime() + NEGATIVE_RETRY_MS).toISOString(),
    envelopes: {
      schema_version: 1,
      ovation: validFetched.ovation ?? previous.ovation,
      kp: validFetched.kp ?? previous.kp,
      cloud: validFetched.cloud ?? previous.cloud,
    },
    outcomes: {
      ovation: outcomeFor("ovation"),
      kp: outcomeFor("kp"),
      cloud: outcomeFor("cloud"),
    },
    lease: null,
  };
}

export function createSourceResolver(runtime: HardRefreshRuntime): () => Promise<SourceResolution> {
  let inflight: Promise<SourceResolution> | null = null;
  let memoryState: SnapshotStateV2 | null = null;

  const read = async (): Promise<StoredSnapshotState | null | undefined> => {
    try {
      const stored = await runtime.store.read();
      if (stored) memoryState = stored.state;
      return stored;
    } catch {
      return undefined;
    }
  };

  const run = async (): Promise<SourceResolution> => {
    let stored = await read();
    if (stored === undefined) {
      const now = runtime.now();
      if (memoryState && isFresh(memoryState, now)) {
        return resolveState(memoryState, now, "fresh_hit", "degraded");
      }
      return failed("state_unavailable", "unavailable");
    }

    while (true) {
      const now = runtime.now();
      if (stored && isFresh(stored.state, now)) {
        return resolveState(stored.state, now, "fresh_hit");
      }

      if (!leaseAcquirable(stored?.state ?? null, now)) {
        const expiresAt = Date.parse(stored!.state.lease!.expires_at);
        await runtime.sleep(Math.max(1, Math.min(POLL_MS, expiresAt - now.getTime())));
        stored = await read();
        if (stored === undefined) return failed("state_unavailable", "unavailable");
        continue;
      }

      const base = stored?.state ?? emptyLeaseState(now);
      const leased: SnapshotStateV2 = {
        ...base,
        lease: {
          owner: runtime.ownerId(),
          expires_at: new Date(now.getTime() + LEASE_TTL_MS).toISOString(),
        },
      };
      let leaseWrite: "written" | "conflict";
      try {
        leaseWrite = await runtime.store.compareAndSwap(stored?.etag ?? null, leased);
      } catch {
        return failed("refresh_unresolved", "unavailable");
      }
      if (leaseWrite === "conflict") {
        stored = await read();
        if (stored === undefined) return failed("refresh_unresolved", "unavailable");
        continue;
      }

      const leasedStored = await read();
      if (leasedStored === undefined || leasedStored === null) {
        return failed("refresh_unresolved", "unavailable");
      }
      let fetched: SourceFetchResults;
      try {
        fetched = await runtime.fetchSources([], leased.envelopes);
      } catch {
        fetched = {
          ovation: { ok: false, error: "unavailable" },
          kp: { ok: false, error: "unavailable" },
          cloud: { ok: false, error: "unavailable" },
        };
      }
      const completed = completedState(leased, fetched, runtime.now());
      let publish: "written" | "conflict";
      try {
        publish = await runtime.store.compareAndSwap(leasedStored.etag, completed);
      } catch {
        return failed("refresh_unresolved", "unavailable");
      }
      if (publish === "written") {
        memoryState = completed;
        return resolveState(completed, runtime.now(), "refreshed");
      }

      const winner = await read();
      if (winner === undefined || winner === null) return failed("refresh_unresolved", "unavailable");
      if (winner.state.lease !== null) {
        stored = winner;
        continue;
      }
      return resolveState(winner.state, runtime.now(), "refreshed");
    }
  };

  return async () => {
    if (inflight) return inflight;
    inflight = run();
    try {
      return await inflight;
    } finally {
      inflight = null;
    }
  };
}
