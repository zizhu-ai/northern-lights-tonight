"use client";

import { useEffect, useState } from "react";

import { ANALYTICS_OPT_OUT_KEY } from "@/lib/analytics-privacy";

function readOptOut(): boolean {
  try {
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function AnalyticsPreference() {
  const [optedOut, setOptedOut] = useState(false);

  useEffect(() => {
    setOptedOut(readOptOut());

    function syncFromOtherTab(event: StorageEvent) {
      if (event.key === ANALYTICS_OPT_OUT_KEY) {
        setOptedOut(event.newValue === "1");
      }
    }

    window.addEventListener("storage", syncFromOtherTab);
    return () => window.removeEventListener("storage", syncFromOtherTab);
  }, []);

  function toggleOptOut() {
    const nextValue = !optedOut;

    try {
      if (nextValue) {
        window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "1");
      } else {
        window.localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
      }
    } catch {
      return;
    }

    setOptedOut(nextValue);
  }

  return (
    <button
      aria-pressed={optedOut}
      className="button button--secondary"
      onClick={toggleOptOut}
      type="button"
    >
      {optedOut ? "Opt in to analytics" : "Opt out of analytics"}
    </button>
  );
}
