import dossierJson from "../地点档案/wave1.json" with { type: "json" };

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
  parent_slug?: string | null;
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
  /** Per-state H1 override. Unset = default `Northern Lights Tonight in {name}`. */
  h1Override?: string;
  /** Merge worth-going-out + statewide FAQs; rewrite evergreen + best-time. Default off. */
  faqMerge?: boolean;
  /** Override the city-FAQ H2. Unset = generated `Northern lights tonight in {cities}`. */
  cityH2Override?: string;
  /** Nearby anchors as “Northern lights {Place} tonight”. Default off. */
  descriptiveNearbyAnchors?: boolean;
  /** Hero “Change place / Near me” tool line. Default off. */
  topToolEntry?: boolean;
  /** “What time can you see… tonight?” block. Default off. */
  whatTimeTonight?: boolean;
  /** Evergreen “Can you see the northern lights in {State}?” block. Default off. */
  evergreenBlock?: boolean;
  /** “Where to see” heading, merged actions, and the where-to-see guide link. Default off. */
  whereToSee?: boolean;
  /** In-state city H3 anchors (Chicago/Naperville or Portland/Bangor/Aroostook). Default off. */
  cityAnchors?: boolean;
  /** Parent H2 for the city-anchor H3s. */
  cityAnchorsHeading?: string;
  /** “{State} prediction” block. Default off. */
  predictionBlock?: boolean;
  /** Use the IL/ME custom meta description. Default off. */
  customSeoDescription?: boolean;
  /** Lead as “Northern lights in {name} tonight”. Default off. */
  leadInNameTonight?: boolean;
};

export type SeoBlockFlag =
  | "faqMerge"
  | "descriptiveNearbyAnchors"
  | "topToolEntry"
  | "whatTimeTonight"
  | "evergreenBlock"
  | "whereToSee"
  | "cityAnchors"
  | "predictionBlock"
  | "customSeoDescription"
  | "leadInNameTonight";

export const SEO_BLOCK_FLAGS: SeoBlockFlag[] = [
  "faqMerge",
  "descriptiveNearbyAnchors",
  "topToolEntry",
  "whatTimeTonight",
  "evergreenBlock",
  "whereToSee",
  "cityAnchors",
  "predictionBlock",
  "customSeoDescription",
  "leadInNameTonight",
];

export function seoFlag(dossier: ForecastDossier, flag: SeoBlockFlag): boolean {
  return dossier[flag] === true;
}

const dossiers = dossierJson.locations as ForecastDossier[];
const dossierBySlug = new Map(dossiers.map((dossier) => [dossier.slug, dossier]));

export const WAVE_ONE_SLUGS = dossiers.map((dossier) => dossier.slug);
export const WAVE_ONE_SLUG_SET = new Set(WAVE_ONE_SLUGS);
export const WAVE_TWO_SLUGS = [
  "new-york",
  "pennsylvania",
  "vermont",
  "new-hampshire",
  "montana",
  "idaho",
  "north-dakota",
  "south-dakota",
  "iowa",
] as const;
/** Fallback representative place when a homepage helper still needs one row. */
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
