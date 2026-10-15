import { NextResponse, type NextRequest } from "next/server";
import { findEvent } from "@/lib/content/events-detail";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/api/admin/") || request.nextUrl.pathname.startsWith("/join") || ["/api/internal/membership-expiry", "/api/internal/membership-emails"].includes(request.nextUrl.pathname)) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Content-Security-Policy", "frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "same-origin");
    return response;
  }
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

export const config = { matcher: ["/events/:slug", "/admin/:path*", "/api/admin/:path*", "/join/:path*", "/api/internal/membership-expiry", "/api/internal/membership-emails"] };
