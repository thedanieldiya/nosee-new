import { researchApi } from "@/lib/research/api";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ groupId: string }> };
import { revalidatePath } from "next/cache";
import { publishResearchGroup } from "@/lib/research/groups";
import { researchPaths } from "@/lib/research/cache";
export function POST(request: Request, context: Context) { return researchApi(request, async (actor, body) => {
  const result = await publishResearchGroup(actor, (await context.params).groupId, body);
  try { for (const path of researchPaths(result.invalidatedSlugs)) revalidatePath(path); }
  catch { return { id: result.id, message: "Publication state was saved, but cache refresh could not be confirmed. Review the saved group before retrying.", cacheRefresh: "unconfirmed" }; }
  return { id: result.id, message: result.message, cacheRefresh: "requested" };
}); }
