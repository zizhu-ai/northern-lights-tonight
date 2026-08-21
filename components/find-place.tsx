"use client";

import {
  FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
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

export function FindPlace() {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<keyof typeof errorCopy | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    setError(null);
  }

  function navigate(result: Exclude<PlaceSearchResult, { kind: "error" }>) {
    close();
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
        close();

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
        className="button button--primary find-place__trigger"
        type="button"
        aria-expanded={open}
        aria-controls="find-place-panel"
        onClick={() => {
          setOpen((current) => !current);
          setError(null);
        }}
      >
        {copy.chrome.find_place}
      </button>

      {open ? (
        <>
          <div className="find-place__backdrop" aria-hidden="true" onClick={close} />
          <section
            ref={panelRef}
            id="find-place-panel"
            className="find-place__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="find-place-title"
            onKeyDown={keepFocusInPanel}
          >
            <h2 id="find-place-title">{copy.chrome.find_place_title}</h2>
            <form onSubmit={handleSubmit}>
              <label className="visually-hidden" htmlFor="find-place-input">
                {copy.chrome.input_placeholder}
              </label>
              <input
                ref={inputRef}
                id="find-place-input"
                type="search"
                value={query}
                placeholder={copy.chrome.input_placeholder}
                aria-invalid={error !== null}
                aria-describedby={error ? "find-place-error" : "find-place-privacy"}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setError(null);
                }}
              />
              <div className="find-place__actions">
                <button
                  className="button button--secondary"
                  type="button"
                  disabled={locating}
                  aria-busy={locating}
                  onClick={handleLocation}
                >
                  {copy.chrome.use_my_location}
                </button>
                <button className="button button--primary" type="submit">
                  {copy.chrome.check}
                </button>
              </div>
              <p id="find-place-privacy" className="find-place__privacy">
                {copy.chrome.gps_privacy}
              </p>
              {error ? (
                <p id="find-place-error" className="find-place__error" role="alert">
                  {errorCopy[error]}
                </p>
              ) : null}
            </form>
          </section>
        </>
      ) : null}
    </div>
  );
}
