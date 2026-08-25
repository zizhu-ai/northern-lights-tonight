import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { VerdictCard, type VerdictStatus } from "@/components/verdict-card";
import copy from "@/content/ui-copy.json";
import {
  getForecastDossier,
  getHeadlinePoint,
  WAVE_ONE_SLUG_SET,
  type ForecastDossier,
} from "@/lib/forecast-places";
import {
  formatUpdatedAt,
  formatWindow,
  formatZoneAbbreviation,
  loadLatest,
  loadForecastSnapshot,
  type ForecastPoint,
  type ForecastSnapshot,
  type ForecastWindow,
} from "@/lib/snapshots";

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
  status: VerdictStatus;
  mainIssue: string;
  bestWindow: string;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dossier = getForecastDossier(slug);
  if (!dossier) notFound();

  const headlinePoint = getHeadlinePoint(dossier);
  const state = await getForecastState(slug, dossier.timezone);
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
    getForecastState(slug, dossier.timezone),
    loadLatest(),
  ]);
  const timezone = formatZoneAbbreviation(new Date(), dossier.timezone);
  const updated = formatUpdatedAt(
    state.snapshot?.updated_at ?? state.snapshot?.generated_at,
    dossier.timezone,
  );
  const answer = state.snapshot
    ? state.snapshot.answer_sentence
    : unknownAnswer(dossier, headlinePoint.name, state.mainIssue);
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
              {dossier.name} · {timezone}
            </p>
            <h1>{h1For(dossier)}</h1>
            <p className={styles.answer}>{answer}</p>
          </header>
        </div>
      </div>

      <div className={styles.shell}>
        <div className={styles.verdictSlot}>
          <VerdictCard
            status={state.status}
            bestWindow={state.bestWindow}
            mainIssue={state.mainIssue}
            confidence={state.snapshot?.confidence ?? "low"}
            updated={updated}
            place={dossier.name}
            lookToward={state.snapshot?.look_toward ?? dossier.viewing_direction}
            alaskaKicker={slug === "alaska"}
          />
        </div>

        <Hours
          dossier={dossier}
          snapshot={state.snapshot}
          fallback={copy.verdict.hours_need_live}
        />

        <WhyThisVerdict dossier={dossier} state={state} />

        <ForecastLocalGuide dossier={dossier} />

        <section className={styles.section}>
          <h2>What to do</h2>
          <ul className={styles.actionList}>
            <li>{dossier.leave_city_advice}</li>
            <li>Face {state.snapshot?.look_toward ?? dossier.viewing_direction}.</li>
            <li>Give your eyes 30–60 minutes in the dark.</li>
            <li>A phone camera may pick up a faint display before your eyes do.</li>
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

async function getForecastState(
  slug: string,
  timezone: string,
): Promise<ForecastState> {
  const snapshot = await loadForecastSnapshot(slug);
  const mainIssue = snapshot?.main_obstacle_text ?? copy.view.unknown_main_issue;

  return {
    snapshot,
    status: snapshot?.status ?? "UNKNOWN",
    mainIssue,
    bestWindow: snapshot
      ? formatWindow(
          snapshot.best_window_start,
          snapshot.best_window_end,
          timezone,
        )
      : copy.verdict.unknown_window,
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
  const status = state.snapshot?.status ?? "UNKNOWN";
  const obstacle = state.snapshot?.main_obstacle_text ?? state.mainIssue;
  return clampSeoText(
    `${phrase} tonight: ${status} from ${headlinePointName}. Best window ${state.bestWindow}. ${obstacle}`,
    70,
    160,
  );
}

function h1For(dossier: ForecastDossier): string {
  return `Can You See the Northern Lights in ${dossier.name} Tonight?`;
}

function unknownAnswer(
  dossier: ForecastDossier,
  headlinePointName: string,
  mainIssue: string,
): string {
  const place = dossier.location_type === "state"
    ? `${dossier.name} (${headlinePointName} area)`
    : dossier.name === headlinePointName
      ? headlinePointName
      : `${dossier.name} (${headlinePointName})`;
  return `UNKNOWN in ${place}. ${copy.verdict.unknown_human} Best window ${copy.verdict.unknown_window}. Main issue: ${mainIssue}`;
}

function Hours({
  dossier,
  snapshot,
  fallback,
}: {
  dossier: ForecastDossier;
  snapshot: ForecastSnapshot | null;
  fallback: string;
}) {
  const windows = snapshot?.windows ?? [];
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
          <table>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Reading</th>
                <th scope="col">Sky</th>
              </tr>
            </thead>
            <tbody>
              <HourRows windows={visible} timezone={dossier.timezone} />
            </tbody>
          </table>
          {remaining.length > 0 ? (
            <details className={styles.remainingHours}>
              <summary>{copy.chrome.rest_of_night}</summary>
              <table>
                <caption className="visually-hidden">Rest of tonight’s 30-minute readings</caption>
                <tbody>
                  <HourRows windows={remaining} timezone={dossier.timezone} />
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
}: {
  windows: ForecastWindow[];
  timezone: string;
}) {
  return windows.map((window) => {
    const status = window.skip
      ? copy.chrome.skip_not_dark
      : (window.status ?? "UNKNOWN");
    const sky = window.skip ? "—" : displayEnum(window.cloud_block);
    const timeLabel = formatWindow(window.start, window.end, timezone);
    return (
      <tr
        key={`${window.start}-${window.end}`}
        data-status={window.status?.toLowerCase()}
        aria-label={`${timeLabel}, ${status}, ${sky}`}
      >
        <th scope="row">
          <span className="attr-text" data-text={timeLabel} />
        </th>
        <td className={window.skip ? undefined : styles.hourStatus}>
          <span className="attr-text" data-text={status} />
        </td>
        <td>
          <span className="attr-text" data-text={sky} />
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
  if (!state.snapshot) {
    return (
      <section className={styles.section}>
        <h2>Why this verdict</h2>
        <p>Data live → {state.mainIssue}</p>
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
        copy.view.live_disclaimer,
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
          const status = snapshotPoint?.status ?? "UNKNOWN";
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
  const description = state.snapshot
    ? `${state.snapshot.status} for ${dossier.name}, using ${headline}. ${state.snapshot.main_obstacle_text}`
    : `UNKNOWN for ${dossier.name}, using ${headline}. ${state.mainIssue}`;
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
