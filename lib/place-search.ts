import placeDataJson from "@/data/us-places.json";

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
  | { kind: "error"; code: PlaceSearchError };

const placeData = placeDataJson as PlaceData;

export function normalizePlaceQuery(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
  const alias = placeData.aliases.find((item) =>
    item.keys.some((key) => normalizePlaceQuery(key) === normalized),
  );
  if (alias) return { kind: "slug", slug: alias.slug };

  const waveOnePlace = placeData.places.find(
    (item) =>
      item.slug !== null &&
      (normalizePlaceQuery(item.name) === normalized ||
        normalizePlaceQuery(item.slug) === normalized),
  );
  if (waveOnePlace) return { kind: "place", place: waveOnePlace };

  const keyedPlace = placeData.places.find((item) =>
    item.keys.some((key) => normalizePlaceQuery(key) === normalized),
  );
  return keyedPlace
    ? { kind: "place", place: keyedPlace }
    : { kind: "error", code: "search_no_match" };
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
