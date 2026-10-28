import "server-only";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { adminDatabase } from "../admin/database.ts";
import { galleryItem, mediaAsset, mediaReference } from "../admin/schema.ts";
import { ManagementError } from "../admin/errors.ts";
import type { Principal } from "../admin/policy.ts";
import { withGallery } from "../gallery/security.ts";
import { mediaStorage } from "./storage.ts";
import { bounded } from "./uploads.ts";
import { digest, maxImageBytes } from "./image.ts";
type Variant = "thumb" | "large";
function identifiers(
  id: string,
  asset: string,
  variant: string,
): asserts variant is Variant {
  if (
    !z.uuid().safeParse(id).success ||
    !z.uuid().safeParse(asset).success ||
    !["thumb", "large"].includes(variant)
  )
    throw new ManagementError("Image not found.", 404);
}
async function source(id: string, asset: string, a?: Principal) {
  if (a)
    return withGallery(a, id, async (tx) => {
      const [r] = await tx
        .select()
        .from(mediaAsset)
        .where(
          sql`${mediaAsset.id}=${asset}::uuid and ${mediaAsset.ownerType}='gallery' and ${mediaAsset.ownerId}=${id}::uuid and ${mediaAsset.state}='ready'`,
        );
      if (!r) throw new ManagementError("Image not found.", 404);
      return r;
    });
  const [r] = await adminDatabase()
    .db.select({ asset: mediaAsset })
    .from(mediaReference)
    .innerJoin(mediaAsset, eq(mediaAsset.id, mediaReference.assetId))
    .innerJoin(galleryItem, eq(galleryItem.id, mediaReference.ownerId))
    .where(
      sql`${mediaReference.ownerType}='gallery' and ${mediaReference.ownerId}=${id}::uuid and ${mediaReference.assetId}=${asset}::uuid and ${mediaReference.kind}='published' and ${galleryItem.status}='published' and ${galleryItem.deletedAt} is null and ${mediaAsset.state}='ready'`,
    )
    .limit(1);
  if (!r) throw new ManagementError("Image not found.", 404);
  return r.asset;
}
export async function deliverImage(
  id: string,
  asset: string,
  variant: string,
  a?: Principal,
) {
  identifiers(id, asset, variant);
  const row = await source(id, asset, a),
    adapter = mediaStorage();
  if (!adapter || row.provider !== adapter.id)
    throw new ManagementError("Images are temporarily unavailable.", 503);
  const v = row.variants?.[variant];
  if (!v) throw new ManagementError("Image not found.", 404);
  const bytes = await bounded(adapter.readPrivate(v.key, maxImageBytes));
  if (bytes.length !== v.bytes || digest(bytes) !== v.sha256)
    throw new ManagementError("Image delivery could not be verified.", 503);
  await source(id, asset, a);
  return new Response(new Uint8Array(bytes).buffer, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Content-Disposition": 'inline; filename="gallery-image.webp"',
    },
  });
}
