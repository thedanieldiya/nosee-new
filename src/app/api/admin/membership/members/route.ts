import { managementApi } from "@/lib/admin/management-api";
import { createMember, memberDirectory } from "@/lib/membership/members";
export const dynamic = "force-dynamic";
export function GET(request: Request) { return managementApi(request, actor => memberDirectory(actor, Object.fromEntries(new URL(request.url).searchParams))); }
export function POST(request: Request) { return managementApi(request, (actor, body) => createMember(actor, body)); }
