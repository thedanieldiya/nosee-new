import { z } from "zod";
import { managementApi } from "@/lib/admin/management-api";
import { ManagementError } from "@/lib/admin/management";
import { applicationEmailSummary } from "@/lib/membership/email-outbox";
export const dynamic = "force-dynamic";
export function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return managementApi(request, async actor => { const { id } = await context.params; if (!z.uuid().safeParse(id).success) throw new ManagementError("Application not found.", 404); return applicationEmailSummary(actor, id); });
}
