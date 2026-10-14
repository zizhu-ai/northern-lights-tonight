import {
  fetchAuroraProducts,
  fetchCloudsForLocations,
  type JsonObject,
} from "@/lib/aurora-sources";
import { nearestPlace } from "@/lib/place-search";
import {
  computeViewReading,
  unknownViewReading,
  type ViewReading,
} from "@/lib/view-reading";

export async function loadViewReading(input: {
  lat: number;
  lng: number;
  name: string;
  now?: Date;
}): Promise<ViewReading> {
  const now = input.now ?? new Date();
  const nearest = nearestPlace(input.lat, input.lng);
  const timezone = nearest.tz || "America/Denver";
  const generatedAt = now.toISOString();

  try {
    const [products, clouds] = await Promise.all([
      fetchAuroraProducts(),
      fetchCloudsForLocations([
        {
          slug: "view",
          timezone,
          sample_points: [{ id: "pin", lat: input.lat, lng: input.lng }],
        },
      ]),
    ]);

    const ovationPayload = products.ovation.ok ? products.ovation.envelope.payload : null;
    const kpPayload = products.kp.ok ? products.kp.envelope.payload : null;
    const cloudKey = `${input.lat.toFixed(3)},${input.lng.toFixed(3)}`;
    const pointClouds =
      clouds.ok && clouds.envelope.payload
        ? ((clouds.envelope.payload[cloudKey] as JsonObject | null | undefined) ?? null)
        : null;

    return computeViewReading({
      lat: input.lat,
      lng: input.lng,
      name: input.name,
      timezone,
      urban: true,
      now,
      ovationPayload,
      kpPayload,
      clouds: pointClouds,
    });
  } catch {
    return unknownViewReading(input.name, input.lat, input.lng, generatedAt);
  }
}

export function timezoneForView(lat: number, lng: number): string {
  return nearestPlace(lat, lng).tz || "America/Denver";
}
