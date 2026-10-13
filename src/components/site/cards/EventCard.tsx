import type { EventRecord } from "@/lib/content/events";
import { eventCardValues } from "@/lib/content/homepage-selections";

export function EventCard({ event }: { event: EventRecord }) {
  const values = eventCardValues(event);
  return <article className="card-hover-lift h-full w-full border border-line-soft bg-default" data-event-card>
    <a href={values.href} aria-label={`View event: ${event.title}`}
      className="flex h-full min-h-[420px] flex-col p-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent md:p-6 lg:min-h-[480px] lg:p-8">
      <header className="flex flex-col gap-4">
        <p className="font-body text-sm leading-5 font-medium tracking-[0.04em] text-secondary">{values.typeLabel}</p>
        <div className="border-t border-line-soft" aria-hidden="true" />
      </header>
      <div className="flex flex-1 flex-col gap-4 py-6 lg:gap-5 lg:py-8">
        <h3 className="font-heading text-xl leading-7 font-medium text-primary lg:text-2xl lg:leading-8">{event.title}</h3>
        <p className="font-body text-sm leading-5 text-secondary lg:text-base lg:leading-6">{event.summary}</p>
      </div>
      <footer className="flex flex-col gap-3 border-t border-line-soft pt-5 font-body">
        <time dateTime={event.start_date} className="text-sm leading-5 italic text-secondary lg:text-base lg:leading-6">{values.dateLabel}</time>
        <p className="text-sm leading-5 text-primary lg:text-base lg:leading-6">{values.locationLabel}</p>
      </footer>
    </a>
  </article>;
}
