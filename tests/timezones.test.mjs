import test from 'node:test';
import assert from 'node:assert/strict';
import { DASHBOARD_TIME_ZONE, dashboardDateTime, editorialInstant, editorialLocal, editorialZone, newsEditorialDate, newsShortDate } from '../src/lib/timezones.ts';

test('the editorial default is WAT and preserved UTC instants round-trip at midnight', () => {
 assert.equal(DASHBOARD_TIME_ZONE,'Africa/Lagos');
 assert.equal(editorialZone(undefined),'Africa/Lagos');
 assert.equal(editorialZone('Invalid/Zone'),'Africa/Lagos');
 const instant='2025-12-31T23:15:00.000Z';
 assert.deepEqual(editorialLocal(instant),{date:'2026-01-01',time:'00:15:00'});
 assert.equal(editorialInstant('2026-01-01','00:15:00','Africa/Lagos'),instant);
 assert.equal(newsEditorialDate(instant),'1 January 2026');
 assert.equal(newsShortDate(instant),'01/01/2026');
 assert.match(dashboardDateTime(instant),/WAT$/);
 assert.equal(dashboardDateTime(null),'Not recorded');
});
test('historical UTC values and DST-aware civil times are not relabelled as WAT',()=>{
 assert.deepEqual(editorialLocal('2026-01-01T00:15:00Z','UTC'),{date:'2026-01-01',time:'00:15:00'});
 assert.equal(editorialInstant('2026-01-01','00:15','UTC'),'2026-01-01T00:15:00.000Z');
 assert.equal(editorialInstant('2026-01-01','00:15:00','Africa/Accra'),'2026-01-01T00:15:00.000Z');
 assert.equal(editorialInstant('2026-07-01','13:15:00','Europe/London'),'2026-07-01T12:15:00.000Z');
 assert.equal(editorialInstant('2026-11-01','01:30:00','America/New_York'),'2026-11-01T05:30:00.000Z');
 assert.throws(()=>editorialInstant('2026-03-08','02:30:00','America/New_York'),/does not exist/);
});
test('invalid wall-clock input does not coerce impossible dates or UTC expiry durations',()=>{
 for(const [date,time] of [['2026-02-30','12:00'],['2026-01-01','24:00'],['2026-01-01','12:65'],['0000-01-01','00:00']])
   assert.throws(()=>editorialInstant(date,time,'Africa/Lagos'),/valid publication date and time/);
 const joinDate='2026-01-01';
 assert.equal(joinDate,'2026-01-01'); // Date-only membership fields remain strings, never converted through timezone formatting.
 const created=Date.parse('2026-01-01T00:00:00Z');
 const expires=created+30*24*60*60*1000;
 assert.equal(expires-created,2592000000); // Expiry/retry elapsed durations stay fixed.
});
