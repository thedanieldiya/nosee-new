import "server-only";
import { sql } from "drizzle-orm";
import { adminDatabase } from "../admin/database.ts";
import { event } from "../admin/schema.ts";
import { eventFieldsInput, type EventContent } from "./input.ts";
import { normalizeEventQuery } from "../content/events-listing.ts";
import { toPublicEvent } from "./presentation.ts";
const visible = sql`${event.status}='published' and ${event.deletedAt} is null`;
const publicContent = sql`(${event.publishedContent}-'body') || '{"body":""}'::jsonb`;
function content(row: { slug: string; content: unknown; start: Date | null; end: Date | null; featured: boolean | null }) {
  if (!row.content || typeof row.content !== "object") return null;
  const { slug, coverImage, coverAlt, ...fields } = row.content as EventContent;
  const parsed = eventFieldsInput.safeParse(fields);
  if (!parsed.success || slug !== row.slug || parsed.data.startAt !== row.start?.toISOString() || parsed.data.endAt !== row.end?.toISOString() || parsed.data.featured !== row.featured) return null;
  if (typeof coverImage !== "string" || typeof coverAlt !== "string" || (coverImage && (!/^\/media\/[a-zA-Z0-9/_-]+\.(?:png|jpe?g|webp|avif)$/.test(coverImage) || !coverAlt))) return null;
  return { ...parsed.data, slug, coverImage, coverAlt };
}
const projection = { slug: event.slug, content: event.publishedContent, start: event.publishedStart, end: event.publishedEnd, featured: event.publishedFeatured };
export async function publishedEvent(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80 || !process.env.DATABASE_URL) return null;
  const [row] = await adminDatabase().db.select(projection).from(event).where(sql`${visible} and ${event.slug}=${slug}`).limit(1);
  return row ? content(row) : null;
}
export async function publishedEvents(raw: { q?: string; type?: string; page?: number; timing?: "upcoming" | "ongoing" | "past" } = {}) {
  if (!process.env.DATABASE_URL) return { rows: [], total: 0, page: 1, pages: 1 };
  const db = adminDatabase().db, timing = raw.timing ?? "upcoming", q = (normalizeEventQuery(raw.q) ?? "").slice(0,120), pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  const when = timing === "upcoming" ? sql`${event.publishedStart}>statement_timestamp()` : timing === "ongoing" ? sql`${event.publishedStart}<=statement_timestamp() and ${event.publishedEnd}>statement_timestamp()` : sql`${event.publishedEnd}<=statement_timestamp()`;
  const search = sql`(${event.publishedContent}->>'title' ilike ${pattern} or ${event.publishedContent}->>'summary' ilike ${pattern} or ${event.publishedContent}->>'type' ilike ${pattern} or ${event.publishedContent}->>'organiser' ilike ${pattern} or ${event.publishedContent}->'location'->>'venue' ilike ${pattern} or ${event.publishedContent}->'location'->>'address' ilike ${pattern} or ${event.publishedContent}->'location'->>'city' ilike ${pattern} or ${event.publishedContent}->'location'->>'country' ilike ${pattern} or ${event.publishedContent}->'location'->>'platform' ilike ${pattern})`;
  const where = sql`${visible} and ${when} and ${search} and (${raw.type ?? ""}='' or ${event.publishedContent}->>'type'=${raw.type ?? ""})`;
  // One statement shares its clock and snapshot for count and page, even at a timing boundary.
  const page = Math.max(1, Math.min(100000, Math.trunc(raw.page ?? 1) || 1)), order = timing === "past" ? sql`published_start desc, slug collate "C" desc` : sql`published_start asc, slug collate "C" asc`;
  const result = await db.execute<{ total: number; rows: Array<{ slug: string; content: unknown; start: string; end: string; featured: boolean }> }>(sql`
    with eligible as (select ${event.slug} as slug, ${publicContent} as content, ${event.publishedStart} as published_start, ${event.publishedEnd} as published_end, ${event.publishedFeatured} as featured from ${event} where ${where}),
    totals as (select count(*)::int as total from eligible),
    page_rows as (select slug, content, published_start as start, published_end as end, featured from eligible order by ${order} limit 12 offset (least(${page}, greatest(1, (select ceil(total/12.0)::int from totals)))-1)*12)
    select total, coalesce((select json_agg(page_rows) from page_rows), '[]'::json) as rows from totals`);
  const value = result.rows[0], pages = Math.max(1, Math.ceil(value.total / 12));
  return { rows: value.rows.flatMap(row => { const parsed = content({ ...row, start: new Date(row.start), end: new Date(row.end) }); return parsed ? [toPublicEvent(parsed)] : []; }), total: value.total, page: Math.min(page, pages), pages };
}
export async function homepageEvents() {
  if (!process.env.DATABASE_URL) return [];
  try {
    const rows = await adminDatabase().db.select({ ...projection, content: publicContent }).from(event).where(sql`${visible} and ${event.publishedStart}>statement_timestamp()`).orderBy(sql`${event.publishedFeatured} desc, ${event.publishedStart} asc, ${event.slug} collate "C" asc`).limit(3);
    return rows.flatMap(row => { const parsed = content(row); return parsed ? [toPublicEvent(parsed)] : []; });
  } catch { return []; } // Isolate a database outage from unrelated homepage sections. Never restore fixtures.
}
