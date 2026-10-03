/* Gallery → canvas → properties, adapted from WebCenter 25.03. */
(() => {
 const c=window.ChemAtlasContent;
 const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[x]));
 let selected=0,drag=null;
 const routeOptions=value=>c.destinations.map(d=>`<option value="${d.route}" ${value===d.route?'selected':''}>${esc(d.label)}</option>`).join('');
 function fields(key,doc){
  const nav=key==='navigation',items=nav?doc.items:doc.blocks;
  selected=Math.min(selected,items.length-1);const item=items[selected];
  return `<div class="builder-layout"><section class="editor-card builder-gallery"><p class="eyebrow">1 · GALLERY</p><h3>${nav?'Add a shortcut':'Add a block'}</h3><p class="hint">${nav?'All six learning tabs stay available. Add shortcuts to other ChemWaypoint areas.':'Arrange existing learning widgets or add your own content.'}</p>${nav?c.destinations.map(d=>`<button type="button" data-add-route="${d.route}">＋ ${esc(d.label)}</button>`).join(''):'<button type="button" data-add-block="text">＋ Announcement</button><button type="button" data-add-block="shortcut">＋ Learning shortcut</button>'}<button type="button" id="resetLayout">Restore default layout</button></section><section class="editor-card builder-canvas"><p class="eyebrow">2 · ${nav?'MENU':'DASHBOARD'} CANVAS</p><h3>${nav?'Learning navigation':'Home dashboard'}</h3>${!nav?`<label>Columns<select name="columns"><option value="2" ${doc.columns===2?'selected':''}>Two columns</option><option value="1" ${doc.columns===1?'selected':''}>One column</option></select></label>`:''}<p class="hint">Drag to reorder, or use the arrow buttons. Select an item to edit its properties.</p><div class="canvas-list ${nav?'':'block-canvas'}" data-columns="${doc.columns||1}">${items.map((x,i)=>`<div class="canvas-item ${selected===i?'selected':''}" draggable="true" data-canvas-index="${i}" data-width="${x.width||'full'}"><button type="button" class="canvas-select" data-select-item="${i}" aria-pressed="${selected===i}"><span aria-hidden="true">⠿</span><span><strong>${esc(x.label)}</strong><small>${nav?esc(x.route||'Practice Lab'):x.hidden?'Hidden from dashboard':x.width==='half'?'Half width':'Full width'}</small></span></button><div class="canvas-arrows"><button type="button" data-move-item="${i}" data-direction="-1" aria-label="Move ${esc(x.label)} up" ${i===0?'disabled':''}>↑</button><button type="button" data-move-item="${i}" data-direction="1" aria-label="Move ${esc(x.label)} down" ${i===items.length-1?'disabled':''}>↓</button></div></div>`).join('')}</div></section><section class="editor-card builder-properties"><p class="eyebrow">3 · PROPERTIES</p><h3>${esc(item.label)}</h3><label>${nav?'Tab label':'Block label'}<input name="item-label" maxlength="${nav?40:100}" value="${esc(item.label)}" ${!nav&&!item.type?'readonly':''}></label>${!nav&&!item.type?'<p class="hint">This widget uses live learner information. Its content is managed by ChemWaypoint.</p>':''}${nav&&item.id.startsWith('custom-')||!nav&&item.type==='shortcut'?`<label>Destination<select name="item-route">${routeOptions(item.route)}</select></label>`:''}${!nav?`<label>Width<select name="item-width"><option value="full" ${item.width==='full'?'selected':''}>Full row</option><option value="half" ${item.width==='half'?'selected':''}>Half row</option></select></label><label class="check-label"><input name="item-visible" type="checkbox" ${!item.hidden?'checked':''} ${item.id==='continue'?'disabled':''}> Show on dashboard</label>${item.id==='continue'?'<small>Continue learning remains available.</small>':''}${item.type?`<label>Content<textarea name="item-body" rows="5" maxlength="4000">${esc(item.body||'')}</textarea></label>`:''}`:''}${item.id.startsWith('custom-')?'<button type="button" id="removeItem">Remove this item</button>':''}<p class="hint">Changes stay in your draft until published.</p></section></div>`;
 }
 function collect(key,doc){
  const f=document.getElementById('documentForm');if(!f)return;
  const nav=key==='navigation',item=(nav?doc.items:doc.blocks)[selected];if(!item)return;
  const value=name=>f.elements.namedItem(name)?.value;
  if(value('item-label')!==undefined)item.label=value('item-label').trim();
  if(value('item-route'))item.route=value('item-route');
  if(!nav){doc.columns=Number(value('columns')||doc.columns);item.width=value('item-width')||item.width;item.hidden=item.id==='continue'?false:!f.elements.namedItem('item-visible')?.checked;if(value('item-body')!==undefined)item.body=value('item-body');}
 }
 function bind(key,doc,redraw){
  const nav=key==='navigation',items=nav?doc.items:doc.blocks;
  const mutate=fn=>{collect(key,doc);fn();redraw();};
  document.querySelectorAll('[data-select-item]').forEach(b=>b.onclick=()=>{collect(key,doc);selected=Number(b.dataset.selectItem);redraw(false);});
  function move(from,to){if(to<0||to>=items.length)return;mutate(()=>{const [x]=items.splice(from,1);items.splice(to,0,x);selected=to;});}
  document.querySelectorAll('[data-move-item]').forEach(b=>b.onclick=()=>move(Number(b.dataset.moveItem),Number(b.dataset.moveItem)+Number(b.dataset.direction)));
  document.querySelectorAll('[data-canvas-index]').forEach(row=>{
   row.ondragstart=e=>{drag=Number(row.dataset.canvasIndex);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(drag));};
   row.ondragover=e=>e.preventDefault();row.ondragend=()=>drag=null;
   row.ondrop=e=>{e.preventDefault();if(drag!==null)move(drag,Number(row.dataset.canvasIndex));drag=null;};
  });
  const add=x=>{if(items.length>=20)return;mutate(()=>{items.push({id:'custom-'+crypto.randomUUID(),...x});selected=items.length-1;});};
  document.querySelectorAll('[data-add-route]').forEach(b=>b.onclick=()=>add({label:c.destinations.find(d=>d.route===b.dataset.addRoute).label,route:b.dataset.addRoute,icon:'↗'}));
  document.querySelectorAll('[data-add-block]').forEach(b=>b.onclick=()=>add({type:b.dataset.addBlock,label:b.dataset.addBlock==='text'?'Announcement':'Learning shortcut',body:'',route:'/genchem',width:'half',hidden:false}));
  document.getElementById('removeItem')?.addEventListener('click',()=>mutate(()=>{items.splice(selected,1);selected=Math.max(0,selected-1);}));
  document.getElementById('resetLayout').onclick=()=>{if(confirm('Replace this layout with the default? It will remain a draft until published.'))mutate(()=>{if(nav)doc.items=structuredClone(c.defaults);else Object.assign(doc,structuredClone(c.dashboardDefaults));selected=0;});};
 }
 function preview(key,doc){return key==='navigation'?`<section class="preview"><p class="preview-label">Menu preview · draft</p><div class="menu-preview">${doc.items.map(x=>`<span>${esc(x.label)}</span>`).join('')}</div></section>`:`<section class="preview"><p class="preview-label">Dashboard preview · draft layout</p><div class="dashboard-preview" data-columns="${doc.columns}">${doc.blocks.filter(b=>!b.hidden).map(b=>`<article data-width="${b.width}"><h3>${esc(b.label)}</h3><p>${b.type?esc(b.body):'Live learner widget'}</p>${b.type==='shortcut'?`<span>Open ${esc(c.destinations.find(d=>d.route===b.route)?.label||'Learn')} →</span>`:''}</article>`).join('')}</div></section>`;}
 window.ChemAtlasDesign={fields,collect,bind,preview};
})();
