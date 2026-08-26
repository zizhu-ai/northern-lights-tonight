"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

import { ADSENSE_SCRIPT_SRC } from "@/lib/adsense";
import { isAcquisitionRoute } from "@/lib/acquisition-routes";

export function AdSenseLoader() {
  const pathname = usePathname();

  if (!isAcquisitionRoute(pathname)) return null;

  return (
    <Script
      id="adsense-loader"
      async
      crossOrigin="anonymous"
      src={ADSENSE_SCRIPT_SRC}
      strategy="afterInteractive"
    />
  );
}
