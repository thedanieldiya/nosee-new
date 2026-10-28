import "server-only";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { adminDatabase } from "../admin/database.ts";
import { publication } from "../admin/schema.ts";
import { publicationFieldsInput, publicationQuery } from "./input.ts";
import { publicationDateKey } from "./content.ts";
export const publicPublicationQuery = publicationQuery.omit({status:true});
export type PublicPublication = {slug:string;title:string;doi:string;authors:string[];type:string;publicationDate:string;source:string;referenceUrl:string;abstract:string;researchAreas:Array<keyof typeof import("../membership/options.ts").researchInterests>;group:{name:string;slug:string}|null};
const groupInput=z.object({name:z.string().max(160),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80)}).strict().nullable();
const visible=sql`${publication.status}='published' and ${publication.deletedAt} is null`;
const summary=sql`(${publication.publishedContent}-'abstract'-'lookup'-'groupId') || '{"abstract":"","lookup":null,"groupId":null}'::jsonb`;
function content(row:{slug:string;key:number|null;content:unknown}):PublicPublication|null {
 if(!row.content||typeof row.content!=="object")return null;
 const {slug,publicGroup,...fields}=row.content as Record<string,unknown>, parsed=publicationFieldsInput.safeParse(fields), group=groupInput.safeParse(publicGroup);
 if(!parsed.success||!group.success||slug!==row.slug||publicationDateKey(parsed.data.publicationDate)!==row.key)return null;
 const v=parsed.data;
 return {slug:row.slug,title:v.title,doi:v.doi,authors:v.authors,type:v.type,publicationDate:v.publicationDate,source:v.source,referenceUrl:v.referenceUrl,abstract:v.abstract,researchAreas:v.researchAreas,group:group.data};
}
export async function publishedPublication(slug:string) {
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>80||!process.env.DATABASE_URL)return null;
 const [row]=await adminDatabase().db.select({slug:publication.slug,key:publication.publishedDateKey,content:publication.publishedContent}).from(publication).where(sql`${visible} and ${publication.slug}=${slug}`).limit(1);
 return row?content(row):null;
}
export async function publishedPublicationFeed() {
 const rows=await adminDatabase().db.select({slug:publication.slug,key:publication.publishedDateKey,content:summary}).from(publication).where(visible).orderBy(sql`${publication.publishedDateKey} desc,${publication.slug} collate "C" asc`).limit(3);
 return rows.flatMap(r=>content(r)??[]);
}
export async function publishedPublications(raw:unknown) {
 const query=publicPublicationQuery.safeParse(raw);if(!query.success)throw new Error("Invalid publication filters.");
 const q=query.data;
 if(!process.env.DATABASE_URL)return {rows:[],total:0,page:1,pages:1};
 const pattern=`%${q.q.replace(/[\\%_]/g,"\\$&")}%`;
 const where=sql`${visible} and (${publication.publishedContent}->>'title' ilike ${pattern} or ${publication.publishedContent}->>'authors' ilike ${pattern} or ${publication.publishedContent}->>'source' ilike ${pattern} or ${publication.publishedContent}->>'doi' ilike ${pattern}) and (${q.type}='' or ${publication.publishedContent}->>'type'=${q.type}) and (${q.area}='' or ${publication.publishedContent}->'researchAreas' ? ${q.area})`;
 const result=await adminDatabase().db.execute<{total:number;rows:Array<{slug:string;key:number;content:unknown}>}>(sql`with eligible as(select ${publication.slug} slug,${publication.publishedDateKey} key,${summary} content from ${publication} where ${where}), totals as(select count(*)::int total from eligible), page_rows as(select * from eligible order by key desc,slug collate "C" asc limit 12 offset (least(${q.page},greatest(1,(select ceil(total/12.0)::int from totals)))-1)*12) select total,coalesce((select json_agg(page_rows) from page_rows),'[]'::json) rows from totals`);
 const value=result.rows[0],pages=Math.max(1,Math.ceil(value.total/12));
 return {rows:value.rows.flatMap(r=>content(r)??[]),total:value.total,page:Math.min(q.page,pages),pages};
}
