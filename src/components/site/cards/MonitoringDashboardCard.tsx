import type { MonitoringDashboardRecord } from "@/lib/content/monitoring";
import { ResponsiveImage } from "@/components/site/ui/ResponsiveImage";

export function MonitoringDashboardCard({ record }: { record: MonitoringDashboardRecord }) {
  return <article className="overflow-hidden border border-line-soft bg-default h-full w-full" data-monitoring-dashboard-card>
    <div className="p-4">
      <h3 className="break-words font-heading text-base leading-6 font-medium tracking-[-0.02em] text-[#0b5025]">{record.title}</h3>
    </div>
    <div className="aspect-video overflow-hidden border-y border-line-soft px-2">
      <ResponsiveImage src={record.image} sizes="(min-width: 1440px) 432px, (min-width: 1024px) calc((100vw - 96px) / 3), calc(100vw - 48px)" alt={record.image_alt} width="600" height="338" className="size-full object-cover" />
    </div>
    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 p-4 text-xs tracking-[-0.02em]">
      <a href={record.source_url} target="_blank" rel="noopener noreferrer" aria-label={`View full product: ${record.title}`}
        className="shrink-0 bg-brand px-2 py-1 leading-4 text-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        Full product
      </a>
      <p className="min-w-0 flex-1 break-words text-right text-secondary">Provided by: {record.provider}</p>
    </div>
  </article>;
}
