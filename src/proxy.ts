import { NextResponse, type NextRequest } from "next/server";
import { publishedEvent } from "@/lib/events/public";
import { safeEventUrl } from "@/lib/events/input";

export async function proxy(request: NextRequest) {
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
  if (request.nextUrl.pathname.startsWith("/news/")) {
    // Next's matched-segment notFound fallback omits JS-off HTML; reuse the global 404 path.
    let article;
    try {
      const slug = decodeURIComponent(request.nextUrl.pathname.slice("/news/".length).replace(/\/$/, ""));
      article = process.env.DATABASE_URL ? await (await import("@/lib/news/public")).publishedNewsArticle(slug) : null;
    } catch { return NextResponse.next(); } // A database outage must not pretend that a published article was deleted.
    if (article) return NextResponse.next();
    const missing = new URL(request.url);
    missing.pathname = missing.pathname.replace(/\/$/, "") + "/__nosee_not_found__";
    return NextResponse.rewrite(missing);
  }
  if(request.nextUrl.pathname.startsWith("/publications/")) {
    let publication;
    try { publication=await (await import("@/lib/publications/public")).publishedPublication(decodeURIComponent(request.nextUrl.pathname.slice("/publications/".length).replace(/\/$/,""))); }
    catch { return NextResponse.next(); }
    if(publication)return NextResponse.next();
    const missing=new URL(request.url);missing.pathname=missing.pathname.replace(/\/$/,"")+"/__nosee_not_found__";return NextResponse.rewrite(missing);
  }
  if(request.nextUrl.pathname.startsWith('/multimedia/')){
    const path=request.nextUrl.pathname.slice('/multimedia/'.length).replace(/\/$/,'');
    let visible;try{visible=await(await import('@/lib/gallery/public')).publishedGalleryRecord(decodeURIComponent(path.startsWith('photos/')?path.slice(7):path),path.startsWith('photos/')?'photo':'album');}catch{return NextResponse.next();}
    if(visible)return NextResponse.next();const missing=new URL(request.url);missing.pathname=missing.pathname.replace(/\/$/,'')+'/__nosee_not_found__';return NextResponse.rewrite(missing);
  }
  let slug: string;
  try { slug = decodeURIComponent(request.nextUrl.pathname.slice("/events/".length).replace(/\/$/, "")); }
  catch { return NextResponse.next(); }
  if (slug === "archive") return NextResponse.next();
  const event = await publishedEvent(slug);
  if (event?.type === "meeting" && event.meetingSiteUrl && safeEventUrl(event.meetingSiteUrl)) {
    return NextResponse.rewrite(new URL("/api/events/" + encodeURIComponent(slug) + "/redirect", request.url));
  }
  if (event) return NextResponse.next();
  // Next 16's matched-segment fallback omits JS-off HTML; use its global 404 route.
  const missing = new URL(request.url);
  missing.pathname = missing.pathname.replace(/\/$/, "") + "/__nosee_not_found__";
  return NextResponse.rewrite(missing);
}

export const config = { matcher: ["/events/:slug", "/news/:slug", "/publications/:slug", "/multimedia/:slug", "/multimedia/photos/:id", "/admin/:path*", "/api/admin/:path*", "/join/:path*", "/api/internal/membership-expiry", "/api/internal/membership-emails"] };
