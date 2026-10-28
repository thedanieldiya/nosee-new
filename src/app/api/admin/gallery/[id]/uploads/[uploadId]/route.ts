import { binaryUpload } from "@/lib/gallery/upload-api";
export const runtime = "nodejs";
export function PUT(
  r: Request,
  c: { params: Promise<{ id: string; uploadId: string }> },
) {
  return c.params.then((p) => binaryUpload(r, p.id, p.uploadId));
}
