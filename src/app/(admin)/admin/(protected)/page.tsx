import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requirePermission } from "@/lib/admin/session";
import { adminDatabase } from "@/lib/admin/database";
import { auditLog } from "@/lib/admin/schema";
import { roleLabels } from "@/lib/admin/policy";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
export const metadata = { title: "Overview" };
export default async function OverviewPage() {
  const principal = await requirePermission("overview");
  const activity = await adminDatabase().db.select({ id: auditLog.id, action: auditLog.action, createdAt: auditLog.createdAt }).from(auditLog).where(eq(auditLog.actorId, principal.id)).orderBy(desc(auditLog.createdAt)).limit(5);
  const descriptions = { super_admin: "Your organisation workspace", editor: "Your publishing and website workspace", research_group_lead: "Your assigned research-group workspace" };
  return <main id="main-content" className="mx-auto max-w-6xl space-y-7 p-5 sm:p-8 lg:p-10"><div><h1 className="text-2xl font-semibold">Overview</h1><p className="mt-2 text-secondary">Welcome back, {principal.firstName}.</p></div><Card><CardHeader><h2 className="text-base font-semibold">{descriptions[principal.role]}</h2><p className="text-sm text-secondary">{roleLabels[principal.role]}</p></CardHeader><CardContent><p className="max-w-2xl leading-relaxed text-secondary">Your account is ready. Additional modules are not available yet; they are marked in the navigation. You can manage your personal details and account security in General settings.</p><Button asChild className="mt-5"><Link href="/admin/settings/general">Manage your account</Link></Button></CardContent></Card><Card><CardHeader><h2 className="text-base font-semibold">Your recent account activity</h2></CardHeader><CardContent>{activity.length ? <ul className="divide-y divide-line-mild">{activity.map(event => <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"><span>{event.action}</span><time dateTime={event.createdAt.toISOString()} className="text-xs text-secondary">{event.createdAt.toLocaleString("en-GB", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" })} WAT</time></li>)}</ul> : <p className="text-secondary">No account activity recorded yet.</p>}</CardContent></Card></main>;
}
