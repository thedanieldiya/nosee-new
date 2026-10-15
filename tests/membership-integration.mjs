// Real PostgreSQL and HTTP checks, restricted to disposable loopback fixtures.
import assert from 'node:assert/strict';
import {seedLeadScope} from './helpers/research-fixture.mjs';
import test from 'node:test';
import {randomUUID,randomBytes} from 'node:crypto';
import {readFileSync,writeFileSync,openSync,closeSync,fchmodSync,constants,realpathSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {hashPassword} from 'better-auth/crypto';
import {sql,eq} from 'drizzle-orm';
import {adminDatabase} from '../src/lib/admin/database.ts';
import {user,account,session,auditLog,membershipApplication,loginAttempt} from '../src/lib/admin/schema.ts';
import {createApplicationToken,validApplicationToken} from '../src/lib/membership/form-guard.ts';
import {submitMembershipApplication as submit,listMembershipApplications as list,getMembershipApplication as detail,decideMembershipApplication as decide,expireMembershipApplications as sweep} from '../src/lib/membership/service.ts';
import {activityDirectory} from '../src/lib/admin/management-queries.ts';
import {membershipConsent} from '../src/lib/membership/options.ts';
const url=new URL(process.env.DATABASE_URL||''),base=process.env.ADMIN_ORIGIN;
assert.ok(['127.0.0.1','localhost'].includes(url.hostname)&&url.pathname==='/nosee_admin01_test','Disposable loopback database required.');
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Loopback app required.');
assert.ok(!process.env.DATABASE_MIGRATION_URL&&!process.env.DATABASE_URL_UNPOOLED,'Do not inject remote operator connections into tests.');
const {db,pool}=adminDatabase(),fixtures={},cookies={},headers=new Headers({origin:base,'sec-fetch-site':'same-origin'});
const input=(patch={})=>({firstName:'Applicant',lastName:'Fixture',email:`${randomUUID()}@example.invalid`,careerStage:'early_career',researchInterests:['space_weather','climate_science'],why:'Private scientific motivation. Not audit metadata.',consent:true,formToken:createApplicationToken(),website:'',...patch});
async function request(path,{method='GET',cookie,body,origin=base,headers:extra={}}={}){const r=await fetch(base+path,{method,redirect:'manual',headers:{...(cookie?{cookie}:{}),...(method==='GET'?{}:{origin,'content-type':'application/json'}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,headers:r.headers,text:await r.text()};}
async function createPerson(role){const p={id:randomUUID(),firstName:'Test',lastName:role==='super_admin'?'Reviewer':role==='editor'?'Editor':'Lead',email:`${randomUUID()}@example.invalid`,password:randomBytes(32).toString('base64url'),role,researchGroupId:role==='research_group_lead'?randomUUID():null};await db.insert(user).values({...p,password:undefined,name:p.firstName+' '+p.lastName});await db.insert(account).values({id:randomUUID(),userId:p.id,accountId:p.id,providerId:'credential',password:await hashPassword(p.password)});if(role==='research_group_lead')await seedLeadScope(db,p);return p;}
const count=async table=>Number((await db.select({n:sql`count(*)`}).from(table))[0].n);
async function row(id){return (await db.select().from(membershipApplication).where(eq(membershipApplication.id,id)))[0];}
async function received(patch={}){const data=input(patch);await submit(data,headers);return {data,record:(await db.select().from(membershipApplication).where(eq(membershipApplication.email,data.email.toLowerCase()))).sort((a,b)=>b.createdAt-a.createdAt)[0]};}
test.beforeEach(async()=>{await db.delete(loginAttempt);});
try{
 for(const role of ['super_admin','editor','research_group_lead']){fixtures[role]=await createPerson(role);await db.delete(loginAttempt);const r=await request('/api/admin/auth/sign-in/email',{method:'POST',body:{email:fixtures[role].email,password:fixtures[role].password}});assert.equal(r.status,200);cookies[role]=r.headers.getSetCookie().find(c=>c.includes('session_token='))?.split(';')[0];assert.ok(cookies[role]);}
 const actor={...fixtures.super_admin,accessVersion:0};
 await test('additive A02-to-A03 migration preserves all existing admin records and sessions',async()=>{
  const client=await pool.connect();try{await client.query('begin');
   // Reconstruct A02 only inside this rollback-only local fixture transaction.
   await client.query('delete from admin_audit_log where actor_id is null');
   const snapshot=async()=>JSON.stringify((await client.query(`select jsonb_build_object('users',(select jsonb_agg(to_jsonb(u) order by id) from administrator u),'accounts',(select jsonb_agg(to_jsonb(a) order by id) from admin_account a),'sessions',(select jsonb_agg(to_jsonb(s) order by id) from admin_session s),'audit',(select jsonb_agg(to_jsonb(l) order by id) from admin_audit_log l)) records`)).rows[0].records);
   const before=await snapshot();await client.query('drop table membership_notification;drop table membership_application_member;drop table membership_application;drop type membership_application_status;alter table admin_audit_log alter column actor_id set not null');
   for(const statement of readFileSync(new URL('../drizzle/0002_membership_applications.sql',import.meta.url),'utf8').split('--> statement-breakpoint'))await client.query(statement);
   assert.equal(await snapshot(),before);
  }finally{await client.query('rollback');client.release();}
 });
 await test('anonymous submission persists multiple interests and versioned affirmative consent without identities or sessions',async()=>{
  const before=await Promise.all([count(user),count(account),count(session)]),{record}=await received();
  assert.equal(record.status,'pending');assert.deepEqual(record.researchInterests,['climate_science','space_weather']);assert.equal(record.expiresAt-record.createdAt,720*3600000);assert.ok(record.consentedAt instanceof Date);assert.equal(record.consentVersion,membershipConsent.version);assert.equal(record.privacyVersion,membershipConsent.privacyVersion);
  assert.deepEqual(await Promise.all([count(user),count(account),count(session)]),before);assert.equal((await request('/api/admin/profile')).status,401);
 });
 await test('signed form tokens expire at exactly two hours and reject tampering/future timestamps/missing secrets',async()=>{
  const now=Date.now(),token=createApplicationToken(now);assert.equal(validApplicationToken(token,now+7199999),true);assert.equal(validApplicationToken(token,now+7200000),false);assert.equal(validApplicationToken(token,now-1),false);assert.equal(validApplicationToken(token.slice(0,-1)+'!'),false);
  const original=process.env.BETTER_AUTH_SECRET;try{delete process.env.BETTER_AUTH_SECRET;assert.equal(createApplicationToken(),'');assert.equal(validApplicationToken(token),false);await assert.rejects(submit(input(),headers),e=>e.status===503);}finally{process.env.BETTER_AUTH_SECRET=original;}
 });
 await test('server rejects missing consent, forged metadata, honeypots, invalid origin and expired tokens without writes',async()=>{
  const before=await count(membershipApplication);
  for(const patch of [{consent:false},{consentVersion:'forged'},{status:'approved'},{careerStage:'invented'},{researchInterests:[]},{why:'x'.repeat(2001)},{website:'spam'},{formToken:createApplicationToken(Date.now()-7200000)}])await assert.rejects(submit(input(patch),headers),e=>e.status===400);
  await assert.rejects(submit(input(),new Headers({origin:'https://attacker.invalid'})),e=>e.status===403);await assert.rejects(submit(input(),new Headers({origin:base,'sec-fetch-site':'cross-site'})),e=>e.status===403);assert.equal(await count(membershipApplication),before);
 });
 await test('same-payload retry is idempotent; changed payload and concurrent active-email duplicates are rejected',async()=>{
  const data=input(),before=await count(membershipApplication);assert.deepEqual(await Promise.all([submit(data,headers),submit(data,headers)]),[{received:true},{received:true}]);assert.equal(await count(membershipApplication),before+1);
  await assert.rejects(submit({...data,why:'Changed payload'},headers),e=>e.status===409);
  const email=`${randomUUID()}@example.invalid`,results=await Promise.allSettled([submit(input({email}),headers),submit(input({email:email.toUpperCase()}),headers)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.status,409);
 });
 await test('email and global rate limits fail honestly without writes and ignore untrusted forwarded headers',async()=>{
  const data=input();await submit(data,headers);for(let i=0;i<4;i++)await submit(data,new Headers({origin:base,'x-forwarded-for':`192.0.2.${i}`}));await assert.rejects(submit(data,headers),e=>e.status===429);
  await db.delete(loginAttempt);await db.insert(loginAttempt).values({key:'membership:submit:global',count:60,startedAt:new Date()});await assert.rejects(submit(input(),headers),e=>e.status===429);
 });
 await test('anonymous, Editor and Lead cannot read pages, lists, detail or mutation APIs or call services directly',async()=>{
  const {record}=await received();
  for(const role of ['editor','research_group_lead']){
   for(const path of ['/admin/membership/applications',`/admin/membership/applications/${record.id}`,'/api/admin/membership/applications',`/api/admin/membership/applications/${record.id}`]){const r=await request(path,{cookie:cookies[role]});assert.equal(r.status,403,path);assert.equal(r.text.includes(record.why)||r.text.includes(record.email),false);}
   assert.equal((await request(`/api/admin/membership/applications/${record.id}`,{method:'POST',cookie:cookies[role],body:{decision:'approved',note:'forbidden'}})).status,403);
   await assert.rejects(list({...fixtures[role],role:'super_admin',accessVersion:0},{}),e=>e.status===403);await assert.rejects(detail(fixtures[role],record.id),e=>e.status===403);await assert.rejects(decide(fixtures[role],record.id,{decision:'approved',note:'forbidden'}),e=>e.status===403);
  }
  for(const path of ['/api/admin/membership/applications',`/api/admin/membership/applications/${record.id}`])assert.equal((await request(path)).status,401);
  assert.equal((await request(`/api/admin/membership/applications/${record.id}`,{method:'POST',body:{decision:'approved',note:'forbidden'}})).status,401);
  assert.equal((await request('/admin/membership/applications')).headers.get('location'),'/admin/sign-in');
 });
 await test('Super Admin approves/rejects with private reason, fresh authority and exact persisted reviewer; no A04 identity side effects',async()=>{
  const before=await Promise.all([count(user),count(account),count(session)]),{record}=await received();
  for(const body of [{decision:'approved',note:''},{decision:'approved',note:'Review',reviewerId:randomUUID()}])assert.equal((await request(`/api/admin/membership/applications/${record.id}`,{method:'POST',cookie:cookies.super_admin,body})).status,400);
  assert.equal((await request(`/api/admin/membership/applications/${record.id}`,{method:'POST',cookie:cookies.super_admin,origin:'https://attacker.invalid',body:{decision:'approved',note:'Review'}})).status,403);
  assert.equal((await request(`/api/admin/membership/applications/${record.id}`,{method:'POST',cookie:cookies.super_admin,body:{decision:'approved',note:'Private approval note'}})).status,200);
  const saved=await row(record.id);assert.equal(saved.status,'approved');assert.equal(saved.reviewerId,actor.id);assert.ok(saved.reviewedAt);assert.equal(saved.reviewNote,'Private approval note');assert.deepEqual(await Promise.all([count(user),count(account),count(session)]),before);
  await assert.rejects(submit(input({email:record.email}),headers),e=>e.status===409);await assert.rejects(decide({...actor,accessVersion:99},record.id,{decision:'rejected',note:'stale'}),e=>e.status===403);
 });
 await test('concurrent approval/rejection commits exactly one final decision and one audit',async()=>{
  const {record}=await received(),results=await Promise.allSettled(['approved','rejected'].map(decision=>decide(actor,record.id,{decision,note:'Concurrent private reason'})));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.status,409);
  const logs=await activityDirectory(actor,{target:record.id});assert.equal(logs.rows.filter(r=>r.action.startsWith('Approved')||r.action.startsWith('Rejected')).length,1);
 });
 await test('expiry includes exact equality, persists once and retains records; approved/rejected remain final',async()=>{
  const {record}=await received();await db.execute(sql`update membership_application set expires_at=clock_timestamp() where id=${record.id}::uuid`);
  const first=await sweep();assert.ok(first.expired>=1);assert.equal((await row(record.id)).status,'expired');await sweep();const logs=await activityDirectory(actor,{target:record.id});assert.equal(logs.rows.filter(r=>r.action==='Expired membership application').length,1);
  await assert.rejects(decide(actor,record.id,{decision:'approved',note:'Too late'}),e=>e.status===409);
  for(const decision of ['approved','rejected']){const {record:r}=await received();await decide(actor,r.id,{decision,note:'Final decision'});await db.update(membershipApplication).set({expiresAt:new Date(0)}).where(eq(membershipApplication.id,r.id));await sweep();assert.equal((await row(r.id)).status,decision);}
 });
 await test('decisions use current server clock after waiting for lock, and expiry races cannot approve overdue applications',async()=>{
  const {record}=await received(),client=await pool.connect();
  try{await client.query('begin');await client.query('select pg_advisory_xact_lock(4631003)');await client.query('update membership_application set expires_at=clock_timestamp()+interval \'350 milliseconds\' where id=$1',[record.id]);
   const result=decide(actor,record.id,{decision:'approved',note:'Waiting decision'}).then(()=>({ok:true}),e=>({status:e.status}));await client.query('select pg_sleep(0.5)');await client.query('commit');assert.deepEqual(await result,{status:409});
  }finally{await client.query('rollback');client.release();}
  assert.equal((await row(record.id)).status,'expired');const {record:r}=await received();await db.update(membershipApplication).set({expiresAt:new Date(0)}).where(eq(membershipApplication.id,r.id));const results=await Promise.allSettled([sweep(),decide(actor,r.id,{decision:'rejected',note:'Race'})]);assert.equal(results[1].status,'rejected');assert.equal((await row(r.id)).status,'expired');
 });
 await test('fresh submissions after rejection/expiry preserve history; overdue duplicates are expired before reapplication',async()=>{
  for(const status of ['rejected','expired']){const {record}=await received();if(status==='rejected')await decide(actor,record.id,{decision:'rejected',note:'Private reason'});else await db.update(membershipApplication).set({expiresAt:new Date(0)}).where(eq(membershipApplication.id,record.id));await submit(input({email:record.email}),headers);const rows=await db.select().from(membershipApplication).where(eq(membershipApplication.email,record.email));assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>r.status).sort(),[status,'pending'].sort());}
 });
 await test('audit writes are atomic, System events are filterable, and no answers, notes, email or consent tokens leak',async()=>{
  const {record,data}=await received();await db.execute(sql`create function admin03_reject_audit() returns trigger language plpgsql as $$ begin if NEW.action='Approved membership application' then raise exception 'isolated audit failure'; end if; return NEW; end $$; create trigger admin03_audit_failure before insert on admin_audit_log for each row execute function admin03_reject_audit()`);
  try{await assert.rejects(decide(actor,record.id,{decision:'approved',note:'Sensitive review note'}));assert.equal((await row(record.id)).status,'pending');}finally{await db.execute(sql`drop trigger admin03_audit_failure on admin_audit_log;drop function admin03_reject_audit()`);}
  await decide(actor,record.id,{decision:'rejected',note:'Sensitive review note'});const logs=await activityDirectory(actor,{target:record.id}),dump=JSON.stringify(logs);for(const privateValue of [data.why,data.email,data.formToken,'Sensitive review note',record.requestDigest,record.formDigest])assert.equal(dump.includes(privateValue),false);
  assert.ok(logs.rows.some(r=>r.actorId===null&&r.actor==='System'));assert.equal((await activityDirectory(actor,{target:record.id,actor:'system'})).rows.length,1);assert.ok(logs.rows.some(r=>r.changes?.after.status==='rejected'));
 });
 await test('private search, status filters, stable pagination and details expose only authorized fields',async()=>{
  const prefix='Page'+randomBytes(4).toString('hex');for(let i=0;i<22;i++)await received({firstName:prefix});const first=await list(actor,{q:prefix}),second=await list(actor,{q:prefix,page:2});assert.equal(first.total,22);assert.equal(first.rows.length,20);assert.equal(second.rows.length,2);assert.equal(new Set([...first.rows,...second.rows].map(r=>r.id)).size,22);assert.equal('why'in first.rows[0],false);assert.equal('formDigest'in first.rows[0],false);
  assert.equal((await list(actor,{q:'%_'})).total,0);const r=await detail(actor,first.rows[0].id);assert.ok(r.why);assert.equal(r.consentVersion,membershipConsent.version);assert.equal('requestDigest'in r,false);assert.equal((await request('/api/admin/membership/applications?page=0',{cookie:cookies.super_admin})).status,400);
 });
 await test('receipt and expiry roll back if the corresponding audit cannot be persisted',async()=>{
  await db.execute(sql`create function admin03_fail_system_audit() returns trigger language plpgsql as $$ begin if NEW.action in ('Received membership application','Expired membership application') then raise exception 'isolated system audit failure'; end if; return NEW; end $$; create trigger admin03_system_audit_failure before insert on admin_audit_log for each row execute function admin03_fail_system_audit()`);
  const before=await Promise.all([count(membershipApplication),count(auditLog)]);
  try{await assert.rejects(submit(input(),headers));assert.deepEqual(await Promise.all([count(membershipApplication),count(auditLog)]),before);}finally{await db.execute(sql`drop trigger admin03_system_audit_failure on admin_audit_log;drop function admin03_fail_system_audit()`);}
  const {record}=await received();await db.update(membershipApplication).set({expiresAt:new Date(0)}).where(eq(membershipApplication.id,record.id));
  await db.execute(sql`create function admin03_fail_expiry_audit() returns trigger language plpgsql as $$ begin if NEW.action='Expired membership application' then raise exception 'isolated expiry audit failure'; end if; return NEW; end $$; create trigger admin03_expiry_audit_failure before insert on admin_audit_log for each row execute function admin03_fail_expiry_audit()`);
  try{await assert.rejects(sweep());assert.equal((await row(record.id)).status,'pending');}finally{await db.execute(sql`drop trigger admin03_expiry_audit_failure on admin_audit_log;drop function admin03_fail_expiry_audit()`);}
  await sweep();assert.equal((await row(record.id)).status,'expired');
 });
 await test('bounded sweeps report backlog and queries expose overdue records as expired before their next persisted batch',async()=>{
  await sweep();const {record}=await received();await decide(actor,record.id,{decision:'rejected',note:'Batch template fixture'});
  const prefix='Batch'+randomBytes(4).toString('hex'),rows=Array.from({length:1001},(_,i)=>({...record,id:randomUUID(),firstName:prefix,email:`${randomUUID()}@example.invalid`,formDigest:randomUUID(),status:'pending',reviewerId:null,reviewedAt:null,reviewNote:null,expiresAt:new Date(i)}));
  await db.insert(membershipApplication).values(rows);const first=await sweep();assert.equal(first.expired,500);assert.equal(first.moreDue,true);
  const directory=await list(actor,{q:prefix,status:'expired'});assert.equal(directory.total,1001);assert.ok(directory.rows.every(r=>r.status==='expired'));assert.equal((await row(rows[1000].id)).status,'pending','One record remains outside the persisted batches.');
  await assert.rejects(decide(actor,rows[1000].id,{decision:'approved',note:'Overdue backlog'}),e=>e.status===409);assert.equal((await row(rows[1000].id)).status,'expired');assert.equal((await sweep()).moreDue,false);
 });
 await test('bearer expiry endpoint works without a dashboard, rejects missing/wrong authorization and is idempotent',async()=>{
  for(const options of [{},{cookie:cookies.super_admin},{headers:{authorization:'Bearer wrong'}}])assert.equal((await request('/api/internal/membership-expiry',options)).status,401);
  const {record}=await received();await db.update(membershipApplication).set({expiresAt:new Date(0)}).where(eq(membershipApplication.id,record.id));const r=await request('/api/internal/membership-expiry',{headers:{authorization:`Bearer ${process.env.CRON_SECRET}`}});assert.equal(r.status,200);assert.ok(JSON.parse(r.text).expired>=1);assert.equal(r.text.includes(record.email),false);assert.equal((await row(record.id)).status,'expired');const again=await request('/api/internal/membership-expiry',{headers:{authorization:`Bearer ${process.env.CRON_SECRET}`}});assert.equal(JSON.parse(again.text).expired,0);
 });
 const file=process.env.NOSEE_ADMIN_FIXTURE_FILE;if(file){const p=resolve(file);assert.ok(realpathSync(dirname(p)).startsWith('/tmp/'));const fd=openSync(p,constants.O_WRONLY|constants.O_CREAT|constants.O_TRUNC|constants.O_NOFOLLOW,0o600);try{fchmodSync(fd,0o600);writeFileSync(fd,JSON.stringify(fixtures));}finally{closeSync(fd);}}
 await db.delete(loginAttempt);await db.execute(sql`truncate admin_rate_limit`);
}finally{await pool.end();}
