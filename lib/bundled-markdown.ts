import documents from "./bundled-markdown.json" with { type: "json" };

export type GuideContent = {
  title: string;
  h1: string;
  body: string;
};

const MARKDOWN_BY_PATH: Readonly<Record<string, string>> = documents;

export function bundledMarkdownPaths(): string[] {
  return Object.keys(MARKDOWN_BY_PATH).sort();
}

export function readBundledMarkdown(relativePath: string): string {
  const markdown = MARKDOWN_BY_PATH[relativePath];
  if (typeof markdown !== "string") {
    throw new Error(`Bundled markdown missing: ${relativePath}`);
  }
  return markdown;
}

export function loadMarkdownBody(relativePath: string): string {
  return readBundledMarkdown(relativePath).trim();
}

export function parseGuideContent(fileName: string, markdown: string): GuideContent {
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

export function loadGuideContent(fileName: string): GuideContent {
  return parseGuideContent(fileName, readBundledMarkdown(`guides/${fileName}`));
}
