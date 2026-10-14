export function EventMonthHeading({ label, id }: { label: string; id: string }) {
  return <header id={id} className="events-month-heading sticky top-[var(--compact-navbar-offset)] z-20 border-b border-line-soft bg-default py-4 lg:pt-6">
    <h3 className="font-heading text-[28px] leading-8 font-medium text-primary lg:text-[32px] lg:leading-9">{label}</h3>
  </header>;
}
