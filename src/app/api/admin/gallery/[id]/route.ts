import { galleryApi, refreshGallery } from "@/lib/gallery/api";
import { getGallery, saveGallery, deleteGallery } from "@/lib/gallery/service";
export const dynamic = "force-dynamic";
type C = { params: Promise<{ id: string }> };
export function GET(r: Request, c: C) {
  return galleryApi(r, async (a) => getGallery(a, (await c.params).id));
}
export function PATCH(r: Request, c: C) {
  return galleryApi(r, async (a, b) =>
    refreshGallery(await saveGallery(a, (await c.params).id, b)),
  );
}
export function DELETE(r: Request, c: C) {
  return galleryApi(r, async (a, b) =>
    refreshGallery(await deleteGallery(a, (await c.params).id, b)),
  );
}
