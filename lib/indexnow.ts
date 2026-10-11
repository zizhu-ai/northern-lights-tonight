// Node's strip-types runner requires a runtime TypeScript import extension.
// @ts-ignore TS5097: Next's bundler resolves this source import without emitting it.
import { ACQUISITION_ROUTES } from "./acquisition-routes.ts";
// @ts-ignore TS5097: see the strip-types runner note above.
import { canonicalPathname, PRIMARY_HOST } from "./indexing.ts";

/** Public by design: IndexNow ownership proof, not a secret. */
export const INDEXNOW_KEY = "80782f4c69d9488dc026c5d3346d9a88";
export const INDEXNOW_KEY_FILENAME = `${INDEXNOW_KEY}.txt`;
export const INDEXNOW_KEY_PATH = `/${INDEXNOW_KEY_FILENAME}`;
export const INDEXNOW_HOST = PRIMARY_HOST;
export const INDEXNOW_KEY_LOCATION = `https://${PRIMARY_HOST}${INDEXNOW_KEY_PATH}`;
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

const SITE_ORIGIN = `https://${PRIMARY_HOST}`;

export function isIndexNowKeyPath(pathname: string): boolean {
  return canonicalPathname(pathname) === INDEXNOW_KEY_PATH;
}

export function indexNowUrlList(origin = SITE_ORIGIN): string[] {
  return ACQUISITION_ROUTES.map(({ path }) => new URL(path, origin).href);
}

export function indexNowPayload(urlList: readonly string[] = indexNowUrlList()) {
  return {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: [...urlList],
  };
}
