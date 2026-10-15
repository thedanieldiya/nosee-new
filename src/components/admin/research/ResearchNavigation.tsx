import Link from "next/link";
export function ResearchNavigation({ id, current, manager = false }: { id?: string; current?: "content" | "members"; manager?: boolean }) {
  return <nav aria-label="Research workspace" className="flex flex-wrap gap-5 text-sm">{manager ? <Link href="/admin/research" className="underline underline-offset-4">All groups</Link> : null}{id ? <>{([['content', 'Content', `/admin/research/${id}`], ['members', 'Members', `/admin/research/${id}/members`]] as const).map(([key, label, href]) => <Link key={key} href={href} aria-current={current === key ? "page" : undefined} className={current === key ? "font-semibold text-primary underline underline-offset-4" : "text-secondary underline underline-offset-4"}>{label}</Link>)}</> : null}</nav>;
}
