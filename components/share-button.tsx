"use client";

import { useState } from "react";

import copy from "@/content/ui-copy.json";

export function ShareButton({ text }: { text?: string }) {
  const [copied, setCopied] = useState(false);

  function handleClick() {
    if (!text || !navigator.clipboard) return;
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      },
      () => undefined,
    );
  }

  return (
    <button className="verdict-card__share" type="button" onClick={handleClick}>
      {copied ? copy.share.copied : copy.chrome.share}
    </button>
  );
}
