import { eventZoneLabel } from "@/lib/events/presentation";
import { editorialLocal } from "@/lib/timezones";
/* eslint-disable @next/next/no-img-element -- Preserve original editorial images. */
import type { PresentedEvent } from "@/lib/content/events-listing";
import { ButtonLink } from "@/components/site/ui/ButtonLink";
import LocationRegular from "@mingcute/react/core-regular/location";
import ArrowRightRegular from "@mingcute/react/core-regular/arrow-right";
import ArrowRightUpRegular from "@mingcute/react/core-regular/arrow-right-up";

export function FeaturedEvent({ event }: { event: PresentedEvent }) {
  const target = event.external ? "_blank" : undefined, rel = event.external ? "noopener noreferrer" : undefined;
  const ActionIcon = event.external ? ArrowRightUpRegular : ArrowRightRegular;
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
          {/* Match the replaced image's cyclic max-width sizing in source grids. */}
          <span className="shrink-0" aria-hidden="true"><ActionIcon size={16} className="size-4 max-w-full" aria-hidden="true" focusable="false" data-ui-icon={event.external ? "arrow-up-right" : "arrow-right"} /></span>
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
        {event.start_at && <p className="text-sm text-secondary lg:text-center">{editorialLocal(event.start_at, event.timezone).time.slice(0,5)} · {eventZoneLabel(event.timezone, event.start_at)}</p>}
        <p className="flex min-w-0 items-start gap-1 text-sm leading-5 text-secondary lg:text-center">
          <LocationRegular size={20} className="mt-0.5 size-5 max-w-full shrink-0" aria-hidden="true" focusable="false" data-ui-icon="location" /><span>{event.presentation.location}</span>
        </p>
      </div>
    </article>
  );
}
