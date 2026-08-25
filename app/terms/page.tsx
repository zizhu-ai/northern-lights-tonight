import type { Metadata } from "next";

import copy from "@/content/ui-copy.json";
import { ogFor, SITE_URL } from "@/lib/site";

import styles from "../part4.module.css";

const CONTACT_EMAIL = "hello@aurora-tonight.com";
const PAGE_URL = `${SITE_URL}/terms`;

export const dynamic = "force-static";

const TITLE = "Terms of Use | Northern Lights Tonight";

export const metadata: Metadata = {
  title: TITLE,
  description: copy.seo.terms,
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  openGraph: ogFor("/terms", TITLE, copy.seo.terms),
};

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1>Terms of Use</h1>
      </header>
      <article className={styles.reader}>
        <h2>Terms of use at a glance</h2>
        <p>
          These terms of use govern the public Northern Lights Tonight
          website. By using the site you agree to this page. The forecast is
          a tool, not a guarantee, and not a substitute for your own
          judgment about weather, roads, and safety.
        </p>

        <h2>The forecast is not a guarantee</h2>
        <p>
          GO, MAYBE, and NO are tool judgments about whether tonight is worth
          a look. They are not a promise you will see the aurora, and they are
          not advice to go outside, drive, or travel. UNKNOWN means we are
          not guessing. A viral photo from another county does not override
          the local card.
        </p>
        <p>
          Hours, windows, and obstacle text can change as snapshots refresh.
          Terms of use include that you will not treat a stale screenshot as
          a live reading.
        </p>

        <h2>NOAA</h2>
        <p>
          Northern Lights Tonight is not affiliated with NOAA. Aurora data
          comes from public NOAA Space Weather Prediction Center products.
          Cloud-cover data is adapted from Open-Meteo under CC BY 4.0. We do
          not speak for those agencies, and they do not endorse this site.
        </p>

        <h2>Your use</h2>
        <p>
          Night travel, driving, and time outdoors are at your own risk. Check
          local conditions and use your own judgment. Do not trespass, block
          roads, or treat an unnamed pullout as a recommendation. We do not
          list unverified parking lots.
        </p>
        <p>
          You may not scrape the site in a way that degrades the service,
          misrepresent GO / MAYBE / NO as NOAA products, or copy the
          methodology as if it were a percentage chance. Terms of use allow
          ordinary reading, linking, and personal use of the public pages.
        </p>

        <h2>What the cards are</h2>
        <p>
          GO, MAYBE, NO, and UNKNOWN are labels from a gate order described
          on the methodology page. They apply to a headline point, not to
          every driveway in a state. Hours can change when snapshots
          refresh. A screenshot is not a live reading.
        </p>
        <p>
          Live pins under <code>/view</code> are readings, not extra
          indexed guides. Do not present a pin as an official NOAA product.
          Do not present this site as NOAA.
        </p>

        <h2>Linking and reuse</h2>
        <p>
          Ordinary links to public pages are welcome. Do not scrape in a
          way that knocks the site over. Do not wrap the HTML in a product
          that pretends to be NOAA. Cloud data remains under CC BY 4.0 from
          Open-Meteo; keep that attribution if you republish cloud text we
          adapted.
        </p>
        <p>
          Quotes of a tonight status should include the place name and the
          time you fetched it. Statuses go stale. Misquoting a GO after the
          oval has moved is your problem, not a warranty claim.
        </p>

        <h2>Accounts and money</h2>
        <p>
          v1 has no paid account and no SLA. There is no subscription to
          refund. If that changes, this page will say so. Until then, using
          the public pages is enough to accept these rules.
        </p>

        <h2>Availability and changes</h2>
        <p>
          Snapshots can be missing. The site can be down. We may change copy,
          coverage, or the terms of use on this URL. Continued use after a
          change is acceptance of the updated terms. There is no paid
          account in v1, so there is no paid SLA.
        </p>

        <h2>Safety and outdoors</h2>
        <p>
          Cold, ice, wildlife, rural roads, and other people are outside
          the forecast. A GO is not permission to trespass or to stop in a
          traffic lane. A NO is not a ban on walking your dog. Take lights,
          tell someone where you are going, and leave if the road is bad.
        </p>
        <p>
          We do not staff a hotline. {CONTACT_EMAIL} is for site questions,
          not rescue. If you need emergency help, use local emergency
          services, not this inbox.
        </p>

        <h2>Data freshness</h2>
        <p>
          Snapshots refresh on a schedule described in operations docs, not
          on a promise in this page. UNKNOWN is the honest state when
          sources are missing or too old. Reloading will not create oval
          data NOAA did not publish.
        </p>
        <p>
          Cloud fields can lag. Oval grids can lag. Your clock and the
          place timezone on the card can disagree with a screenshot from
          this morning. Fetch again before you drive.
        </p>

        <h2>Intellectual property</h2>
        <p>
          Site copy, layout, and the GO / MAYBE / NO framing are the
          product’s. NOAA products remain NOAA’s. Open-Meteo cloud
          adaptation remains under CC BY 4.0. Do not remove required
          credit if you quote cloud text.
        </p>
        <p>
          Wordmark and logo are for identifying this site. Do not use them
          to imply NOAA affiliation or a partnership we do not have.
        </p>

        <h2>Governing notes</h2>
        <p>
          The site is operated for a US English audience. If a dispute
          about these pages ever needs a venue, it will be argued from
          that operating fact. We would rather answer email than argue.
        </p>
        <p>
          Nothing on a forecast page is professional advice: not legal,
          not medical, not meteorological beyond the published gates, not
          travel insurance. Read the local weather service for hazards
          other than aurora.
        </p>
        <p>
          Photos you take are yours. Do not send us images of strangers’
          faces and expect us to host them. v1 has no upload form. If you
          email a photo, we may delete it after reading the question.
        </p>
        <p>
          Automated access: keep request volume reasonable. Do not hammer
          <code>/api/</code> routes. Health checks belong on
          <code>/api/health</code> at a human interval, not a tight loop.
          We may rate-limit or block obvious abuse.
        </p>
        <p>
          Third-party sites linked from the footer (Open-Meteo, Creative
          Commons, NOAA) have their own terms. Clicking them leaves this
          product. We are not their support desk.
        </p>
        <p>
          If you reprint a GO / MAYBE / NO, keep the place name, the
          headline point, and the fetch time. Omitting those turns a local
          tool judgment into a fake nationwide claim, which these rules
          do not allow.
        </p>
        <p>
          Use of published terms remains the same for the homepage, the
          guides, and the local pages. Use of published terms remains the
          same if snapshots are UNKNOWN. Use of published terms remains
          the same if you arrived from a ZIP search. No extra contract
          pops up later.
        </p>
        <p>
          Night driving, ice, and trespass stay your risk even when a
          card says GO. A MAYBE is not a dare. A NO is not a ban on
          standing in your own yard. Read the named obstacle before you
          spend fuel.
        </p>
        <p>
          If this URL and a social thread disagree, this URL wins for
          the product. The thread is not a data source and not an
          amendment to these rules.
        </p>

        <h2>Limitation</h2>
        <p>
          To the extent the law allows, Northern Lights Tonight is provided
          as-is. We are not liable for a missed show, a wasted drive, or a
          decision you made from a GO / MAYBE / NO. Terms of use do not
          create a warranty that NOAA data is complete or that our snapshot
          is the newest file on earth.
        </p>
        <p>
          If a court finds one clause unenforceable, the rest of the terms
          of use still apply. These terms are for the public website only.
          They are not a NOAA document.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms of use:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </article>
    </main>
  );
}
