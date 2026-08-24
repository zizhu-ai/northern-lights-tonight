import type { Metadata } from "next";

import copy from "@/content/ui-copy.json";
import { SITE_URL } from "@/lib/site";

import styles from "../part4.module.css";

const CONTACT_EMAIL = "hello@aurora-tonight.com";
const PAGE_URL = `${SITE_URL}/terms`;

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: copy.seo.terms,
  alternates: { canonical: PAGE_URL },
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1>Terms of Use</h1>
      </header>
      <article className={styles.reader}>
        <h2>The forecast is not a guarantee</h2>
        <p>
          GO, MAYBE, and NO are tool judgments about whether tonight is worth
          a look. They are not a promise you will see the aurora, and they are
          not advice to go outside, drive, or travel.
        </p>

        <h2>NOAA</h2>
        <p>
          Northern Lights Tonight is not affiliated with NOAA. Aurora data
          comes from public NOAA Space Weather Prediction Center products.
        </p>

        <h2>Your use</h2>
        <p>
          Night travel, driving, and time outdoors are at your own risk. Check
          local conditions and use your own judgment.
        </p>

        <h2>Contact</h2>
        <p>
          Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </article>
    </main>
  );
}
