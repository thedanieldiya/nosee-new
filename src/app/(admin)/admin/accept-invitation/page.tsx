import Link from "next/link";
import { sql } from "drizzle-orm";
import { adminConfig } from "@/lib/admin/config";
import { adminDatabase } from "@/lib/admin/database";
import { AcceptInvitationForm } from "@/components/admin/AdministratorForms";
export const metadata = { title: "Set up your account", referrer: "no-referrer" };
export default async function AcceptInvitationPage() {
  let available = !!adminConfig();
  try { if (available) await adminDatabase().db.execute(sql`select id from admin_invitation limit 0`); } catch { available = false; }
  return <main id="main-content" className="flex min-h-screen items-center justify-center bg-surface px-5 py-12"><div className="w-full max-w-sm"><Link href="/" className="font-heading text-2xl font-bold text-brand">NOSEE</Link><h1 className="mt-8 text-2xl font-semibold">Set up your account</h1><p className="mt-2 mb-8 text-secondary">Use your emailed invitation to activate your administration account.</p><AcceptInvitationForm available={available} /><p className="mt-8 text-sm text-secondary"><Link href="/admin/sign-in" className="underline underline-offset-4">Return to sign in</Link></p></div></main>;
}
