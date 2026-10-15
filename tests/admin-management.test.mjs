import assert from 'node:assert/strict';
import test from 'node:test';
import { randomBytes } from 'node:crypto';
import { renderInvitationEmail } from '../src/lib/admin/invitation-email.ts';
import { managementInput, acceptanceInput, directoryInput, activityInput, invitationMailConfiguration } from '../src/lib/admin/management-input.ts';
test('management allowlists reject new Lead assignments, scope injection and malformed actions',()=>{
 const input={action:'invite',firstName:'Test',lastName:'Recipient',email:'USER@example.invalid',role:'editor'};
 assert.equal(managementInput.parse(input).email,'user@example.invalid');
 for(const extra of [{role:'research_group_lead'},{researchGroupId:'11111111-1111-4111-8111-111111111111'},{active:true},{token:'secret'}])assert.equal(managementInput.safeParse({...input,...extra}).success,false);
 assert.equal(managementInput.safeParse({action:'change-role',id:crypto.randomUUID(),role:'research_group_lead'}).success,false);
 assert.equal(managementInput.safeParse({action:'delete',id:crypto.randomUUID()}).success,false);
});
test('activation accepts only high-entropy code shape, matching password and no identity overrides',()=>{
 const input={code:randomBytes(32).toString('base64url'),password:'a-long-private-password',confirmation:'a-long-private-password'};
 assert.ok(acceptanceInput.safeParse(input).success);
 for(const extra of [{confirmation:'a-different-password'},{password:'short'},{email:'hijack@example.invalid'},{role:'super_admin'},{code:'tiny'}])assert.equal(acceptanceInput.safeParse({...input,...extra}).success,false);
});
test('filters bound pagination and enforce calendar dates and inclusive range order',()=>{
 for(const page of [0,-1,1.5,100001,'bad'])assert.equal(directoryInput.safeParse({page}).success,false);
 assert.ok(activityInput.safeParse({from:'2028-02-29',to:'2028-02-29'}).success);
 for(const value of [{from:'2026-02-29'},{from:'2026-02-31'},{from:'2026-10-20',to:'2026-10-19'},{actor:'not-a-uuid'},{target:'x'.repeat(121)}])assert.equal(activityInput.safeParse(value).success,false);
});
test('email preserves approved connected wording, equivalent text, escaping and token-free URLs',()=>{
 const code=randomBytes(32).toString('base64url'),mail=renderInvitationEmail({firstName:'<img src=x>',inviterName:'A & B',role:'editor',code,origin:'https://preview.example.invalid'});
 assert.equal(mail.subject,'Invitation to NOSEE Administration');assert.ok(mail.html.includes('&lt;img src=x&gt;'));assert.ok(!mail.html.includes('<img'));assert.ok(mail.html.includes('A &amp; B'));
 for(const phrase of ["You're invited to NOSEE",'Your invitation code','This invitation expires in 48 hours.',code,'https://preview.example.invalid/admin/accept-invitation'])assert.ok(mail.html.includes(phrase)&&mail.text.includes(phrase));
 const hrefs=[...mail.html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);assert.ok(hrefs.every(u=>u==='https://preview.example.invalid/admin/accept-invitation'));
 assert.ok(mail.html.includes('role="presentation"'));assert.ok(mail.html.includes('#13853D'));assert.ok(!/tracking|<script|@import/i.test(mail.html));
 for(const origin of ['javascript:alert(1)','https://example.invalid/path','http://example.invalid','https://user:pass@example.invalid'])assert.throws(()=>renderInvitationEmail({firstName:'Test',inviterName:'Owner',role:'editor',code,origin}));
});
test('neutral mail configuration requires a valid approved sender format and exact HTTPS origin',()=>{
 const config={senderName:'NOSEE',from:'admin@example.invalid',origin:'https://preview.example.invalid'};assert.ok(invitationMailConfiguration.safeParse(config).success);
 for(const extra of [{from:'bad\r\nBcc: bad@example.invalid'},{origin:'http://example.invalid'},{origin:'https://example.invalid/path'},{providerKey:'unapproved'}])assert.equal(invitationMailConfiguration.safeParse({...config,...extra}).success,false);
});
