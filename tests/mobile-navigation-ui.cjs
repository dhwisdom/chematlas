'use strict';
// DOM behavior regression. Layout, native inert and touch rendering are checked separately in test:mobile.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const navigation=source.slice(source.indexOf("  const menu = document.getElementById('mobileMenu');"),source.indexOf('\n  renderDegreeMap();',source.indexOf("  const menu = document.getElementById('mobileMenu');")));
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'http://localhost/dashboard',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document,errors=[];
w.addEventListener('error',event=>errors.push(event.error));
const media={matches:true,listeners:[],addEventListener(type,fn){this.listeners.push(fn);}};
w.matchMedia=()=>media;
w.HTMLElement.prototype.checkVisibility=function(){return !(this.id==='mobileMenuClose'&&!media.matches)&&!this.hidden&&!this.closest('[hidden]');};
Object.defineProperty(w.HTMLElement.prototype,'inert',{get(){return this.hasAttribute('inert');},set(value){
 this.toggleAttribute('inert',Boolean(value));
 // Native inert can clear focus immediately; do not let jsdom conceal that ordering bug.
 if(value&&this.contains(d.activeElement))d.activeElement.blur();
}});
// jsdom has no native modal top layer. Browser tests verify that behavior.
const query=d.querySelector.bind(d);d.querySelector=selector=>selector==='dialog:modal'?null:query(selector);
const sidebar=d.querySelector('.sidebar'),menu=d.querySelector('#mobileMenu'),main=d.querySelector('.main'),close=d.querySelector('#mobileMenuClose'),backdrop=d.querySelector('#mobileMenuBackdrop');
sidebar.insertAdjacentHTML('beforeend','<button data-account-open>Account</button><details><summary>Task view</summary><select><option>Guest</option></select></details>');
const taskSummary=sidebar.querySelector('summary');
// Respect closed disclosure content in the test visibility shim.
sidebar.querySelector('select').hidden=true;
w.eval(navigation);
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const key=(key,shiftKey=false)=>d.dispatchEvent(new w.KeyboardEvent('keydown',{key,shiftKey,bubbles:true,cancelable:true}));
(async()=>{
 assert(sidebar.inert);assert.equal(main.inert,false);assert(backdrop.hidden);
 for(const dismiss of [()=>close.click(),()=>backdrop.click(),()=>key('Escape')]){
  menu.click();assert.equal(menu.getAttribute('aria-expanded'),'true');assert.equal(sidebar.inert,false);assert(main.inert);assert.equal(backdrop.hidden,false);assert(d.body.classList.contains('ca-nav-open'));assert.equal(sidebar.getAttribute('aria-modal'),'true');assert.equal(d.activeElement,close);
  close.focus();key('Tab',true);assert.equal(d.activeElement,taskSummary,'Shift+Tab includes native summary');
  taskSummary.focus();key('Tab');assert.equal(d.activeElement,close,'Tab wraps within drawer');
  dismiss();assert(sidebar.inert);assert.equal(main.inert,false);assert(backdrop.hidden);assert.equal(d.activeElement,menu);assert.equal(sidebar.hasAttribute('aria-modal'),false);
 }
 menu.click();w.history.pushState({},'', '/');w.dispatchEvent(new w.PopStateEvent('popstate'));await tick();assert(sidebar.inert);assert.equal(main.inert,false);assert.equal(menu.getAttribute('aria-expanded'),'false');
 for(const selector of ['[data-account-open]','[data-periodic-open]']){
  menu.click();let openAtAction;
  const button=sidebar.querySelector(selector);button.addEventListener('click',()=>{openAtAction=sidebar.classList.contains('open');},{once:true});button.click();assert.equal(openAtAction,false,'drawer closes before nested surface opens');assert.equal(main.inert,false);
 }
 menu.click();assert.equal(d.activeElement,close);media.matches=false;media.listeners.forEach(fn=>fn());assert.equal(d.activeElement,sidebar.querySelector('.nav-item.active'),'desktop breakpoint moves focus from hidden Close to active navigation');assert.equal(sidebar.inert,false);assert.equal(main.inert,false);assert(backdrop.hidden);assert.equal(sidebar.classList.contains('open'),false);
 media.matches=true;media.listeners.forEach(fn=>fn());assert(sidebar.inert);assert.equal(main.inert,false);assert.equal(d.activeElement,menu,'focus leaves sidebar before native inert clears it');
 menu.focus();media.matches=false;media.listeners.forEach(fn=>fn());assert.equal(d.activeElement,sidebar.querySelector('.nav-item.active'),'hidden menu trigger also receives desktop fallback');
 media.matches=true;media.listeners.forEach(fn=>fn());
 const tutoring=fs.readFileSync('chematlas-tutoring.js','utf8');
 const install=tutoring.slice(tutoring.indexOf('  function installSearch() {'),tutoring.indexOf('  function launchPractice('));
 w.eval(`{ const modules=()=>[{id:'measurement',title:'Measurement and uncertainty',subtitle:'Units',number:1}]; const esc=String; const navigate=path=>{history.pushState({},'',path);dispatchEvent(new PopStateEvent('popstate'));}; ${install} installSearch(); installSearch(); }`);
 assert.equal(d.querySelectorAll('.ca-top-search').length,1);
 const search=d.querySelector('.ca-top-search'),input=search.querySelector('input');
 assert.equal(search.parentElement,sidebar);menu.click();input.value='measurement';input.dispatchEvent(new w.Event('input'));
 assert(search.querySelector('[data-search-module]'));search.querySelector('[data-search-module]').click();await tick();assert.equal(w.location.pathname,'/genchem/measurement');assert(sidebar.inert);assert.equal(main.inert,false);
 menu.click();input.focus();media.matches=false;media.listeners.forEach(fn=>fn());assert.equal(search.parentElement,d.querySelector('.topbar'));assert.equal(d.activeElement,input,'search focus survives relocation to desktop header');
 media.matches=true;media.listeners.forEach(fn=>fn());assert.equal(search.parentElement,sidebar);assert.equal(d.querySelectorAll('.ca-top-search').length,1);assert.equal(d.activeElement,menu,'search moved into closed drawer returns focus to its opener');
 await tick();assert.deepEqual(errors,[]);console.log('PASS: mobile drawer close/backdrop/Escape, summary-inclusive focus wrap, route cleanup, nested surfaces and breakpoint cleanup.');dom.window.close();
})().catch(error=>{console.error(error);dom.window.close();process.exitCode=1;});
