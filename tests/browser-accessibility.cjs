// NODE_PATH must provide playwright; CHROMIUM_EXECUTABLE may select system Chromium.
// Run: node --test tests/browser-accessibility.cjs
const {test, before, after}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http'), fs=require('node:fs'), path=require('node:path');
let browser, server, base;
const root=path.resolve(__dirname,'..');
before(async()=>{
  server=http.createServer((req,res)=>{
    let pathname=new URL(req.url,'http://localhost').pathname;
    if (/^\/(genchem|dashboard|progress|tutor|companion|organic|courses|curriculum|model-lab)(\/|$)/.test(pathname)||pathname==='/') pathname='/index.html';
    const file=path.resolve(root,'.'+decodeURIComponent(pathname));
    if(!file.startsWith(root+path.sep)||pathname.includes('/.')){res.writeHead(403).end();return;}
    fs.readFile(file,(err,body)=>{
      if(err){res.writeHead(404).end();return;}
      res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(body);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
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
  await p.setViewportSize({width:1440,height:1000});assert.equal(await sidebar.evaluate(e=>e.inert),false);
  await p.setViewportSize({width:800,height:1000});await menu.waitFor({state:'visible'});
  assert.equal(await sidebar.evaluate(e=>e.inert),true);
});
test('module and assessment transitions keep focus and preserve first-answer evidence',async t=>{
  const p=await setup(t);
  await p.locator('[data-module="atoms-moles"]').focus();await p.keyboard.press('Enter');
  await p.waitForFunction(()=>document.activeElement.matches('.gc-module-header h2'));
  await p.locator('[data-module="measurement"]').click();
  await p.locator('[data-focus-index]').last().click();await p.locator('[data-check-start]').click();
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
