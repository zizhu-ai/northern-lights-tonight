"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { forecastViewOnce, prepareForecastViewEvent } from "@/lib/forecast-view-event";
import { trackBrowserProductEvent } from "@/lib/search-analytics";
import type { AnalyticsPageType, VerdictAnalyticsStatus } from "@/lib/search-event";

export function ForecastViewTracker({
  pageType,
  state,
  verdict,
}: {
  pageType: Extract<AnalyticsPageType, "home" | "forecast" | "view">;
  state?: string;
  verdict: VerdictAnalyticsStatus;
}) {
  const pathname = usePathname();

  useEffect(() => {
    const props = prepareForecastViewEvent(
      window.location.href,
      { pageType, state, verdict },
      forecastViewOnce,
    );
    if (!props) return;
    void trackBrowserProductEvent("forecast_view", props);
  }, [pageType, pathname, state, verdict]);

  return null;
}
