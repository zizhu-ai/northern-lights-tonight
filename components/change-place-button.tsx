"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import copy from "@/content/ui-copy.json";
import { trackBrowserProductEvent } from "@/lib/search-analytics";

import { openFindPlace } from "./use-place-search";

export function ChangePlaceButton({
  via,
  className,
}: {
  via: "card" | "sticky";
  className?: string;
}) {
  return (
    <button
      className={className ?? "verdict-card__change"}
      type="button"
      onClick={() => {
        void trackBrowserProductEvent("change_place", { via });
        openFindPlace();
      }}
    >
      {copy.chrome.change_place}
    </button>
  );
}

export function RecheckButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="verdict-card__share"
      type="button"
      disabled={pending}
      aria-busy={pending}
      onClick={() => {
        const url = new URL(window.location.href);
        url.searchParams.set("recheck", String(Date.now()));
        startTransition(() => {
          router.replace(`${url.pathname}?${url.searchParams.toString()}`, {
            scroll: false,
          });
        });
      }}
    >
      {pending ? copy.chrome.checking : copy.chrome.recheck}
    </button>
  );
}
