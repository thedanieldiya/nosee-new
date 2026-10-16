import { researchApi } from "@/lib/research/api";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ groupId: string }> };
import { getResearchGroup, updateResearchGroup, deleteResearchGroup } from "@/lib/research/groups";
export function GET(request: Request, context: Context) { return researchApi(request, async actor => getResearchGroup(actor, (await context.params).groupId)); }
export function PATCH(request: Request, context: Context) { return researchApi(request, async (actor, body) => updateResearchGroup(actor, (await context.params).groupId, body)); }

import { revalidatePath } from "next/cache";
import { researchPaths } from "@/lib/research/cache";
export function DELETE(request: Request, context: Context) { return researchApi(request, async (actor, body) => {
  const result = await deleteResearchGroup(actor, (await context.params).groupId, body);
  try { for (const path of researchPaths(result.invalidatedSlugs)) revalidatePath(path); }
  catch { return { id: result.id, message: "Group deleted, but cache refresh could not be confirmed. Review the directory before retrying.", cacheRefresh: "unconfirmed" }; }
  return { id: result.id, message: result.message, cacheRefresh: "requested" };
}); }
