/* eslint-disable @next/next/no-img-element -- Preserve source lazy images and square crops. */
import { RichDescription } from "@/components/site/ui/RichDescription";
import type { AboutProfile } from "@/lib/content/about";
import { buttonClasses } from "@/components/site/ui/ButtonLink";
import { ArrowRight } from "@/components/site/ui/ArrowRight";
import { ProfileCarouselController } from "./ProfileCarouselController";

export function ProfileCarousel({ leadership }: { leadership: {title:string;intro:string;people:readonly AboutProfile[];unavailable?:boolean} }) {
  const { title, intro, people: profiles } = leadership;
  return <section id="leadership" className="scroll-mt-32 mt-24 xl:mt-[120px]" role="region" aria-roledescription="carousel" aria-labelledby="leadership-heading" data-profile-carousel="">
    <header className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div>
        <div className="flex items-center gap-3">
          <span className="h-2 w-10 shrink-0 bg-brand" aria-hidden="true" />
          <h2 id="leadership-heading" className="font-heading text-[30px] leading-9 font-semibold text-primary sm:text-[36px] sm:leading-[44px] xl:text-[40px] xl:leading-[48px]">{title}</h2>
        </div>
        {intro && <p className="mt-5 max-w-3xl text-base leading-6 text-secondary sm:text-lg sm:leading-7">{intro}</p>}
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
    {!profiles.length&&<p className="mt-10 text-secondary">{leadership.unavailable?"Leadership content is temporarily unavailable.":"No leadership profiles are published."}</p>}
    <div className="mt-10 touch-pan-y overflow-hidden" data-profile-viewport="">
      <div className="flex gap-4 transition-transform duration-[400ms] ease-in-out motion-reduce:transition-none lg:gap-8" data-profile-track="">
        {profiles.map((profile, index) => <figure key={profile.id??profile.name} className="w-full shrink-0 sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-4rem)/3)]" role="group" aria-roledescription="slide" aria-label={`Profile ${index + 1} of ${profiles.length}`} data-profile-slide="">
          {profile.image ? <img src={profile.image} alt={profile.image_alt} width="400" height="400" loading="lazy" className="aspect-square w-full object-cover" /> : <div className="aspect-square w-full bg-surface" role="img" aria-label="Portrait not provided" />}
          <figcaption className="mt-3 border-t border-line-strong pt-3">
            <h3 className="font-heading text-lg leading-6 font-semibold text-primary uppercase">{profile.name}</h3>
            <p className="mt-1 text-sm leading-5 text-secondary">{profile.title}</p>
            {profile.category&&<p className="mt-2 text-xs text-secondary">{profile.category}</p>}
            {profile.affiliation&&<p className="mt-2 text-sm text-secondary">{profile.affiliation}</p>}
            {profile.researchInterests&&<p className="mt-2 text-sm text-secondary">{profile.researchInterests}</p>}
            {profile.biography&&<div className="mt-4 space-y-3 text-sm leading-6 text-secondary"><RichDescription value={profile.biography} /></div>}
          </figcaption>
        </figure>)}
      </div>
    </div>
    <div className={`mt-8 flex items-center justify-center ${profiles.length > 12 ? "flex-wrap gap-y-2" : "h-2"}`} aria-label={`${title} profile groups`} data-profile-indicators="">
      {profiles.map((profile, index) => <button key={profile.id??profile.name} type="button" className="flex size-6 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent" aria-label={`Show profile ${index + 1}: ${profile.name}`} aria-current={index === 0 ? "true" : "false"} data-profile-indicator=""><span aria-hidden="true" data-profile-indicator-dot className={`size-2 rounded-full ${index === 0 ? "bg-brand" : "bg-disabled"}`} /></button>)}
    </div>
    <ProfileCarouselController />
  </section>;
}
