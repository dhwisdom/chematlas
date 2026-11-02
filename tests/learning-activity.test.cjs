const {test}=require('node:test'),assert=require('node:assert/strict');
const {completedRuns,history,streak}=require('../learning-activity.js');
function run(id,at,mode='lesson',eligible=false,moduleId='measurement'){
  return [{id,type:'start',moduleId,at,mode,eligible,questionIds:['q1','q2','q3']},...['q1','q2','q3'].map((questionId,i)=>({id:id+'a'+i,type:'answer',run:id,moduleId,at:at+10+i,questionId,choice:i,correct:false})),{id:id+'finish',type:'finish',run:id,moduleId,at:at+100}];
}
test('no assessment completion is inferred from legacy history, navigation or partial sets',()=>{
  assert.deepEqual(completedRuns([]),[]);const events=run('one',1000);events.splice(2,1);assert.deepEqual(completedRuns(events),[]);
  const legacy=[{id:'old',at:new Date().toISOString(),label:'General Chemistry lesson completed',value:'[]'}],copy=JSON.stringify(legacy);
  assert.equal(history([],legacy)[0].verified,false);assert.equal(streak([]).count,0);assert.equal(JSON.stringify(legacy),copy);
});
test('completed first pass counts despite mistakes; replay, duplicate finish and sync order are idempotent',()=>{
  const events=run('one',1000),duplicate={...events.at(-1),id:'second-finish',at:1200};
  const rows=completedRuns([...events,...events,duplicate].reverse(),2000);
  assert.equal(rows.length,1);assert.equal(rows[0].id,'assessment:one');assert.equal(rows[0].kind,'lesson');
  assert.equal(rows[0].at,new Date(1100).toISOString());
});
test('review and repeated practice remain distinct from first completion',()=>{
  const events=[...run('one',1000),...run('two',2000,'review',true),...run('three',3000,'review',false),...run('four',4000)];
  assert.deepEqual(completedRuns(events,5000).map(e=>e.kind),['lesson','review','practice','practice']);
});
test('empty question sets, cross-module answers, future and prematurely finished runs do not qualify',()=>{
  const events=run('one',1000);events[1].moduleId='another';assert.equal(completedRuns(events,2000).length,0);
  assert.equal(completedRuns(run('future',5000),2000).length,0);
  const empty=run('empty',1000);empty[0].questionIds=[];assert.equal(completedRuns(empty,2000).length,0);
  const early=run('early',1000);early.at(-1).at=1005;assert.equal(completedRuns(early,2000).length,0);
});
test('streak uses consecutive local dates, accepts yesterday, and never counts twice in one day',()=>{
  const now=Date.parse('2026-11-02T18:00:00Z'),tz='America/Chicago';
  const yesterday=Date.parse('2026-11-01T18:00:00Z'),before=Date.parse('2026-10-31T18:00:00Z');
  const events=[...run('yesterday',yesterday),...run('before',before,'review',true),...run('same-day',yesterday+10000,'review',false)];
  assert.deepEqual(streak(events,now,tz),{count:2,activeDays:2,timeZone:tz});
  assert.equal(streak(events,now+86400000,tz).count,0);
  assert.equal(streak([...events,...run('today',now-1000)],now,tz).count,3);
});
test('DST and midnight follow calendar boundaries rather than elapsed 24-hour blocks',()=>{
  const tz='America/Chicago',now=Date.parse('2026-11-02T06:30:00Z');
  const events=[...run('saturday',Date.parse('2026-11-01T04:30:00Z')),...run('sunday',Date.parse('2026-11-02T05:30:00Z'),'review',true)];
  assert.equal(streak(events,now,tz).count,2);
  assert.equal(streak(run('before-midnight',Date.parse('2026-11-02T05:59:00Z')),now,tz).count,1);
});
