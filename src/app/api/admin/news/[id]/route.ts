import { newsApi } from "@/lib/news/api";
import { getNewsArticle, updateNewsArticle } from "@/lib/news/service";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export function GET(request: Request, context: Context) { return newsApi(request, async actor => getNewsArticle(actor, (await context.params).id)); }
export function PATCH(request: Request, context: Context) { return newsApi(request, async (actor, body) => updateNewsArticle(actor, (await context.params).id, body)); }
