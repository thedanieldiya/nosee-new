import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { readFileSync, writeFileSync, realpathSync, openSync, closeSync, fchmodSync, constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { eq, sql } from 'drizzle-orm';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { adminDatabase } from '../src/lib/admin/database.ts';
import { manageAdministrator } from '../src/lib/admin/management.ts';
import { administratorDirectory, activityDirectory } from '../src/lib/admin/management-queries.ts';
import { user, account, invitation, invitationSend, auditLog, session, loginAttempt } from '../src/lib/admin/schema.ts';
const url=new URL(process.env.DATABASE_URL||''),base=process.env.ADMIN_ORIGIN;
assert.ok(['127.0.0.1','localhost'].includes(url.hostname)&&url.pathname==='/nosee_admin01_test','Only the disposable loopback nosee_admin01_test database is permitted.');
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Only a loopback app is permitted.');
const {db,pool}=adminDatabase(),fixtures={};
async function person(role='editor'){
 const p={id:randomUUID(),firstName:role==='super_admin'?'Avery':role==='editor'?'Jordan':'Morgan',lastName:'Reviewer',email:`${randomUUID()}@example.invalid`,password:randomBytes(32).toString('base64url'),role,researchGroupId:role==='research_group_lead'?randomUUID():null};
 await db.insert(user).values({...p,name:p.firstName+' '+p.lastName,password:undefined});
 await db.insert(account).values({id:randomUUID(),userId:p.id,accountId:p.id,providerId:'credential',password:await hashPassword(p.password)});return p;
}
async function request(path,{method='GET',cookie,body,origin=base,headers={}}={}){
 const r=await fetch(base+path,{method,redirect:'manual',headers:{...(cookie?{cookie}:{}),...(method==='GET'?{}:{origin,'content-type':'application/json'}),...headers},...(body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});return{status:r.status,headers:r.headers,text:await r.text()};
}
async function login(p){await db.delete(loginAttempt);const r=await request('/api/admin/auth/sign-in/email',{method:'POST',body:{email:p.email,password:p.password}});assert.equal(r.status,200);const cookie=r.headers.getSetCookie().find(c=>c.includes('session_token='))?.split(';')[0];assert.ok(cookie);return cookie;}
async function administrator(headers){const r=await request('/api/admin/auth/get-session',{cookie:headers.get('cookie')});assert.equal(r.status,200);return JSON.parse(r.text).user;}
const input=()=>({action:'invite',firstName:'Invited',lastName:'Reviewer',email:`${randomUUID()}@example.invalid`,role:'editor'});
const sender=(status='accepted',messages=[])=>({send:async mail=>{messages.push(mail);return status==='accepted'?{status,messageId:'isolated-message-'+randomUUID()}:{status};}});
const codeOf=mail=>mail.text.split('Your invitation code\n')[1].split('\n')[0];
async function issued(actor,status='accepted') {const messages=[],data=input();await manageAdministrator(actor,data,sender(status,messages));const [record]=await db.select().from(invitation).where(eq(invitation.email,data.email));return{record,code:codeOf(messages[0]),messages,data};}
const accept=(code,password=randomBytes(32).toString('base64url'),extra={})=>request('/api/admin/accept-invitation',{method:'POST',body:{code,password,confirmation:password,...extra}});
const hash=value=>createHash('sha256').update(value).digest('hex');
function writePrivate(file,data){assert.ok(realpathSync(dirname(file)).startsWith('/tmp/'));const fd=openSync(file,constants.O_WRONLY|constants.O_CREAT|constants.O_TRUNC|constants.O_NOFOLLOW,0o600);try{fchmodSync(fd,0o600);writeFileSync(fd,JSON.stringify(data));}finally{closeSync(fd);}}
try{
 await test('additive A01-to-A02 schema upgrade preserves identities, credential hashes, sessions, audit history and bootstrap marker',async()=>{
  const client=await pool.connect();
  try{await client.query('begin');
   const snapshot=async()=>JSON.stringify((await client.query(`select jsonb_build_object('users',(select jsonb_agg(to_jsonb(u)-'access_version' order by id) from administrator u),'accounts',(select jsonb_agg(to_jsonb(a) order by id) from admin_account a),'sessions',(select jsonb_agg(to_jsonb(s)-'access_version' order by id) from admin_session s),'audit',(select jsonb_agg(to_jsonb(l)-'target_type'-'target_id'-'target_label'-'changes' order by id) from admin_audit_log l)) records`)).rows[0].records);
   const before=await snapshot();
   // Reconstruct only A01's schema inside this rollback-only, guarded disposable transaction.
   await client.query(`drop table admin_invitation_send,admin_invitation; alter table administrator drop column access_version; alter table admin_session drop column access_version; drop index admin_audit_time; alter table admin_audit_log drop column target_type,drop column target_id,drop column target_label,drop column changes`);
   for(const statement of readFileSync(new URL('../drizzle/0001_administrators_activity.sql',import.meta.url),'utf8').split('--> statement-breakpoint'))await client.query(statement);
   assert.equal((await snapshot())===before,true,'All original records and credential/session values must remain unchanged.');
   assert.equal(Number((await client.query('select count(*) n from administrator where access_version<>0')).rows[0].n),0);
  }finally{await client.query('rollback');client.release();}
 });
 for(const role of ['super_admin','editor','research_group_lead'])fixtures[role]=await person(role);
 const cookies={};for(const role of Object.keys(fixtures))cookies[role]=await login(fixtures[role]);
 let actor=await administrator(new Headers({cookie:cookies.super_admin}));assert.ok(actor);
 await test('all management pages, lists and mutations enforce fresh Super Admin permission',async()=>{
  for(const role of ['editor','research_group_lead'])for(const path of ['/admin/settings/administrators','/admin/settings/activity-log','/api/admin/administrators','/api/admin/activity-log'])assert.equal((await request(path,{cookie:cookies[role]})).status,403);
  for(const cookie of [undefined,cookies.editor,cookies.research_group_lead])assert.equal((await request('/api/admin/administrators',{method:'POST',cookie,body:input()})).status,cookie?403:401);
  assert.equal((await request('/api/admin/administrators',{cookie:cookies.super_admin})).status,200);
  for(const path of ['/api/admin/administrators','/api/admin/activity-log'])assert.equal((await request(path)).status,401);
 });
 await test('unconfigured delivery fails closed with no invitations, emails or audit writes',async()=>{
  const count=async table=>Number((await db.select({n:sql`count(*)`}).from(table))[0].n),before=await Promise.all([count(invitation),count(invitationSend),count(auditLog)]);
  const r=await request('/api/admin/administrators',{method:'POST',cookie:cookies.super_admin,body:input()});assert.equal(r.status,503);assert.ok(r.text.includes('Email invitations are not configured'));
  assert.deepEqual(await Promise.all([count(invitation),count(invitationSend),count(auditLog)]),before);
 });
 await test('issue stores only a 256-bit digest, pending identities cannot log in and duplicate/Lead/scope assignments fail',async()=>{
  const invite=await issued(actor),[record]=await db.select().from(invitation).where(eq(invitation.id,invite.record.id));
  assert.equal(record.tokenDigest===hash(invite.code),true);assert.equal(invite.code.length,43);assert.ok(Math.abs(record.expiresAt.getTime()-Date.now()-48*3600000)<15000);
  assert.equal((await db.select().from(user).where(eq(user.email,invite.data.email))).length,0);
  await assert.rejects(manageAdministrator(actor,invite.data,sender()),e=>e.status===409);
  for(const extra of [{role:'research_group_lead'},{researchGroupId:randomUUID()}])assert.equal((await request('/api/admin/administrators',{method:'POST',cookie:cookies.super_admin,body:{...input(),...extra}})).status,400);
  for(const p of [fixtures.editor,fixtures.super_admin])await assert.rejects(manageAdministrator(actor,{...input(),email:p.email.toUpperCase()},sender()),e=>e.status===409);
  assert.notEqual((await request('/api/admin/auth/sign-in/email',{method:'POST',body:{email:invite.data.email,password:randomBytes(32).toString('base64url')}})).status,200);
 });
 await test('redemption creates real Better Auth credentials atomically, does not verify email and rejects replay/mass assignment',async()=>{
  const invite=await issued(actor),password=randomBytes(32).toString('base64url');
  assert.equal((await accept(invite.code,password,{role:'super_admin'})).status,400);
  const reply=await accept(invite.code,password);assert.equal(reply.status,200);assert.equal(reply.text.includes(invite.code),false);assert.equal(reply.headers.getSetCookie().length,0);
  const [created]=await db.select().from(user).where(eq(user.email,invite.data.email));assert.equal(created.role,'editor');assert.equal(created.emailVerified,false);assert.equal(created.researchGroupId,null);
  const [credential]=await db.select().from(account).where(eq(account.userId,created.id));assert.equal(await verifyPassword({hash:credential.password,password}),true);
  assert.ok(await login({...created,password}));assert.equal((await accept(invite.code)).status,400);
  assert.equal((await db.select().from(invitation).where(eq(invitation.id,invite.record.id)))[0].tokenDigest,null);
 });
 await test('expiry, revocation and resend rotate/reject old credentials without manual exposure',async()=>{
  const expired=await issued(actor);await db.update(invitation).set({expiresAt:new Date(Date.now()-1)}).where(eq(invitation.id,expired.record.id));assert.equal((await accept(expired.code)).status,400);
  const messages=[];await manageAdministrator(actor,{action:'resend',id:expired.record.id},sender('accepted',messages));assert.equal((await accept(expired.code)).status,400);assert.equal((await accept(codeOf(messages[0]))).status,200);
  const revoked=await issued(actor);await manageAdministrator(actor,{action:'revoke',id:revoked.record.id});assert.equal((await accept(revoked.code)).status,400);
  await assert.rejects(manageAdministrator(actor,{action:'resend',id:revoked.record.id},sender()),e=>e.status===409);
 });
 await test('concurrent acceptance consumes one invitation once',async()=>{
  const invite=await issued(actor),replies=await Promise.all([accept(invite.code),accept(invite.code)]);assert.deepEqual(replies.map(r=>r.status).sort(),[200,400]);
  assert.equal((await db.select().from(user).where(eq(user.email,invite.data.email))).length,1);
 });
 await test('definitive failure revokes its code; unknown acceptance is honest and recoverable',async()=>{
  const failed=await issued(actor,'failed');assert.equal((await accept(failed.code)).status,400);
  const unknown=await issued(actor,'unconfirmed');assert.equal((await accept(unknown.code)).status,200,'A possibly delivered code remains usable until explicit rotation.');
  const messages=[],data=input();const result=await manageAdministrator(actor,data,{send:async mail=>{messages.push(mail);throw new Error('private provider failure');}});assert.ok(result.message.includes('unconfirmed'));assert.equal(JSON.stringify(result).includes('private provider'),false);
  const [pending]=await db.select().from(invitation).where(eq(invitation.email,data.email));const [send]=await db.select().from(invitationSend).where(eq(invitationSend.invitationId,pending.id));assert.equal(send.status,'unconfirmed');
  await manageAdministrator(actor,{action:'resend',id:pending.id},sender());assert.equal((await accept(codeOf(messages[0]))).status,400);
 });
 await test('stale sending records display unconfirmed and permit safe recovery; live sends reject duplicate resend',async()=>{
  const invite=await issued(actor),[send]=await db.select().from(invitationSend).where(eq(invitationSend.invitationId,invite.record.id));
  await db.update(invitationSend).set({status:'sending'}).where(eq(invitationSend.id,send.id));await assert.rejects(manageAdministrator(actor,{action:'resend',id:invite.record.id},sender()),e=>e.status===409);
  await db.update(invitationSend).set({createdAt:new Date(Date.now()-180000)}).where(eq(invitationSend.id,send.id));
  const directory=await administratorDirectory(actor,{q:invite.data.email});assert.equal(directory.rows[0].delivery,'unconfirmed');await manageAdministrator(actor,{action:'resend',id:invite.record.id},sender());assert.equal((await accept(invite.code)).status,400);
 });
 await test('invalid origin, oversized bodies, generic signup and bounded verification attempts remain denied',async()=>{
  assert.equal((await request('/api/admin/accept-invitation',{method:'POST',origin:'https://attacker.invalid',body:{}})).status,403);
  assert.equal((await request('/api/admin/administrators',{method:'POST',origin:'https://attacker.invalid',cookie:cookies.super_admin,body:input()})).status,403);
  assert.equal((await request('/api/admin/accept-invitation',{method:'POST',body:'x'.repeat(9000)})).status,400);
  assert.equal((await request('/api/admin/auth/sign-up/email',{method:'POST',body:{}})).status,404);
  const code=randomBytes(32).toString('base64url');for(let i=0;i<5;i++)assert.equal((await accept(code)).status,400);assert.equal((await accept(code)).status,429);
 });
 await test('deactivation and role changes revoke sessions; reactivation and late old-version inserts cannot restore them',async()=>{
  const target=await person(),cookie=await login(target),[oldSession]=await db.select().from(session).where(eq(session.userId,target.id));
  await manageAdministrator(actor,{action:'deactivate',id:target.id});assert.equal((await request('/api/admin/profile',{cookie})).status,401);assert.equal((await db.select().from(session).where(eq(session.userId,target.id))).length,0);
  assert.notEqual((await request('/api/admin/auth/sign-in/email',{method:'POST',body:{email:target.email,password:target.password}})).status,200);
  await manageAdministrator(actor,{action:'activate',id:target.id});await db.insert(session).values(oldSession);assert.equal((await request('/api/admin/profile',{cookie})).status,401,'An in-flight pre-deactivation session remains invalid after reactivation.');
  const fresh=await login(target);await manageAdministrator(actor,{action:'change-role',id:target.id,role:'super_admin'});assert.equal((await request('/api/admin/administrators',{cookie:fresh})).status,401);const promoted=await login(target);assert.equal((await request('/api/admin/administrators',{cookie:promoted})).status,200);
  await manageAdministrator(actor,{action:'change-role',id:target.id,role:'editor'});assert.equal((await request('/api/admin/administrators',{cookie:promoted})).status,401);
 });
 await test('self changes, stale authority and concurrent Super Admin removals cannot lock out the last active admin',async()=>{
  await assert.rejects(manageAdministrator(actor,{action:'deactivate',id:actor.id}),e=>e.status===409);
  await assert.rejects(manageAdministrator(actor,{action:'change-role',id:actor.id,role:'editor'}),e=>e.status===409);
  const other=await person('super_admin'),cookie=await login(other),second=await administrator(new Headers({cookie}));
  const untouched=await db.select({id:user.id}).from(user).where(sql`role='super_admin' and active=true and id<>${actor.id}::uuid and id<>${other.id}::uuid`);
  for(const p of untouched)await db.update(user).set({active:false}).where(eq(user.id,p.id));
  const results=await Promise.allSettled([manageAdministrator(actor,{action:'deactivate',id:other.id}),manageAdministrator(second,{action:'deactivate',id:actor.id})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  const supers=await db.select().from(user).where(sql`role='super_admin' and active=true`);assert.equal(supers.length,1);
  const [first]=await db.select().from(user).where(eq(user.id,actor.id));if(!first.active){await db.update(user).set({active:true}).where(eq(user.id,actor.id));actor=await administrator(new Headers({cookie:await login(fixtures.super_admin)}));cookies.super_admin=await login(fixtures.super_admin);}
  for(const p of untouched)await db.update(user).set({active:true}).where(eq(user.id,p.id));
 });
 await test('audits preserve legacy null details and capture safe before/after atomically, never codes/passwords',async()=>{
  const target=await person(),before=await db.select().from(user).where(eq(user.id,target.id));
  await db.execute(sql`create function admin02_reject_audit() returns trigger language plpgsql as $$ begin if NEW.action='Deactivated administrator' then raise exception 'isolated audit write failure'; end if; return NEW; end $$; create trigger admin02_audit_failure before insert on admin_audit_log for each row execute function admin02_reject_audit()`);
  try {await assert.rejects(manageAdministrator(actor,{action:'deactivate',id:target.id}));assert.equal((await db.select().from(user).where(eq(user.id,target.id)))[0].active,before[0].active);}finally{await db.execute(sql`drop trigger admin02_audit_failure on admin_audit_log; drop function admin02_reject_audit()`);}
  await manageAdministrator(actor,{action:'deactivate',id:target.id});const data=await activityDirectory(actor,{target:target.id});assert.equal(data.rows[0].actorId,actor.id);assert.deepEqual(data.rows[0].changes,{before:{role:'editor',active:true},after:{role:'editor',active:false}});
  const legacy=await activityDirectory(actor,{action:'Signed in'});assert.ok(legacy.rows.length);assert.ok(legacy.rows.every(r=>r.targetId===null&&r.changes===null));
  const invite=await issued(actor),rows=await activityDirectory(actor,{target:invite.record.id}),dump=JSON.stringify(rows);assert.equal(dump.includes(invite.code)||dump.includes(hash(invite.code))||dump.includes(fixtures.super_admin.password),false);
 });
 await test('directory/activity search, literal wildcard handling, filters, stable pagination and UTC date boundaries',async()=>{
  for(let i=0;i<24;i++)await db.insert(auditLog).values({id:randomUUID(),actorId:actor.id,action:'Isolated pagination check',targetType:'administrator',targetId:actor.id,targetLabel:'Pagination reviewer',createdAt:new Date('2026-10-15T12:00:00Z')});
  for(const d of ['2026-10-14T23:59:59Z','2026-10-16T00:00:00Z'])await db.insert(auditLog).values({id:randomUUID(),actorId:actor.id,action:'Isolated pagination check',createdAt:new Date(d)});
  const filter={action:'Isolated pagination check',from:'2026-10-15',to:'2026-10-15',actor:actor.id};const first=await activityDirectory(actor,filter),second=await activityDirectory(actor,{...filter,page:2});assert.equal(first.total,24);assert.equal(first.rows.length,20);assert.equal(second.rows.length,4);assert.equal(new Set([...first.rows,...second.rows].map(r=>r.id)).size,24);
  assert.equal((await administratorDirectory(actor,{q:'%_'})).total,0);assert.equal((await administratorDirectory(actor,{q:fixtures.super_admin.email,status:'active',role:'super_admin'})).total,1);
  assert.equal((await request('/api/admin/activity-log?from=2026-02-31',{cookie:cookies.super_admin})).status,400);assert.equal((await request('/api/admin/administrators?page=0',{cookie:cookies.super_admin})).status,400);
 });
 await test('invitation issuance is independently bounded without producing fake send records',async()=>{
  await db.insert(loginAttempt).values({key:`invitation:issue:${actor.id}`,count:20,startedAt:new Date()}).onConflictDoUpdate({target:loginAttempt.key,set:{count:20,startedAt:new Date()}});
  await assert.rejects(manageAdministrator(actor,input(),sender()),e=>e.status===429);await db.delete(loginAttempt);
 });
 const file=process.env.NOSEE_ADMIN_FIXTURE_FILE;
 if(file){const p=resolve(file),folder=realpathSync(dirname(p));writePrivate(p,fixtures);
  const invite=await issued(actor);writePrivate(folder+'/invitation.json',{code:invite.code,email:invite.data.email,password:randomBytes(32).toString('base64url')});
 }
 await db.delete(loginAttempt);await db.execute(sql`truncate admin_rate_limit`);
}finally{await pool.end();}
