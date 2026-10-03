(() => {
  'use strict';
  const root=document.getElementById('adminApp');
  const content=window.ChemAtlasContent;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const clone=v=>JSON.parse(JSON.stringify(v));
  const lines=v=>String(v||'').split('\n').map(x=>x.trim()).filter(Boolean);
  const base=new Map(window.CHEM_GENCHEM.modules.map(m=>[m.id,clone(m)]));
  let cloud,user=null,authorizedId=null,authEpoch=0,drafts=new Map(),published=new Map();
  let key='navigation',doc=null,dirty=false,busy=false,historyRows=[],dragIndex=null;
  const status=(message,type='')=>{const el=document.getElementById('editorStatus')||document.getElementById('authStatus');if(el){el.textContent=message;el.className='status '+type;}};
  const isModule=()=>key.startsWith('module:');
  const field=(name,label,value,wide=false)=>`<label class="${wide?'wide':''}">${esc(label)}<input name="${name}" value="${esc(value)}"></label>`;
  const area=(name,label,value,rows=3)=>`<label>${esc(label)}<textarea name="${name}" rows="${rows}">${esc(value)}</textarea></label>`;
  function unsaved(){return !dirty||window.confirm('Leave this editor and discard unsaved changes? Saved drafts are kept.');}
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});

  function authScreen(message=''){
    authorizedId=null;doc=null;dirty=false;document.getElementById('signOut').hidden=!user;
    if(user){
      root.innerHTML=`<section class="auth-card"><h1>Admin access is not assigned yet</h1><p class="account-email">Signed in as <strong>${esc(user.email)}</strong>.</p><p>This account can use the learning site. To enable editing, have the site owner assign this verified account an admin role.</p><button id="retryAccess">Check access again</button><p id="authStatus" role="status">${esc(message)}</p><p><a href="/genchem">Return to Learn</a></p></section>`;
      document.getElementById('retryAccess').onclick=()=>checkAccess(true);return;
    }
    root.innerHTML=`<section class="auth-card"><h1>Manage your ChemAtlas site</h1><p>Sign in to rearrange navigation and edit learning content. A new account needs an admin role before it can edit.</p><form id="adminAuth"><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" minlength="8" autocomplete="current-password" required></label><div class="auth-actions"><button class="primary" type="submit">Sign in</button><button type="button" id="createAccount">Create account</button></div><p id="authStatus" role="status">${esc(message)}</p></form></section>`;
    const form=document.getElementById('adminAuth');
    async function authenticate(signup){
      if(!form.reportValidity())return;
      form.querySelectorAll('button').forEach(b=>b.disabled=true);status(signup?'Creating your account…':'Signing in…');
      try{
        const email=form.elements.email.value.trim(),password=form.elements.password.value;
        const result=signup?await cloud.auth.signUp({email,password,options:{emailRedirectTo:`${location.origin}/admin`}}):await cloud.auth.signInWithPassword({email,password});
        if(result.error)throw result.error;
        if(signup&&!result.data.session){status('Check your email to confirm your account, then return here to sign in.');form.elements.password.value='';}
        else await checkAccess(true);
      }catch(error){status(error.message||'Sign-in failed. Please retry.','error');}
      finally{form.querySelectorAll('button').forEach(b=>b.disabled=false);}
    }
    form.onsubmit=e=>{e.preventDefault();authenticate(false);};
    document.getElementById('createAccount').onclick=()=>authenticate(true);
  }
  async function checkAccess(force=false){
    const epoch=++authEpoch;
    try{
      const {data,error}=await cloud.auth.getSession();if(error)throw error;
      if(epoch!==authEpoch)return;
      user=data.session?.user||null;
      if(!user){authScreen();return;}
      if(!force&&authorizedId===user.id)return;
      const role=await cloud.from('site_admins').select('user_id').eq('user_id',user.id).maybeSingle();
      if(epoch!==authEpoch)return;
      if(role.error)throw role.error;
      if(!role.data){authScreen();return;}
      authorizedId=user.id;document.getElementById('signOut').hidden=false;
      await loadDocuments();
      if(epoch!==authEpoch)return;
      await selectDocument('navigation',false);
    }catch(error){if(epoch===authEpoch)authScreen('Could not check admin access. '+(error.message||'Please retry.'));}
    finally{root.setAttribute('aria-busy','false');}
  }
  async function loadDocuments(){
    const [d,p]=await Promise.all([cloud.from('site_drafts').select('key,payload,version,updated_at'),cloud.from('site_published').select('key,payload,version,published_at')]);
    if(d.error)throw d.error;if(p.error)throw p.error;
    drafts=new Map((d.data||[]).map(r=>[r.key,r]));published=new Map((p.data||[]).map(r=>[r.key,r]));
  }
  function lessonItems(){
    const items=new Map([...base].map(([id,m])=>['module:'+id,m]));
    for(const [k,r] of published)if(k.startsWith('module:'))items.set(k,r.payload);
    for(const [k,r] of drafts)if(k.startsWith('module:'))items.set(k,r.payload);
    return [...items].sort((a,b)=>a[1].semester-b[1].semester||a[1].number-b[1].number);
  }
  async function selectDocument(next,ask=true){
    if(busy||ask&&!unsaved())return;
    key=next;dirty=false;
    doc=clone(drafts.get(key)?.payload||published.get(key)?.payload||(key==='navigation'?{items:content.defaults}:base.get(key.slice(7))));
    if(key==='navigation')doc={items:content.normalizeNavigation(doc)};
    historyRows=[];render();
    const result=await cloud.from('site_revisions').select('key,version,payload,published_at').eq('key',key).order('version',{ascending:false}).limit(20);
    if(key!==next)return;
    if(result.error){status('Editor loaded, but version history could not be retrieved.','error');return;}
    historyRows=result.data||[];renderHistory();
  }
  function rail(){return `<aside class="editor-rail"><h1>Manage site</h1><p class="account-email">${esc(user.email)}<br>Drafts are private until you publish.</p><button data-open="navigation" class="${key==='navigation'?'selected':''}">Navigation tabs</button><button id="newLesson">＋ Add Learn module</button><nav class="lesson-list" aria-label="Learn content">${lessonItems().map(([k,m])=>`<button data-open="${esc(k)}" class="${key===k?'selected':''}"><span>${String(m.number).padStart(2,'0')} · ${esc(m.title)}</span><small>Gen Chem ${m.semester===2?'II':'I'} · ${drafts.has(k)?'Draft saved':published.has(k)?'Published':'Original content'}</small></button>`).join('')}</nav></aside>`;}
  function render(){
    root.innerHTML=`<div class="workspace">${rail()}<section class="editor-main"><div class="editor-head"><div><h2>${isModule()?'Edit Learn module':'Arrange navigation'}</h2><p>${isModule()?'Keep the lesson ID unchanged so saved learner progress stays connected.':'Drag tabs into order, or use Move up and Move down. All existing learning tools remain available.'}</p></div><button id="reloadEditor">Reload saved version</button></div><form id="documentForm">${isModule()?moduleFields():navigationFields()}</form><div id="previewArea" hidden></div><div class="editor-actions"><p class="status" id="editorStatus" role="status">${drafts.has(key)?'Saved draft · Not automatically published':'Editing original or published content'}</p><button id="previewButton">Preview</button><button id="saveDraft">Save draft</button><button id="publishDraft" class="primary">Publish changes</button></div><details class="history editor-card"><summary>Published version history</summary><div id="historyList"></div></details></section></div>`;
    bindRail();renderHistory();bindForm();
    document.getElementById('reloadEditor').onclick=async()=>{if(!unsaved())return;try{await loadDocuments();await selectDocument(key,false);}catch(e){status(e.message,'error');}};
    document.getElementById('saveDraft').onclick=()=>persist(false);
    document.getElementById('publishDraft').onclick=()=>persist(true);
    document.getElementById('previewButton').onclick=preview;
  }
  function bindRail(){
    root.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>selectDocument(b.dataset.open));
    document.getElementById('newLesson').onclick=()=>{if(!busy&&unsaved())newLesson();};
  }
  function navigationFields(){return `<section class="editor-card"><h3>Sidebar tabs</h3><div id="navItems">${doc.items.map((item,i)=>`<div class="nav-row" draggable="true" data-nav-index="${i}"><span class="drag-handle" aria-hidden="true">⠿</span><label>${esc(content.defaults.find(d=>d.id===item.id).label)}<input name="nav-${i}" aria-label="Label for ${esc(item.id)} tab" maxlength="40" value="${esc(item.label)}" required></label><button type="button" data-nav-move="${i}" data-direction="-1" aria-label="Move ${esc(item.label)} up" ${i===0?'disabled':''}>Move up</button><button type="button" data-nav-move="${i}" data-direction="1" aria-label="Move ${esc(item.label)} down" ${i===doc.items.length-1?'disabled':''}>Move down</button></div>`).join('')}</div><p class="hint">Publishing changes the tab order for everyone. It does not change any lesson, tool, or learner progress.</p></section>`;}
  function moduleFields(){const m=doc;return `
    <section class="editor-card"><h3>Lesson overview</h3><div class="field-grid">
    <label>Lesson ID<input name="id" value="${esc(m.id)}" readonly></label>
    <label>Semester<select name="semester"><option value="1" ${m.semester===1?'selected':''}>General Chemistry I</option><option value="2" ${m.semester===2?'selected':''}>General Chemistry II</option></select></label>
    ${field('title','Title',m.title,true)}${field('subtitle','Short summary',m.subtitle,true)}
    <label>Module number<input type="number" name="number" min="1" max="999" value="${m.number}"></label>
    ${field('prerequisite','Builds on',m.prerequisite)}<div class="wide">${area('outcomes','Learning goals — one per line',m.outcomes.join('\n'))}</div></div></section>
    <section class="editor-card"><h3>Reading sections</h3><p class="hint">Each section becomes one step in Learn. Separate paragraphs with a blank line.</p><div id="sections">${m.sections.map((s,i)=>`<section class="section-editor"><div class="section-actions"><strong>Section ${i+1}</strong><button type="button" data-section-move="${i}" data-direction="-1" ${i===0?'disabled':''} aria-label="Move section ${i+1} up">Move up</button><button type="button" data-section-move="${i}" data-direction="1" ${i===m.sections.length-1?'disabled':''} aria-label="Move section ${i+1} down">Move down</button><button type="button" data-section-remove="${i}" ${m.sections.length===1?'disabled':''}>Remove section ${i+1}</button></div>${field('section-title-'+i,'Heading',s.title)}${area('section-body-'+i,'Explanation',s.body.join('\n\n'),5)}</section>`).join('')}</div><button type="button" id="addSection">＋ Add reading section</button></section>
    <section class="editor-card stack"><h3>Relationships and worked example</h3>${area('equations','Equations — one per line: label | expression',m.equations.map(e=>e.label+' | '+e.expression).join('\n'))}${area('example-prompt','Worked example question',m.example.prompt)}${area('example-steps','Solution steps — one per line',m.example.steps.join('\n'),5)}${area('example-answer','Worked example answer',m.example.answer,2)}</section>
    <section class="editor-card stack"><h3>Check understanding</h3>${area('check-question','Quick check question',m.check.question)}${area('check-choices','Answer choices — one per line (2–6)',m.check.choices.join('\n'),5)}<label>Correct choice number<input type="number" min="1" max="6" name="check-answer" value="${m.check.answer+1}"></label>${area('check-explanation','Feedback explanation',m.check.explanation)}</section>
    <section class="editor-card stack"><h3>Connections and vocabulary</h3>${area('vocabulary','Vocabulary — one term per line',m.vocabulary.join('\n'))}${area('lab','Lab connection (optional)',m.lab||'')}${field('bridge-course','Later topic or course',m.bridge.course)}${area('bridge-text','How this lesson connects',m.bridge.text)}${m.tool?`<p class="hint">Existing interactive tool preserved: ${esc(m.tool.label)}.</p>`:''}</section>`;}
  function collect(){
    const f=document.getElementById('documentForm');if(!f)return doc;
    const v=name=>f.elements.namedItem(name)?.value.trim()||'';
    if(!isModule()){doc.items.forEach((x,i)=>x.label=v('nav-'+i));return doc;}
    doc={...doc,title:v('title'),subtitle:v('subtitle'),semester:Number(v('semester')),number:Number(v('number')),prerequisite:v('prerequisite'),outcomes:lines(v('outcomes')),
      sections:doc.sections.map((_,i)=>({title:v('section-title-'+i),body:v('section-body-'+i).split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)})),
      equations:lines(v('equations')).map(line=>{const split=line.indexOf('|');return {label:split<0?'':line.slice(0,split).trim(),expression:split<0?line:line.slice(split+1).trim()};}),
      example:{prompt:v('example-prompt'),steps:lines(v('example-steps')),answer:v('example-answer')},
      check:{question:v('check-question'),choices:lines(v('check-choices')),answer:Number(v('check-answer'))-1,explanation:v('check-explanation')},
      vocabulary:lines(v('vocabulary')),lab:v('lab'),bridge:{course:v('bridge-course'),text:v('bridge-text')}};
    return doc;
  }
  function changed(){dirty=true;status('Unsaved changes · Learners still see the published version.');document.getElementById('previewArea').hidden=true;}
  function rerenderChanged(){render();changed();}
  function move(list,from,to){if(to<0||to>=list.length)return;const [item]=list.splice(from,1);list.splice(to,0,item);}
  function bindForm(){
    document.getElementById('documentForm').addEventListener('input',changed);
    root.querySelectorAll('[data-nav-move]').forEach(b=>b.onclick=()=>{collect();const i=Number(b.dataset.navMove);move(doc.items,i,i+Number(b.dataset.direction));rerenderChanged();});
    root.querySelectorAll('[data-nav-index]').forEach(row=>{
      row.ondragstart=e=>{dragIndex=Number(row.dataset.navIndex);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(dragIndex));row.classList.add('dragging');};
      row.ondragover=e=>e.preventDefault();row.ondragend=()=>{dragIndex=null;row.classList.remove('dragging');};
      row.ondrop=e=>{e.preventDefault();if(dragIndex===null)return;collect();move(doc.items,dragIndex,Number(row.dataset.navIndex));dragIndex=null;rerenderChanged();};
    });
    root.querySelectorAll('[data-section-move]').forEach(b=>b.onclick=()=>{collect();const i=Number(b.dataset.sectionMove);move(doc.sections,i,i+Number(b.dataset.direction));rerenderChanged();});
    root.querySelectorAll('[data-section-remove]').forEach(b=>b.onclick=()=>{collect();if(doc.sections.length<=1)return;doc.sections.splice(Number(b.dataset.sectionRemove),1);rerenderChanged();});
    const add=document.getElementById('addSection');if(add)add.onclick=()=>{collect();doc.sections.push({title:'',body:['']});rerenderChanged();document.querySelector('[name="section-title-'+(doc.sections.length-1)+'"]').focus();};
  }
  function validation(){
    if(isModule())return content.validateModule(doc);
    if(doc.items.length!==content.defaults.length || new Set(doc.items.map(x=>x.id)).size!==content.defaults.length)return 'Keep all six existing tabs.';
    if(doc.items.some(x=>!x.label.trim()||x.label.length>40))return 'Every tab needs a label of 1–40 characters.';
    return '';
  }
  async function persist(publish){
    if(busy)return;collect();
    // Incomplete lessons may be saved privately; only complete lessons may go live.
    if(publish){const error=validation();if(error){status(error,'error');return;}}
    if(JSON.stringify(doc).length>240000){status('This lesson is too large. Split it into smaller modules.','error');return;}
    busy=true;root.querySelectorAll('button,input,textarea,select').forEach(e=>e.disabled=true);status(publish?'Saving and publishing…':'Saving draft…');
    const activeKey=key;
    try{
      const saved=await cloud.rpc('save_site_draft',{p_key:key,p_payload:doc,p_expected:drafts.get(key)?.version||0});if(saved.error)throw saved.error;
      drafts.set(key,{key,payload:clone(doc),version:saved.data});dirty=false;
      if(publish){
        const live=await cloud.rpc('publish_site_draft',{p_key:key,p_expected_draft:saved.data,p_expected_live:published.get(key)?.version||0});if(live.error)throw live.error;
        published.set(key,{key,payload:clone(doc),version:live.data});
      }
      await selectAfterSave(activeKey);
      status(publish?'Published. Learners will see this version when they open or refresh the site.':'Draft saved. The live site is unchanged.','success');
    }catch(error){status(error.message||'Could not save. Your changes are still in the editor.','error');}
    finally{busy=false;root.querySelectorAll('button,input,textarea,select').forEach(e=>e.disabled=false);restoreBoundaryButtons();}
  }
  async function selectAfterSave(k){
    // Keep the editor responsive if history retrieval fails after a successful write.
    const result=await cloud.from('site_revisions').select('key,version,payload,published_at').eq('key',k).order('version',{ascending:false}).limit(20);
    historyRows=result.error?[]:result.data||[];render();
  }
  function restoreBoundaryButtons(){
    root.querySelectorAll('[data-nav-move],[data-section-move]').forEach(b=>{const nav=b.hasAttribute('data-nav-move'),i=Number(nav?b.dataset.navMove:b.dataset.sectionMove),to=i+Number(b.dataset.direction);b.disabled=to<0||to>=(nav?doc.items.length:doc.sections.length);});
    root.querySelectorAll('[data-section-remove]').forEach(b=>b.disabled=doc.sections.length===1);
  }
  function renderHistory(){
    const el=document.getElementById('historyList');if(!el)return;
    el.innerHTML=historyRows.length?historyRows.map((r,i)=>`<div class="history-row"><span>Version ${r.version} · ${new Date(r.published_at).toLocaleString()}</span><button data-restore="${i}">Load as draft</button></div>`).join(''):'<p class="empty">No published changes yet. Original course files remain intact.</p>';
    el.querySelectorAll('[data-restore]').forEach(b=>b.onclick=()=>{if(busy||!unsaved())return;doc=clone(historyRows[Number(b.dataset.restore)].payload);render();changed();status('Earlier version loaded. Save a draft or publish it when ready.');});
  }
  function preview(){
    collect();const error=validation();if(error){status(error,'error');return;}
    const el=document.getElementById('previewArea');el.hidden=false;
    if(!isModule()){el.innerHTML=`<section class="preview"><p class="preview-label">Navigation preview · not published</p><ol>${doc.items.map(x=>`<li>${esc(x.label)}</li>`).join('')}</ol></section>`;return;}
    const m=doc;
    el.innerHTML=`<article class="preview"><p class="preview-label">Lesson preview · not published</p><h2>${esc(m.title)}</h2><p>${esc(m.subtitle)}</p><p><strong>Builds on:</strong> ${esc(m.prerequisite)}</p><ul>${m.outcomes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${m.sections.map(s=>`<h3>${esc(s.title)}</h3>${s.body.map(p=>`<p>${esc(p)}</p>`).join('')}`).join('')}<h3>Key relationships</h3>${m.equations.map(e=>`<p>${esc(e.label)}: <strong>${esc(e.expression)}</strong></p>`).join('')}<h3>Worked example</h3><p>${esc(m.example.prompt)}</p><ol>${m.example.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p><strong>${esc(m.example.answer)}</strong></p><h3>Quick check</h3><p>${esc(m.check.question)}</p><ol type="A">${m.check.choices.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><details><summary>Answer and feedback</summary><p>${esc(m.check.choices[m.check.answer])}</p><p>${esc(m.check.explanation)}</p></details><h3>Connections</h3><p>${esc(m.lab)}</p><p><strong>${esc(m.bridge.course)}</strong> — ${esc(m.bridge.text)}</p><p>${m.vocabulary.map(esc).join(' · ')}</p></article>`;
    el.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function newLesson(){
    dirty=false;key='new';root.innerHTML=`<div class="workspace">${rail()}<section class="editor-main editor-card new-form"><h2>Add a Learn module</h2><p class="hint">Start a private draft. The module appears in Learn only after you publish it.</p><form id="newModule" class="stack"><label>Title<input name="title" required></label><label>Lesson ID<input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="80" placeholder="for example: limiting-reagents" required><small>Used in the lesson URL and progress records. It cannot be changed later.</small></label><label>Semester<select name="semester"><option value="1">General Chemistry I</option><option value="2">General Chemistry II</option></select></label><button class="primary">Start draft</button><p id="editorStatus" role="status"></p></form></section></div>`;bindRail();
    document.getElementById('newModule').oninput=()=>{dirty=true;};
    document.getElementById('newModule').onsubmit=e=>{
      e.preventDefault();const f=e.currentTarget,id=f.elements.slug.value.trim();
      if(base.has(id)||drafts.has('module:'+id)||published.has('module:'+id)){status('That lesson ID already exists. Choose another.','error');return;}
      key='module:'+id;doc={id,title:f.elements.title.value.trim(),semester:Number(f.elements.semester.value),number:Math.max(0,...lessonItems().map(([,m])=>m.number))+1,subtitle:'',prerequisite:'None',outcomes:[],sections:[{title:'',body:['']}],equations:[],example:{prompt:'',steps:[],answer:''},check:{question:'',choices:['',''],answer:0,explanation:''},vocabulary:[],lab:'',bridge:{course:'',text:''}};
      historyRows=[];render();changed();
    };
  }
  document.getElementById('signOut').onclick=async()=>{if(!unsaved())return;dirty=false;try{const r=await cloud.auth.signOut();if(r.error)throw r.error;user=null;authScreen();}catch(e){status(e.message,'error');}};
  (async()=>{
    try{cloud=await window.ChemAtlasCloud();cloud.auth.onAuthStateChange((_event,session)=>{if((session?.user?.id||null)!==authorizedId)setTimeout(()=>checkAccess(),0);});await checkAccess();}
    catch(e){root.innerHTML=`<section class="auth-card"><h1>Account service unavailable</h1><p>${esc(e.message)}</p><button id="retryConnection">Retry</button><p><a href="/genchem">Continue learning</a></p></section>`;document.getElementById('retryConnection').onclick=()=>location.reload();}
  })();
})();
