import {siteContentApi,refreshSiteContent} from "@/lib/site-content/api";
import {cutoverLeadership} from "@/lib/site-content/service";
export function POST(r:Request){return siteContentApi(r,async(a,b)=>refreshSiteContent(await cutoverLeadership(a,b),'/about'));}
