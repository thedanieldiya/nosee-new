import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { galleryItem } from "../admin/schema.ts";
import { authorizedPublishing } from "../admin/publishing.ts";
import { ManagementError } from "../admin/errors.ts";
import type { Principal } from "../admin/policy.ts";
import type { ResearchTransaction } from "../research/security.ts";
export async function galleryRow(
  tx: ResearchTransaction,
  id: string,
  deleted = false,
) {
  if (!z.uuid().safeParse(id).success)
    throw new ManagementError("Gallery item not found.", 404);
  const [r] = await tx.select().from(galleryItem).where(eq(galleryItem.id, id));
  if (!r || (!deleted && r.status === "deleted"))
    throw new ManagementError("Gallery item not found.", 404);
  return r;
}
export const withGallery = <T>(
  a: Principal,
  id: string,
  work: (
    tx: ResearchTransaction,
    r: typeof galleryItem.$inferSelect,
  ) => Promise<T>,
) => authorizedPublishing(a, async (tx) => work(tx, await galleryRow(tx, id)));
