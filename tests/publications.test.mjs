import test from 'node:test';import assert from 'node:assert/strict';
import{normalizeDoi,doiUrl}from'../src/lib/publications/doi.ts';import{publicationFieldsInput,validPublicationDate,publicationQuery}from'../src/lib/publications/input.ts';
import{emptyPublicationFields,publicationDateKey,publicationDateLabel,publicationFingerprint,hasUnpublishedPublicationChanges,publicationRequirements}from'../src/lib/publications/content.ts';
import{retrieveDoi,crossrefMetadata,dataciteMetadata}from'../src/lib/publications/lookup-adapter.ts';
const fields=(patch={})=>({...emptyPublicationFields(),title:'Synthetic publication',authors:['Research Organisation','Second Author'],publicationDate:'2026',...patch});
const crossref=(doi='10.1234/example',patch={})=>({message:{DOI:doi,title:['Provided title'],author:[{name:'Research Organisation'},{given:'Second',family:'Author'}],type:'journal-article',published:{'date-parts':[[2026,5]]},'container-title':['Source'],URL:'https://example.org/paper',abstract:'NEVER IMPORT THIS',...patch}});
const datacite=(patch={})=>({data:{attributes:{doi:'10.1234/example',titles:[{title:'Data title'}],creators:[{name:'Data Organisation'},{name:'Second, Author'}],types:{resourceTypeGeneral:'Dataset'},publicationYear:2026,publisher:{name:'Repository'},url:'https://example.org/data',descriptions:[{description:'NEVER IMPORT THIS'}],...patch}}});
const response=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json',...headers}});
test('DOI normalization accepts case-insensitive bare identifiers and standard resolver URLs without losing suffix punctuation',()=>{
 for(const raw of[' 10.1234/Example ', 'https://doi.org/10.1234/Example','http://dx.doi.org/10.1234%2FExample'])assert.equal(normalizeDoi(raw),'10.1234/example');
 assert.equal(normalizeDoi('10.1234/a(b);x.1'),'10.1234/a(b);x.1');assert.equal(doiUrl('10.1234/a?b#c'),'https://doi.org/10.1234/a%3Fb%23c');
 for(const raw of['https://evil.invalid/10.1234/example','https://doi.org@evil.invalid/10.1234/x','https://name@doi.org/10.1234/x','https://doi.org:443/10.1234/x?x=1','https://doi.org/10.1234/x#fragment','10.1/x','10.1234/has space','javascript:alert(1)','https://doi.org/%FF'])assert.throws(()=>normalizeDoi(raw));
});
test('bibliographic dates retain precision, reject impossible calendar input and sort missing components as zero without displaying them',()=>{
 for(const date of['2026','2026-05','2026-05-09','2040-02-29'])assert.ok(validPublicationDate(date));
 for(const date of['','2026-00','2026-13','2026-02-29','2026-04-31','26','2026-1'])assert.equal(validPublicationDate(date),false);
 assert.equal(publicationDateLabel('2026'),'2026');assert.equal(publicationDateLabel('2026-05'),'May 2026');assert.equal(publicationDateLabel('2026-05-09'),'9 May 2026');
 assert.deepEqual(['2026','2026-05','2026-05-09','2025-12-31'].sort((a,b)=>publicationDateKey(b)-publicationDateKey(a)),['2026-05-09','2026-05','2026','2025-12-31']);
});
test('manual publication requires title, a bibliographic year, and author or source; DOI, source and authors are not universally mandatory',()=>{
 assert.deepEqual(publicationRequirements(fields({doi:'',authors:[],source:'Issuing Organisation'})),{});assert.deepEqual(publicationRequirements(fields({doi:'',source:''})),{});assert.ok(publicationRequirements(fields({authors:[],source:'',publicationDate:''})).authors);
 assert.ok(publicationFieldsInput.safeParse(fields({publicationDate:'2099',doi:''})).success);
 for(const patch of[{featured:true},{slug:'forged'},{title:''},{authors:['']},{referenceUrl:'javascript:alert(1)'},{referenceUrl:'https://user:pass@example.org'},{researchAreas:['invented']},{lookup:{doi:'10.1234/other',provider:'crossref',retrievedAt:'2026-10-27T00:00:00Z'}}])assert.equal(publicationFieldsInput.safeParse(fields(patch)).success,false);
 assert.ok(!publicationQuery.safeParse({status:'scheduled'}).success);
});
test('canonical publication comparison includes editable public fields, preserves author order and ignores provenance/bookkeeping',()=>{
 const f=fields(),pub={...f,slug:'synthetic',publicGroup:null};assert.equal(hasUnpublishedPublicationChanges({...f,version:4,updatedAt:'changed',lookup:{doi:'10.1234/example',provider:'crossref',retrievedAt:'2026-10-27T00:00:00Z'}},pub),false);
 for(const patch of[{title:'Other'},{doi:'10.1234/other'},{authors:[...f.authors].reverse()},{type:'report'},{publicationDate:'2026-01'},{source:'Other'},{referenceUrl:'https://example.org'},{abstract:'Other'},{researchAreas:['space_weather']},{groupId:'00000000-0000-4000-8000-000000000001'}])assert.notEqual(publicationFingerprint({...f,...patch}),publicationFingerprint(f));
 assert.equal(publicationFingerprint({...f,researchAreas:['climate_science','space_weather']}),publicationFingerprint({...f,researchAreas:['space_weather','climate_science']}));assert.equal(hasUnpublishedPublicationChanges(f,null),false);
});
test('Crossref maps supplied fields, ordered organisational authors and exact date-parts without abstracts or full responses',()=>{
 const value=crossrefMetadata(crossref(),'10.1234/example');assert.deepEqual(value,{title:'Provided title',authors:['Research Organisation','Second Author'],type:'journal-article',publicationDate:'2026-05',source:'Source',referenceUrl:'https://example.org/paper'});assert.deepEqual(crossrefMetadata({message:{DOI:'10.1234/example'}},'10.1234/example'),{});assert.throws(()=>crossrefMetadata(crossref('10.1234/other'),'10.1234/example'));
});
test('DataCite uses supplied Issued precision, creator order and publisher variants; missing/unsafe fields are omitted',()=>{
 const value=dataciteMetadata(datacite({dates:[{dateType:'Issued',date:'2026-02'}]}),'10.1234/example');assert.equal(value.publicationDate,'2026-02');assert.deepEqual(value.authors,['Data Organisation','Second, Author']);assert.equal(value.type,'dataset');assert.ok(!('abstract'in value));assert.equal(dataciteMetadata(datacite({url:'javascript:alert(1)'}),'10.1234/example').referenceUrl,undefined);
});
test('provider transport uses only encoded fixed endpoints and follows no redirects; Crossref 404 falls back to DataCite',async()=>{
 const calls=[];const r=await retrieveDoi('10.1234/Example',async(url,options)=>{calls.push([url,options.redirect]);return calls.length===1?response({},404):response(datacite());});assert.equal(r.provider,'datacite');assert.deepEqual(calls,[['https://api.crossref.org/works/10.1234%2Fexample','manual'],['https://api.datacite.org/dois/10.1234%2Fexample','manual']]);
 for(const status of[301,302,307]){let n=0;const r=await retrieveDoi('10.1234/example',async()=>{n++;return response({},status,{location:'http://127.0.0.1/private'});});assert.equal(r.status,'failure');assert.equal(n,1);}
});
test('provider no-match, malformed schema, bad JSON and mismatched identifiers produce safe manual-entry outcomes',async()=>{
 assert.equal((await retrieveDoi('10.1234/example',async()=>response({},404))).status,'no_match');
 for(const factory of[()=>response({wrong:'schema'}),()=>new Response('not json',{headers:{'content-type':'application/json'}}),()=>response(crossref('10.1234/other')),()=>new Response('html',{headers:{'content-type':'text/html'}})])assert.equal((await retrieveDoi('10.1234/example',async()=>factory())).status,'failure');
});
test('response bounds cover declared and streamed size, and timeouts remain bounded',async()=>{
 for(const factory of[()=>response(crossref(),200,{'content-length':'300000'}),()=>new Response('x'.repeat(262145),{headers:{'content-type':'application/json'}})])assert.equal((await retrieveDoi('10.1234/example',async()=>factory())).status,'failure');
 const start=Date.now();const result=await retrieveDoi('10.1234/example',(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('aborted')))),25);assert.equal(result.status,'failure');assert.ok(Date.now()-start<1000);
});
test('provider rate limits respect bounded Retry-After and do not trigger fallback traffic',async()=>{
 let n=0;const r=await retrieveDoi('10.1234/example',async()=>{n++;return response({},429,{'retry-after':'45'});});assert.equal(r.status,'rate_limited');assert.equal(r.retryAfter,45);assert.equal(n,1);
});
