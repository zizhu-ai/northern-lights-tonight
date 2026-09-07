import { NextResponse } from "next/server";

import { API_ROBOTS_TAG } from "@/lib/indexing";
import { findPlace, routeForPlace } from "@/lib/place-search";

function redirectTo(destination: URL) {
  return NextResponse.redirect(destination, {
    headers: { "X-Robots-Tag": API_ROBOTS_TAG },
  });
}

export function GET(request: Request) {
  const result = findPlace(new URL(request.url).searchParams.get("q") ?? "");

  if (result.kind === "error") {
    return redirectTo(new URL("/near-me", request.url));
  }

  const destination =
    result.kind === "slug" ? `/forecast/${result.slug}` : routeForPlace(result.place);
  return redirectTo(new URL(destination, request.url));
}
