import "server-only";
import { randomUUID, createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { eventRecords } from "../content/events.ts";
import { event, auditLog } from "../admin/schema.ts";
import type { Principal } from "../admin/policy.ts";
import { authorizedPublishing } from "../admin/publishing.ts";
import { ManagementError } from "../admin/errors.ts";
import { editorialInstant } from "../timezones.ts";
import { eventFieldsInput } from "./input.ts";
import { eventSnapshot } from "./service.ts";
export const legacyEventProvenance = "inherited development fixture; src/lib/content/events.ts at 376622f; not approved organisational facts";
export function legacyEventMapping() {
  return eventRecords.map(record => {
    const startTime = record.schedule.start_time ?? "00:00:00", endTime = record.schedule.end_time ?? "23:59:59";
    const instant = (date: string, time: string) => editorialInstant(date, time, record.timezone);
    const fields = eventFieldsInput.parse({ title: record.title, type: record.type, summary: record.summary, body: record.body, organiser: record.organiser, speakers: [...record.speakers], featured: record.featured,
      startAt: instant(record.start_date, startTime), endAt: instant(record.end_date ?? record.start_date, endTime), timezone: record.timezone, scheduleMode: record.schedule.mode,
      itinerary: record.schedule.itinerary.map(entry => ({ at: instant(entry.date, entry.start_time), endAt: entry.end_time ? instant(entry.date, entry.end_time) : null, title: entry.title ?? "", description: entry.description ?? "" })), deadline: record.application_deadline ? new Date(record.application_deadline).toISOString() : null,
      location: Object.fromEntries(Object.entries(record.location).map(([k,v]) => [k, v ?? ""])), registrationUrl: record.registration_url ?? "", meetingSiteUrl: record.meeting_site_url ?? "", resources: [...record.resources] });
    return { slug: record.slug, fields, coverImage: record.image ?? "", coverAlt: record.image_alt ?? "", provenance: legacyEventProvenance };
  });
}
// Explicit import only: runtime public reads never fall back to this mapping.
export async function importLegacyEvents(actor: Principal, reviewedPublishedSlugs: readonly string[] = []) {
  const mapping = legacyEventMapping();
  if (reviewedPublishedSlugs.some(slug => !mapping.some(r => r.slug === slug))) throw new ManagementError("Review only known legacy slugs.");
  return authorizedPublishing(actor, async tx => {
    const report: Array<{ slug: string; outcome: string }> = [];
    for (const record of mapping) {
      const [prior] = await tx.select().from(event).where(eq(event.slug, record.slug));
      if (prior) {
        if (prior.provenance !== record.provenance) throw new ManagementError("Legacy URL already belongs to another event. Review the mapping before importing.", 409);
        report.push({ slug: record.slug, outcome: "retained " + prior.status }); continue;
      }
      const published = reviewedPublishedSlugs.includes(record.slug), id = randomUUID(), content = published ? eventSnapshot(record.fields, record) : null;
      await tx.insert(event).values({ ...record, id, status: published ? "published" : "draft", createdBy: actor.id, creationKey: randomUUID(), creationDigest: createHash("sha256").update(JSON.stringify(record)).digest("hex"), ...(content ? { publishedContent: content, publishedStart: new Date(content.startAt), publishedEnd: new Date(content.endAt), publishedFeatured: content.featured, publishedAt: new Date() } : {}) });
      await tx.insert(auditLog).values({ id: randomUUID(), actorId: actor.id, action: "Imported legacy development event", targetType: "event", targetId: id, targetLabel: "Event", changes: { before: { status: "legacy" }, after: { status: published ? "published" : "draft" } } });
      report.push({ slug: record.slug, outcome: published ? "imported published development fixture" : "imported draft" });
    }
    return report;
  });
}
