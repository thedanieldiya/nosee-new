// Destructive setup is restricted to this task's disposable loopback database.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID,randomBytes } from 'node:crypto';
import { writeFileSync,chmodSync,readFileSync } from 'node:fs';
import { hashPassword } from 'better-auth/crypto';
import { eq,sql } from 'drizzle-orm';
import { adminDatabase } from '../src/lib/admin/database.ts';
import { user,account,event,auditLog,loginAttempt } from '../src/lib/admin/schema.ts';
import * as service from '../src/lib/events/service.ts';
import { publishedEvent,publishedEvents,homepageEvents } from '../src/lib/events/public.ts';
import { emptyEventFields,eventDeletionPhrase } from '../src/lib/events/content.ts';
import { importLegacyEvents,legacyEventMapping } from '../src/lib/events/legacy.ts';
import { seedLeadScope } from './helpers/research-fixture.mjs';
const database=new URL(process.env.DATABASE_URL||''),base=process.env.ADMIN_ORIGIN;
assert.equal(database.hostname,'127.0.0.1');assert.equal(database.port,'55433');assert.equal(database.pathname,'/nosee_admin01_test');assert.equal(new URL(base).hostname,'127.0.0.1');
for(const k of['DATABASE_URL_UNPOOLED','DATABASE_MIGRATION_URL','RESEND_API_KEY','MEMBERSHIP_EMAIL_ENABLED'])assert.ok(!process.env[k]);
const {db,pool}=adminDatabase(),fixtures={};let admin,editor,lead;
const fields=(patch={})=>({...emptyEventFields(new Date('2030-05-01T09:00:00Z')),title:'Synthetic event '+randomUUID(),summary:'Synthetic summary',body:'Synthetic event description.',organiser:'Synthetic organiser',location:{type:'physical',venue:'Synthetic venue',address:'',city:'Lagos',country:'Nigeria',platform:''},...patch});
async function credential(role){const p={id:randomUUID(),firstName:'Events',lastName:'Reviewer',email:randomUUID()+'@example.invalid',password:randomBytes(32).toString('base64url'),role,researchGroupId:role==='research_group_lead'?randomUUID():null};await db.insert(user).values({...p,password:undefined,name:'Events Reviewer'});await db.insert(account).values({id:randomUUID(),accountId:p.id,userId:p.id,providerId:'credential',password:await hashPassword(p.password)});if(role==='research_group_lead')await seedLeadScope(db,p);return p;}
const fresh=async id=>(await db.select().from(user).where(eq(user.id,id)))[0];
const get=async id=>service.getEvent(editor,id);
const add=async(f=fields(),mode='draft',actor=editor)=>(await service.createEvent(actor,{fields:f,mode,requestId:randomUUID(),confirm:true})).id;
const save=async(id,f,mode='draft',patch={})=>service.updateEvent(editor,id,{fields:f,mode,version:(await get(id)).version,mutationId:randomUUID(),confirm:true,...patch});
const publish=async(id,action='publish')=>service.publishEvent(editor,id,{action,version:(await get(id)).version,mutationId:randomUUID(),confirm:true});
const remove=async(id,patch={})=>service.deleteEvent(editor,id,{phrase:eventDeletionPhrase((await get(id)).fields.title),version:(await get(id)).version,mutationId:randomUUID(),confirm:true,...patch});
async function request(path,{method='GET',body,cookie,origin=base}={}){const response=await fetch(base+path,{method,redirect:'manual',headers:{...(cookie?{cookie}:{}),...(method!=='GET'&&method!=='HEAD'?{origin,'content-type':'application/json'}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});return{status:response.status,headers:response.headers,text:await response.text()};}
async function login(person){await db.delete(loginAttempt);const r=await request('/api/admin/auth/sign-in/email',{method:'POST',body:{email:person.email,password:person.password}});assert.equal(r.status,200);return r.headers.getSetCookie().find(v=>v.includes('session_token='))?.split(';')[0];}
test.beforeEach(async()=>{await db.execute(sql`truncate event,admin_rate_limit`);});
try{
 fixtures.super_admin=await credential('super_admin');fixtures.editor=await credential('editor');fixtures.research_group_lead=await credential('research_group_lead');
 admin=await fresh(fixtures.super_admin.id);editor=await fresh(fixtures.editor.id);lead=await fresh(fixtures.research_group_lead.id);
 const cookies={super_admin:await login(fixtures.super_admin),editor:await login(fixtures.editor),research_group_lead:await login(fixtures.research_group_lead)};
 await test('Super Admin and Editor access pages, APIs and private preview; Lead and anonymous are denied',async()=>{
  const id=await add();for(const role of['super_admin','editor'])for(const path of['/admin/publishing/events','/admin/publishing/events/new','/admin/publishing/events/'+id,'/admin/publishing/events/'+id+'?preview=1','/api/admin/events','/api/admin/events/'+id]){const r=await request(path,{cookie:cookies[role]});assert.equal(r.status,200,path);assert.match(r.headers.get('cache-control'),/private.*no-store/);}
  for(const path of['/admin/publishing/events','/admin/publishing/events/new','/admin/publishing/events/'+id,'/admin/publishing/events/'+id+'?preview=1']){assert.equal((await request(path,{cookie:cookies.research_group_lead})).status,403);assert.equal((await request(path)).status,307);}
  for(const path of['/api/admin/events','/api/admin/events/'+id]){assert.equal((await request(path,{cookie:cookies.research_group_lead})).status,403);assert.equal((await request(path)).status,401);}
  for(const run of[()=>service.eventsDirectory(lead,{}),()=>service.getEvent({...lead,role:'super_admin'},id),()=>add(fields(),'draft',lead),()=>service.publishEvent(lead,id,{action:'publish',version:1,mutationId:randomUUID(),confirm:true}),()=>service.deleteEvent(lead,id,{phrase:'Delete x',version:1,mutationId:randomUUID(),confirm:true})])await assert.rejects(run,e=>e.status===403);
 });
 await test('same-origin, role, confirmation, safe URLs and strict fields guard every mutation',async()=>{
  const id=await add();for(const [path,method,body]of[['/api/admin/events','POST',{fields:fields(),requestId:randomUUID(),confirm:true}],['/api/admin/events/'+id,'PATCH',{fields:fields(),version:1,mutationId:randomUUID(),confirm:true}],['/api/admin/events/'+id+'/publication','POST',{action:'publish',version:1,mutationId:randomUUID(),confirm:true}],['/api/admin/events/'+id,'DELETE',{phrase:'Delete x',version:1,mutationId:randomUUID(),confirm:true}]]){assert.equal((await request(path,{method,body,cookie:cookies.editor,origin:'https://foreign.invalid'})).status,403);assert.equal((await request(path,{method,body,cookie:cookies.research_group_lead})).status,403);assert.equal((await request(path,{method,body})).status,401);}
  for(const patch of[{slug:'forged'},{coverImage:'https://x.invalid/x.png'},{status:'published'},{registrationUrl:'javascript:alert(1)'},{meetingSiteUrl:'https://user:pass@example.org'},{startAt:'tomorrow'},{endAt:'invalid'}])await assert.rejects(add({...fields(),...patch}));
  await assert.rejects(service.createEvent(editor,{fields:fields(),requestId:randomUUID()}));
 });
 await test('direct publication is atomic, future schedules publish now, and incomplete drafts remain private',async()=>{
  const draft=await add(fields({body:'',summary:'',organiser:''}));assert.equal(await publishedEvent((await get(draft)).slug),null);await assert.rejects(publish(draft));
  const id=await add(fields(),'publish'),r=await get(id),live=await publishedEvent(r.slug);assert.equal(r.status,'published');assert.ok(live);assert.equal(live.title,r.fields.title);assert.ok(!('creationKey'in live));assert.ok(!('fields'in live));
  const before=(await db.select().from(event)).length;await assert.rejects(add(fields({body:''}),'publish'));assert.equal((await db.select().from(event)).length,before);
 });
 await test('saved revision, identical save, bookkeeping, revert and republish use canonical public comparison',async()=>{
  const f=fields(),id=await add(f,'publish'),slug=(await get(id)).slug,live=await publishedEvent(slug),flag=async()=>(await service.eventsDirectory(editor,{})).rows.find(r=>r.id===id).hasUnpublishedChanges;
  assert.equal(await flag(),false);await save(id,f);assert.equal(await flag(),false);
  await db.update(event).set({updatedAt:new Date(),lastMutationDigest:'metadata'}).where(eq(event.id,id));assert.equal(await flag(),false);
  await save(id,{...f,body:'Private changed description',summary:'Private summary'});assert.equal(await flag(),true);assert.deepEqual(await publishedEvent(slug),live);
  const dto=(await service.eventsDirectory(editor,{})).rows[0];assert.deepEqual(Object.keys(dto).sort(),['id','title','type','slug','status','version','updatedAt','timing','hasUnpublishedChanges'].sort());assert.doesNotMatch(JSON.stringify(dto),/Private changed|Private summary/);
  await save(id,f);assert.equal(await flag(),false);await save(id,{...f,featured:true});assert.equal(await flag(),true);await publish(id);assert.equal(await flag(),false);
  await save(id,{...f,summary:'New private'});await publish(id,'unpublish');assert.equal(await flag(),false);assert.equal(await publishedEvent(slug),null);assert.equal((await get(id)).status,'unpublished');
 });
 await test('idempotent save/create/delete retries do not duplicate; altered retry keys and stale concurrent mutations fail',async()=>{
  const f=fields(),requestId=randomUUID(),a=await Promise.all([service.createEvent(editor,{fields:f,requestId,confirm:true}),service.createEvent(admin,{fields:f,requestId,confirm:true})]);assert.equal(a[0].id,a[1].id);const id=a[0].id;
  await assert.rejects(service.createEvent(editor,{fields:{...f,title:'Different'},requestId,confirm:true}),e=>e.status===409);
  const payload={fields:{...f,title:'Saved once'},version:1,mode:'draft',mutationId:randomUUID(),confirm:true};await service.updateEvent(editor,id,payload);await service.updateEvent(editor,id,payload);assert.equal((await get(id)).version,2);
  await assert.rejects(service.updateEvent(editor,id,{...payload,fields:f}),e=>e.status===409);
  const attempts=await Promise.allSettled([save(id,f,'draft',{version:2}),save(id,{...f,title:'Concurrent'},'draft',{version:2})]);assert.equal(attempts.filter(a=>a.status==='fulfilled').length,1);
  const current=await get(id),deletion={phrase:eventDeletionPhrase(current.fields.title),version:current.version,mutationId:randomUUID(),confirm:true};await service.deleteEvent(editor,id,deletion);await service.deleteEvent(editor,id,deletion);await assert.rejects(service.updateEvent(editor,id,payload),e=>e.status===404);
 });
 await test('stable automatic slugs handle concurrent collisions, renamed titles, reserved legacy URLs and tombstones',async()=>{
  const f=fields({title:'Collision event'}),ids=await Promise.all([add(f),add(f),add(f)]),rows=await Promise.all(ids.map(get));assert.deepEqual(rows.map(r=>r.slug).sort(),['collision-event','collision-event-2','collision-event-3']);await save(ids[0],{...f,title:'Renamed'});assert.equal((await get(ids[0])).slug,rows[0].slug);await remove(ids[0]);assert.equal((await get(await add(f))).slug,'collision-event-4');
  assert.equal((await get(await add(fields({title:'icelli2026'})))).slug,'icelli2026-2');assert.equal((await get(await add(fields({title:'Archive'})))).slug,'archive-2');
 });
 await test('typed deletion requires exact title/current version/confirmation, preserves audits and blocks stale publication',async()=>{
  const id=await add(fields(),'publish'),r=await get(id);await assert.rejects(remove(id,{phrase:'delete '+r.fields.title}));await assert.rejects(remove(id,{version:99}),e=>e.status===409);await assert.rejects(remove(id,{confirm:false}));await remove(id);
  assert.equal(await publishedEvent(r.slug),null);assert.ok(!(await homepageEvents()).some(e=>e.slug===r.slug));assert.equal((await publishedEvents()).total,0);await assert.rejects(publish(id),e=>e.status===404);
  const log=await db.select().from(auditLog).where(eq(auditLog.targetId,id));assert.ok(log.some(l=>l.action==='Deleted event'));assert.doesNotMatch(JSON.stringify(log),/Synthetic event description|Synthetic summary|Synthetic organiser/);
 });
 await test('published-only listing search/type filters and pagination never inspect working text',async()=>{
  for(let i=0;i<25;i++)await add(fields({title:'Page event '+String(i).padStart(2,'0')}),'publish');
  const a=await publishedEvents(),b=await publishedEvents({page:2}),c=await publishedEvents({page:3});assert.equal(a.total,25);assert.equal(a.rows.length,12);assert.equal(b.rows.length,12);assert.equal(c.rows.length,1);assert.equal(new Set([...a.rows,...b.rows,...c.rows].map(r=>r.slug)).size,25);
  assert.equal((await publishedEvents({q:'Page event 01'})).total,1);assert.equal((await publishedEvents({q:'  Page event 01  '})).total,1);assert.equal((await publishedEvents({q:'Nigeria Synthetic'})).total,0);assert.equal((await publishedEvents({type:'meeting'})).total,0);assert.equal((await publishedEvents({q:"' OR 1=1 --"})).total,0);
  const id=(await service.eventsDirectory(editor,{q:'Page event 00'})).rows[0].id;await save(id,fields({title:'PRIVATE title',summary:'PRIVATE summary'}));assert.equal((await publishedEvents({q:'PRIVATE'})).total,0);
  const adminPages=await service.eventsDirectory(editor,{});assert.equal(adminPages.rows.length,20);assert.equal((await service.eventsDirectory(editor,{page:2})).rows.length,5);assert.equal((await service.eventsDirectory(editor,{status:'draft'})).total,0);assert.equal((await service.eventsDirectory(editor,{type:'workshop',timing:'upcoming'})).total,25);
 });
 await test('homepage orders Featured upcoming first, fills nearest starts, caps three and handles deterministic ties',async()=>{
  const schedule=n=>({startAt:`2030-05-${String(n).padStart(2,'0')}T09:00:00Z`,endAt:`2030-05-${String(n).padStart(2,'0')}T10:00:00Z`});
  const near=await add(fields({title:'Nearest',...schedule(1)}),'publish'),a=await add(fields({title:'A tie',featured:true,...schedule(3)}),'publish'),b=await add(fields({title:'B tie',featured:true,...schedule(3)}),'publish');await add(fields({...schedule(4)}),'publish');await add(fields({featured:true,...schedule(2)}));
  const slugs=await Promise.all([a,b,near].map(async id=>(await get(id)).slug));assert.deepEqual((await homepageEvents()).map(e=>e.slug),slugs);await publish(a,'unpublish');assert.equal((await homepageEvents()).length,3);
 });
 await test('read-time eligibility changes without saving and exact end belongs to archive',async()=>{
  const now=new Date((await db.execute(sql`select clock_timestamp() now`)).rows[0].now);const f=fields({startAt:new Date(+now+1500).toISOString(),endAt:new Date(+now+3600000).toISOString()}),id=await add(f,'publish'),slug=(await get(id)).slug;
  assert.ok((await homepageEvents()).some(e=>e.slug===slug));await new Promise(resolve=>setTimeout(resolve,1700));assert.ok(!(await homepageEvents()).some(e=>e.slug===slug));assert.equal((await publishedEvents({timing:'ongoing'})).total,1);
  const past=await add(fields({startAt:'2020-01-01T00:00:00Z',endAt:'2020-01-01T01:00:00Z'}),'publish');assert.equal((await publishedEvents({timing:'past'})).rows[0].slug,(await get(past)).slug);
 });
 await test('meeting redirects use only the live stored destination, including encoded/trailing and HEAD; unpublish/delete revoke all forms',async()=>{
  const id=await add(fields({title:'Synthetic meeting',type:'meeting',meetingSiteUrl:'https://example.org/meeting?source=stored'}),'publish'),slug=(await get(id)).slug;
  for(const path of['/events/'+slug,'/events/'+slug+'/','/events/%73'+slug.slice(1)+'?url=https://evil.invalid'])for(const method of['GET','HEAD']){const r=await request(path,{method});assert.equal(r.status,302,path);assert.equal(r.headers.get('location'),'https://example.org/meeting?source=stored');assert.ok(r.text === '' || r.text === r.headers.get('location'));assert.ok(!r.text.includes('data-event-detail-page'));}
  await save(id,fields({title:'Synthetic meeting',type:'meeting',meetingSiteUrl:'https://example.org/new'}));assert.equal((await request('/events/'+slug)).headers.get('location'),'https://example.org/meeting?source=stored');
  await publish(id,'unpublish');assert.equal((await request('/events/'+slug)).status,404);await publish(id);assert.equal((await request('/events/'+slug)).headers.get('location'),'https://example.org/new');await remove(id);assert.equal((await request('/events/'+slug)).status,404);
 });
 await test('legacy mapping inventories nine development records; import is repeatable and never restores revised/unpublished/deleted rows',async()=>{
  const mapping=legacyEventMapping(),slugs=mapping.map(r=>r.slug);assert.equal(slugs.length,9);assert.equal(mapping.find(r=>r.slug==='icelli2026').fields.meetingSiteUrl,'https://icelli.nosee.org');
  await importLegacyEvents(admin,slugs);const before=await db.select().from(event);await importLegacyEvents(admin,slugs);assert.deepEqual(await db.select().from(event),before);
  const meeting=before.find(r=>r.slug==='icelli2026');await publish(meeting.id,'unpublish');await importLegacyEvents(admin,slugs);assert.equal(await publishedEvent('icelli2026'),null);assert.equal((await request('/api/events/icelli2026/redirect')).status,404);await remove(meeting.id);await importLegacyEvents(admin,slugs);assert.equal(await publishedEvent('icelli2026'),null);assert.equal((await request('/api/events/icelli2026/redirect')).status,404);assert.equal((await db.select().from(event)).length,9);
 });
 await test('existing event route regression runs against explicitly imported isolated development records',async()=>{
  const mapping=legacyEventMapping();await importLegacyEvents(admin,mapping.map(r=>r.slug));
  for(const e of mapping){const r=await request('/events/'+e.slug);assert.equal(r.status,e.fields.type==='meeting'?302:200);if(e.fields.type==='meeting'){assert.equal(r.headers.get('location'),e.fields.meetingSiteUrl);assert.equal(r.text,'');}if(e.fields.type!=='meeting'){assert.ok(r.text.includes(e.fields.title));assert.ok(r.text.includes('data-event-detail-page'));assert.ok(r.text.includes('WAT (UTC+01:00)'));assert.ok(r.text.includes('name="robots" content="noindex, nofollow"'));}}
  for(const path of['/events/missing-event','/events/ICELLI2026']){const r=await request(path);assert.equal(r.status,404);assert.match(r.text,/>Page not found<\/h1>/);assert.equal((r.text.match(/id="main-content"/g)||[]).length,1);assert.ok(r.text.includes('data-site-footer'));}
  assert.equal((await request('/events/archive')).status,200);assert.equal((await request('/events?q=Lagos')).status,200);
 });
 await test('retained cover metadata survives edits without exposing media mutation inputs',async()=>{
  const id=await add(),r=await get(id);await db.update(event).set({coverImage:'/media/trending/trending1.png',coverAlt:'Retained synthetic cover'}).where(eq(event.id,id));await publish(id);let live=await publishedEvent(r.slug);assert.equal(live.coverImage,'/media/trending/trending1.png');await save(id,{...r.fields,title:'Changed retained cover title'},'publish');live=await publishedEvent(r.slug);assert.equal(live.coverAlt,'Retained synthetic cover');
 });
 await test('migration 0011 is additive and keeps unrelated identities and membership/media untouched',async()=>{
  const before=await db.select().from(user),rollback=new Error('isolated rollback');await assert.rejects(db.transaction(async tx=>{await tx.execute(sql`drop table event`);for(const statement of readFileSync(new URL('../drizzle/0011_events_publishing.sql',import.meta.url),'utf8').split('--> statement-breakpoint'))if(statement.trim())await tx.execute(sql.raw(statement));assert.equal((await tx.select().from(event)).length,0);assert.deepEqual(await tx.select().from(user),before);throw rollback;}),e=>e===rollback);
 });
 // Isolated browser fixture; only random synthetic access leaves this process.
 const id=await add(fields({title:'Browser event'}),'publish');fixtures.event={id,slug:(await get(id)).slug,fields:(await get(id)).fields};
 const fixturePath=process.env.NOSEE_EVENT_FIXTURE_FILE||'/tmp/nosee-a08-private/fixtures.json';assert.ok(fixturePath.startsWith('/tmp/'));writeFileSync(fixturePath,JSON.stringify(fixtures),{mode:0o600});chmodSync(fixturePath,0o600);
}finally{await pool.end();}
