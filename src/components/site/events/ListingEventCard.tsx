/* eslint-disable @next/next/no-img-element -- Preserve original source SVG markup. */
import type { PresentedEvent } from "@/lib/content/events-listing";
import { ButtonLink } from "@/components/site/ui/ButtonLink";

export function ListingEventCard({ event }: { event: PresentedEvent }) {
  const type = event.presentation.type, usesDates = event.type === "meeting" || event.schedule.mode === "multi_day";
  const target = event.external ? "_blank" : undefined, rel = event.external ? "noopener noreferrer" : undefined;
  const deadline = event.presentation.application_deadline, closed = deadline === "Applications closed";
  return (
    <article className="card-hover-lift grid overflow-hidden border border-line-mild bg-default lg:grid-cols-[191px_minmax(0,1fr)_191px]" data-listing-event-card="">
      <div className={`flex flex-col items-center justify-center gap-3 border-b border-line-mild p-4 lg:row-span-1 lg:min-h-[184px] lg:border-r lg:border-b-0 ${type.duration_classes}`}>
        <img src={`/media/icons/${usesDates ? "CalendarDots" : "Clock"}.svg`} alt="" className={`size-8 ${event.type === "meeting" ? "brightness-0 invert" : ""}`} aria-hidden="true" />
        {usesDates ? <div className="flex items-baseline justify-center gap-4">
          <time dateTime={event.start_date} className="text-center">
            <span className="block text-2xl leading-7 font-medium">{event.presentation.start_date.day}</span>
            <span className="block text-sm leading-5">{event.presentation.start_date.month}</span>
          </time>
          {event.end_date && <><span className="text-xl" aria-hidden="true">–</span><time dateTime={event.end_date} className="text-center">
            <span className="block text-2xl leading-7 font-medium">{event.presentation.end_date.day}</span>
            <span className="block text-sm leading-5">{event.presentation.end_date.month}</span>
          </time></>}
        </div> : <div className="flex w-full items-center justify-between gap-4 px-1">
          <time dateTime={event.schedule.start_time!} className="text-xl leading-7 font-medium">{event.presentation.start_time}</time>
          {event.presentation.end_time && <><span className="text-secondary" aria-hidden="true">–</span><time dateTime={event.schedule.end_time!} className="text-xl leading-7 font-medium">{event.presentation.end_time}</time></>}
        </div>}
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-3 p-4 lg:min-h-[184px]">
        <p className={`w-fit px-2 py-0.5 text-xs leading-5 font-medium uppercase ${type.tag_classes}`}>{event.type.replaceAll("-", " ")}</p>
        <h4 className="font-heading text-xl leading-7 font-medium text-primary lg:text-2xl lg:leading-8">
          <a href={event.destination} target={target} rel={rel} className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{event.title}</a>
        </h4>
        <p className="text-sm leading-5 text-secondary lg:text-base">{event.summary}</p>
      </div>
      <div className="flex items-center gap-4 border-t border-line-mild p-4 lg:flex-col lg:justify-center lg:border-t-0 lg:border-l">
        <p className="flex min-w-0 flex-1 items-start gap-1 text-sm leading-5 text-secondary lg:flex-none lg:text-center">
          <img src="/media/icons/MapPin.svg" alt="" className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><span>{event.presentation.location}</span>
        </p>
        <ButtonLink href={event.destination} size="sm" variant="stroke" target={target} rel={rel} className="hidden max-w-full lg:inline-flex">
          <span className="truncate">{event.external ? `Explore ${event.title}` : "View details"}</span>
          <span className="shrink-0" aria-hidden="true"><img src={`/media/icons/${event.external ? "arrow-up-right" : "arrow-right"}.svg`} alt="" className="size-4" /></span>
        </ButtonLink>
      </div>
      {deadline && <p className={`border-t border-line-mild px-4 py-2 text-sm leading-5 lg:col-span-3 ${closed ? "font-medium text-secondary" : "text-primary"}`} data-application-deadline="">
        {closed ? deadline : <><span className="text-secondary">Apply before:</span>{" "}<time>{deadline}</time></>}
      </p>}
    </article>
  );
}
