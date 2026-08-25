import { NextResponse } from "next/server";

import {
  isPreviewEnvironment,
  runPreviewBlobDiagnostic,
} from "@/lib/preview-blob-diagnostic";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function POST() {
  if (!isPreviewEnvironment(process.env)) {
    return new NextResponse(null, { status: 404, headers });
  }

  const result = await runPreviewBlobDiagnostic(process.env);
  return NextResponse.json(result.body, {
    status: result.status,
    headers,
  });
}
