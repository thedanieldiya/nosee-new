import { homepageMonitoringRecords } from "@/lib/content/monitoring";
import { Container } from "@/components/site/ui/Container";
import { ButtonLink } from "@/components/site/ui/ButtonLink";
import { MonitoringDashboardCard } from "@/components/site/cards/MonitoringDashboardCard";

export function HomeMonitoringDashboard() {
  return <section className="bg-surface py-10 lg:py-16" aria-labelledby="monitoring-dashboard-heading"
    data-monitoring-dashboard-section data-reveal-section>
    <Container>
      <div className="flex flex-col items-center gap-6 lg:gap-12">
        <header className="flex items-center justify-center lg:justify-between w-full">
          <h2 id="monitoring-dashboard-heading" className="text-center font-heading text-xl leading-6 font-medium lg:text-[28px] lg:leading-10" data-reveal-heading>
            EARTH-SPACE ENVIRONMENT MONITORING DASHBOARD
          </h2>
          <div className="hidden lg:block" data-research-outputs-desktop-cta data-reveal-actions>
            <ButtonLink href="/data" className="px-6 tracking-[0.06em]">SEE ALL DATA</ButtonLink>
          </div>
        </header>
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:gap-8" data-monitoring-dashboard-cards data-reveal-group>
          {homepageMonitoringRecords.map(record => <div key={record.slug} className="card-hover-lift w-full lg:min-w-0 lg:flex-1">
            <div className="h-full" data-reveal-item>
              <MonitoringDashboardCard record={record} />
            </div>
          </div>)}
        </div>
        <div data-reveal-actions>
          <ButtonLink href="/data" className="px-6 tracking-[0.06em] block lg:hidden">ALL DATA</ButtonLink>
        </div>
      </div>
    </Container>
  </section>;
}
