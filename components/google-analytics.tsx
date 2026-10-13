"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import {
  ANALYTICS_OPT_OUT_KEY,
  analyticsSessionGate,
  ga4ConfigFields,
  gaPageViewSequence,
  isValidGaMeasurementId,
  readAnalyticsOptOut,
  readBrowserDoNotTrack,
  shouldLoadGoogleAnalytics,
} from "@/lib/analytics-privacy";
import { ensureGtagInstalled, queueGtag } from "@/lib/ga-client";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

function gaIsAllowedHere(): boolean {
  return shouldLoadGoogleAnalytics({
    measurementId: GA_MEASUREMENT_ID,
    hostname: window.location.hostname,
    storageOptOut: readAnalyticsOptOut(),
    dnt: readBrowserDoNotTrack(),
  });
}

// GA4 page views. Loads only on aurora-tonight.com after opt-out and DNT
// checks. send_page_view is false so hits are sanitized page_view events we
// send ourselves, including App Router navigations. GA4 Enhanced Measurement
// "page changes based on browser history events" must be OFF or those
// automatic hits would both double-count and leak unsanitized URLs.
export function GoogleAnalytics() {
  const pathname = usePathname();
  const lastLocation = useRef<string | null>(null);

  useEffect(() => {
    if (!isValidGaMeasurementId(GA_MEASUREMENT_ID)) return;
    if (!gaIsAllowedHere()) {
      analyticsSessionGate.disable();
      return;
    }

    analyticsSessionGate.enable();
    const page = gaPageViewSequence.next(window.location.href, document.referrer);
    if (lastLocation.current === page.page_location) return;
    lastLocation.current = page.page_location;
    ensureGtagInstalled(GA_MEASUREMENT_ID);
    queueGtag("config", GA_MEASUREMENT_ID, ga4ConfigFields(page));
    queueGtag("event", "page_view", page);
  }, [pathname]);

  useEffect(() => {
    function syncOptOut(event: StorageEvent) {
      if (event.key && event.key !== ANALYTICS_OPT_OUT_KEY) return;
      if (!gaIsAllowedHere()) {
        analyticsSessionGate.disable();
      }
    }
    window.addEventListener("storage", syncOptOut);
    return () => window.removeEventListener("storage", syncOptOut);
  }, []);

  return null;
}
