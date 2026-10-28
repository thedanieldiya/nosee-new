import { galleryApi, refreshGallery } from "@/lib/gallery/api";
import { galleryDirectory, saveGallery } from "@/lib/gallery/service";
export const dynamic = "force-dynamic";
export function GET(r: Request) {
  return galleryApi(r, (a) =>
    galleryDirectory(a, Object.fromEntries(new URL(r.url).searchParams)),
  );
}
export function POST(r: Request) {
  return galleryApi(r, async (a, b) =>
    refreshGallery(await saveGallery(a, null, b)),
  );
}
