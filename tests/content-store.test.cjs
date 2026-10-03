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

test('custom navigation only accepts known ChemAtlas destinations',()=>{
 const nav=store.normalizeNavigation({items:[{id:'custom-organic',label:'Organic',route:'/organic'},{id:'custom-unsafe',label:'Unsafe',route:'javascript:alert(1)'}]});
 assert.equal(nav.length,7);assert.equal(nav[0].route,'/organic');assert(!nav.some(x=>x.id==='custom-unsafe'));
});
test('dashboard keeps continue learning and rejects unsupported blocks and destinations',()=>{
 const layout=store.normalizeDashboard({columns:99,blocks:[{id:'continue',hidden:true},{id:'custom-hello',type:'shortcut',label:'Hello',route:'https://bad.test',width:'bogus'},{id:'custom-bad',type:'script'}]});
 assert.equal(layout.columns,2);assert.equal(layout.blocks.length,2);assert.equal(layout.blocks[0].hidden,false);assert.equal(layout.blocks[1].route,'/genchem');assert.equal(layout.blocks[1].width,'full');
 assert.equal(store.normalizeDashboard({blocks:[]}).blocks[0].id,'continue');
});
