import { managementApi } from "@/lib/admin/management-api";
import { activityDirectory } from "@/lib/admin/management-queries";
import { activityInput } from "@/lib/admin/management-input";
import { ManagementError } from "@/lib/admin/management";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return managementApi(request, actor => {
    const query = activityInput.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) throw new ManagementError("Use valid activity filters and date boundaries.");
    return activityDirectory(actor, query.data);
  });
}
