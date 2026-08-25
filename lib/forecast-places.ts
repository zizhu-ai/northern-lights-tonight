import dossierJson from "@/地点档案/wave1.json";

export type ForecastSamplePoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  role: string;
  magnetic_latitude: number;
};

export type LocalFaq = {
  q: string;
  a: string;
};

export type ForecastDossier = {
  slug: string;
  name: string;
  location_type: "state" | "city";
  page_template: "tonight_local" | "travel_plus_tonight";
  timezone: string;
  primary_verdict_point: string;
  sample_points: ForecastSamplePoint[];
  nearby_slugs: string[];
  viewing_direction: string;
  light_pollution_note: string;
  local_obstacles: string;
  leave_city_advice: string;
  north_south_split: string | null;
  best_months_note: string;
  local_faqs: LocalFaq[];
  primary_keyword: string;
  magnetic_latitude: number;
  aurora_zone: string;
  typical_kp_horizon: number;
  typical_kp_overhead: number;
  short_summer_nights: boolean;
};

const dossiers = dossierJson.locations as ForecastDossier[];
const dossierBySlug = new Map(dossiers.map((dossier) => [dossier.slug, dossier]));

export const WAVE_ONE_SLUGS = dossiers.map((dossier) => dossier.slug);
export const WAVE_ONE_SLUG_SET = new Set(WAVE_ONE_SLUGS);
/** Homepage verdict uses this row from the 15-place table, not a national aggregate. */
export const HOME_REPRESENTATIVE_SLUG = "fairbanks";

export function getForecastDossier(slug: string): ForecastDossier | null {
  return dossierBySlug.get(slug) ?? null;
}

export function getHeadlinePoint(dossier: ForecastDossier): ForecastSamplePoint {
  const point = dossier.sample_points.find(
    (candidate) => candidate.id === dossier.primary_verdict_point,
  );
  if (!point) {
    throw new Error(`Missing primary verdict point for ${dossier.slug}`);
  }
  return point;
}
