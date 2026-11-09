'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {start}=require('../scripts/dev.cjs');
test('mock server serves chemistry, blocks private files, and simulates paid services',async t=>{
 const messages=[];
 const server=await start('mock',0,{log:message=>messages.push(message)});t.after(()=>server.close());const origin='http://127.0.0.1:'+server.address().port;
 assert(messages.some(line=>line.includes('[###] 3/3')));
 assert(messages.some(line=>line.includes('READY (mock mode): '+origin)));
 assert(!messages.some(line=>line.includes('[browser]')),'Do not claim a browser visit before one occurs.');
 const page=await fetch(origin+'/genchem/measurement?token=synthetic-secret');assert.equal(page.status,200);assert.match(await page.text(),/Content-Security-Policy/);
 assert(messages.includes('[browser] Page sent (HTTP 200).'));
 for(const file of ['/.env.local','/supabase/config.toml','/scripts/backend.cjs','/.local/accounts.json','/node_modules/pg/package.json'])assert.equal((await fetch(origin+file)).status,404,file);
 const tutor=await fetch(origin+'/api/tutor',{method:'POST',body:'{}'});assert.equal((await tutor.json()).model,'mock');
 assert.equal((await fetch(origin+'/api/review-reminders',{method:'POST'})).status,503);
 const config=await(await fetch(origin+'/data/platform-config.js')).text();assert(!config.includes('sb_publishable_CQn'));
 assert(!fs.existsSync('dist/supabase'));assert(!fs.existsSync('dist/.local'));assert(!fs.existsSync('dist/api'));
 assert(messages.includes('[request] HTTP 404'));
 assert(messages.includes('[request] HTTP 503'));
 assert(!messages.join('\n').includes('synthetic-secret'),'Query values must not enter development logs.');
});
test('occupied development port fails with guidance and never reports ready',async t=>{
 const server=await start('mock',0,{log:()=>{}});t.after(()=>server.close());
 const messages=[];
 await assert.rejects(start('mock',server.address().port,{log:message=>messages.push(message)}),/already in use.*Ctrl\+C/);
 assert(!messages.some(line=>line.includes('READY')||line.includes('[###]')));
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

const {develop}=require('../scripts/local-dev.cjs');
test('combined startup waits for the backend before exposing a working frontend',async t=>{
 let release,frontendStarted=false;
 const ready=new Promise(resolve=>{release=resolve;}),messages=[];
 const pending=develop({backend:()=>ready,frontend:()=>{
   frontendStarted=true;return start('mock',0,{log:()=>{}});
 },log:message=>messages.push(message)});
 assert.equal(frontendStarted,false);
 assert(!messages.some(message=>message.includes('[backend] Ready.')));
 release();
 const server=await pending;t.after(()=>server.close());
 assert.equal(frontendStarted,true);
 const response=await fetch('http://127.0.0.1:'+server.address().port);
 assert.equal(response.status,200);
 assert.match(await response.text(),/ChemWaypoint/);
});

test('combined startup fails closed when the backend fails',async()=>{
 let frontendStarted=false;
 await assert.rejects(develop({backend:async()=>{throw Error('Backend unavailable.');},frontend:()=>{frontendStarted=true;},log:()=>{}}),/Backend unavailable.*Frontend was not started/);
 assert.equal(frontendStarted,false);
});

test('combined command retains the real backend production guard',()=>{
 const {spawnSync}=require('node:child_process'),path=require('node:path');
 const result=spawnSync(process.execPath,[path.resolve(__dirname,'../scripts/local-dev.cjs')],{
  env:{...process.env,APP_ENV:'production'},encoding:'utf8',timeout:10000
 });
 assert.equal(result.status,1);
 assert.match(result.stderr,/Local commands cannot run in production mode/);
 assert.match(result.stderr,/Frontend was not started/);
 assert(!result.stdout.includes('READY'));
});
