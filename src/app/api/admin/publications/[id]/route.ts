import { revalidatePath } from "next/cache";
import { publicationsApi } from "@/lib/publications/api";
import { getPublication, updatePublication, deletePublication } from "@/lib/publications/service";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export function GET(request: Request, context: Context) { return publicationsApi(request, async actor => getPublication(actor, (await context.params).id)); }
export function PATCH(request: Request, context: Context) { return publicationsApi(request, async (actor, body) => {
  const result = await updatePublication(actor, (await context.params).id, body);
  if ((body as { mode?: string })?.mode === "publish") {
    try { revalidatePath("/"); revalidatePath("/publications"); revalidatePath("/publications/[slug]", "page"); }
    catch { return { ...result, cacheRefresh: "unconfirmed", message: result.message + " The public cache refresh could not be confirmed." }; }
  }
  return result;
}); }
export function DELETE(request: Request, context: Context) { return publicationsApi(request, async (actor, body) => {
  const result = await deletePublication(actor, (await context.params).id, body);
  try { revalidatePath("/"); revalidatePath("/publications"); revalidatePath("/publications/[slug]", "page"); revalidatePath("/publications/" + result.slug); }
  catch { return { ...result, cacheRefresh: "unconfirmed", message: result.message + " The public cache refresh could not be confirmed." }; }
  return result;
}); }
