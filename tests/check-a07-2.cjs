/* eslint-disable @typescript-eslint/no-require-imports -- Guarded local browser regression. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {randomUUID,randomBytes}=require('node:crypto'),{chromium}=require('playwright'),{Pool}=require('pg');
const [base,fixtureFile,output,axeFile]=process.argv.slice(2),database=new URL(process.env.DATABASE_URL||'');
assert.equal(database.hostname,'127.0.0.1');assert.equal(database.pathname,'/nosee_admin01_test');assert.equal(new URL(base).hostname,'127.0.0.1');
assert.ok(fs.realpathSync(fixtureFile).startsWith('/tmp/'));assert.equal(fs.statSync(fixtureFile).mode&0o077,0);assert.ok(path.resolve(output).startsWith('/tmp/'));
const fixtures=JSON.parse(fs.readFileSync(fixtureFile)),secrets=new Set(Object.values(fixtures).map(p=>p.password));
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1}),axe=fs.readFileSync(axeFile,'utf8');
const report={scans:[],checks:[],errors:[]};fs.mkdirSync(output,{recursive:true});
async function scan(page,label){
 await page.evaluate(axe);const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
 assert.deepEqual(violations,[],label);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' overflow');report.scans.push(label);
}
async function toggleFields(page,ids,values){
 let submissions=0;const observe=request=>{if(request.method()==='POST')submissions++;};page.on('request',observe);
 try{for(let index=0;index<ids.length;index++){
  const field=page.locator('#'+ids[index]),button=field.locator('..').getByRole('button');
  assert.equal(await field.getAttribute('type'),'password');assert.equal(await button.getAttribute('type'),'button');assert.equal(await button.getAttribute('aria-label'),'Show password');
  await field.fill(values[index]);await field.focus();await field.evaluate(node=>node.setSelectionRange(2,6,'forward'));
  const attributes=await field.evaluate(node=>['autocomplete','required','minlength','maxlength','name','aria-describedby'].map(key=>node.getAttribute(key)));
  const before=submissions;await button.click();await page.waitForFunction(id=>document.getElementById(id).type==='text',ids[index]);
  assert.ok((await field.inputValue())===values[index],'Toggle preserves entered value');
  assert.ok(await field.evaluate(node=>document.activeElement===node&&node.selectionStart===2&&node.selectionEnd===6),'Pointer toggle preserves focus and selection');
  assert.deepEqual(await field.evaluate(node=>['autocomplete','required','minlength','maxlength','name','aria-describedby'].map(key=>node.getAttribute(key))),attributes);
  assert.equal(await button.getAttribute('aria-label'),'Hide password');assert.equal(await button.getAttribute('aria-controls'),ids[index]);
  const paint=await button.locator('svg').evaluate(svg=>({own:getComputedStyle(svg).color,parent:getComputedStyle(svg.parentElement).color,paths:[...svg.querySelectorAll('path')].map(p=>getComputedStyle(p).fill)}));
  assert.equal(paint.own,paint.parent);assert.ok(paint.paths.every(color=>color==='none'||color===paint.parent));
  const rect=await button.boundingBox();assert.ok(rect.width>=44&&rect.height>=44);assert.ok(await field.evaluate(node=>parseFloat(getComputedStyle(node).paddingRight)>=44));
  for(const other of ids.filter(id=>id!==ids[index]))assert.equal(await page.locator('#'+other).getAttribute('type'),'password');
  await button.focus();await page.keyboard.press('Enter');await page.waitForFunction(id=>document.getElementById(id).type==='password',ids[index]);
  assert.ok(await button.evaluate(node=>document.activeElement===node),'Keyboard focus remains on the toggle');
  await page.keyboard.press('Space');await page.waitForFunction(id=>document.getElementById(id).type==='text',ids[index]);
  await page.keyboard.press('Space');await page.waitForFunction(id=>document.getElementById(id).type==='password',ids[index]);
  assert.equal(submissions,before,'Visibility buttons must never submit');assert.ok((await field.inputValue())===values[index],'Keyboard toggles preserve entered value');
 }}finally{page.off('request',observe);}
}
async function signIn(page,person){await pool.query('truncate admin_login_attempt,admin_rate_limit');await page.goto(base+'/admin/sign-in');await page.getByLabel('Email',{exact:true}).fill(person.email);await page.getByLabel('Password',{exact:true}).fill(person.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL(base+'/admin');}
async function general(page,width){if(width===390)await page.getByRole('button',{name:'Open navigation'}).click();await page.getByRole('link',{name:'General',exact:true}).filter({visible:true}).click();await page.waitForURL(base+'/admin/settings/general');}
async function saveDraft(page){const response=page.waitForResponse(r=>r.request().method()==='PATCH'&&r.url().includes('/api/admin/news/'));await page.getByRole('button',{name:'Save as draft',exact:true}).click();assert.equal((await response).status(),200);await page.waitForLoadState('networkidle');}
async function directory(page,title,badge){await page.getByRole('link',{name:'All news',exact:true}).click();await page.waitForURL(base+'/admin/publishing/news');const row=page.locator('li').filter({has:page.getByRole('link',{name:title,exact:true})});await row.waitFor();assert.equal(await row.getByText('Unpublished changes',{exact:true}).count(),badge?1:0);return row;}
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:940},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(base+'/admin/sign-in');await page.getByLabel('Email',{exact:true}).fill(fixtures.editor.email);
  await toggleFields(page,['admin-password'],[fixtures.editor.password]);await scan(page,'sign-in-'+width);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL(base+'/admin');await general(page,width);
  const nextPassword=randomBytes(24).toString('base64url');secrets.add(nextPassword);
  await toggleFields(page,['current-password','new-password','confirm-password'],[fixtures.editor.password,nextPassword,nextPassword]);await scan(page,'password-change-'+width);
  const change=page.waitForResponse(r=>r.url().endsWith('/api/admin/auth/change-password'));
  await page.getByRole('button',{name:'Update password',exact:true}).click();assert.equal((await change).status(),200);fixtures.editor.password=nextPassword;
  await page.getByText('Password updated. Other sessions have been signed out.',{exact:true}).waitFor();
  await page.locator('#current-password').locator('..').getByRole('button').click();
  if(width===390)await page.getByRole('button',{name:'Open navigation'}).click();await page.getByRole('link',{name:'Publishing',exact:true}).filter({visible:true}).click();await page.waitForURL(base+'/admin/publishing/news');await general(page,width);
  for(const id of ['current-password','new-password','confirm-password'])assert.equal(await page.locator('#'+id).getAttribute('type'),'password');
  const fresh=await browser.newContext(),login=await fresh.newPage();await signIn(login,fixtures.editor);await fresh.close();
  report.checks.push('password-independence-keyboard-selection-no-submit-change-and-revisit-'+width);

  const {manageAdministrator}=await import('../src/lib/admin/management.ts');const messages=[];
  const manager=(await pool.query('select access_version from administrator where id=$1',[fixtures.super_admin.id])).rows[0];
  const invitation={email:randomUUID()+'@example.invalid',password:randomBytes(24).toString('base64url')};secrets.add(invitation.password);
  await manageAdministrator({...fixtures.super_admin,accessVersion:manager.access_version},{action:'invite',firstName:'Synthetic',lastName:'Visibility',email:invitation.email,role:'editor'},{send:async mail=>{messages.push(mail);return{status:'accepted',messageId:'synthetic-'+randomUUID()};}});
  invitation.code=messages[0].text.split('Your invitation code\n')[1].split('\n')[0];secrets.add(invitation.code);
  const activation=await browser.newContext({viewport:{width,height:940},reducedMotion:'reduce'}),setup=await activation.newPage();await setup.goto(base+'/admin/accept-invitation');
  await toggleFields(setup,['accept-code','accept-password','accept-confirmation'],[invitation.code,invitation.password,invitation.password]);await scan(setup,'activation-'+width);
  const accepted=setup.waitForResponse(r=>r.url().endsWith('/api/admin/accept-invitation'));
  await setup.getByRole('button',{name:'Set up account',exact:true}).click();assert.equal((await accepted).status(),200);
  await signIn(setup,invitation);await activation.close();report.checks.push('activation-code-password-and-confirmation-'+width);

  const title='Revision badge '+width+' '+randomUUID(),original={title,category:'research-news',excerpt:'Synthetic revision summary',body:'Public original marker',publicationDate:'2026-01-01T00:00:00.000Z',publicationTimezone:'Africa/Lagos',featured:false};
  const created=await page.request.post(base+'/api/admin/news',{headers:{origin:base},data:{fields:original,mode:'publish',requestId:randomUUID(),confirm:true}});assert.equal(created.status(),200);const {id}=await created.json();
  const article=(await (await page.request.get(base+'/api/admin/news/'+id)).json());
  await page.goto(base+'/admin/publishing/news/'+id);await page.getByRole('textbox',{name:'Article body'}).fill('Private revision marker');await saveDraft(page);
  let row=await directory(page,title,true);await scan(page,'news-revision-badge-'+width);assert.ok(!(await page.content()).includes('Private revision marker'));
  const published=await page.request.get(base+'/news/'+article.slug);assert.ok((await published.text()).includes('Public original marker'));
  await row.getByRole('link',{name:title,exact:true}).click();await page.getByRole('textbox',{name:'Article body'}).fill(original.body);await saveDraft(page);row=await directory(page,title,false);
  await row.getByRole('link',{name:title,exact:true}).click();await page.getByRole('textbox',{name:'Article body'}).fill('Republished revision marker');await saveDraft(page);row=await directory(page,title,true);
  await row.getByRole('button',{name:'Unpublish',exact:true}).click();await page.getByRole('dialog',{name:'Unpublish?'}).getByRole('button',{name:'Confirm',exact:true}).click();await page.waitForLoadState('networkidle');
  await row.getByText('Unpublished',{exact:true}).waitFor();assert.equal(await row.getByText('Unpublished changes',{exact:true}).count(),0);
  await row.getByRole('button',{name:'Publish',exact:true}).click();await page.getByRole('dialog',{name:'Publish?'}).getByRole('button',{name:'Confirm',exact:true}).click();await page.waitForLoadState('networkidle');
  await row.getByText('Published',{exact:true}).waitFor();assert.equal(await row.getByText('Unpublished changes',{exact:true}).count(),0);
  report.checks.push('revision-save-revert-unpublish-republish-and-live-isolation-'+width);await context.close();
 }
 assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();await pool.end();}
})().catch(error=>{let message=String(error.stack||error);for(const value of secrets)if(value)message=message.replaceAll(value,'[redacted]');console.error(message.slice(0,1900));process.exitCode=1;});
