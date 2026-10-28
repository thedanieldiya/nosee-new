import { galleryApi } from "@/lib/gallery/api";
import { beginUpload, uploadStatus } from "@/lib/media/uploads";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type C = { params: Promise<{ id: string }> };
export function GET(r: Request, c: C) {
  return galleryApi(r, async (a) => uploadStatus(a, (await c.params).id));
}
export function POST(r: Request, c: C) {
  return galleryApi(r, async (a, b) => beginUpload(a, (await c.params).id, b));
}
