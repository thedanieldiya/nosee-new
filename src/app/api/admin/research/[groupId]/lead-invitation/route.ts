import { researchApi } from "@/lib/research/api";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ groupId: string }> };
import { prepareResearchLeadInvitation } from "@/lib/research/groups";
import { manageAdministrator } from "@/lib/admin/management";
export function POST(request: Request, context: Context) { return researchApi(request, async (actor, body) => manageAdministrator(actor, await prepareResearchLeadInvitation(actor, (await context.params).groupId, body))); }
