import test from 'node:test';
import assert from 'node:assert/strict';
import {hasUnpublishedNewsChanges} from '../src/lib/news/draft-state.ts';
const original={title:'Synthetic article',category:'research-news',excerpt:'Synthetic excerpt',body:'Synthetic body',publicationDate:'2026-01-01T00:00:00.000Z',publicationTimezone:'Africa/Lagos',featured:false,slug:'synthetic-article',coverImage:'',coverAlt:''};
test('every public content field affects the revision indicator',()=>{
 for(const patch of [{title:'Changed'},{category:'outreach-report'},{excerpt:'Changed'},{body:'Changed'},{publicationDate:'2026-01-02T00:00:00Z'},{publicationTimezone:'UTC'},{featured:true},{coverImage:'/media/trending/trending1.png'},{coverAlt:'Changed'},{slug:'changed'}])
  assert.equal(hasUnpublishedNewsChanges({...original,...patch},original),true,JSON.stringify(Object.keys(patch)));
});
test('bookkeeping never creates a revision and missing snapshots do not create badges',()=>{
 assert.equal(hasUnpublishedNewsChanges({...original,id:'id',version:7,status:'published',createdBy:'actor',updatedAt:'2026-02-01',publishedAt:'2026-02-01',lastMutationKey:'key'},original),false);
 assert.equal(hasUnpublishedNewsChanges(original,null),false);
 assert.equal(hasUnpublishedNewsChanges({...original,title:'Changed'},original),true);
 assert.equal(hasUnpublishedNewsChanges({...original},original),false);
});
test('equivalent legacy text, rich documents, UTC offsets, defaults and JSONB order compare canonically',()=>{
 const document={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Synthetic body'}]}]};
 const legacy={...original};delete legacy.publicationTimezone;
 assert.equal(hasUnpublishedNewsChanges({...original,body:document,publicationDate:'2026-01-01T01:00:00+01:00'},legacy),false);
 const rich={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Synthetic body',marks:[{type:'bold'},{type:'italic'}]}]}]};
 const reordered={content:[{content:[{marks:[{type:'italic'},{type:'bold'}],text:'Synthetic body',type:'text'}],type:'paragraph'}],type:'doc'};
 assert.equal(hasUnpublishedNewsChanges({...original,body:rich},{...original,body:reordered}),false);
});
