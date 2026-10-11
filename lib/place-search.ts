import placeDataJson from "@/data/us-places.json";

import {
  findPlaceInData,
  nearestPlaceInData,
  suggestPlacesInData,
  type Place,
  type PlaceData,
  type PlaceSearchError,
  type PlaceSearchResult,
} from "@/lib/place-match";

export type {
  Place,
  PlaceData,
  PlaceSearchError,
  PlaceSearchResult,
  SearchQueryKind,
} from "@/lib/place-match";
export {
  findPlaceInData,
  haversineMiles,
  normalizePlaceQuery,
  queryKind,
  roundCoordinate,
  routeForPlace,
  suggestPlacesInData,
  viewRoute,
} from "@/lib/place-match";

const placeData = placeDataJson as PlaceData;

export function findPlace(query: string): PlaceSearchResult {
  return findPlaceInData(placeData, query);
}

export function nearestPlace(lat: number, lng: number): Place {
  return nearestPlaceInData(placeData, lat, lng);
}

export function suggestPlaces(query: string, limit = 8): Place[] {
  return suggestPlacesInData(placeData, query, limit);
}
