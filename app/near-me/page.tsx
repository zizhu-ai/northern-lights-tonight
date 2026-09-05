import type { Metadata } from "next";

import {
  loadMarkdownBody,
  renderMarkdownBlocks,
} from "@/components/guide-markdown";
import { PlaceSearchForm } from "@/components/place-search-form";
import copy from "@/content/ui-copy.json";
import { ogFor, SITE_URL } from "@/lib/site";

import styles from "../part4.module.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Northern Lights Near Me: Forecast by City or ZIP",
  description: copy.seo.near_me,
  alternates: { canonical: `${SITE_URL}/near-me` },
  robots: { index: true, follow: true },
  openGraph: ogFor(
    "/near-me",
    "Northern Lights Near Me: Forecast by City or ZIP",
    copy.seo.near_me,
  ),
};

export default async function NearMePage() {
  const extra = await loadMarkdownBody("pages/near-me.md");
  return (
    <main className={`tool-page ${styles.page} ${styles.narrow}`}>
      <header className={styles.hero}>
        <h1>{copy.near_me.title}</h1>
        <p className={styles.lead}>{copy.near_me.lead}</p>
      </header>

      <div className={styles.search}>
        <PlaceSearchForm source="near_me" />
      </div>

      <section className={`${styles.section} ${styles.panel}`}>
        <h2>Northern lights near me</h2>
        <p>{copy.near_me.why_body}</p>
      </section>

      <article className={styles.reader}>{renderMarkdownBlocks(extra)}</article>
    </main>
  );
}
