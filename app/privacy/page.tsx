import type { Metadata } from "next";

import { AnalyticsPreference } from "@/components/analytics-preference";
import copy from "@/content/ui-copy.json";
import { ogFor, SITE_URL } from "@/lib/site";

import styles from "../part4.module.css";

const CONTACT_EMAIL = "hello@aurora-tonight.com";
const PAGE_URL = `${SITE_URL}/privacy`;

export const dynamic = "force-static";

const TITLE = "Privacy Policy | Northern Lights Tonight";

export const metadata: Metadata = {
  title: TITLE,
  description: copy.seo.privacy,
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  openGraph: ogFor("/privacy", TITLE, copy.seo.privacy),
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1>Privacy Policy</h1>
      </header>
      <article className={styles.reader}>
        <h2>Privacy policy overview</h2>
        <p>
          This privacy policy explains how Northern Lights Tonight handles
          location, analytics, and third-party data sources. Accounts are
          not offered. Personal information is not sold. This page is the
          full statement; marketing copy does not override it.
        </p>

        <h2>Who we are</h2>
        <p>
          Northern Lights Tonight is a US English aurora forecast site at{" "}
          <a href={SITE_URL}>{SITE_URL}</a>. Contact is email only. This
          same rules apply to the public website, including local
          forecast pages, guides, near me, and noindex live pins.
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

        <h2>What this page covers</h2>
        <p>
          Indexed pages, the near me form, GPS (only after a click), live
          pins under <code>/view</code>, and aggregate analytics if you have
          not opted out. The site also loads Google AdSense for account
          verification and possible ad delivery. NOAA, Open-Meteo, and Google
          services have their own rules.
        </p>

        <h2>Analytics</h2>
        <p>
          We use Vercel Web Analytics to understand aggregate site traffic. It
          reports anonymous page-view data: the page path without its query or
          hash, referrer, and coarse location and device categories. It uses no
          third-party cookies and does not store your IP address. We do not use
          it for advertising or remarketing. Browser Do Not Track is respected,
          and you can also save an analytics opt-out in this browser.
        </p>
        <AnalyticsPreference />

        <h2>Data sources</h2>
        <p>
          Aurora activity comes from public NOAA Space Weather Prediction
          Center products (OVATION and Kp). Cloud-cover data is adapted from{" "}
          <a href="https://open-meteo.com/">Open-Meteo</a> under{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.
          Your browser does not call NOAA or Open-Meteo directly.
        </p>

        <h2>Cookies, logs, and what we do not do</h2>
        <p>
          Google AdSense is a third-party advertising service. Its script may
          use advertising cookies, web beacons, or similar technologies and
          may receive request data such as your IP address, browser details,
          page URL, and ad interactions. Google may use that information to
          deliver, limit, personalize, and measure advertising, subject to
          your consent choices and applicable law. We do not sell, rent, or
          trade personal information ourselves.
        </p>
        <p>
          This policy does not claim that Vercel platform logs are empty;
          hosting logs may include IP addresses and URLs as any HTTPS host
          does. Query strings on <code>/view</code> can appear in those logs.
        </p>
        <p>
          If you opt out of analytics, we honor that flag in this browser.
          Clearing storage can reset it. Do Not Track is also respected.
          This page will be updated on this URL if that changes.
        </p>
        <p>
          Children: the site is a weather-style tool, not directed at
          children, and it does not knowingly collect personal information
          from children. Email us if you believe we have done so.
        </p>

        <h2>Changes</h2>
        <p>
          If we add accounts or new processors, or materially change how ads
          work, the text on this URL will change. Material changes are not
          buried in a changelog you cannot find. The date is the page’s last
          deploy.
        </p>
        <p>
          International visitors: the product is US English and US places.
          Hosting may still log a request from anywhere. v1 does not name a
          separate GDPR representative. Email us if you need a deletion of
          something you believe we hold; for GPS we hold nothing after the
          click-through match.
        </p>

        <h2>Processors and hosting</h2>
        <p>
          The site is hosted on Vercel. Vercel may process request metadata
          (IP, user agent, URL) as any HTTPS host does. Analytics, when
          enabled, is Vercel Web Analytics with the path sanitized. Google
          AdSense supplies the advertising script and may process data as
          described above. There is no customer database of names or emails
          except the messages you send to {CONTACT_EMAIL}.
        </p>
        <p>
          Snapshot files used for forecasts are geophysical data, not user
          data. They describe oval reach and clouds at place coordinates
          from public sources. They are not a profile of you.
        </p>
        <p>
          Email you send to {CONTACT_EMAIL} is ordinary mail. We keep it
          long enough to answer. Do not put passwords or government IDs in
          that inbox; we do not need them.
        </p>
        <p>
          Do Not Track: if your browser sends DNT, analytics stays off.
          Opt-out stored in this browser is a local flag. Clearing site
          data can reset it. That is a browser fact, not a loophole.
        </p>
        <p>
          GPS: the permission prompt is the control. No prompt, no read.
          After a successful match we navigate to a place page or a pin.
          The product does not keep a history of those clicks as an
          account trail.
        </p>
        <p>
          <code>/view</code> pins: coordinates can appear in the URL so
          the server can render one noindex reading. Treat that URL as
          something you might share; it is not a secret. CDN logs may
          retain it.
        </p>
        <p>
          Third parties: NOAA and Open-Meteo are data sources for the
          engine. Your browser does not call them. Opening their websites
          yourself is outside this product.
        </p>
        <p>
          Children: this is a forecast tool, not a game aimed at children.
          We do not knowingly collect personal information from children.
        </p>
        <p>
          California / other state laws: we do not sell personal
          information. There is no “do not sell” toggle because there is
          no sale. Email {CONTACT_EMAIL} for an access or deletion request
          about mail you sent us.
        </p>

        <h2>Privacy policy vocabulary</h2>
        <p>
          Privacy, in this privacy policy, means we do not build a dossier
          of who you are. Policy, in this privacy policy, means the rules
          on this URL — not a banner that disagrees with the page. Location
          privacy is the GPS click. Analytics privacy is DNT plus the
          on-page opt-out. Source privacy is that your browser does not
          call NOAA or Open-Meteo.
        </p>
        <p>
          The privacy policy is short because the product is short: no
          accounts, no customer database, and no child-directed game. The
          advertising processor is named above. If the product grows, the
          privacy policy grows on this same path so crawlers and humans find
          one document.
        </p>
        <p>
          Retention: geophysical snapshots are not user records. Mail in
          {CONTACT_EMAIL} is mail. Hosting logs are hosting logs. Policy
          here does not pretend those logs are empty. Privacy here does
          mean we will not sell them.
        </p>
        <p>
          Requests: email is the channel. Say whether you want a copy of
          mail you sent, or a deletion of that mail. We cannot delete a
          GPS point we never stored. We cannot delete a NOAA grid. Privacy
          policy questions that are actually forecast questions belong on
          the methodology page instead.
        </p>
        <p>
          Effective date: the last production deploy of this privacy
          policy. There is no separate PDF. There is no version table.
          The HTML on {PAGE_URL} is the privacy policy.
        </p>
        <p>
          Security: transport is HTTPS. There is no login form to steal.
          There is no password reset. If you see a page asking for a
          password on this hostname, it is not this product. Email
          {CONTACT_EMAIL} if something looks forged.
        </p>
        <p>
          Policy on this privacy page covers GPS. Policy on this privacy
          page covers analytics. Policy on this privacy page covers mail
          you send to {CONTACT_EMAIL}. Three sentences, one URL, no
          separate PDF.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this privacy policy:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </article>
    </main>
  );
}
