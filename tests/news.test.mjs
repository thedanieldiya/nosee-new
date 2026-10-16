import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {render} from './helpers/render-site.mjs';
import {newsCategories,emptyNewsFields} from '../src/lib/news/options.ts';
import {newsFieldsInput,newsCreateInput,newsUpdateInput,newsPublicationInput,newsContentInput,newsFeedInput,newsQuery} from '../src/lib/news/input.ts';
import {draftFingerprint} from '../src/lib/news/draft-state.ts';
import {automaticSlug} from '../src/lib/content/slug.ts';
import {newsRecords} from '../src/lib/content/news.ts';
const {HomeTrendingNews}=await import('../src/components/site/sections/HomeTrendingNews.tsx');
const {TrendingNewsCard}=await import('../src/components/site/cards/TrendingNewsCard.tsx');
const fields={...emptyNewsFields(new Date('2026-01-01T00:00:00Z')),title:'Synthetic headline',excerpt:'Synthetic summary',body:'Synthetic body'};
test('news categories reuse every established content value without an invented taxonomy',()=>{assert.deepEqual([...newsCategories].sort(),[...new Set(newsRecords.map(n=>n.category))].sort());});
test('news fields enforce documented limits and safe structured bodies while allowing incomplete drafts',()=>{
 assert.ok(newsFieldsInput.safeParse({...fields,excerpt:'',body:''}).success);for(const patch of[{title:''},{title:'x'.repeat(161)},{excerpt:'x'.repeat(401)},{category:'invented'},{featured:1},{body:'x'.repeat(6001)},{body:{type:'doc',content:[{type:'image',attrs:{src:'data:image/svg+xml,x'}}]}},{publicationDate:'tomorrow'},{title:'bad\u0000'}])assert.equal(newsFieldsInput.safeParse({...fields,...patch}).success,false);assert.ok(newsFieldsInput.safeParse({...fields,body:'<script>literal text</script>\n\nNo execution'}).success);
});
test('news mutation contracts reject hidden URL/media/status overrides and scheduled actions',()=>{
 for(const schema of[newsCreateInput,newsUpdateInput]){const base={fields,confirm:true,...(schema===newsCreateInput?{requestId:randomUUID()}:{version:1})};assert.ok(schema.safeParse(base).success);for(const key of['slug','coverImage','coverAlt','status','publishedContent','createdBy'])assert.equal(schema.safeParse({...base,fields:{...fields,[key]:'forged'}}).success,false);}
 assert.ok(newsPublicationInput.safeParse({action:'publish',version:1,confirm:true}).success);for(const action of['schedule','delete','restore'])assert.equal(newsPublicationInput.safeParse({action,version:1,confirm:true}).success,false);
});
test('date values normalize offset instants to UTC; draft dates do not silently schedule publication',()=>{assert.equal(newsFieldsInput.parse({...fields,publicationDate:'2026-01-01T00:30:00+02:00'}).publicationDate,'2025-12-31T22:30:00.000Z');assert.ok(newsFieldsInput.safeParse({...fields,publicationDate:'2999-01-01T00:00:00Z'}).success);});
test('shared automatic slug allocator is bounded and handles both content namespaces and concurrent reservations',()=>{assert.equal(automaticSlug('Clímate News',['climate-news','climate-news-2']),'climate-news-3');assert.equal(automaticSlug('研究',[],'news-article'),'news-article');assert.equal(automaticSlug('研究',[]),'research-group');assert.ok(automaticSlug('a'.repeat(160),['a'.repeat(80)]).length<=80);});
test('published schemas keep safe image references without exposing any image-selection mutation',()=>{
 const snapshot={...fields,slug:'synthetic-headline',coverImage:'',coverAlt:''};assert.ok(newsContentInput.safeParse(snapshot).success);const feed={...snapshot};delete feed.body;assert.ok(newsFeedInput.safeParse(feed).success);assert.equal(newsFeedInput.safeParse(snapshot).success,false);assert.equal(newsContentInput.safeParse({...snapshot,coverImage:'https://unapproved.invalid/x.png',coverAlt:'x'}).success,false);assert.ok(newsContentInput.safeParse({...snapshot,coverImage:'/media/trending/trending1.png',coverAlt:'Retained legitimate image'}).success);
});
test('empty news hides cleanly; image-free cards preserve dimensions and have no broken navigation or image requests',()=>{
 assert.equal(render(HomeTrendingNews,{articles:[]}), '');const article={slug:'synthetic',title:'Escaped <script>headline</script>',excerpt:'Plain summary',category:'research-news',published_at:'2026-01-01T00:00:00.000Z',featured:false,image:'',image_alt:''};const html=render(HomeTrendingNews,{articles:[article]});assert.equal((html.match(/data-trending-news-card/g)||[]).length,1);assert.match(html,/aspect-square/);assert.ok(html.includes('&lt;script&gt;'));assert.doesNotMatch(html,/<img|<a |Read more|VIEW MORE|\/news\/synthetic|<script/);assert.equal((render(TrendingNewsCard,{article,variant:'compact'}).match(/data-variant="compact"/g)||[]).length,1);
});
test('news filters bound status/page and reject query injection metadata',()=>{assert.ok(newsQuery.safeParse({q:'A_%',status:'published',page:2}).success);for(const query of[{status:'scheduled'},{page:0},{page:100001},{q:'x'.repeat(121)},{creator:randomUUID()}])assert.equal(newsQuery.safeParse(query).success,false);});

test('saved-state comparison tolerates PostgreSQL JSONB key order and equivalent editor documents',()=>{
 const editorDoc={type:'doc',content:[{type:'paragraph',content:[{type:'text',marks:[{type:'bold'}],text:'Saved text'}]}]},stored={content:[{content:[{text:'Saved text',type:'text',marks:[{type:'bold'}]}],type:'paragraph'}],type:'doc'};
 assert.equal(draftFingerprint({...fields,body:editorDoc}),draftFingerprint({...fields,body:stored}));assert.equal(draftFingerprint({...fields,body:'Line one\n\nLine two'}),draftFingerprint({...fields,body:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Line one'},{type:'hardBreak'},{type:'hardBreak'},{type:'text',text:'Line two'}]}]}}));assert.notEqual(draftFingerprint({...fields,body:editorDoc}),draftFingerprint({...fields,body:'Changed'}));
});
test('saved-state comparison normalizes equivalent UTC input values and still detects real changes',()=>{assert.equal(draftFingerprint({...fields,publicationDate:'2026-01-01T00:00'}),draftFingerprint(fields));assert.notEqual(draftFingerprint({...fields,title:'Changed'}),draftFingerprint(fields));assert.doesNotThrow(()=>draftFingerprint({...fields,publicationDate:'',body:'x'.repeat(6001)}));});
test('saved ordered lists tolerate editor defaults and equivalent mark order without masking content changes',()=>{
 const stored={type:'doc',content:[{type:'orderedList',content:[{type:'listItem',content:[{type:'paragraph',content:[{type:'text',text:'List item',marks:[{type:'italic'},{type:'bold'}]}]}]}]}]},editor=structuredClone(stored);editor.content[0].attrs={start:1,type:null};editor.content[0].content[0].content[0].content[0].marks.reverse();assert.equal(draftFingerprint({...fields,body:stored}),draftFingerprint({...fields,body:editor}));editor.content[0].attrs.start=2;assert.notEqual(draftFingerprint({...fields,body:stored}),draftFingerprint({...fields,body:editor}));editor.content[0].attrs.start=1;editor.content[0].content[0].content[0].content[0].text='Changed item';assert.notEqual(draftFingerprint({...fields,body:stored}),draftFingerprint({...fields,body:editor}));
});
