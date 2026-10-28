import type { PublicationRecord } from "@/lib/content/publications";
import { Container } from "@/components/site/ui/Container";
import { ButtonLink } from "@/components/site/ui/ButtonLink";
import { ResearchOutputCard } from "@/components/site/cards/ResearchOutputCard";

export function HomeResearchOutputs({ records = [] }: { records?: readonly PublicationRecord[] }) {
  return <section className="bg-default py-8 lg:py-16" aria-labelledby="research-outputs-heading" data-research-outputs-section data-reveal-section>
    <Container><div className="flex flex-col gap-8 lg:gap-12">
      <header className="flex items-center justify-center lg:justify-between">
        <h2 id="research-outputs-heading" className="text-center font-heading text-[28px] leading-8 font-semibold lg:text-left lg:text-5xl lg:leading-[56px]" data-reveal-heading>Research Outputs</h2>
        <div className="hidden lg:block" data-research-outputs-desktop-cta data-reveal-actions>
          <ButtonLink href="/publications" className="px-6 tracking-[0.06em]">SEE ALL OUTPUTS</ButtonLink>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8" data-research-output-cards data-reveal-group>
        {records.map(record => <div key={record.slug} className="h-full" data-reveal-item><ResearchOutputCard record={record} /></div>)}
      </div>
      <div className="flex justify-center lg:hidden" data-research-outputs-mobile-cta data-reveal-actions>
        <ButtonLink href="/publications" className="px-6 tracking-[0.06em]">SEE ALL OUTPUTS</ButtonLink>
      </div>
    </div></Container>
  </section>;
}
