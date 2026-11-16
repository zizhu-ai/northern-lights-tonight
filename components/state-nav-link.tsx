"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { trackBrowserProductEvent } from "@/lib/search-analytics";
import type { AnalyticsPageType } from "@/lib/search-event";

function trackStateNav(fromPageType: AnalyticsPageType, toState: string) {
  void trackBrowserProductEvent("state_nav", {
    from_page_type: fromPageType,
    to_state: toState,
  });
}

export function StateNavLink({
  href,
  toState,
  fromPageType,
  className,
  children,
}: {
  href: string;
  toState: string;
  fromPageType: AnalyticsPageType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      className={className}
      href={href}
      // pointerdown fires before Next soft/full navigation commits, so the
      // beacon-backed state_nav hit is queued even when click handlers race unload.
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        trackStateNav(fromPageType, toState);
      }}
      onClick={(event) => {
        // Keyboard activation / accessibility paths may skip pointerdown.
        if (event.detail === 0) {
          trackStateNav(fromPageType, toState);
        }
      }}
    >
      {children}
    </Link>
  );
}
