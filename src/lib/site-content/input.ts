import { z } from "zod";
import { validateDescription, descriptionDocument, type Description } from "../research/description.ts";
import { heroItems } from "../content/homepage.ts";
import { about } from "../content/about.ts";
import { canonicalContentFingerprint } from "../news/draft-state.ts";
const text=(max:number)=>z.string().trim().max(max).refine(v=>!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v),"Use printable text.");
export function safeSiteUrl(v:string){if(v.startsWith('/')&&!v.startsWith('//'))return !/[\\\s\x00-\x1f\x7f]/.test(v);try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password&&!/[\\\s]/.test(v);}catch{return false;}}
const image=z.string().refine(v=>v===''||[...heroItems.map(s=>s.image),...about.leadership.people.map(p=>p.image)].includes(v as never),'Retain the existing image; uploads are deferred.');
export const heroSlideInput=z.object({id:z.string().regex(/^[a-z0-9-]{1,80}$/),eyebrow:text(100),title:text(240).min(1,'Add a slide title.'),summary:text(1000),image,image_alt:text(400),image_credit:text(500),cta_label:text(80),cta_url:text(2048)}).strict().superRefine((v,c)=>{if(!!v.cta_label!==!!v.cta_url||v.cta_url&&!safeSiteUrl(v.cta_url))c.addIssue({code:'custom',path:['cta_url'],message:'Provide both a CTA label and a safe relative or HTTP(S) URL, or leave both empty.'});if(v.image&&!v.image_alt)c.addIssue({code:'custom',path:['image_alt'],message:'Describe the retained image.'});});
export const heroFieldsInput=z.array(heroSlideInput).max(12).refine(v=>new Set(v.map(s=>s.id)).size===v.length,'Slide IDs must be unique.');
export type HeroFields=z.infer<typeof heroFieldsInput>;
const biography=z.unknown().transform((v,c):Description=>{try{return validateDescription(v);}catch{c.addIssue({code:'custom',message:'Use supported biography formatting within 6,000 characters.'});return z.NEVER;}});
export const profileFieldsInput=z.object({firstName:text(100),lastName:text(100),displayName:text(200),roleTitle:text(200).min(1,'Add a role/title.'),category:z.enum(['','executive','researcher']),affiliation:text(300),researchInterests:text(1000),biography,portrait:image,portraitAlt:text(400),displayOrder:z.number().int().min(0).max(9999)}).strict().superRefine((v,c)=>{if(!v.displayName&&!v.firstName&&!v.lastName)c.addIssue({code:'custom',path:['displayName'],message:'Add a display name or first/last name.'});if(v.portrait&&!v.portraitAlt)c.addIssue({code:'custom',path:['portraitAlt'],message:'Describe the retained portrait.'});});
export type ProfileFields=z.infer<typeof profileFieldsInput>;
export const profileName=(f:Pick<ProfileFields,'displayName'|'firstName'|'lastName'>)=>f.displayName||[f.firstName,f.lastName].filter(Boolean).join(' ');
export const emptyProfile=():ProfileFields=>({firstName:'',lastName:'',displayName:'',roleTitle:'',category:'',affiliation:'',researchInterests:'',biography:'',portrait:'',portraitAlt:'',displayOrder:0});
export function fingerprint(value:ProfileFields|HeroFields){return canonicalContentFingerprint(Array.isArray(value)?value:{...value,biography:descriptionDocument(value.biography)});}
const mutation={version:z.number().int().min(0),mutationId:z.uuid(),confirm:z.literal(true)};
export const heroSaveInput=z.object({...mutation,fields:heroFieldsInput,mode:z.enum(['draft','publish'])}).strict();
export const profileSaveInput=z.object({...mutation,fields:profileFieldsInput,mode:z.enum(['draft','publish'])}).strict();
export const profileStateInput=z.object({...mutation,action:z.enum(['publish','unpublish'])}).strict();
export const profileDeleteInput=z.object({...mutation,phrase:text(240)}).strict();
export const directoryQuery=z.object({q:text(120).default(''),status:z.enum(['','draft','published','unpublished']).default(''),category:z.enum(['','executive','researcher']).default(''),page:z.coerce.number().int().min(1).max(100000).default(1)}).strict();
