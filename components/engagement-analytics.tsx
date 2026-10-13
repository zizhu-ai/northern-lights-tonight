"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  analyticsAllowed,
  readAnalyticsOptOut,
  readBrowserDoNotTrack,
} from "@/lib/analytics-privacy";
import {
  createVisibleTimeTracker,
  shouldEmitScrollDepth50,
  visibleScrollPercent,
} from "@/lib/engagement-metrics";
import { trackBrowserProductEvent } from "@/lib/search-analytics";
import { pageTypeFromPath } from "@/lib/search-event";

function analyticsOpen(): boolean {
  return analyticsAllowed({
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
    hostname: window.location.hostname,
    storageOptOut: readAnalyticsOptOut(),
    dnt: readBrowserDoNotTrack(),
    requireProductionHost: true,
  });
}

export function EngagementAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined" || !analyticsOpen()) return;

    const pageType = pageTypeFromPath(pathname);
    let scrollSent = false;
    const visible = createVisibleTimeTracker();
    if (!document.hidden) visible.onVisible(Date.now());

    function onScroll() {
      if (!analyticsOpen()) return;
      const percent = visibleScrollPercent(
        window.scrollY,
        window.innerHeight,
        document.documentElement.scrollHeight,
      );
      if (!shouldEmitScrollDepth50(percent, scrollSent)) return;
      scrollSent = true;
      void trackBrowserProductEvent("scroll_depth", { percent: "50", page_type: pageType });
    }

    function onVisibility() {
      if (document.hidden) visible.onHidden(Date.now());
      else visible.onVisible(Date.now());
    }

    const interval = window.setInterval(() => {
      if (!analyticsOpen()) return;
      if (visible.tick(Date.now())) {
        void trackBrowserProductEvent("engaged_60s", { page_type: pageType });
      }
    }, 1000);

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    onScroll();

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pathname]);

  return null;
}
