export const SITE_URL = "https://aurora-tonight.com";

export const ogFor = (path: string, title: string, description: string) => ({
  type: "website" as const,
  url: `${SITE_URL}${path}`,
  title,
  description,
  images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
});
