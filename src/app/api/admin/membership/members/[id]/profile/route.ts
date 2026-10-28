import { managementApi } from "@/lib/admin/management-api";
import { profileLinkOptions, linkMemberProfile } from "@/lib/membership/members";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export function GET(request: Request, context: Context) { return managementApi(request, async actor => profileLinkOptions(actor, (await context.params).id, new URL(request.url).searchParams.get("q")??"")); }
export function POST(request: Request, context: Context) { return managementApi(request, async (actor, body) => linkMemberProfile(actor, (await context.params).id, body)); }
