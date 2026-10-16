import test from 'node:test';
import assert from 'node:assert/strict';
import {researchSlugBase,researchSlugCandidate,researchDeletionPhrase} from '../src/lib/research/slug.ts';
import {validateDescription,descriptionCount,descriptionDocument,descriptionText,safeResearchLink} from '../src/lib/research/description.ts';
import {groupCreateInput,groupUpdateInput,groupDeletionInput} from '../src/lib/research/input.ts';
const text=value=>({type:'text',text:value}),paragraph=value=>({type:'paragraph',content:[text(value)]}),doc=(...content)=>({type:'doc',content});
test('automatic URL bases fold diacritics, punctuation and Unicode safely; suffixes stay bounded',()=>{
 for(const [name,slug]of[['Clímate & Science!','climate-science'],['  Hello—World  ','hello-world'],['研究','research-group'],['💚!!!','research-group'],['Café ２','cafe-2']])assert.equal(researchSlugBase(name),slug);
 const base=researchSlugBase('long '.repeat(40));assert.ok(base.length<=80);assert.equal(base.endsWith('-'),false);for(const number of[1,2,3,1000]){const slug=researchSlugCandidate(base,number);assert.ok(slug.length<=80);assert.match(slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);}assert.equal(researchSlugCandidate('climate-science',2),'climate-science-2');
});
test('editable contracts reject forged slug, alt, cover, publication and deletion metadata',()=>{
 const content={name:'Research',introduction:'',description:'',objectives:[]},base={content,confirm:true};
 for(const field of['slug','coverAlt','coverImage','deletedAt','publishedContent','descriptionDocument'])for(const schema of[groupCreateInput,groupUpdateInput])assert.equal(schema.safeParse({...base,...(schema===groupCreateInput?{requestId:'d4b6fe62-5217-419e-87c7-8944fb9cbd3b'}:{version:1}),content:{...content,[field]:'injected'}}).success,false);
 assert.ok(groupDeletionInput.safeParse({phrase:researchDeletionPhrase('Exact — Group'),version:1}).success);assert.equal(groupDeletionInput.safeParse({phrase:'Delete Group',version:0}).success,false);
});
test('legacy plain text and line breaks convert without HTML parsing or lost blank lines',()=>{
 const original='<script>literal & text</script>\n\nSecond line\n';const converted=descriptionDocument(original);assert.equal(descriptionText(converted),original);assert.equal(descriptionCount(converted),descriptionCount(original));assert.deepEqual(validateDescription(converted),converted);assert.equal(validateDescription(original),original);assert.equal(descriptionText(descriptionDocument('a\r\nb\rc')),'a\nb\nc');
});
test('visible graphemes and line breaks share one 6000-character rule across strings and documents',()=>{
 for(const value of['a','é','e\u0301','👩🏽‍🔬','🇳🇬']){assert.equal(descriptionCount(value),1);assert.ok(validateDescription(value.repeat(6000)));assert.throws(()=>validateDescription(value.repeat(6001)));}
 const formatted=doc({type:'heading',attrs:{level:2},content:[{...text('Hi'),marks:[{type:'bold'}]}]},paragraph('World'));
 assert.equal(descriptionText(formatted),'Hi\nWorld');assert.equal(descriptionCount(formatted),8);assert.deepEqual(validateDescription(formatted),formatted);
});
test('supported marks, lists, headings and safe link protocols round trip as data',()=>{
 const value=doc({type:'heading',attrs:{level:3},content:[text('Study')]},{type:'orderedList',attrs:{start:2,type:null},content:[{type:'listItem',content:[{type:'paragraph',content:[{...text('Read more'),marks:[{type:'bold'},{type:'italic'},{type:'link',attrs:{href:'https://example.invalid/research?q=1&x=2'}}]}]}]}]});
 const parsed=validateDescription(value);assert.equal(parsed.content[1].attrs.start,2);assert.equal(descriptionText(parsed),'Study\nRead more');for(const url of['https://example.invalid','http://example.invalid','mailto:review@example.invalid'])assert.ok(safeResearchLink(url));
});
test('unsafe links, unknown nodes/marks/attributes and excessive structure are rejected',()=>{
 for(const href of['javascript:alert(1)','JaVaScRiPt:alert(1)','data:text/html,x','//example.invalid','/admin','https://a.invalid/\n','file:///etc/passwd','ftp://example.invalid','https://user:pass@example.invalid','https://a.invalid\\evil']){assert.equal(safeResearchLink(href),false);assert.throws(()=>validateDescription(doc({type:'paragraph',content:[{...text('x'),marks:[{type:'link',attrs:{href}}]}]})));}
 for(const value of[doc({type:'image',attrs:{src:'https://a.invalid'}}),doc({type:'heading',attrs:{level:1},content:[text('x')]}),doc({...paragraph('x'),attrs:{onclick:'evil'}}),doc({type:'paragraph',content:[{...text('x'),marks:[{type:'code'}]}]}),doc({type:'paragraph',content:[{...text('x'),marks:[{type:'link',attrs:{href:'https://example.invalid',target:'_blank'}}]}]}),doc(...Array(1201).fill(paragraph('x'))),{type:'doc',content:[]},doc({type:'listItem',content:[paragraph('x')]}),doc({type:'bulletList',content:[paragraph('x')]}),doc({type:'paragraph',content:[text('bad\u0000')]}),doc({type:'paragraph',content:[text('x'.repeat(6001))]})])assert.throws(()=>validateDescription(value));
 let nested=paragraph('x');for(let i=0;i<7;i++)nested={type:'bulletList',content:[{type:'listItem',content:[paragraph('x'),nested]}]};assert.throws(()=>validateDescription(doc(nested)));
});
