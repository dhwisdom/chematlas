const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),{webcrypto}=require('node:crypto');
const source=fs.readFileSync(require.resolve('../supabase/functions/chemwaypoint-site-companion/index.js'),'utf8');
function setup(saved=[]){let handler,calls=[];const fetch=async(url,opt={})=>{calls.push({url,opt});if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify(opt.headers.authorization==='Bearer valid-a'?{id:'account-a',email_confirmed_at:'2026-01-01'}:{error:'bad token'}),{status:opt.headers.authorization==='Bearer valid-a'?200:401});if(url.includes('site_published'))return new Response('[]');if(url.includes('learner_state'))return new Response('[]');if(url.includes('companion_practice_sessions')&&opt.method==='POST')return new Response(null,{status:201});if(url.includes('companion_practice_sessions'))return new Response(JSON.stringify(url.includes('select=result')?saved:[]));throw Error('Unexpected request');};const c={URL,Request,Response,Headers,fetch,crypto:webcrypto,AbortSignal,structuredClone,TextEncoder,Date,JSON,Deno:{env:{get:k=>({SUPABASE_URL:'http://127.0.0.1:54321',SUPABASE_SERVICE_ROLE_KEY:'server-key',APP_ENV:'local',APP_ORIGIN:'http://127.0.0.1:3000'})[k]},serve:fn=>handler=fn}};vm.runInNewContext(source,c);return {calls,request:async(action,args={},auth='Bearer valid-a',origin='http://127.0.0.1:3000')=>handler(new Request('https://db.test/functions/v1/companion',{method:'POST',headers:{authorization:auth,origin},body:JSON.stringify({action,args})})),handler};}
test('site companion rejects missing/invalid session and untrusted origins',async()=>{const s=setup();assert.equal((await s.request('get_learning_progress',{},'')).status,401);assert.equal((await s.request('get_learning_progress',{},'Bearer invalid')).status,401);assert.equal((await s.request('get_learning_progress',{},'Bearer valid-a','https://evil.test')).status,403);});
test('progress queries bind to the authenticated user and ignore supplied account IDs',async()=>{const s=setup(),r=await s.request('get_learning_progress',{user_id:'victim',email:'victim@example.test'});assert.equal(r.status,200);assert(s.calls.some(c=>c.url.includes('learner_state?user_id=eq.account-a')));assert(!s.calls.some(c=>c.url.includes('victim')));assert.equal(r.headers.get('Access-Control-Allow-Origin'),'http://127.0.0.1:3000');});
test('practice uses canonical checks and never returns answer keys',async()=>{const s=setup(),r=await s.request('create_practice_set',{module_id:'measurement'}),d=await r.json();assert.equal(r.status,200);assert.equal(d.questions.length,5);assert(d.questions.every(q=>!('answer' in q)&&!('explanation' in q)));const write=s.calls.find(c=>c.opt.method==='POST');const row=JSON.parse(write.opt.body);assert.equal(row.user_id,'account-a');assert(row.questions.every(q=>Number.isInteger(q.answer)));});
test('a practice session belonging to another user is not submitted',async()=>{const s=setup(),r=await s.request('submit_practice_set',{session_id:'00000000-0000-4000-8000-000000000000',choices:[0,1,0]});assert.equal(r.status,404);assert(!s.calls.some(c=>c.url.includes('/rpc/')));assert(s.calls.some(c=>c.url.includes('user_id=eq.account-a')));});
test('allowed site preflights succeed without a learner token',async()=>{const s=setup();const r=await s.handler(new Request('https://db.test/functions/v1/companion',{method:'OPTIONS',headers:{origin:'http://127.0.0.1:3000'}}));assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),'http://127.0.0.1:3000');assert.equal(s.calls.length,0);});
test('review-preview preflight is denied without CORS reflection or downstream auth/data requests',async()=>{
 const s=setup();
 for(const origin of ['https://chematlas-qwhf9cquo-thetruedaltino-3388.vercel.app','https://another.vercel.app','https://www.chemwaypoint.com.evil.test']){
  const r=await s.handler(new Request('https://db.test/functions/v1/companion',{method:'OPTIONS',headers:{origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,apikey,content-type'}}));
  assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
 }
 assert.equal(s.calls.length,0);
});
test('allowed-origin auth errors retain exact CORS headers so clients can distinguish an expired session',async()=>{
 const s=setup(),r=await s.request('create_practice_set',{},'Bearer expired');assert.equal(r.status,401);assert.equal(r.headers.get('Access-Control-Allow-Origin'),'http://127.0.0.1:3000');assert.equal(r.headers.get('Vary'),'Origin');
});

test('last saved result is authenticated, account scoped, completed-only and read only',async()=>{
 const result={moduleId:'measurement',correct:2,total:3,details:[{question:'Synthetic question',explanation:'Synthetic explanation'}]};
 const s=setup([{result}]);const response=await s.request('get_last_practice_result',{user_id:'victim',session_id:'foreign'});
 assert.equal(response.status,200);assert.equal((await response.json()).result.details[0].explanation,'Synthetic explanation');
 const reads=s.calls.filter(c=>c.url.includes('companion_practice_sessions'));assert.equal(reads.length,1);
 const url=new URL(reads[0].url);assert.equal(url.searchParams.get('user_id'),'eq.account-a');assert.equal(url.searchParams.get('submitted_at'),'not.is.null');assert.equal(url.searchParams.get('result'),'not.is.null');assert.equal(url.searchParams.get('select'),'result');assert.equal(url.searchParams.get('order'),'submitted_at.desc,id.desc');assert.equal(url.searchParams.get('limit'),'1');
 assert(!s.calls.some(c=>c.url.includes('victim')||c.url.includes('foreign')||c.opt.method==='POST'));
 const denied=setup([{result}]);assert.equal((await denied.request('get_last_practice_result',{},'Bearer invalid')).status,401);assert.equal(denied.calls.length,1);
});
test('last saved result returns an explicit empty state',async()=>{
 const response=await setup().request('get_last_practice_result');assert.equal(response.status,200);assert.deepEqual(await response.json(),{result:null});
});
