import { revalidatePath } from "next/cache";
import { newsApi } from "@/lib/news/api";
import { publishNewsArticle } from "@/lib/news/service";
export const dynamic = "force-dynamic";
export function POST(request: Request, context: { params: Promise<{ id: string }> }) { return newsApi(request, async (actor, body) => {
  const result = await publishNewsArticle(actor, (await context.params).id, body);
  try { revalidatePath("/"); revalidatePath("/news"); revalidatePath("/news/" + result.slug); }
  catch { return { id: result.id, message: result.message + " The public cache refresh could not be confirmed.", cacheRefresh: "unconfirmed" }; }
  return { ...result, cacheRefresh: "requested" };
}); }
