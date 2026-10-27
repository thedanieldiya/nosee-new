import { revalidatePath } from "next/cache";
import { eventsApi } from "@/lib/events/api";
import { eventsDirectory, createEvent } from "@/lib/events/service";
export const dynamic = "force-dynamic";
export function GET(request: Request) { return eventsApi(request, actor => eventsDirectory(actor, Object.fromEntries(new URL(request.url).searchParams))); }
export function POST(request: Request) { return eventsApi(request, async (actor, body) => {
  const result = await createEvent(actor, body);
  if ((body as { mode?: string })?.mode === "publish") {
    try { revalidatePath("/"); revalidatePath("/events"); revalidatePath("/events/archive"); revalidatePath("/events/[slug]", "page"); }
    catch { return { ...result, cacheRefresh: "unconfirmed", message: result.message + " The public cache refresh could not be confirmed." }; }
  }
  return result;
}); }
