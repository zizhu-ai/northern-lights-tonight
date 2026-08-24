import type { Metadata } from "next";

import copy from "@/content/ui-copy.json";
import { ogFor, SITE_URL } from "@/lib/site";

import styles from "../part4.module.css";

const CONTACT_EMAIL = "hello@aurora-tonight.com";
const PAGE_URL = `${SITE_URL}/privacy`;

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: copy.seo.privacy,
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  openGraph: ogFor("/privacy", "Privacy Policy", copy.seo.privacy),
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1>Privacy Policy</h1>
      </header>
      <article className={styles.reader}>
        <h2>Who we are</h2>
        <p>
          Northern Lights Tonight is a US English aurora forecast site at{" "}
          <a href={SITE_URL}>{SITE_URL}</a>. We do not offer accounts, and we
          do not sell personal information.
        </p>

        <h2>Location data</h2>
        <p>
          We request GPS only after you click Use my location. Your browser
          matches those coordinates to our US place list, then navigates to a
          local forecast page or to{" "}
          <code>/view?lat=&amp;lng=&amp;name=</code>. We do not write location
          into a user database, we do not store it in a cookie, and we do not
          use it for remarketing. A <code>/view</code> URL may include
          coordinates so the server can render that noindex reading once.
          Vercel or CDN access logs may retain query strings; this policy does
          not claim those logs are stripped.
        </p>

        <h2>Analytics</h2>
        <p>
          If Google Analytics 4 is enabled, Google may use cookies or IP
          address to measure visits. We use that measurement for traffic
          statistics. With no ads configured, we do not use Analytics as an ad
          platform.
        </p>

        <h2>Data sources</h2>
        <p>
          Aurora activity comes from public NOAA Space Weather Prediction
          Center products (OVATION and Kp). Cloud cover comes from Open-Meteo.
          Your browser does not call NOAA directly.
        </p>

        <h2>Contact</h2>
        <p>
          Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </article>
    </main>
  );
}
