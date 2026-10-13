"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

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
    void trackBrowserProductEvent("forecast_view", {
      page_type: pageType,
      verdict,
      ...(state ? { state } : {}),
    });
  }, [pageType, pathname, state, verdict]);

  return null;
}
