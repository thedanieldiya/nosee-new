import { revalidatePath } from "next/cache";
import { newsApi } from "@/lib/news/api";
import { publishNewsArticle } from "@/lib/news/service";
export const dynamic = "force-dynamic";
export function POST(request: Request, context: { params: Promise<{ id: string }> }) { return newsApi(request, async (actor, body) => {
  const result = await publishNewsArticle(actor, (await context.params).id, body);
  try { revalidatePath("/"); } catch { return { id: result.id, message: "Publication state saved, but homepage cache refresh could not be confirmed. Review the saved version before retrying.", cacheRefresh: "unconfirmed" }; }
  return { ...result, cacheRefresh: "requested" };
}); }
