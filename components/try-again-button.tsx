"use client";

import copy from "@/content/ui-copy.json";

export function TryAgainButton() {
  return (
    <button
      className="verdict-card__share"
      type="button"
      onClick={() => {
        window.location.reload();
      }}
    >
      {copy.chrome.try_again}
    </button>
  );
}
