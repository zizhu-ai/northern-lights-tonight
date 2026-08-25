export const SITE_URL = "https://aurora-tonight.com";

export const ogFor = (path: string, title: string, description: string) => ({
  type: "website" as const,
  url: `${SITE_URL}${path}`,
  title,
  description,
  images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
});

export function titleCasePhrase(phrase: string): string {
  return phrase
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function clampSeoText(text: string, min: number, max: number): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length > max) {
    return `${compact.slice(0, max - 1).trimEnd()}`;
  }
  if (compact.length < min) {
    const pad = " Local GO, MAYBE, or NO from NOAA and cloud data.";
    const filled = `${compact}${compact.endsWith(".") ? "" : "."}${pad}`;
    return filled.length > max ? filled.slice(0, max).trimEnd() : filled;
  }
  return compact;
}
