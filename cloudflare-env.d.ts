/* Binding names from wrangler.jsonc. Refresh with `npm run cf-typegen`.
 * Do not re-introduce a required ProcessEnv APP_ENV/NEXTJS_ENV merge — tests
 * and local Node builds leave those unset.
 */

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ENV?: string;
    NEXTJS_ENV?: string;
  }
}

interface CloudflareEnv {
  APP_ENV?: string;
  NEXTJS_ENV?: string;
  OPEN_METEO_USAGE_MODE?: string;
  AURORA_STATE_BUCKET: R2Bucket;
  NEXT_INC_CACHE_R2_BUCKET: R2Bucket;
  NEXT_CACHE_DO_QUEUE: DurableObjectNamespace;
  WORKER_SELF_REFERENCE: Fetcher;
  ASSETS: Fetcher;
}

interface R2Bucket {
  get(key: string): Promise<{
    body: ReadableStream;
    httpEtag?: string;
    etag?: string;
  } | null>;
  put(
    key: string,
    value: string,
    options?: {
      httpMetadata?: { contentType?: string };
      onlyIf?: { etagMatches?: string; etagDoesNotMatch?: string };
    },
  ): Promise<unknown>;
}

interface DurableObjectNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): unknown;
}

interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}
