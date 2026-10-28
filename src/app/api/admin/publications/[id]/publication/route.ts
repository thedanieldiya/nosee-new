import { revalidatePath } from "next/cache";
import { publicationsApi } from "@/lib/publications/api";
import { publishPublication } from "@/lib/publications/service";
export const dynamic = "force-dynamic";
export function POST(request: Request, context: { params: Promise<{ id: string }> }) { return publicationsApi(request, async (actor, body) => {
  const result = await publishPublication(actor, (await context.params).id, body);
  try { revalidatePath("/"); revalidatePath("/publications"); revalidatePath("/publications/[slug]", "page"); revalidatePath("/publications/" + result.slug); }
  catch { return { id: result.id, message: result.message + " The public cache refresh could not be confirmed.", cacheRefresh: "unconfirmed" }; }
  return { ...result, cacheRefresh: "requested" };
}); }
