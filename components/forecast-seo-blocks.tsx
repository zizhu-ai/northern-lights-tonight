import Link from "next/link";

import styles from "@/app/forecast/[slug]/page.module.css";
import { evergreenVisibilityAnswer } from "@/lib/city-faq";
import {
  ovalReachSentence,
  showNorthSouthSplit,
  whatTimeTonightCopy,
} from "@/lib/forecast-copy";
import {
  seoFlag,
  type ForecastDossier,
  type ForecastSamplePoint,
} from "@/lib/forecast-places";
import type { ForecastSnapshot, SnapshotRow } from "@/lib/snapshots";

const NOAA_SWPC_AURORA =
  "https://www.swpc.noaa.gov/products/aurora-30-minute-forecast";

function pointById(
  dossier: ForecastDossier,
  id: string,
): ForecastSamplePoint | undefined {
  return dossier.sample_points.find((point) => point.id === id);
}

function pointStatus(
  snapshot: ForecastSnapshot | null,
  pointId: string,
  cannotJudge: boolean,
): string {
  if (cannotJudge || !snapshot) return "UNKNOWN";
  return snapshot.points.find((point) => point.id === pointId)?.status ?? "UNKNOWN";
}

function magLat(point: ForecastSamplePoint): string {
  return point.magnetic_latitude.toFixed(1);
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
  if (!seoFlag(dossier, "whatTimeTonight")) return null;
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
  if (!seoFlag(dossier, "evergreenBlock")) return null;
  const northPoint = pointById(dossier, "presque-isle");
  const southPoint = pointById(dossier, "portland");
  const north = northPoint ? pointStatus(snapshot, northPoint.id, cannotJudge) : null;
  const south = southPoint ? pointStatus(snapshot, southPoint.id, cannotJudge) : null;
  const showSplit =
    Boolean(northPoint && southPoint) && showNorthSouthSplit(north, south);

  return (
    <section className={styles.section}>
      <h2>Can you see the northern lights in {dossier.name}?</h2>
      <p>{evergreenVisibilityAnswer(dossier, status)}</p>
      {showSplit && northPoint && southPoint ? (
        <p>
          {northPoint.name} sits at magnetic latitude {magLat(northPoint)};{" "}
          {southPoint.name} at {magLat(southPoint)}. The same night can differ:
          tonight {north} in {northPoint.name} and {south} in {southPoint.name}.
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
  if (!seoFlag(dossier, "cityAnchors")) return null;
  if (!dossier.nearby_slugs.includes("chicago")) return null;
  const chicagoStatus = chicago?.status ?? "UNKNOWN";
  return (
    <section className={styles.section}>
      <h2>
        {dossier.cityAnchorsHeading ??
          "Can you see the northern lights in Chicago or Naperville?"}
      </h2>
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

function MaineCityHeading({
  point,
  status,
  blurb,
}: {
  point: ForecastSamplePoint;
  status: string;
  blurb: string;
}) {
  return (
    <>
      <h3>Can you see the northern lights in {point.name}?</h3>
      <p>
        {blurb} (magnetic latitude {magLat(point)}). Tonight: {status}.
      </p>
    </>
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
  if (!seoFlag(dossier, "cityAnchors")) return null;
  const portland = pointById(dossier, "portland");
  const bangor = pointById(dossier, "bangor");
  const aroostook = pointById(dossier, "presque-isle");
  if (!portland || !bangor || !aroostook) return null;
  return (
    <section className={styles.section}>
      <h2>
        {dossier.cityAnchorsHeading ??
          dossier.cityH2Override ??
          "Tonight in Portland, Bangor, and Aroostook"}
      </h2>
      <MaineCityHeading
        point={portland}
        status={pointStatus(snapshot, portland.id, cannotJudge)}
        blurb="Sometimes, on stronger storms — Portland is the bright southern end of Maine"
      />
      <MaineCityHeading
        point={bangor}
        status={pointStatus(snapshot, bangor.id, cannotJudge)}
        blurb="Often the in-state default — Bangor is the headline point"
      />
      <MaineCityHeading
        point={aroostook}
        status={pointStatus(snapshot, aroostook.id, cannotJudge)}
        blurb="Yes more often than the coast — Aroostook (Presque Isle) is the darker, higher-latitude north"
      />
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
  if (!seoFlag(dossier, "predictionBlock")) return null;
  const point = snapshot?.points.find(
    (candidate) => candidate.id === dossier.primary_verdict_point,
  );
  return (
    <section className={styles.section}>
      <h2>Northern lights {dossier.name} prediction</h2>
      <p>
        Our {dossier.name} prediction is the 30-minute table above, recalculated
        from NOAA SWPC data. {ovalReachSentence(headlinePoint, point?.aurora_reach)} See
        the{" "}
        <a href={NOAA_SWPC_AURORA} rel="noopener noreferrer">
          NOAA SWPC aurora forecast
        </a>{" "}
        for how far south the oval extends.
      </p>
    </section>
  );
}
