const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const base=require('path').resolve(__dirname,'..')+'/';
const dom=new JSDOM('<body><aside class="sidebar"><div class="nav-list"></div></aside><button class="genchem-nav" data-genchem-open>Learn</button><section id="genchemView" class="view active-view"><div id="genchemApp"></div></section><section id="caTutorView"></section></body>',{url:'https://example.test/genchem/measurement',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document,errors=[];w.addEventListener('error',e=>errors.push(e.error));w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
const run=f=>w.eval(fs.readFileSync(base+f,'utf8')),wait=()=>new Promise(r=>setTimeout(r,80)),click=s=>{assert(d.querySelector(s),s);d.querySelector(s).click();};
(async()=>{
 w.localStorage.setItem('chematlas-genchem-completed-v1','["atoms-moles"]');
 for(const f of ['data/genchem.js','data/concept-checks.js','assessment.js','task-views.js','genchem.js','chematlas-tutoring.js'])run(f);
 w.ChemAtlasViews.setAccount(null);await wait();
 assert(d.querySelector('.ca-focus-shell'));assert.equal(d.querySelectorAll('.ca-focus-panel:not([hidden])').length,1);
 click('.ca-focus-next');await wait();assert.equal(d.querySelector('.ca-focus-count b').textContent,'2');
 click('[data-module="formulas"]');await wait();assert(d.querySelector('.ca-guest-gate'));assert(!d.querySelector('.gc-reading'));
 w.ChemAtlasViews.setAccount({user:{id:'learner'}},[]);await wait();assert(!d.querySelector('.ca-guest-gate'));assert(d.querySelector('.gc-reading'));
 click('[data-module="measurement"]');await wait();assert.equal(d.querySelector('.ca-focus-count b').textContent,'2');
 const steps=d.querySelectorAll('[data-focus-index]');steps[steps.length-1].click();click('[data-check-start]');
 click('[data-choice="0"]');click('#gcCheckAnswer');assert(d.querySelector('.gc-feedback.bad'));assert(d.querySelector('.ca-check-revisit'));assert([...d.querySelectorAll('[data-choice]')].every(b=>b.disabled));
 click('[data-fresh-question]');assert(d.querySelector('.gc-check').textContent.includes('EXTRA REINFORCEMENT'));click('[data-choice="0"]');click('#gcCheckAnswer');click('[data-check-next]');
 assert(d.querySelector('.gc-check').textContent.includes('CHECK 2 OF 5'));
 // Resume an unfinished set after leaving and returning, with no duplicate evidence.
 const count=w.ChemAtlasAssessment.events().length;click('[data-module="atoms-moles"]');click('[data-module="measurement"]');await wait();assert(d.querySelector('.gc-check').textContent.includes('CHECK 2 OF 5'));assert.equal(w.ChemAtlasAssessment.events().length,count);
 const m=w.CHEM_GENCHEM.modules[0],questions=w.ChemAtlasAssessment.questions(m);
 for(let i=1;i<5;i++){click('[data-choice="'+questions[i].answer+'"]');click('#gcCheckAnswer');click('[data-check-next]');}
 await wait();assert(d.querySelector('.gc-check').textContent.includes('4 of 5 correct'));assert.equal(d.querySelector('.ca-focus-next').hidden,false);assert(w.ChemAtlasAssessment.summarize(m.id).complete);assert(!w.ChemAtlasAssessment.summarize(m.id).mastered);assert(JSON.parse(w.localStorage.getItem('chematlas-genchem-completed-v1')).includes('atoms-moles'));
 for(const module of w.CHEM_GENCHEM.modules){const btn=d.querySelector('.genchem-nav');btn.dataset.genchemModule=module.id;btn.click();await wait();assert.equal(d.querySelectorAll('.gc-reading').length,module.sections.length,module.id);assert.equal(d.querySelectorAll('.ca-focus-panel:not([hidden])').length,1,module.id);assert.equal(d.querySelector('.gc-example-answer strong').textContent,module.example.answer);}
 run('genchem-tools.js');assert.equal(d.querySelectorAll('.gc-tool-tab').length,7);
 w.ChemAtlasViews.setAccount({user:{id:'owner'}},['menus','content','access']);assert(d.querySelector('#caTaskView option[value="admin"]'));w.ChemAtlasViews.setAccount({user:{id:'learner'}},[]);assert(!d.querySelector('#caTaskView option[value="admin"]'));
 assert.equal(errors.length,0,errors.map(String).join('\n'));console.log('PASS: guest gate, signed-in unlock, resume, first-attempt locking, remediation, completion without mastery, all 19 lessons and seven tools preserved, role-based view options.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
