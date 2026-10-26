import Link from "next/link";
import { dashboardDateTime } from "@/lib/timezones";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn("min-h-10 w-full rounded-md border border-line-strong bg-default px-3 py-2 text-sm text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50", className)} {...props} />;
}
export function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return <div className="min-w-0 space-y-2"><label htmlFor={id} className="block font-medium">{label}</label>{children}</div>;
}
export const dateTime = dashboardDateTime;
export function Pagination({ path, query, page, pages, total }: { path: string; query: Record<string, string | number>; page: number; pages: number; total: number }) {
  function href(value: number) { const values: Record<string, string | number> = { ...query, page: value }; const params = new URLSearchParams(Object.entries(values).filter(([, value]) => value !== "").map(([key, value]) => [key, String(value)])); return `${path}?${params}`; }
  return <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-4 border-t border-line-mild px-5 py-4"><p className="text-secondary">{total} {total === 1 ? "record" : "records"} · Page {page} of {pages}</p><div className="flex gap-2">{page > 1 ? <Button asChild variant="outline"><Link href={href(page - 1)}>Previous</Link></Button> : <Button variant="outline" disabled>Previous</Button>}{page < pages ? <Button asChild variant="outline"><Link href={href(page + 1)}>Next</Link></Button> : <Button variant="outline" disabled>Next</Button>}</div></nav>;
}
