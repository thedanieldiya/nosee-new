import { publicationsApi } from "@/lib/publications/api";
import { publicationGroups } from "@/lib/publications/service";
import { z } from "zod";
import { ManagementError } from "@/lib/admin/errors";
export const dynamic="force-dynamic";
export function POST(request:Request){return publicationsApi(request,(actor,body)=>{const value=z.object({q:z.string().trim().max(120)}).strict().safeParse(body);if(!value.success)throw new ManagementError("Use a valid group search.");return publicationGroups(actor,value.data.q);});}
