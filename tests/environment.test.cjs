'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {config,localUrl}=require('../lib/environment.cjs');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync('data/platform-config.js','utf8');
test('missing settings use mocks; preview builds refuse every real mode',()=>{
  assert.equal(config({}).mode,'mock');
  for(const mode of ['local','test','production'])assert.throws(()=>config({APP_ENV:mode,VERCEL_ENV:'preview'}));
  for(const mode of ['mock','local','test'])assert.throws(()=>config({APP_ENV:mode,SUPABASE_URL:'https://zslxoqvqxdqwykzdogor.supabase.co'}));
  assert.throws(()=>config({APP_ENV:'production'}));
  assert.throws(()=>config({APP_ENV:'unknown'}));
});
test('local destinations reject credentials tricks, lookalike hosts, remote databases and redirects',()=>{
  for(const url of ['https://127.0.0.1','http://localhost.evil.test','http://127.0.0.1@production.supabase.co','postgres://db.production.test/postgres','http://127.0.0.1?redirect=remote'])assert.throws(()=>localUrl(url));
  assert.equal(localUrl('postgres://postgres:local-only@127.0.0.1:54322/postgres').hostname,'127.0.0.1');
  assert.throws(()=>config({APP_ENV:'local'}));
});
function browser(cfg,host='https://review.vercel.app'){
 const d=new JSDOM('<body></body>',{url:host,runScripts:'outside-only'});d.window.fetch=async()=>{throw Error('Unexpected real fetch');};d.window.CHEMATLAS_BUILD_CONFIG=cfg;return d;
}
test('browser refuses injected production config on a preview host before initializing the client',()=>{
 const dom=browser({mode:'production',canonicalHost:'www.chemwaypoint.com',supabaseUrl:'https://zslxoqvqxdqwykzdogor.supabase.co'});
 assert.throws(()=>dom.window.eval(source),/forbidden/);dom.window.close();
});
test('mock fetch blocks production; synthetic account data remains within the adapter',async()=>{
 const dom=browser();dom.window.Response=Response;dom.window.eval(source);dom.window.eval(fs.readFileSync('dev-mocks.js','utf8'));
 await assert.rejects(dom.window.fetch('https://zslxoqvqxdqwykzdogor.supabase.co/rest/v1/learner_state'),/disabled/);
 const client=dom.window.ChemAtlasMock.client;
 const signed=await client.auth.signInWithPassword({email:'learner-a@example.invalid'});assert(signed.data.session);
 await client.from('learner_state').insert({user_id:signed.data.session.user.id,state_key:'test',state_value:['synthetic']});
 await client.auth.signInWithPassword({email:'learner-b@example.invalid'});
 assert.equal((await client.from('learner_state').select()).data.length,0);
 const bad=await client.auth.signInWithPassword({email:'real-person@example.org'});assert(bad.error);
 dom.window.close();
});
test('default test transport refuses paid endpoints even if an API key is injected',async()=>{
 process.env.OPENAI_API_KEY='not-a-real-key';
 await assert.rejects(fetch('https://api.openai.com/v1/responses'),/guard/);
 const handler=require('../api/tutor.js');let result;
 await handler({method:'POST',body:{question:'Explain units'}},{setHeader(){},status(){return this;},json(v){result=v;}});
 assert.equal(result.model,'mock');delete process.env.OPENAI_API_KEY;
});
test('production public output requires both explicit production switches and valid public settings',()=>{
 const c=config({APP_ENV:'production',VERCEL_ENV:'production',SUPABASE_URL:'https://zslxoqvqxdqwykzdogor.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_placeholder'});
 assert.equal(c.mode,'production');assert(!('SUPABASE_SECRET_KEY' in c));
});
test('local public configuration rejects privileged keys instead of serializing them',()=>{
 const env={APP_ENV:'local',SUPABASE_URL:'http://127.0.0.1:54321'};
 for(const key of ['sb_secret_placeholder','service_role', 'header.'+Buffer.from('{"role":"service_role"}').toString('base64url')+'.signature'])assert.throws(()=>config({...env,SUPABASE_PUBLISHABLE_KEY:key}),/publishable/);
 assert.equal(config({...env,SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic'}).mode,'local');
});
