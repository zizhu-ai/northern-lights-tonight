import Link from "next/link";

import copy from "@/content/ui-copy.json";
import type { PresentedVerdict } from "@/lib/verdict-presentation";

import { ChangePlaceButton, RecheckButton } from "./change-place-button";
import { ShareButton } from "./share-button";

export type VerdictStatus = PresentedVerdict["status"];
export type VerdictConfidence = PresentedVerdict["confidence"];

type VerdictCardProps = {
  presented?: PresentedVerdict;
  status?: VerdictStatus;
  bestWindow?: string;
  mainIssue?: string;
  confidence?: VerdictConfidence;
  updated?: string;
  place?: string;
  lookToward?: string;
  alaskaKicker?: boolean;
  stale?: boolean;
  human?: string;
  sample?: boolean;
  changePlace?: boolean;
  sentinelId?: string;
};

const humanByStatus: Record<VerdictStatus, string> = {
  GO: copy.verdict.go_human,
  MAYBE: copy.verdict.maybe_human,
  NO: copy.verdict.no_human,
  UNKNOWN: copy.verdict.cannot_judge_human,
  UNAVAILABLE: copy.south.human,
};

const confidenceCopy: Record<VerdictConfidence, string> = {
  high: copy.verdict.confidence_high,
  medium: copy.verdict.confidence_medium,
  low: copy.verdict.confidence_low,
};

export function VerdictCard({
  presented,
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
  sample = false,
  changePlace = true,
  sentinelId,
}: VerdictCardProps) {
  const displayStatus = presented?.status ?? (stale ? "UNKNOWN" : (status ?? "UNKNOWN"));
  const displayWindow =
    presented?.bestWindow ??
    (displayStatus === "UNKNOWN" || displayStatus === "UNAVAILABLE"
      ? copy.verdict.unknown_window
      : (bestWindow ?? copy.verdict.window_none));
  const displayIssue =
    presented?.mainIssue ??
    (stale
      ? copy.verdict.stale_main_issue
      : displayStatus === "UNAVAILABLE"
        ? copy.south.main_issue
        : (mainIssue ?? copy.view.data_unavailable_main_issue));
  const displayLook = presented?.lookToward
    ?? (lookToward
      ? lookToward.charAt(0).toUpperCase() + lookToward.slice(1)
      : copy.verdict.look_north);
  const displayConfidence = presented?.confidence ?? confidence ?? "low";
  const displayHuman = presented?.human ?? human ?? humanByStatus[displayStatus];
  const placeLine = presented?.placeLine ?? place ?? "";
  const isSample = presented?.sample ?? sample;
  const validLine = presented?.lastValid ?? presented?.updated ?? updated ?? copy.verdict.updated_unknown;
  const sharePlace = presented?.placeLabel ?? place;
  const shareText = sharePlace
    ? copy.share.template
        .replace("{Place}", sharePlace)
        .replace("{STATUS}", displayStatus)
        .replace("{window}", displayWindow)
    : undefined;

  return (
    <section
      className="verdict-card"
      data-status={displayStatus.toLowerCase()}
      data-sample={isSample ? "true" : undefined}
      id={sentinelId}
    >
      {placeLine ? (
        <div className="verdict-card__place-row">
          <p className="verdict-card__place">
            {isSample ? <span className="verdict-card__sample">{copy.verdict.sample_label}</span> : null}
            <span>{placeLine.replace(/^Sample · /, "")}</span>
          </p>
          {changePlace ? <ChangePlaceButton via="card" /> : null}
        </div>
      ) : alaskaKicker ? (
        <p className="verdict-card__alaska-kicker">{copy.verdict.alaska_kicker}</p>
      ) : null}

      <p className="verdict-card__status">{displayStatus}</p>
      <p className="verdict-card__human">{displayHuman}</p>

      <dl className="verdict-card__meta">
        <div>
          <dt>{copy.verdict.best_window_label}</dt>
          <dd>{displayWindow}</dd>
        </div>
        <div>
          <dt>{copy.verdict.main_issue_label}</dt>
          <dd>{displayIssue}</dd>
        </div>
        <div className="verdict-card__secondary">
          <dt>{copy.verdict.look_toward_label}</dt>
          <dd>{displayLook}</dd>
        </div>
        <div className="verdict-card__secondary">
          <dt>{copy.verdict.confidence_label}</dt>
          <dd>{confidenceCopy[displayConfidence]}</dd>
        </div>
      </dl>

      <div className="verdict-card__footer">
        <p>{validLine}</p>
        <div className="verdict-card__actions">
          {displayStatus === "UNKNOWN" || displayStatus === "UNAVAILABLE" ? (
            <RecheckButton />
          ) : (
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
