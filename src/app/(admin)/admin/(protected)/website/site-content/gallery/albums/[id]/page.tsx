import Link from "next/link";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requirePermission } from "@/lib/admin/session";
import { getGallery } from "@/lib/gallery/service";
import { publicationsPage } from "@/lib/publications/page";
import { GalleryEditor } from "@/components/admin/gallery/GalleryEditor";
import { GalleryPreview } from "@/components/admin/gallery/Preview";
import { mediaStorage } from "@/lib/media/storage";
export const dynamic = "force-dynamic";
export default async function EditGallery({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const a = await requirePermission("website"),
    { id } = await params,
    r = await publicationsPage(() => getGallery(a, id)),
    q = await searchParams;
  if (r.kind !== "album") notFound();
  const path = "/admin/website/site-content/gallery/albums/" + id;
  if (q.preview === "1")
    return (
      <main
        id="main-content"
        className="mx-auto max-w-5xl space-y-6 p-5 sm:p-8"
      >
        <Link href={path} className="underline">
          Back to editor
        </Link>
        <h1 className="text-2xl font-semibold">Saved working-copy preview</h1>
        <p className="text-secondary">
          Private preview. Public visitors see the published snapshot only.
        </p>
        <GalleryPreview fields={r.fields} images={r.images} />
      </main>
    );
  return (
    <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8">
      <h1 className="text-2xl font-semibold">Edit album</h1>
      <GalleryEditor
        key={r.version}
        initial={r.fields}
        id={id}
        version={r.version}
        status={r.status}
        published={r.publishedContent}
        requestId={randomUUID()}
        initialImages={r.images}
        selectedEvent={r.selectedEvent}
        uploadsConfigured={!!mediaStorage()}
        focusSaved={q.saved === "1"}
      />
    </main>
  );
}
