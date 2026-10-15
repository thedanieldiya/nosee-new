import { researchApi } from "@/lib/research/api";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ groupId: string }> };
import { researchMembers, manageResearchMember } from "@/lib/research/groups";
export function GET(request: Request, context: Context) { return researchApi(request, async actor => researchMembers(actor, (await context.params).groupId, Object.fromEntries(new URL(request.url).searchParams))); }
export function POST(request: Request, context: Context) { return researchApi(request, async (actor, body) => manageResearchMember(actor, (await context.params).groupId, body)); }
