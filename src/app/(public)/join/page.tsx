import { sql } from "drizzle-orm";
import { adminConfig } from "@/lib/admin/config";
import { adminDatabase } from "@/lib/admin/database";
import { createApplicationToken } from "@/lib/membership/form-guard";
import { JoinForm } from "@/components/site/membership/JoinForm";
import { Container } from "@/components/site/ui/Container";
import { publishedPrivacyPolicy } from "@/lib/privacy/public";
export const dynamic = "force-dynamic";
export const metadata = { title: "Join NOSEE", robots: { index: false, follow: false } };
export default async function JoinPage() {
  const policy = await publishedPrivacyPolicy(), formToken = policy ? createApplicationToken(undefined,policy.version) : ""; let available = !!adminConfig() && !!formToken;
  try { if (available) await adminDatabase().db.execute(sql`select id from membership_application limit 0`); } catch { available = false; }
  return <div className="pt-[var(--expanded-navbar-offset)]"><Container className="py-10 lg:py-16"><div className="mx-auto max-w-2xl"><h1 className="font-heading text-[40px] leading-[48px] font-semibold lg:text-5xl lg:leading-14">Join NOSEE</h1><p className="mt-4 mb-8 text-base leading-6 text-secondary lg:text-lg">Apply for membership in the Network of Space-Earth Environmentalists. All fields are required. Your application will be reviewed privately.</p><JoinForm formToken={formToken} available={available} policy={policy} /></div></Container></div>;
}
