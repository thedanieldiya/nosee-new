import type { Metadata } from "next";
import { Container } from "@/components/site/ui/Container";
import { EventDayGroup } from "@/components/site/events/EventDayGroup";
import { archiveEvents } from "@/lib/content/events-listing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Event Archives | NOSEE", robots: { index: false, follow: false } };

export default function EventArchivePage() {
  const groups = archiveEvents();
  return <div className="pt-[var(--expanded-navbar-offset)]">
    <div className="pb-20" data-event-archive-page="">
      <Container className="pt-10 lg:pt-6">
        <header className="max-w-2xl">
          <h1 className="font-heading text-[40px] leading-[48px] font-semibold text-primary lg:text-5xl lg:leading-14">Event Archives</h1>
          <p className="mt-2 text-base leading-6 text-secondary lg:text-xl lg:leading-7">Explore completed NOSEE meetings, conferences, workshops, lectures, and outreach events.</p>
        </header>
        {groups.length === 0 ? <p className="mt-10 border-y border-line-soft py-12 text-center font-heading text-2xl leading-8 font-medium text-primary lg:mt-16" data-archive-empty-state="">No archived events are available yet.</p> : <div className="mt-10 flex flex-col gap-16 lg:mt-16 lg:gap-20">
          {groups.map(year => <section key={year.year} aria-labelledby={`archive-year-${year.year}`} data-archive-year="">
            <h2 id={`archive-year-${year.year}`} className="border-b border-line-soft pb-4 font-heading text-[32px] leading-9 font-semibold text-primary lg:text-[40px] lg:leading-[48px]">{year.year}</h2>
            <div className="flex flex-col gap-14 lg:gap-16">{year.months.map(month => <section key={month.key} aria-labelledby={`archive-month-${month.key}`} data-archive-month="">
              <header className="border-b border-line-soft py-4 lg:pt-6"><h3 id={`archive-month-${month.key}`} className="font-heading text-[28px] leading-8 font-medium text-primary lg:text-[32px] lg:leading-9">{month.label}</h3></header>
              <div className="mt-5 flex flex-col gap-10 lg:mt-8 lg:gap-8">{month.days.map(day => <EventDayGroup key={day.date} day={day} />)}</div>
            </section>)}</div>
          </section>)}
        </div>}
      </Container>
    </div>
  </div>;
}
