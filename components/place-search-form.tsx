"use client";

import { type FormEvent } from "react";

import copy from "@/content/ui-copy.json";
import type { SearchAnalyticsSource } from "@/lib/search-event";

import { searchErrorCopy, usePlaceSearch } from "./use-place-search";

export function PlaceSearchForm({
  source = "home",
  idPrefix = "page-place-search",
}: {
  source?: SearchAnalyticsSource;
  idPrefix?: string;
}) {
  const search = usePlaceSearch(source);
  const errorId = `${idPrefix}-error`;
  const privacyId = `${idPrefix}-privacy`;
  const matchesId = `${idPrefix}-matches`;
  const suggestionsId = `${idPrefix}-suggestions`;
  const dropdownPlaces = search.matches.length > 0 ? search.matches : search.suggestions;
  const dropdownId = search.matches.length > 0 ? matchesId : suggestionsId;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    search.submitQuery();
  }

  return (
    <form
      className="place-search-form"
      method="get"
      action="/api/search"
      onSubmit={handleSubmit}
    >
      <label className="place-search-form__label" htmlFor={idPrefix}>
        {copy.chrome.input_label}
      </label>
      <div className="place-search-form__row">
        <input
          id={idPrefix}
          name="q"
          type="search"
          value={search.query}
          placeholder={copy.chrome.input_placeholder}
          autoComplete="off"
          aria-invalid={search.error !== null}
          aria-describedby={
            search.error ? errorId : dropdownPlaces.length ? dropdownId : privacyId
          }
          aria-autocomplete="list"
          aria-controls={dropdownPlaces.length ? dropdownId : undefined}
          onChange={(event) => {
            search.setQuery(event.target.value);
          }}
        />
        <button className="button button--primary" type="submit" disabled={search.checking}>
          {search.checking ? copy.chrome.checking : copy.chrome.check_tonight}
        </button>
      </div>
      <div className="place-search-form__below">
        <button
          className="button button--secondary"
          type="button"
          disabled={search.locating || search.checking}
          aria-busy={search.locating}
          onClick={search.locate}
        >
          {search.locating ? copy.chrome.locating : copy.chrome.use_my_location}
        </button>
        <p id={privacyId}>{copy.chrome.gps_privacy}</p>
      </div>
      {dropdownPlaces.length > 0 ? (
        <div id={dropdownId} className="place-search-form__matches" role="listbox">
          {search.matches.length > 0 ? <p>{copy.errors.search_ambiguous}</p> : null}
          {search.error === "search_no_match" && search.suggestions.length > 0 ? (
            <p>{copy.errors.search_did_you_mean.replace("{Place}", search.suggestions[0]?.name ?? "")}</p>
          ) : null}
          <ul>
            {dropdownPlaces.map((place) => (
              <li key={`${place.name}-${place.lat}-${place.lng}`}>
                <button type="button" onClick={() => search.navigatePlace(place)}>
                  {place.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {search.error ? (
        <p id={errorId} className="place-search-form__error" role="alert">
          {searchErrorCopy[search.error]}
        </p>
      ) : null}
    </form>
  );
}
