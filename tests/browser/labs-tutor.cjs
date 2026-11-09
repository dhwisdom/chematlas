'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {contrast}=require('./practice.cjs');

async function lightSurfaces(page,selector){
 const dark=await page.locator(selector).evaluateAll(elements=>elements.filter(el=>{
  const style=getComputedStyle(el),rgb=(style.backgroundColor.match(/[\d.]+/g)||[]).map(Number);
  return style.backgroundImage!=='none'||Math.min(...rgb.slice(0,3))<220||(rgb[3]??1)<1;
 }).map(el=>el.className));
 assert.deepEqual(dark,[],'Labs and Tutor surfaces must use opaque light backgrounds.');
}

module.exports=async function labsTutor(page,output){
 const checks=[];
 for(const [width,height] of [[1440,1000],[390,844]]){
  await page.setViewportSize({width,height});
  const navigate=async route=>{
   if(width<800&&!await page.locator('.sidebar').evaluate(el=>el.classList.contains('open')))await page.locator('#mobileMenu').click();
   await page.locator(`[data-ca-tutor-route="${route}"]`).click();
  };
  await navigate('/model-lab');
  await page.locator('#labView').waitFor({state:'visible'});
  await lightSurfaces(page,'#labView .molecule-panel, #labView .model-toolbar, #labView .model-toolbar select, #labView .viewer, #labView .model-info .panel, #labView .answer');
  for(const key of ['ch4','nh3','h2o','co2','bf3','pcl5','sf6']){
   await page.locator('#moleculeSelect').selectOption(key);
   const expected=await page.evaluate(key=>window.CHEM_CURRICULUM.molecules[key].name,key);
   assert.equal(await page.locator('#molName').innerText(),expected);
   await contrast(page,'#labView');
  }
  await page.locator('#moleculeSelect').selectOption('h2o');
  const stick=await page.locator('#moleculeCanvas').evaluate(canvas=>canvas.toDataURL());
  await page.locator('[data-style="sphere"]').click();
  assert.notEqual(await page.locator('#moleculeCanvas').evaluate(canvas=>canvas.toDataURL()),stick,'Changing display style must redraw the molecule.');
  assert(await page.locator('[data-style="sphere"]').evaluate(el=>el.classList.contains('active')));
  await contrast(page,'#labView');
  await page.locator('[data-style="stick"]').click();
  await page.locator('#quizArea .answer').first().click();
  await contrast(page,'#labView');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:path.join(output,`labs-${width}.png`),fullPage:true});
  checks.push(`Labs light surfaces, seven molecules, display controls and quiz at ${width}px`);

  await navigate('/tutor');
  await page.locator('#caTutorV2').waitFor({state:'visible'});
  // Readability stack makes context a disclosure; measure its expanded contents.
  await page.locator('#caTutorV2 .ca-tutor-side-v2').evaluate(el=>el.open=true);
  if(width<800){
   const cardWidths=await page.locator('#caTutorV2 .ca-tutor-side-v2>article').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().width));
   assert(cardWidths.length>0&&cardWidths.every(value=>value>200),'Expanded Tutor context cards must occupy the phone content column.');
   assert.equal(await page.locator('#caTutorV2 .ca-tutor-side-v2').evaluate(el=>el.scrollWidth>el.clientWidth+1),false,'Expanded Tutor context must not overflow.');
  }
  await page.locator('#caTutorV2 .ca-thread-rail').evaluate(el=>el.open=true);
  await page.locator('#caTutorV2 [data-tutor-new]').first().click();
  await lightSurfaces(page,'#caTutorV2 .ca-chat-v2, #caTutorV2 .ca-thread-rail, #caTutorV2 .ca-tutor-empty button, #caTutorV2 .ca-memory-grid>div');
  await contrast(page,'#caTutorView');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:path.join(output,`tutor-empty-${width}.png`),fullPage:true});
  await page.locator('[data-tutor-v2-prompt]').first().click();
  await page.locator('#caTutorInput').fill('Why does molecular geometry affect polarity?');
  await page.locator('#caTutorForm button[type="submit"]').click();
  await page.locator('#caChat .assistant').getByText(/Simulated tutor/).waitFor();
  const messageWidth=await page.locator('#caChat .user .ca-message-copy').evaluate(el=>el.getBoundingClientRect().width);
  assert(messageWidth>150,'Learner messages must occupy the message column rather than the avatar column.');
  const headerOverflow=await page.locator('.ca-tutor-head-v2').evaluate(el=>el.scrollWidth>el.clientWidth+1);
  assert.equal(headerOverflow,false,'A conversation title must fit without overlapping the side panels.');
  await contrast(page,'#caTutorView');
  const bodyBackgrounds=await page.locator('#caTutorV2 .ca-message-body').evaluateAll(els=>els.map(el=>getComputedStyle(el).backgroundColor));
  assert(bodyBackgrounds.every(color=>color==='rgba(0, 0, 0, 0)'),'Message containers must not restore a dark background.');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:path.join(output,`tutor-chat-${width}.png`),fullPage:true});
  checks.push(`Tutor light prompts and simulated conversation at ${width}px`);
 }
 return checks;
};
