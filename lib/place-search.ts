import placeDataJson from "@/data/us-places.json";

import {
  findPlaceInData,
  nearestPlaceInData,
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
  viewRoute,
} from "@/lib/place-match";

const placeData = placeDataJson as PlaceData;

export function findPlace(query: string): PlaceSearchResult {
  return findPlaceInData(placeData, query);
}

export function nearestPlace(lat: number, lng: number): Place {
  return nearestPlaceInData(placeData, lat, lng);
}
