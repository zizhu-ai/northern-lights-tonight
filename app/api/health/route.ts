import { NextResponse } from "next/server";
import { assessHealth } from "@/lib/health";
import { loadLatestWithMeta } from "@/lib/snapshots";

export async function GET() {
  const { data, source } = await loadLatestWithMeta();
  const { body, status } = assessHealth(data, source);
  return NextResponse.json(body, {
    status,
    headers: { "X-Robots-Tag": "noindex, nofollow" },
  });
}
