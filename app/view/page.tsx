import type { Metadata } from "next";
import Link from "next/link";

import { VerdictCard } from "@/components/verdict-card";
import copy from "@/content/ui-copy.json";
import {
  getForecastDossier,
  getHeadlinePoint,
  WAVE_ONE_SLUGS,
  type ForecastDossier,
} from "@/lib/forecast-places";
import { haversineMiles, roundCoordinate } from "@/lib/place-search";

import styles from "../part4.module.css";

type QueryValue = string | string[] | undefined;
type ViewPageProps = {
  searchParams: Promise<Record<string, QueryValue>>;
};

type ViewParams = {
  lat: number;
  lng: number;
  name: string;
};

export async function generateMetadata({ searchParams }: ViewPageProps): Promise<Metadata> {
  const { lat, name } = resolveViewParams(await searchParams);
  const title = `Northern Lights Tonight Near ${name}`;
  const description = lat < 0 ? copy.south.human : copy.view.unknown_main_issue;

  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: { type: "website", title, description },
  };
}

export default async function ViewPage({ searchParams }: ViewPageProps) {
  const { lat, lng, name } = resolveViewParams(await searchParams);
  const unavailable = lat < 0;
  const nearby = closestWaveOnePlaces(lat, lng);

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>
          {lat.toFixed(3)}, {lng.toFixed(3)}
        </p>
        <h1>Tonight near {name}</h1>
      </header>

      <div className={styles.viewCard}>
        <VerdictCard
          status={unavailable ? "UNAVAILABLE" : "UNKNOWN"}
          mainIssue={unavailable ? copy.south.main_issue : copy.view.unknown_main_issue}
          confidence="low"
          updated="Updated —"
          place={name}
        />
      </div>

      {unavailable ? (
        <p className={styles.hint}>{copy.south.hint}</p>
      ) : (
        <div className={styles.actions}>
          <Link className={styles.tryAgain} href="/near-me">
            {copy.chrome.try_again}
          </Link>
        </div>
      )}

      <section className={styles.nearby}>
        <h2>Nearby</h2>
        <ul className={styles.nearbyList}>
          {nearby.map((place) => (
            <li key={place.slug}>
              <Link href={`/forecast/${place.slug}`}>{place.name} tonight</Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function resolveViewParams(searchParams: Record<string, QueryValue>): ViewParams {
  const rawLat = Number(firstValue(searchParams.lat));
  const rawLng = Number(firstValue(searchParams.lng));
  const lat = roundCoordinate(Number.isFinite(rawLat) ? rawLat : 0);
  const lng = roundCoordinate(Number.isFinite(rawLng) ? rawLng : 0);
  const suppliedName = firstValue(searchParams.name)?.trim();

  return {
    lat,
    lng,
    name: suppliedName || `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
  };
}

function firstValue(value: QueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function closestWaveOnePlaces(lat: number, lng: number): ForecastDossier[] {
  return WAVE_ONE_SLUGS.map((slug) => getForecastDossier(slug))
    .filter((place): place is ForecastDossier => place !== null)
    .map((place) => ({
      place,
      distance: haversineMiles(
        lat,
        lng,
        getHeadlinePoint(place).lat,
        getHeadlinePoint(place).lng,
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 2)
    .map(({ place }) => place);
}
