import { publishingApi } from "../admin/publishing-api.ts";
import type { Principal } from "../admin/policy.ts";
export function eventsApi(request: Request, work: (actor: Principal, body: unknown) => Promise<unknown>) { return publishingApi(request, "events", work); }
