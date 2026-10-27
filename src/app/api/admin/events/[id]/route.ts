import { revalidatePath } from "next/cache";
import { eventsApi } from "@/lib/events/api";
import { getEvent, updateEvent, deleteEvent } from "@/lib/events/service";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export function GET(request: Request, context: Context) { return eventsApi(request, async actor => getEvent(actor, (await context.params).id)); }
export function PATCH(request: Request, context: Context) { return eventsApi(request, async (actor, body) => {
  const result = await updateEvent(actor, (await context.params).id, body);
  if ((body as { mode?: string })?.mode === "publish") {
    try { revalidatePath("/"); revalidatePath("/events"); revalidatePath("/events/archive"); revalidatePath("/events/[slug]", "page"); }
    catch { return { ...result, cacheRefresh: "unconfirmed", message: result.message + " The public cache refresh could not be confirmed." }; }
  }
  return result;
}); }
export function DELETE(request: Request, context: Context) { return eventsApi(request, async (actor, body) => {
  const result = await deleteEvent(actor, (await context.params).id, body);
  try { revalidatePath("/"); revalidatePath("/events"); revalidatePath("/events/archive"); revalidatePath("/events/[slug]", "page"); revalidatePath("/events/" + result.slug); }
  catch { return { ...result, cacheRefresh: "unconfirmed", message: result.message + " The public cache refresh could not be confirmed." }; }
  return result;
}); }
