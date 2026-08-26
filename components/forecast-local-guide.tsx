import Link from "next/link";

import type { ForecastDossier } from "@/lib/forecast-places";
import { getHeadlinePoint } from "@/lib/forecast-places";
import { titleCasePhrase } from "@/lib/site";

import styles from "@/app/forecast/[slug]/page.module.css";

export function ForecastLocalGuide({ dossier }: { dossier: ForecastDossier }) {
  const phrase = titleCasePhrase(dossier.primary_keyword);
  const headline = getHeadlinePoint(dossier);
  const zone = dossier.aurora_zone.replaceAll("_", " ");

  return (
    <section className={styles.section}>
      <h2>{phrase} tonight</h2>
      <p>
        The headline point is {headline.name} at magnetic latitude{" "}
        {dossier.magnetic_latitude.toFixed(1)}. {dossier.name} sits in the{" "}
        {zone} band. Horizon aurora typically needs about Kp{" "}
        {dossier.typical_kp_horizon}. Overhead color typically needs about Kp{" "}
        {dossier.typical_kp_overhead}. Look {dossier.viewing_direction}.
      </p>
      <p>
        {dossier.short_summer_nights
          ? `Summer nights in ${dossier.name} can stay too bright even when the oval is active. Midnight-sun weeks are a darkness no, not a maybe.`
          : `Summer twilight in ${dossier.name} is shorter than in Alaska, so a strong storm can still be usable if the sky is dark enough and clear.`}
      </p>

      <h2>Light, weather, and {dossier.name}</h2>
      <p>{dossier.light_pollution_note}</p>
      <p>{dossier.leave_city_advice}</p>
      <p>{dossier.local_obstacles}</p>
      {dossier.north_south_split ? <p>{dossier.north_south_split}</p> : null}
      <p>{dossier.best_months_note}</p>

      <h2>Sample points for {phrase}</h2>
      <ul className={styles.pointList}>
        {dossier.sample_points.map((point) => (
          <li key={point.id}>
            <span>
              {point.name} · {point.role.replaceAll("_", " ")} · mag{" "}
              {point.magnetic_latitude.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
      <p>
        The shared darkness, aurora-reach, cloud, glow, moon, freshness, and
        status gates are documented in{" "}
        <Link href="/methodology">how we decide</Link>. This page applies them
        to {headline.name} and keeps the local facts above.
      </p>
    </section>
  );
}
