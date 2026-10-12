"use client";

import { useEffect } from "react";

import {
  ANALYTICS_OPT_OUT_KEY,
  analyticsSessionGate,
  reconcileAnalyticsStorageEvent,
} from "@/lib/analytics-privacy";

export function PrivacyAnalytics() {
  useEffect(() => {
    function syncFromStorage() {
      reconcileAnalyticsStorageEvent(analyticsSessionGate, () =>
        window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY),
      );
    }

    try {
      syncFromStorage();
    } catch {
      analyticsSessionGate.disable();
    }

    function syncFromOtherTab(event: StorageEvent) {
      if (event.key !== ANALYTICS_OPT_OUT_KEY) return;
      reconcileAnalyticsStorageEvent(analyticsSessionGate, () =>
        window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY),
      );
    }

    window.addEventListener("storage", syncFromOtherTab);
    return () => window.removeEventListener("storage", syncFromOtherTab);
  }, []);

  return null;
}
