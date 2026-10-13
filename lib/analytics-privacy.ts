export const ANALYTICS_OPT_OUT_KEY = "nlt_analytics_opt_out";

export const GA_PRODUCTION_HOSTS = new Set(["aurora-tonight.com", "www.aurora-tonight.com"]);

export const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;

const BLOCKED_QUERY_KEYS = new Set([
  "q",
  "query",
  "zip",
  "zipcode",
  "zip_code",
  "postal",
  "postal_code",
  "lat",
  "lng",
  "lon",
  "long",
  "latitude",
  "longitude",
  "coords",
  "coordinate",
  "coordinates",
  "name",
  "place",
  "address",
  "location",
]);

export type AnalyticsPageEvent = { url: string; [key: string]: unknown };

export type AnalyticsSessionGate = {
  isDisabled(): boolean;
  disable(): void;
  enable(): void;
};

export type AnalyticsStorageState = "enabled" | "disabled" | "unavailable";

export type GaPageViewParams = {
  page_location: string;
  page_referrer: string;
};

export type AnalyticsGateInput = {
  measurementId?: string;
  hostname?: string;
  storageOptOut: string | null;
  dnt: string | null;
  requireProductionHost?: boolean;
};

export function createAnalyticsSessionGate(): AnalyticsSessionGate {
  let disabled = false;

  return {
    isDisabled: () => disabled,
    disable: () => {
      disabled = true;
    },
    enable: () => {
      disabled = false;
    },
  };
}

function setGaDisabled(disabled: boolean): void {
  if (typeof window === "undefined") return;
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (id) (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = disabled;
}

const baseGate = createAnalyticsSessionGate();
export const analyticsSessionGate: AnalyticsSessionGate = {
  isDisabled: baseGate.isDisabled,
  disable: () => {
    baseGate.disable();
    setGaDisabled(true);
  },
  enable: () => {
    if (typeof window !== "undefined") {
      const storage = readAnalyticsOptOut();
      if (
        !analyticsAllowed({
          hostname: window.location.hostname,
          storageOptOut: storage,
          dnt: readBrowserDoNotTrack(),
        })
      ) {
        baseGate.disable();
        setGaDisabled(true);
        return;
      }
    }
    baseGate.enable();
    setGaDisabled(false);
  },
};

export function isValidGaMeasurementId(id: string): boolean {
  return GA_MEASUREMENT_ID_PATTERN.test(id);
}

export function isGaProductionHost(hostname: string): boolean {
  return GA_PRODUCTION_HOSTS.has(hostname.trim().toLowerCase());
}

export function isDoNotTrackEnabled(dnt: string | null | undefined): boolean {
  if (dnt == null || dnt === "") return false;
  const value = String(dnt).trim().toLowerCase();
  return value === "1" || value === "yes";
}

export function readBrowserDoNotTrack(
  nav: {
    doNotTrack?: string | null;
    msDoNotTrack?: string | number | null;
  } | null = typeof navigator === "undefined" ? null : navigator,
  win: { doNotTrack?: string | null } | null = typeof window === "undefined"
    ? null
    : (window as unknown as { doNotTrack?: string | null }),
): string | null {
  const raw = nav?.doNotTrack ?? win?.doNotTrack ?? nav?.msDoNotTrack;
  if (raw == null || raw === "") return null;
  return String(raw);
}

export function readAnalyticsOptOut(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY);
  } catch {
    return "1";
  }
}

export function browserAnalyticsDisabled(
  storageValue: string | null,
  dnt: string | null,
): boolean {
  return storageValue === "1" || isDoNotTrackEnabled(dnt);
}

export function analyticsAllowed(input: AnalyticsGateInput): boolean {
  if (input.measurementId !== undefined && !isValidGaMeasurementId(input.measurementId)) {
    return false;
  }
  const requireHost = input.requireProductionHost ?? input.hostname !== undefined;
  if (requireHost && !isGaProductionHost(input.hostname ?? "")) return false;
  if (browserAnalyticsDisabled(input.storageOptOut, input.dnt)) return false;
  return true;
}

export function shouldLoadGoogleAnalytics(
  input: AnalyticsGateInput & { measurementId: string; hostname: string },
): boolean {
  return analyticsAllowed({ ...input, requireProductionHost: true });
}

export function isBlockedQueryKey(key: string): boolean {
  const normalized = key.trim().toLowerCase().replace(/-/g, "_");
  return BLOCKED_QUERY_KEYS.has(normalized);
}

export function sanitizePageLocation(
  url: string,
  base = "https://aurora-tonight.com",
): string {
  try {
    const parsed = new URL(url, base);
    for (const key of [...parsed.searchParams.keys()]) {
      if (isBlockedQueryKey(key)) parsed.searchParams.delete(key);
    }
    parsed.hash = "";
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return new URL("/", base).toString();
  }
}

export function sanitizeAnalyticsEvent<T extends AnalyticsPageEvent>(
  event: T,
  disabled: boolean,
): T | null {
  if (disabled) return null;

  try {
    const sanitized = new URL(sanitizePageLocation(event.url));
    return { ...event, url: `${sanitized.pathname}${sanitized.search}` };
  } catch {
    return null;
  }
}

export function ga4ConfigFields(page: GaPageViewParams): GaPageViewParams & {
  send_page_view: false;
} {
  return {
    send_page_view: false,
    page_location: page.page_location,
    page_referrer: page.page_referrer,
  };
}

export function createPageViewSequence() {
  let previous: string | null = null;

  return {
    next(href: string, documentReferrer: string): GaPageViewParams {
      const page_location = sanitizePageLocation(href);
      const page_referrer =
        previous ?? (documentReferrer ? sanitizePageLocation(documentReferrer) : "");
      previous = page_location;
      return { page_location, page_referrer };
    },
    reset() {
      previous = null;
    },
  };
}

export const gaPageViewSequence = createPageViewSequence();

export function reconcileAnalyticsStorageEvent(
  gate: AnalyticsSessionGate,
  readStorageValue: () => string | null,
  dnt: string | null = null,
  hostname?: string,
): AnalyticsStorageState {
  try {
    const storageValue = readStorageValue();
    if (
      !analyticsAllowed({
        hostname,
        storageOptOut: storageValue,
        dnt,
        requireProductionHost: hostname !== undefined,
      })
    ) {
      gate.disable();
      return "disabled";
    }

    gate.enable();
    return "enabled";
  } catch {
    gate.disable();
    return "unavailable";
  }
}

export function syncAnalyticsSessionFromBrowser(
  gate: AnalyticsSessionGate = analyticsSessionGate,
): AnalyticsStorageState {
  if (typeof window === "undefined") {
    gate.disable();
    return "unavailable";
  }
  return reconcileAnalyticsStorageEvent(
    gate,
    () => window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY),
    readBrowserDoNotTrack(),
    window.location.hostname,
  );
}
