import { notFound, redirect } from "next/navigation";
import { requireAdministrator, requirePermission } from "@/lib/admin/session";
import { pathPermission } from "@/lib/admin/policy";
export default async function FutureAdminRoute({ params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path, target = pathPermission(path);
  if (!target) { await requireAdministrator(); notFound(); }
  const principal = await requireAdministrator();
  if (path.length === 1 && path[0] === "research" && principal.role === "research_group_lead") redirect(`/admin/research/${principal.researchGroupId}`);
  await requirePermission(target.permission, target.groupId);
  // Authorised future destinations remain unimplemented; no fake editor or data.
  notFound();
}
