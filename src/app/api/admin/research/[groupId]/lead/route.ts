import { researchApi } from "@/lib/research/api";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ groupId: string }> };
import { researchLeadOptions, manageResearchLead } from "@/lib/research/groups";
export function GET(request: Request, context: Context) { return researchApi(request, async actor => researchLeadOptions(actor, (await context.params).groupId)); }
export function POST(request: Request, context: Context) { return researchApi(request, async (actor, body) => manageResearchLead(actor, (await context.params).groupId, body)); }
