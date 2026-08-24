type LocationStatus = { status: string };

export function summarizeHealth(source: string, locations: LocationStatus[]) {
  const unknowns = locations.filter((location) => location.status === "UNKNOWN").length;
  const total = locations.length;

  return {
    unknowns,
    total,
    degraded: source === "bundled" || unknowns === total,
  };
}
