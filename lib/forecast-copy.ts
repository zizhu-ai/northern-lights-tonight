import copy from "../content/ui-copy.json" with { type: "json" };

// @ts-ignore TS5097
import { clampSeoSentences, titleCasePhrase } from "./site.ts";
import type { ForecastDossier } from "./forecast-places";
import type { ForecastWindow } from "./snapshots";

export function h1For(dossier: ForecastDossier): string {
  if (dossier.h1Override) return dossier.h1Override;
  return `Northern Lights Tonight in ${dossier.name}`;
}

export function hasKnownWindow(bestWindow: string | null | undefined): boolean {
  if (!bestWindow) return false;
  return bestWindow !== copy.verdict.unknown_window;
}

export function nearbyWindowLine(window: string): string | null {
  if (!hasKnownWindow(window)) return null;
  return `${copy.verdict.best_window_label}: ${window}`;
}

export function nearbyAnchorText(dossier: ForecastDossier, placeName: string): string {
  if (dossier.descriptiveNearbyAnchors) {
    return `Northern lights ${placeName} tonight`;
  }
  return placeName;
}

export function titleFor(dossier: ForecastDossier): string {
  if (dossier.slug === "alaska") {
    return "Northern Lights Tonight in Alaska: Season & Places";
  }
  return `Northern Lights Tonight in ${dossier.name}: Visibility & Best Time`;
}

/** Lead used in the default forecast meta description. Tonight appears once. */
export function seoLeadPhrase(primaryKeyword: string): string {
  const phrase = titleCasePhrase(primaryKeyword);
  if (/\btonight\b/i.test(phrase)) {
    return phrase.replace(/^(Northern Lights Tonight) (?!in\b)/i, "$1 in ");
  }
  return `${phrase} tonight`;
}

export function forecastLead(dossier: ForecastDossier, answer: string): string {
  if (answer.toLowerCase().includes("northern lights tonight")) return answer;
  if (dossier.leadInNameTonight) {
    return `Northern lights in ${dossier.name} tonight: ${answer}`;
  }
  return `Northern lights tonight in ${dossier.name}: ${answer}`;
}

export function showNorthSouthSplit(
  north: string | null | undefined,
  south: string | null | undefined,
): boolean {
  return Boolean(north && south && north !== south);
}

export function ovalReachSentence(
  headlinePointName: string,
  reach: string | null | undefined,
): string {
  if (!reach) return `Tonight’s oval reach at ${headlinePointName} is unknown in the current snapshot.`;
  if (reach === "none") return `Tonight the oval does not reach ${headlinePointName}.`;
  if (reach === "horizon") return `Tonight the oval reaches the horizon at ${headlinePointName}.`;
  if (reach === "overhead") return `Tonight the oval may reach overhead at ${headlinePointName}.`;
  return `Tonight’s oval reach at ${headlinePointName} is ${reach.replaceAll("_", " ")}.`;
}

export function seoDescription(
  dossier: ForecastDossier,
  headlinePointName: string,
  state: { status: string; mainIssue: string; bestWindow: string },
): string {
  const windowBit = hasKnownWindow(state.bestWindow)
    ? ` Best window ${state.bestWindow}.`
    : "";

  if (dossier.customSeoDescription && dossier.leadInNameTonight) {
    const maineWindow = hasKnownWindow(state.bestWindow) ? `, ${state.bestWindow}` : "";
    return clampSeoSentences(
      `Can you see the northern lights (aurora borealis) in ${dossier.name}? Often on moderate storms, best in Aroostook. ${headlinePointName} is ${state.status} tonight${maineWindow}.`,
      70,
      160,
    );
  }

  if (dossier.customSeoDescription) {
    const illinoisWindow = hasKnownWindow(state.bestWindow)
      ? `, best window ${state.bestWindow}`
      : "";
    return clampSeoSentences(
      `Northern lights ${dossier.name} tonight: ${state.status} from ${headlinePointName}${illinoisWindow}. Aurora borealis reaches northern Illinois on strong storms only.`,
      70,
      160,
    );
  }

  const lead = seoLeadPhrase(dossier.primary_keyword);
  return clampSeoSentences(
    `${lead}: ${state.status} from ${headlinePointName} (aurora borealis).${windowBit} ${state.mainIssue}`,
    70,
    160,
  );
}

export function darkWindowBounds(
  windows: Array<Pick<ForecastWindow, "start" | "end" | "skip">>,
  timeZone: string,
): { start: string; end: string } | null {
  const dark = windows.filter((window) => !window.skip && window.start && window.end);
  if (dark.length === 0) return null;
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
  return {
    start: formatter.format(new Date(dark[0].start)),
    end: formatter.format(new Date(dark[dark.length - 1].end)),
  };
}

export function whatTimeTonightCopy(
  dossier: ForecastDossier,
  input: {
    status: string;
    bestWindow: string;
    windows: Array<Pick<ForecastWindow, "start" | "end" | "skip">>;
  },
): string {
  const usefulWindow = hasKnownWindow(input.bestWindow) && input.status !== "NO";
  const first = usefulWindow
    ? `Tonight’s best window in ${dossier.name} is ${input.bestWindow}.`
    : `There is no useful window in ${dossier.name} tonight.`;
  const dark = darkWindowBounds(input.windows, dossier.timezone);
  const second = dark
    ? ` Aurora is usually strongest between ${dark.start} and ${dark.end}, so check the 30-minute table below.`
    : ` Check the 30-minute table below.`;
  return `${first}${second}`;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 12);
}

/** Fields that share a page must not repeat the same sentence. */
export function dossierBlockSentences(dossier: ForecastDossier): Record<string, string[]> {
  return {
    light: sentences(dossier.light_pollution_note),
    obstacles: sentences(dossier.local_obstacles),
    action: sentences(dossier.leave_city_advice),
    split: dossier.north_south_split ? sentences(dossier.north_south_split) : [],
    months: sentences(dossier.best_months_note),
  };
}

export function repeatedDossierSentences(dossier: ForecastDossier): string[] {
  const blocks = dossierBlockSentences(dossier);
  const seen = new Map<string, string>();
  const repeats: string[] = [];
  for (const [block, parts] of Object.entries(blocks)) {
    for (const part of parts) {
      const key = part.toLowerCase();
      const owner = seen.get(key);
      if (owner && owner !== block) repeats.push(part);
      else seen.set(key, block);
    }
  }
  return repeats;
}
