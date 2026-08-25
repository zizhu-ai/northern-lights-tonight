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

export const analyticsSessionGate = createAnalyticsSessionGate();

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
