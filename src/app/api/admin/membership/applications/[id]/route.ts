import { z } from "zod";
import { managementApi } from "@/lib/admin/management-api";
import { ManagementError } from "@/lib/admin/management";
import { decideMembershipApplication, getMembershipApplication } from "@/lib/membership/service";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  return managementApi(request, async actor => {
    const { id } = await context.params; if (!z.uuid().safeParse(id).success) throw new ManagementError("Application not found.", 404);
    const application = await getMembershipApplication(actor, id); if (!application) throw new ManagementError("Application not found.", 404);
    return application;
  });
}
export async function POST(request: Request, context: Context) {
  return managementApi(request, async (actor, body) => {
    const { id } = await context.params; if (!z.uuid().safeParse(id).success) throw new ManagementError("Application not found.", 404);
    return decideMembershipApplication(actor, id, body);
  });
}
