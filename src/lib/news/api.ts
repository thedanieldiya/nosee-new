import { publishingApi } from "../admin/publishing-api.ts";
import type { Principal } from "../admin/policy.ts";
export function newsApi(request: Request, work: (actor: Principal, body: unknown) => Promise<unknown>) { return publishingApi(request, "news", work); }
