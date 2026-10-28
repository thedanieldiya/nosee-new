import Link from "next/link";
import { requirePermission } from "@/lib/admin/session";
export default async function PublishingLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("publishing");
  return <><nav aria-label="Publishing" className="flex gap-5 border-b border-line-mild bg-default px-5 py-4 text-sm sm:px-8 lg:px-10"><Link className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent" href="/admin/publishing/news">News</Link><Link className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent" href="/admin/publishing/events">Events</Link><Link className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent" href="/admin/publishing/publications">Publications</Link></nav>{children}</>;
}
