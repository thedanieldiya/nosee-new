import { NextResponse, type NextRequest } from "next/server";
import { findEvent } from "@/lib/content/events-detail";

export function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next();
  let slug: string;
  try { slug = decodeURIComponent(request.nextUrl.pathname.slice("/events/".length).replace(/\/$/, "")); }
  catch { return NextResponse.next(); }
  const event = findEvent(slug);
  if (event?.type === "meeting" && request.nextUrl.pathname !== `/events/${slug}`) {
    const meeting = new URL(request.url);
    meeting.pathname = `/events/${slug}`;
    return NextResponse.rewrite(meeting);
  }
  if (slug === "archive" || event) return NextResponse.next();
  // Next 16's matched-segment fallback omits JS-off HTML; use its global 404 route.
  const missing = new URL(request.url);
  missing.pathname = missing.pathname.replace(/\/$/, "") + "/__nosee_not_found__";
  return NextResponse.rewrite(missing);
}

export const config = { matcher: "/events/:slug" };
