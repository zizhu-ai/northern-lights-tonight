import Link from "next/link";

import {
  getForecastDossier,
  WAVE_ONE_SLUGS,
  type ForecastDossier,
} from "@/lib/forecast-places";
import { formatWindow, loadLatest, type SnapshotRow } from "@/lib/snapshots";

import styles from "./tonight-places.module.css";

type TonightPlacesProps = {
  grouped?: boolean;
};

type TonightRow = {
  dossier: ForecastDossier;
  snapshot: SnapshotRow | null;
};

const STATUS_ORDER: SnapshotRow["status"][] = ["GO", "MAYBE", "NO", "UNKNOWN"];

export async function TonightPlaces({ grouped = false }: TonightPlacesProps) {
  const latest = await loadLatest();
  const rows = WAVE_ONE_SLUGS.map((slug): TonightRow | null => {
    const dossier = getForecastDossier(slug);
    if (!dossier) return null;
    return {
      dossier,
      snapshot: latest.locations.find((row) => row.location_slug === slug) ?? null,
    };
  }).filter((row): row is TonightRow => row !== null);

  if (grouped) {
    return (
      <div className={styles.groups}>
        {STATUS_ORDER.map((status) => {
          const group = rows.filter((row) => (row.snapshot?.status ?? "UNKNOWN") === status);
          if (group.length === 0) return null;
          return (
            <section className={styles.group} key={status}>
              <h2>{status}</h2>
              <div className={styles.list}>{group.map(renderRow)}</div>
            </section>
          );
        })}
      </div>
    );
  }

  const sorted = [...rows].sort(
    (a, b) =>
      STATUS_ORDER.indexOf(a.snapshot?.status ?? "UNKNOWN") -
      STATUS_ORDER.indexOf(b.snapshot?.status ?? "UNKNOWN"),
  );

  return <div className={styles.list}>{sorted.map(renderRow)}</div>;
}

function renderRow({ dossier, snapshot }: TonightRow) {
  const status = snapshot?.status ?? "UNKNOWN";
  const window = snapshot
    ? formatWindow(snapshot.best_window_start, snapshot.best_window_end, dossier.timezone)
    : "—";

  return (
    <article className={styles.row} key={dossier.slug}>
      <strong className={styles.status} data-status={status.toLowerCase()}>
        {status}
      </strong>
      <div className={styles.place}>
        <Link href={`/forecast/${dossier.slug}`}>{dossier.name}</Link>
        <span>{snapshot?.headline_point_name ?? dossier.sample_points[0]?.name}</span>
      </div>
      <span className={styles.window}>{window}</span>
    </article>
  );
}
