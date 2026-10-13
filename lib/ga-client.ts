import {
  ga4ConfigFields,
  sanitizePageLocation,
} from "@/lib/analytics-privacy";

type GtagFn = (...args: unknown[]) => void;

type GtagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: GtagFn;
};

let gtagScriptInjected = false;
let gtagConfigured = false;

function gtagWindow(): GtagWindow {
  return window as GtagWindow;
}

export function queueGtag(...args: unknown[]): void {
  const w = gtagWindow();
  w.dataLayer = w.dataLayer || [];
  if (typeof w.gtag !== "function") {
    w.gtag = function gtag() {
      w.dataLayer!.push(arguments);
    };
  }
  if (args.length) w.gtag(...args);
}

export function ensureGtagInstalled(measurementId: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  queueGtag();
  if (!gtagScriptInjected && !document.getElementById("ga4-gtag")) {
    const script = document.createElement("script");
    script.id = "ga4-gtag";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
    queueGtag("js", new Date());
    gtagScriptInjected = true;
  }
  if (!gtagConfigured) {
    syncGtagPageLocation(measurementId, window.location.href);
  }
}

export function syncGtagPageLocation(measurementId: string, href: string): string {
  const page_location = sanitizePageLocation(href);
  if (typeof window === "undefined") return page_location;
  queueGtag();
  const page = {
    page_location,
    page_referrer: document.referrer ? sanitizePageLocation(document.referrer) : "",
  };
  queueGtag("config", measurementId, ga4ConfigFields(page));
  gtagConfigured = true;
  return page_location;
}
