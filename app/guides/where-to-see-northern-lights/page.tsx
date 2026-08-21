import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { TonightPlaces } from "@/components/tonight-places";
import copy from "@/content/ui-copy.json";

import styles from "../../part4.module.css";

const TITLE = "Where to See the Northern Lights in the US Tonight";

export const dynamic = "force-static";
export const revalidate = 600;

export const metadata: Metadata = {
  title: TITLE,
  robots: { index: false, follow: false },
};

export default async function WhereGuidePage() {
  const body = await loadReaderBody();

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1>{TITLE}</h1>
      </header>

      <section className={styles.section} aria-label={copy.home.table_kicker}>
        <TonightPlaces grouped />
      </section>

      <article className={styles.reader}>{renderMarkdownBlocks(body)}</article>
    </main>
  );
}

async function loadReaderBody(): Promise<string> {
  const file = path.join(
    process.cwd(),
    "content",
    "guides",
    "where-to-see-northern-lights.md",
  );
  const markdown = await readFile(file, "utf8");
  const body = markdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/)?.[1];
  if (body === undefined) {
    throw new Error("Where guide frontmatter is missing or malformed.");
  }
  return body.trim();
}

function renderMarkdownBlocks(markdown: string): ReactNode[] {
  return markdown.split(/\r?\n\r?\n+/).map((block, index) => {
    const normalized = block.replace(/\r?\n/g, " ").trim();
    if (normalized.startsWith("## ")) {
      return <h2 key={index}>{normalized.slice(3)}</h2>;
    }
    return <p key={index}>{renderInlineMarkdown(normalized)}</p>;
  });
}

function renderInlineMarkdown(value: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;

  for (const match of value.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(value.slice(cursor, start));
    const token = match[0];

    if (token.startsWith("**")) {
      nodes.push(<strong key={`${start}-strong`}>{token.slice(2, -2)}</strong>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        nodes.push(
          <Link href={link[2]} key={`${start}-link`}>
            {link[1]}
          </Link>,
        );
      }
    }
    cursor = start + token.length;
  }

  if (cursor < value.length) nodes.push(value.slice(cursor));
  return nodes;
}
