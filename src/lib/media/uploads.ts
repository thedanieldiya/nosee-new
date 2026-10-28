import "server-only";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { mediaAsset, auditLog } from "../admin/schema.ts";
import { ManagementError } from "../admin/errors.ts";
import type { Principal } from "../admin/policy.ts";
import type { ResearchTransaction } from "../research/security.ts";
import { withGallery } from "../gallery/security.ts";
import { mediaStorage, type StoredObject } from "./storage.ts";
import { maxImageBytes, imageTypes, processImage, digest } from "./image.ts";
export type MediaVariant = StoredObject & {
  key: string;
  width: number;
  height: number;
};
export type MediaVariants = { thumb: MediaVariant; large: MediaVariant };
export type UploadAttempt = {
  token: string;
  keys: { thumb: string; large: string };
  startedAt: string;
  state: "writing" | "staged" | "failed" | "ready";
};
import { mediaImage } from "./contract.ts";
const beginInput = z
  .object({
    requestId: z.uuid(),
    bytes: z.number().int().min(1).max(maxImageBytes),
    contentType: z.enum(["", ...imageTypes]),
  })
  .strict();
function storage() {
  const s = mediaStorage();
  if (!s) throw new ManagementError("Uploads are not configured.", 503);
  return s;
}
export async function bounded<T>(
  work: Promise<T>,
  milliseconds = 15000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new ManagementError(
                "Storage could not confirm this upload. Retry the file.",
                503,
              ),
            ),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
async function uploadRow(
  tx: ResearchTransaction,
  a: Principal,
  recordId: string,
  id: string,
) {
  if (!z.uuid().safeParse(id).success)
    throw new ManagementError("Upload not found.", 404);
  const [r] = await tx.select().from(mediaAsset).where(eq(mediaAsset.id, id));
  if (
    !r ||
    r.ownerType !== "gallery" ||
    r.ownerId !== recordId ||
    r.uploadedBy !== a.id
  )
    throw new ManagementError("Upload not found.", 404);
  return r;
}

export async function uploadStatus(a: Principal, id: string) {
  return withGallery(a, id, async () => ({
    configured: !!mediaStorage(),
    message: mediaStorage()
      ? "Images are saved privately until publication."
      : "Uploads are not configured.",
  }));
}
export async function beginUpload(
  a: Principal,
  recordId: string,
  raw: unknown,
) {
  const p = beginInput.safeParse(raw);
  if (!p.success)
    throw new ManagementError(
      "Choose JPEG, PNG, WebP or AVIF images within 4 MB.",
    );
  return withGallery(a, recordId, async (tx) => {
    const adapter = storage(),
      input = p.data;
    const [prior] = await tx
      .select()
      .from(mediaAsset)
      .where(
        sql`${mediaAsset.ownerType}='gallery' and ${mediaAsset.ownerId}=${recordId}::uuid and ${mediaAsset.uploadedBy}=${a.id}::uuid and ${mediaAsset.requestId}=${input.requestId}::uuid`,
      );
    if (prior) {
      if (
        prior.declaration.bytes !== input.bytes ||
        prior.declaration.contentType !== input.contentType ||
        prior.provider !== adapter.id
      )
        throw new ManagementError(
          "This upload request already describes another file.",
          409,
        );
      return { id: prior.id, state: prior.state };
    }
    const id = randomUUID();
    await tx.insert(mediaAsset).values({
      id,
      ownerType: "gallery",
      ownerId: recordId,
      uploadedBy: a.id,
      requestId: input.requestId,
      declaration: { bytes: input.bytes, contentType: input.contentType },
      provider: adapter.id,
    });
    return { id, state: "pending" as const };
  });
}
export async function checkUpload(a: Principal, recordId: string, id: string) {
  return withGallery(a, recordId, async (tx) => {
    storage();
    await uploadRow(tx, a, recordId, id);
    return true;
  });
}
export async function acceptUpload(
  a: Principal,
  recordId: string,
  id: string,
  body: Uint8Array,
) {
  const rawSha = digest(body);
  const prepared = await withGallery(a, recordId, async (tx) => {
    const adapter = storage(),
      r = await uploadRow(tx, a, recordId, id);
    if (r.provider !== adapter.id)
      throw new ManagementError(
        "This upload belongs to another storage configuration.",
        409,
      );
    if (body.length !== r.declaration.bytes || body.length > maxImageBytes)
      throw new ManagementError(
        "The uploaded byte count does not match this file.",
      );
    if (r.state === "staged" || r.state === "ready") {
      if (r.rawSha256 !== rawSha)
        throw new ManagementError(
          "This upload request already contains different image bytes.",
          409,
        );
      return { existing: true as const };
    }
    if (r.state === "uploading" && r.leaseUntil && r.leaseUntil > new Date())
      throw new ManagementError(
        "This file is already uploading. Retry after the current attempt finishes.",
        409,
      );
    if (r.attempts.length >= 5)
      throw new ManagementError(
        "This file reached the retry limit. Select it again to start a new upload.",
        409,
      );
    const active = (
      await tx.execute<{ n: number }>(
        sql`select count(*)::int n from media_asset where state='uploading' and lease_until>now()`,
      )
    ).rows[0].n;
    if (active >= 2)
      throw new ManagementError(
        "Two files are already uploading. Retry shortly.",
        429,
      );
    const token = randomUUID(),
      prefix = `gallery/${recordId}/${id}/${token}`,
      attempt: UploadAttempt = {
        token,
        keys: { thumb: prefix + "/thumb.webp", large: prefix + "/large.webp" },
        startedAt: new Date().toISOString(),
        state: "writing",
      };
    await tx
      .update(mediaAsset)
      .set({
        state: "uploading",
        attempts: [...r.attempts, attempt],
        leaseToken: token,
        leaseUntil: sql`clock_timestamp()+interval '120 seconds'`,
        updatedAt: sql`clock_timestamp()`,
      })
      .where(eq(mediaAsset.id, id));
    return {
      existing: false as const,
      attempt,
      contentType: r.declaration.contentType,
      adapter,
    };
  });
  if (prepared.existing) return { state: "staged" as const };
  const { attempt, adapter } = prepared;
  try {
    const processed = await processImage(body, prepared.contentType),
      variants = {} as MediaVariants;
    for (const v of processed.variants) {
      const key = attempt.keys[v.name as keyof typeof attempt.keys];
      await bounded(
        adapter.putPrivate(key, v.body, {
          bytes: v.bytes,
          sha256: v.sha256,
          contentType: v.contentType,
        }),
      );
      variants[v.name as keyof MediaVariants] = {
        key,
        width: v.width,
        height: v.height,
        bytes: v.bytes,
        sha256: v.sha256,
        contentType: v.contentType,
      };
    }
    await withGallery(a, recordId, async (tx) => {
      const r = await uploadRow(tx, a, recordId, id);
      if (r.leaseToken !== attempt.token || r.state !== "uploading")
        throw new ManagementError("This attempt expired. Retry the file.", 409);
      await tx
        .update(mediaAsset)
        .set({
          state: "staged",
          variants,
          rawSha256: processed.rawSha256,
          leaseUntil: null,
          attempts: r.attempts.map((v) =>
            v.token === attempt.token ? { ...v, state: "staged" as const } : v,
          ),
          updatedAt: sql`clock_timestamp()`,
        })
        .where(eq(mediaAsset.id, id));
    });
    return { state: "staged" as const };
  } catch (error) {
    try {
      await withGallery(a, recordId, async (tx) => {
        const r = await uploadRow(tx, a, recordId, id);
        if (r.leaseToken === attempt.token && r.state === "uploading")
          await tx
            .update(mediaAsset)
            .set({
              state: "failed",
              leaseUntil: null,
              attempts: r.attempts.map((v) =>
                v.token === attempt.token
                  ? { ...v, state: "failed" as const }
                  : v,
              ),
              updatedAt: sql`clock_timestamp()`,
            })
            .where(eq(mediaAsset.id, id));
      });
    } catch {
      /* Planned private keys remain recorded for reviewed orphan cleanup. */
    }
    if (error instanceof ManagementError) throw error;
    throw new ManagementError(
      "Upload could not be confirmed. Retry this file; other saved files are retained.",
      503,
    );
  }
}
export async function finalizeUpload(
  a: Principal,
  recordId: string,
  id: string,
  raw: unknown,
) {
  if (
    !z
      .object({ confirm: z.literal(true) })
      .strict()
      .safeParse(raw).success
  )
    throw new ManagementError("Confirm this upload.");
  const prepared = await withGallery(a, recordId, async (tx) => {
    const adapter = storage(),
      r = await uploadRow(tx, a, recordId, id);
    if (r.provider !== adapter.id)
      throw new ManagementError(
        "Storage configuration changed. Retry the upload.",
        409,
      );
    if (r.state !== "ready" && r.state !== "staged")
      throw new ManagementError(
        "Upload the image successfully before finalizing it.",
        409,
      );
    return { r, adapter };
  });
  for (const v of Object.values(prepared.r.variants!)) {
    const stat = await bounded(prepared.adapter.statPrivate(v.key));
    if (
      !stat ||
      stat.sha256 !== v.sha256 ||
      stat.bytes !== v.bytes ||
      stat.contentType !== "image/webp"
    )
      throw new ManagementError(
        "Storage has not confirmed both image sizes. Retry finalization.",
        503,
      );
  }
  return withGallery(a, recordId, async (tx) => {
    const r = await uploadRow(tx, a, recordId, id);
    if (
      r.leaseToken !== prepared.r.leaseToken ||
      !["staged", "ready"].includes(r.state)
    )
      throw new ManagementError("The upload changed. Retry finalization.", 409);
    if (r.state !== "ready") {
      await tx
        .update(mediaAsset)
        .set({
          state: "ready",
          attempts: r.attempts.map((v) =>
            v.token === r.leaseToken ? { ...v, state: "ready" as const } : v,
          ),
          updatedAt: sql`clock_timestamp()`,
        })
        .where(eq(mediaAsset.id, id));
      await tx.insert(auditLog).values({
        id: randomUUID(),
        actorId: a.id,
        action: "Finalized private Gallery image",
        targetType: "media_asset",
        targetId: id,
        targetLabel: "Gallery image",
        changes: { before: { status: "staged" }, after: { status: "ready" } },
      });
    }
    return { image: mediaImage(r) };
  });
}
