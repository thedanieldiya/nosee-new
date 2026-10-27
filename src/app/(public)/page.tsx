import { homepageEvents } from "@/lib/events/homepage";
import { homepageNews } from "@/lib/news/homepage";
import type { Metadata } from "next";
import { HomeHero } from "@/components/site/sections/HomeHero";
import { HomeMonitoringDashboard } from "@/components/site/sections/HomeMonitoringDashboard";
import { HomeResearchOutputs } from "@/components/site/sections/HomeResearchOutputs";
import { HomeTrendingNews } from "@/components/site/sections/HomeTrendingNews";
import { HomeUpcomingEvents } from "@/components/site/sections/HomeUpcomingEvents";

// Match Laravel's per-request UTC calendar-day selection; never freeze events at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NOSEE",
  // Interim setting until all original homepage sections have passed review.
  robots: { index: false, follow: false },
};

export default async function HomePage() {
  const [articles, events] = await Promise.all([homepageNews(), homepageEvents()]);
  return <><HomeHero /><HomeMonitoringDashboard /><HomeResearchOutputs /><HomeTrendingNews articles={articles} /><HomeUpcomingEvents events={events} /></>;
}
