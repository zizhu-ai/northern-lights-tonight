import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
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
  // TODO(launch): remove robots noindex and the "Pipeline stub" description.
  description: "Local aurora go / maybe / no for the US. Pipeline stub — not indexed yet.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body className={`${inter.variable} ${inter.className}`}>
        <SiteHeader />
        <div className="site-content">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
