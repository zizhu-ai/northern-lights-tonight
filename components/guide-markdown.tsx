import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import type { ReactNode } from "react";

export type GuideContent = {
  title: string;
  h1: string;
  body: string;
};

export async function loadGuideContent(fileName: string): Promise<GuideContent> {
  const file = path.join(process.cwd(), "content", "guides", fileName);
  const markdown = await readFile(file, "utf8");
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  if (!match) {
    throw new Error(`Guide frontmatter is missing or malformed: ${fileName}`);
  }

  const title = match[1].match(/^title:\s*(.+)$/m)?.[1]?.trim();
  const h1 = match[1].match(/^h1:\s*(.+)$/m)?.[1]?.trim();

  if (!title || !h1) {
    throw new Error(`Guide title or h1 is missing: ${fileName}`);
  }

  return { title, h1, body: match[2].trim() };
}

export async function loadMarkdownBody(relativePath: string): Promise<string> {
  const file = path.join(process.cwd(), "content", relativePath);
  return (await readFile(file, "utf8")).trim();
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
