import { revalidatePath } from "next/cache";
import { publicationsApi } from "@/lib/publications/api";
import { publicationsDirectory, createPublication } from "@/lib/publications/service";
export const dynamic = "force-dynamic";
export function GET(request: Request) { return publicationsApi(request, actor => publicationsDirectory(actor, Object.fromEntries(new URL(request.url).searchParams))); }
export function POST(request: Request) { return publicationsApi(request, async (actor, body) => {
  const result = await createPublication(actor, body);
  if ((body as { mode?: string })?.mode === "publish") {
    try { revalidatePath("/"); revalidatePath("/publications"); revalidatePath("/publications/[slug]", "page"); }
    catch { return { ...result, cacheRefresh: "unconfirmed", message: result.message + " The public cache refresh could not be confirmed." }; }
  }
  return result;
}); }
