import "server-only";
import { randomUUID, createHash } from "node:crypto";
import { eq, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  galleryItem,
  mediaAsset,
  mediaReference,
  event,
  auditLog,
} from "../admin/schema.ts";
import { authorizedPublishing } from "../admin/publishing.ts";
import { requireManagerTransaction } from "../admin/management.ts";
import { ManagementError } from "../admin/errors.ts";
import type { Principal } from "../admin/policy.ts";
import type { ResearchTransaction } from "../research/security.ts";
import { automaticSlug } from "../content/slug.ts";
import { mediaStorage } from "../media/storage.ts";
import { mediaImage } from "../media/contract.ts";
import { galleryRow } from "./security.ts";
import {
  gallerySaveInput,
  galleryStateInput,
  galleryDeleteInput,
  galleryQuery,
  galleryTitle,
  galleryFingerprint,
  galleryRequirements,
  assetIds,
  type GalleryFields,
} from "./input.ts";
const serialized = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const hash = (v: unknown) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");
function parse<T>(schema: z.ZodType<T>, v: unknown) {
  const p = schema.safeParse(v);
  if (!p.success)
    throw new ManagementError(
      p.error.issues
        .map((i) => i.path.join(".") + ": " + i.message)
        .join(" ")
        .slice(0, 1400),
    );
  return p.data;
}
function current(actual: number, expected: number) {
  if (actual !== expected)
    throw new ManagementError(
      "This Gallery item changed. Reload and review the saved version.",
      409,
    );
}
function retry(
  r: typeof galleryItem.$inferSelect,
  key: string,
  digest: string,
) {
  if (r.lastMutationKey !== key) return false;
  if (r.lastMutationDigest !== digest)
    throw new ManagementError("This request key saved different content.", 409);
  return true;
}
async function audit(
  tx: ResearchTransaction,
  a: Principal,
  id: string,
  action: string,
  before: string,
  after: string,
) {
  await tx.insert(auditLog).values({
    id: randomUUID(),
    actorId: a.id,
    targetType: "gallery_item",
    targetId: id,
    targetLabel: "Gallery item",
    action,
    changes: { before: { status: before }, after: { status: after } },
    createdAt: sql`clock_timestamp()`,
  });
}
async function validateAssets(
  tx: ResearchTransaction,
  id: string,
  f: GalleryFields,
  publish: boolean,
) {
  const ids = assetIds(f);
  if (publish) {
    const required = galleryRequirements(f);
    if (Object.keys(required).length)
      throw new ManagementError(Object.values(required).join(" "));
  }
  if (!ids.length) return;
  const provider = mediaStorage()?.id;
  if (publish && !provider)
    throw new ManagementError("Uploads are not configured.", 503);
  const rows = await tx
    .select({ id: mediaAsset.id })
    .from(mediaAsset)
    .where(
      sql`${mediaAsset.ownerType}='gallery' and ${mediaAsset.ownerId}=${id}::uuid and ${mediaAsset.state}='ready' and (${!publish} or ${mediaAsset.provider}=${provider ?? ""}) and ${inArray(mediaAsset.id, ids)}`,
    );
  if (rows.length !== ids.length)
    throw new ManagementError(
      "Use only finalized, validated images uploaded for this Gallery item.",
    );
}
async function validateEvent(tx: ResearchTransaction, f: GalleryFields) {
  if (f.kind !== "album" || !f.eventId) return;
  const [r] = await tx
    .select({ id: event.id })
    .from(event)
    .where(sql`${event.id}=${f.eventId}::uuid and ${event.deletedAt} is null`);
  if (!r)
    throw new ManagementError(
      "This Event is no longer available. Clear the association or choose another Event.",
      409,
    );
}
async function references(
  tx: ResearchTransaction,
  id: string,
  f: GalleryFields,
  kind: "working" | "published",
) {
  const prior = await tx
    .select({ assetId: mediaReference.assetId })
    .from(mediaReference)
    .where(
      sql`${mediaReference.ownerType}='gallery' and ${mediaReference.ownerId}=${id}::uuid and ${mediaReference.kind}=${kind}`,
    );
  for (const p of prior)
    await tx
      .insert(mediaReference)
      .values({ ...p, ownerType: "gallery", ownerId: id, kind: "history" })
      .onConflictDoNothing();
  await tx
    .delete(mediaReference)
    .where(
      sql`${mediaReference.ownerType}='gallery' and ${mediaReference.ownerId}=${id}::uuid and ${mediaReference.kind}=${kind}`,
    );
  for (const assetId of assetIds(f))
    await tx
      .insert(mediaReference)
      .values({ assetId, ownerType: "gallery", ownerId: id, kind })
      .onConflictDoNothing();
}
export async function getGallery(a: Principal, id: string) {
  return authorizedPublishing(a, async (tx) => {
    const r = await galleryRow(tx, id),
      ids = [
        ...new Set([
          ...assetIds(r.fields),
          ...(r.publishedContent ? assetIds(r.publishedContent) : []),
        ]),
      ],
      images = ids.length
        ? await tx
            .select()
            .from(mediaAsset)
            .where(
              sql`${inArray(mediaAsset.id, ids)} and ${mediaAsset.ownerType}='gallery' and ${mediaAsset.ownerId}=${id}::uuid and ${mediaAsset.state}='ready'`,
            )
        : [];
    const [e] =
      r.fields.kind === "album" && r.fields.eventId
        ? await tx
            .select({
              id: event.id,
              title: sql<string>`${event.fields}->>'title'`,
            })
            .from(event)
            .where(
              sql`${event.id}=${r.fields.eventId}::uuid and ${event.deletedAt} is null`,
            )
        : [];
    return serialized({
      id: r.id,
      kind: r.kind,
      slug: r.slug,
      fields: r.fields,
      status: r.status,
      publishedContent: r.publishedContent,
      version: r.version,
      updatedAt: r.updatedAt.toISOString(),
      images: images.map((v) => mediaImage(v)),
      selectedEvent: e ?? null,
    });
  });
}
export async function galleryDirectory(a: Principal, raw: unknown) {
  const q = parse(galleryQuery, raw),
    pattern = "%" + q.q.replace(/[\\%_]/g, "\\$&") + "%";
  return authorizedPublishing(a, async (tx) => {
    const where = sql`${galleryItem.deletedAt} is null and (${q.kind}='' or ${galleryItem.kind}=${q.kind}) and (${q.status}='' or ${galleryItem.status}=${q.status}) and (coalesce(${galleryItem.fields}->>'caption',${galleryItem.fields}->>'title') ilike ${pattern})`;
    const total = Number(
        (
          await tx
            .select({ n: sql<number>`count(*)::int` })
            .from(galleryItem)
            .where(where)
        )[0].n,
      ),
      pages = Math.max(1, Math.ceil(total / 20)),
      page = Math.min(q.page, pages);
    const records = await tx
      .select({
        id: galleryItem.id,
        kind: galleryItem.kind,
        fields: galleryItem.fields,
        published: galleryItem.publishedContent,
        status: galleryItem.status,
        version: galleryItem.version,
        updatedAt: galleryItem.updatedAt,
      })
      .from(galleryItem)
      .where(where)
      .orderBy(sql`${galleryItem.updatedAt} desc,${galleryItem.id} asc`)
      .limit(20)
      .offset((page - 1) * 20);
    return {
      rows: records.map(({ fields, published, ...r }) => ({
        ...r,
        title: galleryTitle(fields),
        count:
          fields.kind === "album"
            ? fields.photos.length
            : fields.assetId
              ? 1
              : 0,
        updatedAt: r.updatedAt.toISOString(),
        hasUnpublishedChanges:
          r.status === "published" &&
          !!published &&
          galleryFingerprint(fields) !== galleryFingerprint(published),
      })),
      total,
      page,
      pages,
    };
  });
}
export async function saveGallery(
  a: Principal,
  id: string | null,
  raw: unknown,
) {
  const input = parse(gallerySaveInput, raw),
    digest = hash(input);
  return authorizedPublishing(a, async (tx) => {
    const r = id ? await galleryRow(tx, id) : null;
    if (!r) {
      const [prior] = await tx
        .select()
        .from(galleryItem)
        .where(eq(galleryItem.creationKey, input.mutationId));
      if (prior) {
        if (prior.status === "deleted" || prior.creationDigest !== digest)
          throw new ManagementError(
            "This addition request already saved another item. Start a new addition.",
            409,
          );
        return { id: prior.id, message: "Gallery item already saved." };
      }
    }
    if (r && retry(r, input.mutationId, digest))
      return { id: r.id, message: "Changes already saved." };
    current(r?.version ?? 0, input.version);
    if (r && r.kind !== input.fields.kind)
      throw new ManagementError(
        "A Gallery item cannot change between photo and album.",
      );
    const recordId = id ?? randomUUID();
    await validateEvent(tx, input.fields);
    await validateAssets(tx, recordId, input.fields, input.mode === "publish");
    const slug =
      r?.slug ??
      automaticSlug(
        galleryTitle(input.fields),
        [
          "new",
          "photos",
          "albums",
          "images",
          ...(
            await tx.select({ slug: galleryItem.slug }).from(galleryItem)
          ).map((v) => v.slug),
        ],
        input.fields.kind,
      );
    const status =
        input.mode === "publish" ? "published" : (r?.status ?? "draft"),
      live =
        input.mode === "publish"
          ? {
              publishedContent: input.fields,
              publishedOrder: input.fields.displayOrder,
              publishedAt: sql`clock_timestamp()`,
            }
          : {};
    if (r)
      await tx
        .update(galleryItem)
        .set({
          fields: input.fields,
          status,
          ...live,
          version: r.version + 1,
          lastMutationKey: input.mutationId,
          lastMutationDigest: digest,
          updatedAt: sql`clock_timestamp()`,
        })
        .where(eq(galleryItem.id, recordId));
    else
      await tx.insert(galleryItem).values({
        id: recordId,
        kind: input.fields.kind,
        slug,
        fields: input.fields,
        status,
        ...live,
        creationKey: input.mutationId,
        creationDigest: digest,
        createdBy: a.id,
      });
    await references(tx, recordId, input.fields, "working");
    if (input.mode === "publish")
      await references(tx, recordId, input.fields, "published");
    await audit(
      tx,
      a,
      recordId,
      input.mode === "publish"
        ? "Published Gallery item"
        : "Saved Gallery working copy",
      r?.status ?? "new",
      status,
    );
    return {
      id: recordId,
      message:
        input.mode === "publish"
          ? "Gallery item published."
          : "Draft saved. Published content is unchanged.",
    };
  });
}
export async function publishGallery(a: Principal, id: string, raw: unknown) {
  const input = parse(galleryStateInput, raw);
  if (input.action === "publish") {
    const r = await getGallery(a, id),
      { action, ...mutation } = input;
    void action;
    return saveGallery(a, id, {
      ...mutation,
      fields: r.fields,
      mode: "publish",
    });
  }
  const digest = hash(input);
  return authorizedPublishing(a, async (tx) => {
    const r = await galleryRow(tx, id);
    if (retry(r, input.mutationId, digest))
      return { id, message: "Already unpublished." };
    current(r.version, input.version);
    if (r.status !== "published")
      throw new ManagementError(
        "Only published Gallery items can be unpublished.",
        409,
      );
    await tx
      .update(galleryItem)
      .set({
        status: "unpublished",
        version: r.version + 1,
        lastMutationKey: input.mutationId,
        lastMutationDigest: digest,
        updatedAt: sql`clock_timestamp()`,
      })
      .where(eq(galleryItem.id, id));
    await audit(tx, a, id, "Unpublished Gallery item", r.status, "unpublished");
    return { id, message: "Gallery item unpublished." };
  });
}
export async function deleteGallery(a: Principal, id: string, raw: unknown) {
  const input = parse(galleryDeleteInput, raw),
    digest = hash(input);
  return authorizedPublishing(a, async (tx) => {
    const r = await galleryRow(tx, id, true);
    if (r.status === "deleted" && retry(r, input.mutationId, digest))
      return { id, message: "Already deleted." };
    if (r.status === "deleted")
      throw new ManagementError("Gallery item not found.", 404);
    current(r.version, input.version);
    if (input.phrase !== "Delete " + galleryTitle(r.fields))
      throw new ManagementError("Type the exact deletion phrase.");
    const refs = await tx
      .select({ assetId: mediaReference.assetId })
      .from(mediaReference)
      .where(
        sql`${mediaReference.ownerType}='gallery' and ${mediaReference.ownerId}=${id}::uuid`,
      );
    for (const v of refs)
      await tx
        .insert(mediaReference)
        .values({ ...v, ownerType: "gallery", ownerId: id, kind: "history" })
        .onConflictDoNothing();
    await tx
      .delete(mediaReference)
      .where(
        sql`${mediaReference.ownerType}='gallery' and ${mediaReference.ownerId}=${id}::uuid and ${mediaReference.kind}<>'history'`,
      );
    await tx
      .update(galleryItem)
      .set({
        status: "deleted",
        deletedAt: sql`clock_timestamp()`,
        version: r.version + 1,
        lastMutationKey: input.mutationId,
        lastMutationDigest: digest,
        updatedAt: sql`clock_timestamp()`,
      })
      .where(eq(galleryItem.id, id));
    await audit(tx, a, id, "Deleted Gallery item", r.status, "deleted");
    return {
      id,
      message:
        "Gallery item deleted. Event records and stored images are retained.",
    };
  });
}
export async function galleryEvents(a: Principal, q: string) {
  if (q.length > 120) throw new ManagementError("Use a shorter Event search.");
  const pattern = "%" + q.replace(/[\\%_]/g, "\\$&") + "%";
  return authorizedPublishing(a, async (tx) => ({
    rows: await tx
      .select({ id: event.id, title: sql<string>`${event.fields}->>'title'` })
      .from(event)
      .where(
        sql`${event.deletedAt} is null and ${event.fields}->>'title' ilike ${pattern}`,
      )
      .orderBy(event.slug)
      .limit(20),
  }));
}
// Read-only eligibility: retained history is protected until an owner-approved retention policy exists.
export async function mediaCleanupCandidates(a: Principal) {
  return authorizedPublishing(a, async (tx) => {
    await requireManagerTransaction(tx, a);
    return tx
      .select({ id: mediaAsset.id })
      .from(mediaAsset)
      .where(
        sql`${mediaAsset.createdAt}<now()-interval '7 days' and ${mediaAsset.updatedAt}<now()-interval '7 days' and ${mediaAsset.state} in ('pending','failed','ready') and (${mediaAsset.leaseUntil} is null or ${mediaAsset.leaseUntil}<now()) and not exists(select 1 from media_reference r where r.asset_id=${mediaAsset.id})`,
      )
      .limit(100);
  });
}
