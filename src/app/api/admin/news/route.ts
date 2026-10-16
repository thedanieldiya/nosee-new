import { newsApi } from "@/lib/news/api";
import { newsDirectory, createNewsArticle } from "@/lib/news/service";
export const dynamic = "force-dynamic";
export function GET(request: Request) { return newsApi(request, actor => newsDirectory(actor, Object.fromEntries(new URL(request.url).searchParams))); }
export function POST(request: Request) { return newsApi(request, createNewsArticle); }
