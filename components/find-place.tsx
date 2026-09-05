"use client";

import {
  FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import copy from "@/content/ui-copy.json";

import {
  OPEN_FIND_PLACE_EVENT,
  searchErrorCopy,
  usePlaceSearch,
} from "./use-place-search";

export function FindPlace() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const search = usePlaceSearch("find_place");

  function close() {
    search.cancelLocate();
    setOpen(false);
    search.setError(null);
  }

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(OPEN_FIND_PLACE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_FIND_PLACE_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    search.submitQuery();
  }

  function keepFocusInPanel(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      "input:not(:disabled), button:not(:disabled)",
    );
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="find-place">
      <button
        ref={triggerRef}
        className="button button--secondary find-place__trigger"
        type="button"
        aria-expanded={open}
        aria-controls="find-place-panel"
        onClick={() => {
          if (open) {
            close();
            return;
          }
          setOpen(true);
          search.setError(null);
        }}
      >
        {copy.chrome.find_place}
      </button>

      {open ? (
        <>
          <div
            className="find-place__backdrop"
            aria-hidden="true"
            onClick={() => {
              close();
              triggerRef.current?.focus();
            }}
          />
          <section
            ref={panelRef}
            id="find-place-panel"
            className="find-place__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="find-place-title"
            onKeyDown={keepFocusInPanel}
          >
            <div className="find-place__head">
              <h2 id="find-place-title">{copy.chrome.find_place_title}</h2>
              <button
                className="find-place__close"
                type="button"
                onClick={() => {
                  close();
                  triggerRef.current?.focus();
                }}
              >
                {copy.chrome.close}
              </button>
            </div>
            <form method="get" action="/api/search" onSubmit={handleSubmit}>
              <label className="place-search-form__label" htmlFor="find-place-input">
                {copy.chrome.input_label}
              </label>
              <input
                ref={inputRef}
                id="find-place-input"
                name="q"
                type="search"
                value={search.query}
                placeholder={copy.chrome.input_placeholder}
                autoComplete="off"
                aria-invalid={search.error !== null}
                aria-describedby={
                  search.error
                    ? "find-place-error"
                    : search.matches.length
                      ? "find-place-matches"
                      : "find-place-privacy"
                }
                onChange={(event) => {
                  search.setQuery(event.target.value);
                  search.setError(null);
                }}
              />
              <div className="find-place__actions">
                <button
                  className="button button--secondary"
                  type="button"
                  disabled={search.locating}
                  aria-busy={search.locating}
                  onClick={search.locate}
                >
                  {search.locating ? copy.chrome.locating : copy.chrome.use_my_location}
                </button>
                <button className="button button--primary" type="submit" disabled={search.checking}>
                  {search.checking ? copy.chrome.checking : copy.chrome.check_tonight}
                </button>
              </div>
              <p id="find-place-privacy" className="find-place__privacy">
                {copy.chrome.gps_privacy}
              </p>
              {search.matches.length > 0 ? (
                <div id="find-place-matches" className="place-search-form__matches" role="status">
                  <p>{copy.errors.search_ambiguous}</p>
                  <ul>
                    {search.matches.map((place) => (
                      <li key={`${place.name}-${place.lat}-${place.lng}`}>
                        <button
                          type="button"
                          onClick={() => {
                            close();
                            search.navigatePlace(place);
                          }}
                        >
                          {place.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {search.error ? (
                <p id="find-place-error" className="find-place__error" role="alert">
                  {searchErrorCopy[search.error]}
                </p>
              ) : null}
            </form>
          </section>
        </>
      ) : null}
    </div>
  );
}
