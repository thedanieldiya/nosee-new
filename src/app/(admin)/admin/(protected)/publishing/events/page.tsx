import Link from "next/link";
import { requirePermission } from "@/lib/admin/session";
import { eventsDirectory } from "@/lib/events/service";
import { eventQuery, eventTypes } from "@/lib/events/input";
import { eventsPage } from "@/lib/events/page";
import { Field, Select, Pagination, dateTime } from "@/components/admin/ManagementShared";
import { ResearchAction } from "@/components/admin/research/ResearchAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
export const metadata = { title: "Events" };
export const dynamic = "force-dynamic";
export default async function EventsDirectory({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requirePermission("publishing"), query = eventQuery.safeParse(await searchParams);
  if (!query.success) return <main id="main-content" className="p-5"><h1 className="text-2xl font-semibold">Events</h1><p role="alert" className="my-5">Invalid search, status or page.</p><Link href="/admin/publishing/events" className="underline">Clear filters</Link></main>;
  const data = await eventsPage(() => eventsDirectory(actor, query.data));
  return <main id="main-content" className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8 lg:p-10">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-semibold">Events</h1><Button asChild><Link href="/admin/publishing/events/new">Add event</Link></Button></div>
    <Card><CardContent><form method="get" className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 grow"><Field id="events-q" label="Search events"><Input id="events-q" name="q" maxLength={120} defaultValue={query.data.q} /></Field></div>
      <div className="min-w-40"><Field id="events-status" label="Status"><Select id="events-status" name="status" defaultValue={query.data.status}>
        <option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="unpublished">Unpublished</option>
      </Select></Field></div><Field id="events-type" label="Type"><Select id="events-type" name="type" defaultValue={query.data.type}><option value="">All types</option>{eventTypes.map(t => <option key={t} value={t}>{t}</option>)}</Select></Field>
      <Field id="events-timing" label="Timing"><Select id="events-timing" name="timing" defaultValue={query.data.timing}><option value="">All times</option><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="past">Past</option></Select></Field><Button type="submit">Search</Button><Button asChild variant="outline"><Link href="/admin/publishing/events">Clear</Link></Button>
    </form></CardContent></Card>
    <Card aria-label="Events">
      {data.rows.length ? <ul className="divide-y divide-line-mild">
        {data.rows.map(event => <li key={event.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="min-w-0 flex-1">
            <h2 className="break-words font-semibold"><Link href={"/admin/publishing/events/" + event.id} className="underline underline-offset-4">{event.title}</Link></h2>
            <p className="mt-2 text-sm text-secondary">{event.timing[0].toUpperCase() + event.timing.slice(1)} · Updated {dateTime(event.updatedAt)}</p>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-medium"><span>{event.status === "published" ? "Published" : event.status === "unpublished" ? "Unpublished" : "Draft"}</span>{event.hasUnpublishedChanges ? <span className="rounded-md border border-line-mild px-2 py-0.5 text-xs text-secondary">Unpublished changes</span> : null}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ResearchAction endpoint={"/api/admin/events/" + event.id + "/publication"} payload={{ action: event.status === "published" ? "unpublish" : "publish", version: event.version }} title={event.status === "published" ? "Unpublish" : "Publish"} description={event.status === "published" ? "Remove the public event while retaining its working copy and snapshot." : "Publish the latest saved working copy to the website."} />
            <Button asChild variant="outline"><Link href={"/admin/publishing/events/" + event.id + "#delete-event-heading"}>Delete</Link></Button>
          </div>
        </li>)}
      </ul> : <p className="p-5 text-secondary">No events match these filters.</p>}
      <Pagination path="/admin/publishing/events" query={{ q: query.data.q, status: query.data.status, type: query.data.type, timing: query.data.timing }} {...data} />
    </Card>
  </main>;
}
