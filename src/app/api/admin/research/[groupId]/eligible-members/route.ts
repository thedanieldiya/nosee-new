import { researchApi } from "@/lib/research/api";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ groupId: string }> };
import { eligibleResearchMembers } from "@/lib/research/groups";
export function POST(request: Request, context: Context) { return researchApi(request, async (actor, body) => eligibleResearchMembers(actor, (await context.params).groupId, body)); }
