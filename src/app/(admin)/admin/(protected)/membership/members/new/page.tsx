import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/admin/session";
import { emptyMemberFields } from "@/lib/membership/member-options";
import { MemberForm } from "@/components/admin/MemberForm";
import { MembershipNavigation } from "@/components/admin/MembershipNavigation";
export const metadata = { title: "Add member" };
export default async function NewMemberPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("membership");
  const applicationId = (await searchParams).application;
  if (applicationId) {
    if (typeof applicationId !== "string" || !z.uuid().safeParse(applicationId).success) notFound();
    redirect(`/admin/membership/applications/${applicationId}`);
  }
  return <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8 lg:p-10"><MembershipNavigation current="members" /><div><h1 className="text-2xl font-semibold">Add member</h1><p className="mt-2 text-secondary">Add a private membership record. This does not send an invitation, grant dashboard access or publish a person.</p></div><MemberForm initial={{ ...emptyMemberFields, joinDate: new Date().toISOString().slice(0, 10) }} requestId={randomUUID()} /></main>;
}
