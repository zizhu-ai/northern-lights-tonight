import copy from "@/content/ui-copy.json";
import { presentVerdict, type PresentedVerdict } from "@/lib/verdict-presentation";

import {
  homeCityCards,
  homeDirectAnswer,
  overallHomeReason,
  overallHomeStatus,
  pickBestWindowPlace,
  type HomeCityCard,
  type HomePlaceReading,
} from "./home-overview";

export {
  clampWords,
  homeCityCards,
  homeDirectAnswer,
  HOME_CITY_CARDS,
  overallHomeReason,
  overallHomeStatus,
  pickBestWindowPlace,
  wordCount,
  type HomeCityCard,
  type HomePlaceReading,
} from "./home-overview";

export function presentHomeOverview(
  rows: HomePlaceReading[],
  options: { sitePaused?: boolean } = {},
): {
  presented: PresentedVerdict;
  directAnswer: string;
  best: HomePlaceReading | null;
  cityCards: HomeCityCard[];
} {
  const sitePaused = options.sitePaused ?? false;
  const best = pickBestWindowPlace(rows);
  const bestPresented = best
    ? presentVerdict({
        snapshot: best.snapshot ?? null,
        dossier: best.dossier,
        sitePaused,
      })
    : null;
  const overall = sitePaused ? "UNKNOWN" : overallHomeStatus(rows);
  const reason = sitePaused ? copy.verdict.stale_main_issue : overallHomeReason(rows);
  const human =
    overall === "GO"
      ? copy.verdict.go_human
      : overall === "MAYBE"
        ? copy.verdict.maybe_human
        : overall === "NO"
          ? copy.verdict.no_human
          : copy.verdict.cannot_judge_human;
  const presented: PresentedVerdict = {
    status: overall,
    human,
    answerSentence: reason,
    placeLabel: "United States",
    placeContext: "covered places",
    placeLine: "United States · covered places",
    sample: false,
    bestWindow: bestPresented?.bestWindow ?? copy.verdict.unknown_window,
    mainIssue: reason,
    updated: bestPresented?.updated ?? copy.verdict.updated_unknown,
    lastValid: overall === "UNKNOWN" ? (bestPresented?.lastValid ?? null) : null,
    confidence: overall === "UNKNOWN" ? "low" : (bestPresented?.confidence ?? "low"),
    lookToward: copy.verdict.look_north,
    windows: bestPresented?.windows ?? [],
    cannotJudge: overall === "UNKNOWN",
  };
  return {
    presented,
    directAnswer: homeDirectAnswer(rows, best, { sitePaused }),
    best,
    cityCards: homeCityCards(rows),
  };
}
