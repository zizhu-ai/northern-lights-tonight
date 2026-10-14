import {
  fetchAuroraProducts,
  fetchCloudsForLocations,
  type JsonObject,
  type SourceFetchResult,
  // @ts-ignore TS5097
} from "./aurora-sources.ts";

export const VIEW_CACHE_TTL_MS = 600_000;
export const VIEW_RECHECK_MIN_INTERVAL_MS = 60_000;

type AuroraCacheEntry = {
  fetchedAt: number;
  ovation: SourceFetchResult<JsonObject>;
  kp: SourceFetchResult<unknown[]>;
};

type CloudCacheEntry = {
  fetchedAt: number;
  result: SourceFetchResult<Record<string, JsonObject | null>>;
};

let auroraCache: AuroraCacheEntry | null = null;
let auroraInFlight: Promise<AuroraCacheEntry> | null = null;
const cloudCache = new Map<string, CloudCacheEntry>();
const cloudInFlight = new Map<string, Promise<CloudCacheEntry>>();

export function roundedViewCoordinate(value: number): number {
  return Math.round(value * 10) / 10;
}

export function viewCloudCacheKey(lat: number, lng: number): string {
  return `${roundedViewCoordinate(lat).toFixed(1)},${roundedViewCoordinate(lng).toFixed(1)}`;
}

export function shouldRefreshViewCache(
  fetchedAt: number | undefined,
  now: number,
  recheck: boolean,
  ttlMs = VIEW_CACHE_TTL_MS,
  recheckMinIntervalMs = VIEW_RECHECK_MIN_INTERVAL_MS,
): boolean {
  if (fetchedAt === undefined) return true;
  const age = now - fetchedAt;
  if (age < 0) return true;
  if (recheck) return age >= recheckMinIntervalMs;
  return age >= ttlMs;
}

export function resetViewSourceCache(): void {
  auroraCache = null;
  auroraInFlight = null;
  cloudCache.clear();
  cloudInFlight.clear();
}

export async function loadCachedAuroraProducts(input: {
  recheck?: boolean;
  now?: number;
  fetchProducts?: typeof fetchAuroraProducts;
}): Promise<{
  ovation: SourceFetchResult<JsonObject>;
  kp: SourceFetchResult<unknown[]>;
}> {
  const now = input.now ?? Date.now();
  if (auroraCache && !shouldRefreshViewCache(auroraCache.fetchedAt, now, input.recheck === true)) {
    return { ovation: auroraCache.ovation, kp: auroraCache.kp };
  }
  if (auroraInFlight) return auroraInFlight;

  const fetchProducts = input.fetchProducts ?? fetchAuroraProducts;
  auroraInFlight = fetchProducts().then((products) => {
    const entry: AuroraCacheEntry = {
      fetchedAt: now,
      ovation: products.ovation,
      kp: products.kp,
    };
    auroraCache = entry;
    return entry;
  });
  try {
    const entry = await auroraInFlight;
    return { ovation: entry.ovation, kp: entry.kp };
  } finally {
    auroraInFlight = null;
  }
}

export async function loadCachedViewClouds(input: {
  lat: number;
  lng: number;
  timezone: string;
  recheck?: boolean;
  now?: number;
  fetchClouds?: typeof fetchCloudsForLocations;
}): Promise<SourceFetchResult<Record<string, JsonObject | null>>> {
  const now = input.now ?? Date.now();
  const key = viewCloudCacheKey(input.lat, input.lng);
  const hit = cloudCache.get(key);
  if (hit && !shouldRefreshViewCache(hit.fetchedAt, now, input.recheck === true)) {
    return hit.result;
  }
  const pending = cloudInFlight.get(key);
  if (pending) return (await pending).result;

  const roundedLat = roundedViewCoordinate(input.lat);
  const roundedLng = roundedViewCoordinate(input.lng);
  const fetchClouds = input.fetchClouds ?? fetchCloudsForLocations;
  const request = fetchClouds([
    {
      slug: "view",
      timezone: input.timezone,
      sample_points: [{ id: "pin", lat: roundedLat, lng: roundedLng }],
    },
  ]).then((result) => {
    const entry: CloudCacheEntry = { fetchedAt: now, result };
    cloudCache.set(key, entry);
    return entry;
  });
  cloudInFlight.set(key, request);
  try {
    return (await request).result;
  } finally {
    cloudInFlight.delete(key);
  }
}

export function viewCloudLookupKey(lat: number, lng: number): string {
  const roundedLat = roundedViewCoordinate(lat);
  const roundedLng = roundedViewCoordinate(lng);
  return `${roundedLat.toFixed(3)},${roundedLng.toFixed(3)}`;
}
