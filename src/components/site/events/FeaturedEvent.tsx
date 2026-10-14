/* eslint-disable @next/next/no-img-element -- Preserve the pinned Blade image elements and original SVGs. */
import type { PresentedEvent } from "@/lib/content/events-listing";
import { ButtonLink } from "@/components/site/ui/ButtonLink";

export function FeaturedEvent({ event }: { event: PresentedEvent }) {
  const target = event.external ? "_blank" : undefined, rel = event.external ? "noopener noreferrer" : undefined;
  return (
    <article className="card-hover-lift grid overflow-hidden border border-line-soft bg-default lg:grid-cols-[minmax(0,415px)_minmax(0,1fr)_191px]" data-featured-event="">
      <div className="min-h-52 bg-[#d9d9d9] lg:min-h-[308px]">
        {event.image && <img src={event.image} alt={event.image_alt ?? ""} className="h-full w-full object-cover" />}
      </div>
      <div className="flex flex-col items-start justify-center gap-4 border-b border-line-soft p-5 sm:p-6 lg:border-r lg:border-b-0 lg:p-8">
        <p className="bg-surface px-3 py-1 text-sm leading-6 text-primary uppercase">Featured event</p>
        <h2 className="font-heading text-[28px] leading-9 font-medium text-primary">
          <a href={event.destination} target={target} rel={rel} className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{event.title}</a>
        </h2>
        <p className="font-body text-base leading-5 text-secondary">{event.summary}</p>
        <ButtonLink href={event.destination} variant="stroke" target={target} rel={rel} className="max-w-full">
          <span className="truncate">{event.external ? `Explore ${event.title}` : "View details"}</span>
          <span className="shrink-0" aria-hidden="true"><img src={`/media/icons/${event.external ? "arrow-up-right" : "arrow-right"}.svg`} alt="" className="size-4" /></span>
        </ButtonLink>
      </div>
      <div className="flex items-center gap-5 p-5 sm:p-6 lg:flex-col lg:justify-center lg:gap-8 lg:p-4">
        <div className="flex shrink-0 items-baseline gap-3 lg:w-full lg:justify-center">
          <time dateTime={event.start_date} className="text-center">
            <span className="block font-heading text-[32px] leading-8 font-medium">{event.presentation.start_date.day}</span>
            <span className="block text-sm leading-5 text-secondary">{event.presentation.start_date.month}</span>
          </time>
          {event.end_date && <><span className="text-2xl text-secondary" aria-hidden="true">–</span><time dateTime={event.end_date} className="text-center">
            <span className="block font-heading text-[32px] leading-8 font-medium">{event.presentation.end_date.day}</span>
            <span className="block text-sm leading-5 text-secondary">{event.presentation.end_date.month}</span>
          </time></>}
        </div>
        <p className="flex min-w-0 items-start gap-1 text-sm leading-5 text-secondary lg:text-center">
          <img src="/media/icons/MapPin.svg" alt="" className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><span>{event.presentation.location}</span>
        </p>
      </div>
    </article>
  );
}
