/* eslint-disable @typescript-eslint/no-require-imports -- Explicit source/target public flow comparison. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const{chromium}=require('playwright'),sharp=createRequire(path.resolve(__dirname,'../package.json'))('sharp');
const[source,target,output]=process.argv.slice(2);for(const base of[source,target])assert.equal(new URL(base).hostname,'127.0.0.1');assert.ok(path.resolve(output).startsWith('/tmp/'));fs.mkdirSync(output,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),report=[];try{
 for(const width of[390,768,1440])for(const route of['/join','/privacy']){
  const captures=[];
  for(const[index,base]of[source,target].entries()){
   const c=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),p=await c.newPage();await p.goto(base+route,{waitUntil:'networkidle'});await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
   const file=path.join(output,`${route.slice(1)}-${width}-${index}.png`);await p.screenshot({path:file,fullPage:true});
   if(route==='/privacy'){
    assert.equal(await p.locator('main a[href="/join"]').count(),0);
    if(index===1){assert.equal(await p.locator('article [role=note]').count(),0);assert.equal((await p.locator('article').innerText()).includes('Placeholder text'),false);}
    captures.push(await Promise.all([p.locator('article h1'),p.locator('article p').filter({hasText:/^Lorem ipsum/})].map(locator=>locator.screenshot())));
   }else captures.push([fs.readFileSync(file)]);
   await c.close();
  }
  for(let i=0;i<captures[0].length;i++){const pixels=await Promise.all(captures.map(capture=>sharp(capture[i]).removeAlpha().raw().toBuffer({resolveWithObject:true})));assert.deepEqual(pixels[0].info,pixels[1].info);assert.ok(pixels[0].data.equals(pixels[1].data),`${route}/${width} unexpected changed pixels`);}
  report.push({route,width,comparison:route==='/join'?'closed full page':'unchanged title and Lorem ipsum',changedPixels:0,approvedDifference:route==='/privacy'?'visible development callout, placeholder heading and disclaimer removed; footer moves upward':'privacy backdrop dismissal'});
 }
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2));console.log(`${report.length} membership route pairs: unchanged regions match; approved privacy callout removal recorded.`);
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
