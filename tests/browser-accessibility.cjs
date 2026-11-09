// NODE_PATH must provide playwright; CHROMIUM_EXECUTABLE may select system Chromium.
// Run: node --test tests/browser-accessibility.cjs
const {test, before, after}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http'), fs=require('node:fs'), path=require('node:path');
let browser, server, base;
const root=path.resolve(__dirname,'..');
before(async()=>{
  server=await require('../scripts/dev.cjs').start('mock',0,{log:()=>{}});
  base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
});
after(async()=>{await browser?.close();await new Promise(resolve=>server?server.close(resolve):resolve());});
async function setup(t,width=1440){
  const context=await browser.newContext({viewport:{width,height:1000}});
  t.after(()=>context.close());
  await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  t.after(()=>assert.deepEqual(errors,[], 'no application errors'));
  await page.goto(base+'/genchem/measurement');
  await page.locator('.ca-focus-shell').waitFor();
  await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-ca-starting'));
  return page;
}
test('Practice is modal, contains keyboard focus, preserves nested reference and restores opener',async t=>{
  const p=await setup(t);const trigger=p.locator('[data-ca-tutor-practice]');
  await trigger.focus();await p.keyboard.press('Enter');
  await p.locator('#gcPracticeOverlay.open').waitFor();
  assert.equal(await p.evaluate(()=>document.querySelector('#gcPracticeOverlay').matches(':modal')),true);
  assert.equal(await p.evaluate(()=>document.activeElement.classList.contains('gc-practice-close')),true);
  await trigger.evaluate(e=>e.focus());
  assert.equal(await p.evaluate(()=>document.activeElement.closest('#gcPracticeOverlay')!==null),true,'background cannot receive focus');
  const controls=p.locator('#gcPracticeOverlay button:visible, #gcPracticeOverlay input:visible, #gcPracticeOverlay select:visible');
  await controls.last().focus();await p.keyboard.press('Tab');
  assert.equal(await p.evaluate(()=>document.activeElement.closest('#gcPracticeOverlay')!==null),true);
  await controls.first().focus();await p.keyboard.press('Shift+Tab');
  assert.equal(await p.evaluate(()=>document.activeElement.closest('#gcPracticeOverlay')!==null),true);
  await p.locator('#gcPracticeOverlay [data-periodic-open]').click();
  await p.locator('#ptSearch').fill('sodium');await p.keyboard.press('Escape');
  assert.equal(await p.locator('#caPeriodicTable').evaluate(e=>e.open),false);
  assert.equal(await p.locator('#gcPracticeOverlay').evaluate(e=>e.open),true);
  assert.equal(await p.evaluate(()=>document.activeElement.matches('#gcPracticeOverlay [data-periodic-open]')),true);
  await p.keyboard.press('Escape');await p.locator('#gcPracticeOverlay.open').waitFor({state:'hidden'});
  assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);
  // Reopening keeps all seven engines and dismisses through the close button.
  await trigger.click();await p.locator('#gcPracticeOverlay.open').waitFor();
  assert.equal(await p.locator('.gc-tool-tab').count(),7);
  for(const tool of ['lewis','balance','stoich','acid','equilibrium','calorimetry','periodic']){
    await p.locator(`[data-tool="${tool}"]`).click();assert(await p.locator('#gcToolStage').innerText());
  }
  await p.locator('.gc-practice-close').click();assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);
});
test('mobile drawer exposes state, excludes hidden controls, dismisses and survives resizing',async t=>{
  const p=await setup(t,390), menu=p.locator('#mobileMenu'), sidebar=p.locator('.sidebar');
  assert.equal(await menu.getAttribute('aria-expanded'),'false');
  assert.equal(await menu.getAttribute('aria-controls'),await sidebar.getAttribute('id'));
  assert.equal(await sidebar.evaluate(e=>e.inert),true);
  await p.locator('[data-ca-tutor-route="/genchem"]').evaluate(e=>e.focus());
  assert.equal(await p.evaluate(()=>!!document.activeElement.closest('.sidebar')),false);
  await menu.focus();await p.keyboard.press('Enter');
  assert.equal(await menu.getAttribute('aria-expanded'),'true');assert.equal(await sidebar.evaluate(e=>e.inert),false);
  assert.equal(await p.evaluate(()=>!!document.activeElement.closest('.sidebar')),true);
  await p.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');
  assert.equal(await menu.evaluate(e=>e===document.activeElement),true);
  await menu.click();await p.locator('[data-ca-tutor-route="/progress"]').click();
  await p.waitForFunction(()=>location.pathname==='/progress');
  assert.equal(await menu.getAttribute('aria-expanded'),'false');assert.equal(await sidebar.evaluate(e=>e.inert),true);
  await p.setViewportSize({width:1440,height:1000});await p.waitForFunction(()=>!document.querySelector('.sidebar').inert);assert.equal(await sidebar.evaluate(e=>e.inert),false);
  await p.setViewportSize({width:800,height:1000});await menu.waitFor({state:'visible'});await p.waitForFunction(()=>document.querySelector('.sidebar').inert);
  assert.equal(await sidebar.evaluate(e=>e.inert),true);
});
test('module and assessment transitions keep focus and preserve first-answer evidence',async t=>{
  const p=await setup(t);
  await p.locator('[data-module="atoms-moles"]').focus();await p.keyboard.press('Enter');
  await p.waitForFunction(()=>document.activeElement.matches('.gc-module-header h2'));
  await p.locator('[data-module="measurement"]').click();
  await p.locator('.ca-step-jump summary').click();await p.locator('[data-focus-index]').last().click();await p.locator('[data-check-start]').click();
  await p.locator('[data-choice="0"]').focus();await p.keyboard.press('Space');
  await p.locator('#gcCheckAnswer').focus();await p.keyboard.press('Enter');
  assert.equal(await p.evaluate(()=>document.activeElement.id),'gcFeedback');
  assert.equal(await p.locator('[data-choice]:disabled').count(),await p.locator('[data-choice]').count());
  const answers=()=>p.evaluate(()=>window.ChemAtlasAssessment.events().filter(e=>e.type==='answer').length);
  assert.equal(await answers(),1);
  await p.locator('#gcCheckAnswer').evaluate(e=>e.click());assert.equal(await answers(),1);
  await p.locator('[data-check-next]').click();
  assert.equal(await p.evaluate(()=>document.activeElement.matches('.gc-check h3')),true);
  await p.locator('[data-module="atoms-moles"]').click();await p.locator('[data-module="measurement"]').click();
  assert.match(await p.locator('.gc-check').innerText(),/CHECK 2 OF 5/);assert.equal(await answers(),1);
});
test('Learn uses one main, a selected semester group and valued progress indicators',async t=>{
  const p=await setup(t);
  assert.equal(await p.locator('main').count(),1);
  assert.equal(await p.locator('.gc-semester-tabs').getAttribute('role'),'group');
  assert.equal(await p.locator('[data-semester="1"]').getAttribute('aria-pressed'),'true');
  assert.equal(await p.locator('.gc-module-link.active').getAttribute('aria-current'),'page');
  const meter=p.locator('.ca-focus-meter');
  assert.equal(await meter.getAttribute('role'),'progressbar');assert.equal(await meter.getAttribute('aria-valuenow'),'1');
  await p.locator('.ca-focus-next').click();assert.equal(await meter.getAttribute('aria-valuenow'),'2');
  assert.equal(await p.locator('[data-focus-index="1"]').getAttribute('aria-current'),'step');
  await p.locator('[data-semester="2"]').click();
  assert.equal(await p.locator('[data-semester="2"]').getAttribute('aria-pressed'),'true');
  assert.equal(await p.locator('[data-semester="1"]').getAttribute('aria-pressed'),'false');
  await p.waitForFunction(()=>document.querySelector('.ca-course-switcher-copy strong')?.textContent==='General Chemistry II');
});

test('model fits all scientific geometries and retains pointer, keyboard and display controls',async t=>{
  const p=await setup(t);
  await p.addInitScript(()=>{
    const arc=CanvasRenderingContext2D.prototype.arc,clear=CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.id==='moleculeCanvas')window.modelAtoms=[];return clear.apply(this,args);};
    CanvasRenderingContext2D.prototype.arc=function(x,y,r,...args){if(this.canvas.id==='moleculeCanvas')(window.modelAtoms||=[]).push({x,y,r});return arc.call(this,x,y,r,...args);};
  });
  await p.goto(base+'/model-lab');await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-ca-starting'));
  const canvas=p.locator('#moleculeCanvas');
  for(const width of [1440,320]){
   await p.setViewportSize({width,height:1000});
   for(const value of ['ch4','nh3','h2o','co2','bf3','pcl5','sf6']){
    await p.locator('#moleculeSelect').selectOption(value);
    for(const mode of ['stick','sphere']){
      await p.locator(`[data-style="${mode}"]`).click();
      const bounds=await p.evaluate(()=>({atoms:window.modelAtoms,w:document.querySelector('#moleculeCanvas').clientWidth,h:document.querySelector('#moleculeCanvas').clientHeight}));
      assert(bounds.atoms.length>=3,value);
      for(const a of bounds.atoms)assert(a.x-a.r>=0&&a.y-a.r>=0&&a.x+a.r<=bounds.w&&a.y+a.r<=bounds.h,value+' fully visible');
      const extent=Math.max(Math.max(...bounds.atoms.map(a=>a.x+a.r))-Math.min(...bounds.atoms.map(a=>a.x-a.r)),Math.max(...bounds.atoms.map(a=>a.y+a.r))-Math.min(...bounds.atoms.map(a=>a.y-a.r)));
      assert(extent>Math.min(bounds.w,bounds.h)*.45,value+' readable scale');
    }
   }
  }
  await p.setViewportSize({width:1440,height:1000});await canvas.scrollIntoViewIfNeeded();
  const image=()=>canvas.evaluate(e=>e.toDataURL());
  const original=await image();await p.locator('[data-model-control="right"]').focus();await p.keyboard.press('Enter');assert.notEqual(await image(),original);
  const box=await canvas.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(box.x+box.width/2+40,box.y+box.height/2+25);await p.mouse.up();
  const rotated=await image();await p.mouse.wheel(0,-100);await p.waitForTimeout(100);assert.notEqual(await image(),rotated);
  await p.locator('[data-model-control="reset"]').click();assert.equal(await p.locator('#modelViewStatus').innerText(),'Default view');
});

test('Tutor preserves course context, follow-up history and honest success/error status',async t=>{
  const p=await setup(t);let calls=[],fail=false;
  await p.route('**/api/tutor',async route=>{
    calls.push(route.request().postDataJSON());
    await route.fulfill({status:fail?503:200,contentType:'application/json',body:JSON.stringify(fail?{error:'Test service unavailable'}:{answer:'A test explanation with chemistry context.',model:'test-model',webSources:[]})});
  });
  await p.locator('.ca-lesson-goals summary').click();
  await p.locator('.ca-inline-tutor').click();await p.locator('#caTutorV2').waitFor();
  assert.match(await p.locator('#caTutorInput').inputValue(),/Measurement/);
  assert.match(await p.locator('.ca-ai-status').innerText(),/checked on send/);
  await p.locator('#caTutorForm button[type="submit"]').click();
  await p.waitForFunction(()=>document.querySelector('.ca-ai-status')?.textContent.includes('Connected on last request'));
  assert.match(calls[0].context,/Measurement|units|measurement/);assert(calls[0].learner);assert.equal(calls[0].conversation.length,0);
  await p.locator('#caTutorInput').fill('Explain this with another example');
  await p.locator('#caTutorForm button[type="submit"]').click();await p.waitForFunction(()=>document.querySelectorAll('.ca-message.assistant:not(.ca-thinking)').length===2);
  assert.equal(calls[1].conversation.length,2);
  await p.reload();await p.locator('#caTutorV2').waitFor();assert.match(await p.locator('#caChat').innerText(),/test explanation/);
  await p.locator('.ca-tutor-side-v2 summary').click();assert.match(await p.locator('.ca-memory-card').innerText(),/Current module/i);
  fail=true;await p.locator('#caTutorInput').fill('Check the disconnected state');await p.locator('#caTutorForm button[type="submit"]').click();
  await p.waitForFunction(()=>document.querySelector('.ca-ai-status')?.textContent.includes('Connection unavailable'));
  assert.match(await p.locator('#caChat').innerText(),/Test service unavailable/);
  await p.locator('.ca-student-row').click();await p.locator('#caAccountOverlay.open').waitFor();
  assert.match(await p.locator('#caAccountOverlay').innerText(),/account|connect/i);
});

test('Practice engines retain representative chemistry results and accessible result states',async t=>{
  const p=await setup(t);
  await p.locator('[data-ca-tutor-practice]').click();await p.locator('#gcPracticeOverlay.open').waitFor();
  await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  async function audit(){
    const violations=await p.evaluate(async()=>{const r=await axe.run(document.querySelector('#gcPracticeOverlay'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));});
    assert.deepEqual(violations,[]);
  }
  await p.locator('[data-pick="a"]').click();await audit();await p.locator('[data-pick="b"]').click();await audit();
  await p.locator('[data-tool="lewis"]').click();await p.locator('#gcLewisCheck').click();assert.match(await p.locator('#gcLewisFeedback').innerText(),/electron count/);await audit();
  await p.locator('[data-bond="0"]').selectOption('2');await p.locator('[data-bond="1"]').selectOption('2');await p.locator('#gcLewisCheck').click();assert.match(await p.locator('#gcLewisFeedback').innerText(),/Valid contributor/);await audit();
  // Select the first documented randomized fixture without altering app data.
  async function firstProblem(tool){await p.evaluate(tool=>{const random=Math.random;try{Math.random=()=>0;document.querySelector(`[data-tool="${tool}"]`).click();}finally{Math.random=random;}},tool);}
  await firstProblem('balance');await p.locator('#gcBalanceCheck').click();assert.match(await p.locator('#gcBalanceFeedback').innerText(),/Not balanced/);await audit();
  for(const [field,value]of [['r-0','2'],['r-1','1'],['p-0','2']])await p.locator(`[data-coeff="${field}"]`).fill(value);
  await p.locator('#gcBalanceCheck').click();assert.match(await p.locator('#gcBalanceFeedback').innerText(),/Balanced/);await audit();
  await firstProblem('stoich');await p.locator('#gcStoichAnswer').fill('0');await p.locator('#gcStoichCheck').click();await audit();
  await p.locator('#gcStoichAnswer').fill('44.68');await p.locator('#gcStoichCheck').click();assert.match(await p.locator('#gcStoichFeedback').innerText(),/Correct/);await audit();
  await p.locator('[data-tool="acid"]').click();await p.locator('#gcStrongCalc').click();assert.match(await p.locator('#gcStrongResult').innerText(),/2.000/);await p.locator('#gcBufferCalc').click();assert.match(await p.locator('#gcBufferResult').innerText(),/4.459/);await audit();
  await p.locator('[data-tool="equilibrium"]').click();await p.locator('[data-dir="right"]').click();await p.locator('#gcEqSolve').click();assert.match(await p.locator('#gcEqFeedback').innerText(),/prediction was correct/);await audit();
  await p.locator('[data-tool="calorimetry"]').click();await p.locator('#gcTempGuess').fill('28.85');await p.locator('#gcRunCal').click();assert.match(await p.locator('#gcCalFeedback').innerText(),/within 0.6/);await audit();
  assert.match(await p.locator('#gcToolScore').innerText(),/7\/7/);
  // Narrow layouts must remain inside the dialog after each tool is rendered.
  await p.setViewportSize({width:320,height:800});
  for(const tool of ['periodic','lewis','balance','stoich','acid','equilibrium','calorimetry']){
    await p.locator(`[data-tool="${tool}"]`).click();
    assert.equal(await p.locator('#gcPracticeOverlay').evaluate(e=>e.scrollWidth>innerWidth),false,tool+' dialog reflow');
  }
});

test('progress activity is neutral for a fresh guest and navigation creates no completion',async t=>{
  const p=await setup(t);
  await p.locator('[data-module="atoms-moles"]').click();await p.locator('[data-semester="2"]').click();
  await p.goto(base+'/progress');await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-ca-starting'));
  const state=await p.evaluate(()=>({history:JSON.parse(localStorage.getItem('chematlas-practice-history-v1')||'[]'),events:JSON.parse(localStorage.getItem('chematlas-assessment-events-v1')||'[]'),streak:document.querySelector('.streak')?.innerText}));
  if(process.env.NEXT_EVIDENCE){fs.mkdirSync(process.env.NEXT_EVIDENCE,{recursive:true});fs.writeFileSync(path.join(process.env.NEXT_EVIDENCE,'guest-progress.json'),JSON.stringify(state,null,2));await p.screenshot({path:path.join(process.env.NEXT_EVIDENCE,'guest-progress.png'),fullPage:true});}
  assert.equal(state.history.length,0,'navigation must not write completion history');
  assert.equal(state.events.length,0);assert.doesNotMatch(state.streak,/1\s*day streak/);
});

test('real assessment completion projects one activity, survives resume/reload, and never rewrites legacy history',async t=>{
  const p=await setup(t);
  const legacy='[{"id":"legacy","at":"2026-01-01T12:00:00Z","label":"General Chemistry lesson completed","value":"[]"}]';
  await p.evaluate(value=>localStorage.setItem('chematlas-practice-history-v1',value),legacy);
  await p.locator('.ca-step-jump summary').click();await p.locator('[data-focus-index]').last().click();await p.locator('[data-check-start]').click();
  for(let i=0;i<5;i++){
    await p.locator('[data-choice="0"]').click();await p.locator('#gcCheckAnswer').click();await p.locator('[data-check-next]').click();
    if(i===0){await p.locator('[data-module="atoms-moles"]').click();await p.locator('[data-module="measurement"]').click();assert.match(await p.locator('.gc-check').innerText(),/CHECK 2 OF 5/);}
  }
  const evidence=()=>p.evaluate(()=>({runs:window.ChemAtlasActivity.completedRuns(window.ChemAtlasAssessment.events()),events:window.ChemAtlasAssessment.events(),history:localStorage.getItem('chematlas-practice-history-v1'),streak:window.ChemAtlasActivity.streak(window.ChemAtlasAssessment.events()).count}));
  const before=await evidence();assert.equal(before.runs.length,1);assert.equal(before.streak,1);assert.equal(before.history,legacy);
  assert.equal(await p.locator('.streak strong').innerText(),'1');
  await p.reload();await p.locator('.ca-focus-shell').waitFor();await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-ca-starting'));assert.deepEqual(await evidence(),before);
  await p.locator('[data-check-start]').click();
  for(let i=0;i<5;i++){await p.locator('[data-choice="0"]').click();await p.locator('#gcCheckAnswer').click();await p.locator('[data-check-next]').click();}
  const after=await evidence();assert.equal(after.runs.filter(r=>r.kind==='lesson').length,1);assert.equal(after.runs.filter(r=>r.kind==='practice').length,1);assert.equal(after.streak,1);assert.equal(after.history,legacy);
});

async function cloudFixture(p,initial='A'){
  await p.route('**/shared-client.js',route=>route.fulfill({contentType:'text/javascript',body:`(()=>{
    // Route synthetic service responses through the guarded same-origin server.
    window.CHEMATLAS_CONFIG={...window.CHEMATLAS_CONFIG,supabaseUrl:location.origin};
    let session=${initial?JSON.stringify({user:{id:initial,email:initial+'@example.test'}}):'null'};
    const listeners=[],held=[],calls=[];const hold={};
    const state=id=>id==='A'?{'chematlas-genchem-completed-v1':['measurement'],'chematlas-assessment-events-v1':[],'chematlas-practice-history-v1':[{id:'old-A',at:'2026-01-01',label:'private-A history'}]}:{};
    const wait=(kind,id,value)=>hold[kind]===id?new Promise(resolve=>held.push({kind,id,resolve:()=>resolve(value)})):Promise.resolve(value);
    const change=id=>{session=id?{user:{id,email:id+'@example.test'}}:null;for(const fn of listeners)fn(id?'SIGNED_IN':'SIGNED_OUT',session);};
    const cloud={auth:{getSession:async()=>({data:{session}}),refreshSession:async()=>{calls.push({kind:'refreshSession'});return {data:{session}}},onAuthStateChange:fn=>listeners.push(fn),signInWithPassword:async()=>{change('A');return {data:{session}}},signUp:async()=>({data:{session:null}}),signOut:async()=>{change(null);return {}}},
      from(table){let id;const query={select(){return query},eq(k,v){if(k==='user_id')id=v;return query},order(){return query},limit(){return query},in(){return query},
        upsert(rows){const userId=Array.isArray(rows)?rows[0]?.user_id:rows.user_id;calls.push({kind:'write',table,userId,rows});return wait('write',userId,{error:null})},
        then(resolve,reject){const rows=table==='learner_state'?Object.entries(state(id)).map(([state_key,state_value])=>({state_key,state_value})):[];return wait(table==='learner_state'?'read':'other',id,{data:rows,error:null}).then(resolve,reject)}};return query},
      rpc(name,args){const id=session?.user.id;calls.push({kind:'rpc',name,userId:id,args});return name==='merge_assessment_events'?wait('rpc',id,{data:args.p_events,error:null}):Promise.resolve({data:[],error:null})}};
    window.ChemAtlasCloud=async()=>cloud;
    window.__cloudFixture={change,hold,calls,pending:kind=>held.filter(x=>x.kind===kind).length,flush(kind){for(const x of held.filter(x=>x.kind===kind))x.resolve();for(let i=held.length-1;i>=0;i--)if(held[i].kind===kind)held.splice(i,1);delete hold[kind]}};
  })();` }));
  await p.reload();await p.waitForFunction(id=>window.ChemAtlasLearnerState.owner===(id?'account:'+id:'guest'),initial);
  await p.waitForTimeout(100);
}

test('account checkpoints and epoch guards isolate delayed read, write, RPC and Tutor responses',async t=>{
  const p=await setup(t);await cloudFixture(p);
  const owner=id=>p.waitForFunction(id=>window.ChemAtlasLearnerState.owner==='account:'+id,id);
  const change=id=>p.evaluate(id=>window.__cloudFixture.change(id),id);
  await p.waitForFunction(()=>JSON.parse(localStorage.getItem('chematlas-genchem-completed-v1')||'[]').includes('measurement'));
  const runId=await p.evaluate(()=>{const module=window.CHEM_GENCHEM.modules[0],run=window.ChemAtlasAssessment.start(module);window.ChemAtlasAssessment.answer(run,window.ChemAtlasAssessment.questions(module)[0],0);return run.id;});
  await change('B');await owner('B');
  for(const kind of ['read','write','rpc']){
    await p.evaluate(kind=>window.__cloudFixture.hold[kind]='A',kind);await change('A');await owner('A');
    await p.waitForFunction(kind=>window.__cloudFixture.pending(kind)>0,kind);
    await change('B');await owner('B');
    await p.evaluate(kind=>window.__cloudFixture.flush(kind),kind);await p.waitForTimeout(100);
    assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('chematlas-genchem-completed-v1')||'[]')),[]);
    assert.deepEqual(await p.evaluate(()=>window.ChemAtlasAssessment.events()),[]);
    assert.equal(await p.evaluate(()=>localStorage.getItem('chematlas-practice-history-v1')?.includes('private-A')),false);
  }
  await change('A');await owner('A');assert(await p.evaluate(runId=>window.ChemAtlasAssessment.events().some(e=>e.id===runId),runId));await p.locator('[data-ca-tutor-route="/tutor"]').click();
  let release;const reply=new Promise(resolve=>release=resolve);
  await p.route('**/api/tutor',async r=>{await reply;await r.fulfill({contentType:'application/json',body:JSON.stringify({answer:'PRIVATE-A RESPONSE'})});});
  await p.locator('#caTutorInput').fill('private-A question');await p.locator('#caTutorForm button[type="submit"]').click();
  await change('B');await owner('B');release();await p.waitForTimeout(150);
  assert.equal(await p.locator('#caTutorView').evaluate(e=>e.textContent.includes('PRIVATE-A RESPONSE')||e.textContent.includes('private-A question')),false);
  const leaks=await p.evaluate(()=>window.__cloudFixture.calls.filter(c=>c.userId==='B'&&JSON.stringify(c).includes('private-A')));assert.deepEqual(leaks,[]);
  await change('A');await owner('A');assert.match(await p.evaluate(()=>localStorage.getItem('chematlas-practice-history-v1')),/private-A/);
});

test('explicit first guest sign-in can retain guest evidence without claiming it for a second account',async t=>{
  const p=await setup(t);await cloudFixture(p,null);
  await p.evaluate(()=>{localStorage.setItem('chematlas-genchem-completed-v1','["atoms-moles"]');window.dispatchEvent(new Event('chematlas:progress-synced'));});
  await p.locator('.ca-student-row').click();await p.locator('#caEmail').fill('A@example.test');await p.locator('#caPassword').fill('fixture-password');
  await p.locator('#caAuthForm button[type="submit"]').click();await p.waitForFunction(()=>window.ChemAtlasLearnerState.owner==='account:A');
  assert(await p.evaluate(()=>JSON.parse(localStorage.getItem('chematlas-genchem-completed-v1')).includes('atoms-moles')));
  await p.evaluate(()=>window.__cloudFixture.change(null));await p.waitForFunction(()=>window.ChemAtlasLearnerState.owner==='guest');
  await p.evaluate(()=>window.__cloudFixture.change('B'));await p.waitForFunction(()=>window.ChemAtlasLearnerState.owner==='account:B');
  assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('chematlas-genchem-completed-v1')||'[]')),[]);
  assert.equal(await p.evaluate(()=>window.ChemAtlasActivity.streak(window.ChemAtlasAssessment.events()).count),0);
});

test('all 19 Learn modules keep optional jumps, keyboard Previous/Continue and section/review deep links',async t=>{
  const p=await setup(t);await cloudFixture(p);
  const modules=await p.evaluate(()=>window.CHEM_GENCHEM.modules.map(m=>({id:m.id,sections:m.sections.length,answer:m.example.answer})));
  assert.equal(modules.length,19);
  for(const module of modules){
    await p.goto(base+'/genchem/'+module.id);await p.waitForFunction(id=>window.ChemAtlasLearnerState?.owner==='account:A'&&document.querySelector('.gc-module-link.active')?.dataset.module===id,module.id);
    await p.locator('.ca-step-jump').waitFor();
    assert.equal(await p.locator('.ca-step-jump').evaluate(e=>e.open),false);
    assert.equal(await p.locator('.gc-reading').count(),module.sections);
    assert.equal(await p.locator('.gc-example-answer strong').innerText(),module.answer);
    assert.equal(await p.locator('.ca-focus-panel:not([hidden])').count(),1);
    assert.equal(await p.locator('.ca-focus-meter').getAttribute('aria-valuenow'),'1');
    await p.locator('.ca-focus-next').focus();await p.keyboard.press('Enter');
    assert.equal(await p.locator('.ca-focus-meter').getAttribute('aria-valuenow'),'2');
    assert.equal(await p.evaluate(()=>document.activeElement.matches('.ca-focus-panel:not([hidden]) h3')),true);
    await p.locator('.ca-focus-back').focus();await p.keyboard.press('Enter');
    assert.equal(await p.locator('.ca-focus-meter').getAttribute('aria-valuenow'),'1');
    await p.locator('.ca-step-jump summary').focus();await p.keyboard.press('Enter');
    await p.locator('[data-focus-index]').last().click();
    assert.equal(await p.locator('.ca-step-jump').evaluate(e=>e.open),false);
    assert.equal(await p.locator('.gc-check').isVisible(),true);
  }
  await p.goto(base+'/genchem/measurement?section=1');await p.waitForFunction(()=>document.querySelector('.ca-focus-meter')?.getAttribute('aria-valuenow')==='2');
  await p.goto(base+'/genchem/measurement');await p.waitForFunction(()=>document.querySelector('.ca-focus-meter')?.getAttribute('aria-valuenow')==='2');
  await p.goto(base+'/genchem/measurement?review=1');await p.locator('.gc-check').waitFor({state:'visible'});
  await p.goto(base+'/genchem/acid-base?review=1');await p.waitForFunction(()=>window.ChemAtlasLearnerState?.owner==='account:A');await p.locator('.gc-check').waitFor({state:'visible'});
  assert.equal(await p.evaluate(()=>location.pathname+location.search),'/genchem/acidbase?review=1');
  await p.setViewportSize({width:390,height:900});
  await p.locator('.ca-step-jump summary').focus();await p.keyboard.press('Enter');
  await p.locator('[data-focus-index]').first().click();
  await p.locator('.ca-focus-next').focus();await p.keyboard.press('Enter');
  assert.equal(await p.locator('.ca-focus-meter').getAttribute('aria-valuenow'),'2');
  assert.equal(await p.evaluate(()=>window.ChemAtlasAssessment.events().length),0);
});

test('Courses and Organic state truthful availability, route context and accessible tool results',async t=>{
  const p=await setup(t);
  await p.locator('.ca-course-switcher button').click();await p.waitForFunction(()=>location.pathname==='/courses'&&!document.querySelector('[data-ca-tutor-route="/dashboard"].active'));
  assert.doesNotMatch(await p.locator('#coursesView').innerText(),/prototype|scaffolded/i);
  const organic=p.getByRole('heading',{name:'Organic Chemistry I',exact:true}).locator('..');
  assert.match(await organic.locator('.course-availability').innerText(),/4 interactive tools/);
  const future=p.getByRole('heading',{name:'Organic Chemistry II',exact:true}).locator('..');
  assert.match(await future.locator('.course-availability').innerText(),/lessons not yet available/);
  await organic.locator('.open-organic').click();await p.waitForFunction(()=>location.pathname==='/organic');
  await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const tool of ['stereo','newman','chair','mechanism']){
    await p.locator(`.organic-tab[data-organic-tool="${tool}"]`).click();
    assert.equal(await p.locator(`.organic-tab[data-organic-tool="${tool}"]`).getAttribute('aria-pressed'),'true');
    const violations=await p.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));});
    assert.deepEqual(violations,[]);
  }
  await p.locator('.organic-tab[data-organic-tool="stereo"]').click();
  await p.locator('[data-stereo-answer="R"]').click();await p.locator('#checkStereo').click();assert.match(await p.locator('#stereoFeedback').innerText(),/Correct/);
  await p.locator('[data-stereo-answer="S"]').click();await p.locator('#checkStereo').click();assert.match(await p.locator('#stereoFeedback').innerText(),/Not quite/);
  assert.equal(await p.locator('[data-stereo-answer="S"]').getAttribute('aria-pressed'),'true');
});

async function fiveEvidence(p,name,data){
  if(!process.env.FIVE_EVIDENCE)return;
  fs.mkdirSync(process.env.FIVE_EVIDENCE,{recursive:true});
  fs.writeFileSync(path.join(process.env.FIVE_EVIDENCE,name+'.json'),JSON.stringify(data,null,2));
  await p.screenshot({path:path.join(process.env.FIVE_EVIDENCE,name+'.png'),fullPage:true});
}
const fiveBaseline=process.env.FIVE_BASELINE==='1';
test('five fixes: account fields, keyboard, masking and auth controls stay readable',async t=>{
 const p=await setup(t);await cloudFixture(p,null);
 for(const width of [320,390,768,1440]){
  await p.setViewportSize({width,height:1000});
  if(width<=820&&await p.locator('#mobileMenu').getAttribute('aria-expanded')==='false')await p.locator('#mobileMenu').click();
  await p.locator('.ca-student-row').click();await p.locator('#caEmail').fill('learner@example.test');await p.locator('#caPassword').fill('fixture-only-password');
  const state=await p.locator('#caEmail').evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundColor,color:s.color,border:s.borderColor,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth};});
  await fiveEvidence(p,'account-'+width,state);
  if(!fiveBaseline){assert.equal(state.background,'rgb(251, 252, 250)');assert.equal(state.color,'rgb(23, 50, 74)');assert.equal(state.border,'rgb(113, 137, 146)');assert.equal(state.overflow,false);assert.equal(await p.locator('#caPassword').getAttribute('type'),'password');
   await p.locator('#caEmail').focus();await p.keyboard.press('Tab');assert.equal(await p.locator('#caPassword').evaluate(e=>e===document.activeElement),true);
  }
  await p.locator('#caAccountOverlay [data-account-close]').click();
 }
 if(fiveBaseline)return;
 await p.locator('.ca-student-row').click();await p.locator('#caSignUp').click();await p.waitForFunction(()=>document.querySelector('#caAuthFeedback').textContent.includes('email'));
 await p.locator('#caEmail').fill('learner@example.test');await p.locator('#caPassword').fill('fixture-only-password');
 await p.locator('#caAuthForm button[type=submit]').click();await p.waitForFunction(()=>window.ChemAtlasLearnerState.owner==='account:A');
});

test('five fixes: expanded lesson resources use readable prose surfaces across all lessons',async t=>{
 const p=await setup(t);await cloudFixture(p);
 const ids=await p.evaluate(()=>window.CHEM_GENCHEM.modules.map(m=>m.id));
 for(const id of fiveBaseline?ids.slice(0,1):ids){
  await p.goto(base+'/genchem/'+id);await p.waitForFunction(id=>window.ChemAtlasLearnerState?.owner==='account:A'&&document.querySelector('.gc-module-link.active')?.dataset.module===id,id);
  await p.locator('.ca-lesson-more > summary').click();await p.locator('.gc-scope summary').click();
  const data=await p.locator('.gc-connection.bridge').evaluate(e=>({background:getComputedStyle(e).backgroundImage,color:getComputedStyle(e.querySelector('p:last-child')).color}));
  if(id===ids[0])await fiveEvidence(p,'resources-1440',data);
  if(!fiveBaseline){
   assert.equal(data.background,'none');assert.equal(data.color,'rgb(82, 104, 115)');
   await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   const audit=()=>p.evaluate(async()=>{const r=await axe.run(document.querySelector('.gc-reader'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));});
   assert.deepEqual(await audit(),[],id+' resources');
   await p.locator('.ca-step-jump summary').click();await p.getByRole('button',{name:/Step \d+: Worked example/}).click();
   assert.deepEqual(await audit(),[],id+' worked example');
  }
 }
 if(fiveBaseline)return;
 await p.locator('.ca-step-jump summary').click();await p.locator('[data-focus-index]').first().click();
 for(const width of [320,390,768,1440,2048]){await p.setViewportSize({width,height:1000});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);const violations=await p.evaluate(async()=>{const r=await axe.run(document.querySelector('.gc-reader'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));});assert.deepEqual(violations,[]);}
});

test('five fixes: header empty state and ordinary search without global shortcuts',async t=>{
 const p=await setup(t);
 for(const width of [390,768,1440,2048]){
  await p.setViewportSize({width,height:1000});
  const state=await p.evaluate(()=>({streak:document.querySelector('.streak').innerText,badges:document.querySelectorAll('.ca-top-search kbd').length,overflow:document.documentElement.scrollWidth>innerWidth}));
  await fiveEvidence(p,'header-'+width,state);
  if(fiveBaseline)continue;
  assert.equal(state.badges,0);assert.doesNotMatch(state.streak,/—/);assert.equal(state.overflow,false);
  for(const modifier of ['ctrlKey','metaKey']){const result=await p.evaluate(modifier=>{document.querySelector('#mobileMenu').focus();const original=document.activeElement;const e=new KeyboardEvent('keydown',{key:'k',[modifier]:true,bubbles:true,cancelable:true});window.dispatchEvent(e);return {canceled:e.defaultPrevented,same:document.activeElement===original};},modifier);assert.deepEqual(result,{canceled:false,same:true});}
 }
 if(fiveBaseline)return;
 await p.setViewportSize({width:1440,height:1000});const search=p.locator('.ca-top-search input');await p.locator('.ca-help-button').focus();await p.keyboard.press('Shift+Tab');assert.equal(await search.evaluate(e=>e===document.activeElement),true);await search.click();await search.fill('polarity');await p.locator('.ca-search-results').waitFor({state:'visible'});await p.keyboard.press('Escape');assert.equal(await p.locator('.ca-search-results').isVisible(),false);
 await search.click();await search.fill('polarity');await p.locator('[data-search-module="geometry"]').click();await p.waitForFunction(()=>location.pathname==='/genchem/geometry');
});

test('five fixes: Companion network failure is actionable and retryable',async t=>{
 const p=await setup(t);await cloudFixture(p);
 await p.route('**/functions/v1/chemwaypoint-site-companion',r=>r.abort('failed'));
 await p.goto(base+'/companion');await p.locator('#cwTab-practice').click();await p.locator('#cwStartPractice').click();await p.waitForFunction(()=>document.querySelector('#cwPracticeStatus').classList.contains('error'));
 const data=await p.locator('#cwPracticeStatus').innerText();await fiveEvidence(p,'companion-failed',{message:data,cause:'simulated network/CORS-style fetch rejection; not live backend evidence'});
 if(fiveBaseline)return;
 assert.doesNotMatch(data,/Failed to fetch/i);assert.match(data,/connect|connection/i);assert.equal(await p.locator('[data-cw-action="retry-practice"]').count(),1);
 await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 for(const width of [320,390,768,1440,2048]){await p.setViewportSize({width,height:1000});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);const violations=await p.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));});assert.deepEqual(violations,[]);await fiveEvidence(p,'companion-failed-'+width,{width,message:data});}
});

test('five fixes: Companion distinguishes failures and retries the retained lesson and locked answers',async t=>{
 const p=await setup(t);await cloudFixture(p);let mode='ok',submitMode='ok';const submissions=[],requests=[];
 const questions=[0,1,2].map(i=>({id:'q'+i,question:'Fixture concept '+i,choices:['First','Second'],level:'Apply'}));
 await p.route('**/functions/v1/chemwaypoint-site-companion',async r=>{
  const body=r.request().postDataJSON();requests.push({action:body.action,module:body.args?.module_id});
  let status=200,result;
  if(body.action==='get_learning_progress')result={completed:0,total:19,mastered:0,dueForReview:[],recommendedNext:null};
  else if(body.action==='create_practice_set'){
   if(mode==='network'||mode==='offline'){await r.abort(mode==='offline'?'internetdisconnected':'failed');return;}
   if(mode==='timeout')return;
   if(mode==='malformed'){await r.fulfill({status:200,body:'not json',contentType:'text/plain'});return;}
   status=typeof mode==='number'?mode:200;
   result=status===200?{sessionId:'fixture-session',moduleId:body.args.module_id,questions,eligibleSpacedReview:false}:{error:'PRIVATE SERVER DIAGNOSTIC MUST NOT LEAK'};
  }else if(body.action==='submit_practice_set'){
   submissions.push(body.args);status=submitMode==='ok'?200:503;
   result=status===200?{moduleId:'atoms-moles',correct:2,total:3,mastery:{label:'Building mastery',reviewWins:0},details:[]}:{error:'PRIVATE SERVER DIAGNOSTIC MUST NOT LEAK'};
  }
  await r.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});
 });
 await p.goto(base+'/companion');await p.locator('#cwTab-practice').click();await p.locator('#cwPracticeModule').selectOption('atoms-moles');
 const evidenceBefore=await p.evaluate(()=>localStorage.getItem('chematlas-assessment-events-v1'));
 await p.clock.install();
 for(const failure of ['network','offline',401,403,404,503,'malformed','timeout']){
  mode=failure;
  if(failure==='offline')await p.context().setOffline(true);
  await p.locator('#cwStartPractice').click();
  if(failure==='timeout'){await p.waitForFunction(()=>document.querySelector('#cwStartPractice').disabled);await p.clock.runFor(30100);}
  await p.waitForFunction(()=>document.querySelector('#cwPracticeStatus').classList.contains('error'));
  const text=await p.locator('#cwPracticeStatus').innerText();assert.doesNotMatch(text,/Failed to fetch|PRIVATE SERVER/);
  const expected={network:/connect/i,offline:/connect/i,401:/session|sign in/i,403:/confirm|account/i,404:/unavailable/i,503:/service/i,malformed:/unexpected response/i,timeout:/too long/i};assert.match(text,expected[failure]);
  assert.equal(await p.locator('#cwPracticeModule').inputValue(),'atoms-moles');
  assert.equal(await p.evaluate(()=>localStorage.getItem('chematlas-assessment-events-v1')),evidenceBefore);
  if(failure===401){await p.locator('#cwPracticeStatus [data-account-open]').click();await p.locator('#caAccountOverlay.open').waitFor();await p.locator('#caAccountOverlay [data-account-close]').click();}
  if(failure==='offline')await p.context().setOffline(false);
  mode='ok';await p.locator(failure===401?'[data-cw-action="reconnect-practice"]':'[data-cw-action="retry-practice"]').click();await p.locator('#cwQuestionHeading').waitFor();
  assert.match(await p.locator('#cwQuestionHeading').innerText(),/Fixture concept 0/);assert.equal(requests.at(-1).module,'atoms-moles');
 }
 submitMode='fail';
 for(let i=0;i<3;i++){await p.locator('[data-cw-choice="'+(i%2)+'"]').click();await p.locator('#cwNextQuestion').click();}
 await p.locator('[data-cw-action="retry-practice"]').waitFor();
 assert.equal(await p.locator('[data-cw-choice]:disabled').count(),2);
 assert.deepEqual(submissions[0].choices,[0,1,0]);
 assert.equal(await p.evaluate(()=>localStorage.getItem('chematlas-assessment-events-v1')),evidenceBefore);
 await fiveEvidence(p,'companion-save-retry',{choices:submissions[0].choices,status:await p.locator('#cwPracticeStatus').innerText()});
 submitMode='ok';await p.locator('[data-cw-action="retry-practice"]').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>document.querySelector('#cwPractice').textContent.includes('PRACTICE SAVED'));
 assert.deepEqual(submissions[1],submissions[0]);assert.match(await p.locator('#cwPractice').innerText(),/2 of 3/);
});

test('five fixes: verified streak display uses the unchanged projection',async t=>{
 const p=await setup(t);
 await p.evaluate(()=>{
  const today=new Date();today.setHours(12,0,0,0);if(today>Date.now())today.setDate(today.getDate()-1);
  const run=(id,at)=>[{id,type:'start',moduleId:'measurement',at,mode:'lesson',eligible:false,questionIds:['q1']},{id:id+'a',type:'answer',run:id,moduleId:'measurement',at:at+1,questionId:'q1',choice:0,correct:false},{id:id+'f',type:'finish',run:id,moduleId:'measurement',at:at+2}];
  const at=Math.min(+today,Date.now()-1000);localStorage.setItem('chematlas-assessment-events-v1',JSON.stringify(run('today',at)));window.dispatchEvent(new Event('chematlas:assessment-updated'));
  window.__priorStreakRun=()=>{const yesterday=new Date(at);yesterday.setDate(yesterday.getDate()-1);return run('yesterday',+yesterday);};
 });
 assert.equal(await p.locator('.streak strong').innerText(),'1');assert.equal(await p.locator('.streak strong').getAttribute('hidden'),null);
 await p.evaluate(()=>{const key='chematlas-assessment-events-v1';localStorage.setItem(key,JSON.stringify([...JSON.parse(localStorage.getItem(key)),...window.__priorStreakRun()]));window.dispatchEvent(new Event('chematlas:assessment-updated'));});
 assert.equal(await p.locator('.streak strong').innerText(),'2');
 await fiveEvidence(p,'header-active',{count:await p.locator('.streak strong').innerText()});
});

test('five fixes: account autofill, invalid and disabled states preserve legibility',async t=>{
 const p=await setup(t);await cloudFixture(p,null);await p.locator('.ca-student-row').click();
 const cdp=await p.context().newCDPSession(p);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
 const {root}=await cdp.send('DOM.getDocument');const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'#caEmail'});
 await cdp.send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:['autofill']});
 const autofill=await p.locator('#caEmail').evaluate(e=>{const s=getComputedStyle(e);return {fill:s.webkitTextFillColor,shadow:s.boxShadow,foreground:s.color};});
 assert.equal(autofill.fill,'rgb(23, 50, 74)');assert.match(autofill.shadow,/rgb\(251, 252, 250\)/);
 await fiveEvidence(p,'account-autofill',autofill);await cdp.send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:[]});
 await p.locator('#caEmail').evaluate(e=>{e.placeholder='you@example.test';e.setAttribute('aria-invalid','true');});
 assert.equal(await p.locator('#caEmail').evaluate(e=>getComputedStyle(e).borderColor),'rgb(163, 44, 53)');
 await p.locator('#caEmail').focus();assert.equal(await p.locator('#caEmail').evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
 await p.locator('#caPassword').evaluate(e=>e.disabled=true);
 assert.equal(await p.locator('#caPassword').evaluate(e=>getComputedStyle(e).borderStyle),'dashed');
 await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const violations=await p.evaluate(async()=>{const r=await axe.run(document.querySelector('#caAccountOverlay'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));});assert.deepEqual(violations,[]);
});

test('five fixes: real browser preflight rejection is distinguishable from a service auth response',async t=>{
 const vm=require('node:vm');let handler;const trace=[];
 vm.runInNewContext(fs.readFileSync(path.join(root,'supabase/functions/chemwaypoint-site-companion/index.js'),'utf8'),{URL,Request,Response,Headers,AbortSignal,structuredClone,TextEncoder,Date,JSON,crypto:require('node:crypto').webcrypto,fetch:()=>{throw Error('Unapproved downstream request');},Deno:{env:{get:key=>({APP_ENV:'local',APP_ORIGIN:'http://127.0.0.1:3000',SUPABASE_URL:'http://127.0.0.1:54321'})[key]||''},serve:fn=>handler=fn}});
 const edge=http.createServer(async(req,res)=>{
  const response=await handler(new Request('http://fixture.test'+req.url,{method:req.method,headers:req.headers}));
  trace.push({method:req.method,origin:req.headers.origin,status:response.status,allowOrigin:response.headers.get('Access-Control-Allow-Origin')});
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());
 });
 await new Promise(r=>edge.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>edge.close(r)));
 const endpoint='http://127.0.0.1:'+edge.address().port;
 // A self-contained page has no intercepted requests: DevTools interception
 // suppresses Chromium's normal preflight. CSP permits only this local backend.
 const context=await browser.newContext();t.after(()=>context.close());const p=await context.newPage();
 await p.goto(base+'/data/genchem.js');
 await p.setContent(`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src ${endpoint}"><main class="main"></main><script>window.CHEMATLAS_CONFIG={supabaseUrl:${JSON.stringify(endpoint)},supabasePublishableKey:'fixture-public'};window.ChemAtlasCloud=async()=>({auth:{getSession:async()=>({data:{session:{user:{id:'fixture-user'},access_token:'fixture-only'}}}),onAuthStateChange:()=>{}}});${fs.readFileSync(path.join(root,'data/genchem.js'),'utf8')};${fs.readFileSync(path.join(root,'companion.js'),'utf8')}</script>`);
 const failures=[];p.on('requestfailed',req=>{if(req.url().startsWith(endpoint))failures.push({url:req.url(),method:req.method(),error:req.failure()?.errorText});});
 await p.locator('#cwTab-practice').click();await p.locator('#cwStartPractice').click();await p.locator('[data-cw-action="retry-practice"]').waitFor();
 await fiveEvidence(p,'companion-preflight',{trace,failures,config:await p.evaluate(()=>window.CHEMATLAS_CONFIG.supabaseUrl)});
 assert(trace.some(r=>r.method==='OPTIONS'&&r.status===403&&r.allowOrigin===null));assert.equal(trace.some(r=>r.method==='POST'),false);assert(failures.length>0);
 assert.doesNotMatch(await p.locator('#cwPracticeStatus').innerText(),/Failed to fetch/);
 await fiveEvidence(p,'companion-preflight',{environment:'local browser against unchanged bundled handler; not live-service evidence',trace,failures});
});
