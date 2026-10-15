import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdministrator, requirePermission } from "@/lib/admin/session";
import { groupDirectory } from "@/lib/research/groups";
import { groupQuery } from "@/lib/research/input";
import { researchPage } from "@/lib/research/page";
import { Field, Pagination, dateTime } from "@/components/admin/ManagementShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
export const metadata = { title: "Research groups" };
export const dynamic = "force-dynamic";
export default async function ResearchDirectory({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const principal = await requireAdministrator();
 if (principal.role === "research_group_lead") redirect(`/admin/research/${principal.researchGroupId}`);
 const actor = await requirePermission("research"), query = groupQuery.safeParse(await searchParams);
 if (!query.success) return <main id="main-content" className="p-5"><h1 className="text-2xl font-semibold">Research groups</h1><p role="alert" className="my-5">Invalid search or page.</p><Link href="/admin/research" className="underline">Clear filters</Link></main>;
 const data = await researchPage(() => groupDirectory(actor, query.data));
 return <main id="main-content" className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8 lg:p-10"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">Research groups</h1><p className="mt-2 text-secondary">Manage group content, Lead access and existing member associations.</p></div><Button asChild><Link href="/admin/research/new">Create group</Link></Button></div><Card><CardContent><form method="get" className="flex flex-wrap items-end gap-3"><div className="min-w-0 grow"><Field id="research-q" label="Search groups"><Input id="research-q" name="q" maxLength={120} defaultValue={query.data.q} /></Field></div><Button type="submit">Search</Button><Button asChild variant="outline"><Link href="/admin/research">Clear</Link></Button></form></CardContent></Card><Card aria-label="Research groups">{data.rows.length ? <ul className="divide-y divide-line-mild">{data.rows.map(group => <li key={group.id} className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6"><div className="min-w-0"><h2 className="break-words font-semibold"><Link href={`/admin/research/${group.id}`} className="underline underline-offset-4">{group.name}</Link></h2><p className="mt-2 break-all text-secondary">/research/{group.slug}</p><p className="mt-2 text-secondary">{group.status === "published" ? "Published version recorded" : "Private draft"}</p></div><p className="text-xs text-secondary">Updated {dateTime(group.updatedAt)}</p></li>)}</ul> : <div className="p-6"><h2 className="font-semibold">No research groups found</h2><p className="mt-2 text-secondary">Create a group or try another search. Existing public starter content has not been imported.</p></div>}<Pagination path="/admin/research" query={query.data} {...data} /></Card><p className="text-secondary">Public research routes await an approved design. Publishing records an explicit public-ready snapshot; it does not create a new public layout.</p></main>;
}
