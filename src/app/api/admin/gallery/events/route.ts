import { galleryApi } from "@/lib/gallery/api";
import { galleryEvents } from "@/lib/gallery/service";
import { ManagementError } from "@/lib/admin/errors";
import { z } from "zod";
export function POST(r: Request) {
  return galleryApi(r, async (a, b) => {
    const p = z
      .object({ q: z.string().max(120) })
      .strict()
      .safeParse(b);
    if (!p.success) throw new ManagementError("Use a valid Event search.");
    return galleryEvents(a, p.data.q);
  });
}
