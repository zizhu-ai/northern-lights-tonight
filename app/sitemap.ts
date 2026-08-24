import type { MetadataRoute } from "next";

import { WAVE_ONE_SLUGS } from "@/lib/forecast-places";
import { SITE_URL } from "@/lib/site";

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

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...WAVE_ONE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/forecast/${slug}`,
    })),
  ];
}
