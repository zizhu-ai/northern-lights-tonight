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

export function cityTonightAnswer(
  point: ForecastSamplePoint,
  snapshotPoint: ForecastPoint | null | undefined,
  dossier: ForecastDossier,
): string {
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
    a: cityTonightAnswer(point, byId.get(point.id), dossier),
  }));
}

function isGeneratedCityQuestion(question: string, dossier: ForecastDossier): boolean {
  const lower = question.toLowerCase();
  return dossier.sample_points.some((point) =>
    lower.includes(point.name.toLowerCase()),
  );
}

export function stateKeywordFaqs(
  dossier: ForecastDossier,
  snapshot: ForecastSnapshot | null,
): LocalFaq[] {
  const headline = getHeadlinePoint(dossier);
  const status = snapshot?.status ?? "UNKNOWN";
  const issue =
    snapshot?.main_obstacle_text ??
    reasonText(snapshot?.main_obstacle, dossier.name) ??
    "Source data is too old or missing to treat as live.";
  const state = dossier.name;
  const mag = dossier.magnetic_latitude.toFixed(1);
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
  const names = dossier.sample_points.slice(0, MAX_CITY_FAQS).map((point) => point.name);
  if (names.length === 0) return `Northern lights tonight in ${dossier.name}`;
  if (names.length === 1) return `Northern lights tonight in ${names[0]}`;
  if (names.length === 2) return `Northern lights tonight in ${names[0]} and ${names[1]}`;
  return `Northern lights tonight in ${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}
