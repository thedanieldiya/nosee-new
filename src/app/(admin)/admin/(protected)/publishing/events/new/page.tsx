import { randomUUID } from "node:crypto";
import { requirePermission } from "@/lib/admin/session";
import { emptyEventFields } from "@/lib/events/content";
import { EventEditor } from "@/components/admin/events/EventEditor";
export const metadata = { title: "Add event" };
export default async function NewEvent() { await requirePermission("publishing"); return <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8 lg:p-10"><h1 className="text-2xl font-semibold">Add event</h1><EventEditor initial={emptyEventFields()} requestId={randomUUID()} /></main>; }
