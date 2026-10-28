import { imageResponse } from "@/lib/gallery/upload-api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(
  r: Request,
  c: { params: Promise<{ id: string; assetId: string }> },
) {
  return c.params.then((p) => imageResponse(r, p.id, p.assetId, true));
}
