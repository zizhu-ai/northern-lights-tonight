import type { MetadataRoute } from "next";

// @ts-ignore TS5097
import { ACQUISITION_ROUTES } from "../lib/acquisition-routes.ts";
// @ts-ignore TS5097
import { CONTENT_REVISIONS } from "../lib/content-revisions.ts";
// @ts-ignore TS5097
import { SITE_URL } from "../lib/site.ts";

export default function sitemap(): MetadataRoute.Sitemap {
  // lastModified is included only when CONTENT_REVISIONS has a git committer
  // date for that URL’s declared sources (page module plus copy, markdown,
  // and helpers it depends on). Forecast URLs and the homepage omit it: live
  // NOAA/Open-Meteo freshness is not a page revision (#21). Never use
  // request/build time.
  return ACQUISITION_ROUTES.map(({ path }) => {
    const revision = CONTENT_REVISIONS[path];
    return revision
      ? { url: new URL(path, SITE_URL).href, lastModified: new Date(revision) }
      : { url: new URL(path, SITE_URL).href };
  });
}
