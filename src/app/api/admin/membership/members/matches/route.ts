import { managementApi } from "@/lib/admin/management-api";
import { memberMatches } from "@/lib/membership/members";
export const dynamic = "force-dynamic";
// Identity search values stay in a protected POST body, not a URL/access log.
export function POST(request: Request) { return managementApi(request, (actor, body) => memberMatches(actor, body)); }
