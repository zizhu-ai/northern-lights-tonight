export const SCROLL_DEPTH_PERCENT = 50;
export const ENGAGED_VISIBLE_MS = 60_000;

export function visibleScrollPercent(
  scrollY: number,
  viewportHeight: number,
  scrollHeight: number,
): number | null {
  const maxScroll = scrollHeight - viewportHeight;
  if (maxScroll <= 0) return null;
  return Math.min(100, Math.max(0, (scrollY / maxScroll) * 100));
}

export function shouldEmitScrollDepth50(
  percent: number | null,
  alreadySent: boolean,
): boolean {
  return !alreadySent && percent != null && percent >= SCROLL_DEPTH_PERCENT;
}

export type VisibleTimeTracker = {
  onVisible(now: number): void;
  onHidden(now: number): void;
  tick(now: number): boolean;
  reset(): void;
};

export function createVisibleTimeTracker(
  thresholdMs: number = ENGAGED_VISIBLE_MS,
): VisibleTimeTracker {
  let accumulated = 0;
  let runningSince: number | null = null;
  let fired = false;

  return {
    onVisible(now: number) {
      if (fired) return;
      if (runningSince == null) runningSince = now;
    },
    onHidden(now: number) {
      if (runningSince != null) {
        accumulated += Math.max(0, now - runningSince);
        runningSince = null;
      }
    },
    tick(now: number) {
      if (fired) return false;
      const total = accumulated + (runningSince != null ? Math.max(0, now - runningSince) : 0);
      if (total >= thresholdMs) {
        fired = true;
        runningSince = null;
        return true;
      }
      return false;
    },
    reset() {
      accumulated = 0;
      runningSince = null;
      fired = false;
    },
  };
}
