import test from 'node:test';
import assert from 'node:assert/strict';
import {render} from './helpers/render-site.mjs';
const {PasswordInput}=await import('../src/components/ui/password-input.tsx');
test('password inputs initially hide values and preserve native password-manager/validation attributes',()=>{
 const html=render(PasswordInput,{id:'secret',name:'password',autoComplete:'new-password',required:true,minLength:15,maxLength:128,'aria-describedby':'help'});
 for(const value of ['type="password"','name="password"','autoComplete="new-password"','minLength="15"','maxLength="128"','aria-describedby="help"','aria-controls="secret"','aria-label="Show password"','type="button"','pr-12','size-11'])assert.ok(html.includes(value),value);
 assert.doesNotMatch(html,/type="submit"|type="text"/);
 assert.match(render(PasswordInput,{id:'disabled',disabled:true}),/disabled=""/);
});
