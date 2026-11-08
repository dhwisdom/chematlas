'use strict';
const assert=require('node:assert/strict'),path=require('node:path');

// Measure rendered text, so later theme overrides cannot silently hide lab labels.
async function contrast(page){
 const failures=await page.locator('#gcPracticeOverlay').evaluate(root=>{
  const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
  const luminance=channels=>channels.slice(0,3).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
  const problems=[];
  for(const el of root.querySelectorAll('*')){
   if(!el.getClientRects().length||!Array.from(el.childNodes).some(n=>n.nodeType===3&&n.textContent.trim()))continue;
   // This label is positioned outside the dark thermometer, on the light stage.
   let ancestor=el.id==='gcThermoLabel'?el.closest('.gc-tool-stage'):el;
   const layers=[];
   while(ancestor){layers.push(rgb(getComputedStyle(ancestor).backgroundColor));ancestor=ancestor.parentElement;}
   let bg=[255,255,255];
   for(const layer of layers.reverse()){const alpha=layer[3]??1;bg=bg.map((n,i)=>layer[i]*alpha+n*(1-alpha));}
   const fg=rgb(getComputedStyle(el).color),a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   if(ratio<4.5)problems.push({text:el.textContent.trim().slice(0,70),ratio:Number(ratio.toFixed(2))});
  }
  return problems;
 });
 assert.deepEqual(failures,[],'Practice Lab text must have at least 4.5:1 contrast.');
}

module.exports=async function practice(page,output){
 const checks=[];
 for(const [width,height] of [[1440,1000],[390,844]]){
  await page.setViewportSize({width,height});
  // Mobile navigation can be collapsed: open the existing menu when necessary.
  const launch=page.locator('[data-ca-tutor-practice]');
  if(width<800)await page.locator('#mobileMenu').click();
  await launch.click();
  await page.locator('#gcToolStage h3').waitFor({state:'visible'});
  for(const tool of ['periodic','lewis','balance','stoich','acid','equilibrium','calorimetry']){
   await page.locator(`[data-tool="${tool}"]`).click();
   await contrast(page);
   assert(await page.locator('#gcToolStage h3').isVisible());
   if(tool==='periodic'){
    await page.locator('.gc-element:not(.spacer)').first().click();
    await page.locator('[data-pick="a"]').click();
    await contrast(page);
    await page.locator('#gcTrendNext').click();
    await page.locator('#gcPracticeOverlay').evaluate(el=>{el.scrollTop=0;});
    await page.screenshot({path:path.join(output,`practice-${width}.png`)});
    const overflow=await page.locator('.gc-practice-shell').evaluate(el=>el.scrollWidth>el.clientWidth+1);
    assert.equal(overflow,false,'The table must scroll inside the lab rather than widen the page.');
   }
   if(tool==='lewis'){
    await page.locator('[data-bond]').evaluateAll(els=>els.forEach(el=>{el.value='2';}));
    await page.locator('#gcLewisCheck').click();
    await page.locator('#gcLewisFeedback.good').waitFor();
    await contrast(page);
   }
   if(tool==='balance'){
    await page.locator('#gcBalanceCheck').click();
    assert.match(await page.locator('#gcBalanceFeedback').innerText(),/balanced/i);
    await contrast(page);
   }
   if(tool==='stoich'){
    await page.locator('#gcStoichAnswer').fill('0');
    await page.locator('#gcStoichCheck').click();
    await page.locator('#gcStoichFeedback.bad').waitFor();
    await contrast(page);
   }
   if(tool==='acid'){
    await page.locator('#gcStrongConc').fill('0');
    await page.locator('#gcStrongCalc').click();
    await page.locator('#gcStrongResult.bad').waitFor();
    await contrast(page);
    await page.locator('#gcStrongConc').fill('0.01');
    await page.locator('#gcStrongCalc').click();
    assert.match(await page.locator('#gcStrongResult.good').innerText(),/2\.000/);
    await contrast(page);
   }
   if(tool==='equilibrium'){
    await page.locator('[data-dir="right"]').click();
    await contrast(page);
    await page.locator('#gcEqSolve').click();
    await page.locator('#gcEqFeedback.good').waitFor();
    await contrast(page);
   }
   if(tool==='calorimetry'){
    await page.locator('#gcTempGuess').fill('35.7');
    await page.locator('#gcRunCal').click();
    assert.match(await page.locator('#gcCalFeedback').innerText(),/ΔT/);
    await contrast(page);
   }
   checks.push(`${tool}: readable text and working controls at ${width}px`);
  }
  await page.locator('.gc-practice-close').click();
 }
 return checks;
};
