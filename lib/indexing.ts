export const PRIMARY_HOST = "aurora-tonight.com";
export const API_ROBOTS_TAG = "noindex, nofollow";

const SITE_ORIGIN = `https://${PRIMARY_HOST}`;

export function siteRobots() {
  return {
    // Allow Google to crawl /api/* so it can see X-Robots-Tag: noindex.
    // Disallowing /api/ is what produced GSC "Indexed, though blocked by robots.txt".
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}

export function canonicalPathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.replace(/\/+$/, "") || "/";
  }
  return pathname;
}

export function productionCanonicalRedirectUrl(
  hostHeader: string | null,
  pathname: string,
  search: string,
): string | null {
  const host = (hostHeader ?? "").split(":")[0].toLowerCase();
  const nextPath = canonicalPathname(pathname);
  if (host === PRIMARY_HOST && nextPath === pathname) {
    return null;
  }
  // Assign URL components so malformed paths cannot be parsed as a new host.
  const destination = new URL(SITE_ORIGIN);
  destination.pathname = nextPath;
  destination.search = search;
  if (destination.origin !== SITE_ORIGIN) {
    throw new Error("Canonical redirect must stay on the primary origin");
  }
  return destination.href;
}
