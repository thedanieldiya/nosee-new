import "server-only";
import { administrator } from "./session.ts";
import { privateJson, sameOrigin, readJson, takeBucket } from "./http.ts";
import { ManagementError } from "./management.ts";
import type { Principal } from "./policy.ts";
export async function managementApi(request: Request, callback: (actor: Principal, body: unknown) => Promise<unknown>) {
  if (request.method !== "GET" && !sameOrigin(request)) return privateJson({ error: "Request not permitted." }, 403);
  try {
    const actor = await administrator(request.headers);
    if (!actor) return privateJson({ error: "Sign in to continue." }, 401);
    if (actor.role !== "super_admin") return privateJson({ error: "Super Admin access is required." }, 403);
    if (request.method !== "GET" && !(await takeBucket(`management:${actor.id}`, 60, 30))) return privateJson({ error: "Too many requests. Try again shortly." }, 429, { "Retry-After": "60" });
    let body;
    if (request.method !== "GET") { try { body = await readJson(request); } catch { return privateJson({ error: "Enter valid administrator details." }, 400); } }
    return privateJson(await callback(actor, body));
  } catch (error) {
    if (error instanceof ManagementError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: "Unable to complete this request. Try again later." }, 503);
  }
}
