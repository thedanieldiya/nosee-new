import {z} from 'zod';
import {siteContentApi} from "@/lib/site-content/api";
import {profileDirectory} from "@/lib/site-content/service";
export function POST(r:Request){return siteContentApi(r,async(a,b)=>profileDirectory(a,{q:z.object({q:z.string().min(2).max(120)}).strict().parse(b).q}));}
