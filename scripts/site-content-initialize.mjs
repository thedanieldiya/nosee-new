// Read-only inventory by default; explicit --apply preserves hero and only optionally imports profile drafts.
import{eq}from'drizzle-orm';
import{adminDatabase}from'../src/lib/admin/database.ts';import{user}from'../src/lib/admin/schema.ts';
import{initializeSiteContent,legacyProfiles}from'../src/lib/site-content/legacy.ts';import{heroItems}from'../src/lib/content/homepage.ts';
const args=process.argv.slice(2);
if(!args.includes('--apply'))console.log(JSON.stringify({hero:heroItems,profiles:legacyProfiles().map(p=>({id:p.id,name:p.fields.displayName,portrait:p.fields.portrait,provenance:p.provenance,status:'draft'})),leadershipCutover:'first explicit profile publication or confirmed UI cutover only'},null,2));
else{const id=args.find(v=>v.startsWith('--actor='))?.slice(8);if(!id||! /^[0-9a-f-]{36}$/.test(id))throw Error('Supply an existing publishing administrator UUID using --actor=.');const{db,pool}=adminDatabase();try{const[a]=await db.select().from(user).where(eq(user.id,id));if(!a)throw Error('Publishing administrator not found.');console.log(JSON.stringify(await initializeSiteContent(a,args.includes('--draft-profiles')),null,2));}finally{await pool.end();}}
