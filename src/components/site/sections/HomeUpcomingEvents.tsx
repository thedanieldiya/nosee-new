import type { EventRecord } from "@/lib/content/events";
import { selectFeaturedUpcoming } from "@/lib/content/homepage-selections";
import { Container } from "@/components/site/ui/Container";
import { ButtonLink } from "@/components/site/ui/ButtonLink";
import { EventCard } from "@/components/site/cards/EventCard";

export function HomeUpcomingEvents({ events = selectFeaturedUpcoming() }: { events?: readonly EventRecord[] }) {
  return <section className="bg-default py-8 lg:py-16" aria-labelledby="upcoming-events-heading" data-upcoming-events-section data-reveal-section>
    <Container><div className="flex flex-col gap-8 lg:gap-12">
      <header className="flex items-center justify-center lg:justify-between">
        <h2 id="upcoming-events-heading" className="text-center font-heading text-[28px] leading-8 font-semibold lg:text-left lg:text-5xl lg:leading-[56px]" data-reveal-heading>Upcoming Events</h2>
        <div className="hidden lg:block" data-upcoming-events-desktop-cta data-reveal-actions>
          <ButtonLink href="/events" className="px-6 tracking-[0.06em]">SEE ALL EVENTS</ButtonLink>
        </div>
      </header>
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3 lg:gap-8" data-upcoming-event-cards data-reveal-group>
        {events.map(event => <div key={event.slug} className="h-full" data-reveal-item><EventCard event={event} /></div>)}
      </div>
      <div className="flex justify-center lg:hidden" data-upcoming-events-mobile-cta data-reveal-actions>
        <ButtonLink href="/events" className="px-6 tracking-[0.06em]">SEE ALL EVENTS</ButtonLink>
      </div>
    </div></Container>
  </section>;
}
