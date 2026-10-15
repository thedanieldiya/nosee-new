/* eslint-disable @typescript-eslint/no-require-imports -- Explicit source/target public flow comparison. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const{chromium}=require('playwright'),sharp=createRequire(path.resolve(__dirname,'../package.json'))('sharp');
const[source,target,output]=process.argv.slice(2);for(const base of[source,target])assert.equal(new URL(base).hostname,'127.0.0.1');assert.ok(path.resolve(output).startsWith('/tmp/'));fs.mkdirSync(output,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),report=[];try{
 for(const width of[390,768,1440])for(const route of['/join','/privacy']){
  const captures=[];let prefix;
  for(const[index,base]of[source,target].entries()){
   const c=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),p=await c.newPage();await p.goto(base+route,{waitUntil:'networkidle'});await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
   if(route==='/privacy'){const back=p.locator('main a[href="/join"]');if(index===0){const top=Math.floor((await p.locator('article').boundingBox()).y),last=await p.locator('article > p').nth(2).boundingBox();prefix={top,height:Math.floor(last.y+last.height)-top};}else assert.equal(await back.count(),0);}
   const file=path.join(output,`${route.slice(1)}-${width}-${index}.png`);await p.screenshot({path:file,fullPage:true});captures.push(file);await c.close();
  }
  const pixels=await Promise.all(captures.map(file=>{let image=sharp(file);if(prefix)image=image.extract({left:0,top:prefix.top,width,height:prefix.height});return image.removeAlpha().raw().toBuffer({resolveWithObject:true});}));assert.deepEqual(pixels[0].info,pixels[1].info);assert.ok(pixels[0].data.equals(pixels[1].data),`${route}/${width} unexpected changed pixels`);report.push({route,width,comparison:route==='/join'?'full page':'unchanged policy article',changedPixels:0,approvedDifference:route==='/privacy'?'return-to-membership link removed; subsequent footer position may change':'native privacy dialog enhancement'});
 }
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2));console.log(`${report.length} membership route pairs: unchanged regions match; approved privacy return link removed.`);
}finally{await browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
