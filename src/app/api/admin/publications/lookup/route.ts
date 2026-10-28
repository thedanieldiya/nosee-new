import { publicationsApi } from "@/lib/publications/api";
import { lookupPublication } from "@/lib/publications/lookup";
export const dynamic="force-dynamic";
export function POST(request:Request){return publicationsApi(request,(actor,body)=>lookupPublication(actor,body));}
