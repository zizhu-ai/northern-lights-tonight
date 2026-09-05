import type { Metadata } from "next";
import Link from "next/link";

import {
  loadMarkdownBody,
  renderMarkdownBlocks,
} from "@/components/guide-markdown";
import { PlaceSearchForm } from "@/components/place-search-form";
import {
  isSiteReadingsPaused,
  loadTonightRows,
  TonightPlaces,
} from "@/components/tonight-places";
import { StickyPlaceBar } from "@/components/sticky-place-bar";
import { VerdictCard } from "@/components/verdict-card";
import copy from "@/content/ui-copy.json";
import { getForecastDossier, HOME_REPRESENTATIVE_SLUG } from "@/lib/forecast-places";
import { loadLatest } from "@/lib/snapshots";
import { presentVerdict } from "@/lib/verdict-presentation";
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
  const [latest, extra] = await Promise.all([
    loadLatest(),
    loadMarkdownBody("pages/home.md"),
  ]);
  const revision = latest.freshness?.revision ?? "unavailable";
  const checkedAt = latest.freshness?.checked_at ?? "unavailable";
  return (
    <main
      className={styles.home}
      data-snapshot-revision={revision}
      data-snapshot-checked-at={checkedAt}
    >
      <div className={`twilight-band ${styles.twilight}`}>
        <div className={styles.inner}>
          <header className={styles.hero}>
            <h1>{copy.home.title}</h1>
            <p className={styles.lead}>{copy.home.lead}</p>
          </header>

          <div className={styles.search}>
            <PlaceSearchForm source="home" />
          </div>
        </div>
      </div>

      <div className={styles.inner}>
        <div className={`${styles.verdictSlot} ${styles.verdictSlotWide}`}>
          <HomeVerdict />
        </div>

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

async function HomeVerdict() {
  const rows = await loadTonightRows();
  const dossier =
    rows.find((row) => row.dossier.slug === HOME_REPRESENTATIVE_SLUG)?.dossier ??
    getForecastDossier(HOME_REPRESENTATIVE_SLUG);
  if (!dossier) return null;

  const representative =
    rows.find((row) => row.dossier.slug === HOME_REPRESENTATIVE_SLUG) ?? rows[0];
  const sitePaused = isSiteReadingsPaused(rows);
  const presented = presentVerdict({
    snapshot: representative?.snapshot ?? null,
    dossier,
    sample: true,
    sitePaused,
  });

  return (
    <>
      <VerdictCard presented={presented} sample changePlace sentinelId="home-verdict" />
      <StickyPlaceBar placeLine={presented.placeLine} sentinelId="home-verdict" />
    </>
  );
}
