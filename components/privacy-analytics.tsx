"use client";

import { Analytics } from "@vercel/analytics/next";
import { useEffect, useState } from "react";

import {
  ANALYTICS_OPT_OUT_KEY,
  analyticsSessionGate,
  browserAnalyticsDisabled,
  reconcileAnalyticsStorageEvent,
  sanitizeAnalyticsEvent,
} from "@/lib/analytics-privacy";

export function PrivacyAnalytics() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);

    function syncFromOtherTab(event: StorageEvent) {
      if (event.key !== ANALYTICS_OPT_OUT_KEY) return;

      reconcileAnalyticsStorageEvent(analyticsSessionGate, () =>
        window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY),
      );
    }

    window.addEventListener("storage", syncFromOtherTab);
    return () => window.removeEventListener("storage", syncFromOtherTab);
  }, []);

  if (!hydrated) return null;

  return (
    <Analytics
      beforeSend={(event) => {
        let storageValue: string | null = null;

        try {
          storageValue = window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY);
        } catch {
          analyticsSessionGate.disable();
        }

        if (storageValue === "1") {
          analyticsSessionGate.disable();
        }

        return sanitizeAnalyticsEvent(
          { ...event },
          analyticsSessionGate.isDisabled() ||
            browserAnalyticsDisabled(storageValue, navigator.doNotTrack),
        );
      }}
    />
  );
}
