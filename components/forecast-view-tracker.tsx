"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { forecastViewOnce, prepareForecastViewEvent } from "@/lib/forecast-view-event";
import { trackBrowserProductEvent } from "@/lib/search-analytics";
import type { AnalyticsPageType, VerdictAnalyticsStatus } from "@/lib/search-event";

export function ForecastViewTracker({
  pageType,
  state,
  placeSlug,
  verdict,
}: {
  pageType: Extract<AnalyticsPageType, "home" | "forecast" | "view">;
  state?: string | null;
  placeSlug?: string | null;
  verdict: VerdictAnalyticsStatus;
}) {
  const pathname = usePathname();

  useEffect(() => {
    const props = prepareForecastViewEvent(
      window.location.href,
      { pageType, state, placeSlug, verdict },
      forecastViewOnce,
    );
    if (!props) return;
    void trackBrowserProductEvent("forecast_view", props);
  }, [pageType, pathname, placeSlug, state, verdict]);

  return null;
}
