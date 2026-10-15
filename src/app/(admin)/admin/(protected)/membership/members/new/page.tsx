import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/admin/session";
import { applicationMemberContext } from "@/lib/membership/members";
import { ManagementError } from "@/lib/admin/management";
import { emptyMemberFields } from "@/lib/membership/member-options";
import { MemberForm } from "@/components/admin/MemberForm";
import { ExistingMemberAssociation } from "@/components/admin/MemberRelations";
import { MembershipNavigation } from "@/components/admin/MembershipNavigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
export const metadata = { title: "Create member" };
export default async function NewMemberPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requirePermission("membership"), query = await searchParams, applicationId = query.application;
  let context: Awaited<ReturnType<typeof applicationMemberContext>> | undefined;
  if (applicationId) {
    if (typeof applicationId !== "string" || !z.uuid().safeParse(applicationId).success) notFound();
    try { context = await applicationMemberContext(actor, applicationId); } catch (error) { if (error instanceof ManagementError && error.status === 404) notFound(); throw error; }
  }
  const initial = { ...emptyMemberFields, joinDate: new Date().toISOString().slice(0, 10), ...(context ? { firstName: context.application.firstName, lastName: context.application.lastName, email: context.application.email, careerStage: context.application.careerStage, researchInterests: context.application.researchInterests } : {}) };
  return <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8 lg:p-10"><MembershipNavigation current="members" /><div><h1 className="text-2xl font-semibold">Create member</h1><p className="mt-2 text-secondary">Create a private membership record. This does not grant dashboard access or publish a person.</p></div>{context ? <Card><CardHeader><h2 className="font-semibold">Source application</h2></CardHeader><CardContent><p>{context.application.firstName} {context.application.lastName}</p><p className="mt-1 break-all" data-member-private>{context.application.email}</p><Link href={`/admin/membership/applications/${context.application.id}`} className="mt-3 inline-block underline">Review original application and motivation</Link></CardContent></Card> : null}{context?.associated ? <Card><CardContent><p>This application is already associated with a member. No new record is needed.</p><Link href={`/admin/membership/members/${context.associated.id}`} className="mt-3 inline-block underline">View associated member</Link></CardContent></Card> : context && context.application.status !== "approved" ? <Card><CardContent><p role="alert">Only approved applications can be converted. This application is {context.application.status}.</p></CardContent></Card> : context?.existing ? <Card><CardHeader><h2 className="font-semibold">Existing member requires identity review</h2></CardHeader><CardContent><ExistingMemberAssociation applicationId={context.application.id} member={context.existing} /></CardContent></Card> : <MemberForm initial={initial} requestId={randomUUID()} applicationId={context?.application.id} />}</main>;
}
