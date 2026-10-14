import type { Metadata } from "next";
import { cache } from "react";

import { ForecastHours } from "@/components/forecast-hours";
import { ForecastViewTracker } from "@/components/forecast-view-tracker";
import { PlaceSearchForm } from "@/components/place-search-form";
import { StateNavLink } from "@/components/state-nav-link";
import { VerdictCard, verdictDataStatus } from "@/components/verdict-card";
import copy from "@/content/ui-copy.json";
import {
  getForecastDossier,
  getHeadlinePoint,
  WAVE_ONE_SLUGS,
  type ForecastDossier,
} from "@/lib/forecast-places";
import { haversineMiles } from "@/lib/place-search";
import { analyticsStateSlug } from "@/lib/search-event";
import {
  formatUpdatedAt,
  formatWindow,
  formatZoneAbbreviation,
} from "@/lib/snapshots";
import { windowReason } from "@/lib/verdict-presentation";
import { loadViewReading, timezoneForView } from "@/lib/view-live";
import { isCoordinateLabel } from "@/lib/view-reading";
import {
  hasRecheckParam,
  resolveViewParams,
  type QueryValue,
} from "@/lib/view-params";

import styles from "../part4.module.css";

type ViewPageProps = {
  searchParams: Promise<Record<string, QueryValue>>;
};

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const readViewReading = cache(loadViewReading);

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
  const description = params.lat < 0 ? copy.south.human : copy.view.forecast_live_disclaimer;

  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: { type: "website", title, description },
  };
}

export default async function ViewPage({ searchParams }: ViewPageProps) {
  const query = await searchParams;
  const params = resolveViewParams(query);
  const recheck = hasRecheckParam(query);

  if (!params.hasCoords) {
    return (
      <main className={`tool-page ${styles.page} ${styles.narrow}`}>
        <header className={styles.hero}>
          <h1>{copy.chrome.find_place_title}</h1>
        </header>
        <div className={styles.search}>
          <PlaceSearchForm source="view" />
        </div>
      </main>
    );
  }

  const { lat, lng, name } = params;
  const unavailable = lat < 0;
  const nearby = closestWaveOnePlaces(lat, lng);
  const reading = unavailable
    ? null
    : await readViewReading({ lat, lng, name, recheck });
  const timezone = unavailable ? "America/Denver" : timezoneForView(lat, lng);
  const timezoneAbbr = formatZoneAbbreviation(new Date(), timezone);
  const kicker = isCoordinateLabel(name, lat, lng) ? null : `${name} · ${timezoneAbbr}`;
  const status = unavailable ? "UNAVAILABLE" : (reading?.status ?? "UNKNOWN");
  const mainIssue = unavailable
    ? copy.south.main_issue
    : (reading?.mainIssue ?? copy.view.data_unavailable_main_issue);
  const updated = unavailable
    ? copy.verdict.updated_unknown
    : formatUpdatedAt(reading?.generatedAt, timezone);
  const bestWindow = unavailable || !reading
    ? copy.verdict.unknown_window
    : formatWindow(reading.bestWindowStart, reading.bestWindowEnd, timezone);
  const presentedWindows = (reading?.windows ?? []).map((window) => ({
    ...window,
    displayStatus: window.skip
      ? copy.chrome.skip_not_dark
      : (window.status ?? "UNKNOWN"),
    reason: window.skip ? copy.chrome.skip_not_dark : windowReason(window, name),
  }));
  const cannotJudge = status === "UNKNOWN" || status === "UNAVAILABLE";

  return (
    <main className={styles.home}>
      <div
        className={`twilight-band ${styles.twilight}`}
        data-status={verdictDataStatus(status)}
      >
        <div className={styles.inner}>
          <header className={styles.hero}>
            {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
            <h1>{copy.view.title_template.replace("{Place}", name)}</h1>
          </header>
        </div>
      </div>

      <div className={styles.inner}>
        <div className={styles.verdictSlot}>
          <ForecastViewTracker pageType="view" verdict={status} />
          <VerdictCard
            status={status}
            bestWindow={bestWindow}
            mainIssue={mainIssue}
            confidence={reading?.confidence ?? "low"}
            updated={updated}
            place={name}
            lookToward={reading?.lookToward ?? copy.verdict.look_north}
            changePlace
          />
        </div>

        <p className={styles.hint}>
          {unavailable
            ? copy.south.hint
            : cannotJudge
              ? copy.view.live_disclaimer
              : copy.view.forecast_live_disclaimer}
        </p>

        {!unavailable ? (
          <div className={styles.section}>
            <ForecastHours
              timezoneName={timezone}
              windows={presentedWindows}
              cannotJudge={cannotJudge}
              fallback={copy.verdict.hours_need_live}
            />
          </div>
        ) : null}

        <section className={styles.nearby}>
          <h2>Nearby</h2>
          <ul className={styles.nearbyList}>
            {nearby.map((place) => (
              <li key={place.slug}>
                <StateNavLink
                  href={`/forecast/${place.slug}`}
                  fromPageType="view"
                  toState={analyticsStateSlug(place) ?? place.slug}
                >
                  {place.name} tonight
                </StateNavLink>
                {/* Mileage is /view-only; forecast/state Nearby lists stay status + window. */}
                <span className={styles.nearbyMiles}>
                  {" "}
                  · about {Math.round(place.distance)} miles
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function closestWaveOnePlaces(
  lat: number,
  lng: number,
): Array<ForecastDossier & { distance: number }> {
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
    .map(({ place, distance }) => ({ ...place, distance }));
}
