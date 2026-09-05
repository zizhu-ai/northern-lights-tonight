"use client";

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
  return (
    <button
      className="verdict-card__share"
      type="button"
      onClick={() => {
        router.refresh();
      }}
    >
      {copy.chrome.recheck}
    </button>
  );
}
