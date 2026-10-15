import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccess, adminNavigation, pathPermission } from '../src/lib/admin/policy.ts';
import { profileInput, bootstrapInput } from '../src/lib/admin/validation.ts';
import { parseAdminConfig, verifiedPostgresUrl, safePostgresUrl } from '../src/lib/admin/environment.ts';
const group='b410c551-f833-441a-9cc0-fd81390d2690';
const principals=Object.fromEntries(['super_admin','editor','research_group_lead'].map(role=>[role,{id:'test',firstName:'First',lastName:'Last',email:'fixture@example.invalid',role,researchGroupId:role==='research_group_lead'?group:null}]));
test('all role/resource combinations enforce the approved permission matrix',()=>{
 const matrix={super_admin:['overview','account','membership','research','publishing','website','administrators','activity'],editor:['overview','account','publishing','website'],research_group_lead:['overview','account','research']};
 for(const [role,principal] of Object.entries(principals))for(const permission of matrix.super_admin)assert.equal(canAccess(principal,permission,group),matrix[role].includes(permission),`${role}/${permission}`);
});
test('research lead scope is exact and cannot be absent, new or another group',()=>{
 const lead=principals.research_group_lead;
 for(const id of [undefined,'new',group+'x','other',group.toUpperCase()])assert.equal(canAccess(lead,'research',id),false);
 assert.equal(canAccess({...lead,researchGroupId:null},'account'),false);
 assert.equal(canAccess({...lead,role:'member'},'account'),false);
 assert.equal(canAccess(lead,'research',group),true);
});
test('role-specific navigation exposes only approved destinations and marks future modules unavailable',()=>{
 assert.deepEqual(adminNavigation(principals.editor).map(i=>i.label),['Overview','Publishing','Website','General']);
 assert.deepEqual(adminNavigation(principals.research_group_lead).map(i=>i.label),['Overview','Research','General']);
 assert.equal(adminNavigation(principals.super_admin).length,8);
 for(const principal of Object.values(principals))assert.deepEqual(adminNavigation(principal).filter(i=>i.available).map(i=>i.href),principal.role==='super_admin'?['/admin','/admin/settings/general','/admin/settings/administrators','/admin/settings/activity-log']:['/admin','/admin/settings/general']);
 assert.equal(adminNavigation(principals.research_group_lead)[1].href,`/admin/research/${group}`);
 assert.deepEqual(pathPermission(['research',group,'members']),{permission:'research',groupId:group});
 assert.equal(pathPermission(['settings','generalised']),null);
});
test('profile allowlist rejects role, scope, email and user-id mass assignment; names preserve Unicode',()=>{
 assert.deepEqual(profileInput.parse({firstName:'  Adé  ',lastName:'Okafor'}),{firstName:'Adé',lastName:'Okafor'});
 for(const input of [{firstName:'',lastName:'Last'},{firstName:'First\u0000',lastName:'Last'},...['role','researchGroupId','email','userId'].map(key=>({firstName:'First',lastName:'Last',[key]:'injected'}))])assert.equal(profileInput.safeParse(input).success,false);
 assert.equal(bootstrapInput.safeParse({firstName:'First',lastName:'Last',email:'invalid',password:'short'}).success,false);
});
test('missing or insecure infrastructure fails closed without a stateless fallback',()=>{
 const environment={DATABASE_URL:'postgresql://localhost/test',BETTER_AUTH_SECRET:'x'.repeat(48),ADMIN_ORIGIN:'http://127.0.0.1:3030'};
 assert.equal(parseAdminConfig({}),null);assert.ok(parseAdminConfig(environment));
 for(const origin of ['http://example.com','https://example.com/path','https://example.com/','https://user:password@example.com'])assert.equal(parseAdminConfig({...environment,ADMIN_ORIGIN:origin}),null);
 const remote={...environment,ADMIN_ORIGIN:'https://admin.example.com',DATABASE_URL:'postgresql://db.example.com/test?sslmode=require'};
 assert.equal(parseAdminConfig(remote)?.databaseUrl,'postgresql://db.example.com/test?sslmode=verify-full');
 assert.equal(parseAdminConfig(remote)?.secureCookies,true);
 assert.equal(parseAdminConfig({...remote,DATABASE_URL:'postgresql://db.example.com/test?sslmode=verify-full'})?.secureCookies,true);
});

test('provider-managed Neon URLs are upgraded to verified TLS without dropping connection details',()=>{
 const supplied='postgresql://operator:p%40ssword@ep-example-pooler.region.aws.neon.tech/nosee?sslmode=require&channel_binding=require';
 const verified=verifiedPostgresUrl(supplied);
 assert.ok(verified);
 const url=new URL(verified);
 assert.equal(url.protocol,'postgresql:');
 assert.equal(url.hostname,'ep-example-pooler.region.aws.neon.tech');
 assert.equal(url.pathname,'/nosee');
 assert.equal(url.password,'p%40ssword');
 assert.equal(url.searchParams.get('sslmode'),'verify-full');
 assert.equal(url.searchParams.get('channel_binding'),'require');
 assert.equal(safePostgresUrl(supplied),true);
 assert.equal(verifiedPostgresUrl('postgresql://db.example.com/test?sslmode=verify-full'),'postgresql://db.example.com/test?sslmode=verify-full');
 assert.equal(verifiedPostgresUrl('postgresql://127.0.0.1/local'),'postgresql://127.0.0.1/local');
});

test('database connection validation rejects disabled, ambiguous or absent remote TLS',()=>{
 for(const suffix of [
  '', '?sslmode=disable', '?sslmode=prefer', '?sslmode=no-verify',
  '?sslmode=verify-ca', '?sslmode=require&sslmode=disable', '?sslmode=require&ssl=false',
 ]) {
  assert.equal(verifiedPostgresUrl('postgresql://db.example.com/test'+suffix),null,suffix);
 }
 assert.equal(verifiedPostgresUrl('https://db.example.com/test?sslmode=require'),null);
 assert.equal(verifiedPostgresUrl('not a url'),null);
});
