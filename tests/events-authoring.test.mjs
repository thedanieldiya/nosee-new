import test from 'node:test';
import assert from 'node:assert/strict';
import { eventFieldsInput, safeEventUrl } from '../src/lib/events/input.ts';
import { emptyEventFields, eventFingerprint, eventDraftFingerprint, hasUnpublishedEventChanges, eventTiming, publishedEventFields } from '../src/lib/events/content.ts';
import { eventScheduleZoneLabel, toPublicEvent } from '../src/lib/events/presentation.ts';
import { editorialInstant } from '../src/lib/timezones.ts';
const fields=(patch={})=>({...emptyEventFields(new Date('2027-05-01T09:00:00Z')),title:'Synthetic',...patch});
const content=()=>({...fields(),slug:'synthetic',coverImage:'',coverAlt:''});
test('WAT defaults are captured, future and overnight schedules are valid',()=>{
 const f=fields();assert.equal(f.timezone,'Africa/Lagos');assert.equal(f.startAt,'2027-05-01T09:00:00.000Z');assert.ok(eventFieldsInput.safeParse(f).success);
 assert.ok(eventFieldsInput.safeParse(fields({startAt:'2027-05-01T22:00:00Z',endAt:'2027-05-02T03:00:00Z'})).success);
 assert.ok(eventFieldsInput.safeParse(fields({scheduleMode:'multi_day',endAt:'2027-05-03T10:00:00Z'})).success);
 for(const patch of[{startAt:'tomorrow'},{endAt:'invalid'},{startAt:'0000-01-01T00:00:00Z'},{endAt:f.startAt},{endAt:'2027-04-01T00:00:00Z'},{scheduleMode:'multi_day'},{endAt:'2027-05-03T00:00:00Z'},{timezone:'invalid'}])assert.equal(eventFieldsInput.safeParse(fields(patch)).success,false);
});
test('WAT and alternate-zone conversion reject invalid dates and nonexistent DST; repeated hours explicitly choose earlier',()=>{
 assert.equal(editorialInstant('2027-05-01','10:00','Africa/Lagos'),'2027-05-01T09:00:00.000Z');
 assert.equal(editorialInstant('2027-07-01','10:00','America/New_York'),'2027-07-01T14:00:00.000Z');
 assert.equal(editorialInstant('2026-11-01','01:30','America/New_York'),'2026-11-01T05:30:00.000Z');
 assert.throws(()=>editorialInstant('2027-03-14','02:30','America/New_York'),/does not exist/);assert.throws(()=>editorialInstant('2027-02-30','10:00','Africa/Lagos'));
});
test('itinerary and deadline boundaries are checked independently of publication date',()=>{
 const f=fields();assert.ok(eventFieldsInput.safeParse({...f,deadline:f.endAt,itinerary:[{at:f.startAt,endAt:f.endAt,title:'Intro',description:''}]}).success);
 for(const patch of[{deadline:'2027-05-01T10:00:01Z'},{itinerary:[{at:f.endAt,endAt:null,title:'',description:''}]},{itinerary:[{at:'2027-05-01T08:00:00Z',endAt:null,title:'',description:''}]},{itinerary:[{at:f.startAt,endAt:f.startAt,title:'',description:''}]}])assert.equal(eventFieldsInput.safeParse({...f,...patch}).success,false);
});
test('exact UTC timing boundaries apply to every event type and duration',()=>{
 for(const type of['meeting','workshop'])for(const scheduleMode of['single_day','multi_day']){const f=fields({type,scheduleMode});assert.equal(eventTiming(f.startAt,f.endAt,new Date('2027-05-01T08:59:59.999Z')),'upcoming');assert.equal(eventTiming(f.startAt,f.endAt,new Date(f.startAt)),'ongoing');assert.equal(eventTiming(f.startAt,f.endAt,new Date(f.endAt)),'past');}
});
test('safe stored HTTP(S) redirects reject credentials, schemes, backslashes and control whitespace',()=>{
 for(const url of['https://example.org/meeting?x=1','http://example.org/path'])assert.ok(safeEventUrl(url));
 for(const url of['javascript:alert(1)','data:text/html,x','//example.org','https://name:pass@example.org','https://example.org\\@evil.example','https://example.org/\nx'])assert.equal(safeEventUrl(url),false);
});
test('canonical comparison includes every public field, cover metadata and rich body; bookkeeping and inactive location fields are ignored',()=>{
 const f=content();assert.equal(hasUnpublishedEventChanges(f,{...f}),false);assert.equal(hasUnpublishedEventChanges({...f,version:4,updatedAt:'2030'},f),false);
 const patches={title:'New',type:'lecture',summary:'New',body:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'New'}]}]},organiser:'New',speakers:['New'],featured:true,startAt:'2027-05-01T09:01:00Z',endAt:'2027-05-01T11:00:00Z',timezone:'UTC',scheduleMode:'multi_day',deadline:f.startAt,itinerary:[{at:f.startAt,endAt:null,title:'New',description:''}],location:{...f.location,venue:'New'},registrationUrl:'https://example.org',slug:'new',coverImage:'/media/retained.png',coverAlt:'New'};
 for(const [key,value]of Object.entries(patches))assert.notEqual(eventFingerprint({...f,[key]:value}),eventFingerprint(f),key);
 assert.equal(eventFingerprint({...f,meetingSiteUrl:'https://hidden.example',location:{...f.location,platform:'Hidden'}}),eventFingerprint(f));
 assert.notEqual(eventDraftFingerprint({...f,meetingSiteUrl:'https://hidden.example'}),eventDraftFingerprint(f));
 assert.equal(eventFingerprint({...f,startAt:'2027-05-01T10:00:00+01:00'}),eventFingerprint(f));
 assert.equal(eventFingerprint({...f,body:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Text'}]}]}}),eventFingerprint({...f,body:'Text'}));
 assert.notEqual(eventFingerprint({...f,type:'meeting',meetingSiteUrl:'https://example.org/one'}),eventFingerprint({...f,type:'meeting',meetingSiteUrl:'https://example.org/two'}));
 assert.equal(hasUnpublishedEventChanges(f,null),false);
});
test('publication projection excludes inapplicable fields while keeping working copies intact',()=>{
 const f=fields({meetingSiteUrl:'https://hidden.example',location:{type:'online',venue:'Hidden',address:'Hidden',city:'Hidden',country:'Hidden',platform:'Meet'}}),p=publishedEventFields(f);
 assert.equal(p.location.venue,'');assert.equal(p.meetingSiteUrl,'');assert.equal(f.location.venue,'Hidden');
});

test('public schedules spanning daylight saving show both offsets and cross-date itinerary ends',()=>{
 const value={...content(),timezone:'America/New_York',scheduleMode:'multi_day',startAt:'2026-10-31T14:00:00Z',endAt:'2026-11-02T16:00:00Z',itinerary:[{at:'2026-10-31T22:00:00Z',endAt:'2026-11-01T08:00:00Z',title:'Overnight',description:''}]};
 assert.match(eventScheduleZoneLabel(value.timezone,value.startAt,value.endAt),/UTC-04:00.*UTC-05:00/);assert.equal(toPublicEvent(value).schedule.itinerary[0].end_date,'2026-11-01');
});
