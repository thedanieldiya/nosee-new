import { Container } from "@/components/site/ui/Container";
import { PrivacyPolicyContent } from "@/components/site/privacy/PrivacyPolicyContent";
import { publishedPrivacyPolicy } from "@/lib/privacy/public";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const policy=await publishedPrivacyPolicy();return { title: policy?.isPlaceholder ? "Privacy policy — development placeholder" : policy?.title ?? "Privacy policy", robots: {index:false,follow:false} }; }
export default async function PrivacyPage() {
  const policy=await publishedPrivacyPolicy();
  return <div className="pt-[var(--expanded-navbar-offset)]"><Container className="py-10 lg:py-16"><article className="mx-auto max-w-2xl"><h1 className="font-heading text-[40px] leading-[48px] font-semibold lg:text-5xl lg:leading-14">{policy?.title ?? "Privacy policy"}</h1>{policy ? <>{policy.effectiveDate && <p className="mt-4 text-secondary">Effective <time dateTime={policy.effectiveDate}>{policy.effectiveDate}</time></p>}<PrivacyPolicyContent body={policy.body} /></> : <p role="status" className="mt-4 text-secondary">The privacy policy is temporarily unavailable. Please try again later.</p>}</article></Container></div>;
}
