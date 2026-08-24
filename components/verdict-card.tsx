import Link from "next/link";

import copy from "@/content/ui-copy.json";

import { ShareButton } from "./share-button";

export type VerdictStatus = "GO" | "MAYBE" | "NO" | "UNKNOWN" | "UNAVAILABLE";
export type VerdictConfidence = "high" | "medium" | "low";

type VerdictCardProps = {
  status: VerdictStatus;
  bestWindow?: string;
  mainIssue?: string;
  confidence: VerdictConfidence;
  updated: string;
  place?: string;
  lookToward?: string;
  alaskaKicker?: boolean;
  stale?: boolean;
  human?: string;
};

const humanByStatus: Record<VerdictStatus, string> = {
  GO: copy.verdict.go_human,
  MAYBE: copy.verdict.maybe_human,
  NO: copy.verdict.no_human,
  UNKNOWN: copy.verdict.unknown_human,
  UNAVAILABLE: copy.south.human,
};

const confidenceCopy: Record<VerdictConfidence, string> = {
  high: copy.verdict.confidence_high,
  medium: copy.verdict.confidence_medium,
  low: copy.verdict.confidence_low,
};

export function VerdictCard({
  status,
  bestWindow,
  mainIssue,
  confidence,
  updated,
  place,
  lookToward,
  alaskaKicker = false,
  stale = false,
  human,
}: VerdictCardProps) {
  const displayStatus = stale ? "UNKNOWN" : status;
  const displayWindow =
    displayStatus === "UNKNOWN" || displayStatus === "UNAVAILABLE"
      ? copy.verdict.unknown_window
      : (bestWindow ?? copy.verdict.window_none);
  const displayIssue = stale
    ? copy.verdict.stale_main_issue
    : displayStatus === "UNAVAILABLE"
      ? copy.south.main_issue
      : (mainIssue ?? copy.view.unknown_main_issue);
  const displayLook = lookToward
    ? lookToward.charAt(0).toUpperCase() + lookToward.slice(1)
    : copy.verdict.look_north;
  const shareText = place
    ? copy.share.template
        .replace("{Place}", place)
        .replace("{STATUS}", displayStatus)
        .replace("{window}", displayWindow)
    : undefined;

  return (
    <section className="verdict-card" data-status={displayStatus.toLowerCase()}>
      <p className="verdict-card__status">{displayStatus}</p>
      {alaskaKicker ? (
        <p className="verdict-card__alaska-kicker">{copy.verdict.alaska_kicker}</p>
      ) : null}
      <p className="verdict-card__human">{human ?? humanByStatus[displayStatus]}</p>

      <dl className="verdict-card__meta">
        <div>
          <dt>{copy.verdict.best_window_label}</dt>
          <dd>{displayWindow}</dd>
        </div>
        <div>
          <dt>{copy.verdict.main_issue_label}</dt>
          <dd>{displayIssue}</dd>
        </div>
        <div>
          <dt>{copy.verdict.look_toward_label}</dt>
          <dd>{displayLook}</dd>
        </div>
        <div>
          <dt>{copy.verdict.confidence_label}</dt>
          <dd>{confidenceCopy[confidence]}</dd>
        </div>
      </dl>

      <div className="verdict-card__footer">
        <p>{updated}</p>
        <div className="verdict-card__actions">
          {displayStatus === "UNKNOWN" || displayStatus === "UNAVAILABLE" ? null : (
            <ShareButton text={shareText} />
          )}
        </div>
      </div>
      {displayStatus === "UNKNOWN" ? (
        <p className="verdict-card__note">
          {copy.verdict.auto_refresh}{" "}
          <Link href="/methodology">{copy.chrome.footer_how}</Link>
        </p>
      ) : null}
    </section>
  );
}
