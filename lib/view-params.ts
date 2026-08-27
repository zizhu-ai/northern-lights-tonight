export type QueryValue = string | string[] | undefined;

export type ViewParams =
  | { hasCoords: false }
  | { hasCoords: true; lat: number; lng: number; name: string };

export function resolveViewParams(
  searchParams: Record<string, QueryValue>,
): ViewParams {
  const latValue = firstValue(searchParams.lat);
  const lngValue = firstValue(searchParams.lng);
  const rawLat = Number(latValue);
  const rawLng = Number(lngValue);
  const hasCoords =
    latValue !== undefined &&
    lngValue !== undefined &&
    latValue !== "" &&
    lngValue !== "" &&
    Number.isFinite(rawLat) &&
    Number.isFinite(rawLng) &&
    rawLat >= -90 &&
    rawLat <= 90 &&
    rawLng >= -180 &&
    rawLng <= 180;

  if (!hasCoords) return { hasCoords: false };

  const lat = roundCoordinate(rawLat);
  const lng = roundCoordinate(rawLng);
  const suppliedName = firstValue(searchParams.name)?.trim();

  return {
    hasCoords: true,
    lat,
    lng,
    name: suppliedName || `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
  };
}

function firstValue(value: QueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function roundCoordinate(value: number): number {
  return Math.round(value * 1000) / 1000;
}
