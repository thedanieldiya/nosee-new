import { revalidatePath } from "next/cache";
import { eventsApi } from "@/lib/events/api";
import { publishEvent } from "@/lib/events/service";
export const dynamic = "force-dynamic";
export function POST(request: Request, context: { params: Promise<{ id: string }> }) { return eventsApi(request, async (actor, body) => {
  const result = await publishEvent(actor, (await context.params).id, body);
  try { revalidatePath("/"); revalidatePath("/events"); revalidatePath("/events/archive"); revalidatePath("/events/[slug]", "page"); revalidatePath("/events/" + result.slug); }
  catch { return { id: result.id, message: result.message + " The public cache refresh could not be confirmed.", cacheRefresh: "unconfirmed" }; }
  return { ...result, cacheRefresh: "requested" };
}); }
