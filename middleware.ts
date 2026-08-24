import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PRIMARY_HOST = "aurora-tonight.com";
const WWW_HOST = "www.aurora-tonight.com";

export function middleware(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "production") {
    return NextResponse.next();
  }

  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (host === PRIMARY_HOST || host === WWW_HOST) {
    return NextResponse.next();
  }

  const destination = new URL(
    `https://${PRIMARY_HOST}${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(destination, 308);
}
