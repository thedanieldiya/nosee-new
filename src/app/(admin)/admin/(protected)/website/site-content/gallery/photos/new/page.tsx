import { randomUUID } from "node:crypto";
import { requirePermission } from "@/lib/admin/session";
import { emptyGallery } from "@/lib/gallery/input";
import { GalleryEditor } from "@/components/admin/gallery/GalleryEditor";
import { mediaStorage } from "@/lib/media/storage";
export default async function AddGallery() {
  await requirePermission("website");
  return (
    <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8">
      <h1 className="text-2xl font-semibold">Add photo</h1>
      <GalleryEditor
        initial={emptyGallery("photo")}
        requestId={randomUUID()}
        uploadsConfigured={!!mediaStorage()}
      />
    </main>
  );
}
