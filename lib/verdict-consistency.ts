/**
 * Single night-verdict rules shared by sanitize, presentation, and tests.
 * Keep this file dependency-free for the Node strip-types runner.
 */

export type NightStatus = "GO" | "MAYBE" | "NO" | "UNKNOWN" | "UNAVAILABLE";

export const STATUS_LEAD = /^(GO|MAYBE|NO|UNKNOWN|UNAVAILABLE)\b/;

export function sentenceLead(sentence: string | undefined | null): NightStatus | null {
  if (!sentence) return null;
  const match = sentence.trim().match(STATUS_LEAD);
  return (match?.[1] as NightStatus | undefined) ?? null;
}

export function resolveNightStatus(input: {
  snapshotStatus?: NightStatus | null;
  sitePaused?: boolean;
  missingSnapshot?: boolean;
  southern?: boolean;
}): NightStatus {
  if (input.southern) return "UNAVAILABLE";
  if (input.sitePaused || input.missingSnapshot) return "UNKNOWN";
  return input.snapshotStatus ?? "UNKNOWN";
}

export function shouldTrustStoredAnswer(
  sentence: string | undefined | null,
  status: NightStatus,
): boolean {
  const lead = sentenceLead(sentence);
  return Boolean(lead && lead === status);
}

export function windowsForNight<
  T extends { skip?: boolean; status?: NightStatus | null },
>(windows: T[] | undefined, nightStatus: NightStatus): T[] {
  return (windows ?? []).map((window) => {
    if (window.skip) return window;
    if (nightStatus === "UNKNOWN" || nightStatus === "UNAVAILABLE") {
      return { ...window, status: nightStatus };
    }
    return window;
  });
}

export function nightSurfacesAgree(input: {
  status: NightStatus;
  answerSentence: string;
  windows?: Array<{ skip?: boolean; status?: NightStatus | null }>;
}): boolean {
  const lead = sentenceLead(input.answerSentence);
  const titleOk =
    lead === input.status ||
    (input.status === "UNKNOWN" && /cannot judge/i.test(input.answerSentence));
  if (!titleOk) return false;
  return (input.windows ?? [])
    .filter((window) => !window.skip)
    .every((window) => (window.status ?? "UNKNOWN") === input.status);
}
