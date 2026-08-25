import { NextResponse } from "next/server";
import { assessHealth } from "@/lib/health";
import { loadLatestWithMeta } from "@/lib/snapshots";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

export async function GET() {
  const { data, source } = await loadLatestWithMeta();
  const { body, status } = assessHealth({ ...data, source }, new Date());
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
