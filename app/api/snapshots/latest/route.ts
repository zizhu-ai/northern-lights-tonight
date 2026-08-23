import { NextResponse } from "next/server";
import { loadLatestWithMeta } from "@/lib/snapshots";

export const revalidate = 120;

export async function GET() {
  const { data, source } = await loadLatestWithMeta();
  return NextResponse.json(data, {
    headers: {
      "X-Robots-Tag": "noindex, nofollow",
      "X-Snapshot-Source": source,
      "X-Snapshot-Generated-At": data.generated_at,
    },
  });
}
