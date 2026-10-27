import type { PresentedEvent } from "@/lib/content/events-listing";
import { Container } from "@/components/site/ui/Container";
import { ButtonLink } from "@/components/site/ui/ButtonLink";
import ArrowRightUpRegular from "@mingcute/react/core-regular/arrow-right-up";

import { RichDescription } from "@/components/site/ui/RichDescription";
import { eventScheduleZoneLabel } from "@/lib/events/presentation";

export function EventDetail({ event }: { event: PresentedEvent }) {
  const p = event.presentation;
  return <div className="pt-[var(--expanded-navbar-offset)]">
    <article className="pb-20" data-event-detail-page="" data-event-state={event.state}>
      <Container className="pt-10 lg:pt-6">
        <header className="max-w-5xl border-b border-line-soft pb-8 lg:pb-12">
          <p className={`w-fit px-3 py-1 text-sm leading-6 font-medium uppercase ${p.type.tag_classes}`}>{event.type.replaceAll("-", " ")}</p>
          <h1 className="mt-4 font-heading text-[40px] leading-[48px] font-semibold text-primary lg:text-[56px] lg:leading-[64px]">{event.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-7 text-secondary lg:text-xl lg:leading-8">{event.summary}</p>
        </header>
        <section className="grid border-b border-line-soft sm:grid-cols-2 lg:grid-cols-4" aria-label="Event information">
          <div className="border-b border-line-soft py-6 sm:border-r sm:pr-6 lg:border-b-0">
            <h2 className="text-sm leading-5 font-medium text-secondary uppercase">Date</h2>
            <p className="mt-2 font-heading text-xl leading-7 font-medium text-primary">{p.date_range}</p>
          </div>
          {p.start_time && <div className="border-b border-line-soft py-6 sm:pl-6 lg:border-r lg:border-b-0 lg:px-6">
            <h2 className="text-sm leading-5 font-medium text-secondary uppercase">Time</h2>
            <p className="mt-2 font-heading text-xl leading-7 font-medium text-primary">{p.start_time}{p.end_time && ` – ${p.end_time}`}</p>
            <p className="mt-1 text-sm leading-5 text-secondary">{event.start_at ? eventScheduleZoneLabel(event.timezone, event.start_at, event.end_at!) : event.timezone}</p>
          </div>}
          <div className="border-b border-line-soft py-6 sm:border-r sm:pr-6 lg:border-b-0 lg:px-6">
            <h2 className="text-sm leading-5 font-medium text-secondary uppercase">Location</h2>
            <p className="mt-2 text-base leading-6 text-primary">{p.location}</p>
          </div>
          {p.application_deadline && <div className="py-6 sm:pl-6">
            <h2 className="text-sm leading-5 font-medium text-secondary uppercase">Application</h2>
            {p.application_deadline === "Applications closed"
              ? <p className="mt-2 font-heading text-xl leading-7 font-medium text-primary">Applications closed</p>
              : <p className="mt-2 text-base leading-6 text-primary"><span className="text-secondary">Apply before</span><br />{p.application_deadline}</p>}
          </div>}
        </section>
        {event.registration_url && <div className="mt-8">
          <ButtonLink href={event.registration_url} size="lg" target="_blank" rel="noopener noreferrer">REGISTER<span className="shrink-0" aria-hidden="true"><ArrowRightUpRegular size={16} className="size-4 max-w-full" aria-hidden="true" focusable="false" data-ui-icon="arrow-up-right" /></span></ButtonLink>
        </div>}
        <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-14">
            <section aria-labelledby="event-description-heading">
              <h2 id="event-description-heading" className="font-heading text-[32px] leading-9 font-medium text-primary">About this event</h2>
              {typeof event.body === "string" ? <p className="mt-5 whitespace-pre-line text-base leading-7 text-secondary">{event.body}</p> : <div className="mt-5 text-base leading-7 text-secondary"><RichDescription value={event.body} /></div>}
            </section>
            {p.itinerary.length > 0 && <section aria-labelledby="event-itinerary-heading" data-event-itinerary="">
              <h2 id="event-itinerary-heading" className="border-b border-line-soft pb-4 font-heading text-[32px] leading-9 font-medium text-primary">Itinerary</h2>
              <ol>{p.itinerary.map((day, index) => <li key={index} className="grid gap-4 border-b border-line-soft py-6 sm:grid-cols-[12rem_minmax(0,1fr)]" data-itinerary-day="">
                <div>
                  <time dateTime={day.date} className="font-heading text-lg leading-7 font-medium text-primary">{day.presentation.date}</time>
                  <p className="mt-1 text-sm leading-5 text-secondary"><time dateTime={day.start_time}>{day.presentation.start_time}</time>{day.presentation.end_time && <> – <time dateTime={day.end_time!}>{day.presentation.end_time}{day.end_date ? ` (${day.end_date})` : ""}</time></>}</p>
                </div>
                {(day.title || day.description) && <div>
                  {day.title && <h3 className="font-heading text-xl leading-7 font-medium text-primary">{day.title}</h3>}
                  {day.description && <p className="mt-2 text-base leading-6 text-secondary">{day.description}</p>}
                </div>}
              </li>)}</ol>
            </section>}
            {event.resources.length > 0 && <section aria-labelledby="event-resources-heading">
              <h2 id="event-resources-heading" className="font-heading text-[32px] leading-9 font-medium text-primary">Resources</h2>
              <ul className="mt-5 divide-y divide-line-soft border-y border-line-soft">{event.resources.map((resource, index) => <li key={index}>
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center justify-between gap-4 py-3 font-medium text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{resource.label}<ArrowRightUpRegular size={16} className="size-4 max-w-full shrink-0" aria-hidden="true" focusable="false" data-ui-icon="arrow-up-right" /></a>
              </li>)}</ul>
            </section>}
          </div>
          <aside className="flex flex-col gap-10 border-t border-line-soft pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8" aria-label="Event people">
            <section aria-labelledby="event-organiser-heading">
              <h2 id="event-organiser-heading" className="text-sm leading-5 font-medium text-secondary uppercase">Organiser</h2>
              <p className="mt-2 font-heading text-xl leading-7 font-medium text-primary">{event.organiser}</p>
            </section>
            {event.speakers.length > 0 && <section aria-labelledby="event-speakers-heading">
              <h2 id="event-speakers-heading" className="text-sm leading-5 font-medium text-secondary uppercase">Speakers</h2>
              <ul className="mt-3 space-y-3">{event.speakers.map(speaker => <li key={speaker} className="font-heading text-xl leading-7 font-medium text-primary">{speaker}</li>)}</ul>
            </section>}
          </aside>
        </div>
      </Container>
    </article>
  </div>;
}
