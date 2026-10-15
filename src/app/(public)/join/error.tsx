"use client";
import { buttonClasses } from "@/components/site/ui/ButtonLink";
export default function JoinError({ reset }: { reset: () => void }) {
  return <div className="pt-[var(--expanded-navbar-offset)]"><div className="mx-auto max-w-2xl px-4 py-12"><h1 className="font-heading text-3xl font-semibold">Application could not be confirmed</h1><p role="alert" className="my-5">The connection was interrupted or the application service is unavailable. Please try again. A repeated successful submission will not create a duplicate application.</p><button type="button" onClick={reset} className={buttonClasses()}>Try again</button></div></div>;
}
