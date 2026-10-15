import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {membershipEmailConfig} from '../src/lib/membership/email-config.ts';
import {renderMembershipEmail} from '../src/lib/membership/email-template.ts';
import {sendResendMessage,retryAfterSeconds} from '../src/lib/admin/resend-request.ts';
const environment={MEMBERSHIP_EMAIL_ENABLED:'true',RESEND_API_KEY:'re_isolated_test_only',MEMBERSHIP_EMAIL_FROM:'membership@example.invalid',ADMIN_ORIGIN:'https://nosee.example.invalid',MEMBERSHIP_EMAIL_ADMIN_RECIPIENTS:'reviewer@example.invalid,other@example.invalid',MEMBERSHIP_EMAIL_START_AT:'2026-01-01T00:00:00Z'};
const message={to:'applicant@example.invalid',...renderMembershipEmail({kind:'receipt',firstName:'Applicant',applicationId:randomUUID(),origin:environment.ADMIN_ORIGIN})};
const options=()=>({signal:new AbortController().signal,idempotencyKey:`nosee-membership/${randomUUID()}`});
test('membership enablement is independent, explicit and fail-closed for every required configuration field',()=>{
 assert.ok(membershipEmailConfig(environment));for(const key of Object.keys(environment))assert.equal(membershipEmailConfig({...environment,[key]:undefined}),null,key);
 for(const patch of [{MEMBERSHIP_EMAIL_ENABLED:'TRUE'},{MEMBERSHIP_EMAIL_ENABLED:'false'},{ADMIN_ORIGIN:'http://example.invalid'},{MEMBERSHIP_EMAIL_FROM:'NOSEE <mail@example.invalid>'},{MEMBERSHIP_EMAIL_ADMIN_RECIPIENTS:'a@example.invalid,a@example.invalid'},{MEMBERSHIP_EMAIL_ADMIN_RECIPIENTS:'bad'},{MEMBERSHIP_EMAIL_ADMIN_RECIPIENTS:Array.from({length:11},(_,i)=>`${i}@example.invalid`).join(',')},{MEMBERSHIP_EMAIL_START_AT:'not-a-date'},{RESEND_API_KEY:'a\nb'}])assert.equal(membershipEmailConfig({...environment,...patch}),null);
});
test('activation is stable for normalized recipients/time and key rotation, changes for sender/origin/recipients/cutover',()=>{
 const base=membershipEmailConfig(environment).activationKey;
 assert.equal(membershipEmailConfig({...environment,RESEND_API_KEY:'re_rotated',MEMBERSHIP_EMAIL_ADMIN_RECIPIENTS:' OTHER@example.invalid ,reviewer@example.invalid',MEMBERSHIP_EMAIL_START_AT:'2026-01-01T01:00:00+01:00'}).activationKey,base);
 for(const patch of [{MEMBERSHIP_EMAIL_FROM:'new@example.invalid'},{ADMIN_ORIGIN:'https://new.example.invalid'},{MEMBERSHIP_EMAIL_ADMIN_RECIPIENTS:'new@example.invalid'},{MEMBERSHIP_EMAIL_START_AT:'2026-01-02T00:00:00Z'}])assert.notEqual(membershipEmailConfig({...environment,...patch}).activationKey,base);
});
test('four HTML/text templates preserve truthful subjects, escape user content and have no tracking/remote assets',()=>{
 const subjects=['We received your NOSEE membership application','New NOSEE membership application','Your NOSEE membership application has been approved','Update on your NOSEE membership application'];
 ['receipt','admin_alert','approval','rejection'].forEach((kind,i)=>{const result=renderMembershipEmail({kind,firstName:'<img src=x onerror="alert(1)"> & Test',applicationId:randomUUID(),origin:environment.ADMIN_ORIGIN});assert.equal(result.subject,subjects[i]);assert.ok(result.text.includes('NOSEE'));assert.ok(result.html.includes('lang="en"'));assert.ok(result.html.includes('#13853D'));assert.equal(/<img|<script|@import|<link|tracking|motivation|private note/i.test(result.html),false);assert.equal(result.html.includes('Hello <img'),false);if(kind!=='admin_alert'){assert.ok(result.html.includes('&lt;img'));assert.ok(result.text.includes('<img'));assert.equal(result.html.includes('/admin/'),false);}else{assert.equal(result.html.includes('alert(1)'),false);assert.ok(result.html.includes('/admin/membership/applications/'));}});
 assert.ok(message.text.includes('pending review'));assert.ok(message.text.includes('does not create a dashboard account'));
 const approval=renderMembershipEmail({kind:'approval',firstName:'Test',applicationId:randomUUID(),origin:environment.ADMIN_ORIGIN});assert.ok(approval.text.includes('separate administrative step'));assert.equal(approval.text.includes('/admin/sign-in'),false);
});
test('template rejects unsafe origins and application identifiers',()=>{for(const patch of [{origin:'http://example.invalid'},{origin:'https://example.invalid/path'},{applicationId:'" onclick=evil'}])assert.throws(()=>renderMembershipEmail({kind:'admin_alert',firstName:'Test',applicationId:randomUUID(),origin:environment.ADMIN_ORIGIN,...patch}));});
test('provider acceptance is explicit, one call, stable key/body; rejection never exposes provider body',async()=>{
 const config=membershipEmailConfig(environment),attempt=options(),calls=[];
 const request=async(url,init)=>{calls.push([url,init]);return Response.json({id:'email_membership_accepted'});};
 for(let i=0;i<2;i++)assert.deepEqual(await sendResendMessage(config,message,attempt,request),{delivery:{status:'accepted',messageId:'email_membership_accepted'},retryable:false});
 assert.equal(calls.length,2);assert.equal(calls[0][1].body,calls[1][1].body);assert.equal(new Headers(calls[0][1].headers).get('idempotency-key'),attempt.idempotencyKey);
 const rejection=await sendResendMessage(config,message,attempt,async()=>Response.json({message:'private provider echo'},{status:422}));assert.deepEqual(rejection,{delivery:{status:'failed'},retryable:false,issue:'provider_rejected'});assert.equal(JSON.stringify(rejection).includes('private'),false);
});
test('rate limits respect bounded Retry-After seconds and HTTP dates',async()=>{
 assert.equal(retryAfterSeconds('120'),120);assert.equal(retryAfterSeconds('99999999'),86400);assert.equal(retryAfterSeconds(null),60);assert.equal(retryAfterSeconds('invalid'),60);assert.equal(retryAfterSeconds('0'),1);const now=Date.now();assert.ok(retryAfterSeconds(new Date(now+90000).toUTCString(),now)>=89);
 const outcome=await sendResendMessage(membershipEmailConfig(environment),message,options(),async()=>new Response(null,{status:429,headers:{'retry-after':'120'}}));assert.deepEqual(outcome,{delivery:{status:'failed'},retryable:true,issue:'rate_limited',retryAfterSeconds:120});
});
test('hard eight-second timeout works even when a request ignores the abort signal',async t=>{
 const controller=new AbortController();t.mock.method(AbortSignal,'timeout',ms=>{assert.equal(ms,8000);return controller.signal;});let started;const ready=new Promise(r=>started=r);
 const result=sendResendMessage(membershipEmailConfig(environment),message,options(),async()=>{started();return new Promise(()=>{});});await ready;controller.abort();assert.deepEqual(await result,{delivery:{status:'unconfirmed'},retryable:true,issue:'unconfirmed'});
});
test('HTTP conflict, 5xx, malformed success and network loss remain uncertain without adapter retries',async()=>{
 for(const response of [new Response(null,{status:409}),new Response(null,{status:503}),Response.json({}),Response.json({id:'re_isolated_test_only'})]){let calls=0;const outcome=await sendResendMessage(membershipEmailConfig(environment),message,options(),async()=>{calls++;return response;});assert.equal(outcome.delivery.status,'unconfirmed');assert.equal(outcome.retryable,true);assert.equal(calls,1);}
 const result=await sendResendMessage(membershipEmailConfig(environment),message,options(),async()=>{throw new Error('private network body');});assert.equal(result.delivery.status,'unconfirmed');assert.equal(JSON.stringify(result).includes('private'),false);
});
