import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { JsonLd } from "@/components/guide-markdown";
import { PrivacyAnalytics } from "@/components/privacy-analytics";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import copy from "@/content/ui-copy.json";
import { SITE_URL } from "@/lib/site";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Northern Lights Tonight",
  description: copy.seo.fallback_description,
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body className={`${inter.variable} ${inter.className}`}>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        <div className="site-content" id="main-content">
          {children}
        </div>
        <SiteFooter />
        <JsonLd
          value={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: copy.chrome.wordmark,
            url: SITE_URL,
          }}
        />
        <PrivacyAnalytics />
      </body>
    </html>
  );
}
