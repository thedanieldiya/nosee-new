import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { adminConfig } from "@/lib/admin/config";
import { administrator } from "@/lib/admin/session";
import { adminDatabase } from "@/lib/admin/database";
import { SignInForm } from "@/components/admin/AccountForms";
export const metadata = { title: "Sign in" };
export default async function SignInPage() {
  let principal = null, available = !!adminConfig();
  try { principal = await administrator(await headers()); if (available) await adminDatabase().db.execute(sql`select id from administrator limit 0`); } catch { available = false; }
  if (principal) redirect("/admin");
  return <main id="main-content" className="flex min-h-screen items-center justify-center bg-surface px-5 py-12"><div className="w-full max-w-sm"><Link href="/" className="font-heading text-2xl font-bold text-brand">NOSEE</Link><h1 className="mt-8 text-2xl font-semibold">Sign in to administration</h1><p className="mt-2 mb-8 text-sm text-secondary">Use your administrator account to continue.</p><SignInForm available={available} /><p className="mt-8 text-sm text-secondary">Access is by invitation. Contact your administrator if you need help signing in.</p></div></main>;
}
