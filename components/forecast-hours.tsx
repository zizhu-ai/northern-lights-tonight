import copy from "@/content/ui-copy.json";
import { formatWindow, formatZoneAbbreviation } from "@/lib/snapshots";
import type { PresentedWindow } from "@/lib/verdict-presentation";

import styles from "./forecast-hours.module.css";

function displayEnum(value: string | null | undefined): string {
  if (!value) return "—";
  const words = value.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function HourRows({
  windows,
  timezone,
}: {
  windows: PresentedWindow[];
  timezone: string;
}) {
  return windows.map((window) => {
    const status = window.displayStatus;
    const sky = window.skip ? "—" : displayEnum(window.cloud_block);
    const timeLabel = formatWindow(window.start, window.end, timezone);
    const reason = window.reason;
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

export function ForecastHours({
  timezoneName,
  heading,
  windows,
  cannotJudge,
  fallback,
}: {
  timezoneName: string;
  heading?: string;
  windows: PresentedWindow[];
  cannotJudge: boolean;
  fallback: string;
}) {
  const visible = windows.slice(0, 5);
  const remaining = windows.slice(5);
  const timezone = formatZoneAbbreviation(new Date(), timezoneName);

  return (
    <section className={styles.hours}>
      <h2>{heading ?? `Tonight’s hours (${timezone})`}</h2>
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
              <HourRows windows={visible} timezone={timezoneName} />
            </tbody>
          </table>
          {remaining.length > 0 ? (
            <details className={styles.remainingHours}>
              <summary>{copy.chrome.rest_of_night}</summary>
              <table>
                <caption className="visually-hidden">Rest of tonight’s 30-minute readings</caption>
                <tbody>
                  <HourRows windows={remaining} timezone={timezoneName} />
                </tbody>
              </table>
            </details>
          ) : null}
        </>
      )}
    </section>
  );
}
