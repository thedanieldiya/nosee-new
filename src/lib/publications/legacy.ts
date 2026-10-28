import "server-only";
import { randomUUID,createHash } from "node:crypto";
import { eq,sql } from "drizzle-orm";
import { publicationRecords } from "../content/publications.ts";
import { publication,publicationDoi,auditLog } from "../admin/schema.ts";
import { authorizedPublishing } from "../admin/publishing.ts";
import type { Principal } from "../admin/policy.ts";
import { ManagementError } from "../admin/errors.ts";
import { publicationFieldsInput } from "./input.ts";
import { emptyPublicationFields,publicationDateKey } from "./content.ts";
import { checkDoi,publicationSnapshot } from "./service.ts";
const areas={"space-weather":"space_weather","climate-science":"climate_science","atmosphere-and-air-quality":"atmosphere_air_quality","earth-and-space-informatics":"earth_space_informatics","energy-resources-and-environment":"energy_resources_environment"} as const;
export const legacyPublicationProvenance="inherited development fixture; src/lib/content/publications.ts at abe9457; not approved organisational facts or verified DOI metadata";
export function legacyPublicationMapping(){return publicationRecords.map(r=>({slug:r.slug,provenance:legacyPublicationProvenance,fields:publicationFieldsInput.parse({...emptyPublicationFields(),title:r.title,authors:[...r.authors],type:r.type,publicationDate:r.publication_date,source:r.publication_source,doi:r.doi,researchAreas:[areas[r.research_area]]})}));}
export async function importLegacyPublications(actor:Principal,reviewedPublishedSlugs:readonly string[]=[]){
 const mapping=legacyPublicationMapping();if(reviewedPublishedSlugs.some(slug=>!mapping.some(r=>r.slug===slug)))throw new ManagementError("Review only known legacy slugs.");
 return authorizedPublishing(actor,async tx=>{
  const report:Array<{slug:string;outcome:string}>=[];
  for(const r of mapping){
   const [prior]=await tx.select().from(publication).where(eq(publication.slug,r.slug));
   if(prior){if(prior.provenance!==r.provenance)throw new ManagementError("A legacy URL belongs to another publication. Review the mapping.",409);report.push({slug:r.slug,outcome:"retained "+prior.status});continue;}
   await checkDoi(tx,r.fields.doi);const id=randomUUID(),published=reviewedPublishedSlugs.includes(r.slug),content=published?await publicationSnapshot(tx,r.fields,r.slug):null;
   await tx.insert(publication).values({...r,id,doi:r.fields.doi||null,status:published?"published":"draft",creationKey:randomUUID(),creationDigest:createHash("sha256").update(JSON.stringify(r)).digest("hex"),createdBy:actor.id,...(content?{publishedContent:content,publishedDateKey:publicationDateKey(content.publicationDate),publishedAt:sql`clock_timestamp()`}:{})});
   if(r.fields.doi)await tx.insert(publicationDoi).values({doi:r.fields.doi,publicationId:id});
   await tx.insert(auditLog).values({id:randomUUID(),actorId:actor.id,action:"Imported legacy development publication",targetType:"publication",targetId:id,targetLabel:"Publication",changes:{before:{status:"legacy"},after:{status:published?"published":"draft"}}});
   report.push({slug:r.slug,outcome:published?"imported published development fixture":"imported draft"});
  }
  return report;
 });
}
