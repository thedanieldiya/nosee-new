import test from 'node:test';
import assert from 'node:assert/strict';
import {careerStages,researchInterests,membershipConsent} from '../src/lib/membership/options.ts';
import {applicationInput,submissionInput,decisionInput,applicationQuery} from '../src/lib/membership/input.ts';
const valid={firstName:'Adé',lastName:'Okafor',email:'  APPLY@example.invalid  ',careerStage:'early_career',researchInterests:['climate_science','space_weather'],why:'To collaborate on research.',consent:true};
test('membership choices preserve the approved labels and ordering',()=>{
 assert.deepEqual(Object.values(careerStages),['High school student','Undergraduate student','Graduate/Postgraduate student','Postdoctoral researcher','Early career (<10 years)','Mid-career (10–20 years)','Experienced (>20 years)','Retired']);
 assert.deepEqual(Object.values(researchInterests),['Atmosphere and Air Quality','Climate Science','Earth and Space Informatics','Energy, Resources and Environment','Space Weather']);
 assert.ok(membershipConsent.text.includes('review my membership application'));assert.equal(membershipConsent.privacyVersion,'development-placeholder-v1');
});
test('application validation requires all fields and explicit purpose-specific consent',()=>{
 assert.equal(applicationInput.parse(valid).email,'apply@example.invalid');
 for(const field of Object.keys(valid)){const missing={...valid};delete missing[field];assert.equal(applicationInput.safeParse(missing).success,false,field);}
 for(const patch of [{firstName:' '},{lastName:'x'.repeat(81)},{firstName:'a\u0000'},{email:'invalid'},{careerStage:'invented'},{researchInterests:[]},{researchInterests:['invented']},{researchInterests:['space_weather','space_weather']},{why:' '},{why:'x'.repeat(2001)},{why:'a\u0000'},{consent:false},{consent:'true'},{role:'super_admin'},{status:'approved'},{reviewerId:'injected'}])assert.equal(applicationInput.safeParse({...valid,...patch}).success,false,JSON.stringify(patch));
 assert.equal(applicationInput.safeParse({...valid,firstName:'x'.repeat(80),why:'x'.repeat(2000),researchInterests:Object.keys(researchInterests)}).success,true);
});
test('transport, review and query validation reject honeypots and mass assignment',()=>{
 assert.equal(submissionInput.safeParse({...valid,formToken:'signed-token',website:''}).success,true);
 assert.equal(submissionInput.safeParse({...valid,formToken:'signed-token',website:'bot'}).success,false);
 for(const patch of [{note:''},{decision:'expired'},{reviewerId:'forged'},{note:'x'.repeat(2001)}])assert.equal(decisionInput.safeParse({decision:'approved',note:'Reviewed',...patch}).success,false);
 assert.deepEqual(applicationQuery.parse({}),{q:'',status:'',page:1});
 for(const input of [{page:0},{status:'unknown'},{q:'x'.repeat(121)},{clock:'override'}])assert.equal(applicationQuery.safeParse(input).success,false);
});
