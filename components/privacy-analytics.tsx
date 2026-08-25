"use client";

import { Analytics } from "@vercel/analytics/next";
import { useEffect, useState } from "react";

import {
  ANALYTICS_OPT_OUT_KEY,
  browserAnalyticsDisabled,
  sanitizeAnalyticsEvent,
} from "@/lib/analytics-privacy";

export function PrivacyAnalytics() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return (
    <Analytics
      beforeSend={(event) => {
        let storageValue: string | null = null;

        try {
          storageValue = window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY);
        } catch {
          // Storage can be unavailable in privacy-restricted browser contexts.
        }

        return sanitizeAnalyticsEvent(
          { ...event },
          browserAnalyticsDisabled(storageValue, navigator.doNotTrack),
        );
      }}
    />
  );
}
