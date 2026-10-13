"use client";

import type { ReactNode, SyntheticEvent } from "react";

import { trackBrowserProductEvent } from "@/lib/search-analytics";

export function TrackedFaqDetails({
  faqId,
  children,
}: {
  faqId: string;
  children: ReactNode;
}) {
  return (
    <details
      onToggle={(event: SyntheticEvent<HTMLDetailsElement>) => {
        if (!event.currentTarget.open) return;
        void trackBrowserProductEvent("faq_expand", { faq_id: faqId });
      }}
    >
      {children}
    </details>
  );
}
