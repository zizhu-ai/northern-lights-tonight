import type { Metadata } from "next";

import {
  JsonLd,
  loadGuideContent,
  renderMarkdownBlocks,
} from "@/components/guide-markdown";

import styles from "../../part4.module.css";

const FILE_NAME = "how-to-see-northern-lights.md";
const PAGE_URL =
  "https://northern-lights-tonight.vercel.app/guides/how-to-see-northern-lights";

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await loadGuideContent(FILE_NAME);
  return { title, robots: { index: false, follow: false } };
}

export default async function HowToGuidePage() {
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
