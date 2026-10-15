import { managementApi } from "@/lib/admin/management-api";
import { ManagementError } from "@/lib/admin/management";
import { applicationQuery } from "@/lib/membership/input";
import { listMembershipApplications } from "@/lib/membership/service";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return managementApi(request, actor => {
    const query = applicationQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) throw new ManagementError("Use valid application filters.");
    return listMembershipApplications(actor, query.data);
  });
}
