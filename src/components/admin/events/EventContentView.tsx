import type { EventContent } from "@/lib/events/input";
import { toPublicEvent, eventScheduleZoneLabel } from "@/lib/events/presentation";
import { presentEvent } from "@/lib/content/events-listing";
import { DescriptionView } from "@/components/admin/research/DescriptionView";
export function EventContentView({ content }: { content: EventContent }) {
  const e = toPublicEvent(content), p = presentEvent(e, new Date(), true).presentation;
  return <article className="space-y-5"><h2 className="text-2xl font-semibold">{content.title}</h2><p>{content.summary}</p><p>{p.date_range} · {p.start_time} – {p.end_time} · {eventScheduleZoneLabel(content.timezone, content.startAt, content.endAt)}</p><p>{p.location}</p><DescriptionView value={content.body} /><p>{content.type} · {content.featured ? "Featured" : "Not featured"}</p>{content.deadline && <p>Deadline: {content.deadline} ({content.timezone})</p>}{content.registrationUrl && <p><a className="underline" href={content.registrationUrl} rel="noopener noreferrer">Registration</a></p>}<p>Organiser: {content.organiser}</p>{content.type === "meeting" && <p>Meeting destination: {content.meetingSiteUrl || "Not set"}</p>}{content.speakers.map((s,i) => <p key={i}>{s}</p>)}{p.itinerary.map((d,i) => <p key={i}>{d.presentation.date} · {d.presentation.start_time} · {d.title} {d.description}</p>)}{content.resources.map((x,i) => <p key={i}><a className="underline" href={x.url} rel="noopener noreferrer">{x.label}</a></p>)}</article>;
}
