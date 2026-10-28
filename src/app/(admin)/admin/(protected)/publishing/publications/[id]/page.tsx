import Link from "next/link";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requirePermission } from "@/lib/admin/session";
import { getPublication } from "@/lib/publications/service";
import { publicationsPage } from "@/lib/publications/page";
import { PublicationEditor } from "@/components/admin/publications/PublicationEditor";
import { PublicationContentView } from "@/components/admin/publications/PublicationContentView";
import { Card, CardContent } from "@/components/ui/card";
export const metadata = { title: "Publication", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function PublicationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requirePermission("publishing"), { id } = await params, publication = await publicationsPage(() => getPublication(actor, id)), query = await searchParams, mode = query.preview;
  if (mode === "1" || mode === "published") {
    const content = mode === "published" ? publication.publishedContent : { ...publication.fields, slug: publication.slug, publicGroup: null }; if (!content) notFound();
    return <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8 lg:p-10"><Link href={`/admin/publishing/publications/${id}`} className="underline underline-offset-4">Back to editor</Link><h1 className="text-2xl font-semibold">{mode === "published" ? "Published snapshot preview" : "Saved working-copy preview"}</h1><p className="text-secondary">Private preview. The public publication page uses only the latest published snapshot.</p><Card><CardContent><PublicationContentView content={content} /></CardContent></Card></main>;
  }
  return <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8 lg:p-10"><h1 className="text-2xl font-semibold">Edit publication</h1><PublicationEditor key={publication.version} initial={publication.fields} selectedGroup={publication.selectedGroup} id={id} version={publication.version} status={publication.status} published={publication.publishedContent} focusSaved={query.saved === "1"} requestId={randomUUID()} /></main>;
}
