import copy from "../content/ui-copy.json" with { type: "json" };

// @ts-ignore TS5097
import { getHeadlinePoint, type ForecastDossier, type ForecastSamplePoint, type LocalFaq } from "./forecast-places.ts";
// @ts-ignore TS5097
import { reasonText } from "./reason-text.ts";
import type { ForecastPoint, ForecastSnapshot } from "./snapshots";

const MAX_CITY_FAQS = 5;

function displayEnum(value: string | null | undefined): string {
  if (!value) return "unavailable";
  return value.replaceAll("_", " ");
}

function cloudPhrase(pointName: string, block: string | null | undefined): string {
  if (block === "socked") {
    return `Cloud cover is likely blocking the sky over ${pointName}.`;
  }
  if (block === "mixed") {
    return `Clouds are mixed over ${pointName}, so the sky is the local uncertainty.`;
  }
  if (block === "clear") {
    return `Clouds are not the main blocker over ${pointName} in the current snapshot.`;
  }
  return `Cloud data for ${pointName} is missing, so we are not guessing that city’s sky.`;
}

function glowPhrase(point: ForecastSamplePoint, urban: boolean | undefined): string {
  if (point.role === "population" || urban === true) {
    return `${point.name} is a bright urban site; city skyglow will hide a weak horizon display.`;
  }
  if (point.role === "dark_sky") {
    return `${point.name} is a darker in-state site than the metros.`;
  }
  return `${point.name} is this page’s northern headline point, not a downtown reading.`;
}

function magPhrase(point: ForecastSamplePoint, dossier: ForecastDossier): string {
  const headline = getHeadlinePoint(dossier);
  const delta = point.magnetic_latitude - dossier.magnetic_latitude;
  const mag = point.magnetic_latitude.toFixed(1);
  if (Math.abs(delta) < 0.25) {
    return `${point.name} sits at magnetic latitude ${mag}, even with the ${headline.name} headline.`;
  }
  if (delta < 0) {
    return `${point.name} sits at magnetic latitude ${mag}, ${Math.abs(delta).toFixed(1)}° south of ${headline.name}.`;
  }
  return `${point.name} sits at magnetic latitude ${mag}, ${delta.toFixed(1)}° north of ${headline.name}.`;
}

function statusPhrase(pointName: string, status: string | undefined): string {
  if (status === "GO") return `GO in ${pointName} tonight.`;
  if (status === "MAYBE") return `MAYBE in ${pointName} tonight.`;
  if (status === "NO") return `NO in ${pointName} tonight.`;
  return `We cannot judge ${pointName} tonight.`;
}

const STALE_LIVE_READINGS =
  "Tonight’s clouds, oval reach, and other live readings cannot be judged.";

function isUnknownStatus(status: string | null | undefined): boolean {
  return !status || status === "UNKNOWN";
}

function unknownConsistentIssue(
  snapshot: ForecastSnapshot | null,
  place: string,
): string {
  const obstacle = snapshot?.main_obstacle;
  if (
    obstacle === "DATA_STALE" ||
    obstacle === "DATA_MISSING_AURORA" ||
    obstacle === "DATA_MISSING_WEATHER"
  ) {
    return (
      snapshot?.main_obstacle_text ??
      reasonText(obstacle, place) ??
      copy.verdict.stale_main_issue
    );
  }
  return copy.verdict.stale_main_issue;
}

export function cityTonightAnswer(
  point: ForecastSamplePoint,
  snapshotPoint: ForecastPoint | null | undefined,
  dossier: ForecastDossier,
  snapshotStatus?: ForecastSnapshot["status"] | null,
): string {
  const cannotJudge =
    snapshotStatus === "UNKNOWN" ||
    !snapshotPoint ||
    snapshotPoint.status === "UNKNOWN";
  if (cannotJudge) {
    return [
      statusPhrase(point.name, "UNKNOWN"),
      magPhrase(point, dossier),
      glowPhrase(point, undefined),
      STALE_LIVE_READINGS,
    ].join(" ");
  }
  const status = snapshotPoint?.status;
  const urban = snapshotPoint?.urban;
  const reach = snapshotPoint?.aurora_reach;
  const obstacle = snapshotPoint
    ? reasonText(snapshotPoint.main_obstacle, point.name)
    : "Live aurora or cloud data for this city is missing.";
  const reachPhrase = reach
    ? `Oval reach at this coordinate is ${displayEnum(reach)}.`
    : "Oval reach at this coordinate is unknown in the current snapshot.";
  return [
    statusPhrase(point.name, status),
    magPhrase(point, dossier),
    glowPhrase(point, urban),
    cloudPhrase(point.name, snapshotPoint?.cloud_block),
    reachPhrase,
    obstacle,
  ].join(" ");
}

export function citySearchFaqs(
  dossier: ForecastDossier,
  snapshot: ForecastSnapshot | null,
): LocalFaq[] {
  const byId = new Map((snapshot?.points ?? []).map((point) => [point.id, point]));
  const points = dossier.sample_points.slice(0, MAX_CITY_FAQS);
  return points.map((point) => ({
    q: `Can you see the northern lights in ${point.name} tonight?`,
    a: cityTonightAnswer(point, byId.get(point.id), dossier, snapshot?.status),
  }));
}

function isGeneratedCityQuestion(question: string, dossier: ForecastDossier): boolean {
  const lower = question.toLowerCase();
  return dossier.sample_points.some((point) =>
    lower.includes(point.name.toLowerCase()),
  );
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function evergreenVisibilityAnswer(
  dossier: ForecastDossier,
  status: string,
): string {
  const headline = getHeadlinePoint(dossier);
  const mag = dossier.magnetic_latitude.toFixed(1);
  const kp = dossier.typical_kp_horizon;
  if (dossier.slug === "illinois") {
    return `Yes, but only during strong geomagnetic storms, and mainly in northern Illinois. From anywhere in Illinois, horizon aurora typically needs about Kp ${kp} at ${headline.name}’s magnetic latitude (${mag}); you can see it when a storm hits on a dark, clear night. Tonight: ${status}.`;
  }
  if (dossier.slug === "maine") {
    return `Yes — Maine is one of the better Lower 48 states on a moderate storm. From ${headline.name} (magnetic latitude ${mag}) horizon aurora typically needs about Kp ${kp}; you can see it when that coincides with a dark, clear, north-facing sky. Tonight: ${status}.`;
  }
  return `${dossier.name} is a ${dossier.aurora_zone.replaceAll("_", " ")} location. Horizon color typically needs about Kp ${dossier.typical_kp_horizon}. Tonight’s computed status is ${status}.`;
}

export function bestTimeFaqAnswer(dossier: ForecastDossier, status: string): string {
  if (dossier.slug === "illinois") {
    return `It depends on geomagnetic activity, not the calendar: storms can arrive in any month, but the long, dark nights from autumn through spring offer more chances. Tonight: ${status}. See our best-time guide for the full picture.`;
  }
  if (dossier.slug === "maine") {
    return `It depends on geomagnetic activity, not the month: Maine’s season runs August–April, and September and March are popular for long nights without the worst winter weather. Tonight: ${status}. Check the 30-minute table for tonight’s window.`;
  }
  return `It depends on geomagnetic activity, not the calendar. Tonight: ${status}.`;
}

function mergedWorthGoingOutAnswer(
  dossier: ForecastDossier,
  status: string,
  issue: string,
): string {
  const headline = getHeadlinePoint(dossier);
  const mag = dossier.magnetic_latitude.toFixed(1);
  if (dossier.slug === "illinois") {
    return `${status} for Illinois tonight from the ${headline.name} headline (magnetic latitude ${mag}). ${issue} This is not a statewide yes: northern Illinois is the gate, and southern Illinois can still be no.`;
  }
  if (dossier.slug === "maine") {
    return `${status} for Maine tonight from the ${headline.name} headline (magnetic latitude ${mag}). ${issue} This is not a statewide yes: Aroostook can still differ from Portland on the same night.`;
  }
  return `${status} for ${dossier.name} tonight from the ${headline.name} headline (magnetic latitude ${mag}). ${issue} This is not a statewide yes.`;
}

export function stateKeywordFaqs(
  dossier: ForecastDossier,
  snapshot: ForecastSnapshot | null,
): LocalFaq[] {
  const headline = getHeadlinePoint(dossier);
  const status = snapshot?.status ?? "UNKNOWN";
  const issue = isUnknownStatus(status)
    ? unknownConsistentIssue(snapshot, dossier.name)
    : snapshot?.main_obstacle_text ??
      reasonText(snapshot?.main_obstacle, dossier.name) ??
      copy.verdict.stale_main_issue;
  const state = dossier.name;
  const mag = dossier.magnetic_latitude.toFixed(1);
  if (dossier.faqMerge) {
    return [
      {
        q: `Can you see the northern lights in ${state}?`,
        a: evergreenVisibilityAnswer(dossier, status),
      },
      {
        q: `Northern lights tonight ${state.toLowerCase()} — is it worth going out?`,
        a: mergedWorthGoingOutAnswer(dossier, status, issue),
      },
      {
        q: `When is the best time to see the northern lights in ${state}?`,
        a: bestTimeFaqAnswer(dossier, status),
      },
    ];
  }
  return [
    {
      q: `Northern lights tonight ${state.toLowerCase()} — is it worth going out?`,
      a: `${status} for ${state} tonight from the ${headline.name} headline (magnetic latitude ${mag}). ${issue} This is the state reading, not a downtown-by-default answer.`,
    },
    {
      q: `Aurora borealis ${state.toLowerCase()} — can you see it tonight?`,
      a: `${state} is a ${dossier.aurora_zone.replaceAll("_", " ")} location. Horizon color typically needs about Kp ${dossier.typical_kp_horizon}; overhead color typically needs about Kp ${dossier.typical_kp_overhead}. Tonight’s computed status is ${status}. ${issue}`,
    },
    {
      q: `${state} northern lights: is tonight a statewide yes?`,
      a: `No. Northern lights tonight in ${state} is a local gate at ${headline.name}, then compared with the other sample points on this page. Magnetic latitude ${mag} is the headline, not a mean of the whole state.`,
    },
  ];
}

export function localFaqsForPage(
  dossier: ForecastDossier,
  snapshot: ForecastSnapshot | null,
): LocalFaq[] {
  const city = citySearchFaqs(dossier, snapshot);
  const keywords = stateKeywordFaqs(dossier, snapshot);
  const extras = dossier.local_faqs.filter(
    (faq) => !isGeneratedCityQuestion(faq.q, dossier),
  );
  const seen = new Set<string>();
  const merged: LocalFaq[] = [];
  for (const faq of [...city, ...keywords, ...extras]) {
    const key = faq.q.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(faq);
  }
  return merged;
}

export function cityFaqHeading(dossier: ForecastDossier): string {
  if (dossier.cityH2Override) return dossier.cityH2Override;
  const names = dossier.sample_points.slice(0, MAX_CITY_FAQS).map((point) => point.name);
  if (names.length === 0) return `Northern lights tonight in ${dossier.name}`;
  if (names.length === 1) return `Northern lights tonight in ${names[0]}`;
  if (names.length === 2) return `Northern lights tonight in ${names[0]} and ${names[1]}`;
  return `Northern lights tonight in ${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}
