/**
 * Centered-dipole magnetic latitude using the IGRF-13 2020 geomagnetic pole
 * recorded in 地点档案/wave1.json. Not AACGM. Used only as a geographic gate
 * for /view pins that have no dossier Kp bands.
 */
export const GEOMAGNETIC_POLE = { lat: 80.65, lng: -72.68 } as const;

/** South of this, far-window Kp cannot honestly create reach we refuse to invent. */
export const FAR_WINDOW_NO_REACH_MAG_LAT = 45;

export function magneticLatitude(lat: number, lng: number): number {
  const phi = toRadians(lat);
  const pole = toRadians(GEOMAGNETIC_POLE.lat);
  const delta = toRadians(lng - GEOMAGNETIC_POLE.lng);
  const sine = Math.sin(phi) * Math.sin(pole) + Math.cos(phi) * Math.cos(pole) * Math.cos(delta);
  return Math.asin(clamp(sine, -1, 1)) * (180 / Math.PI);
}

export function farWindowHasNoReach(magLat: number): boolean {
  return magLat < FAR_WINDOW_NO_REACH_MAG_LAT;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
