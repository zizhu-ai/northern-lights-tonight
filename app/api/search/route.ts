import { NextResponse } from "next/server";

import { findPlace, routeForPlace } from "@/lib/place-search";

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const result = findPlace(query);

  if (result.kind === "error" || result.kind === "ambiguous") {
    const fallback = new URL("/near-me", request.url);
    if (query.trim()) fallback.searchParams.set("q", query.trim());
    return NextResponse.redirect(fallback);
  }

  const destination =
    result.kind === "slug" ? `/forecast/${result.slug}` : routeForPlace(result.place);
  return NextResponse.redirect(new URL(destination, request.url));
}
