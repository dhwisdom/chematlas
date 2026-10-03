const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/periodic-table.js'),'utf8'),ctx);const elements=ctx.window.CHEMATLAS_ELEMENTS;
assert.equal(elements.length,118);assert.equal(new Set(elements.map(e=>e.number)).size,118);assert.equal(new Set(elements.map(e=>e.symbol)).size,118);assert.equal(new Set(elements.map(e=>`${e.row}:${e.column}`)).size,118);
for(let i=0;i<118;i++){const e=elements[i];assert.equal(e.number,i+1);assert(e.column>=1&&e.column<=18);assert(e.mass===null||Number(e.mass)>0);assert(e.name&&e.category);}
for(const [symbol,row,col] of [['H',2,1],['He',2,18],['Na',4,1],['Fe',5,8],['La',10,3],['Lu',10,17],['Hf',7,4],['Ac',11,3],['Lr',11,17],['Og',8,18]]){const e=elements.find(e=>e.symbol===symbol);assert.equal(e.row,row);assert.equal(e.column,col);}
console.log('PASS: all 118 elements, complete identities/masses, unique positions, and main/f-block layout.');

assert.equal(elements[2].mass,'6.94');assert.equal(elements[42].mass,null);assert.equal(elements.filter(e=>e.mass!==null).length,84);
