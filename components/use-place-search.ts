"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import copy from "@/content/ui-copy.json";
import { trackBrowserProductEvent } from "@/lib/search-analytics";
import type { SearchAnalyticsSource } from "@/lib/search-event";
import {
  checkingAfterLookup,
  planLocate,
  planTypedSubmit,
} from "@/lib/place-search-flow";
import {
  findPlace,
  nearestPlace,
  queryKind,
  roundCoordinate,
  routeForPlace,
  viewRoute,
  type Place,
  type PlaceSearchError,
} from "@/lib/place-search";

export type SearchFormError =
  | PlaceSearchError
  | "gps_denied"
  | "gps_unavailable"
  | "gps_timeout";

export const searchErrorCopy: Record<SearchFormError, string> = {
  search_empty: copy.errors.search_empty,
  search_no_match: copy.errors.search_no_match,
  zip_not_found: copy.errors.zip_not_found,
  gps_denied: copy.errors.gps_denied,
  gps_unavailable: copy.errors.gps_unavailable,
  gps_timeout: copy.errors.gps_timeout,
};

export function usePlaceSearch(source: SearchAnalyticsSource) {
  const router = useRouter();
  const gpsGeneration = useRef(0);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<SearchFormError | null>(null);
  const [matches, setMatches] = useState<Place[]>([]);
  const [locating, setLocating] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const initial = new URLSearchParams(window.location.search).get("q");
    if (!initial) return;
    setQuery(initial);
    const result = findPlace(initial);
    if (result.kind === "ambiguous") setMatches(result.places);
    if (result.kind === "error") setError(result.code);
  }, []);

  function goTo(path: string, destination: "forecast" | "view") {
    void trackBrowserProductEvent("result_shown", { source, destination });
    router.push(path);
  }

  function navigatePlace(place: Place) {
    if (checking) return;
    cancelLocate();
    setMatches([]);
    setError(null);
    setChecking(checkingAfterLookup("navigate"));
    goTo(routeForPlace(place), place.slug ? "forecast" : "view");
  }

  function submitQuery(nextQuery = query) {
    const plan = planTypedSubmit(checking);
    if (!plan.proceed) return;
    if (plan.cancelGps) cancelLocate();

    setError(null);
    setMatches([]);
    const kind = queryKind(nextQuery);
    void trackBrowserProductEvent("search_submit", { source, query_kind: kind });

    const result = findPlace(nextQuery);
    if (result.kind === "error") {
      setChecking(checkingAfterLookup("error"));
      setError(result.code);
      void trackBrowserProductEvent("search_match", {
        source,
        result: "fail",
        failure_type:
          result.code === "search_empty"
            ? "empty"
            : result.code === "zip_not_found"
              ? "zip_not_found"
              : "no_match",
      });
      return;
    }
    if (result.kind === "ambiguous") {
      setChecking(checkingAfterLookup("ambiguous"));
      setMatches(result.places);
      void trackBrowserProductEvent("search_match", { source, result: "ambiguous" });
      return;
    }

    void trackBrowserProductEvent("search_match", { source, result: "success" });
    setChecking(checkingAfterLookup("navigate"));
    if (result.kind === "slug") {
      goTo(`/forecast/${result.slug}`, "forecast");
      return;
    }
    goTo(routeForPlace(result.place), result.place.slug ? "forecast" : "view");
  }

  function locate() {
    if (!planLocate(checking).proceed) return;
    setError(null);
    if (!navigator.geolocation) {
      setError("gps_unavailable");
      void trackBrowserProductEvent("locate_fail", {
        source,
        failure_type: "gps_unavailable",
      });
      return;
    }

    const generation = ++gpsGeneration.current;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (generation !== gpsGeneration.current) return;
        const lat = roundCoordinate(coords.latitude);
        const lng = roundCoordinate(coords.longitude);
        setLocating(false);
        setChecking(true);
        void trackBrowserProductEvent("search_match", { source, result: "success" });

        if (lat < 0) {
          goTo(viewRoute(lat, lng, `${lat.toFixed(3)}, ${lng.toFixed(3)}`), "view");
          return;
        }

        const place = nearestPlace(lat, lng);
        goTo(routeForPlace(place), place.slug ? "forecast" : "view");
      },
      (positionError) => {
        if (generation !== gpsGeneration.current) return;
        setLocating(false);
        const failure =
          positionError.code === 1
            ? "gps_denied"
            : positionError.code === 3
              ? "gps_timeout"
              : "gps_unavailable";
        setError(failure);
        void trackBrowserProductEvent("locate_fail", { source, failure_type: failure });
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    );
  }

  function cancelLocate() {
    gpsGeneration.current += 1;
    setLocating(false);
  }

  return {
    query,
    setQuery,
    error,
    setError,
    matches,
    locating,
    checking,
    submitQuery,
    locate,
    cancelLocate,
    navigatePlace,
  };
}

export const OPEN_FIND_PLACE_EVENT = "nlt:open-find-place";

export function openFindPlace() {
  const input = document.getElementById("page-place-search");
  if (input instanceof HTMLInputElement) {
    input.focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  window.dispatchEvent(new Event(OPEN_FIND_PLACE_EVENT));
}
