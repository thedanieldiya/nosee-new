import { aboutLeadership } from "@/lib/site-content/rendering";
import { about } from "@/lib/content/about";
import type { Metadata } from "next";
import { AboutPageContent } from "@/components/site/about/AboutPageContent";

export const metadata: Metadata = {
  title: "About NOSEE | NOSEE",
  // Original organisation/person fixtures still need owner publication approval.
  robots: { index: false, follow: false },
};

export const dynamic="force-dynamic";
export default async function AboutPage() {
  const content=await aboutLeadership();
  return <div className="pt-[var(--expanded-navbar-offset)]"><AboutPageContent leadership={{title:about.leadership.title,intro:content.legacy?about.leadership.intro:"",people:content.people,unavailable:content.unavailable}} /></div>;
}
