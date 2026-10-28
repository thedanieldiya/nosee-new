import { publishingApi } from '../admin/publishing-api.ts';
import type { Principal } from '../admin/policy.ts';
export const siteContentApi=(r:Request,work:(actor:Principal,body:unknown)=>Promise<unknown>)=>publishingApi(r,'site-content',work);
export {refreshSiteContent} from './cache.ts';
