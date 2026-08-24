import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

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
};

function GoogleAnalytics() {
  const gaId = process.env.GA_MEASUREMENT_ID?.trim();
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
        strategy="afterInteractive"
      />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});`}
      </Script>
    </>
  );
}

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
        <GoogleAnalytics />
      </body>
    </html>
  );
}
