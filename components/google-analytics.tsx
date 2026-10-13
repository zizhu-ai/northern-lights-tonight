"use client";

import Script from "next/script";

import { ANALYTICS_OPT_OUT_KEY } from "@/lib/analytics-privacy";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

// GA4 page views. Respects the existing analytics opt-out (localStorage
// "nlt_analytics_opt_out" = "1"): opted-out visitors get ga-disable set before
// gtag runs, and analyticsSessionGate keeps the flag in sync afterwards.
export function GoogleAnalytics() {
  if (!/^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID)) return null;
  const id = JSON.stringify(GA_MEASUREMENT_ID);
  const optOutKey = JSON.stringify(ANALYTICS_OPT_OUT_KEY);
  return (
    <>
      <Script id="ga4-init" strategy="afterInteractive">
        {`try{if(localStorage.getItem(${optOutKey})==="1")window["ga-disable-"+${id}]=true}catch(e){}
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('js',new Date());gtag('config',${id});`}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}
