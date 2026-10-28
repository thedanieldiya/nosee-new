import { galleryApi, refreshGallery } from "@/lib/gallery/api";
import { publishGallery } from "@/lib/gallery/service";
export function POST(r: Request, c: { params: Promise<{ id: string }> }) {
  return galleryApi(r, async (a, b) =>
    refreshGallery(await publishGallery(a, (await c.params).id, b)),
  );
}
