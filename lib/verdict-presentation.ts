import copy from "@/content/ui-copy.json";
import { REASON_COPY } from "@/lib/aurora-engine";
import {
  getHeadlinePoint,
  type ForecastDossier,
} from "@/lib/forecast-places";
import {
  formatUpdatedAt,
  formatWindow,
  type ForecastSnapshot,
  type ForecastWindow,
  type SnapshotRow,
} from "@/lib/snapshots";
import {
  resolveNightStatus,
  sentenceLead,
  shouldTrustStoredAnswer,
  windowsForNight,
  type NightStatus,
} from "@/lib/verdict-consistency";

export type NightVerdict = NightStatus;

export type PresentedWindow = ForecastWindow & {
  displayStatus: string;
  reason: string;
};

export type PresentedVerdict = {
  status: NightVerdict;
  human: string;
  answerSentence: string;
  placeLabel: string;
  placeContext: string;
  placeLine: string;
  sample: boolean;
  bestWindow: string;
  mainIssue: string;
  updated: string;
  lastValid: string | null;
  confidence: SnapshotRow["confidence"];
  lookToward: string;
  windows: PresentedWindow[];
  cannotJudge: boolean;
};

const humanByStatus: Record<NightVerdict, string> = {
  GO: copy.verdict.go_human,
  MAYBE: copy.verdict.maybe_human,
  NO: copy.verdict.no_human,
  UNKNOWN: copy.verdict.cannot_judge_human,
  UNAVAILABLE: copy.south.human,
};

export function placeOwnership(
  dossier: ForecastDossier,
  options: { sample?: boolean } = {},
): { placeLabel: string; placeContext: string; placeLine: string } {
  const headline = getHeadlinePoint(dossier);
  const samplePrefix = options.sample ? `${copy.verdict.sample_label} · ` : "";

  if (dossier.location_type === "state") {
    const context = copy.verdict.representative_area.replace("{city}", headline.name);
    return {
      placeLabel: dossier.name,
      placeContext: context,
      placeLine: `${samplePrefix}${dossier.name} · ${context}`,
    };
  }

  if (dossier.slug === "fairbanks") {
    return {
      placeLabel: dossier.name,
      placeContext: "Alaska",
      placeLine: `${samplePrefix}${dossier.name}, Alaska`,
    };
  }

  const context = headline.name !== dossier.name ? headline.name : "";
  return {
    placeLabel: dossier.name,
    placeContext: context,
    placeLine: context
      ? `${samplePrefix}${dossier.name} · ${context}`
      : `${samplePrefix}${dossier.name}`,
  };
}

export function formatLastValidAt(
  iso: string | undefined | null,
  timeZone: string = "America/New_York",
  now: Date = new Date(),
): string {
  const updated = formatUpdatedAt(iso, timeZone, now);
  if (updated === copy.verdict.updated_unknown) {
    return copy.verdict.last_valid_unknown;
  }
  return updated.replace(/^Updated /, `${copy.verdict.last_valid_prefix} `);
}

export function reasonText(code: string | undefined | null, place: string): string {
  if (!code) return "";
  const template = REASON_COPY[code];
  return template ? template.replace("{place}", place) : "";
}

export function windowReason(window: ForecastWindow, place: string): string {
  if (window.skip) return copy.chrome.skip_not_dark;
  const code = window.codes.find((item) => item !== "NONE") ?? window.codes[0];
  return reasonText(code, place);
}

function presentWindows(
  windows: ForecastWindow[] | undefined,
  nightStatus: NightVerdict,
  place: string,
): PresentedWindow[] {
  return windowsForNight(windows, nightStatus).map((window) => {
    const displayStatus = window.skip
      ? copy.chrome.skip_not_dark
      : (window.status ?? "UNKNOWN");
    const reason = window.skip
      ? copy.chrome.skip_not_dark
      : nightStatus === "UNKNOWN" || nightStatus === "UNAVAILABLE"
        ? copy.verdict.stale_main_issue
        : windowReason(window, place);
    return {
      ...window,
      displayStatus,
      reason,
    };
  });
}

function buildAnswer(input: {
  status: NightVerdict;
  placeLine: string;
  placeLabel: string;
  placeContext: string;
  mainIssue: string;
  bestWindow: string;
  lastValid?: string | null;
}): string {
  const { status, placeLine, placeLabel, placeContext, mainIssue, bestWindow, lastValid } = input;
  const extra = placeContext ? ` (${placeContext})` : "";
  if (status === "GO") {
    const window = bestWindow !== copy.verdict.unknown_window ? ` Best window ${bestWindow}.` : "";
    return `GO${extra}.${window} ${mainIssue}`.trim();
  }
  if (status === "MAYBE") {
    return `MAYBE in ${placeLabel}${extra}. Main issue: ${mainIssue}`;
  }
  if (status === "NO") {
    return `NO${extra}. ${copy.verdict.no_human} ${mainIssue}`;
  }
  if (status === "UNAVAILABLE") {
    return `${placeLine}. ${copy.south.human}`;
  }
  const valid = lastValid ? ` ${lastValid}.` : "";
  return `${placeLine} · ${copy.verdict.cannot_judge_short}. ${mainIssue}${valid}`;
}

export function presentVerdict(input: {
  snapshot: (SnapshotRow & Partial<ForecastSnapshot>) | null;
  dossier: ForecastDossier;
  sample?: boolean;
  sitePaused?: boolean;
  southern?: boolean;
  now?: Date;
}): PresentedVerdict {
  const { snapshot, dossier, sample = false, sitePaused = false, southern = false, now } = input;
  const ownership = placeOwnership(dossier, { sample });
  const timezone = dossier.timezone;

  if (southern) {
    return {
      status: "UNAVAILABLE",
      human: copy.south.human,
      answerSentence: `${ownership.placeLine}. ${copy.south.human}`,
      ...ownership,
      sample,
      bestWindow: copy.verdict.unknown_window,
      mainIssue: copy.south.main_issue,
      updated: copy.verdict.updated_unknown,
      lastValid: null,
      confidence: "low",
      lookToward: copy.verdict.look_north,
      windows: [],
      cannotJudge: true,
    };
  }

  const status = resolveNightStatus({
    snapshotStatus: snapshot?.status,
    sitePaused,
    missingSnapshot: !snapshot,
  });
  const cannotJudge = status === "UNKNOWN" || status === "UNAVAILABLE";
  const sentenceConflicts = !shouldTrustStoredAnswer(snapshot?.answer_sentence, status);

  const dataIssue =
    snapshot?.main_obstacle === "DATA_STALE" ||
    snapshot?.main_obstacle === "DATA_MISSING_AURORA" ||
    snapshot?.main_obstacle === "DATA_MISSING_WEATHER";

  let mainIssue: string;
  if (cannotJudge || !snapshot) {
    if (sitePaused || sentenceConflicts || !snapshot) {
      mainIssue = copy.verdict.stale_main_issue;
    } else if (dataIssue) {
      mainIssue = snapshot.main_obstacle_text ?? reasonText(snapshot.main_obstacle, dossier.name);
    } else {
      mainIssue = copy.verdict.stale_main_issue;
    }
  } else {
    mainIssue =
      snapshot.main_obstacle_text ??
      reasonText(snapshot.main_obstacle, dossier.name) ??
      copy.view.data_unavailable_main_issue;
  }

  const bestWindow =
    cannotJudge || !snapshot
      ? copy.verdict.unknown_window
      : formatWindow(snapshot.best_window_start, snapshot.best_window_end, timezone);

  const updatedIso = snapshot?.updated_at ?? snapshot?.generated_at ?? null;
  const updated = formatUpdatedAt(updatedIso, timezone, now);
  const lastValid = cannotJudge ? formatLastValidAt(updatedIso, timezone, now) : null;

  const lookToward = snapshot?.look_toward
    ? snapshot.look_toward.charAt(0).toUpperCase() + snapshot.look_toward.slice(1)
    : copy.verdict.look_north;

  const windows = presentWindows(
    snapshot && "windows" in snapshot ? snapshot.windows : undefined,
    status,
    dossier.name,
  );

  const answerSentence =
    !cannotJudge && snapshot?.answer_sentence && !sentenceConflicts
      ? snapshot.answer_sentence
      : buildAnswer({
          status,
          placeLine: ownership.placeLine,
          placeLabel: ownership.placeLabel,
          placeContext: ownership.placeContext,
          mainIssue,
          bestWindow,
          lastValid,
        });

  return {
    status,
    human: humanByStatus[status],
    answerSentence,
    ...ownership,
    sample,
    bestWindow,
    mainIssue,
    updated,
    lastValid,
    confidence: cannotJudge ? "low" : (snapshot?.confidence ?? "low"),
    lookToward,
    windows,
    cannotJudge,
  };
}

/** Surfaces that must not contradict for one place + night. */
export function nightSurfaceStatuses(presented: PresentedVerdict): {
  card: NightVerdict;
  title: NightVerdict | "cannot_judge";
  hours: Array<NightVerdict | "skip">;
} {
  const title = sentenceLead(presented.answerSentence);
  return {
    card: presented.status,
    title:
      title ??
      (presented.answerSentence.includes(copy.verdict.cannot_judge_short)
        ? "cannot_judge"
        : presented.status),
    hours: presented.windows.map((window) =>
      window.skip ? "skip" : ((window.status ?? "UNKNOWN") as NightVerdict),
    ),
  };
}
