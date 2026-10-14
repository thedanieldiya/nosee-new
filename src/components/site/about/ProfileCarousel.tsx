/* eslint-disable @next/next/no-img-element -- Preserve source lazy images and square crops. */
import type { AboutContent } from "@/lib/content/about";
import { buttonClasses } from "@/components/site/ui/ButtonLink";
import { ArrowRight } from "@/components/site/ui/ArrowRight";
import { ProfileCarouselController } from "./ProfileCarouselController";

export function ProfileCarousel({ leadership }: { leadership: AboutContent["leadership"] }) {
  const { title, intro, people: profiles } = leadership;
  return <section id="leadership" className="scroll-mt-32 mt-24 xl:mt-[120px]" role="region" aria-roledescription="carousel" aria-labelledby="leadership-heading" data-profile-carousel="">
    <header className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div>
        <div className="flex items-center gap-3">
          <span className="h-2 w-10 shrink-0 bg-brand" aria-hidden="true" />
          <h2 id="leadership-heading" className="font-heading text-[30px] leading-9 font-semibold text-primary sm:text-[36px] sm:leading-[44px] xl:text-[40px] xl:leading-[48px]">{title}</h2>
        </div>
        <p className="mt-5 max-w-3xl text-base leading-6 text-secondary sm:text-lg sm:leading-7">{intro}</p>
      </div>
      <div className="hidden items-center gap-1 sm:flex" aria-label={`${title} carousel controls`} data-profile-arrows="">
        <button type="button" className={buttonClasses({ size: "sm", intent: "secondary", variant: "text", iconOnly: true })} aria-label={`Show previous ${title.toLowerCase()} profiles`} data-profile-previous="">
          <span className="shrink-0" aria-hidden="true"><ArrowRight className="rotate-180" /></span>
        </button>
        <button type="button" className={buttonClasses({ size: "sm", intent: "secondary", variant: "text", iconOnly: true })} aria-label={`Show next ${title.toLowerCase()} profiles`} data-profile-next="">
          <span className="shrink-0" aria-hidden="true"><ArrowRight /></span>
        </button>
      </div>
    </header>
    <div className="mt-10 touch-pan-y overflow-hidden" data-profile-viewport="">
      <div className="flex gap-4 transition-transform duration-[400ms] ease-in-out motion-reduce:transition-none lg:gap-8" data-profile-track="">
        {profiles.map((profile, index) => <figure key={profile.name} className="w-full shrink-0 sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-4rem)/3)]" role="group" aria-roledescription="slide" aria-label={`Profile ${index + 1} of ${profiles.length}`} data-profile-slide="">
          <img src={profile.image} alt={profile.image_alt} width="400" height="400" loading="lazy" className="aspect-square w-full object-cover" />
          <figcaption className="mt-3 border-t border-line-strong pt-3">
            <h3 className="font-heading text-lg leading-6 font-semibold text-primary uppercase">{profile.name}</h3>
            <p className="mt-1 text-sm leading-5 text-secondary">{profile.title}</p>
          </figcaption>
        </figure>)}
      </div>
    </div>
    <div className="mt-8 flex justify-center gap-2" aria-label={`${title} profile groups`} data-profile-indicators="">
      {profiles.map((profile, index) => <button key={profile.name} type="button" className={`size-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${index === 0 ? "bg-brand" : "bg-disabled"}`} aria-label={`Show profile ${index + 1}: ${profile.name}`} aria-current={index === 0 ? "true" : "false"} data-profile-indicator="" />)}
    </div>
    <ProfileCarouselController />
  </section>;
}
