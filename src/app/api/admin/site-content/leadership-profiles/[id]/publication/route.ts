import {siteContentApi,refreshSiteContent} from "@/lib/site-content/api";
import {profilePublication} from "@/lib/site-content/service";
export const dynamic="force-dynamic";
export function POST(r:Request,c:{params:Promise<{id:string}>}){return siteContentApi(r,async(a,b)=>refreshSiteContent(await profilePublication(a,(await c.params).id,b),'/about'));}
