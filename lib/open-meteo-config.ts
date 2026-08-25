export type OpenMeteoEnvironment = {
  VERCEL_ENV?: string;
  OPEN_METEO_USAGE_MODE?: string;
  OPEN_METEO_API_BASE?: string;
  OPEN_METEO_API_KEY?: string;
  AURORA_CLOUD_URL?: string;
};

export type OpenMeteoConfig = {
  baseUrl: string;
  apiKey: string | null;
};

const FREE_EVALUATION_URL = "https://api.open-meteo.com/v1/forecast";
const CUSTOMER_HOSTNAME = "customer-api.open-meteo.com";

const isCanonicalCustomerDestination = (url: URL): boolean =>
  url.protocol === "https:" &&
  url.hostname === CUSTOMER_HOSTNAME &&
  url.port === "" &&
  url.username === "" &&
  url.password === "" &&
  url.pathname === "/v1/forecast" &&
  url.hash === "";

export function resolveOpenMeteoConfig(env: OpenMeteoEnvironment): OpenMeteoConfig {
  if (env.VERCEL_ENV !== "production") {
    return {
      baseUrl: env.AURORA_CLOUD_URL ?? env.OPEN_METEO_API_BASE ?? FREE_EVALUATION_URL,
      apiKey: env.OPEN_METEO_API_KEY?.trim() || null,
    };
  }

  if (
    env.OPEN_METEO_USAGE_MODE !== undefined &&
    env.OPEN_METEO_USAGE_MODE !== "noncommercial"
  ) {
    throw new Error("Invalid Open-Meteo usage mode in production");
  }

  if (env.OPEN_METEO_USAGE_MODE === "noncommercial") {
    if (env.OPEN_METEO_API_KEY?.trim()) {
      throw new Error("An Open-Meteo API key is forbidden in noncommercial production");
    }
    if (
      env.OPEN_METEO_API_BASE !== undefined &&
      env.OPEN_METEO_API_BASE !== FREE_EVALUATION_URL
    ) {
      throw new Error("The canonical free Open-Meteo endpoint is required in noncommercial production");
    }
    return { baseUrl: FREE_EVALUATION_URL, apiKey: null };
  }

  const apiKey = env.OPEN_METEO_API_KEY?.trim();
  if (!apiKey) throw new Error("Open-Meteo API key is required in production");

  let baseUrl: URL;
  try {
    baseUrl = new URL(env.OPEN_METEO_API_BASE ?? "");
  } catch {
    throw new Error("A commercial Open-Meteo endpoint is required in production");
  }
  if (
    !isCanonicalCustomerDestination(baseUrl) ||
    baseUrl.search !== ""
  ) {
    throw new Error("A commercial Open-Meteo endpoint is required in production");
  }

  return { baseUrl: baseUrl.toString(), apiKey };
}

export function appendOpenMeteoCredential(url: URL, config: OpenMeteoConfig): URL {
  url.searchParams.delete("apikey");
  if (config.apiKey && isCanonicalCustomerDestination(url)) {
    url.searchParams.append("apikey", config.apiKey);
  }
  return url;
}

export function redactOpenMeteoError(_error: unknown, _secret?: string): string {
  return "Open-Meteo request failed";
}
