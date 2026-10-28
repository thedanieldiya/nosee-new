import 'server-only';
import { eq,sql } from 'drizzle-orm';
import { adminDatabase } from '../admin/database.ts';
import { homepageHero,siteContentState,leadershipProfile,leadershipProfileIdentity } from '../admin/schema.ts';
import { heroItems } from '../content/homepage.ts';
import { about,type AboutProfile } from '../content/about.ts';
import { heroFieldsInput,profileFieldsInput,profileName } from './input.ts';
export async function publicHero(){if(!process.env.DATABASE_URL)return [];try{const[r]=await adminDatabase().db.select({content:homepageHero.publishedContent}).from(homepageHero).where(eq(homepageHero.id,'homepage'));return r?heroFieldsInput.parse(r.content):heroItems;}catch{return [];}}
export async function publicLeadership():Promise<{people:readonly AboutProfile[];legacy:boolean;unavailable?:boolean}>{if(!process.env.DATABASE_URL)return{people:[],legacy:false,unavailable:true};try{const[state]=await adminDatabase().db.select({id:siteContentState.id}).from(siteContentState).where(eq(siteContentState.id,'leadership'));if(!state)return{people:about.leadership.people,legacy:true};
const rows=await adminDatabase().db.select({id:leadershipProfile.id,content:leadershipProfile.publishedContent}).from(leadershipProfile).innerJoin(leadershipProfileIdentity,eq(leadershipProfile.id,leadershipProfileIdentity.id)).where(sql`${leadershipProfile.status}='published' and ${leadershipProfileIdentity.deletedAt} is null`).orderBy(leadershipProfile.publishedOrder,leadershipProfile.id);
return{legacy:false,people:rows.flatMap(r=>{const parsed=profileFieldsInput.safeParse(r.content);if(!parsed.success)return[];const f=parsed.data;return[{id:r.id,name:profileName(f),title:f.roleTitle,image:f.portrait,image_alt:f.portraitAlt,category:f.category,affiliation:f.affiliation,researchInterests:f.researchInterests,biography:f.biography}];})};}catch{return{people:[],legacy:false,unavailable:true};}}
