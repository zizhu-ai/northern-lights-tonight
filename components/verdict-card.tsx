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
  alaskaKicker?: boolean;
  stale?: boolean;
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
  alaskaKicker = false,
  stale = false,
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
      <p className="verdict-card__human">{humanByStatus[displayStatus]}</p>

      <dl className="verdict-card__meta">
        <div>
          <dt>Best window</dt>
          <dd>{displayWindow}</dd>
        </div>
        <div>
          <dt>Main issue</dt>
          <dd>{displayIssue}</dd>
        </div>
        <div>
          <dt>Look north</dt>
          <dd>{copy.verdict.look_north}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{confidenceCopy[confidence]}</dd>
        </div>
      </dl>

      <div className="verdict-card__footer">
        <p>{updated}</p>
        <ShareButton text={shareText} />
      </div>
    </section>
  );
}
