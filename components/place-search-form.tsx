"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import copy from "@/content/ui-copy.json";
import {
  findPlace,
  nearestPlace,
  roundCoordinate,
  routeForPlace,
  viewRoute,
  type PlaceSearchError,
  type PlaceSearchResult,
} from "@/lib/place-search";

const errorCopy: Record<PlaceSearchError | "gps_denied" | "gps_unavailable", string> = {
  search_empty: copy.errors.search_empty,
  search_no_match: copy.errors.search_no_match,
  zip_not_found: copy.errors.zip_not_found,
  gps_denied: copy.errors.gps_denied,
  gps_unavailable: copy.errors.gps_unavailable,
};

export function PlaceSearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<keyof typeof errorCopy | null>(null);
  const [locating, setLocating] = useState(false);

  function navigate(result: Exclude<PlaceSearchResult, { kind: "error" }>) {
    router.push(
      result.kind === "slug" ? `/forecast/${result.slug}` : routeForPlace(result.place),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = findPlace(query);
    if (result.kind === "error") {
      setError(result.code);
      return;
    }
    navigate(result);
  }

  function handleLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("gps_unavailable");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = roundCoordinate(coords.latitude);
        const lng = roundCoordinate(coords.longitude);
        setLocating(false);

        if (lat < 0) {
          router.push(viewRoute(lat, lng, `${lat.toFixed(3)}, ${lng.toFixed(3)}`));
          return;
        }

        router.push(routeForPlace(nearestPlace(lat, lng)));
      },
      (positionError) => {
        setLocating(false);
        setError(positionError.code === 1 ? "gps_denied" : "gps_unavailable");
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    );
  }

  return (
    <form className="place-search-form" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="page-place-search">
        {copy.chrome.input_placeholder}
      </label>
      <div className="place-search-form__row">
        <input
          id="page-place-search"
          type="search"
          value={query}
          placeholder={copy.chrome.input_placeholder}
          aria-invalid={error !== null}
          aria-describedby={error ? "page-place-search-error" : "page-place-search-privacy"}
          onChange={(event) => {
            setQuery(event.target.value);
            setError(null);
          }}
        />
        <button className="button button--primary" type="submit">
          {copy.chrome.check}
        </button>
      </div>
      <div className="place-search-form__below">
        <button
          className="button button--secondary"
          type="button"
          disabled={locating}
          aria-busy={locating}
          onClick={handleLocation}
        >
          {copy.chrome.use_my_location}
        </button>
        <p id="page-place-search-privacy">{copy.chrome.gps_privacy}</p>
      </div>
      {error ? (
        <p id="page-place-search-error" className="place-search-form__error" role="alert">
          {errorCopy[error]}
        </p>
      ) : null}
    </form>
  );
}
