const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const store=require('../content-store.js');
const context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/genchem.js'),'utf8'),context);
const modules=context.window.CHEM_GENCHEM.modules;
test('all bundled modules remain compatible',()=>{
 assert.equal(modules.length,19);
 for(const m of modules)assert.equal(store.validateModule(m),'',m.id);
});
test('malformed lesson data cannot replace bundled content',()=>{
 const m=JSON.parse(JSON.stringify(modules[0]));
 for(const patch of [{sections:[]},{sections:[{title:'A',body:'not an array'}]},{check:{...m.check,answer:99}},{semester:3},{id:'../tutor'},{example:{steps:[]}}])assert.notEqual(store.validateModule({...m,...patch}),'');
});
test('navigation retains every route and never accepts arbitrary targets',()=>{
 const nav=store.normalizeNavigation({items:[{id:'tutor',label:'Get help',route:'https://bad.test'},{id:'tutor',label:'duplicate'},{id:'unknown',label:'bad'}]});
 assert.equal(nav.length,6);assert.equal(new Set(nav.map(x=>x.id)).size,6);
 assert.equal(nav[0].label,'Get help');assert.equal(nav[0].route,'/tutor');
});
test('published edits preserve module IDs and fall back on malformed payloads',async()=>{
 global.CHEM_GENCHEM=JSON.parse(JSON.stringify(context.window.CHEM_GENCHEM));
 global.CHEMATLAS_CONFIG={supabaseUrl:'https://example.test',supabasePublishableKey:'test'};
 const original=JSON.parse(JSON.stringify(modules[0]));
 global.fetch=async()=>({ok:true,json:async()=>[{key:'module:measurement',payload:{...original,title:'Updated lesson'}}]});
 await store.refresh();assert.equal(global.CHEM_GENCHEM.modules.length,19);assert.equal(global.CHEM_GENCHEM.modules[0].id,'measurement');assert.equal(global.CHEM_GENCHEM.modules[0].title,'Updated lesson');
 global.fetch=async()=>({ok:true,json:async()=>[{key:'module:measurement',payload:{id:'measurement'}}]});
 await store.refresh();assert.equal(global.CHEM_GENCHEM.modules[0].title,original.title);
});
