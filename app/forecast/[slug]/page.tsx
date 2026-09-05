import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StickyPlaceBar } from "@/components/sticky-place-bar";
import { VerdictCard, type VerdictStatus } from "@/components/verdict-card";
import copy from "@/content/ui-copy.json";
import {
  getForecastDossier,
  getHeadlinePoint,
  WAVE_ONE_SLUGS,
  WAVE_ONE_SLUG_SET,
  type ForecastDossier,
} from "@/lib/forecast-places";
import {
  formatWindow,
  formatZoneAbbreviation,
  loadLatest,
  loadForecastSnapshot,
  type ForecastPoint,
  type ForecastSnapshot,
} from "@/lib/snapshots";
import {
  presentVerdict,
  reasonText,
  type PresentedVerdict,
  type PresentedWindow,
} from "@/lib/verdict-presentation";

import { ForecastLocalGuide } from "@/components/forecast-local-guide";
import { clampSeoText, SITE_URL, titleCasePhrase } from "@/lib/site";

import styles from "./page.module.css";
const REASON_COPY: Record<string, string> = {
  AURORA_NO_REACH: "Aurora activity is not expected to reach {place} tonight.",
  AURORA_HORIZON_ONLY: "Any display would likely stay low on the northern horizon.",
  AURORA_OVERHEAD: "Aurora may reach overhead or high in the northern sky.",
  CLOUD_BLOCKED: "Cloud cover is likely to block the sky for the rest of the night.",
  CLOUD_MIXED: "Clouds are the main uncertainty.",
  NEVER_DARK: "The sky will not get dark enough tonight.",
  NOT_DARK_YET: "It is not dark yet; the viewing window starts later.",
  MOON_BRIGHT: "Bright moonlight will wash out fainter aurora.",
  LIGHT_POLLUTION: "City skyglow will hide a weak display; leaving town helps.",
  FORECAST_FAR: "Later hours rely on a coarser forecast, not the live oval.",
  DATA_MISSING_AURORA: "Aurora data is unavailable, so we are not guessing.",
  DATA_MISSING_WEATHER: "Cloud data is missing; activity may still be in range.",
  DATA_STALE: "Source data is too old to treat as live.",
  SIGNALS_CONFLICT: "Short-term and overnight signals disagree.",
  NONE: "Conditions line up well enough to try.",
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

type ForecastState = {
  snapshot: ForecastSnapshot | null;
  presented: PresentedVerdict;
  status: VerdictStatus;
  mainIssue: string;
  bestWindow: string;
};

export const revalidate = 600;
export const maxDuration = 60;

export function generateStaticParams() {
  return WAVE_ONE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dossier = getForecastDossier(slug);
  if (!dossier) notFound();

  const headlinePoint = getHeadlinePoint(dossier);
  const state = await getForecastState(dossier);
  const title = titleFor(dossier);
  const description = seoDescription(dossier, headlinePoint.name, state);
  const url = `${SITE_URL}/forecast/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      images: ["/opengraph-image.png"],
    },
  };
}

export default async function ForecastPage({ params }: PageProps) {
  const { slug } = await params;
  const dossier = getForecastDossier(slug);
  if (!dossier) notFound();

  const headlinePoint = getHeadlinePoint(dossier);
  const [state, latest] = await Promise.all([
    getForecastState(dossier),
    loadLatest(),
  ]);
  const timezone = formatZoneAbbreviation(new Date(), dossier.timezone);
  const answer = state.presented.answerSentence;
  const nearby = dossier.nearby_slugs
    .filter((nearbySlug) => WAVE_ONE_SLUG_SET.has(nearbySlug))
    .map((nearbySlug) => getForecastDossier(nearbySlug))
    .filter((place): place is ForecastDossier => place !== null);
  const schemas = buildSchemas(dossier, titleFor(dossier), state);

  return (
    <main
      className={styles.page}
      data-snapshot-revision={latest.freshness?.revision ?? "unavailable"}
      data-snapshot-checked-at={latest.freshness?.checked_at ?? "unavailable"}
    >
      <div className={`twilight-band ${styles.twilight}`}>
        <div className={styles.inner}>
          <header className={styles.hero}>
            <p className={styles.kicker}>
              {state.presented.placeLine} · {timezone}
            </p>
            <h1>{h1For(dossier)}</h1>
            <p className={styles.answer}>{answer}</p>
          </header>
        </div>
      </div>

      <div className={styles.shell}>
        <div className={styles.verdictSlot}>
          <VerdictCard
            presented={state.presented}
            alaskaKicker={slug === "alaska"}
            sentinelId="forecast-verdict"
          />
          <StickyPlaceBar
            placeLine={state.presented.placeLine}
            sentinelId="forecast-verdict"
          />
        </div>

        <Hours
          dossier={dossier}
          windows={state.presented.windows}
          cannotJudge={state.presented.cannotJudge}
          fallback={copy.verdict.hours_need_live}
        />

        <WhyThisVerdict dossier={dossier} state={state} />

        <ForecastLocalGuide dossier={dossier} />

        <section className={styles.section}>
          <h2>What to do</h2>
          <ul className={styles.actionList}>
            <li>{dossier.leave_city_advice}</li>
            <li>Face {state.snapshot?.look_toward ?? dossier.viewing_direction}.</li>
          </ul>
        </section>

        {dossier.page_template === "travel_plus_tonight" ? (
          <section className={styles.section}>
            <h2>When to come</h2>
            <p>{dossier.best_months_note}</p>
          </section>
        ) : null}

        {dossier.location_type === "state" ? (
          <OtherPoints dossier={dossier} state={state} />
        ) : null}

        {dossier.location_type === "state" && dossier.north_south_split ? (
          <section className={styles.section}>
            <h2>
              {dossier.page_template === "travel_plus_tonight"
                ? "Which part of Alaska"
                : "In this state"}
            </h2>
            <p>{dossier.north_south_split}</p>
          </section>
        ) : null}

        <section className={`${styles.section} ${styles.nearby}`}>
          <h2>Nearby</h2>
          <ul className={styles.linkList}>
            {nearby.map((place) => (
              <li key={place.slug}>
                <Link href={`/forecast/${place.slug}`}>{place.name} tonight</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Local FAQ</h2>
          <div className={styles.faqs}>
            {dossier.local_faqs.map((faq) => (
              <details key={faq.q}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Plan a better aurora night</h2>
          <ul className={styles.guideLinks}>
            <li>
              <Link href="/guides/best-time-to-see-northern-lights">
                Best time to see the northern lights
              </Link>
            </li>
            <li>
              <Link href="/guides/how-to-see-northern-lights">
                How to see the northern lights
              </Link>
            </li>
          </ul>
        </section>
      </div>

      <JsonLd value={schemas} />
    </main>
  );
}

async function getForecastState(dossier: ForecastDossier): Promise<ForecastState> {
  const snapshot = await loadForecastSnapshot(dossier.slug);
  const presented = presentVerdict({ snapshot, dossier });

  return {
    snapshot,
    presented,
    status: presented.status,
    mainIssue: presented.mainIssue,
    bestWindow: presented.bestWindow,
  };
}

function titleFor(dossier: ForecastDossier): string {
  if (dossier.slug === "alaska") {
    return "Northern Lights in Alaska: Best Places, Season & Tonight";
  }
  const full = `Northern Lights in ${dossier.name} Tonight: Visibility & Best Time`;
  if (full.length <= 60) return full;
  const shorter = `Northern Lights in ${dossier.name} Tonight`;
  if (shorter.length <= 60) return shorter;
  return clampSeoText(`Northern Lights ${dossier.name} Tonight`, 15, 60);
}

function seoDescription(
  dossier: ForecastDossier,
  headlinePointName: string,
  state: ForecastState,
): string {
  const phrase = titleCasePhrase(dossier.primary_keyword);
  const status = state.presented.status;
  const obstacle = state.presented.mainIssue;
  return clampSeoText(
    `${phrase} tonight: ${status} from ${headlinePointName}. Best window ${state.bestWindow}. ${obstacle}`,
    70,
    160,
  );
}

function h1For(dossier: ForecastDossier): string {
  return `Can You See the Northern Lights in ${dossier.name} Tonight?`;
}

function Hours({
  dossier,
  windows,
  cannotJudge,
  fallback,
}: {
  dossier: ForecastDossier;
  windows: PresentedWindow[];
  cannotJudge: boolean;
  fallback: string;
}) {
  const visible = windows.slice(0, 5);
  const remaining = windows.slice(5);
  const timezone = formatZoneAbbreviation(new Date(), dossier.timezone);

  return (
    <section className={`${styles.section} ${styles.hours}`}>
      <h2>Tonight’s hours ({timezone})</h2>
      {windows.length === 0 ? (
        <p>{fallback}</p>
      ) : (
        <>
          {cannotJudge ? <p className={styles.hoursNote}>{fallback}</p> : null}
          <table>
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col">Reading</th>
                <th scope="col" className={styles.skyCol}>Sky</th>
              </tr>
            </thead>
            <tbody>
              <HourRows windows={visible} timezone={dossier.timezone} place={dossier.name} />
            </tbody>
          </table>
          {remaining.length > 0 ? (
            <details className={styles.remainingHours}>
              <summary>{copy.chrome.rest_of_night}</summary>
              <table>
                <caption className="visually-hidden">Rest of tonight’s 30-minute readings</caption>
                <tbody>
                  <HourRows windows={remaining} timezone={dossier.timezone} place={dossier.name} />
                </tbody>
              </table>
            </details>
          ) : null}
        </>
      )}
    </section>
  );
}

function HourRows({
  windows,
  timezone,
  place,
}: {
  windows: PresentedWindow[];
  timezone: string;
  place: string;
}) {
  return windows.map((window) => {
    const status = window.displayStatus;
    const sky = window.skip ? "—" : displayEnum(window.cloud_block);
    const timeLabel = formatWindow(window.start, window.end, timezone);
    const reason = window.reason || reasonText(window.codes[0], place);
    return (
      <tr
        key={`${window.start}-${window.end}`}
        data-status={window.skip ? "skip" : (window.status ?? "unknown").toLowerCase()}
        aria-label={`${timeLabel}, ${status}, ${reason || sky}`}
      >
        <th scope="row">
          <span>{timeLabel}</span>
        </th>
        <td className={styles.hourCell}>
          <span className={window.skip ? undefined : styles.hourStatus}>{status}</span>
          {reason ? <span className={styles.hourReason}>{reason}</span> : null}
        </td>
        <td className={styles.skyCol}>
          <span>{sky}</span>
        </td>
      </tr>
    );
  });
}

function WhyThisVerdict({
  dossier,
  state,
}: {
  dossier: ForecastDossier;
  state: ForecastState;
}) {
  if (!state.snapshot || state.presented.cannotJudge) {
    return (
      <section className={styles.section}>
        <h2>Why this verdict</h2>
        <p>{state.presented.mainIssue}</p>
        {state.presented.lastValid ? <p>{state.presented.lastValid}</p> : null}
      </section>
    );
  }

  const point = state.snapshot
    ? state.snapshot.points.find((candidate) => candidate.id === dossier.primary_verdict_point) ?? null
    : null;
  const codes = state.snapshot ? state.snapshot.reason_codes : [];

  const reasons = [
    {
      label: "Aurora reach",
      value:
        reasonFrom(codes, ["AURORA_NO_REACH", "AURORA_HORIZON_ONLY", "AURORA_OVERHEAD"], dossier.name) ??
        displayEnum(point?.aurora_reach),
    },
    {
      label: "Clouds",
      value:
        reasonFrom(codes, ["CLOUD_BLOCKED", "CLOUD_MIXED", "DATA_MISSING_WEATHER"], dossier.name) ??
        displayEnum(point?.cloud_block),
    },
    {
      label: "Darkness",
      value: reasonFrom(codes, ["NEVER_DARK", "NOT_DARK_YET"], dossier.name) ?? "—",
    },
    {
      label: "Moon",
      value: reasonFrom(codes, ["MOON_BRIGHT"], dossier.name) ?? "—",
    },
    {
      label: "City glow",
      value: reasonFrom(codes, ["LIGHT_POLLUTION"], dossier.name) ?? dossier.light_pollution_note,
    },
    {
      label: "Data live",
      value:
        reasonFrom(codes, ["DATA_MISSING_AURORA", "FORECAST_FAR", "SIGNALS_CONFLICT"], dossier.name) ??
        copy.view.forecast_live_disclaimer,
    },
  ];

  return (
    <section className={styles.section}>
      <h2>Why this verdict</h2>
      <dl className={styles.reasonGrid}>
        {reasons.map((reason) => (
          <div key={reason.label}>
            <dt>{reason.label}</dt>
            <dd>{reason.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function OtherPoints({
  dossier,
  state,
}: {
  dossier: ForecastDossier;
  state: ForecastState;
}) {
  const snapshotById = new Map(
    (state.snapshot?.points ?? []).map((point) => [point.id, point]),
  );
  const points = dossier.sample_points.filter(
    (point) => point.id !== dossier.primary_verdict_point,
  );

  return (
    <section className={styles.section}>
      <h2>Other points in {dossier.name}</h2>
      <ul className={styles.pointList}>
        {points.map((point) => {
          const snapshotPoint: ForecastPoint | undefined = snapshotById.get(point.id);
          const status = state.presented.cannotJudge
            ? "UNKNOWN"
            : (snapshotPoint?.status ?? "UNKNOWN");
          return (
            <li key={point.id}>
              <span>{point.name}</span>
              <strong data-status={status.toLowerCase()}>{status}</strong>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function reasonFrom(
  codes: string[],
  candidates: string[],
  place: string,
): string | null {
  const code = candidates.find((candidate) => codes.includes(candidate));
  return code ? REASON_COPY[code]?.replace("{place}", place) ?? null : null;
}

function displayEnum(value: string | null | undefined): string {
  if (!value) return "—";
  const words = value.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function buildSchemas(
  dossier: ForecastDossier,
  title: string,
  state: ForecastState,
) {
  const url = `${SITE_URL}/forecast/${dossier.slug}`;
  const headline = getHeadlinePoint(dossier).name;
  const description = `${state.presented.status} for ${dossier.name}, using ${headline}. ${state.presented.mainIssue}`;
  const breadcrumbId = `${url}#breadcrumb`;
  const faqId = `${url}#faq`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: title,
        description,
        breadcrumb: { "@id": breadcrumbId },
        mainEntity: { "@id": faqId },
      },
      {
        "@type": "FAQPage",
        "@id": faqId,
        mainEntity: dossier.local_faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Tonight",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: dossier.name,
            item: url,
          },
        ],
      },
    ],
  };
}

function JsonLd({ value }: { value: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(value).replaceAll("<", "\\u003c"),
      }}
    />
  );
}
