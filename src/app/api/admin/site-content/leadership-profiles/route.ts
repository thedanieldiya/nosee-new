import {siteContentApi,refreshSiteContent} from "@/lib/site-content/api";
import {profileDirectory,saveProfile} from "@/lib/site-content/service";
export const dynamic="force-dynamic";
export function GET(r:Request){return siteContentApi(r,a=>profileDirectory(a,Object.fromEntries(new URL(r.url).searchParams)));}
export function POST(r:Request){return siteContentApi(r,async(a,b)=>refreshSiteContent(await saveProfile(a,null,b),'/about'));}
