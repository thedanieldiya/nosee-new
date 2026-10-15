// Real relational scope for isolated regression fixtures; never application defaults or hosted seeding.
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {member,researchGroup,researchLeadAssignment} from '../../src/lib/admin/schema.ts';
export async function seedLeadScope(db,person){
 const url=new URL(process.env.DATABASE_URL||'');assert.equal(url.hostname,'127.0.0.1');assert.equal(url.pathname,'/nosee_admin01_test');
 const groupId=person.researchGroupId||randomUUID(),memberId=randomUUID();
 await db.insert(researchGroup).values({id:groupId,name:'Synthetic regression group',slug:'fixture-'+randomUUID(),creationKey:randomUUID(),creationDigest:createHash('sha256').update(groupId).digest('hex'),createdBy:person.id});
 await db.insert(member).values({id:memberId,firstName:person.firstName,lastName:person.lastName,email:person.email,joinDate:'2026-10-15',creationKey:randomUUID(),creationDigest:createHash('sha256').update(memberId).digest('hex')});
 await db.insert(researchLeadAssignment).values({id:randomUUID(),groupId,memberId,administratorId:person.id,assignedBy:person.id});
 return {groupId,memberId};
}
