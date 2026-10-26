/* eslint-disable @typescript-eslint/no-require-imports -- Guarded local production-browser regression. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { chromium } = require('playwright');
const { Pool } = require('pg');
const [base, fixtureFile, output, axeFile] = process.argv.slice(2);
const database = new URL(process.env.DATABASE_URL || '');
assert.equal(database.hostname, '127.0.0.1');
assert.equal(database.pathname, '/nosee_admin01_test');
assert.equal(new URL(base).hostname, '127.0.0.1');
assert.ok(fs.realpathSync(fixtureFile).startsWith('/tmp/'));
assert.equal(fs.statSync(fixtureFile).mode & 0o077, 0);
assert.ok(path.resolve(output).startsWith('/tmp/'));
const fixtures = JSON.parse(fs.readFileSync(fixtureFile));
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const report = { scans: [], checks: [], errors: [] };
const axe = fs.readFileSync(axeFile, 'utf8');
fs.mkdirSync(output,{recursive:true});
async function scan(page, name) {
  await page.evaluate(axe);
  const violations = await page.evaluate(async () => (await axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
  assert.deepEqual(violations, [], name);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow');
  report.scans.push(name);
}
async function editor(page) {
  await page.goto(base+'/admin/publishing/news');
  await page.getByRole('link',{name:'Add article',exact:true}).click();
  await page.locator('#news-body[contenteditable=true]').waitFor();
}
const leave = page => page.getByRole('dialog',{name:'Save your changes?'});
async function fill(page,title) {
  await page.locator('#news-title').fill(title);
  await page.locator('#news-excerpt').fill('Synthetic exit-flow summary.');
  await page.getByRole('textbox',{name:'Article body'}).fill('Synthetic exit-flow body.');
  await page.locator('#news-date').fill('2026-01-01');
  await page.locator('#news-time').fill('00:15:00');
}
async function allNews(page) { await page.getByRole('link',{name:'All news',exact:true}).click();await leave(page).waitFor(); }
async function toast(page,level,title) {
  await page.evaluate(({level,title})=>window.dispatchEvent(new CustomEvent('nosee:admin-toast',{detail:{id:Math.random(),level,title}})),{level,title});
}
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  for(const width of [390,1440]) {
   const context=await browser.newContext({viewport:{width,height:940},timezoneId:'America/New_York',reducedMotion:'reduce'});
   const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
   await pool.query('truncate admin_login_attempt,admin_rate_limit');
   await page.goto(base+'/admin/sign-in');
   await page.getByLabel('Email',{exact:true}).fill(fixtures.editor.email);
   await page.getByLabel('Password',{exact:true}).fill(fixtures.editor.password);
   await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL(base+'/admin');
   await editor(page);
   const date=await page.locator('#news-date').inputValue(),time=await page.locator('#news-time').inputValue();
   assert.equal(await page.locator('#news-time-zone').inputValue(),'Africa/Lagos');
   const captured=Date.parse(date+'T'+time+'+01:00');assert.ok(Math.abs(Date.now()-captured)<60000);
   const originalHistory=await page.evaluate(()=>history.length);
   await page.locator('#news-title').fill('Temporary');await page.locator('#news-title').fill('');
   await page.locator('#news-title').fill('Unsaved again');
   assert.equal(await page.evaluate(()=>history.length),originalHistory);
   assert.equal(await page.locator('#news-date').inputValue(),date);assert.equal(await page.locator('#news-time').inputValue(),time);
   const unload=page.waitForEvent('dialog');const reload=page.reload({timeout:2500}).catch(()=>null);
   const nativeWarning=await unload;assert.equal(nativeWarning.type(),'beforeunload');await nativeWarning.dismiss();await reload;
   assert.equal(await page.locator('#news-title').inputValue(),'Unsaved again');
   const back=page.goBack({timeout:2500}).catch(()=>null);await leave(page).waitFor();
   await leave(page).getByRole('button',{name:'Keep editing'}).click();await back;
   assert.equal(await page.locator('#news-title').inputValue(),'Unsaved again');
   const discardBack=page.goBack({timeout:2500}).catch(()=>null);await leave(page).waitFor();
   await leave(page).getByRole('button',{name:'Discard changes'}).click();await page.waitForURL(base+'/admin/publishing/news');await discardBack;
   report.checks.push('history-edit-undo-edit-keep-discard-'+width);
   await editor(page);await page.goBack();await page.waitForURL(base+'/admin/publishing/news');assert.equal(await leave(page).count(),0);
   report.checks.push('pristine-history-'+width);

   await editor(page);const historyTitle='History save '+width+' '+randomUUID();await page.locator('#news-title').fill(historyTitle);
   const saveBack=page.goBack({timeout:2500}).catch(()=>null);await leave(page).waitFor();
   await leave(page).getByRole('button',{name:'Save as draft',exact:true}).click();await page.waitForURL(base+'/admin/publishing/news');await saveBack;
   assert.equal((await pool.query('select status from news_article where title=$1',[historyTitle])).rows[0].status,'draft');
   report.checks.push('history-save-before-leaving-'+width);

   await editor(page);await page.locator('#news-title').fill('Sidebar unsaved edit');
   if(width===390)await page.getByRole('button',{name:'Open navigation',exact:true}).click();
   await page.getByRole('link',{name:'General',exact:true}).filter({visible:true}).click();await leave(page).waitFor();
   await leave(page).getByRole('button',{name:'Keep editing'}).click();
   if(width===390)await page.keyboard.press('Escape');
   assert.equal(await page.locator('#news-title').inputValue(),'Sidebar unsaved edit');
   if(width===390)await page.getByRole('button',{name:'Open navigation',exact:true}).click();
   await page.getByRole('link',{name:'General',exact:true}).filter({visible:true}).click();await leave(page).waitFor();
   await leave(page).getByRole('button',{name:'Discard changes'}).click();await page.waitForURL(base+'/admin/settings/general');
   if(width===390)assert.equal(await page.getByRole('dialog').count(),0);
   report.checks.push('sidebar-confirmation-and-menu-close-'+width);

   await editor(page);const title='Exit regression '+width+' '+randomUUID();await fill(page,title);
   await allNews(page);await scan(page,'exit-dialog-'+width);
   await page.keyboard.press('Escape');assert.equal(await leave(page).count(),0);
   await allNews(page);
   await page.route('**/api/admin/news',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Synthetic save unavailable. Your changes remain here.'})}));
   await leave(page).getByRole('button',{name:'Save as draft',exact:true}).click();
   await leave(page).getByRole('alert').getByText('Synthetic save unavailable.',{exact:false}).waitFor();
   assert.equal(new URL(page.url()).pathname,'/admin/publishing/news/new');
   assert.equal((await pool.query('select count(*)::int n from news_article where title=$1',[title])).rows[0].n,0);
   await scan(page,'failed-exit-save-'+width);
   await leave(page).getByRole('button',{name:'Keep editing'}).click();assert.equal(await page.locator('#news-title').inputValue(),title);
   await page.unroute('**/api/admin/news');await allNews(page);
   await leave(page).getByRole('button',{name:'Save as draft',exact:true}).click();await page.waitForURL(base+'/admin/publishing/news');
   const row=(await pool.query('select * from news_article where title=$1',[title])).rows[0];assert.equal(row.status,'draft');
   assert.equal(row.publication_date.toISOString(),'2025-12-31T23:15:00.000Z');
   await page.goto(base+'/admin/publishing/news/'+row.id);
   await page.locator('#news-title').fill('Discarded private edit');await allNews(page);
   await leave(page).getByRole('button',{name:'Discard changes'}).click();await page.waitForURL(base+'/admin/publishing/news');
   assert.equal((await pool.query('select title from news_article where id=$1',[row.id])).rows[0].title,title);
   report.checks.push('failed-save-recovery-and-existing-discard-'+width);

   await page.goto(base+'/admin/publishing/news/'+row.id);await page.locator('#news-title').fill(title+' direct revision');
   const published=page.waitForResponse(r=>r.request().method()==='PATCH'&&r.url().endsWith('/api/admin/news/'+row.id));
   await page.getByRole('button',{name:'Publish',exact:true}).click();assert.equal((await published).status(),200);
   await page.waitForLoadState('networkidle');
   assert.equal(await page.getByText('Unpublished changes',{exact:true}).count(),0);
   const publicPage=await context.newPage();await publicPage.goto(base+'/news/'+row.slug);
   await publicPage.getByRole('heading',{name:title+' direct revision',exact:true}).waitFor();
   await publicPage.getByText('1 January 2026',{exact:true}).waitFor();
   await publicPage.screenshot({path:path.join(output,'article-'+width+'.png'),fullPage:true});
   await publicPage.goto(base+'/news');await publicPage.screenshot({path:path.join(output,'listing-'+width+'.png'),fullPage:true});await publicPage.close();
   const noScript=await browser.newContext({javaScriptEnabled:false,viewport:{width,height:940}}),plain=await noScript.newPage();
   assert.equal((await plain.goto(base+'/news/'+row.slug)).status(),200);
   await plain.getByText('Synthetic exit-flow body.',{exact:true}).waitFor();
   assert.equal((await plain.goto(base+'/news/does-not-exist')).status(),404);
   await plain.getByRole('heading',{name:'Page not found',exact:true}).waitFor();await noScript.close();
   report.checks.push('server-rendered-article-and-404-'+width);
   report.checks.push('existing-record-save-and-editorial-midnight-'+width);

   // Use the existing private event API to exercise all variants without adding a product test route.
   await page.goto(base+'/admin/settings/general');await page.clock.install();
   const region=page.getByRole('region',{name:'Notifications'});
   for(const level of ['success','error','info','warning']) {
    const label='Synthetic '+level;await toast(page,level,label);await toast(page,level,label);
    await region.getByText(label,{exact:true}).waitFor();
    assert.equal(await region.getByText(label,{exact:true}).count(),1);
    assert.equal(await region.locator('[role="'+(level==='error'?'alert':'status')+'"]').count(),1);
    await scan(page,'toast-'+level+'-'+width);
    await region.getByRole('button',{name:'Dismiss notification'}).click();
   }
   await toast(page,'success','Persists across navigation');
   await region.getByText('Persists across navigation',{exact:true}).waitFor();
   await page.getByRole('link',{name:'NOSEE Admin',exact:true}).click();await page.waitForURL(base+'/admin');
   assert.equal(await region.getByText('Persists across navigation',{exact:true}).count(),1);
   await region.getByRole('button',{name:'Dismiss notification'}).focus();await page.clock.fastForward(15000);
   assert.equal(await region.getByText('Persists across navigation',{exact:true}).count(),1);
   await page.locator('a[href="/admin"]').first().focus();await page.mouse.move(0,0);await page.clock.fastForward(7001);
   await region.getByText('Persists across navigation',{exact:true}).waitFor({state:'hidden'});
   assert.equal(await region.getByText('Persists across navigation',{exact:true}).count(),0);
   report.checks.push('toast-variants-dedup-focus-pause-navigation-'+width);
   await context.close();
  }
  assert.deepEqual(report.errors,[]);fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 } finally {await browser.close();await pool.end();}
})().catch(error=>{console.error(String(error.stack||error).slice(0,1900));process.exitCode=1;});
