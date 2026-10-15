export type AdminRole = "super_admin" | "editor" | "research_group_lead";
export type Principal = { id: string; firstName: string; lastName: string; email: string; role: AdminRole; researchGroupId: string | null; accessVersion?: number };
export type Permission = "overview" | "account" | "membership" | "research" | "publishing" | "website" | "administrators" | "activity";
export const roleLabels: Record<AdminRole, string> = { super_admin: "Super Admin", editor: "Editor", research_group_lead: "Research Group Lead" };
export function canAccess(principal: Pick<Principal, "role" | "researchGroupId">, permission: Permission, groupId?: string) {
  if (principal.role === "super_admin") return true;
  if (principal.role !== "editor" && principal.role !== "research_group_lead") return false;
  if (principal.role === "research_group_lead" && !principal.researchGroupId) return false;
  if (permission === "overview" || permission === "account") return true;
  if (principal.role === "editor") return permission === "publishing" || permission === "website";
  return permission === "research" && !!groupId && groupId === principal.researchGroupId;
}
export function pathPermission(path: string[]): { permission: Permission; groupId?: string } | null {
  const [module, item] = path;
  if (module === "membership") return { permission: "membership" };
  if (module === "publishing") return { permission: "publishing" };
  if (module === "website") return { permission: "website" };
  if (module === "research") return { permission: "research", groupId: item };
  if (module === "settings" && item === "administrators") return { permission: "administrators" };
  if (module === "settings" && item === "activity-log") return { permission: "activity" };
  return null;
}
export function adminNavigation(principal: Principal) {
  const entries = [
    { label: "Overview", href: "/admin", permission: "overview" as Permission, icon: "home", available: true },
    { label: "Membership", href: "/admin/membership/applications", permission: "membership" as Permission, icon: "members", available: false },
    { label: "Research", href: principal.role === "research_group_lead" ? `/admin/research/${principal.researchGroupId}` : "/admin/research", permission: "research" as Permission, icon: "research", available: false },
    { label: "Publishing", href: "/admin/publishing/news", permission: "publishing" as Permission, icon: "publishing", available: false },
    { label: "Website", href: "/admin/website/site-content", permission: "website" as Permission, icon: "website", available: false },
    { label: "General", href: "/admin/settings/general", permission: "account" as Permission, icon: "settings", available: true },
    { label: "Administrators", href: "/admin/settings/administrators", permission: "administrators" as Permission, available: true },
    { label: "Activity log", href: "/admin/settings/activity-log", permission: "activity" as Permission, available: true },
  ];
  return entries.filter(entry => canAccess(principal, entry.permission, principal.researchGroupId ?? undefined));
}
