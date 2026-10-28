import { galleryApi } from "@/lib/gallery/api";
import { finalizeUpload } from "@/lib/media/uploads";
export const runtime = "nodejs";
export function POST(
  r: Request,
  c: { params: Promise<{ id: string; uploadId: string }> },
) {
  return galleryApi(r, async (a, b) => {
    const p = await c.params;
    return finalizeUpload(a, p.id, p.uploadId, b);
  });
}
