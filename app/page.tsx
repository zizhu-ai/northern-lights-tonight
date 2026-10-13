import type { Metadata } from "next";
import Link from "next/link";

import {
  loadMarkdownBody,
  renderMarkdownBlocks,
} from "@/components/guide-markdown";
import { ForecastHours } from "@/components/forecast-hours";
import { PlaceSearchForm } from "@/components/place-search-form";
import {
  isSiteReadingsPaused,
  loadTonightRows,
  TonightPlaces,
} from "@/components/tonight-places";
import { StickyPlaceBar } from "@/components/sticky-place-bar";
import { VerdictCard, verdictDataStatus } from "@/components/verdict-card";
import copy from "@/content/ui-copy.json";
import { presentHomeOverview } from "@/lib/home-tonight";
import { formatZoneAbbreviation, loadLatestForPage } from "@/lib/snapshots";
import { ogFor, SITE_URL } from "@/lib/site";

import styles from "./part4.module.css";

const TITLE = "Northern Lights Tonight: US City and State Aurora Forecast";

export const revalidate = 600;
export const maxDuration = 60;

export const metadata: Metadata = {
  title: TITLE,
  description: copy.seo.home,
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  openGraph: ogFor("", TITLE, copy.seo.home),
};

export default async function HomePage() {
  const latest = await loadLatestForPage();
  const [rows, extra] = await Promise.all([
    loadTonightRows(),
    loadMarkdownBody("pages/home.md"),
  ]);
  const readingsPaused = isSiteReadingsPaused(rows);
  const overview = presentHomeOverview(rows, { sitePaused: readingsPaused });
  const revision = latest.freshness?.revision ?? "unavailable";
  const checkedAt = latest.freshness?.checked_at ?? "unavailable";
  const hoursHeading = overview.best
    ? `Tonight’s hours in ${overview.best.dossier.name} (${formatZoneAbbreviation(new Date(), overview.best.dossier.timezone)})`
    : undefined;
  return (
    <main
      className={styles.home}
      data-snapshot-revision={revision}
      data-snapshot-checked-at={checkedAt}
    >
      <div
        className={`twilight-band ${styles.twilight}`}
        data-status={verdictDataStatus(overview.presented.status, readingsPaused)}
      >
        <div className={styles.inner}>
          <header className={styles.hero}>
            <h1>{copy.home.title}</h1>
            <p className={styles.lead}>{overview.directAnswer}</p>
          </header>

          <div className={styles.search}>
            <PlaceSearchForm source="home" />
          </div>
        </div>
      </div>

      <div className={styles.inner}>
        <div className={`${styles.verdictSlot} ${styles.verdictSlotWide}`}>
          <VerdictCard
            presented={overview.presented}
            changePlace
            sentinelId="home-verdict"
          />
          <StickyPlaceBar
            placeLine={overview.presented.placeLine}
            sentinelId="home-verdict"
          />
        </div>

        <div className={styles.section}>
          <ForecastHours
            timezoneName={overview.best?.dossier.timezone ?? "America/New_York"}
            heading={hoursHeading}
            windows={overview.presented.windows}
            cannotJudge={overview.presented.cannotJudge}
            fallback={copy.verdict.hours_need_live}
          />
        </div>

        <section className={styles.section}>
          <h2>City verdicts tonight</h2>
          <div className={styles.cityCards}>
            {overview.cityCards.map((card) => (
              <Link
                className={styles.cityCard}
                href={`/forecast/${card.slug}`}
                key={`${card.slug}-${card.city}`}
              >
                <p className={styles.cityCardPlace}>
                  {card.city}
                  {card.stateName !== card.city ? `, ${card.stateName}` : ""}
                </p>
                <p className={styles.cityCardStatus} data-status={card.status.toLowerCase()}>
                  {card.status}
                </p>
                <p className={styles.cityCardReason}>{card.reason}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionKicker}>{copy.home.table_kicker}</h2>
          <TonightPlaces />
        </section>

        <div className={styles.infoGrid}>
          <section className={styles.panel}>
            <h2>{copy.home.what_time_title}</h2>
            <p>{copy.home.what_time_body}</p>
          </section>

          <section className={styles.panel}>
            <h2>{copy.how_to_read.title}</h2>
            <ul className={styles.readList}>
              <li>{copy.how_to_read.go}</li>
              <li>{copy.how_to_read.maybe}</li>
              <li>{copy.how_to_read.no}</li>
              <li>{copy.how_to_read.unknown}</li>
            </ul>
          </section>
        </div>

        <section className={styles.section}>
          <h2>{copy.chrome.nav_guides}</h2>
          <ul className={styles.guideLinks}>
            <li>
              <Link href="/guides/where-to-see-northern-lights">
                Where to See the Northern Lights in the US Tonight
              </Link>
            </li>
            <li>
              <Link href="/guides/best-time-to-see-northern-lights">
                Best Time to See the Northern Lights
              </Link>
            </li>
            <li>
              <Link href="/guides/how-to-see-northern-lights">
                How to See the Northern Lights
              </Link>
            </li>
            <li>
              <Link href="/methodology">{copy.chrome.footer_how}</Link>
            </li>
          </ul>
        </section>

        <article className={styles.reader}>{renderMarkdownBlocks(extra)}</article>
      </div>
    </main>
  );
}
