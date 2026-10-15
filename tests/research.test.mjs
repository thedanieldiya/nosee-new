import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {groupContentInput,groupCreateInput,groupUpdateInput,groupMemberInput,leadInput,eligibleQuery,publicationInput} from '../src/lib/research/input.ts';
import {invitationInput} from '../src/lib/admin/management-input.ts';
import {researchPaths} from '../src/lib/research/cache.ts';
import {emptyGroupContent,researchCovers} from '../src/lib/research/options.ts';
import {renderInvitationEmail} from '../src/lib/admin/invitation-email.ts';
const id=randomUUID(),content={...emptyGroupContent,name:'Synthetic group',slug:'synthetic-group'};
test('research content validates slugs, bounded text, objective lists and trusted deployed images',()=>{
 assert.ok(groupContentInput.safeParse(content).success);assert.equal(groupContentInput.safeParse({...content,coverImage:researchCovers[0],coverAlt:''}).success,false);
 for(const slug of ['UPPER','a--b','../admin','a/b','a?draft=true',' a','a'.repeat(81),''])assert.equal(groupContentInput.safeParse({...content,slug}).success,false);
 for(const patch of [{administratorId:id},{status:'published'},{publishedContent:content},{description:'a'.repeat(6001)},{objectives:Array(9).fill('focus')},{objectives:['']},{coverImage:'https://attacker.invalid/image.jpg',coverAlt:'Description'},{coverImage:'data:image/png;base64,x',coverAlt:'Description'},{name:'bad\u0000'}])assert.equal(groupContentInput.safeParse({...content,...patch}).success,false);
 assert.ok(groupContentInput.safeParse({...content,description:'<script>literal, never executed</script>\nPlain text',coverImage:researchCovers[0],coverAlt:'Owner supplied description'}).success);
});
test('research writes require reviewed identifiers, strict versions and confirmation without accepting group or role injection',()=>{
 assert.ok(groupCreateInput.safeParse({content,requestId:id,confirm:true}).success);assert.ok(groupUpdateInput.safeParse({content,version:1,confirm:true}).success);
 for(const patch of [{version:0},{confirm:false},{role:'super_admin'},{groupId:id}])assert.equal(groupUpdateInput.safeParse({content,version:1,confirm:true,...patch}).success,false);
 assert.ok(publicationInput.safeParse({action:'publish',version:1,confirm:true}).success);assert.equal(publicationInput.safeParse({action:'delete',version:1,confirm:true}).success,false);
});
test('group member selection cannot create a person or select an application by free-text fields',()=>{
 const input={action:'add',memberId:id,memberVersion:1,roleTitle:'Group-specific role',displayOrder:0,confirm:true};assert.ok(groupMemberInput.safeParse(input).success);
 for(const patch of [{firstName:'Injected'},{applicationId:id},{memberVersion:0},{displayOrder:-1},{displayOrder:10000},{phone:'private'},{status:'active'}])assert.equal(groupMemberInput.safeParse({...input,...patch}).success,false);
 assert.equal(eligibleQuery.safeParse({q:'a'}).success,false);assert.equal(eligibleQuery.safeParse({q:'name',email:'private@example.invalid'}).success,false);
});
test('Group Lead assignment requires explicit identity acknowledgement and current member/account/group versions',()=>{
 const input={action:'assign',administratorId:id,accessVersion:0,memberId:randomUUID(),memberVersion:1,version:1,confirm:true,confirmIdentity:true};assert.ok(leadInput.safeParse(input).success);
 for(const patch of [{confirmIdentity:undefined},{confirmIdentity:false},{memberId:undefined},{memberVersion:0},{accessVersion:-1},{researchGroupId:id}])assert.equal(leadInput.safeParse({...input,...patch}).success,false);
});
test('Lead invitations require real scope fields while ordinary invitations cannot smuggle scope',()=>{
 const ordinary={firstName:'Fixture',lastName:'Reviewer',email:'fixture@example.invalid',role:'editor'},lead={...ordinary,role:'research_group_lead',researchGroupId:id,memberId:randomUUID(),memberVersion:1,groupVersion:1,confirmIdentity:true};assert.ok(invitationInput.safeParse(ordinary).success);assert.ok(invitationInput.safeParse(lead).success);
 for(const field of ['researchGroupId','memberId','memberVersion','groupVersion','confirmIdentity']){const partial={...lead};delete partial[field];assert.equal(invitationInput.safeParse(partial).success,false);assert.equal(invitationInput.safeParse({...ordinary,[field]:lead[field]}).success,false);}
});
test('research invalidation addresses landing and old/new slugs once without accepting arbitrary paths',()=>{assert.deepEqual(researchPaths(['old-slug','new-slug','old-slug','../admin','new?draft=true']),['/research','/research/old-slug','/research/new-slug']);});
test('Group Lead email keeps existing template design and explains the bounded research role without private answers',()=>{
 const message=renderInvitationEmail({firstName:'Fixture',inviterName:'Reviewer',role:'research_group_lead',origin:'https://nosee.example.invalid',code:'x'.repeat(43)});assert.ok(message.text.includes('Research Group Lead'));assert.ok(message.text.includes('limited to your assigned group and requires Active NOSEE membership'));assert.ok(message.html.includes('#13853D'));assert.equal(message.text.includes('why'),false);assert.equal(message.text.includes('?code='),false);
});
