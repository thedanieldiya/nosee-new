import assert from 'node:assert/strict';
import test from 'node:test';
import {memberInput,memberDate,memberCreateInput,memberUpdateInput,applicationMemberInput,profileLinkInput,memberQuery,memberMatchInput} from '../src/lib/membership/member-input.ts';
import {emptyMemberFields,memberStatuses} from '../src/lib/membership/member-options.ts';
const fields={...emptyMemberFields,firstName:' Adé ',lastName:'Okafor',email:' MEMBER@example.invalid ',joinDate:'2026-10-15'};
test('manual membership has independent Active/Inactive states and optional career/interests',()=>{
 assert.deepEqual(Object.values(memberStatuses),['Active','Inactive']);const parsed=memberInput.parse(fields);assert.equal(parsed.firstName,'Adé');assert.equal(parsed.email,'member@example.invalid');assert.equal(parsed.careerStage,'');assert.deepEqual(parsed.researchInterests,[]);
 for(const status of ['pending','approved','rejected','expired','editor'])assert.equal(memberInput.safeParse({...fields,status}).success,false);
});
test('member field limits, enums, printable text and real dates are validated server-side',()=>{
 for(const patch of [{firstName:''},{lastName:'x'.repeat(81)},{email:'invalid'},{phone:'x'.repeat(81)},{affiliation:'x'.repeat(201)},{careerStage:'invented'},{researchInterests:['invented']},{researchInterests:['climate_science','climate_science']},{notes:'x'.repeat(2001)},{notes:'private\u0000'},{joinDate:'2026-02-30'},{joinDate:'2026-13-01'},{joinDate:'2026-10-15T00:00:00Z'},{joinDate:'0000-01-01'},{role:'super_admin'},{leadershipProfileId:'forged'}])assert.equal(memberInput.safeParse({...fields,...patch}).success,false,JSON.stringify(patch));
 assert.equal(memberInput.safeParse({...fields,phone:'x'.repeat(80),affiliation:'x'.repeat(200),notes:'x'.repeat(2000),careerStage:'early_career',researchInterests:['space_weather','climate_science']}).success,true);assert.equal(memberDate.safeParse('2024-02-29').success,true);
});
test('writes require confirmation, creation idempotency key and edit version',()=>{
 const requestId='9409edae-4dc7-4bfb-80c5-c71956a7dff9';assert.equal(memberCreateInput.safeParse({fields,requestId,confirm:true}).success,true);
 for(const body of [{fields,requestId},{fields,requestId,confirm:false},{fields,requestId:'invalid',confirm:true}])assert.equal(memberCreateInput.safeParse(body).success,false);
 assert.equal(memberUpdateInput.safeParse({fields,version:0,confirm:true}).success,false);assert.equal(memberUpdateInput.safeParse({fields,version:1,confirm:true,reviewerId:requestId}).success,false);
 assert.equal(applicationMemberInput.safeParse({association:{memberId:requestId,version:1,confirm:true},confirm:true}).success,true);assert.equal(profileLinkInput.safeParse({profileId:null,version:1,confirm:true}).success,true);assert.equal(profileLinkInput.safeParse({profileId:requestId,version:1,confirm:true,published:true}).success,false);
});
test('directory and private match filters reject invalid criteria and arbitrary clock or access fields',()=>{
 assert.deepEqual(memberQuery.parse({}),{q:'',status:'',interest:'',page:1});
 for(const input of [{page:0},{status:'approved'},{interest:'invented'},{q:'x'.repeat(121)},{role:'editor'}])assert.equal(memberQuery.safeParse(input).success,false);
 assert.equal(memberMatchInput.safeParse({email:'bad'}).success,false);assert.equal(memberMatchInput.safeParse({firstName:'Ada',lastName:'Example',email:'',exclude:''}).success,true);
});
