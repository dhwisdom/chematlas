'use strict';
// CSS cascade contracts, not rendered layout evidence. Browser test:mobile checks pixel bounds.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<style>'+fs.readFileSync('chematlas-tutoring.css','utf8')+'</style>');
function property(selector,name,width){
 let value='';
 function walk(rules){for(const rule of rules){
  if(rule.media){
   const condition=rule.conditionText||rule.media.mediaText;
   const max=condition.match(/^\(max-width:\s*(\d+)px\)$/),min=condition.match(/^\(min-width:\s*(\d+)px\)$/);
   if((max&&width<=Number(max[1]))||(min&&width>=Number(min[1])))walk(rule.cssRules);
  }else if(rule.selectorText?.split(',').some(item=>item.trim()===selector)){
   const declaration=rule.style.getPropertyValue(name);if(declaration)value=declaration.trim();
  }
 }}
 walk(dom.window.document.styleSheets[0].cssRules);return value;
}
test('dashboard responsive columns override their desktop minimum-width rule',()=>{
 for(const width of [320,390,430,768,820,821,1100])assert.equal(property('.ca-home-grid','grid-template-columns',width),'minmax(0,1fr)',`dashboard at ${width}px`);
 assert.equal(property('.ca-home-grid','grid-template-columns',1440),'minmax(0,1.13fr) minmax(310px,.87fr)','desktop remains two columns');
});
test('Continue lesson card keeps one shrinkable column on phone widths',()=>{
 for(const width of [320,390,430,768,820])assert.equal(property('.ca-continue','grid-template-columns',width),'minmax(0,1fr)',`Continue card at ${width}px`);
 assert.equal(property('.ca-continue','grid-template-columns',1440),'minmax(0,1.12fr) minmax(270px,.88fr)','desktop card remains two columns');
});
test('responsive search is moved, not hidden before its focus can be recovered',()=>{
 for(const width of [320,390,820,821,1440])assert.notEqual(property('.ca-top-search','display',width),'none',`search must remain focusable before relocation at ${width}px`);
});
