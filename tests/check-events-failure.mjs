import assert from 'node:assert/strict';
const base=process.argv[2];assert.equal(new URL(base).hostname,'127.0.0.1');
const response=await fetch(base),html=await response.text();assert.equal(response.status,200);
for(const hook of['data-home-hero','data-monitoring-dashboard-section','data-research-outputs-section','data-upcoming-events-section'])assert.ok(html.includes(hook));
assert.ok(!html.includes('data-event-card'));assert.doesNotMatch(html,/DATABASE_URL|ECONNREFUSED|pg-protocol/);console.log('Database failure: homepage remains 200, unrelated sections render, no fixture fallback or private error output.');
