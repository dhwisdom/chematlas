'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {start}=require('../scripts/dev.cjs');
test('mock server serves chemistry, blocks private files, and simulates paid services',async t=>{
 const server=await start('mock',0);t.after(()=>server.close());const origin='http://127.0.0.1:'+server.address().port;
 const page=await fetch(origin+'/genchem/measurement');assert.equal(page.status,200);assert.match(await page.text(),/Content-Security-Policy/);
 for(const file of ['/.env.local','/supabase/config.toml','/scripts/backend.cjs','/.local/accounts.json','/node_modules/pg/package.json'])assert.equal((await fetch(origin+file)).status,404,file);
 const tutor=await fetch(origin+'/api/tutor',{method:'POST',body:'{}'});assert.equal((await tutor.json()).model,'mock');
 assert.equal((await fetch(origin+'/api/review-reminders',{method:'POST'})).status,503);
 const config=await(await fetch(origin+'/data/platform-config.js')).text();assert(!config.includes('sb_publishable_CQn'));
 assert(!fs.existsSync('dist/supabase'));assert(!fs.existsSync('dist/.local'));assert(!fs.existsSync('dist/api'));
});
test('full frontend boot uses synthetic sign-in and never loads a production backend',async t=>{
 const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
 const server=await start('mock',0);t.after(()=>server.close());const origin='http://127.0.0.1:'+server.address().port;
 const errors=[],requests=[];
 class LocalResources extends ResourceLoader{fetch(url,options){requests.push(url);if(new URL(url).origin!==origin)return null;return super.fetch(url,options);}}
 const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message);});
 const dom=await JSDOM.fromURL(origin+'/companion',{resources:new LocalResources(),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole,beforeParse(w){w.fetch=(url,opt)=>fetch(new URL(typeof url==='string'?url:url.url,origin),opt);w.Response=Response;/* jsdom has no Canvas renderer; this smoke test checks bootstrap and service routing. */w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({canvas:this,measureText:()=>({width:0}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(target,key)=>target[key]||(()=>{})});};w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};}});
 t.after(()=>dom.window.close());
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 await new Promise(resolve=>setTimeout(resolve,100));
 assert.equal(dom.window.CHEMATLAS_CONFIG.mode,'mock');assert(dom.window.ChemAtlasMock);assert.equal(errors.length,0,errors.join('\n'));
 const client=await dom.window.ChemAtlasCloud();assert.ifError((await client.auth.signInWithPassword({email:'learner-a@example.invalid'})).error);
 await new Promise(resolve=>setTimeout(resolve,100));
 assert(dom.window.document.querySelector('#caCompanionView'));assert(dom.window.document.body.textContent.includes('Synthetic data'));
 assert(!requests.some(url=>new URL(url).hostname.endsWith('.supabase.co')));
});
