"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { trackBrowserProductEvent } from "@/lib/search-analytics";
import type { AnalyticsPageType } from "@/lib/search-event";

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
      onClick={() => {
        void trackBrowserProductEvent("state_nav", {
          from_page_type: fromPageType,
          to_state: toState,
        });
      }}
    >
      {children}
    </Link>
  );
}
