import Link from "next/link";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requirePermission } from "@/lib/admin/session";
import { getEvent } from "@/lib/events/service";
import { eventsPage } from "@/lib/events/page";
import { EventEditor } from "@/components/admin/events/EventEditor";
import { EventContentView } from "@/components/admin/events/EventContentView";
import { Card, CardContent } from "@/components/ui/card";
export const metadata = { title: "Event", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function EventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requirePermission("publishing"), { id } = await params, event = await eventsPage(() => getEvent(actor, id)), query = await searchParams, mode = query.preview;
  if (mode === "1" || mode === "published") {
    const content = mode === "published" ? event.publishedContent : { ...event.fields, slug: event.slug, coverImage: event.coverImage, coverAlt: event.coverAlt }; if (!content) notFound();
    return <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8 lg:p-10"><Link href={`/admin/publishing/events/${id}`} className="underline underline-offset-4">Back to editor</Link><h1 className="text-2xl font-semibold">{mode === "published" ? "Published snapshot preview" : "Saved working-copy preview"}</h1><p className="text-secondary">Private preview. The public event page uses only the latest published snapshot.</p><Card><CardContent><EventContentView content={content} /></CardContent></Card></main>;
  }
  return <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8 lg:p-10"><h1 className="text-2xl font-semibold">Edit event</h1><EventEditor key={event.version} initial={event.fields} slug={event.slug} coverImage={event.coverImage} coverAlt={event.coverAlt} id={id} version={event.version} status={event.status} published={event.publishedContent} focusSaved={query.saved === "1"} requestId={randomUUID()} /></main>;
}
