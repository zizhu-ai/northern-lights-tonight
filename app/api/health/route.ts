import { NextResponse } from "next/server";

import { summarizeHealth } from "@/app/api/health/health-status";
import { loadLatestWithMeta } from "@/lib/snapshots";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, source } = await loadLatestWithMeta();
  const { degraded, unknowns, total } = summarizeHealth(source, data.locations);

  return NextResponse.json(
    { source, unknowns, total, generated_at: data.generated_at },
    {
      status: degraded ? 503 : 200,
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    },
  );
}
