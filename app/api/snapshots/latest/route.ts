import { NextResponse } from "next/server";
import { loadLatestWithMeta } from "@/lib/snapshots";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

function fetchedAtHeader(observation: {
  fetched_at: string | null;
  health: string;
}): string {
  // Spec §7.4: health=invalid 时 Fetched-At 必须为空。
  if (observation.health === "invalid") return "";
  return observation.fetched_at ?? "";
}

export async function GET() {
  const { data, source } = await loadLatestWithMeta();
  const observations = data.source_observations;
  return NextResponse.json(data, {
    headers: {
      "X-Robots-Tag": "noindex, nofollow",
      "X-Snapshot-Source": source,
      "X-Snapshot-Generated-At": data.generated_at,
      "X-Snapshot-Revision": data.freshness?.revision ?? "unavailable",
      "X-Snapshot-Checked-At": data.freshness?.checked_at ?? "unavailable",
      "X-Snapshot-Last-Success-At": data.freshness?.last_success_at ?? "unavailable",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Aurora-Fallback-Used": String(data.fallback_used),
      "X-Ovation-Fetched-At": fetchedAtHeader(observations.ovation),
      "X-Kp-Fetched-At": fetchedAtHeader(observations.kp),
      "X-Cloud-Fetched-At": fetchedAtHeader(observations.cloud),
      "X-Ovation-Health": observations.ovation.health,
      "X-Kp-Health": observations.kp.health,
      "X-Cloud-Health": observations.cloud.health,
    },
  });
}
