"use client";

import { useEffect, useState } from "react";

import {
  ANALYTICS_OPT_OUT_KEY,
  analyticsSessionGate,
  syncAnalyticsSessionFromBrowser,
} from "@/lib/analytics-privacy";

type PreferenceState = "loading" | "enabled" | "disabled" | "unavailable";

export function AnalyticsPreference() {
  const [preference, setPreference] = useState<PreferenceState>("loading");

  useEffect(() => {
    setPreference(syncAnalyticsSessionFromBrowser());

    function syncFromOtherTab(event: StorageEvent) {
      if (event.key === ANALYTICS_OPT_OUT_KEY) {
        setPreference(syncAnalyticsSessionFromBrowser());
      }
    }

    window.addEventListener("storage", syncFromOtherTab);
    return () => window.removeEventListener("storage", syncFromOtherTab);
  }, []);

  function updatePreference() {
    const nextValue = preference === "enabled" || preference === "unavailable";

    try {
      if (nextValue) {
        window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "1");
      } else {
        window.localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
      }
    } catch {
      analyticsSessionGate.disable();
      setPreference("unavailable");
      return;
    }

    if (nextValue) {
      analyticsSessionGate.disable();
      setPreference("disabled");
      return;
    }
    setPreference(syncAnalyticsSessionFromBrowser());
  }

  if (preference === "loading") {
    return <p role="status">Loading analytics preference…</p>;
  }

  const optedOut = preference !== "enabled";
  const unavailable = preference === "unavailable";

  return (
    <>
      <button
        aria-describedby={unavailable ? "analytics-preference-status" : undefined}
        aria-pressed={optedOut}
        className="button button--secondary"
        onClick={updatePreference}
        type="button"
      >
        {unavailable
          ? "Retry saving analytics opt-out"
          : optedOut
            ? "Opt in to analytics"
            : "Opt out of analytics"}
      </button>
      {unavailable ? (
        <p id="analytics-preference-status" role="status">
          Analytics stays off because this browser could not save your
          preference.
        </p>
      ) : null}
    </>
  );
}
