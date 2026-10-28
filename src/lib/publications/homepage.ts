import type { PublicationRecord } from "../content/publications.ts";
import { researchInterests } from "../membership/options.ts";
export async function homepagePublications():Promise<PublicationRecord[]> {
 if(!process.env.DATABASE_URL)return [];
 try{return (await (await import("./public.ts")).publishedPublicationFeed()).map(r=>({slug:r.slug,title:r.title,type:r.type,authors:r.authors,publication_date:r.publicationDate,publication_source:r.source,research_area:r.researchAreas.map(k=>researchInterests[k]).join(" · "),doi:r.doi}));}
 catch{return [];}
}
