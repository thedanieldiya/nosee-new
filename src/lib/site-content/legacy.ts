import 'server-only';
import { createHash,randomUUID } from 'node:crypto';
import {eq,sql} from 'drizzle-orm';
import {about} from '../content/about.ts';
import {heroItems} from '../content/homepage.ts';
import {leadershipProfile,leadershipProfileIdentity,homepageHero,auditLog} from '../admin/schema.ts';
import {authorizedPublishing} from '../admin/publishing.ts';
import {ManagementError} from '../admin/errors.ts';
import type {Principal} from '../admin/policy.ts';
import {emptyProfile,heroFieldsInput,profileName} from './input.ts';
const provenance='inherited unapproved development placeholder; content/about.ts at 2d22934';
export function legacyProfiles(){return about.leadership.people.map((p,i)=>{const bytes=createHash('sha256').update('nosee-a10-legacy-profile:'+i).digest();bytes[6]=(bytes[6]&15)|80;bytes[8]=(bytes[8]&63)|128;const h=bytes.toString('hex');return{id:`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`,fields:{...emptyProfile(),displayName:p.name,roleTitle:p.title,portrait:p.image,portraitAlt:p.image_alt,displayOrder:i},provenance};});}
export async function initializeSiteContent(actor:Principal,includeDraftProfiles=false){return authorizedPublishing(actor,async tx=>{const hero=await tx.insert(homepageHero).values({id:'homepage',fields:heroFieldsInput.parse(heroItems),publishedContent:heroFieldsInput.parse(heroItems)}).onConflictDoNothing().returning();let imported=0;
if(includeDraftProfiles)for(const p of legacyProfiles()){const[prior]=await tx.select().from(leadershipProfile).where(eq(leadershipProfile.id,p.id));if(prior){if(prior.provenance!==provenance)throw new ManagementError('Legacy identity conflict. Review before importing.',409);continue;}await tx.insert(leadershipProfileIdentity).values({id:p.id,displayName:profileName(p.fields),roleTitle:p.fields.roleTitle});await tx.insert(leadershipProfile).values({id:p.id,fields:p.fields,creationKey:p.id,creationDigest:provenance,provenance,createdBy:actor.id});imported++;}
if(hero.length||imported)await tx.insert(auditLog).values({id:randomUUID(),actorId:actor.id,targetType:'site_content',targetId:null,targetLabel:'Site content',action:'Initialized existing development content',changes:{before:{status:'uninitialized'},after:{status:`hero:${hero.length}; draft profiles:${imported}`}},createdAt:sql`clock_timestamp()`});return{hero:hero.length?'initialized unchanged':'retained',draftProfilesImported:imported,leadershipCutover:false};});}
