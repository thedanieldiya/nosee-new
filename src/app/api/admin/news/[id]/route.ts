import { revalidatePath } from "next/cache";
import { newsApi } from "@/lib/news/api";
import { getNewsArticle, updateNewsArticle, deleteNewsArticle } from "@/lib/news/service";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export function GET(request: Request, context: Context) { return newsApi(request, async actor => getNewsArticle(actor, (await context.params).id)); }
export function PATCH(request: Request, context: Context) { return newsApi(request, async (actor, body) => {
  const result = await updateNewsArticle(actor, (await context.params).id, body);
  if ((body as { mode?: string })?.mode === "publish") {
    try { revalidatePath("/"); revalidatePath("/news"); revalidatePath("/news/[slug]", "page"); }
    catch { return { ...result, cacheRefresh: "unconfirmed", message: result.message + " The public cache refresh could not be confirmed." }; }
  }
  return result;
}); }
export function DELETE(request: Request, context: Context) { return newsApi(request, async (actor, body) => {
  const result = await deleteNewsArticle(actor, (await context.params).id, body);
  try { revalidatePath("/"); revalidatePath("/news"); revalidatePath("/news/" + result.slug); }
  catch { return { ...result, cacheRefresh: "unconfirmed", message: result.message + " The public cache refresh could not be confirmed." }; }
  return result;
}); }
