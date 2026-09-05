import { NextResponse } from "next/server";

import { API_ROBOTS_TAG } from "@/lib/indexing";
import { findPlace, routeForPlace } from "@/lib/place-search";

function redirectTo(destination: URL) {
  return NextResponse.redirect(destination, {
    headers: { "X-Robots-Tag": API_ROBOTS_TAG },
  });
}

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const result = findPlace(query);

  if (result.kind === "error" || result.kind === "ambiguous") {
    const fallback = new URL("/near-me", request.url);
    if (query.trim()) fallback.searchParams.set("q", query.trim());
    return redirectTo(fallback);
  }

  const destination =
    result.kind === "slug" ? `/forecast/${result.slug}` : routeForPlace(result.place);
  return redirectTo(new URL(destination, request.url));
}
