"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function WebsiteNavigation() {
  const path = usePathname();
  return (
    <nav
      aria-label="Website"
      className="flex flex-wrap gap-5 border-b border-line-mild bg-default px-5 sm:px-8"
    >
      {[
        ["Site content", "/admin/website/site-content"],
        ["Monitoring dashboards", "/admin/website/monitoring-dashboards"],
      ].map(([label, href]) => (
        <Link
          key={href}
          href={href}
          aria-current={path.startsWith(href) ? "page" : undefined}
          className={
            "inline-flex min-h-11 items-center underline underline-offset-4 " +
            (path.startsWith(href) ? "font-semibold" : "text-secondary")
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
