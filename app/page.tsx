import type { Metadata } from "next";
import Link from "next/link";

import { PlaceSearchForm } from "@/components/place-search-form";
import {
  isSiteReadingsPaused,
  loadTonightRows,
  TonightPlaces,
} from "@/components/tonight-places";
import { VerdictCard } from "@/components/verdict-card";
import copy from "@/content/ui-copy.json";
import { HOME_REPRESENTATIVE_SLUG } from "@/lib/forecast-places";
import {
  formatUpdatedAt,
  formatWindow,
  loadLatest,
} from "@/lib/snapshots";

import styles from "./part4.module.css";

const TITLE = "Northern Lights Tonight: US City and State Aurora Forecast";

export const dynamic = "force-static";
export const revalidate = 600;

export const metadata: Metadata = {
  title: TITLE,
  description: copy.home.lead,
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    title: TITLE,
    description: copy.home.lead,
  },
};

export default function HomePage() {
  return (
    <main className={styles.home}>
      <div className={`twilight-band ${styles.twilight}`}>
        <div className={styles.inner}>
          <header className={styles.hero}>
            <h1>Can You See the Northern Lights Tonight?</h1>
            <p className={styles.lead}>{copy.home.lead}</p>
          </header>

          <div className={styles.search}>
            <PlaceSearchForm />
          </div>
        </div>
      </div>

      <div className={styles.inner}>
        <div className={styles.verdictSlot}>
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
            <h2>How to read GO / MAYBE / NO</h2>
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
      </div>
    </main>
  );
}

async function HomeVerdict() {
  const [latest, rows] = await Promise.all([loadLatest(), loadTonightRows()]);

  if (isSiteReadingsPaused(rows)) {
    return (
      <VerdictCard
        status="UNKNOWN"
        confidence="low"
        updated={formatUpdatedAt(latest.generated_at)}
        human={copy.verdict.site_stale_human}
        lookToward={rows[0]?.snapshot?.look_toward ?? rows[0]?.dossier.viewing_direction}
        stale
      />
    );
  }

  const representative =
    rows.find((row) => row.dossier.slug === HOME_REPRESENTATIVE_SLUG) ?? rows[0];
  const snapshot = representative.snapshot;
  const timezone = representative.dossier.timezone;

  return (
    <VerdictCard
      status={snapshot?.status ?? "UNKNOWN"}
      bestWindow={
        snapshot
          ? formatWindow(snapshot.best_window_start, snapshot.best_window_end, timezone)
          : copy.verdict.unknown_window
      }
      mainIssue={
        snapshot
          ? (snapshot.main_obstacle_text ?? snapshot.main_obstacle)
          : copy.view.unknown_main_issue
      }
      confidence={snapshot?.confidence ?? "low"}
      updated={formatUpdatedAt(snapshot?.updated_at ?? snapshot?.generated_at ?? latest.generated_at, timezone)}
      place={representative.dossier.name}
      lookToward={snapshot?.look_toward ?? representative.dossier.viewing_direction}
    />
  );
}
