"use client";

import { useEffect, useState } from "react";

import { ChangePlaceButton } from "./change-place-button";

export function StickyPlaceBar({
  placeLine,
  sentinelId,
}: {
  placeLine: string;
  sentinelId: string;
}) {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById(sentinelId);
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry?.isIntersecting),
      { rootMargin: "-56px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelId]);

  if (!stuck) return null;

  return (
    <div className="sticky-place-bar" role="region" aria-label={placeLine}>
      <span className="sticky-place-bar__place">{placeLine}</span>
      <ChangePlaceButton via="sticky" className="sticky-place-bar__change" />
    </div>
  );
}
