import { randomUUID } from "node:crypto";
import { requirePermission } from "@/lib/admin/session";
import { getResearchGroup } from "@/lib/research/groups";
import { researchPage } from "@/lib/research/page";
import { GroupForm } from "@/components/admin/research/GroupForm";
import { ResearchNavigation } from "@/components/admin/research/ResearchNavigation";
export const metadata = { title: "Edit research group" };
export default async function EditResearchGroup({ params }: { params: Promise<{ groupId: string }> }) {
 const { groupId } = await params, actor = await requirePermission("research", groupId), { group } = await researchPage(() => getResearchGroup(actor, groupId));
 return <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8 lg:p-10"><ResearchNavigation id={groupId} current="content" manager={actor.role === "super_admin"} /><h1 className="text-2xl font-semibold">Edit research group</h1><GroupForm initial={group} id={groupId} version={group.version} requestId={randomUUID()} /></main>;
}
