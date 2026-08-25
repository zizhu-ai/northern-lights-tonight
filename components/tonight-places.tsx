import Link from "next/link";

import {
  getForecastDossier,
  WAVE_ONE_SLUGS,
  type ForecastDossier,
} from "@/lib/forecast-places";
import {
  formatWindow,
  loadLatest,
  type SnapshotRow,
} from "@/lib/snapshots";

import styles from "./tonight-places.module.css";

type TonightPlacesProps = {
  grouped?: boolean;
};

export type TonightRow = {
  dossier: ForecastDossier;
  snapshot: SnapshotRow | null;
};

const STATUS_ORDER: SnapshotRow["status"][] = ["GO", "MAYBE", "NO", "UNKNOWN"];

export async function loadTonightRows(): Promise<TonightRow[]> {
  const latest = await loadLatest();
  return WAVE_ONE_SLUGS.map((slug): TonightRow | null => {
    const dossier = getForecastDossier(slug);
    if (!dossier) return null;
    return {
      dossier,
      snapshot: latest.locations.find((row) => row.location_slug === slug) ?? null,
    };
  }).filter((row): row is TonightRow => row !== null);
}

export function displayTonightStatus(snapshot: SnapshotRow | null): SnapshotRow["status"] {
  return snapshot?.status ?? "UNKNOWN";
}

export function isSiteReadingsPaused(rows: TonightRow[]): boolean {
  if (rows.length === 0) return true;
  return rows.every((row) => displayTonightStatus(row.snapshot) === "UNKNOWN");
}

export async function TonightPlaces({ grouped = false }: TonightPlacesProps) {
  const rows = await loadTonightRows();

  if (grouped) {
    return (
      <div className={styles.groups}>
        {STATUS_ORDER.map((status) => {
          const group = rows.filter((row) => displayTonightStatus(row.snapshot) === status);
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
      STATUS_ORDER.indexOf(displayTonightStatus(a.snapshot)) -
      STATUS_ORDER.indexOf(displayTonightStatus(b.snapshot)),
  );

  return <div className={styles.list}>{sorted.map(renderRow)}</div>;
}

function renderRow({ dossier, snapshot }: TonightRow) {
  const status = displayTonightStatus(snapshot);
  const window =
    snapshot
      ? formatWindow(snapshot.best_window_start, snapshot.best_window_end, dossier.timezone)
      : "";
  const pointName = snapshot?.headline_point_name ?? dossier.sample_points[0]?.name;
  const showPoint = Boolean(pointName && pointName !== dossier.name);

  return (
    <Link className={styles.row} href={`/forecast/${dossier.slug}`} key={dossier.slug}>
      <strong
        className={styles.status}
        data-status={status.toLowerCase()}
        data-text={status}
        aria-label={status}
      />
      <div className={styles.place}>
        <span className={styles.placeName}>{dossier.name}</span>
        {showPoint ? <span className={styles.placeMeta}>{pointName}</span> : null}
      </div>
      {window ? (
        <span
          className={styles.window}
          data-text={window}
          aria-label={window}
        />
      ) : null}
    </Link>
  );
}
