"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import copy from "@/content/ui-copy.json";

const links = [
  { label: copy.chrome.nav_tonight, href: "/" },
  { label: copy.chrome.nav_near_me, href: "/near-me" },
  {
    label: copy.chrome.nav_guides,
    href: "/guides/best-time-to-see-northern-lights",
  },
];

export function MobileNav() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const panelId = useId();

  function close() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="mobile-nav">
      <button
        ref={triggerRef}
        className="button button--secondary mobile-nav__toggle"
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        {copy.chrome.nav_menu}
      </button>
      {open ? (
        <>
          <div
            className="mobile-nav__backdrop"
            aria-hidden="true"
            onClick={() => {
              close();
              triggerRef.current?.focus();
            }}
          />
          <nav
            ref={panelRef}
            id={panelId}
            className="mobile-nav__panel"
            aria-label="Primary"
          >
            {links.map((link) => (
              <Link
                href={link.href}
                key={link.href}
                onClick={close}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </>
      ) : null}
    </div>
  );
}
