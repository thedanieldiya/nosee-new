import { researchApi } from "@/lib/research/api";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ groupId: string }> };
import { getResearchGroup, updateResearchGroup } from "@/lib/research/groups";
export function GET(request: Request, context: Context) { return researchApi(request, async actor => getResearchGroup(actor, (await context.params).groupId)); }
export function PATCH(request: Request, context: Context) { return researchApi(request, async (actor, body) => updateResearchGroup(actor, (await context.params).groupId, body)); }
