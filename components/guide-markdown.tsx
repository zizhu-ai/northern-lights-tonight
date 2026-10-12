import Link from "next/link";
import type { ReactNode } from "react";

import {
  loadGuideContent as loadBundledGuideContent,
  loadMarkdownBody as loadBundledMarkdownBody,
  type GuideContent as BundledGuideContent,
} from "@/lib/bundled-markdown";

export type GuideContent = BundledGuideContent;

export async function loadGuideContent(fileName: string): Promise<GuideContent> {
  return loadBundledGuideContent(fileName);
}

export async function loadMarkdownBody(relativePath: string): Promise<string> {
  return loadBundledMarkdownBody(relativePath);
}

export function renderMarkdownBlocks(markdown: string): ReactNode[] {
  return markdown.split(/\r?\n\r?\n+/).map((block, index) => {
    const lines = block.split(/\r?\n/).map((line) => line.trim());
    const normalized = lines.join(" ").trim();

    if (normalized.startsWith("## ")) {
      return <h2 key={index}>{renderInlineMarkdown(normalized.slice(3))}</h2>;
    }

    if (lines.every((line) => /^-\s+/.test(line))) {
      return (
        <ul key={index}>
          {lines.map((line, lineIndex) => (
            <li key={lineIndex}>{renderInlineMarkdown(line.replace(/^-\s+/, ""))}</li>
          ))}
        </ul>
      );
    }

    if (lines.every((line) => /^\d+\.\s+/.test(line))) {
      return (
        <ol key={index}>
          {lines.map((line, lineIndex) => (
            <li key={lineIndex}>
              {renderInlineMarkdown(line.replace(/^\d+\.\s+/, ""))}
            </li>
          ))}
        </ol>
      );
    }

    return <p key={index}>{renderInlineMarkdown(normalized)}</p>;
  });
}

export function JsonLd({ value }: { value: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(value).replaceAll("<", "\\u003c"),
      }}
    />
  );
}

function renderInlineMarkdown(value: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;

  for (const match of value.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(value.slice(cursor, start));
    const token = match[0];

    if (token.startsWith("**")) {
      nodes.push(<strong key={`${start}-strong`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={`${start}-code`}>{token.slice(1, -1)}</code>);
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
