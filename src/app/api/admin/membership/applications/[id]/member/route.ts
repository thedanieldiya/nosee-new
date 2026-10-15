import { managementApi } from "@/lib/admin/management-api";
import { applicationMemberContext, convertApplication } from "@/lib/membership/members";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export function GET(request: Request, context: Context) { return managementApi(request, async actor => applicationMemberContext(actor, (await context.params).id)); }
export function POST(request: Request, context: Context) { return managementApi(request, async (actor, body) => convertApplication(actor, (await context.params).id, body)); }
