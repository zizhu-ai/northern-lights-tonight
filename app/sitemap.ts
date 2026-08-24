import type { MetadataRoute } from "next";

import { WAVE_ONE_SLUGS } from "@/lib/forecast-places";
import { SITE_URL } from "@/lib/site";
import { loadLatestWithMeta } from "@/lib/snapshots";

export const revalidate = 600;

const STATIC_PATHS = [
  "",
  "/near-me",
  "/guides/best-time-to-see-northern-lights",
  "/guides/how-to-see-northern-lights",
  "/guides/where-to-see-northern-lights",
  "/methodology",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await loadLatestWithMeta();
  const forecastLastModified = new Date(data.generated_at);
  const staticLastModified = new Date();

  return [
    ...STATIC_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: staticLastModified,
    })),
    ...WAVE_ONE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/forecast/${slug}`,
      lastModified: forecastLastModified,
    })),
  ];
}
