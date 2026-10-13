export const ANALYTICS_OPT_OUT_KEY = "nlt_analytics_opt_out";

export type AnalyticsPageEvent = { url: string; [key: string]: unknown };

export type AnalyticsSessionGate = {
  isDisabled(): boolean;
  disable(): void;
  enable(): void;
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
    baseGate.enable();
    setGaDisabled(false);
  },
};

export type AnalyticsStorageState = "enabled" | "disabled" | "unavailable";

export function reconcileAnalyticsStorageEvent(
  gate: AnalyticsSessionGate,
  readStorageValue: () => string | null,
): AnalyticsStorageState {
  try {
    if (readStorageValue() === "1") {
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

export function sanitizeAnalyticsEvent<T extends AnalyticsPageEvent>(
  event: T,
  disabled: boolean,
): T | null {
  if (disabled) return null;

  try {
    const parsed = new URL(event.url, "https://aurora-tonight.com");
    return { ...event, url: parsed.pathname };
  } catch {
    return null;
  }
}

export function browserAnalyticsDisabled(
  storageValue: string | null,
  dnt: string | null,
): boolean {
  return storageValue === "1" || dnt === "1" || dnt?.toLowerCase() === "yes";
}
