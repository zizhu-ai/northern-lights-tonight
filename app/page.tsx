import type { Metadata } from "next";
import Link from "next/link";

import { PlaceSearchForm } from "@/components/place-search-form";
import { TonightPlaces } from "@/components/tonight-places";
import copy from "@/content/ui-copy.json";

import styles from "./part4.module.css";

const TITLE = "Northern Lights Tonight: US City and State Aurora Forecast";

export const dynamic = "force-static";

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
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1>Can You See the Northern Lights Tonight?</h1>
        <p className={styles.lead}>{copy.home.lead}</p>
      </header>

      <div className={styles.search}>
        <PlaceSearchForm />
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
    </main>
  );
}
