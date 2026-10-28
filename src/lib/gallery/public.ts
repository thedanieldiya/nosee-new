import "server-only";
import { z } from "zod";
import { sql, inArray } from "drizzle-orm";
import { adminDatabase } from "../admin/database.ts";
import { galleryItem, mediaAsset, event } from "../admin/schema.ts";
import {
  galleryFieldsInput,
  publicGalleryQuery,
  assetIds,
  galleryTitle,
  albumAlt,
  photoLabel,
  type GalleryFields,
} from "./input.ts";
import { mediaImage, type MediaImage } from "../media/contract.ts";
import { mediaStorage } from "../media/storage.ts";
export type PublicPhoto = {
  id: string;
  label: string;
  caption: string;
  alt: string;
  image: MediaImage;
};
const visible = sql`${galleryItem.status}='published' and ${galleryItem.deletedAt} is null`;
async function images(id: string, fields: GalleryFields) {
  const ids = assetIds(fields);
  if (!ids.length) return [];
  return adminDatabase()
    .db.select()
    .from(mediaAsset)
    .where(
      sql`${inArray(mediaAsset.id, ids)} and ${mediaAsset.state}='ready' and ${mediaAsset.ownerType}='gallery' and ${mediaAsset.ownerId}=${id}::uuid`,
    );
}
function publicPhotos(
  id: string,
  f: GalleryFields,
  rows: Awaited<ReturnType<typeof images>>,
): PublicPhoto[] {
  const map = new Map(rows.map((r) => [r.id, r]));
  if (f.kind === "photo") {
    const r = map.get(f.assetId ?? "");
    return r
      ? [
          {
            id,
            label: f.caption,
            caption: f.caption,
            alt: f.caption,
            image: mediaImage(r, true),
          },
        ]
      : [];
  }
  return f.photos.flatMap((p, index) => {
    const r = map.get(p.assetId);
    return r
      ? [
          {
            id: p.id,
            label: photoLabel(f.title, index),
            caption: p.caption,
            alt: albumAlt(p),
            image: mediaImage(r, true),
          },
        ]
      : [];
  });
}
export async function publishedGalleryRecord(
  identifier: string,
  kind: "photo" | "album",
  page = 1,
) {
  if (!process.env.DATABASE_URL) return null;
  if (
    kind === "photo"
      ? !z.uuid().safeParse(identifier).success
      : !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(identifier) || identifier.length > 80
  )
    return null;
  const [r] = await adminDatabase()
    .db.select({
      id: galleryItem.id,
      slug: galleryItem.slug,
      content: galleryItem.publishedContent,
    })
    .from(galleryItem)
    .where(
      sql`${visible} and ${galleryItem.kind}=${kind} and ${kind === "photo" ? sql`${galleryItem.id}=${identifier}::uuid` : sql`${galleryItem.slug}=${identifier}`}`,
    )
    .limit(1);
  if (!r) return null;
  const parsed = galleryFieldsInput.safeParse(r.content);
  if (!parsed.success || parsed.data.kind !== kind) return null;
  const f = parsed.data,
    rows = await images(r.id, f),
    photos = publicPhotos(r.id, f, rows);
  if (!photos.length || photos.length !== assetIds(f).length) return null;
  let linkedEvent: { title: string; slug: string } | null = null;
  if (f.kind === "album" && f.eventId) {
    const [e] = await adminDatabase()
      .db.select({
        title: sql<string>`${event.publishedContent}->>'title'`,
        slug: event.slug,
      })
      .from(event)
      .where(
        sql`${event.id}=${f.eventId}::uuid and ${event.status}='published' and ${event.deletedAt} is null`,
      );
    if (e) linkedEvent = e;
  }
  const pages = Math.max(1, Math.ceil(photos.length / 12)),
    current = Math.min(Math.max(1, page), pages);
  return {
    id: r.id,
    slug: r.slug,
    kind: f.kind,
    title: galleryTitle(f),
    description: f.kind === "album" ? f.description : "",
    date: f.kind === "album" ? f.albumDate : "",
    event: linkedEvent,
    photos: photos.slice((current - 1) * 12, current * 12),
    total: photos.length,
    page: current,
    pages,
    imagesAvailable:
      !!mediaStorage() && rows.every((v) => v.provider === mediaStorage()?.id),
  };
}
export async function publishedGallery(raw: unknown) {
  const q = publicGalleryQuery.parse(raw);
  if (!process.env.DATABASE_URL)
    return { rows: [], total: 0, page: 1, pages: 1 };
  const db = adminDatabase().db,
    pattern = "%" + q.q.replace(/[\\%_]/g, "\\$&") + "%",
    where = sql`${visible} and (${q.kind}='' or ${galleryItem.kind}=${q.kind}) and coalesce(${galleryItem.publishedContent}->>'caption',${galleryItem.publishedContent}->>'title') ilike ${pattern}`;
  const total = Number(
      (
        await db
          .select({ n: sql<number>`count(*)::int` })
          .from(galleryItem)
          .where(where)
      )[0].n,
    ),
    pages = Math.max(1, Math.ceil(total / 12)),
    page = Math.min(q.page, pages);
  const records = await db
    .select({
      id: galleryItem.id,
      slug: galleryItem.slug,
      content: galleryItem.publishedContent,
    })
    .from(galleryItem)
    .where(where)
    .orderBy(galleryItem.publishedOrder, galleryItem.id)
    .limit(12)
    .offset((page - 1) * 12);
  const content = records.flatMap((r) => {
    const p = galleryFieldsInput.safeParse(r.content);
    return p.success ? [{ ...r, fields: p.data }] : [];
  });
  const coverIds = content.flatMap((r) => {
    const f = r.fields;
    return f.kind === "photo"
      ? f.assetId
        ? [f.assetId]
        : []
      : (f.photos.find((p) => p.id === f.coverId)?.assetId ?? []);
  });
  const assets = coverIds.length
      ? await db
          .select()
          .from(mediaAsset)
          .where(
            sql`${inArray(mediaAsset.id, coverIds)} and ${mediaAsset.state}='ready'`,
          )
      : [],
    map = new Map(assets.map((r) => [r.id, r]));
  return {
    rows: content.flatMap((r) => {
      const f = r.fields,
        cover =
          f.kind === "album" ? f.photos.find((p) => p.id === f.coverId) : null,
        id = f.kind === "photo" ? f.assetId : cover?.assetId,
        asset = id ? map.get(id) : null;
      if (!asset || asset.ownerType !== "gallery" || asset.ownerId !== r.id)
        return [];
      return [
        {
          id: r.id,
          kind: f.kind,
          slug: r.slug,
          title: galleryTitle(f),
          date: f.kind === "album" ? f.albumDate : "",
          alt: f.kind === "photo" ? f.caption : cover ? albumAlt(cover) : "",
          image: mediaImage(asset, true),
          imagesAvailable: mediaStorage()?.id === asset.provider,
        },
      ];
    }),
    total,
    pages,
    page,
  };
}
