import assert from 'node:assert/strict';
const base=process.argv[2];assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
for(const path of['/','/about']){const r=await fetch(base+path),html=await r.text();assert.equal(r.status,200);assert.ok(!/password|ECONNREFUSED|postgresql:|PRIVATE MEMBER NOTES/.test(html));assert.ok(html.includes('temporarily unavailable'));assert.ok(!html.includes('Leadership profile 01'));if(path==='/'){assert.ok(html.includes('data-monitoring-dashboard-section'));assert.ok(!html.includes('International Colloquim'));}else{assert.ok(html.includes('Our Mission'));assert.ok(html.includes('Our Story'));}}
console.log('Database unavailable: homepage/About stay 200, unrelated sections remain readable, and no hero/profile fixtures return.');
