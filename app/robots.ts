import type { MetadataRoute } from "next";

/** Entire site stays out of the index until Wave 1 pages are real. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
    sitemap: undefined,
  };
}
