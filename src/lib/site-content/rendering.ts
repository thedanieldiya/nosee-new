import type {HeroItem} from '../content/homepage.ts';
import type {AboutProfile} from '../content/about.ts';
// Missing or unavailable database never restores legacy content after cutover.
export async function homepageHero():Promise<readonly HeroItem[]>{if(!process.env.DATABASE_URL)return[];try{return await(await import('./public.ts')).publicHero();}catch{return[];}}
export async function aboutLeadership():Promise<{people:readonly AboutProfile[];legacy:boolean;unavailable?:boolean}>{if(!process.env.DATABASE_URL)return{people:[],legacy:false,unavailable:true};try{return await(await import('./public.ts')).publicLeadership();}catch{return{people:[],legacy:false,unavailable:true};}}
