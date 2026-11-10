'use strict';
// Responsive acceptance tests against guarded synthetic services only.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {start}=require('../../scripts/dev.cjs');
async function main(){
 const output=path.resolve('.local/mobile-evidence');fs.mkdirSync(output,{recursive:true});
 const server=await start('mock',0,{log:()=>{}}),origin='http://127.0.0.1:'+server.address().port;
 const checks=[],errors=[],blocked=[];let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
  await context.route('**/*',route=>{
   if(new URL(route.request().url()).origin!==origin){blocked.push(route.request().url());return route.abort();}
   return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  const ready=async route=>{await page.goto(origin+route);await page.locator('html:not([data-ca-starting])').waitFor();};
  const closed=async()=>{
   await page.waitForFunction(()=>!document.body.classList.contains('ca-nav-open'));
   assert.equal(await page.locator('#mobileMenu').getAttribute('aria-expanded'),'false');
   assert.equal(await page.locator('.main').evaluate(el=>el.inert),false);
   assert.equal(await page.locator('#mobileMenuBackdrop').isVisible(),false);
  };
  for(const [width,height] of [[320,568],[390,844],[430,932],[768,1024],[820,600],[821,600],[1440,1000]]){
   await page.setViewportSize({width,height});
   for(const route of ['/','/dashboard','/genchem/measurement','/tutor','/companion','/progress']){
    await ready(route);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${route} must fit ${width}px`);
    if(route==='/dashboard'){
     const dashboard=await page.locator('.ca-home-grid').evaluate(grid=>{
      const bounds=grid.getBoundingClientRect();
      return {columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,width:bounds.width,
       cards:[...grid.querySelectorAll('.ca-home-side,.ca-mastery,.ca-recent,.ca-ask-strip')].map(card=>{
        const rect=card.getBoundingClientRect();return {name:card.className,width:rect.width,contained:rect.left>=bounds.left-1&&rect.right<=bounds.right+1};
       })};
     });
     if(width<=1100)assert.equal(dashboard.columns,1,`Dashboard must stack at ${width}px`);
     assert(dashboard.cards.length>0&&dashboard.cards.every(card=>card.contained),JSON.stringify({width,...dashboard}));
     if(width<=820){
      const card=await page.locator('.ca-continue').evaluate(el=>({columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,width:el.clientWidth,copyWidth:el.querySelector('.ca-continue-copy').getBoundingClientRect().width}));
      assert.equal(card.columns,1,`Continue lesson must stack at ${width}px`);
      assert(card.copyWidth>=card.width-2,'Continue lesson text must not be compressed into a desktop column');
     }
    }
    if(route==='/'&&width<=520){
     const columns=await page.locator('.ca-marketing-hero').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
     assert.equal(columns,1,'Phone landing hero must be one column');
    }
    if(width===390)await page.screenshot({path:path.join(output,`${route==='/'?'landing':route.split('/')[1]}-${width}.png`),fullPage:true});
   }
   checks.push(`Landing, dashboard, Learn, Tutor, Companion and Progress fit ${width}×${height}`);
  }
  await page.setViewportSize({width:390,height:844});await ready('/dashboard');
  const menu=page.locator('#mobileMenu'),sidebar=page.locator('.sidebar');
  const demoNote=page.getByRole('note').filter({hasText:'FRONTEND DEMO'});
  const visibleDemoNote=async()=>{
   await page.evaluate(()=>scrollTo({top:0,left:0,behavior:'instant'}));
   assert.equal(await demoNote.isVisible(),true,'development warning must remain visible');
   await page.waitForFunction(()=>{
    const el=[...document.querySelectorAll('[role="note"]')].find(note=>note.textContent.includes('FRONTEND DEMO'));
    const bounds=el.getBoundingClientRect();return el.contains(document.elementFromPoint(bounds.left+bounds.width/2,bounds.top+bounds.height/2));
   }); // Wait for the drawer's exit transition before checking the revealed warning.
  };
  await visibleDemoNote();
  for(const dismiss of ['close','backdrop','escape']){
   await menu.click();await page.locator('#mobileMenuClose').waitFor({state:'visible'});
   await page.waitForFunction(()=>{
    const button=document.getElementById('mobileMenuClose'),bounds=button.getBoundingClientRect();
    return button.contains(document.elementFromPoint(bounds.left+bounds.width/2,bounds.top+bounds.height/2));
   });
   assert.equal(await page.locator('.main').evaluate(el=>el.inert),true);
   assert.equal(await sidebar.getAttribute('aria-modal'),'true');
   // Native <summary> controls must remain in the focus loop, including collapsed task options.
   const controls=sidebar.locator('button:visible,a[href]:visible,input:visible,select:visible,textarea:visible,summary:visible,[tabindex="0"]:visible');
   await controls.last().focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'mobileMenuClose');
   await page.keyboard.press('Shift+Tab');assert.equal(await controls.last().evaluate(el=>document.activeElement===el),true);
   if(dismiss==='close')await page.locator('#mobileMenuClose').click();
   else if(dismiss==='backdrop')await page.locator('#mobileMenuBackdrop').click({position:{x:380,y:300}});
   else await page.keyboard.press('Escape');
   await closed();assert.equal(await menu.evaluate(el=>document.activeElement===el),true);
   await visibleDemoNote();
  }
  checks.push('Visible development warning, unobstructed touch close, outside tap, Escape, native summary focus loop and background inert');
  await menu.click();await sidebar.locator('[data-periodic-open]').click();await closed();
  await page.locator('#ptSearch').waitFor({state:'visible'});await page.keyboard.press('Escape');
  await page.locator('#caPeriodicTable').waitFor({state:'hidden'});
  assert.equal(await menu.evaluate(el=>document.activeElement===el),true,'reference returns focus to the visible menu');
  checks.push('Periodic reference returns focus to visible opener after drawer dismissal');
  await menu.click();const search=page.getByRole('searchbox',{name:'Search ChemWaypoint'});
  await search.fill('measurement');await page.locator('.ca-search-result[data-search-module="measurement"]').click();
  await page.waitForURL('**/genchem/measurement');await closed();
  assert.equal(await page.locator('.ca-top-search').count(),1);
  await page.locator('.ca-focus-next').click();assert.equal(await page.locator('.ca-focus-count b').textContent(),'2');
  checks.push('Mobile search retains one control, routes to lesson and closes drawer; lesson Continue works');
  // Back to the landing page while open previously left the app inert under an invisible drawer.
  await ready('/');const documentTimeOrigin=await page.evaluate(()=>performance.timeOrigin);
  await page.locator('#caLandingView [data-route="/dashboard"]').click();await page.waitForURL('**/dashboard');
  assert.equal(await page.evaluate(()=>performance.timeOrigin),documentTimeOrigin,'dashboard navigation must stay in the same document');
  await menu.click();await page.goBack();
  await page.waitForURL(origin+'/');await closed();assert.equal(await sidebar.evaluate(el=>el.classList.contains('open')),false);
  assert.equal(await page.evaluate(()=>performance.timeOrigin),documentTimeOrigin,'Back must exercise SPA popstate without reload');
  await page.goForward();await page.waitForURL('**/dashboard');
  assert.equal(await page.evaluate(()=>performance.timeOrigin),documentTimeOrigin,'Forward must exercise SPA popstate without reload');
  await menu.click();assert.equal(await page.evaluate(()=>document.activeElement.id),'mobileMenuClose');
  await page.setViewportSize({width:821,height:600});await closed();assert.equal(await sidebar.evaluate(el=>el.inert),false);
  assert.equal(await page.locator('.topbar .ca-top-search').count(),1);
  await page.waitForFunction(()=>document.activeElement.closest('.sidebar')&&!['mobileMenu','mobileMenuClose'].includes(document.activeElement.id)&&document.activeElement.checkVisibility());
  await search.focus();
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.activeElement.id==='mobileMenu');
  await menu.click();await search.focus();
  await page.setViewportSize({width:821,height:600});await page.waitForFunction(()=>document.activeElement.matches('.topbar .ca-top-search input'));
  await page.setViewportSize({width:390,height:430});await page.waitForFunction(()=>document.querySelector('.sidebar').inert);
  await menu.click();await page.locator('#mobileMenuClose').click();await closed();
  // Existing account-overlay keyboard/short-height accessibility is a separate known gap.
  // This verifies account functionality at a standard phone height, not modal accessibility.
  await page.setViewportSize({width:390,height:844});
  await menu.click();await sidebar.locator('[data-account-open]:visible').first().click();await closed();
  await page.locator('#caEmail').fill('learner-a@example.invalid');await page.locator('#caPassword').fill('synthetic-demo-only');
  await page.locator('#caAuthForm button[type="submit"]').click();await page.locator('#caSignOut').waitFor({state:'visible'});
  await page.locator('#caAccountOverlay [data-account-close]').click();
  checks.push('Same-document Back/Forward, breakpoint focus/search recovery, short-screen drawer dismissal and synthetic account sign-in');
  // Mock sessions are intentionally tab-memory only; use app routes after sign-in.
  await menu.click();await sidebar.locator('[data-ca-tutor-route="/tutor"]').click();
  await page.waitForURL('**/tutor');await page.locator('#caTutorV2').waitFor({state:'visible'});
  await page.locator('#caTutorInput').fill('Explain how units help me check a calculation.');
  await page.locator('#caTutorForm button[type="submit"]').click();await page.locator('#caChat .assistant').getByText(/Simulated tutor/).waitFor();
  await menu.click();await sidebar.locator('[data-ca-tutor-route="/companion"]').click();
  await page.waitForURL('**/companion');await page.locator('#cwChatInput').fill('Explain measurement uncertainty.');
  await page.locator('#cwChatForm button[type="submit"]').click();await page.locator('#cwChat').getByText(/Simulated tutor/).waitFor();
  await page.locator('[data-cw-tab="practice"]').click();await page.locator('#cwStartPractice').click();
  for(let index=0;index<5;index++){await page.locator('[data-cw-choice="0"]').click();await page.locator('#cwNextQuestion').click();}
  await page.getByText(/Simulated result — stored only in this browser demo/).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.screenshot({path:path.join(output,'companion-practice-390.png'),fullPage:true});
  checks.push('Phone Tutor and Companion simulated chat plus five-answer practice');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({mode:'mock',engine:'Chromium',checks,errors,externalRequestsBlocked:blocked.length},null,2));
  console.log(`PASS: ${checks.length} mobile acceptance groups; evidence in .local/mobile-evidence.`);
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
