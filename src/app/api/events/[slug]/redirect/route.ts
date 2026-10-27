import { publishedEvent } from "@/lib/events/public";
import { safeEventUrl } from "@/lib/events/input";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const event = await publishedEvent((await context.params).slug);
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  if (!event || event.type !== "meeting" || !event.meetingSiteUrl || !safeEventUrl(event.meetingSiteUrl)) return new Response(null, { status: 404, headers });
  // A native response preserves the exact stored URL; proxy redirects normalize it.
  return new Response(null, { status: 302, headers: { ...headers, Location: event.meetingSiteUrl } });
}
