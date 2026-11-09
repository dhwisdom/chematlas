'use strict';
// CI/laptop acceptance: real disposable local services, never hosted Supabase.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {develop}=require('../scripts/local-dev.cjs');
const {runtime}=require('../scripts/backend.cjs'),{createClient}=require('@supabase/supabase-js');

async function check(){
 const server=await develop();
 try{
  const response=await fetch('http://127.0.0.1:3000');
  assert.equal(response.status,200);
  assert.match(await response.text(),/ChemWaypoint/);
  const config=await(await fetch('http://127.0.0.1:3000/data/platform-config.js')).text();
  const generated=config.match(/^globalThis\.CHEMATLAS_BUILD_CONFIG=(.*);/);
  assert(generated,'The frontend must contain explicit generated configuration.');
  const published=JSON.parse(generated[1]);
  assert.equal(published.mode,'local');
  assert.equal(published.supabaseUrl,runtime().SUPABASE_URL);
 }finally{await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
}

(async()=>{
 await check();
 const fixtures=JSON.parse(fs.readFileSync('.local/accounts.json','utf8'));
 const r=runtime(),client=createClient(r.SUPABASE_URL,r.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const login=await client.auth.signInWithPassword({email:'learner-a@example.invalid',password:fixtures.password});
 assert.ifError(login.error);
 try{
  await check();
  assert(JSON.stringify(JSON.parse(fs.readFileSync('.local/accounts.json','utf8')))===JSON.stringify(fixtures),'Restart must preserve fixture IDs and passwords.');
  const refreshed=await client.auth.refreshSession({refresh_token:login.data.session.refresh_token});
  assert.ifError(refreshed.error);
 }finally{await client.auth.signOut();}
 console.log('PASS: combined local startup and backend reuse; frontend served, fixture credentials and learner session preserved.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
