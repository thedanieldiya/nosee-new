import type { EventDay } from "@/lib/content/events-listing";
import { ListingEventCard } from "./ListingEventCard";

export function EventDayGroup({ day }: { day: EventDay }) {
  return <section className="grid gap-4 lg:grid-cols-[304px_minmax(0,1fr)] lg:gap-8" data-event-day-group="">
    <header className="border-line-mild lg:border-r lg:px-3 lg:py-8">
      <time dateTime={day.date} className="block font-heading text-base leading-6 font-medium text-primary uppercase lg:text-center lg:text-[32px] lg:leading-9">{day.label}</time>
    </header>
    <div className="flex min-w-0 flex-col gap-4 lg:gap-8">{day.events.map(event => <ListingEventCard key={event.slug} event={event} />)}</div>
  </section>;
}
