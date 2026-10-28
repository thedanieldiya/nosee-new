import "server-only";
import { administrator } from "./session.ts";
import { privateJson, sameOrigin, readJson, takeBucket } from "./http.ts";
import { ManagementError } from "./errors.ts";
import type { Principal } from "./policy.ts";
export async function publishingApi(request: Request, scope: "news" | "events" | "publications", work: (actor: Principal, body: unknown) => Promise<unknown>) {
  if (request.method !== "GET" && !sameOrigin(request)) return privateJson({ error: "Request not permitted." }, 403);
  try {
    const actor = await administrator(request.headers);
    if (!actor) return privateJson({ error: "Sign in to continue." }, 401);
    if (!["super_admin", "editor"].includes(actor.role)) return privateJson({ error: "Publishing access is required." }, 403);
    let body;
    if (request.method !== "GET") {
      if (!(await takeBucket(`${scope}:${actor.id}`, 60, 40))) return privateJson({ error: "Too many requests. Try again shortly." }, 429, { "Retry-After": "60" });
      try { body = await readJson(request, 131072); } catch { return privateJson({ error: "Use valid publishing details within the 128 KB request limit." }, 400); }
    }
    return privateJson(await work(actor, body));
  } catch (error) { return error instanceof ManagementError ? privateJson({ error: error.message, ...(error.conflict ? { conflict: error.conflict } : {}) }, error.status) : privateJson({ error: "The publishing request could not be completed. Try again later." }, 503); }
}
