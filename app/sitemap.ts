import type { MetadataRoute } from "next";

import { ACQUISITION_ROUTES } from "@/lib/acquisition-routes";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // #21: no route has a documented content revision timestamp. Omit lastModified
  // until one exists; request/build time and live snapshot freshness are not revisions.
  // Keep sitemap generation independent of upstream data and snapshot refresh.
  return ACQUISITION_ROUTES.map(({ path }) => ({
    url: new URL(path, SITE_URL).href,
  }));
}
