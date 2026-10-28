import { randomUUID } from "node:crypto";
import { requirePermission } from "@/lib/admin/session";
import { emptyPublicationFields } from "@/lib/publications/content";
import { PublicationEditor } from "@/components/admin/publications/PublicationEditor";
export const metadata = { title: "Add publication" };
export default async function NewPublication() { await requirePermission("publishing"); return <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8 lg:p-10"><h1 className="text-2xl font-semibold">Add publication</h1><PublicationEditor initial={emptyPublicationFields()} requestId={randomUUID()} /></main>; }
