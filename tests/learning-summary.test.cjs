'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const assessment = require('../assessment.js');
const course = require('../data/genchem.js');
const { buildSummary, stateKeys } = require('../lib/learning-summary.cjs');
const handler = require('../api/learning-summary.js');
const config = require('../data/platform-config.js');
const now = Date.parse('2026-10-03T21:00:00Z'), DAY = assessment.DAY;
const row = (key, value, at = now) => ({state_key:key, state_value:value, updated_at:new Date(at).toISOString()});
function run(id, at, mode = 'lesson', wrong = false) {
  const moduleId = 'measurement';
  return [
    {id, at, type:'start', moduleId, mode, eligible:mode==='review', questionIds:['a','b','c']},
    ...['a','b','c'].map((questionId,i)=>({id:id+questionId, at:at+i+1, type:'answer', moduleId, run:id, questionId, correct:!(wrong && i===0)})),
    {id:id+'finish', at:at+10, type:'finish', moduleId, run:id}
  ];
}
test('empty and legacy progress are explicit, without invented completion dates or mastery', () => {
  const empty = buildSummary([], [], now);
  assert.equal(empty.counts.totalLessons,19); assert.equal(empty.hasSyncedProgress,false);
  assert.equal(empty.nextStep.type,'lesson'); assert.equal(empty.warnings.length,1);
  const legacy = buildSummary([row(stateKeys[1],['measurement'],now-8*DAY)],[],now);
  assert.equal(legacy.counts.completed,1); assert.equal(legacy.counts.completedInPeriod,0);
  assert.equal(legacy.counts.mastered,0); assert.equal(legacy.lessons[0].completedAt,null);
  assert.equal(legacy.nextStep.url,'https://www.chemwaypoint.com/genchem/measurement?review=1');
  assert.equal(legacy.warnings.length,1);
});
test('summary matches the live mastery rule including due dates and a later mistake', () => {
  const events = [...run('initial',now-12*DAY), ...run('r1',now-10*DAY,'review'), ...run('r2',now-7*DAY-20,'review')];
  for (const list of [events,[...events,...run('r3',now-2*DAY,'review',true)]]) {
    const summary = buildSummary([row(stateKeys[0],list)],[],now);
    const state = assessment.summarize('measurement',list,[],now), lesson=summary.lessons[0];
    assert.equal(lesson.mastered,state.mastered); assert.equal(lesson.status,state.label);
    assert.equal(lesson.reviewDue,state.due); assert.equal(lesson.spacedReviewWins,state.reviewWins);
    assert.equal(lesson.reviewDueAt,new Date(state.dueAt).toISOString());
    assert.equal(summary.counts.completedInPeriod,0);
  }
});
test('first completion counts once; a review or future event is not a new completion', () => {
  const events=[...run('first',now-2*DAY), ...run('review',now-DAY,'review'), ...run('future',now+DAY)];
  const summary=buildSummary([row(stateKeys[0],events)],[],now);
  assert.equal(summary.counts.completedInPeriod,1);
  assert.equal(summary.lessons[0].completedAt,new Date(now-2*DAY+10).toISOString());
  assert.equal(summary.counts.mastered,0);
});
test('published lessons match frontend validation and are included in course order', () => {
  const edited={...course.modules[0],title:'Edited measurement'};
  const extra={...course.modules[0],id:'new-lesson',number:999};
  const summary=buildSummary([], [{key:'module:measurement',payload:edited},{key:'module:new-lesson',payload:extra},{key:'module:bad',payload:{id:'bad'}}],now);
  assert.equal(summary.counts.totalLessons,20); assert.equal(summary.lessons[0].title,edited.title);
  assert(summary.lessons.some(m=>m.id==='new-lesson'));
});
const token='a'.repeat(64), userId='11111111-1111-4111-8111-111111111111';
async function request(t, {method='GET', authorization='Bearer '+token, query={}, env={}, fetcher}={}) {
  for (const [k,v] of Object.entries({CHEMWAYPOINT_AUTOMATION_TOKEN:token,CHEMWAYPOINT_AUTOMATION_USER_ID:userId,SUPABASE_SECRET_KEY:'sb_secret_test',...env})) {
    const previous=process.env[k]; process.env[k]=v;
    t.after(()=>previous===undefined?delete process.env[k]:process.env[k]=previous);
  }
  const calls=[], logs=[];
  t.mock.method(console,'error',(...args)=>logs.push(args));
  t.mock.method(globalThis,'fetch',async (...args)=>{calls.push(args);return fetcher?fetcher(...args):{ok:true,json:async()=>[]};});
  const res={headers:{},code:200,setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
  await handler({method,headers:{authorization},query},res);
  return {res,calls,logs};
}
test('missing or wrong tokens are rejected before any database access',async t=>{
  for(const authorization of [undefined,'Bearer wrong','Basic '+token]) await t.test(String(authorization),async t=>{
    const {res,calls}=await request(t,{authorization:authorization??''});assert.equal(res.code,401);assert.equal(calls.length,0);
  });
});
test('query parameters cannot change account scope',async t=>{
  const {res,calls}=await request(t,{query:{user_id:'someone-else'}});assert.equal(res.code,400);assert.equal(calls.length,0);
});
test('unconfigured credentials fail closed',async t=>{
  for(const env of [{CHEMWAYPOINT_AUTOMATION_TOKEN:''},{CHEMWAYPOINT_AUTOMATION_USER_ID:'bad'},{SUPABASE_SECRET_KEY:''}]) await t.test(Object.keys(env)[0],async t=>{
    const {res,calls}=await request(t,{env});assert.equal(res.code,503);assert.equal(calls.length,0);
  });
});
test('only GET is allowed and all responses disable caching',async t=>{
  const {res,calls}=await request(t,{method:'POST'});assert.equal(res.code,405);assert.equal(res.headers.Allow,'GET');
  assert.match(res.headers['Cache-Control'],/no-store/);assert.equal(calls.length,0);
});
test('successful request reads only the configured account and two progress keys',async t=>{
  const {res,calls}=await request(t,{fetcher:async url=>({ok:true,json:async()=>url.pathname.endsWith('learner_state')?[row(stateKeys[1],['measurement'])]:[]})});
  assert.equal(res.code,200); assert.equal(res.body.counts.completed,1);assert.equal(calls.length,2);
  const [url,options]=calls.find(([url])=>url.pathname.endsWith('learner_state'));
  assert.equal(url.searchParams.get('user_id'),'eq.'+userId);
  assert.equal(url.searchParams.get('state_key'),'in.('+stateKeys.join(',')+')');
  assert.equal(options.headers.apikey,'sb_secret_test'); assert.equal(options.redirect,'error');
  const [contentUrl,contentOptions]=calls.find(([url])=>url.pathname.endsWith('site_published'));
  assert.equal(contentUrl.searchParams.get('key'),'like.module:*');
  assert.equal(contentOptions.headers.apikey,config.supabasePublishableKey);
  const serialized=JSON.stringify(res.body); assert(!serialized.includes(userId));assert(!serialized.includes('sb_secret'));
  assert.equal(res.headers['CDN-Cache-Control'],'no-store');
});
test('public published-content reads do not use the secret credential rejected upstream',async t=>{
  const {res}=await request(t,{fetcher:async (url,options)=>({
    ok:!url.pathname.endsWith('site_published')||options.headers.apikey===config.supabasePublishableKey,
    status:401,json:async()=>[]
  })});
  assert.equal(res.code,200);
});
test('failure logs identify the upstream operation without leaking errors or credentials',async t=>{
  const {res,logs}=await request(t,{fetcher:async url=>({ok:!url.pathname.endsWith('site_published'),status:401,json:async()=>[]})});
  assert.equal(res.code,502);
  assert.deepEqual(logs,[['[learning-summary] failed',{stage:'site_published',upstreamStatus:401}]]);
});
test('upstream errors and malformed data are not reported as zero progress or leaked',async t=>{
  for(const fetcher of [async()=>({ok:false}),async()=>({ok:true,json:async()=>({private:'data'})}),async()=>{throw new Error('sensitive error');}]) await t.test('failure',async t=>{
    const {res}=await request(t,{fetcher});assert.equal(res.code,502);assert.deepEqual(Object.keys(res.body),['error']);assert(!JSON.stringify(res.body).includes('sensitive'));
  });
});
