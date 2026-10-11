/**
 * Trustworthy content-revision timestamps for sitemap lastmod.
 *
 * Each value is the git committer date of that URL’s source (page module
 * and/or markdown body), converted to UTC. Forecast URLs and the homepage
 * are omitted: their visible answer is live NOAA/Open-Meteo data, which
 * issue #21 rejected as a page revision, and there is no separate frozen
 * copy timestamp that matches the rendered verdict.
 *
 * Do not substitute request time, build time, or Date.now().
 */
export const CONTENT_REVISIONS: Readonly<Record<string, string>> = {
  "/about": "2026-08-26T01:48:16.000Z",
  "/near-me": "2026-09-11T03:27:55.000Z",
  "/guides/best-time-to-see-northern-lights": "2026-08-25T13:25:55.000Z",
  "/guides/how-to-see-northern-lights": "2026-08-25T13:25:55.000Z",
  "/guides/where-to-see-northern-lights": "2026-08-25T13:25:55.000Z",
  "/methodology": "2026-08-26T01:48:16.000Z",
  "/privacy": "2026-08-26T02:23:13.000Z",
  "/terms": "2026-08-25T13:25:55.000Z",
};
