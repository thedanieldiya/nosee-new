import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {decisionInput,memberAcknowledgement} from '../src/lib/membership/input.ts';
import {applicationMemberInput} from '../src/lib/membership/member-input.ts';
import {memberMatchQuery} from '../src/lib/membership/match-query.ts';
import {renderMembershipEmail} from '../src/lib/membership/email-template.ts';
const id='11111111-1111-4111-8111-111111111111',input={kind:'approval',firstName:'Fixture',applicationId:id,origin:'https://nosee.example.invalid'};
test('approval acknowledgement is strict and cannot smuggle status, identities or unchecked confirmations',()=>{
 const association={memberId:id,version:1,confirm:true,reactivate:true};assert.ok(decisionInput.safeParse({decision:'approved',note:'Private review',association}).success);assert.ok(decisionInput.safeParse({decision:'approved',note:'Private review'}).success);
 for(const patch of [{version:0},{memberId:'invalid'},{confirm:false},{reactivate:false},{status:'active'},{joinDate:'2020-01-01'}])assert.equal(memberAcknowledgement.safeParse({...association,...patch}).success,false);
 assert.equal(decisionInput.safeParse({decision:'rejected',note:'Private review',association}).success,false);
});
test('historical reconciliation cannot supply editable source or membership fields',()=>{
 assert.ok(applicationMemberInput.safeParse({confirm:true}).success);for(const patch of [{confirm:false},{fields:{firstName:'Changed'}},{status:'active'},{requestId:id},{action:'create'}])assert.equal(applicationMemberInput.safeParse({confirm:true,...patch}).success,false);
});
test('automatic lookup ignores incomplete details, normalizes email and excludes the current identity',()=>{
 assert.equal(memberMatchQuery('A','B','unfinished@'),null);assert.equal(memberMatchQuery('Ada','',''),null);assert.deepEqual(memberMatchQuery(' Ada ',' Example ','PARTIAL@'),{firstName:'Ada',lastName:'Example',email:'',exclude:''});assert.deepEqual(memberMatchQuery('A','B',' MEMBER@Example.invalid ',id),{firstName:'',lastName:'',email:'member@example.invalid',exclude:id});
});
test('historical approval v1 rendering remains byte-identical to merged A05',()=>{
 // Independently captured from PR #21/main renderer before this correction.
 const hash=createHash('sha256').update(JSON.stringify(renderMembershipEmail(input))).digest('hex');assert.equal(hash,'1ea0e20e9925937004a2e3722ee895cf7dbb10eaaa10f532680c809ddc14d319');assert.deepEqual(renderMembershipEmail({...input,templateVersion:1}),renderMembershipEmail(input));
});
test('new approval v2 reflects established membership without administrator/public access, rejects unknown versions',()=>{
 const current=renderMembershipEmail({...input,templateVersion:2});assert.ok(current.text.includes('membership was set to Active at approval'));assert.ok(current.text.includes('does not create an administrator account, dashboard access or a public profile'));assert.equal(current.text.includes('separate administrative step'),false);assert.notEqual(current.html,renderMembershipEmail(input).html);assert.throws(()=>renderMembershipEmail({...input,templateVersion:3}));assert.throws(()=>renderMembershipEmail({...input,kind:'receipt',templateVersion:2}));
});
