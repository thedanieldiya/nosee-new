/* eslint-disable @next/next/no-img-element -- Original search/action SVG elements. */
import type { Metadata } from "next";
import { Container } from "@/components/site/ui/Container";
import { ButtonLink } from "@/components/site/ui/ButtonLink";
import { FeaturedEvent } from "@/components/site/events/FeaturedEvent";
import { ListingEventCard } from "@/components/site/events/ListingEventCard";
import { EventMonthHeading } from "@/components/site/events/EventMonthHeading";
import { EventDayGroup } from "@/components/site/events/EventDayGroup";
import { buildEvents } from "@/lib/content/events-listing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Events | NOSEE", robots: { index: false, follow: false } };

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  // PHP keeps the last repeated scalar q; bracketed q[] has no scalar q here.
  const { featured, ongoing, upcoming_groups, query } = buildEvents(Array.isArray(params.q) ? params.q.at(-1) : params.q);
  return <div className="pt-[var(--expanded-navbar-offset)]">
    <div className="events-listing pb-20" data-events-page="">
      <Container className="flex flex-col gap-10 pt-10 lg:gap-16 lg:pt-6">
        <header className="flex items-end justify-between gap-12">
          <div className="max-w-xl">
            <h1 className="font-heading text-[40px] leading-[48px] font-semibold text-primary lg:text-5xl lg:leading-14">Events</h1>
            <p className="mt-2 text-base leading-6 text-secondary lg:text-xl lg:leading-7">Explore upcoming NOSEE meetings, conferences, workshops, lectures, and outreach events.</p>
          </div>
          <form action="/events" method="GET" className="hidden h-12 w-[416px] shrink-0 items-center border border-line-strong bg-default pr-1 pl-4 lg:flex" role="search">
            <label htmlFor="event-search" className="sr-only">Search upcoming events</label>
            <input id="event-search" name="q" type="search" defaultValue={query ?? ""} placeholder="Search events..." className="min-w-0 flex-1 bg-transparent text-base text-primary outline-none placeholder:text-secondary" />
            <button type="submit" className="inline-flex h-10 items-center justify-center gap-1.5 bg-brand px-4 text-sm font-medium text-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Search<img src="/media/icons/search.svg" alt="" className="size-4" aria-hidden="true" /></button>
          </form>
        </header>
        {featured && <FeaturedEvent event={featured} />}
        {ongoing.length > 0 && <section aria-labelledby="ongoing-events-heading" data-ongoing-events="">
          <header className="border-b border-line-soft py-4 lg:pt-6"><h2 id="ongoing-events-heading" className="font-heading text-[28px] leading-8 font-medium lg:text-[32px] lg:leading-9">Ongoing Events</h2></header>
          <div className="mt-5 flex flex-col gap-4 lg:mt-8 lg:gap-8 lg:pl-[336px]">{ongoing.map(e => <ListingEventCard key={e.slug} event={e} />)}</div>
        </section>}
        <section aria-labelledby="upcoming-events-heading" data-upcoming-events="">
          <header className="flex items-center justify-between gap-4 border-b border-line-soft py-4 lg:pt-6">
            <h2 id="upcoming-events-heading" className="font-heading text-[28px] leading-8 font-medium lg:text-[32px] lg:leading-9">Upcoming Events</h2>
            <ButtonLink href="/events/archive" size="sm" variant="stroke" className="hidden sm:inline-flex">View event archives<span className="shrink-0" aria-hidden="true"><img src="/media/icons/arrow-right.svg" alt="" className="size-4" /></span></ButtonLink>
          </header>
          {upcoming_groups.length === 0 ? <div className="border-b border-line-soft py-12 text-center" data-events-empty-state="">
            <p className="font-heading text-2xl leading-8 font-medium text-primary">No upcoming events found.</p>
            {query && query !== "0" && <p className="mt-2 text-base leading-6 text-secondary">Try a different search term.</p>}
          </div> : <div className="flex flex-col gap-16">{upcoming_groups.map(group => <section key={group.key} aria-labelledby={`event-month-${group.key}`} data-event-month="">
            <EventMonthHeading label={group.label} id={`event-month-${group.key}`} />
            <div className="mt-5 flex flex-col gap-10 lg:mt-8 lg:gap-8">{group.days.map(day => <EventDayGroup key={day.date} day={day} />)}</div>
          </section>)}</div>}
        </section>
      </Container>
    </div>
  </div>;
}
