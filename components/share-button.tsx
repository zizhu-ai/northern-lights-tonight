"use client";

import { useState } from "react";

import copy from "@/content/ui-copy.json";

type ShareState = "idle" | "copied" | "failed";

const LABELS: Record<ShareState, string> = {
  idle: copy.chrome.share,
  copied: copy.share.copied,
  failed: copy.share.failed,
};

export function ShareButton({ text }: { text?: string }) {
  const [state, setState] = useState<ShareState>("idle");

  function flash(next: Exclude<ShareState, "idle">) {
    setState(next);
    window.setTimeout(() => setState("idle"), 1600);
  }

  async function handleClick() {
    if (!text) return;

    // The native sheet is the better mobile affordance; a cancelled share is a
    // deliberate user choice, so it must not surface as a failure.
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      flash("copied");
    } catch {
      flash("failed");
    }
  }

  return (
    <button
      className="verdict-card__share"
      type="button"
      onClick={() => void handleClick()}
      data-state={state}
    >
      <span aria-live="polite">{LABELS[state]}</span>
    </button>
  );
}
