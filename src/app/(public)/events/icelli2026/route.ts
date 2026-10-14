import { findEvent } from "@/lib/content/events-detail";

export function GET() {
  // A native route response preserves the exact URL; Next redirects normalize it.
  return new Response(null, { status: 302, headers: { Location: findEvent("icelli2026")!.meeting_site_url! } });
}
