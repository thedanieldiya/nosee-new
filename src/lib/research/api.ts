import "server-only";
import { administrator } from "../admin/session.ts";
import { privateJson, sameOrigin, readJson, takeBucket } from "../admin/http.ts";
import { ManagementError } from "../admin/errors.ts";
import type { Principal } from "../admin/policy.ts";
export async function researchApi(request: Request, work: (actor: Principal, body: unknown) => Promise<unknown>) {
  if (request.method !== "GET" && !sameOrigin(request)) return privateJson({ error: "Request not permitted." }, 403);
  try {
    const actor = await administrator(request.headers);
    if (!actor) return privateJson({ error: "Sign in to continue." }, 401);
    if (actor.role !== "super_admin" && actor.role !== "research_group_lead") return privateJson({ error: "Research access is required." }, 403);
    let body;
    if (request.method !== "GET") {
      if (!(await takeBucket(`research:${actor.id}`, 60, 40))) return privateJson({ error: "Too many requests. Try again shortly." }, 429, { "Retry-After": "60" });
      try { body = await readJson(request, 32768); } catch { return privateJson({ error: "Use valid research details within the 32 KB request limit." }, 400); }
    }
    return privateJson(await work(actor, body));
  } catch (error) {
    if (error instanceof ManagementError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: "The research request could not be completed. Try again later." }, 503);
  }
}
