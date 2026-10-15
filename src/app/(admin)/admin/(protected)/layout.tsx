import type { ReactNode } from "react";
import { requireAdministrator } from "@/lib/admin/session";
import { adminNavigation } from "@/lib/admin/policy";
import { AdminShell } from "@/components/admin/AdminShell";
export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const principal = await requireAdministrator();
  return <AdminShell principal={principal} navigation={adminNavigation(principal)}>{children}</AdminShell>;
}
