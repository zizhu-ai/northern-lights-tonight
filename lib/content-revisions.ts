/**
 * Trustworthy content-revision timestamps for sitemap lastmod.
 *
 * Each lastmod is the latest git committer date among that URL’s declared
 * sources: the page module plus copy, markdown, helpers, and components the
 * page imports for its rendered/SEO text. Forecast URLs and the homepage are
 * omitted: their visible answer is live NOAA/Open-Meteo data, which issue #21
 * rejected as a page revision. Shared chrome (root layout, site-wide nav) is
 * omitted so a footer tweak does not stamp every URL.
 *
 * Values are UTC ISO strings. Do not substitute request time, build time, or
 * Date.now(). `lib/sitemap.test.ts` checks these dates against git history of
 * CONTENT_SOURCES when that history is available; omit lastmod rather than
 * guess if a date cannot be derived.
 */
export const CONTENT_SOURCES: Readonly<Record<string, readonly string[]>> = {
  "/about": ["app/about/page.tsx", "content/ui-copy.json", "lib/site.ts"],
  "/near-me": [
    "app/near-me/page.tsx",
    "content/pages/near-me.md",
    "content/ui-copy.json",
    "lib/site.ts",
    "components/place-search-form.tsx",
  ],
  "/guides/best-time-to-see-northern-lights": [
    "app/guides/best-time-to-see-northern-lights/page.tsx",
    "content/guides/best-time-to-see-northern-lights.md",
    "content/ui-copy.json",
    "lib/site.ts",
    "components/guide-markdown.tsx",
  ],
  "/guides/how-to-see-northern-lights": [
    "app/guides/how-to-see-northern-lights/page.tsx",
    "content/guides/how-to-see-northern-lights.md",
    "content/ui-copy.json",
    "lib/site.ts",
    "components/guide-markdown.tsx",
  ],
  "/guides/where-to-see-northern-lights": [
    "app/guides/where-to-see-northern-lights/page.tsx",
    "content/guides/where-to-see-northern-lights.md",
    "content/ui-copy.json",
    "lib/site.ts",
  ],
  "/methodology": [
    "app/methodology/page.tsx",
    "content/guides/methodology.md",
    "content/ui-copy.json",
    "lib/site.ts",
    "components/guide-markdown.tsx",
  ],
  "/privacy": [
    "app/privacy/page.tsx",
    "content/ui-copy.json",
    "lib/site.ts",
    "components/analytics-preference.tsx",
  ],
  "/terms": ["app/terms/page.tsx", "content/ui-copy.json", "lib/site.ts"],
};

export const CONTENT_REVISIONS: Readonly<Record<string, string>> = {
  "/about": "2026-10-11T06:41:32.000Z",
  "/near-me": "2026-10-11T06:41:32.000Z",
  "/guides/best-time-to-see-northern-lights": "2026-10-12T16:09:26.000Z",
  "/guides/how-to-see-northern-lights": "2026-10-12T16:09:26.000Z",
  "/guides/where-to-see-northern-lights": "2026-10-13T09:07:33.000Z",
  "/methodology": "2026-10-12T16:09:26.000Z",
  "/privacy": "2026-10-13T09:07:33.000Z",
  "/terms": "2026-10-11T06:41:32.000Z",
};
