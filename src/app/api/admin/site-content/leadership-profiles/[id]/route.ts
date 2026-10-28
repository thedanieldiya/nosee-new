import {siteContentApi,refreshSiteContent} from "@/lib/site-content/api";
import {getProfile,saveProfile,deleteProfile} from "@/lib/site-content/service";
export const dynamic="force-dynamic";
type C={params:Promise<{id:string}>};
export function GET(r:Request,c:C){return siteContentApi(r,async a=>getProfile(a,(await c.params).id));}
export function PATCH(r:Request,c:C){return siteContentApi(r,async(a,b)=>refreshSiteContent(await saveProfile(a,(await c.params).id,b),'/about'));}
export function DELETE(r:Request,c:C){return siteContentApi(r,async(a,b)=>refreshSiteContent(await deleteProfile(a,(await c.params).id,b),'/about'));}
