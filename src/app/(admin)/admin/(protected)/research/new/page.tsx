import { randomUUID } from "node:crypto";
import { requirePermission } from "@/lib/admin/session";
import { emptyGroupContent } from "@/lib/research/options";
import { GroupForm } from "@/components/admin/research/GroupForm";
import { ResearchNavigation } from "@/components/admin/research/ResearchNavigation";
export const metadata = { title: "Create research group" };
export default async function NewResearchGroup() { await requirePermission("research"); return <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8 lg:p-10"><ResearchNavigation manager /><h1 className="text-2xl font-semibold">Create research group</h1><GroupForm initial={emptyGroupContent} requestId={randomUUID()} /></main>; }
