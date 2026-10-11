import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { productionCanonicalRedirectUrl } from "@/lib/indexing";
import { isIndexNowKeyPath } from "@/lib/indexnow";

export function middleware(request: NextRequest) {
  // Key file must stay 200 text/plain; do not canonicalize it to a 308.
  if (isIndexNowKeyPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (process.env.VERCEL_ENV !== "production") {
    return NextResponse.next();
  }

  const destination = productionCanonicalRedirectUrl(
    request.headers.get("host"),
    request.nextUrl.pathname,
    request.nextUrl.search,
  );
  if (!destination) {
    return NextResponse.next();
  }

  return NextResponse.redirect(destination, 308);
}

export const config = {
  // Literal so Next can statically analyze the matcher at build time.
  matcher: ["/((?!80782f4c69d9488dc026c5d3346d9a88\\.txt).*)"],
};
