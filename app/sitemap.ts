import type { MetadataRoute } from "next";

import { ACQUISITION_ROUTES } from "@/lib/acquisition-routes";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ACQUISITION_ROUTES.map(({ path }) => ({
    url: new URL(path, SITE_URL).href,
  }));
}
