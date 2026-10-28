import {siteContentApi,refreshSiteContent} from "@/lib/site-content/api";
import {getHero,saveHero} from "@/lib/site-content/service";
export const dynamic="force-dynamic";
export function GET(r:Request){return siteContentApi(r,a=>getHero(a));}
export function PATCH(r:Request){return siteContentApi(r,async(a,b)=>{const result=await saveHero(a,b);return (b as {mode:string}).mode==='publish'?refreshSiteContent(result,'/'):result;});}
