import { heroItems, type HeroItem } from "@/lib/content/homepage";
import { Container } from "@/components/site/ui/Container";
import { ButtonLink } from "@/components/site/ui/ButtonLink";
import { ArrowRight } from "@/components/site/ui/ArrowRight";
import { HeroController } from "./HeroController";
import { ResponsiveImage } from "@/components/site/ui/ResponsiveImage";
import { imageSourceSet } from "@/lib/content/public-images";

const heroSizes = "(min-width: 1024px) 100vw, 968px";

export function HomeHero({ items = heroItems }: { items?: readonly HeroItem[] }) {
  return <section className="relative h-[750px] touch-pan-y overflow-hidden bg-primary text-inverse lg:h-[850px]"
    role="region" aria-roledescription="carousel" aria-label="Featured homepage content"
    data-homepage-motion data-home-hero data-hero-carousel>
    {items[0] && imageSourceSet(items[0].image, "avif") && <link rel="preload" as="image" type="image/avif" imageSrcSet={imageSourceSet(items[0].image, "avif")} imageSizes={heroSizes} fetchPriority="high" />}
    <div className="absolute inset-0" data-hero-entrance-visual>
      <div className="absolute inset-0 flex h-full transition-transform duration-[400ms] ease-in-out motion-reduce:transition-none" data-hero-track>
        {items.map((item, index) => <div key={item.id} className="relative h-full w-full shrink-0 overflow-hidden" aria-hidden={index !== 0} data-hero-image-slide>
          <ResponsiveImage src={item.image} sizes={heroSizes} alt={item.image_alt} width="1440" height="850" fetchPriority={index === 0 ? "high" : "low"} loading="eager"
            className="absolute top-0 left-1/2 h-full w-[968px] max-w-none -translate-x-1/2 object-cover object-center lg:inset-0 lg:w-full lg:translate-x-0" />
        </div>)}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-black/75" aria-hidden="true" />
    </div>
    <Container className="relative h-full">
      {items.map((item, index) => <article key={item.id}
        className={`absolute inset-0 transition-[opacity,filter] duration-[400ms] ease-in-out motion-reduce:transition-none motion-reduce:blur-none ${index === 0 ? "opacity-100 blur-none" : "pointer-events-none opacity-0 blur-sm"}`}
        role="group" aria-roledescription="slide" aria-label={`Slide ${index + 1} of ${items.length}`} aria-hidden={index !== 0} inert={index !== 0}
        data-hero-content-slide data-slide-id={item.id}>
        <div className="absolute top-1/2 mt-20 right-4 left-4 flex -translate-y-1/2 flex-col items-start gap-5 lg:right-auto lg:left-[120px] lg:mt-10 lg:w-[852px] lg:gap-0">
          <p className="rounded-[2px] bg-white/40 px-2.5 py-1.5 text-xs leading-4 text-primary uppercase" data-hero-entrance-eyebrow={index === 0 ? "" : undefined}>{item.eyebrow}</p>
          <div className="flex w-full flex-col gap-3 text-inverse lg:mt-1 lg:gap-4">
            <h1 className="font-heading text-[28px] leading-8 font-semibold lg:text-[56px] lg:leading-[64px]" data-hero-entrance-title={index === 0 ? "" : undefined}>{item.title}</h1>
            <p className="max-w-[525px] text-base lg:text-xl" data-hero-entrance-summary={index === 0 ? "" : undefined}>{item.summary}</p>
          </div>
          <div className="lg:mt-8" data-hero-entrance-cta={index === 0 ? "" : undefined}>
            <ButtonLink href={item.cta_url} size="lg" className="gap-10 px-6 tracking-[0.06em] uppercase">
              {item.cta_label}<span className="shrink-0" aria-hidden="true"><ArrowRight /></span>
            </ButtonLink>
          </div>
        </div>
        <p className="absolute right-[120px] bottom-[75px] hidden max-w-[294px] text-right text-sm leading-[18px] lg:block"
          data-hero-entrance-credit={index === 0 ? "" : undefined}>{item.image_credit}</p>
      </article>)}
    </Container>
    {items.length > 1 && <Container className="pointer-events-none absolute inset-x-0 bottom-4 lg:bottom-8" data-hero-controls>
      <div className="pointer-events-auto flex gap-2 lg:ml-[88px] xl:ml-14" aria-label="Hero slides" data-hero-entrance-indicators>
        {items.map((item, index) => <button key={item.id} type="button"
          className={`size-3 rounded-full border border-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${index === 0 ? "bg-inverse" : "bg-transparent"}`}
          aria-label={`Show slide ${index + 1}: ${item.title}`} aria-current={index === 0 ? "true" : "false"} data-hero-indicator data-slide-index={index} />)}
      </div>
    </Container>}
    <HeroController />
  </section>;
}
