import { revalidatePath } from "next/cache";
import { newsApi } from "@/lib/news/api";
import { newsDirectory, createNewsArticle } from "@/lib/news/service";
export const dynamic = "force-dynamic";
export function GET(request: Request) { return newsApi(request, actor => newsDirectory(actor, Object.fromEntries(new URL(request.url).searchParams))); }
export function POST(request: Request) { return newsApi(request, async (actor, body) => {
  const result = await createNewsArticle(actor, body);
  if ((body as { mode?: string })?.mode === "publish") {
    try { revalidatePath("/"); revalidatePath("/news"); }
    catch { return { ...result, cacheRefresh: "unconfirmed", message: result.message + " The public cache refresh could not be confirmed." }; }
  }
  return result;
}); }
