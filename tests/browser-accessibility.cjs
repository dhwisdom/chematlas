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
});
