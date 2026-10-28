import type { PublicationRecord } from "@/lib/content/publications";
import { ButtonLink } from "@/components/site/ui/ButtonLink";
import { ArrowRight } from "@/components/site/ui/ArrowRight";

export function ResearchOutputCard({ record }: { record: PublicationRecord }) {
  return <article className="flex w-full min-w-0 flex-col gap-4 border border-line-soft p-4 lg:flex-1 lg:gap-6 lg:border-0 lg:p-0" data-research-output-card>
    <header className="flex flex-col gap-3">
      <p className="font-body text-sm leading-5 tracking-[0.02em] text-brand lg:text-lg lg:leading-6">{record.research_area ? record.research_area.replaceAll("-", " ").toUpperCase() : "RESEARCH OUTPUT"}</p>
      <div className="border-t border-line-mild" aria-hidden="true" />
    </header>
    <div className="flex flex-col gap-5 lg:gap-8">
      <h3 className="font-body text-lg leading-6 font-medium text-primary lg:text-2xl lg:leading-8 lg:font-normal"><a href={"/publications/"+record.slug} className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{record.title}</a></h3>
      <div className="flex flex-col gap-3 text-sm leading-5 lg:gap-4 lg:text-lg lg:leading-6">
        <p className="text-primary">{record.authors.join(", ")}</p>
        <p className="italic text-secondary">{[record.publication_date.slice(0, 4),record.publication_source].filter(Boolean).join(", ")}</p>
      </div>
    </div>
    <div className="hidden lg:block">
      <ButtonLink href={"/publications/"+record.slug} intent="primary" variant="stroke"
        aria-label={`View publication: ${record.title}`} className="gap-10 pl-5 pr-4 tracking-[-0.02em]">
        View publication<span className="shrink-0" aria-hidden="true"><ArrowRight /></span>
      </ButtonLink>
    </div>
  </article>;
}
