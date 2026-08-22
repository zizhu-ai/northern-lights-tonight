import type { Metadata } from "next";

import { PlaceSearchForm } from "@/components/place-search-form";
import copy from "@/content/ui-copy.json";

import styles from "../part4.module.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Northern Lights Near Me: Forecast by City or ZIP",
  description: copy.near_me.lead,
  robots: { index: false, follow: false },
};

export default function NearMePage() {
  return (
    <main className={`tool-page ${styles.page} ${styles.narrow}`}>
      <header className={styles.hero}>
        <h1>Northern Lights Near Me</h1>
        <p className={styles.lead}>{copy.near_me.lead}</p>
      </header>

      <div className={styles.search}>
        <PlaceSearchForm />
      </div>

      <section className={`${styles.section} ${styles.panel}`}>
        <h2>{copy.near_me.why_title}</h2>
        <p>{copy.near_me.why_body}</p>
      </section>
    </main>
  );
}
