import type { Metadata } from "next";

import {
  JsonLd,
  loadGuideContent,
  renderMarkdownBlocks,
} from "@/components/guide-markdown";
import copy from "@/content/ui-copy.json";
import { SITE_URL } from "@/lib/site";

import styles from "../../part4.module.css";

const FILE_NAME = "best-time-to-see-northern-lights.md";
const PAGE_URL = `${SITE_URL}/guides/best-time-to-see-northern-lights`;

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await loadGuideContent(FILE_NAME);
  return {
    title,
    description: copy.seo.best_time,
    alternates: { canonical: PAGE_URL },
    robots: { index: false, follow: false },
  };
}

export default async function BestTimeGuidePage() {
  const content = await loadGuideContent(FILE_NAME);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: content.title,
    name: content.title,
    url: PAGE_URL,
    mainEntityOfPage: PAGE_URL,
  };

  return (
    <main className={styles.page}>
      <JsonLd value={schema} />
      <header className={styles.hero}>
        <h1>{content.h1}</h1>
      </header>
      <article className={styles.reader}>
        {renderMarkdownBlocks(content.body)}
      </article>
    </main>
  );
}
