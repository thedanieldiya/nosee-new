import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID, randomBytes } from 'node:crypto';
import { writeFileSync, unlinkSync, realpathSync, openSync, closeSync, fchmodSync, constants, mkdtempSync, rmdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { eq, sql } from 'drizzle-orm';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { adminDatabase } from '../src/lib/admin/database.ts';
import { bootstrapAdministrator } from '../src/lib/admin/bootstrap.ts';
import { user, account, session, auditLog, loginAttempt } from '../src/lib/admin/schema.ts';
const databaseURL=new URL(process.env.DATABASE_URL||''),base=process.env.ADMIN_ORIGIN;
assert.ok(['localhost','127.0.0.1'].includes(databaseURL.hostname)&&databaseURL.pathname==='/nosee_admin01_test','Destructive tests require the isolated loopback nosee_admin01_test database.');
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Integration tests must use a loopback application.');
const {db,pool}=adminDatabase(),group=randomUUID();
const person=role=>({firstName:role==='super_admin'?'Avery':role==='editor'?'Jordan':'Morgan',lastName:'Reviewer',email:`${randomUUID()}@example.invalid`,password:randomBytes(32).toString('base64url'),role,researchGroupId:role==='research_group_lead'?group:null});
const fixtures={super_admin:person('super_admin'),editor:person('editor'),research_group_lead:person('research_group_lead')};
async function reset(){await db.execute(sql`truncate admin_audit_log, admin_account, admin_session, administrator, admin_rate_limit, admin_login_attempt, admin_verification cascade`);}
async function request(path,{method='GET',cookie,body,origin=base,headers={}}={}){
 const response=await fetch(base+path,{method,redirect:'manual',headers:{...(cookie?{cookie}:{}),...(method==='GET'?{}:{origin,'content-type':'application/json'}),...headers},...(body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
 const text=await response.text();return {status:response.status,headers:response.headers,text,json:()=>JSON.parse(text)};
}
async function signIn(fixture){const response=await request('/api/admin/auth/sign-in/email',{method:'POST',body:{email:fixture.email,password:fixture.password}});assert.equal(response.status,200,'Sign-in must succeed with a real provisioned credential');const cookie=response.headers.getSetCookie().find(c=>c.includes('session_token='))?.split(';')[0];assert.ok(cookie,'Signed session cookie is required');return {cookie,response};}
try{
 await reset();
 await test('operator CLIs reject noninteractive bootstrap, password arguments and unsafe migration TLS',()=>{
  for(const args of [[],['--password','not-a-password']]){const r=spawnSync(process.execPath,['--conditions=react-server','scripts/admin-bootstrap.mjs',...args],{encoding:'utf8'});assert.equal(r.status,1);assert.match(r.stderr,/interactive privileged terminal/);}
  const migration=spawnSync(process.execPath,['scripts/admin-migrate.mjs'],{encoding:'utf8',env:{...process.env,DATABASE_MIGRATION_URL:'postgresql://db.example.invalid/test?sslmode=disable'}});assert.equal(migration.status,1);assert.match(migration.stderr,/verified TLS/);
 });
 await test('actual masked interactive bootstrap creates one hashed Super Admin',async()=>{
  const input={...fixtures.super_admin};delete input.role;delete input.researchGroupId;
  const file=`${mkdtempSync('/tmp/nosee-admin-bootstrap-')}/input.json`;writeFileSync(file,JSON.stringify(input),{mode:0o600});
  try{const r=spawnSync('python3',['tests/helpers/admin-bootstrap-pty.py',file],{encoding:'utf8',timeout:120000});assert.equal(r.status,0,'Masked interactive bootstrap must complete without exposing its transcript.');}finally{unlinkSync(file);rmdirSync(dirname(file));}
  const [record]=await db.select().from(user);assert.equal(record.role,'super_admin');const [credential]=await db.select().from(account);assert.ok(await verifyPassword({password:input.password,hash:credential.password}));assert.ok(!credential.password.includes(input.password));assert.equal((await db.select().from(auditLog)).length,1);
  await assert.rejects(()=>bootstrapAdministrator(input),/Bootstrap is closed/);
 });
 await test('concurrent bootstrap succeeds exactly once and cannot elevate an existing identity',async()=>{
  await reset();const input=fixtures.super_admin;const other={...input,email:`${randomUUID()}@example.invalid`};
  const results=await Promise.allSettled([bootstrapAdministrator({firstName:input.firstName,lastName:input.lastName,email:input.email,password:input.password}),bootstrapAdministrator({firstName:other.firstName,lastName:other.lastName,email:other.email,password:other.password})]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal((await db.select().from(user)).length,1);
  const [record]=await db.select().from(user);fixtures.super_admin.email=record.email;fixtures.super_admin.id=record.id;
  await db.update(user).set({role:'editor'}).where(eq(user.id,record.id));
  await assert.rejects(()=>bootstrapAdministrator({firstName:input.firstName,lastName:input.lastName,email:record.email,password:input.password}),/Bootstrap is closed/);
  assert.equal((await db.select().from(user))[0].role,'editor','Repeated bootstrap must never elevate an existing account.');
  await db.update(user).set({role:'super_admin'}).where(eq(user.id,record.id));
 });
 for(const role of ['editor','research_group_lead']){
  const fixture=fixtures[role],id=randomUUID();fixture.id=id;
  await db.transaction(async tx=>{await tx.insert(user).values({id,name:`${fixture.firstName} ${fixture.lastName}`,firstName:fixture.firstName,lastName:fixture.lastName,email:fixture.email,role,researchGroupId:fixture.researchGroupId});await tx.insert(account).values({id:randomUUID(),accountId:id,userId:id,providerId:'credential',password:await hashPassword(fixture.password)});});
 }
 await test('no public signup, administrator creation or unsupported auth endpoint exists',async()=>{
  for(const path of ['sign-up/email','admin/create-user','update-user','change-email','request-password-reset'])assert.equal((await request('/api/admin/auth/'+path,{method:'POST',body:{email:fixtures.editor.email,password:fixtures.editor.password,role:'super_admin'}})).status,404);
  assert.equal((await db.select().from(user)).length,3);
 });
 await test('anonymous direct URLs and APIs expose no private data or shared cache',async()=>{
  for(const path of ['/admin','/admin/settings/general','/admin/membership/members','/admin/research/'+group]){const r=await request(path);assert.equal(r.status,307);assert.equal(new URL(r.headers.get('location'),base).pathname,'/admin/sign-in');assert.ok(!r.text.includes(fixtures.editor.email));assert.match(r.headers.get('cache-control'),/no-store/);}
  for(const path of ['/api/admin/profile','/api/admin/auth/get-session'])assert.equal((await request(path)).status,401);
  assert.equal((await request('/api/admin/profile',{method:'PATCH',body:{firstName:'First',lastName:'Last'}})).status,401);
 });
 await test('login CSRF, malformed/oversized requests, wrong passwords and unprovisioned member identities are rejected',async()=>{
  assert.equal((await request('/api/admin/auth/sign-in/email',{method:'POST',origin:'https://attacker.invalid',body:{email:fixtures.editor.email,password:fixtures.editor.password}})).status,403);
  assert.equal((await request('/api/admin/auth/sign-in/email',{method:'POST',body:{email:fixtures.editor.email,password:'wrong'}})).status,401);
  assert.equal((await request('/api/admin/auth/sign-in/email',{method:'POST',body:{email:`${randomUUID()}@example.invalid`,password:fixtures.editor.password}})).status,401);
  for(const body of ['{','x'.repeat(10000)])assert.equal((await request('/api/admin/auth/sign-in/email',{method:'POST',body})).status,400);
  for(const body of ['{','x'.repeat(10000)])assert.equal((await request('/api/admin/profile',{method:'PATCH',body})).status,401);
 });
 const sessions={};
 for(const role of Object.keys(fixtures))sessions[role]=await signIn(fixtures[role]);
 await test('real sessions use signed HttpOnly SameSite cookies, database expiry and private responses',async()=>{
  for(const s of Object.values(sessions)){const cookie=s.response.headers.getSetCookie().find(c=>c.includes('session_token='));assert.ok(/HttpOnly/i.test(cookie));assert.ok(/SameSite=Lax/i.test(cookie));assert.ok(/Path=\//.test(cookie));}
  for(const s of Object.values(sessions)) {
   const body=s.response.json();assert.equal(body.success,true);assert.deepEqual(Object.keys(body),['success']);
   const result=(await request('/api/admin/auth/get-session',{cookie:s.cookie})).json();
   assert.deepEqual(Object.keys(result),['user']);assert.ok(!('token' in result.user));
  }
  assert.equal((await db.select().from(session)).length,3);
  for(const record of await db.select().from(session)) assert.ok(Math.abs((record.expiresAt-record.createdAt)/3600000-8)<0.01,'Sessions expire in eight hours without sliding refresh.');
  for(const [role,s] of Object.entries(sessions)){const r=await request('/api/admin/profile',{cookie:s.cookie});assert.equal(r.status,200);assert.equal(r.json().role,role);assert.ok(r.json().email===fixtures[role].email,'Only current-user data is returned.');assert.match(r.headers.get('cache-control'),/no-store/);}
 });
 await test('server routes deny Editor and Lead forbidden modules independently of navigation',async()=>{
  for(const role of ['editor','research_group_lead'])for(const path of ['/admin/membership/members','/admin/settings/administrators','/admin/settings/activity-log'])assert.equal((await request(path,{cookie:sessions[role].cookie})).status,403,`${role} forbidden page`);
  for(const path of ['/admin/publishing/news','/admin/website/site-content'])assert.equal((await request(path,{cookie:sessions.research_group_lead.cookie})).status,403);
  assert.equal((await request('/admin/research/'+group,{cookie:sessions.editor.cookie})).status,403);
 });
 await test('Lead can reach only assigned research boundary; other-group and create paths are denied',async()=>{
  const cookie=sessions.research_group_lead.cookie;
  assert.equal((await request('/admin/research',{cookie})).status,307);
  assert.equal((await request('/admin/research/'+group,{cookie})).status,404,'Assigned workspace is authorised but not implemented.');
  for(const p of [randomUUID(),'new',group+'/../'+randomUUID()])assert.equal((await request('/admin/research/'+p,{cookie})).status,403);
  assert.equal((await request('/admin/research/'+randomUUID()+'/members',{cookie})).status,403);
 });
 await test('profile updates persist only the signed-in identity; no role, group or user-id escalation',async()=>{
  const cookie=sessions.editor.cookie;
  assert.equal((await request('/api/admin/profile',{method:'PATCH',cookie,body:{firstName:'Saved',lastName:'Reviewer'}})).status,200);
  assert.equal((await request('/api/admin/profile',{cookie})).json().firstName,'Saved');
  for(const field of ['role','researchGroupId','userId','email'])assert.equal((await request('/api/admin/profile',{method:'PATCH',cookie,body:{firstName:'Saved',lastName:'Reviewer',[field]:'injected'}})).status,400);
  assert.equal((await request('/api/admin/profile',{method:'PATCH',cookie,body:{firstName:'',lastName:'Reviewer'}})).status,400);
  assert.equal((await request('/api/admin/profile',{method:'PATCH',cookie,origin:'https://attacker.invalid',body:{firstName:'Bad',lastName:'Origin'}})).status,403);
  const [editor]=await db.select().from(user).where(eq(user.id,fixtures.editor.id));assert.equal(editor.role,'editor');assert.equal(editor.researchGroupId,null);assert.equal(editor.firstName,'Saved');
  fixtures.editor.firstName='Saved';
 });
 await test('role changes and deactivation apply immediately to existing sessions',async()=>{
  const id=fixtures.editor.id,cookie=sessions.editor.cookie;
  await db.update(user).set({role:'research_group_lead',researchGroupId:group}).where(eq(user.id,id));
  assert.equal((await request('/api/admin/profile',{cookie})).json().role,'research_group_lead');
  assert.equal((await request('/admin/publishing/news',{cookie})).status,403);
  await db.update(user).set({active:false}).where(eq(user.id,id));assert.equal((await request('/api/admin/profile',{cookie})).status,401);
  assert.notEqual((await request('/api/admin/auth/sign-in/email',{method:'POST',body:{email:fixtures.editor.email,password:fixtures.editor.password}})).status,200);
  await db.update(user).set({role:'editor',researchGroupId:null,active:true}).where(eq(user.id,id));
 });
 await test('password change verifies old credential and revokes other sessions',async()=>{
  await db.delete(loginAttempt);const other=await signIn(fixtures.editor),cookie=sessions.editor.cookie;
  const password=randomBytes(32).toString('base64url');
  assert.notEqual((await request('/api/admin/auth/change-password',{method:'POST',cookie,body:{currentPassword:'wrong',newPassword:password}})).status,200);
  const result=await request('/api/admin/auth/change-password',{method:'POST',cookie,body:{currentPassword:fixtures.editor.password,newPassword:password}});assert.equal(result.status,200);
  assert.equal((await request('/api/admin/profile',{cookie:other.cookie})).status,401);
  const newCookie=result.headers.getSetCookie().find(c=>c.includes('session_token='))?.split(';')[0];if(newCookie)sessions.editor.cookie=newCookie;
  const old=await request('/api/admin/auth/sign-in/email',{method:'POST',body:{email:fixtures.editor.email,password:fixtures.editor.password}});assert.equal(old.status,401);
  fixtures.editor.password=password;assert.ok((await signIn(fixtures.editor)).cookie);
 });
 await test('logout, expired and tampered cookies cannot read or mutate accounts',async()=>{
  const cookie=sessions.super_admin.cookie;assert.equal((await request('/api/admin/auth/sign-out',{method:'POST',cookie,body:{}})).status,200);
  assert.equal((await request('/api/admin/profile',{cookie})).status,401);
  await db.update(session).set({expiresAt:new Date(Date.now()-1000)}).where(eq(session.userId,fixtures.research_group_lead.id));
  assert.equal((await request('/api/admin/profile',{cookie:sessions.research_group_lead.cookie})).status,401);
  assert.equal((await request('/api/admin/profile',{cookie:sessions.editor.cookie+'tampered'})).status,401);
 });
 await test('account throttling is atomic even with forged IP headers and parallel attempts',async()=>{
  await db.delete(loginAttempt);
  const replies=await Promise.all(Array.from({length:9},(_,i)=>request('/api/admin/auth/sign-in/email',{method:'POST',headers:{'x-forwarded-for':`198.51.100.${i}`},body:{email:fixtures.editor.email,password:'wrong'}})));
  assert.equal(replies.filter(r=>r.status===401).length,5);assert.equal(replies.filter(r=>r.status===429).length,4);
 });
 await test('HTTPS configuration issues host-only Secure signed cookies through real authentication',async()=>{
  const origin=process.env.ADMIN_ORIGIN;
  try {
   process.env.ADMIN_ORIGIN='https://preview.example.invalid';
   const {adminAuth}=await import('../src/lib/admin/auth.ts');
   const response=await adminAuth().handler(new Request(process.env.ADMIN_ORIGIN+'/api/admin/auth/sign-in/email',{method:'POST',headers:{origin:process.env.ADMIN_ORIGIN,'content-type':'application/json'},body:JSON.stringify({email:fixtures.super_admin.email,password:fixtures.super_admin.password})}));
   assert.equal(response.status,200);
   const cookie=response.headers.getSetCookie().find(value=>value.includes('session_token='));
   assert.ok(cookie?.includes('__Secure-'));assert.ok(/;\s*Secure(?:;|$)/i.test(cookie));assert.ok(/HttpOnly/i.test(cookie));assert.ok(/SameSite=Lax/i.test(cookie));assert.ok(!/;\s*Domain=/i.test(cookie));
  }finally{process.env.ADMIN_ORIGIN=origin;}
 });
 await db.delete(loginAttempt);await db.execute(sql`truncate admin_rate_limit`);
 const fixtureFile=process.env.NOSEE_ADMIN_FIXTURE_FILE;
 if(fixtureFile){
  const file=resolve(fixtureFile),folder=realpathSync(dirname(file));assert.ok(folder==='/tmp'||folder.startsWith('/tmp/'),'Secrets must stay outside Git.');
  const fd=openSync(file,constants.O_WRONLY|constants.O_CREAT|constants.O_TRUNC|constants.O_NOFOLLOW,0o600);
  try{fchmodSync(fd,0o600);writeFileSync(fd,JSON.stringify(fixtures));}finally{closeSync(fd);}
 }
}finally{await pool.end();}
