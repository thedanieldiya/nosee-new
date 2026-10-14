import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findEvent } from "@/lib/content/events-detail";
import { presentEvent } from "@/lib/content/events-listing";
import { EventDetail } from "@/components/site/events/EventDetail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = findEvent((await params).slug);
  return { title: event ? `${event.title} | NOSEE` : "Page not found — NOSEE", robots: { index: false, follow: false } };
}

export default async function EventPage({ params }: Props) {
  const event = findEvent((await params).slug);
  if (!event || event.type === "meeting") notFound();
  return <EventDetail event={presentEvent(event, new Date(), true)} />;
}
