import { managementApi } from "@/lib/admin/management-api";
import { getMember, updateMember } from "@/lib/membership/members";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export function GET(request: Request, context: Context) { return managementApi(request, async actor => getMember(actor, (await context.params).id)); }
export function PATCH(request: Request, context: Context) { return managementApi(request, async (actor, body) => updateMember(actor, (await context.params).id, body)); }
