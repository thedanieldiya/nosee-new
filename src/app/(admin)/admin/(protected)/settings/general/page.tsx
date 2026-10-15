import { requirePermission } from "@/lib/admin/session";
import { roleLabels } from "@/lib/admin/policy";
import { ProfileForm, PasswordForm } from "@/components/admin/AccountForms";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
export const metadata = { title: "General" };
export default async function GeneralPage() {
  const principal = await requirePermission("account");
  return <main id="main-content" className="mx-auto max-w-5xl space-y-7 p-5 sm:p-8 lg:p-10"><div><h1 className="text-2xl font-semibold">General</h1><p className="mt-2 text-secondary">Manage your personal account details and security.</p></div><Card><CardHeader><h2 className="text-base font-semibold">Account details</h2><p className="text-sm text-secondary">Your name is visible within the administration workspace.</p></CardHeader><CardContent><ProfileForm firstName={principal.firstName} lastName={principal.lastName} /><div className="mt-6 space-y-2 border-t border-line-mild pt-6"><label htmlFor="account-email" className="font-medium">Email</label><Input id="account-email" name="email" type="email" value={principal.email} readOnly aria-describedby="email-guidance" className="bg-surface" /><p id="email-guidance" className="text-xs text-secondary">Email changes require administrator support. Email verification is not connected yet.</p></div><dl className="mt-5 text-sm"><dt className="font-medium">Access level</dt><dd className="mt-1 text-secondary">{roleLabels[principal.role]}</dd></dl><p className="mt-5 text-xs text-secondary">Profile photo uploads are not available yet.</p></CardContent></Card><Card><CardHeader><h2 className="text-base font-semibold">Password</h2><p className="text-sm text-secondary">Changing your password signs out your other sessions.</p></CardHeader><CardContent><PasswordForm /></CardContent></Card></main>;
}
