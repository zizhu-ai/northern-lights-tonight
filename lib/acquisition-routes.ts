export const ACQUISITION_ROUTES = [
  { path: "/" },
  { path: "/about" },
  { path: "/near-me" },
  { path: "/guides/best-time-to-see-northern-lights" },
  { path: "/guides/how-to-see-northern-lights" },
  { path: "/guides/where-to-see-northern-lights" },
  { path: "/methodology" },
  { path: "/privacy" },
  { path: "/terms" },
  { path: "/forecast/colorado" },
  { path: "/forecast/ohio" },
  { path: "/forecast/indiana" },
  { path: "/forecast/michigan" },
  { path: "/forecast/chicago" },
  { path: "/forecast/seattle" },
  { path: "/forecast/wisconsin" },
  { path: "/forecast/massachusetts" },
  { path: "/forecast/maine" },
  { path: "/forecast/minnesota" },
  { path: "/forecast/illinois" },
  { path: "/forecast/oregon" },
  { path: "/forecast/utah" },
  { path: "/forecast/alaska" },
  { path: "/forecast/fairbanks" },
  { path: "/forecast/new-york" },
  { path: "/forecast/pennsylvania" },
  { path: "/forecast/vermont" },
  { path: "/forecast/new-hampshire" },
  { path: "/forecast/montana" },
  { path: "/forecast/idaho" },
  { path: "/forecast/north-dakota" },
  { path: "/forecast/south-dakota" },
  { path: "/forecast/iowa" },
] as const;

const ACQUISITION_PATHS: ReadonlySet<string> = new Set(
  ACQUISITION_ROUTES.map(({ path }) => path),
);

export function isAcquisitionRoute(pathname: string): boolean {
  return ACQUISITION_PATHS.has(pathname);
}
