// External tools: NODE_PATH provides playwright and axe-core. No app dependencies added.
// VISUAL_BASELINE=1 records the baseline without enforcing remediation expectations.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=process.env.VISUAL_ARTIFACTS||'/tmp/chematlas-visual';
const baseline=process.env.VISUAL_BASELINE==='1';
const samples={landing:['.ca-marketing-hero','.ca-marketing-lede','.ca-flow-grid p'],courses:['.course-grid','.course-card h3','.course-card>p','.module-list span','.course-actions small'],learn:['.gc-workspace','.gc-reading p','.gc-module-link strong','.ca-focus-next'],practice:['.gc-practice-shell','.gc-practice-intro h3','.gc-practice-score strong','.gc-tool-panel h4','.gc-tool-panel p','.gc-tool-tab strong'],model:['.lab-layout','.viewer','.viewer-help','.property-list strong','.why-card p:last-child'],tutor:['#caTutorV2','.ca-chat-v2','.ca-tutor-empty p','.ca-tutor-form-v2 textarea','.ca-tutor-side-v2 p']};
samples.organic=['.organic-hero p:not(.eyebrow)','.organic-tab strong','.organic-toolbar label','.organic-feedback'];
samples.companion=['.cw-subtitle','.cw-hint','.cw-tabs button'];
samples.account=['#caAccountCopy','#caAccountBody label'];
samples.menu=['.ca-tutor-nav','.ca-course-switcher'];
samples.resources=['.gc-connection.bridge','.gc-connection p:last-child','.gc-vocab span','.gc-scope>p','.gc-scope a'];
samples.account.push('#caEmail','#caPassword');
const routes={resources:'/genchem/measurement',menu:'/genchem/measurement',organic:'/organic',companion:'/companion',account:'/genchem/measurement',landing:'/',courses:'/courses',learn:'/genchem/measurement',practice:'/genchem/measurement',model:'/model-lab',tutor:'/tutor'};
(async()=>{
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 let p=new URL(req.url,'http://localhost').pathname;
 if(p==='/'||/^\/(courses|genchem|model-lab|tutor|organic|companion)(\/|$)/.test(p))p='/index.html';
 const f=path.resolve(root,'.'+decodeURIComponent(p));
 if(!f.startsWith(root+path.sep)||p.includes('/.'))return res.writeHead(403).end();
 fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(b)});
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true,args:['--no-sandbox']});
const results=[],failures=[];
try{
 for(const width of (process.env.VISUAL_WIDTHS?process.env.VISUAL_WIDTHS.split(',').map(Number):[2048,1440,768,390,320,720,360]))for(const [name,route] of Object.entries(routes).filter(([name])=>(process.env.VISUAL_VIEWS?process.env.VISUAL_VIEWS.split(','):['landing','courses','learn','practice','model','tutor']).includes(name))){
  const context=await browser.newContext({viewport:{width,height:1000}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(base+route);await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-ca-starting'));
  if(name==='practice'){
   if(width<=820)await p.locator('#mobileMenu').click();
   await p.locator('[data-ca-tutor-practice]').click();await p.locator('#gcPracticeOverlay.open').waitFor();
  }
  if(name==='resources'){await p.locator('.ca-lesson-more > summary').click();await p.locator('.gc-scope summary').click();}
  if(name==='menu'&&width<=820)await p.locator('#mobileMenu').click();
  if(name==='account'){if(width<=820)await p.locator('#mobileMenu').click();await p.locator('.ca-student-row').click();await p.locator('#caAccountOverlay.open').waitFor();}
  await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await p.waitForTimeout(150);
  const data=await p.evaluate(selectors=>{
   function bg(el){for(let e=el;e;e=e.parentElement){const c=getComputedStyle(e).backgroundColor;if(c!=='rgba(0, 0, 0, 0)')return c;}return 'rgb(255, 255, 255)'}
   const read=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {text:el.textContent.trim().slice(0,100),font:parseFloat(s.fontSize),lineHeight:s.lineHeight,color:s.color,background:bg(el),width:r.width,top:r.top,height:r.height}};
   return {samples:Object.fromEntries(selectors.map(s=>[s,document.querySelector(s)?read(document.querySelector(s)):null])),nav:read(document.querySelector('.ca-tutor-nav')||document.body),overflow:document.documentElement.scrollWidth>innerWidth,
    dialogOverflow:document.querySelector('#gcPracticeOverlay.open')?.scrollWidth>innerWidth,
    readingTop:document.querySelector('.gc-reading')?.getBoundingClientRect().top,
    wrongHome:location.pathname==='/courses'&&!!document.querySelector('[data-ca-tutor-route="/dashboard"].active'),
    rules:[...document.styleSheets].flatMap(sheet=>{try{return [...sheet.cssRules].filter(r=>r.selectorText&&selectors.some(s=>document.querySelector(s)?.matches(r.selectorText))).map(r=>({source:sheet.href,selector:r.selectorText,css:r.style.cssText})).slice(-10)}catch{return []}})};
  },samples[name]);
  let violations=[];
  if(process.env.VISUAL_AXE_ALL==='1'||[1440,390].includes(width)){
   await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   violations=await p.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))}))});
  }
  if(process.env.VISUAL_SHOTS==='all'||[2048,1440,390].includes(width)){await p.screenshot({path:path.join(out,`${name}-${width}.png`),fullPage:true});if(name==='resources')await p.locator('.ca-lesson-more').screenshot({path:path.join(out,`${name}-${width}-cards.png`)});}
  results.push({name,width,zoomEquivalent:width===720?200:width===360?400:100,...data,violations,errors});
  if(!baseline){
   if(data.overflow||data.dialogOverflow)failures.push(`${name} ${width}: horizontal overflow`);
   if(errors.length)failures.push(`${name} ${width}: ${errors.join('; ')}`);
   if(data.wrongHome)failures.push('Courses incorrectly highlights Home');
   for(const [selector,m] of Object.entries(data.samples))if(m&&m.font<12)failures.push(`${name} ${width}: ${selector} ${m.font}px`);
   if(name==='learn'&&width<=390&&data.readingTop>750)failures.push(`Learn ${width}: reading starts at ${data.readingTop}`);
   for(const v of violations)failures.push(`${name} ${width}: axe ${v.id} (${v.nodes.length})`);
  }
  await context.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
fs.writeFileSync(path.join(out,'measurements.json'),JSON.stringify(results,null,2));
fs.writeFileSync(path.join(out,'failures.json'),JSON.stringify(failures,null,2));
console.log(JSON.stringify({states:results.length,failures},null,2));
assert.equal(failures.length,0,'See visual artifacts for layout/accessibility failures');
})().catch(e=>{console.error(e);process.exitCode=1});
