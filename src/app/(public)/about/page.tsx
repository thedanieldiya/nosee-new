import type { Metadata } from "next";
import { AboutPageContent } from "@/components/site/about/AboutPageContent";

export const metadata: Metadata = {
  title: "About NOSEE | NOSEE",
  // Original organisation/person fixtures still need owner publication approval.
  robots: { index: false, follow: false },
};

export default function AboutPage() {
  return <div className="pt-[var(--expanded-navbar-offset)]"><AboutPageContent /></div>;
}
