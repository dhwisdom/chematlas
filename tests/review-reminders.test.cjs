'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/review-reminders.js');
const unsubscribe = require('../api/reminder-unsubscribe.js');
const {renderReminder} = require('../lib/reminder-service.cjs');
const {stateKeys} = require('../lib/learning-summary.cjs');
const token = 'a'.repeat(64), userId = '11111111-1111-4111-8111-111111111111',
  unsubscribeToken = '22222222-2222-4222-8222-222222222222', deliveryId = '33333333-3333-4333-8333-333333333333';

async function invoke(t,{target=handler,method='POST',body={},query={},authorization='Bearer '+token,route,env={}}={}) {
  for (const [key,value] of Object.entries({CHEMWAYPOINT_AUTOMATION_TOKEN:token,SUPABASE_SECRET_KEY:'sb_secret_test',...env})) {
    const old=process.env[key];process.env[key]=value;t.after(()=>old===undefined?delete process.env[key]:process.env[key]=old);
  }
  const calls=[];
  t.mock.method(console,'error',()=>{});
  t.mock.method(globalThis,'fetch',async (url,options)=>{
    calls.push({url,options});
    const result=route?await route(url,options):[];
    return {ok:true,status:200,json:async()=>result};
  });
  const res={code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;},send(body){this.body=body;return this;}};
  await target({method,body,query,headers:{authorization}},res);
  return {res,calls};
}
function dueRoute(url) {
  if(url.pathname.endsWith('notification_preferences')) return [{user_id:userId,unsubscribe_token:unsubscribeToken}];
  if(url.pathname.endsWith('learner_state')) return [{state_key:stateKeys[1],state_value:['measurement'],updated_at:new Date().toISOString()}];
  if(url.pathname.startsWith('/auth/v1/admin/users/')) return {id:userId,email:'verified@example.invalid',email_confirmed_at:'2026-10-01T00:00:00Z'};
  if(url.pathname.endsWith('claim_review_reminder')) return [{delivery_id:deliveryId,unsubscribe_token:unsubscribeToken}];
  return [];
}
test('automation authorization, method and caller scope fail closed before reads',async t=>{
  for(const options of [{authorization:''},{authorization:'Bearer wrong'},{authorization:['bad']},{method:'DELETE'},{query:{user_id:userId}},{body:{to:'someone@example.invalid'}},{body:{action:'bad'}},{body:{action:'acknowledge',deliveryId:'bad',status:'sent'}},{env:{SUPABASE_SECRET_KEY:''}}]) {
    await t.test(JSON.stringify(options),async t=>{const {res,calls}=await invoke(t,options);assert(res.code>=400);assert.equal(calls.length,0);assert.match(res.headers['Cache-Control'],/no-store/);});
  }
});
test('empty opt-in list does not load other account data',async t=>{
  const {res,calls}=await invoke(t);assert.equal(res.code,200);assert.deepEqual(res.body.reminders,[]);assert.equal(calls.length,1);
  assert.equal(calls[0].url.searchParams.get('review_reminders'),'eq.true');
});
test('preview is read-only and personalizes verified recipients from saved progress',async t=>{
  const {res,calls}=await invoke(t,{method:'GET',route:dueRoute});
  assert.equal(res.body.preview,true);assert.equal(res.body.reminders[0].deliveryId,null);
  assert.equal(res.body.reminders[0].to,'verified@example.invalid');assert.match(res.body.reminders[0].email.html,/Measurement/);
  assert(calls.every(c=>c.options.method==='GET'));
  const progress=calls.find(c=>c.url.pathname.endsWith('learner_state'));assert.equal(progress.url.searchParams.get('user_id'),'eq.'+userId);
  const published=calls.find(c=>c.url.pathname.endsWith('site_published'));assert.notEqual(published.options.headers.apikey,'sb_secret_test');
});
test('prepare claims before returning and skips a competing claim',async t=>{
  const {res,calls}=await invoke(t,{route:dueRoute});assert.equal(res.body.reminders[0].deliveryId,deliveryId);
  assert(calls.some(c=>c.url.pathname.endsWith('claim_review_reminder')&&JSON.parse(c.options.body).p_user_id===userId));
  await t.test('another invocation already claimed',async t=>{
    const {res}=await invoke(t,{route:url=>url.pathname.endsWith('claim_review_reminder')?[]:dueRoute(url)});assert.equal(res.body.reminders.length,0);assert.equal(res.body.skipped,1);
  });
});
test('no due reviews and unverified accounts never create a delivery',async t=>{
  for(const change of ['no-progress','unverified','banned','anonymous']) await t.test(change,async t=>{
    const {res,calls}=await invoke(t,{route:url=>{
      if(change==='no-progress'&&url.pathname.endsWith('learner_state'))return [];
      const data=dueRoute(url);
      if(url.pathname.startsWith('/auth/'))return {...data,...(change==='unverified'?{email_confirmed_at:null}:change==='banned'?{banned_until:'2099-01-01T00:00:00Z'}:{is_anonymous:true})};
      return data;
    }});
    assert.equal(res.body.reminders.length,0);assert(!calls.some(c=>c.url.pathname.endsWith('claim_review_reminder')));
  });
});
test('one account failure does not discard other prepared deliveries',async t=>{
  const other='44444444-4444-4444-8444-444444444444';
  const {res}=await invoke(t,{route:(url,options)=>{
    if(url.pathname.endsWith('notification_preferences')&&options.method==='GET')return [{user_id:userId,unsubscribe_token:unsubscribeToken},{user_id:other,unsubscribe_token:unsubscribeToken}];
    if(options.method==='GET' && url.searchParams.get('user_id')==='eq.'+other)throw new Error('Private upstream details');
    return dueRoute(url);
  }});
  assert.equal(res.code,200);assert.equal(res.body.reminders.length,1);assert.equal(res.body.errors,1);assert(!JSON.stringify(res.body).includes('Private upstream details'));
});
test('acknowledgement records only an existing delivery and has no recipient override',async t=>{
  const {res,calls}=await invoke(t,{body:{action:'acknowledge',deliveryId,status:'sent'},route:()=>[{status:'sent'}]});
  assert.deepEqual(res.body,{acknowledged:true,status:'sent'});assert.equal(calls.length,1);
  assert.deepEqual(JSON.parse(calls[0].options.body),{p_delivery_id:deliveryId,p_status:'sent'});
});
test('template escapes titles, rejects external links, and includes unsubscribe in both formats',()=>{
  const email=renderReminder({reviewsDue:[{title:'<img src=x onerror=alert(1)>',reviewUrl:'javascript:alert(1)'}],warnings:[]},unsubscribeToken);
  assert(!email.html.includes('<img'));assert(!email.html.includes('javascript:'));assert.match(email.html,/&lt;img/);
  assert.match(email.html,/reminder-unsubscribe\?token=/);assert.match(email.text,/Turn off reminders:/);
});
test('unsubscribe GET confirms without changes; POST updates only the token owner',async t=>{
  const get=await invoke(t,{target:unsubscribe,method:'GET',query:{token:unsubscribeToken}});
  assert.equal(get.calls.length,0);assert.match(get.res.body,/method="post"/);assert.equal(get.res.headers['Referrer-Policy'],'no-referrer');
  const post=await invoke(t,{target:unsubscribe,query:{token:unsubscribeToken},route:()=>[{review_reminders:false}]});
  assert.equal(post.res.code,200);assert.match(post.res.body,/are turned off/);assert.equal(post.calls[0].url.searchParams.get('unsubscribe_token'),'eq.'+unsubscribeToken);
  assert.deepEqual(JSON.parse(post.calls[0].options.body),{review_reminders:false});
});
test('invalid or expired unsubscribe links do not expose account data',async t=>{
  const invalid=await invoke(t,{target:unsubscribe,query:{token:'bad'}});assert.equal(invalid.res.code,400);assert.equal(invalid.calls.length,0);
  const expired=await invoke(t,{target:unsubscribe,query:{token:unsubscribeToken}});assert.equal(expired.res.code,400);assert.match(expired.res.body,/expired/);
});
