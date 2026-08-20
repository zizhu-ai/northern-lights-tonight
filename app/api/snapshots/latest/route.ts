import { NextResponse } from "next/server";
import { loadLatest } from "@/lib/snapshots";

export const dynamic = "force-static";

export async function GET() {
  const data = await loadLatest();
  return NextResponse.json(data, {
    headers: { "X-Robots-Tag": "noindex, nofollow" },
  });
}
