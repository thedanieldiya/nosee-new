import Link from "next/link";
export function MembershipNavigation({ current }: { current: "applications" | "members" }) {
  return <nav aria-label="Membership" className="flex flex-wrap gap-4 border-b border-line-mild pb-4">{["applications", "members"].map(value => <Link key={value} href={`/admin/membership/${value}`} aria-current={current === value ? "page" : undefined} className={`rounded-sm px-1 py-2 font-medium underline-offset-4 hover:underline ${current === value ? "text-[#0b5025] underline" : "text-secondary"}`}>{value === "members" ? "Members" : "Applications"}</Link>)}</nav>;
}
