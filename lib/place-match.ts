export type Place = {
  name: string;
  lat: number;
  lng: number;
  tz: string;
  slug: string | null;
  keys: string[];
  zips: string[];
};

export type PlaceData = {
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

function firstPlaceForSlug(data: PlaceData, slug: string): Place | undefined {
  const slugName = normalizePlaceQuery(slug.replaceAll("-", " "));
  return (
    data.places.find(
      (item) => item.slug === slug && normalizePlaceQuery(item.name) === slugName,
    ) ??
    data.places.find((item) => item.slug === slug && nameMatches(item.name, slug)) ??
    data.places.find((item) => item.slug === slug)
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

export function suggestPlacesInData(
  data: PlaceData,
  query: string,
  limit = 8,
): Place[] {
  const normalized = normalizePlaceQuery(query);
  if (normalized.length < 2) return [];
  const matches: Place[] = [];

  for (const alias of data.aliases) {
    if (
      alias.keys.some(
        (key) =>
          keyMatches(key, normalized) ||
          normalizePlaceQuery(key).startsWith(normalized),
      )
    ) {
      const place = firstPlaceForSlug(data, alias.slug);
      if (place) matches.push(place);
    }
  }

  const slugPlaces = data.places.filter((place) => place.slug);
  const pinPlaces = data.places.filter((place) => !place.slug);
  for (const place of [...slugPlaces, ...pinPlaces]) {
    const name = normalizePlaceQuery(place.name);
    const slug = place.slug ? normalizePlaceQuery(place.slug) : "";
    const keyed = place.keys.some(
      (key) =>
        keyMatches(key, normalized) || normalizePlaceQuery(key).startsWith(normalized),
    );
    if (
      keyed ||
      name === normalized ||
      name.startsWith(normalized) ||
      name.includes(` ${normalized}`) ||
      (slug && (slug === normalized || slug.startsWith(normalized)))
    ) {
      matches.push(place);
    }
  }

  return uniquePlaces(matches).slice(0, limit);
}

export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array<number>(b.length + 1);
  for (let i = 0; i < a.length; i += 1) {
    current[0] = i + 1;
    for (let j = 0; j < b.length; j += 1) {
      const cost = a[i] === b[j] ? 0 : 1;
      current[j + 1] = Math.min(current[j] + 1, previous[j + 1] + 1, previous[j] + cost);
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length] ?? b.length;
}

function isCanonicalSlugPlace(place: Place): boolean {
  if (!place.slug) return false;
  return normalizePlaceQuery(place.name) === normalizePlaceQuery(place.slug.replaceAll("-", " "));
}

function isStateNamePlace(place: Place): boolean {
  return isCanonicalSlugPlace(place) && !place.name.includes(",");
}

export function closestTypedPlaceInData(data: PlaceData, query: string): Place | null {
  const normalized = normalizePlaceQuery(query);
  if (normalized.length < 5) return null;
  let bestPlace: Place | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  const consider = (place: Place, value: string) => {
    if (!value || Math.abs(value.length - normalized.length) > 2) return;
    const distance = editDistance(value, normalized);
    if (distance === 0 || distance > 2) return;
    if (bestPlace && distance > bestDistance) return;
    if (bestPlace && distance === bestDistance) {
      const nextState = isStateNamePlace(place);
      const bestState = isStateNamePlace(bestPlace);
      if (bestState || !nextState) return;
    }
    bestPlace = place;
    bestDistance = distance;
  };
  for (const place of data.places) {
    consider(place, normalizePlaceQuery(place.name));
    if (isCanonicalSlugPlace(place) && place.slug) {
      consider(place, normalizePlaceQuery(place.slug.replaceAll("-", " ")));
    }
    for (const key of place.keys) consider(place, normalizePlaceQuery(key));
  }
  return bestPlace;
}

export function searchStateFromQueryInData(
  data: PlaceData,
  query: string,
): {
  error: PlaceSearchError | null;
  matches: Place[];
  suggestions: Place[];
} {
  const result = findPlaceInData(data, query);
  if (result.kind === "ambiguous") {
    return { error: null, matches: result.places, suggestions: [] };
  }
  if (result.kind === "error") {
    const closest = result.code === "search_no_match" ? closestTypedPlaceInData(data, query) : null;
    return {
      error: result.code,
      matches: [],
      suggestions: closest ? [closest] : [],
    };
  }
  return { error: null, matches: [], suggestions: [] };
}

export function findPlaceInData(data: PlaceData, query: string): PlaceSearchResult {
  const trimmed = query.trim();
  if (!trimmed) return { kind: "error", code: "search_empty" };

  if (/^\d{5}$/.test(trimmed)) {
    const place = data.places.find((item) => item.zips.includes(trimmed));
    return place
      ? { kind: "place", place }
      : { kind: "error", code: "zip_not_found" };
  }

  const normalized = normalizePlaceQuery(trimmed);
  const matches: Place[] = [];

  for (const alias of data.aliases) {
    if (alias.keys.some((key) => keyMatches(key, normalized))) {
      const place = firstPlaceForSlug(data, alias.slug);
      if (place) matches.push(place);
    }
  }

  for (const place of data.places) {
    const exactName =
      nameMatches(place.name, normalized) ||
      (place.slug !== null && normalizePlaceQuery(place.slug) === normalized);
    const keyed = place.keys.some((key) => keyMatches(key, normalized));
    if (exactName || keyed) matches.push(place);
  }

  return resultFromPlaces(matches);
}

export function nearestPlaceInData(data: PlaceData, lat: number, lng: number): Place {
  return data.places.reduce((nearest, candidate) =>
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
