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
          <img className="wordmark__mark" src="/icon.svg" alt="" width={22} height={22} />
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
          </ul>
        </nav>
        <p>{copy.chrome.footer_noaa}</p>
      </div>
    </footer>
  );
}
