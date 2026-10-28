import assert from 'node:assert/strict';
const base=process.argv[2];assert.equal(new URL(base).hostname,'127.0.0.1');
const response=await fetch(base),html=await response.text();assert.equal(response.status,200);
for(const hook of['data-home-hero','data-monitoring-dashboard-section','data-research-outputs-section','data-upcoming-events-section'])assert.ok(html.includes(hook));
assert.doesNotMatch(html,/<article[^>]*data-research-output-card\b/);assert.doesNotMatch(html,/DATABASE_URL|ECONNREFUSED|pg-protocol/);
console.log('Unavailable database: homepage remains 200, publication fixtures stay absent, unrelated sections remain readable.');
