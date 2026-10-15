import assert from 'node:assert/strict';
import test from 'node:test';
import {memberDeleteInput} from '../src/lib/membership/member-input.ts';
import {memberDeletionPhrase} from '../src/lib/membership/member-options.ts';
test('deletion confirmation preserves stored names and every supplied character',()=>{
 for(const name of ['Adeyemi','van der Meer',"O'Neill",'D’Arcy-Sánchez','李 明','e\u0301']){
  const phrase=`Delete ${name}'s record`;
  assert.equal(memberDeletionPhrase(name),phrase);
  assert.equal(memberDeleteInput.parse({phrase,version:1}).phrase,phrase);
  for(const altered of [' '+phrase,phrase+' ',phrase.toLowerCase(),phrase.replace("'",'’')])assert.equal(memberDeleteInput.parse({phrase:altered,version:1}).phrase,altered);
 }
});
test('deletion input rejects missing, unbounded and extra fields without accepting restore controls',()=>{
 for(const input of [{},{phrase:'',version:1},{phrase:'x'.repeat(201),version:1},{phrase:'Delete',version:0},{phrase:'Delete',version:'1'},{phrase:'Delete',version:1,deletedAt:null},{phrase:'Delete',version:1,lastName:'Client supplied'}])assert.equal(memberDeleteInput.safeParse(input).success,false);
});
