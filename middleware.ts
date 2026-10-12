import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { API_ROBOTS_TAG, productionCanonicalRedirectUrl } from "@/lib/indexing";
import { isIndexNowKeyPath } from "@/lib/indexnow";
import {
  shouldApplyProductionCanonicalRedirect,
  shouldSendPreviewNoindex,
} from "@/lib/runtime-env";

function withPreviewNoindex(response: NextResponse, hostHeader: string | null): NextResponse {
  if (shouldSendPreviewNoindex(hostHeader)) {
    response.headers.set("X-Robots-Tag", API_ROBOTS_TAG);
  }
  return response;
}

export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("host");

  // Key file must stay 200 text/plain; do not canonicalize it to a 308.
  if (isIndexNowKeyPath(request.nextUrl.pathname)) {
    return withPreviewNoindex(NextResponse.next(), hostHeader);
  }

  if (shouldApplyProductionCanonicalRedirect(hostHeader)) {
    const destination = productionCanonicalRedirectUrl(
      hostHeader,
      request.nextUrl.pathname,
      request.nextUrl.search,
    );
    if (destination) {
      return NextResponse.redirect(destination, 308);
    }
  }

  return withPreviewNoindex(NextResponse.next(), hostHeader);
}

export const config = {
  // Literal so Next can statically analyze the matcher at build time.
  matcher: ["/((?!80782f4c69d9488dc026c5d3346d9a88\\.txt).*)"],
};
