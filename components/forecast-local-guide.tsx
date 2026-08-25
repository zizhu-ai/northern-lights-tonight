import type { ForecastDossier } from "@/lib/forecast-places";
import { getHeadlinePoint } from "@/lib/forecast-places";
import { titleCasePhrase } from "@/lib/site";

import styles from "@/app/forecast/[slug]/page.module.css";

export function ForecastLocalGuide({ dossier }: { dossier: ForecastDossier }) {
  const phrase = titleCasePhrase(dossier.primary_keyword);
  const headline = getHeadlinePoint(dossier);
  const zone = dossier.aurora_zone.replaceAll("_", " ");
  const kind = dossier.location_type === "city" ? "city" : "state";
  const points = dossier.sample_points;

  return (
    <section className={styles.section}>
      <h2>{phrase} tonight</h2>
      <p>
        This page is a local tonight reading, not a national Kp
        graphic. The headline uses {headline.name} at magnetic latitude{" "}
        {dossier.magnetic_latitude.toFixed(1)}. Quiet nights are usually a no
        here. Storm nights still fail if clouds, twilight, or skyglow win.
      </p>
      <p>
        Searchers type {phrase} when they want a yes or no for this place
        after dark. A planetary Kp number cannot answer that. Oval reach,
        cloud decks, and darkness change between {headline.name} and a city
        two hours south. We score {dossier.name} as one {kind}, then name
        the obstacle.
      </p>
      <p>
        The call is event-by-event in the Lower 48 and a darkness
        plus weather call in Alaska. This page does not sell tours, list
        unverified parking lots, or invent a showtime for the whole country.
        If the live card says NO, treating a viral map as a better source
        does not help.
      </p>

      <h2>
        How {phrase} is scored
      </h2>
      <p>
        {dossier.name} sits in the {zone} band. Horizon aurora typically
        needs about Kp {dossier.typical_kp_horizon}. Overhead color typically
        needs about Kp {dossier.typical_kp_overhead}. Those bands are
        conservative context. The live oval grid can still outrank them in
        the next 90 minutes.
      </p>
      <p>
        For each 30-minute slot that is dark enough (sun at or below −12°),
        missing aurora data becomes UNKNOWN. No oval reach becomes NO.
        Socked-in clouds become NO. Horizon-only plus city glow cannot be
        GO. Only a clear-enough sky with real reach can be GO. The card
        never prints a fake percent chance.
      </p>
      <p>
        {dossier.short_summer_nights
          ? `Summer nights in ${dossier.name} can stay too bright even when the oval is active. Midnight-sun weeks are a darkness no, not a maybe.`
          : `Summer twilight in ${dossier.name} is shorter than in Alaska, so a strong storm can still be usable if the sky is dark enough and clear.`}{" "}
        Look {dossier.viewing_direction}. A bright south skyline is the wrong
        way to face.
      </p>

      <h2>Light, weather, and {dossier.name}</h2>
      <p>{dossier.light_pollution_note}</p>
      <p>{dossier.leave_city_advice}</p>
      <p>{dossier.local_obstacles}</p>
      {dossier.north_south_split ? (
        <p>{dossier.north_south_split}</p>
      ) : (
        <p>
          {dossier.name} is scored as one {kind}. The headline point and the
          page name are the same place, so there is no separate north-south
          split. Nearby Wave 1 pages are for adjacent searches, not a second
          tonight card for this {kind}.
        </p>
      )}
      <p>{dossier.best_months_note}</p>
      <p>
        People repeat {phrase} as if one county represents the whole {kind}.
        It does not. The card is {headline.name}, not a geographic centroid
        and not the brightest downtown. Other sample points on this page are
        contrast, not extra indexed URLs.
      </p>

      <h2>Sample points for {phrase}</h2>
      <ul className={styles.pointList}>
        {points.map((point) => (
          <li key={point.id}>
            <span>
              {point.name} · {point.role.replaceAll("_", " ")} · mag{" "}
              {point.magnetic_latitude.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
      <p>
        Use {phrase} as the local tool, then read those points as a north to
        south or city to dark-sky split. Driving south into more lights or
        into a mountain wall that blocks {dossier.viewing_direction} is the
        usual way to waste a MAYBE.
      </p>
      <p>
        A phone camera may show a green smear before your eyes do. That is a
        reason to keep looking, not a second forecast. Stay 30–60 minutes if
        the window is open. Five minutes on a porch does not test tonight.
      </p>
      <p>
        Related pages: how we decide GO / MAYBE / NO, best time in the year,
        and how to stand under a dark north sky. Those guides do not replace
        this {dossier.name} tonight card. If you needed a ZIP or another
        city, use near me rather than forcing {headline.name} to speak for
        a different latitude.
      </p>
      <p>
        {phrase} will show many NOs. That is the product working. Mid-latitude
        and cloudy maritime sites are quiet most nights. Oval-under sites
        still lose to twilight and weather. Do not wait for a national
        “tonight is the night” post if this page already named the obstacle.
      </p>

      <h2>How to use this {phrase} card</h2>
      <p>
        Read status first, then the window, then the main issue. GO still
        needs a dark north view and 30–60 minutes. MAYBE is an obstacle
        name, not a coin flip. NO means skip the special trip. UNKNOWN means
        we will not reuse last hour’s color.
      </p>
      <p>
        If the issue is glow, leaving the light dome can help. If the issue
        is clouds, a darker hill under the same deck does not help. If the
        issue is no oval reach, a short drive does not change magnetic
        latitude enough. {phrase} is the filter; it is not a tour desk.
      </p>
      <p>
        Bookmark this URL if {dossier.name} is your usual search. Use near
        me for a ZIP. Use the Alaska page for statewide season and region,
        and Fairbanks for Interior tonight, when those are the two different
        questions. Do not paste a noindex pin into a blog as if it were this
        page.
      </p>
      <p>
        We are not affiliated with NOAA. Cloud data is adapted from
        Open-Meteo. The browser does not call those sources. Stale snapshots
        display UNKNOWN. {phrase} will stay a local go / maybe / no for as
        long as this URL is the indexed answer for {dossier.name}.
      </p>
    </section>
  );
}
