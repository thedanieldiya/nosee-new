import {z} from 'zod';
import {siteContentApi} from "@/lib/site-content/api";
import {profileMemberInfo} from "@/lib/site-content/service";
export const dynamic="force-dynamic";
export function POST(r:Request,c:{params:Promise<{id:string}>}){return siteContentApi(r,async(a,b)=>profileMemberInfo(a,(await c.params).id,z.object({q:z.string().max(120)}).strict().parse(b).q));}
