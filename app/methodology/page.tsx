import type { Metadata } from "next";

import {
  JsonLd,
  loadGuideContent,
  renderMarkdownBlocks,
} from "@/components/guide-markdown";
import copy from "@/content/ui-copy.json";
import { SITE_URL } from "@/lib/site";

import styles from "../part4.module.css";

const FILE_NAME = "methodology.md";
const PAGE_URL = `${SITE_URL}/methodology`;

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await loadGuideContent(FILE_NAME);
  return {
    title,
    description: copy.seo.methodology,
    alternates: { canonical: PAGE_URL },
    robots: { index: true, follow: true },
  };
}

export default async function MethodologyPage() {
  const content = await loadGuideContent(FILE_NAME);
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.title,
    headline: content.h1,
    url: PAGE_URL,
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
