import { NextResponse } from "next/server";

import { findPlace, routeForPlace } from "@/lib/place-search";

export function GET(request: Request) {
  const result = findPlace(new URL(request.url).searchParams.get("q") ?? "");

  if (result.kind === "error") {
    return NextResponse.redirect(new URL("/near-me", request.url));
  }

  const destination =
    result.kind === "slug" ? `/forecast/${result.slug}` : routeForPlace(result.place);
  return NextResponse.redirect(new URL(destination, request.url));
}
