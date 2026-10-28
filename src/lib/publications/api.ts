import { publishingApi } from "../admin/publishing-api.ts";
import type { Principal } from "../admin/policy.ts";
export function publicationsApi(request:Request,work:(actor:Principal,body:unknown)=>Promise<unknown>){return publishingApi(request,"publications",work);}
