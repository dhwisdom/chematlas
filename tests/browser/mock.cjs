'use strict';
// Real Chromium, synthetic services only. No production endpoints or paid providers are contacted.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {start}=require('../../scripts/dev.cjs');
async function main(){
 const output=path.resolve('.local/browser-evidence');fs.mkdirSync(output,{recursive:true});
 const server=await start('mock',0),origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const requests=[],blocked=[],errors=[];
  await context.route('**/*',route=>{
   const url=route.request().url();requests.push(url);
   if(new URL(url).origin!==origin){blocked.push(url);return route.abort('blockedbyclient');}
   return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/companion');
  await page.locator('#caCompanionView').waitFor({state:'visible'});
  await page.getByRole('note').filter({hasText:'FRONTEND DEMO'}).waitFor();
  // Synthetic guest evidence exercises the existing first-account merge contract.
  await page.evaluate(()=>localStorage.setItem('chematlas-genchem-completed-v1',JSON.stringify(['measurement'])));
  // Exercise the actual account form rather than installing a fake browser session.
  await page.locator('[data-account-open]:visible').first().click();
  await page.locator('#caEmail').fill('learner-a@example.invalid');
  await page.locator('#caPassword').fill('synthetic-demo-only');
  await page.locator('#caAuthForm button[type="submit"]').click();
  await page.locator('#caSignOut').waitFor({state:'visible'});
  await page.waitForFunction(async()=>{const client=await window.ChemAtlasCloud();const {data:{session}}=await client.auth.getSession();const {data}=await client.from('learner_state').select().eq('user_id',session.user.id).eq('state_key','chematlas-genchem-completed-v1');return data.some(row=>row.state_value.includes('measurement'));});
  // Dismiss the account modal using the application's close control.
  await page.keyboard.press('Escape');
  if(await page.locator('#caSignOut').isVisible()){
    const close=page.locator('#caAccountOverlay [data-account-close]');
    if(await close.count())await close.first().click();
  }
  const denial=await page.evaluate(async()=>{try{await fetch('https://zslxoqvqxdqwykzdogor.supabase.co/rest/v1/learner_state');return 'allowed';}catch{return 'blocked';}});
  assert.equal(denial,'blocked');
  await page.locator('#cwChatInput').fill('Explain precision using units.');
  await page.locator('#cwChatForm').evaluate(form=>form.requestSubmit());
  await page.locator('#cwChat').getByText(/Simulated tutor/).waitFor();
  await page.locator('[data-cw-tab="practice"]').click();
  await page.locator('#cwStartPractice').click();
  for(let index=0;index<5;index++){
   await page.locator('[data-cw-choice="0"]').click();
   await page.locator('#cwNextQuestion').click();
  }
  await page.getByText(/Simulated result — stored only in this browser demo/).waitFor();
  await page.screenshot({path:path.join(output,'companion-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:path.join(output,'companion-mobile.png'),fullPage:true});
  const practiceChecks=await require('./practice.cjs')(page,output);
  assert.equal(errors.length,0,errors.join('\n'));
  assert(!requests.some(url=>new URL(url).hostname.endsWith('.supabase.co')),'Production backend must never be requested.');
  const report={engine:'Chromium',mode:'mock',checks:['real app boot','demo banner','account-form sign-in','guest evidence merged into first synthetic account','production fetch rejected before network','mock Tutor response','five-question simulated Companion practice','desktop screenshot','mobile screenshot'],uncaughtErrors:errors,externalRequestsBlocked:blocked.length,productionBackendRequests:0};
  report.checks.push(...practiceChecks);
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('PASS: '+report.checks.length+' Chromium checks; evidence in .local/browser-evidence.');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
