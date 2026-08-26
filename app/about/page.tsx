import type { Metadata } from "next";

import copy from "@/content/ui-copy.json";
import { ogFor, SITE_URL } from "@/lib/site";

import styles from "../part4.module.css";

const PAGE_URL = `${SITE_URL}/about`;
const TITLE = "About Northern Lights Tonight";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: TITLE,
  description: copy.seo.about,
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  openGraph: ogFor("/about", TITLE, copy.seo.about),
};

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1>About Northern Lights Tonight</h1>
        <p className={styles.lead}>
          We turn public aurora and cloud data into a plain-language answer to
          one practical question: is tonight worth a look where you are?
        </p>
      </header>

      <article className={styles.reader}>
        <h2>Who we are</h2>
        <p>
          Northern Lights Tonight is an independent US English forecast
          publisher. We built the site for people who want a local decision,
          not a dramatic national headline or a single Kp number with no
          context. Our pages explain the evidence behind each answer and say
          when the available data is too weak to support one.
        </p>

        <h2>What GO, MAYBE, and NO mean</h2>
        <p>
          The tool combines aurora reach, darkness, cloud cover, and local
          viewing limits in a fixed gate order. GO means conditions line up
          well enough to try. MAYBE means a display is possible but an obstacle
          matters. NO means a special trip is not justified by the current
          signals. UNKNOWN means we do not have reliable enough data to guess.
          These labels are practical judgments, not guarantees or percentage
          probabilities.
        </p>

        <h2>Where we publish forecasts</h2>
        <p>
          Wave 1 covers 15 forecast pages across selected US states and cities:
          Colorado, Ohio, Indiana, Michigan, Chicago, Seattle, Wisconsin,
          Massachusetts, Maine, Minnesota, Illinois, Oregon, Utah, Alaska, and
          Fairbanks. Coverage is intentionally limited while we verify that
          each local page has a useful headline point, timezone, nearby places,
          and viewing guidance. A place without a dedicated page can still be
          checked through the Near me tool without creating another indexed
          forecast URL.
        </p>

        <h2>Sources and independence</h2>
        <p>
          Aurora activity comes from public NOAA Space Weather Prediction
          Center products, including OVATION and Kp. Cloud-cover data is
          adapted from Open-Meteo. Northern Lights Tonight is not affiliated
          with, endorsed by, or operated by NOAA. We describe our gate order
          and freshness rules on the methodology page so readers can judge the
          tool rather than take a verdict on faith.
        </p>

        <h2>Contact</h2>
        <p>
          Questions, corrections, and source concerns are welcome at{" "}
          <a href="mailto:hello@aurora-tonight.com">
            hello@aurora-tonight.com
          </a>
          . Please include the page URL and what looked wrong so we can check
          the same place and forecast context.
        </p>
      </article>
    </main>
  );
}
