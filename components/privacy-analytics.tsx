"use client";

import { useEffect } from "react";

import {
  ANALYTICS_OPT_OUT_KEY,
  syncAnalyticsSessionFromBrowser,
} from "@/lib/analytics-privacy";

export function PrivacyAnalytics() {
  useEffect(() => {
    syncAnalyticsSessionFromBrowser();

    function syncFromOtherTab(event: StorageEvent) {
      if (event.key !== ANALYTICS_OPT_OUT_KEY) return;
      syncAnalyticsSessionFromBrowser();
    }

    window.addEventListener("storage", syncFromOtherTab);
    return () => window.removeEventListener("storage", syncFromOtherTab);
  }, []);

  return null;
}
