export type AppEnvironment = {
  APP_ENV?: string;
};

export function resolveAppEnv(env: AppEnvironment = process.env): string {
  return (env.APP_ENV ?? "").trim().toLowerCase();
}

export function isProductionAppEnv(env: AppEnvironment = process.env): boolean {
  return resolveAppEnv(env) === "production";
}

export function hostnameFromHostHeader(hostHeader: string | null | undefined): string {
  return (hostHeader ?? "").split(":")[0].toLowerCase();
}

export function isPreviewHost(host: string): boolean {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host.endsWith(".localhost") ||
    host.endsWith(".workers.dev")
  );
}

export function shouldApplyProductionCanonicalRedirect(
  hostHeader: string | null | undefined,
  env: AppEnvironment = process.env,
): boolean {
  if (!isProductionAppEnv(env)) return false;
  return !isPreviewHost(hostnameFromHostHeader(hostHeader));
}

export function shouldSendPreviewNoindex(
  hostHeader: string | null | undefined,
  env: AppEnvironment = process.env,
): boolean {
  const host = hostnameFromHostHeader(hostHeader);
  return isPreviewHost(host) || !isProductionAppEnv(env);
}
