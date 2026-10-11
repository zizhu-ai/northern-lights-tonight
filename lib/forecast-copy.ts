// @ts-ignore TS5097
import { clampSeoText } from "./site.ts";
import type { ForecastDossier } from "./forecast-places";

export function h1For(dossier: ForecastDossier): string {
  return `Northern Lights Tonight in ${dossier.name}`;
}

export function titleFor(dossier: ForecastDossier): string {
  if (dossier.slug === "alaska") {
    return "Northern Lights Tonight in Alaska: Season & Places";
  }
  const full = `Northern Lights Tonight in ${dossier.name}: Visibility & Best Time`;
  if (full.length <= 60) return full;
  const shorter = `Northern Lights Tonight in ${dossier.name}`;
  if (shorter.length <= 60) return shorter;
  return clampSeoText(`Northern Lights Tonight ${dossier.name}`, 15, 60);
}

export function forecastLead(dossier: ForecastDossier, answer: string): string {
  if (answer.toLowerCase().includes("northern lights tonight")) return answer;
  return `Northern lights tonight in ${dossier.name}: ${answer}`;
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
