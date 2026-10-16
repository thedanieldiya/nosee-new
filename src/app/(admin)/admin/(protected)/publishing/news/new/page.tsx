import { randomUUID } from "node:crypto";
import { requirePermission } from "@/lib/admin/session";
import { emptyNewsFields } from "@/lib/news/options";
import { NewsEditor } from "@/components/admin/news/NewsEditor";
export const metadata = { title: "Add article" };
export default async function NewArticle() { await requirePermission("publishing"); return <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8 lg:p-10"><h1 className="text-2xl font-semibold">Add article</h1><NewsEditor initial={emptyNewsFields()} requestId={randomUUID()} /></main>; }
