import type { Metadata } from "next";
import { HomeHero } from "@/components/site/sections/HomeHero";
import { HomeMonitoringDashboard } from "@/components/site/sections/HomeMonitoringDashboard";

export const metadata: Metadata = {
  title: "NOSEE",
  // Interim setting until all original homepage sections have passed review.
  robots: { index: false, follow: false },
};

export default function HomePage() {
  return <><HomeHero /><HomeMonitoringDashboard /></>;
}
