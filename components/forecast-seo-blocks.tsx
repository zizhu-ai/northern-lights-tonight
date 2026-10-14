import Link from "next/link";

import styles from "@/app/forecast/[slug]/page.module.css";
import { evergreenVisibilityAnswer } from "@/lib/city-faq";
import { whatTimeTonightCopy } from "@/lib/forecast-copy";
import type { ForecastDossier } from "@/lib/forecast-places";
import type { ForecastPoint, ForecastSnapshot, SnapshotRow } from "@/lib/snapshots";

const NOAA_SWPC_AURORA =
  "https://www.swpc.noaa.gov/products/aurora-30-minute-forecast";

function displayReach(value: string | null | undefined): string {
  if (!value) return "unknown in the current snapshot";
  return value.replaceAll("_", " ");
}

function pointStatus(
  snapshot: ForecastSnapshot | null,
  pointId: string,
  cannotJudge: boolean,
): string {
  if (cannotJudge || !snapshot) return "UNKNOWN";
  return snapshot.points.find((point) => point.id === pointId)?.status ?? "UNKNOWN";
}

export function TopToolEntry({ enabled }: { enabled?: boolean }) {
  if (!enabled) return null;
  return (
    <p>
      Check your exact town → <Link href="/near-me">Change place / Near me</Link>
    </p>
  );
}

export function WhatTimeTonight({
  dossier,
  status,
  bestWindow,
  windows,
}: {
  dossier: ForecastDossier;
  status: string;
  bestWindow: string;
  windows: Array<{ start: string; end: string; skip: boolean }>;
}) {
  if (dossier.slug !== "illinois" && dossier.slug !== "maine") return null;
  return (
    <section className={styles.section}>
      <h2>What time can you see the northern lights in {dossier.name} tonight?</h2>
      <p>{whatTimeTonightCopy(dossier, { status, bestWindow, windows })}</p>
    </section>
  );
}

export function EvergreenVisibility({
  dossier,
  status,
  snapshot,
  cannotJudge,
}: {
  dossier: ForecastDossier;
  status: string;
  snapshot: ForecastSnapshot | null;
  cannotJudge: boolean;
}) {
  if (dossier.slug !== "illinois" && dossier.slug !== "maine") return null;
  const north = pointStatus(snapshot, "presque-isle", cannotJudge);
  const south = pointStatus(snapshot, "portland", cannotJudge);
  return (
    <section className={styles.section}>
      <h2>Can you see the northern lights in {dossier.name}?</h2>
      <p>{evergreenVisibilityAnswer(dossier, status)}</p>
      {dossier.slug === "maine" ? (
        <p>
          Presque Isle sits at magnetic latitude 56.0; Portland at 53.0. The same
          night can differ: tonight {north} in Aroostook (Presque Isle) and {south}{" "}
          in Portland.
        </p>
      ) : null}
      <p>
        <a href="#verdict">Back to tonight’s verdict</a>
      </p>
    </section>
  );
}

export function IllinoisCityAnchors({
  dossier,
  chicago,
}: {
  dossier: ForecastDossier;
  chicago: SnapshotRow | null;
}) {
  if (dossier.slug !== "illinois") return null;
  const chicagoStatus = chicago?.status ?? "UNKNOWN";
  return (
    <section className={styles.section}>
      <h3>Can you see the northern lights in Chicago?</h3>
      <p>
        Rarely from the city itself: Chicago’s skyglow hides all but strong
        displays, so drive north or west out of the metro. Tonight in Chicago:{" "}
        {chicagoStatus}.{" "}
        <Link href="/forecast/chicago">Chicago northern lights tonight</Link>
      </p>
      <h3>Northern lights tonight in Naperville</h3>
      <p>
        Naperville sits inside the Chicago glow, so treat it like Chicago: use{" "}
        <Link href="/near-me">Change place</Link> for a pin-level reading tonight.
        Head toward darker northern Illinois for a better chance.
      </p>
    </section>
  );
}

export function MaineCityAnchors({
  dossier,
  snapshot,
  cannotJudge,
}: {
  dossier: ForecastDossier;
  snapshot: ForecastSnapshot | null;
  cannotJudge: boolean;
}) {
  if (dossier.slug !== "maine") return null;
  return (
    <section className={styles.section}>
      <h3>Can you see the northern lights in Portland?</h3>
      <p>
        Sometimes, on stronger storms — Portland is the bright southern end of
        Maine (magnetic latitude 53.0). Tonight:{" "}
        {pointStatus(snapshot, "portland", cannotJudge)}.
      </p>
      <h3>Can you see the northern lights in Bangor?</h3>
      <p>
        Often the in-state default — Bangor is the headline point (magnetic
        latitude 54.1). Tonight: {pointStatus(snapshot, "bangor", cannotJudge)}.
      </p>
      <h3>Can you see the northern lights in Aroostook (Presque Isle)?</h3>
      <p>
        Yes more often than the coast — Aroostook (Presque Isle) is the darker,
        higher-latitude north (magnetic latitude 56.0). Tonight:{" "}
        {pointStatus(snapshot, "presque-isle", cannotJudge)}.
      </p>
    </section>
  );
}

export function IllinoisPrediction({
  dossier,
  headlinePoint,
  snapshot,
}: {
  dossier: ForecastDossier;
  headlinePoint: string;
  snapshot: ForecastSnapshot | null;
}) {
  if (dossier.slug !== "illinois") return null;
  const point: ForecastPoint | undefined = snapshot?.points.find(
    (candidate) => candidate.id === dossier.primary_verdict_point,
  );
  const reach = displayReach(point?.aurora_reach);
  return (
    <section className={styles.section}>
      <h2>Northern lights Illinois prediction</h2>
      <p>
        Our Illinois prediction is the 30-minute table above, recalculated from
        NOAA SWPC data. Tonight’s oval reach at {headlinePoint} is {reach}. See
        the{" "}
        <a href={NOAA_SWPC_AURORA} rel="noopener noreferrer">
          NOAA SWPC aurora forecast
        </a>{" "}
        for how far south the oval extends.
      </p>
    </section>
  );
}
