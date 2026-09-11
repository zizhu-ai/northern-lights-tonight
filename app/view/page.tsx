import type { Metadata } from "next";
import Link from "next/link";

import { PlaceSearchForm } from "@/components/place-search-form";
import { VerdictCard } from "@/components/verdict-card";
import copy from "@/content/ui-copy.json";
import {
  getForecastDossier,
  getHeadlinePoint,
  WAVE_ONE_SLUGS,
  type ForecastDossier,
} from "@/lib/forecast-places";
import { haversineMiles } from "@/lib/place-search";
import {
  resolveViewParams,
  type QueryValue,
} from "@/lib/view-params";

import styles from "../part4.module.css";

type ViewPageProps = {
  searchParams: Promise<Record<string, QueryValue>>;
};

export async function generateMetadata({ searchParams }: ViewPageProps): Promise<Metadata> {
  const params = resolveViewParams(await searchParams);
  if (!params.hasCoords) {
    return {
      title: copy.chrome.find_place_title,
      description: copy.near_me.lead,
      robots: { index: false, follow: true },
    };
  }

  const title = `Northern Lights Tonight Near ${params.name}`;
  const description = params.lat < 0 ? copy.south.human : copy.view.unknown_main_issue;

  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: { type: "website", title, description },
  };
}

export default async function ViewPage({ searchParams }: ViewPageProps) {
  const params = resolveViewParams(await searchParams);

  if (!params.hasCoords) {
    return (
      <main className={`tool-page ${styles.page} ${styles.narrow}`}>
        <header className={styles.hero}>
          <h1>{copy.chrome.find_place_title}</h1>
        </header>
        <div className={styles.search}>
          <PlaceSearchForm />
        </div>
      </main>
    );
  }

  const { lat, lng, name } = params;
  const unavailable = lat < 0;
  const nearby = closestWaveOnePlaces(lat, lng);

  return (
    <main className={styles.home}>
      <div className={`twilight-band ${styles.twilight}`}>
        <div className={styles.inner}>
          <header className={styles.hero}>
            <p className={styles.kicker}>
              {lat.toFixed(3)}, {lng.toFixed(3)}
            </p>
            <h1>{copy.view.title_template.replace("{Place}", name)}</h1>
          </header>
        </div>
      </div>

      <div className={styles.inner}>
        <div className={styles.verdictSlot}>
          <VerdictCard
            status={unavailable ? "UNAVAILABLE" : "UNKNOWN"}
            mainIssue={unavailable ? copy.south.main_issue : copy.view.unknown_main_issue}
            confidence="low"
            updated={copy.verdict.updated_unknown}
            place={name}
            changePlace
          />
        </div>

        <p className={styles.hint}>
          {unavailable ? copy.south.hint : copy.view.live_disclaimer}
        </p>

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
      </div>
    </main>
  );
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
