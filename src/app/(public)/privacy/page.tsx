import { Container } from "@/components/site/ui/Container";
import { PrivacyPolicyContent } from "@/components/site/privacy/PrivacyPolicyContent";
export const metadata = { title: "Privacy policy — development placeholder", robots: { index: false, follow: false } };
export default function PrivacyPlaceholder() {
  return <div className="pt-[var(--expanded-navbar-offset)]"><Container className="py-10 lg:py-16"><article className="mx-auto max-w-2xl"><h1 className="font-heading text-[40px] leading-[48px] font-semibold lg:text-5xl lg:leading-14">Privacy policy</h1><PrivacyPolicyContent /></article></Container></div>;
}
