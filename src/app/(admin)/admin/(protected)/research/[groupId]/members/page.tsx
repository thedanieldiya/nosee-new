import Link from "next/link";
import { requirePermission } from "@/lib/admin/session";
import { getResearchGroup, researchMembers } from "@/lib/research/groups";
import { groupQuery } from "@/lib/research/input";
import { researchPage } from "@/lib/research/page";
import { ResearchNavigation } from "@/components/admin/research/ResearchNavigation";
import { AddGroupMember, GroupMemberActions } from "@/components/admin/research/GroupMembers";
import { Field, Pagination } from "@/components/admin/ManagementShared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
export const metadata = { title: "Research group members" };
export const dynamic = "force-dynamic";
export default async function ResearchGroupMembers({ params, searchParams }: { params: Promise<{ groupId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const { groupId } = await params, actor = await requirePermission("research", groupId), query = groupQuery.safeParse(await searchParams), { group } = await researchPage(() => getResearchGroup(actor, groupId));
 if (!query.success) return <main id="main-content" className="p-5"><h1 className="text-2xl font-semibold">Group members</h1><p role="alert" className="my-5">Invalid search or page.</p><Link href={`/admin/research/${groupId}/members`} className="underline">Clear filters</Link></main>;
 const data = await researchPage(() => researchMembers(actor, groupId, query.data)), path = `/admin/research/${groupId}/members`;
 return <main id="main-content" className="mx-auto max-w-5xl space-y-6 p-5 sm:p-8 lg:p-10"><ResearchNavigation id={groupId} current="members" manager={actor.role === "super_admin"} /><div><h1 className="break-words text-2xl font-semibold">{group.name} members</h1><p className="mt-2 text-secondary">Manage group associations only. Private organisation-wide records and public profiles remain separate.</p></div><Card><CardHeader><h2 className="font-semibold">Add member</h2></CardHeader><CardContent><AddGroupMember key={groupId} groupId={groupId} /></CardContent></Card><Card><CardContent><form method="get" className="flex flex-wrap items-end gap-3"><div className="min-w-0 grow"><Field id="group-members-q" label="Search group members"><Input id="group-members-q" name="q" maxLength={120} defaultValue={query.data.q} /></Field></div><Button type="submit">Search</Button><Button asChild variant="outline"><Link href={path}>Clear</Link></Button></form></CardContent></Card><Card aria-label="Current group members">{data.rows.length ? <ul className="divide-y divide-line-mild">{data.rows.map(association => <li key={association.id} className="space-y-4 p-5 sm:p-6"><div><h2 className="break-words font-semibold">{association.firstName} {association.lastName}</h2><p className="mt-1 break-words text-secondary">{association.affiliation || "Affiliation not recorded"}</p></div><GroupMemberActions key={`${association.id}-${association.version}`} groupId={groupId} association={association} /></li>)}</ul> : <div className="p-6"><h2 className="font-semibold">No eligible group members found</h2><p className="mt-2 text-secondary">Select an existing Active member to add an association, or change the search.</p></div>}<Pagination path={path} query={query.data} {...data} /></Card></main>;
}
