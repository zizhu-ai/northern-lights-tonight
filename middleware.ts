import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { productionCanonicalRedirectUrl } from "@/lib/indexing";

export function middleware(request: NextRequest) {
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
