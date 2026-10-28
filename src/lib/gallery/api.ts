import "server-only";
import { revalidatePath } from "next/cache";
import { publishingApi } from "../admin/publishing-api.ts";
import type { Principal } from "../admin/policy.ts";
export const galleryApi = (
  r: Request,
  work: (a: Principal, b: unknown) => Promise<unknown>,
) => publishingApi(r, "gallery", work);
export function refreshGallery<T extends object>(result: T) {
  try {
    revalidatePath("/multimedia");
    revalidatePath("/multimedia/[slug]", "page");
    revalidatePath("/multimedia/photos/[id]", "page");
    return result;
  } catch {
    return { ...result, cacheRefresh: "unconfirmed" };
  }
}
