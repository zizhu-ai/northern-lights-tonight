import placeDataJson from "../data/us-places.json";

export type Place = {
  name: string;
  lat: number;
  lng: number;
  tz: string;
  slug: string | null;
  keys: string[];
  zips: string[];
};

type PlaceData = {
  aliases: Array<{ keys: string[]; slug: string }>;
  places: Place[];
};

export type PlaceSearchError =
  | "search_empty"
  | "search_no_match"
  | "zip_not_found";

export type PlaceSearchResult =
  | { kind: "slug"; slug: string }
  | { kind: "place"; place: Place }
  | { kind: "ambiguous"; places: Place[] }
  | { kind: "error"; code: PlaceSearchError };

export type SearchQueryKind = "empty" | "zip" | "text";

export function queryKind(query: string): SearchQueryKind {
  const trimmed = query.trim();
  if (!trimmed) return "empty";
  if (/^\d{5}$/.test(trimmed)) return "zip";
  return "text";
}

const placeData = placeDataJson as PlaceData;

export function normalizePlaceQuery(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function destinationKey(place: Place): string {
  return place.slug ? `slug:${place.slug}` : `pin:${place.lat},${place.lng},${place.name}`;
}

function keyMatches(key: string, normalized: string): boolean {
  const value = normalizePlaceQuery(key);
  return value === normalized || value.startsWith(`${normalized} `);
}

function nameMatches(name: string, normalized: string): boolean {
  const value = normalizePlaceQuery(name);
  if (value === normalized) return true;
  const first = value.split(" ")[0] ?? "";
  return first === normalized;
}

function firstPlaceForSlug(slug: string): Place | undefined {
  return (
    placeData.places.find((item) => item.slug === slug && nameMatches(item.name, slug)) ??
    placeData.places.find((item) => item.slug === slug)
  );
}

function uniquePlaces(places: Place[]): Place[] {
  const seen = new Set<string>();
  const unique: Place[] = [];
  for (const place of places) {
    const key = destinationKey(place);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(place);
  }
  return unique;
}

function resultFromPlaces(places: Place[]): PlaceSearchResult {
  const unique = uniquePlaces(places);
  if (unique.length === 0) return { kind: "error", code: "search_no_match" };
  if (unique.length === 1) {
    const place = unique[0];
    return place.slug ? { kind: "slug", slug: place.slug } : { kind: "place", place };
  }
  return { kind: "ambiguous", places: unique };
}

export function findPlace(query: string): PlaceSearchResult {
  const trimmed = query.trim();
  if (!trimmed) return { kind: "error", code: "search_empty" };

  if (/^\d{5}$/.test(trimmed)) {
    const place = placeData.places.find((item) => item.zips.includes(trimmed));
    return place
      ? { kind: "place", place }
      : { kind: "error", code: "zip_not_found" };
  }

  const normalized = normalizePlaceQuery(trimmed);
  const matches: Place[] = [];

  for (const alias of placeData.aliases) {
    if (alias.keys.some((key) => keyMatches(key, normalized))) {
      const place = firstPlaceForSlug(alias.slug);
      if (place) matches.push(place);
    }
  }

  for (const place of placeData.places) {
    const exactName =
      nameMatches(place.name, normalized) ||
      (place.slug !== null && normalizePlaceQuery(place.slug) === normalized);
    const keyed = place.keys.some((key) => keyMatches(key, normalized));
    if (exactName || keyed) matches.push(place);
  }

  return resultFromPlaces(matches);
}

export function nearestPlace(lat: number, lng: number): Place {
  return placeData.places.reduce((nearest, candidate) =>
    haversineMiles(lat, lng, candidate.lat, candidate.lng) <
    haversineMiles(lat, lng, nearest.lat, nearest.lng)
      ? candidate
      : nearest,
  );
}

export function roundCoordinate(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function routeForPlace(place: Place): string {
  return place.slug ? `/forecast/${place.slug}` : viewRoute(place.lat, place.lng, place.name);
}

export function viewRoute(lat: number, lng: number, name: string): string {
  const params = new URLSearchParams({
    lat: lat.toFixed(3),
    lng: lng.toFixed(3),
    name,
  });
  return `/view?${params.toString()}`;
}

export function haversineMiles(
  latA: number,
  lngA: number,
  latB: number,
  lngB: number,
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const deltaLat = toRadians(latB - latA);
  const deltaLng = toRadians(lngB - lngA);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(latA)) *
      Math.cos(toRadians(latB)) *
      Math.sin(deltaLng / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
