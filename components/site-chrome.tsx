import Link from "next/link";

import copy from "@/content/ui-copy.json";

import { FindPlace } from "./find-place";

const links = [
  { label: copy.chrome.nav_tonight, href: "/" },
  { label: copy.chrome.nav_near_me, href: "/near-me" },
  {
    label: copy.chrome.nav_guides,
    href: "/guides/best-time-to-see-northern-lights",
  },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="wordmark" href="/">
          <img
            className="wordmark__mark"
            src="/icon.svg"
            alt="Northern Lights Tonight"
            width={22}
            height={22}
          />
          <span>{copy.chrome.wordmark}</span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {links.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <FindPlace />
      </div>
    </header>
  );
}

const CONTACT_EMAIL = "hello@aurora-tonight.com";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <nav aria-label="Footer">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/methodology">{copy.chrome.footer_how}</Link>
            </li>
            <li>
              <Link href="/about">{copy.chrome.footer_about}</Link>
            </li>
            <li>
              <Link href="/privacy">{copy.chrome.footer_privacy}</Link>
            </li>
            <li>
              <Link href="/terms">{copy.chrome.footer_terms}</Link>
            </li>
          </ul>
        </nav>
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <p>
          {copy.chrome.footer_aurora_data} {copy.chrome.footer_cloud_before_source}{" "}
          <a href="https://open-meteo.com/">Open-Meteo</a>{" "}
          {copy.chrome.footer_cloud_before_license}{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.
        </p>
        <p>{copy.chrome.footer_noaa}</p>
      </div>
    </footer>
  );
}
