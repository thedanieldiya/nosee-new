import { siteContentApi } from "@/lib/site-content/api";
import { getPrivacy, savePrivacy } from "@/lib/privacy/service";
import { revalidatePath } from "next/cache";
export const GET = (request: Request) =>
  siteContentApi(request, (actor) => getPrivacy(actor));
export const PATCH = (request: Request) =>
  siteContentApi(request, async (actor, body) => {
    const result = await savePrivacy(actor, body);
    try {
      revalidatePath("/privacy");
      revalidatePath("/join");
      return result;
    } catch {
      return { ...result, cacheRefresh: "unconfirmed" };
    }
  });
