const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('assert/strict');
const base=require('path').resolve(__dirname,'..')+'/';
const dom=new JSDOM('<button data-periodic-open>Periodic table</button><button id="selected" aria-pressed="true">Answer B</button>',{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window,d=w.document;
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
for(const file of ['data/periodic-table.js','periodic-table.js'])w.eval(fs.readFileSync(base+file,'utf8'));
d.querySelector('[data-periodic-open]').click();assert.equal(d.querySelectorAll('.pt-element').length,118);assert(d.querySelector('#caPeriodicTable').open);
function search(id,value){const el=d.querySelector(id);el.value=value;el.dispatchEvent(new w.Event('input'));}
search('#ptSearch','26');assert.equal(d.querySelectorAll('#ptResults button').length,1);d.querySelector('#ptResults button').click();assert(d.querySelector('#ptDetail').textContent.includes('Iron(III): Fe³⁺'));
search('#ptSearch','chlorine');assert.equal(d.querySelector('#ptResults button').dataset.element,'Cl');search('#ptSearch','not-an-element');assert(d.querySelector('#ptResults').textContent.includes('No matching'));
search('#ptIonSearch','NH4');assert.equal(d.querySelectorAll('#ptIons tr').length,1);assert(d.querySelector('#ptIons').textContent.includes('Ammonium'));
d.querySelector('#ptSearch').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert(!d.querySelector('#caPeriodicTable').open);assert.equal(d.activeElement,d.querySelector('[data-periodic-open]'));assert.equal(d.querySelector('#selected').getAttribute('aria-pressed'),'true');
d.querySelector('[data-periodic-open]').click();assert.equal(d.querySelectorAll('#caPeriodicTable').length,1);console.log('PASS: modal, search by number/name, no results, iron naming, polyatomic formula search, focus restoration, answer preservation, and reuse.');
