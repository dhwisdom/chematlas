(() => {
  if (window.__CHEMATLAS_PLATFORM__) return;
  window.__CHEMATLAS_PLATFORM__ = true;

  const cfg = window.CHEMATLAS_CONFIG || {};
  const LS = {
    goal: 'chematlas-learning-goal-v1',
    history: 'chematlas-practice-history-v1',
    tutor: 'chematlas-tutor-history-v1',
    onboarded: 'chematlas-onboarded-v1',
    modules: 'chematlas-genchem-completed-v1',
    tools: 'chematlas-gc-tools-v1',
    vsepr: 'chematlas-vsepr-score',
    stereo: 'chematlas-organic-stereo',
    sn2: 'chematlas-organic-sn2'
  };
  const tracked = new Set([LS.modules, LS.tools, LS.vsepr, LS.stereo, LS.sn2]);
  const routeForView = { home:'/dashboard', curriculum:'/curriculum', courses:'/courses', lab:'/model-lab', organic:'/organic' };
  let cloud = null;
  let session = null;
  let syncing = false;

  const safeJson = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; }
  };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const words = (text) => new Set(String(text || '').toLowerCase().match(/[a-z0-9]+/g)?.filter(x => x.length > 2) || []);

  function recordActivity(key, value) {
    const labels = {
      [LS.modules]:'General Chemistry module mastery', [LS.tools]:'Foundation Practice Lab mastery',
      [LS.vsepr]:'VSEPR mastery check', [LS.stereo]:'R/S stereochemistry practice', [LS.sn2]:'SN2 mechanism practice'
    };
    const history = safeJson(LS.history, []);
    history.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, at:new Date().toISOString(), key, label:labels[key] || key, value });
    nativeSetItem.call(localStorage, LS.history, JSON.stringify(history.slice(0, 120)));
    if (session) queueCloudSync();
  }

  const nativeSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    const old = this === localStorage ? this.getItem(key) : null;
    nativeSetItem.call(this, key, value);
    if (this === localStorage && tracked.has(key) && old !== String(value)) recordActivity(key, String(value));
  };

  function addShell() {
    if (document.getElementById('caLandingView')) return;
    const main = document.querySelector('.main');
    if (!main) return;

    const landing = document.createElement('section');
    landing.id = 'caLandingView'; landing.className = 'view ca-custom-view ca-landing';
    landing.innerHTML = `
      <div class="ca-landing-nav"><button class="ca-wordmark" data-route="/"><span>C</span> ChemAtlas</button><div><button data-route="/curriculum">Curriculum</button><button data-route="/courses">Courses</button><button data-route="/tutor">AI Tutor</button><button class="ca-nav-cta" data-account-open>Create profile</button></div></div>
      <div class="ca-hero-wrap">
        <div class="ca-hero-copy"><p class="eyebrow">UNDERSTAND • MANIPULATE • PRACTICE • CONNECT</p><h1>Chemistry makes more sense when nothing is isolated.</h1><p>Build the foundations, see molecules in three dimensions, practice until the reasoning sticks, and carry each concept forward into organic chemistry, physical chemistry, analytical chemistry, and biochemistry.</p><div class="ca-hero-actions"><button class="primary-button" data-start-learning>Start learning</button><button class="secondary-button" data-route="/dashboard">Explore the dashboard</button></div><div class="ca-hero-proof"><span><b>19</b> Gen Chem modules</span><span><b>7</b> practice engines</span><span><b>3D</b> molecular tools</span><span><b>AI</b> guided tutoring</span></div></div>
        <div class="ca-orbit-scene" aria-hidden="true"><div class="ca-orbit-core">C</div><i></i><i></i><i></i><b class="ca-dot d1"></b><b class="ca-dot d2"></b><b class="ca-dot d3"></b><div class="ca-orbit-note n1"><small>FOUNDATION</small><strong>Atomic structure</strong></div><div class="ca-orbit-note n2"><small>STRUCTURE</small><strong>3D geometry</strong></div><div class="ca-orbit-note n3"><small>TRANSFER</small><strong>Mechanisms → metabolism</strong></div></div>
      </div>
      <div class="ca-capabilities"><article><span>01</span><h3>Learn the why</h3><p>Original course material, equations, vocabulary, examples, and explicit prerequisite connections.</p></article><article><span>02</span><h3>Manipulate the model</h3><p>Rotate molecules, build structures, move through conformations, and expose the relationships hidden by flat diagrams.</p></article><article><span>03</span><h3>Practice the reasoning</h3><p>Randomized chemistry problems, virtual labs, immediate feedback, and a growing record of mastery.</p></article><article><span>04</span><h3>Adapt the path</h3><p>ChemAtlas uses what you have completed to recommend the next concept or review target instead of treating every learner identically.</p></article></div>
      <div class="ca-learning-path"><p class="eyebrow">ONE CONNECTED CURRICULUM</p><h2>Atoms are not Chapter 2. They are the beginning of everything.</h2><div><button data-genchem-route><span>01</span><strong>General Chemistry</strong><small>particles • bonding • energy • equilibrium</small></button><i>→</i><button data-route="/organic"><span>02</span><strong>Organic Chemistry</strong><small>structure • stereochemistry • mechanisms</small></button><i>→</i><button disabled><span>03</span><strong>Biochemistry</strong><small>proteins • enzymes • metabolism</small></button></div></div>
      <div class="ca-landing-bottom"><div><p class="eyebrow">YOUR NEXT STEP</p><h2 id="caLandingNext">Start with the foundation.</h2><p id="caLandingNextCopy">Tell ChemAtlas what you are working toward and it will suggest a path.</p></div><button class="primary-button" data-start-learning>Choose my learning goal</button></div>`;
    main.prepend(landing);

    const progress = document.createElement('section');
    progress.id='caProgressView'; progress.className='view ca-custom-view'; main.appendChild(progress);
    const tutor = document.createElement('section');
    tutor.id='caTutorView'; tutor.className='view ca-custom-view'; main.appendChild(tutor);

    const nav = document.querySelector('.nav-list');
    if (nav && !nav.querySelector('[data-ca-nav="progress"]')) {
      const progressBtn=document.createElement('button'); progressBtn.className='ca-side-nav'; progressBtn.dataset.caNav='progress'; progressBtn.innerHTML='<span>◫</span> My Progress';
      const tutorBtn=document.createElement('button'); tutorBtn.className='ca-side-nav'; tutorBtn.dataset.caNav='tutor'; tutorBtn.innerHTML='<span>✦</span> AI Tutor';
      nav.append(progressBtn,tutorBtn);
    }

    const topActions=document.querySelector('.top-actions');
    if (topActions && !topActions.querySelector('.ca-sync-status')) {
      const sync=document.createElement('button'); sync.className='ca-sync-status'; sync.dataset.accountOpen=''; sync.innerHTML='<span></span><b>Guest</b><small>local progress</small>';
      const avatar=topActions.querySelector('.avatar'); if (avatar) avatar.replaceWith(sync); else topActions.appendChild(sync);
    }

    const account=document.createElement('div'); account.id='caAccountOverlay'; account.className='ca-overlay'; account.innerHTML=`<div class="ca-modal"><button class="ca-modal-x" data-account-close>×</button><p class="eyebrow">CHEMATLAS PROFILE</p><h2 id="caAccountTitle">Keep your chemistry progress with you.</h2><p id="caAccountCopy">Guest mode stores progress on this browser. A profile syncs mastery and history across devices.</p><div id="caAccountBody"></div></div>`; document.body.appendChild(account);
    const onboarding=document.createElement('div'); onboarding.id='caOnboardingOverlay'; onboarding.className='ca-overlay'; onboarding.innerHTML=`<div class="ca-modal ca-goal-modal"><button class="ca-modal-x" data-onboarding-close>×</button><p class="eyebrow">PERSONALIZE THE PATH</p><h2>What are you trying to do?</h2><p>This only changes what ChemAtlas recommends first. You can explore everything at any time.</p><div class="ca-goal-grid"><button data-goal="foundations"><span>Σ</span><strong>Build my foundations</strong><small>Start at Gen Chem and build the sequence correctly.</small></button><button data-goal="organic"><span>⌬</span><strong>Prepare for Organic</strong><small>Prioritize bonding, geometry, polarity, acid–base, and stereochemistry.</small></button><button data-goal="genchem2"><span>K</span><strong>Review Gen Chem II</strong><small>Equilibrium, acids/bases, thermodynamics, and electrochemistry.</small></button><button data-goal="biochem"><span>ATP</span><strong>Prepare for Biochemistry</strong><small>Strengthen energy, equilibria, acids/bases, and molecular structure.</small></button></div></div>`; document.body.appendChild(onboarding);

    bindShell(); renderLandingRecommendation(); renderProgress(); renderTutor();
  }

  function bindShell() {
    document.addEventListener('click', (e) => {
      const route=e.target.closest('[data-route]'); if(route){ e.preventDefault(); navigate(route.dataset.route); return; }
      if(e.target.closest('[data-genchem-route]')){ e.preventDefault(); navigate('/genchem'); return; }
      if(e.target.closest('[data-start-learning]')){ openOnboarding(); return; }
      if(e.target.closest('[data-account-open]')){ openAccount(); return; }
      if(e.target.closest('[data-account-close]')){ closeOverlay('caAccountOverlay'); return; }
      if(e.target.closest('[data-onboarding-close]')){ closeOverlay('caOnboardingOverlay'); return; }
      const g=e.target.closest('[data-goal]'); if(g){ setGoal(g.dataset.goal); return; }
      const ca=e.target.closest('[data-ca-nav]'); if(ca){ navigate(ca.dataset.caNav==='tutor'?'/tutor':'/progress'); return; }
    });
    document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => {
      const p=routeForView[btn.dataset.view]; if(p) setUrl(p);
    }));
    window.addEventListener('popstate', routeFromLocation);
    window.addEventListener('storage', () => { renderProgress(); renderLandingRecommendation(); });
    const overlayClose=(e)=>{ if(e.target===e.currentTarget) e.currentTarget.classList.remove('open'); };
    document.getElementById('caAccountOverlay')?.addEventListener('click',overlayClose);
    document.getElementById('caOnboardingOverlay')?.addEventListener('click',overlayClose);
    observeDynamicNav();
  }

  function observeDynamicNav(){
    const nav=document.querySelector('.nav-list'); if(!nav) return;
    new MutationObserver(()=>{
      const gc=nav.querySelector('.genchem-nav:not([data-ca-route-bound])');
      if(gc){ gc.dataset.caRouteBound='1'; gc.addEventListener('click',()=>setUrl('/genchem')); }
    }).observe(nav,{childList:true,subtree:true});
  }

  function setUrl(path, replace=false){
    if(location.pathname===path) return;
    history[replace?'replaceState':'pushState']({},'',path);
  }
  function navigate(path, replace=false){ setUrl(path,replace); routeFromLocation(); }

  function showCustom(id,title){
    document.body.classList.remove('ca-landing-mode');
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active-view'));
    document.getElementById(id)?.classList.add('active-view');
    document.querySelectorAll('.nav-item,.genchem-nav,.ca-side-nav').forEach(n=>n.classList.remove('active'));
    const key=id==='caTutorView'?'tutor':'progress'; document.querySelector(`[data-ca-nav="${key}"]`)?.classList.add('active');
    const h=document.getElementById('pageTitle'); if(h) h.textContent=title;
    renderProgress(); renderTutor();
  }
  function showLanding(){
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active-view'));
    document.getElementById('caLandingView')?.classList.add('active-view');
    document.body.classList.add('ca-landing-mode'); renderLandingRecommendation();
  }
  function clickCore(view){ document.body.classList.remove('ca-landing-mode'); document.querySelector(`.nav-item[data-view="${view}"]`)?.click(); }

  function openGenchem(moduleId){
    document.body.classList.remove('ca-landing-mode');
    let attempts=0;
    const tryOpen=()=>{
      const btn=document.querySelector('.genchem-nav');
      if(btn){ if(moduleId) btn.dataset.genchemModule=moduleId; else delete btn.dataset.genchemModule; btn.click(); return; }
      if(attempts++<20) setTimeout(tryOpen,150); else clickCore('courses');
    }; tryOpen();
  }

  function routeFromLocation(){
    const p=location.pathname.replace(/\/+$/,'') || '/';
    if(p==='/'){showLanding();return;}
    if(p==='/dashboard'){clickCore('home');return;}
    if(p==='/curriculum'){clickCore('curriculum');return;}
    if(p==='/courses'){clickCore('courses');return;}
    if(p==='/model-lab'){clickCore('lab');return;}
    if(p==='/organic'||p.startsWith('/organic/')){clickCore('organic');return;}
    if(p==='/progress'){showCustom('caProgressView','Your chemistry progress');return;}
    if(p==='/tutor'){showCustom('caTutorView','ChemAtlas AI Tutor');return;}
    if(p==='/genchem'){openGenchem();return;}
    if(p.startsWith('/genchem/')){openGenchem(p.split('/')[2]);return;}
    navigate('/',true);
  }

  function goalInfo(){
    const goal=localStorage.getItem(LS.goal)||'';
    return ({
      foundations:['Build strong foundations','Continue with the first General Chemistry concept you have not mastered.'],
      organic:['Prepare for Organic Chemistry','Prioritize bonding, geometry, polarity, acid–base chemistry, then move into stereochemistry.'],
      genchem2:['Strengthen General Chemistry II','Focus on intermolecular forces, equilibrium, acids/bases, thermodynamics, and electrochemistry.'],
      biochem:['Prepare for Biochemistry','Prioritize molecular structure, energy, equilibrium, acid–base chemistry, and kinetics.']
    })[goal] || ['Start with the foundation.','Tell ChemAtlas what you are working toward and it will suggest a path.'];
  }
  function renderLandingRecommendation(){
    const [title,copy]=goalInfo(); const t=document.getElementById('caLandingNext'), c=document.getElementById('caLandingNextCopy'); if(t)t.textContent=title;if(c)c.textContent=copy;
  }
  function openOnboarding(){document.getElementById('caOnboardingOverlay')?.classList.add('open');}
  function closeOverlay(id){document.getElementById(id)?.classList.remove('open');}
  function setGoal(goal){localStorage.setItem(LS.goal,goal);localStorage.setItem(LS.onboarded,'1');closeOverlay('caOnboardingOverlay');renderLandingRecommendation(); if(session)queueCloudSync(); navigate(goal==='organic'?'/organic':goal==='genchem2'?'/genchem/intermolecular-forces':'/genchem');}

  function readProgress(){
    const modules=safeJson(LS.modules,[]); const tools=safeJson(LS.tools,[]); const history=safeJson(LS.history,[]);
    const vsepr=Number(localStorage.getItem(LS.vsepr)||0); const stereo=Number(localStorage.getItem(LS.stereo)||0); const sn2=Number(localStorage.getItem(LS.sn2)||0);
    const days=new Set(history.map(x=>String(x.at||'').slice(0,10)).filter(Boolean)).size;
    return {modules,tools,history,vsepr,stereo,sn2,days};
  }
  function adaptiveNext(){
    const p=readProgress(); const goal=localStorage.getItem(LS.goal)||'foundations'; const mods=window.CHEM_GENCHEM?.modules||[];
    const incomplete=mods.filter(m=>!p.modules.includes(m.id));
    if(goal==='organic'){
      const priorities=['bonding','molecular-geometry','acid-base','equilibrium']; const hit=priorities.map(id=>mods.find(m=>m.id===id&&!p.modules.includes(id))).find(Boolean); if(hit)return {title:hit.title,copy:'This concept has high transfer value into organic chemistry.',route:`/genchem/${hit.id}`};
      if(!p.stereo)return {title:'R/S stereochemistry',copy:'Your Gen Chem bridge is strong enough to start spatial organic chemistry.',route:'/organic'};
    }
    if(goal==='genchem2'){ const hit=incomplete.find(m=>m.semester===2); if(hit)return {title:hit.title,copy:'Continue your General Chemistry II review path.',route:`/genchem/${hit.id}`}; }
    if(goal==='biochem'){ const keywords=['acid','equilibrium','thermo','kinetic','molecular']; const hit=incomplete.find(m=>keywords.some(k=>m.id.includes(k)||m.title.toLowerCase().includes(k))); if(hit)return {title:hit.title,copy:'High-value prerequisite for biochemical systems.',route:`/genchem/${hit.id}`}; }
    if(incomplete[0])return {title:incomplete[0].title,copy:'Next unmastered module in the foundation sequence.',route:`/genchem/${incomplete[0].id}`};
    if(p.tools.length<7)return {title:'Foundation Practice Lab',copy:'Turn completed reading into retrieval and problem-solving practice.',route:'/genchem'};
    if(p.vsepr<3)return {title:'Molecular Geometry Lab',copy:'Strengthen the 2D → 3D structure bridge.',route:'/model-lab'};
    return {title:'Organic Chemistry Studio',copy:'You have cleared the current General Chemistry foundation path.',route:'/organic'};
  }

  function renderProgress(){
    const root=document.getElementById('caProgressView');if(!root)return;const p=readProgress();const total=window.CHEM_GENCHEM?.modules?.length||19;const next=adaptiveNext();
    const recent=p.history.slice(0,8);
    root.innerHTML=`<div class="ca-page-head"><div><p class="eyebrow">MASTERY, NOT CHECKBOXES</p><h2>Your chemistry progress</h2><p>ChemAtlas keeps the local experience useful in guest mode and synchronizes the same state to your profile when cloud sync is configured.</p></div><button class="secondary-button" data-account-open>${session?'Account & sync':'Sync across devices'}</button></div>
      <div class="ca-stat-grid"><article><span>GEN CHEM</span><strong>${p.modules.length}/${total}</strong><small>modules mastered</small></article><article><span>PRACTICE</span><strong>${p.tools.length}/7</strong><small>engines cleared</small></article><article><span>VSEPR</span><strong>${p.vsepr}/3</strong><small>best mastery score</small></article><article><span>ACTIVE</span><strong>${p.days}</strong><small>practice days recorded</small></article></div>
      <div class="ca-progress-grid"><article class="panel ca-next-card"><p class="eyebrow">ADAPTIVE NEXT STEP</p><h3>${esc(next.title)}</h3><p>${esc(next.copy)}</p><button class="primary-button" data-route="${esc(next.route)}">Continue here →</button></article><article class="panel"><p class="eyebrow">LEARNING GOAL</p><h3>${esc(goalInfo()[0])}</h3><p>${esc(goalInfo()[1])}</p><button class="text-button" data-start-learning>Change goal</button></article></div>
      <article class="panel ca-history"><div><p class="eyebrow">PRACTICE HISTORY</p><h3>Recent learning activity</h3></div>${recent.length?`<div class="ca-history-list">${recent.map(x=>`<div><span>${new Date(x.at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span><strong>${esc(x.label)}</strong><small>${esc(activitySummary(x))}</small></div>`).join('')}</div>`:'<p class="muted">Complete a module or practice tool and your activity timeline will appear here.</p>'}</article>`;
  }
  function activitySummary(x){
    if(x.key===LS.modules){const a=(()=>{try{return JSON.parse(x.value)}catch(_){return[]}})();return `${a.length} General Chemistry modules mastered`;}
    if(x.key===LS.tools){const a=(()=>{try{return JSON.parse(x.value)}catch(_){return[]}})();return `${a.length} practice engines cleared`;}
    if(x.key===LS.vsepr)return `VSEPR score ${x.value}/3`;
    return Number(x.value)?'mastery recorded':'practice attempted';
  }

  function courseContext(question){
    const q=words(question);const scored=[];
    for(const m of window.CHEM_GENCHEM?.modules||[]){
      const text=[m.title,m.subtitle,...(m.outcomes||[]),...(m.vocabulary||[]),...(m.sections||[]).flatMap(s=>[s.title,...(s.body||[])]),...(m.equations||[]).flatMap(e=>[e.label,e.expression]),m.example?.prompt,...(m.example?.steps||[]),m.example?.answer].filter(Boolean).join(' ');
      const w=words(text);let score=0;q.forEach(t=>{if(w.has(t))score++});if(score||scored.length<3)scored.push({score,text:`MODULE: ${m.title}\n${text}`});
    }
    scored.sort((a,b)=>b.score-a.score);let context=scored.slice(0,4).map(x=>x.text).join('\n\n');
    if(window.CHEM_ORGANIC){const o=window.CHEM_ORGANIC;const org=`ORGANIC STUDIO CONTEXT: ${(o.stereoChallenges||[]).map(x=>x.explanation).join(' ')} ${o.mechanism?.explanation||''}`;if([...q].some(x=>/stereo|chir|sn2|mechan|organic|cip/.test(x)))context+=`\n\n${org}`;}
    return context.slice(0,17000);
  }
  function tutorHistory(){return safeJson(LS.tutor,[])}
  function saveTutor(messages){nativeSetItem.call(localStorage,LS.tutor,JSON.stringify(messages.slice(-30)));if(session)queueCloudSync();}
  function renderTutor(){
    const root=document.getElementById('caTutorView');if(!root)return;const messages=tutorHistory();
    root.innerHTML=`<div class="ca-tutor-layout"><section class="ca-tutor-main"><div class="ca-page-head"><div><p class="eyebrow">COURSE-GROUNDED AI</p><h2>Ask ChemAtlas</h2><p>The tutor retrieves the most relevant ChemAtlas lesson context first, then teaches from that foundation. Web lookup is optional for current or external context.</p></div><span class="ca-ai-status ${cfg.tutorEndpoint?'ready':''}"><i></i>${cfg.tutorEndpoint?'Tutor endpoint installed':'Tutor setup pending'}</span></div><div class="ca-chat panel" id="caChat">${messages.length?messages.map(m=>`<div class="ca-message ${m.role}"><span>${m.role==='user'?'YOU':'C'}</span><div>${esc(m.text).replace(/\n/g,'<br>')}</div></div>`).join(''):`<div class="ca-tutor-empty"><span>✦</span><h3>Start with a concept, not a magic answer.</h3><p>Ask for an explanation, a worked problem, a comparison, or help finding the gap in your reasoning.</p><div><button data-tutor-prompt="Why does molecular geometry affect polarity?">Geometry → polarity</button><button data-tutor-prompt="Walk me through a limiting-reagent problem without skipping units.">Stoichiometry</button><button data-tutor-prompt="How do acid-base concepts from Gen Chem show up in organic chemistry?">Bridge to Organic</button></div></div>`}</div><form class="ca-tutor-form" id="caTutorForm"><textarea id="caTutorInput" rows="3" placeholder="Ask a chemistry question…"></textarea><div><label><input id="caTutorWeb" type="checkbox" checked> Allow web context when useful</label><button class="primary-button" type="submit">Ask Tutor ✦</button></div></form></section><aside class="ca-tutor-side"><article class="panel"><p class="eyebrow">CURRENT LEARNER CONTEXT</p><h3>${esc(goalInfo()[0])}</h3><p>${esc(adaptiveNext().copy)}</p></article><article class="panel"><p class="eyebrow">HOW IT ANSWERS</p><ol><li>Find relevant ChemAtlas material.</li><li>Explain the governing chemistry.</li><li>Show units/reasoning for calculations.</li><li>Connect the concept forward.</li><li>Check your understanding.</li></ol></article><article class="panel ca-tutor-guardrail"><p class="eyebrow">LEARNING GUARDRAIL</p><p>The tutor is assistive. Chemistry calculations, safety-critical lab decisions, and externally sourced claims should still be checked against authoritative course/lab sources.</p></article></aside></div>`;
    root.querySelectorAll('[data-tutor-prompt]').forEach(b=>b.addEventListener('click',()=>{const i=document.getElementById('caTutorInput');if(i){i.value=b.dataset.tutorPrompt;i.focus()}}));
    document.getElementById('caTutorForm')?.addEventListener('submit',askTutor);
    requestAnimationFrame(()=>{const c=document.getElementById('caChat');if(c)c.scrollTop=c.scrollHeight});
  }
  async function askTutor(e){
    e.preventDefault();const input=document.getElementById('caTutorInput');const question=input?.value.trim();if(!question)return;const messages=tutorHistory();messages.push({role:'user',text:question,at:new Date().toISOString()});saveTutor(messages);renderTutor();
    const chat=document.getElementById('caChat');if(chat)chat.insertAdjacentHTML('beforeend','<div class="ca-message assistant ca-thinking"><span>C</span><div>Thinking through the chemistry…</div></div>');
    try{
      const current=localStorage.getItem('chematlas-genchem-current')||'';const p=readProgress();const res=await fetch(cfg.tutorEndpoint||'/api/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,context:courseContext(question),includeWeb:Boolean(document.getElementById('caTutorWeb')?.checked),learner:{goal:goalInfo()[0],currentModule:current,masterySummary:`${p.modules.length} modules, ${p.tools.length} practice engines, VSEPR ${p.vsepr}/3`}})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Tutor request failed');messages.push({role:'assistant',text:data.answer||'No response returned.',at:new Date().toISOString()});
    }catch(err){messages.push({role:'assistant',text:`Tutor connection note: ${err.message}. The course-grounded interface is installed; the server key/environment still needs to be connected if this is a configuration error.`,at:new Date().toISOString()});}
    saveTutor(messages);renderTutor();
  }

  function openAccount(){document.getElementById('caAccountOverlay')?.classList.add('open');renderAccount();}
  function renderAccount(){
    const body=document.getElementById('caAccountBody');if(!body)return;
    if(session){body.innerHTML=`<div class="ca-account-signed"><span>✓</span><strong>${esc(session.user?.email||'Signed in')}</strong><small>Cloud sync enabled</small></div><button id="caSyncNow" class="primary-button">Sync now</button><button id="caSignOut" class="secondary-button">Sign out</button>`;document.getElementById('caSyncNow')?.addEventListener('click',syncAll);document.getElementById('caSignOut')?.addEventListener('click',async()=>{await cloud?.auth.signOut();session=null;updateSyncBadge();renderAccount()});return;}
    if(!cfg.supabaseUrl||!cfg.supabasePublishableKey){body.innerHTML=`<div class="ca-setup-note"><strong>Guest mode is active.</strong><p>The profile UI and sync model are installed, but ChemAtlas needs its own Supabase project URL and publishable key before account creation can go live. No secret keys belong in this browser configuration.</p></div>`;return;}
    body.innerHTML=`<form id="caAuthForm"><label>Email<input id="caEmail" type="email" autocomplete="email" required></label><label>Password<input id="caPassword" type="password" minlength="6" autocomplete="current-password" required></label><div class="ca-auth-actions"><button class="primary-button" type="submit">Sign in</button><button class="secondary-button" type="button" id="caSignUp">Create account</button></div><p id="caAuthFeedback" class="muted"></p></form>`;
    document.getElementById('caAuthForm')?.addEventListener('submit',e=>authSubmit(e,false));document.getElementById('caSignUp')?.addEventListener('click',e=>authSubmit(e,true));
  }
  async function authSubmit(e,signup){e.preventDefault();const email=document.getElementById('caEmail')?.value.trim(),password=document.getElementById('caPassword')?.value;const f=document.getElementById('caAuthFeedback');if(!cloud){if(f)f.textContent='Cloud client is still loading.';return;}const {data,error}=signup?await cloud.auth.signUp({email,password}):await cloud.auth.signInWithPassword({email,password});if(error){if(f)f.textContent=error.message;return;}session=data.session||session;if(f)f.textContent=signup&&!data.session?'Check your email to confirm the account.':'Signed in. Syncing your progress…';updateSyncBadge();if(session)await mergeCloudState();renderAccount();}

  function knownState(){return {[LS.goal]:localStorage.getItem(LS.goal),[LS.modules]:safeJson(LS.modules,[]),[LS.tools]:safeJson(LS.tools,[]),[LS.vsepr]:Number(localStorage.getItem(LS.vsepr)||0),[LS.stereo]:Number(localStorage.getItem(LS.stereo)||0),[LS.sn2]:Number(localStorage.getItem(LS.sn2)||0),[LS.history]:safeJson(LS.history,[]),[LS.tutor]:safeJson(LS.tutor,[])};}
  function mergeValue(key,local,remote){if(remote==null)return local;if(local==null)return remote;if(key===LS.modules||key===LS.tools)return [...new Set([...(Array.isArray(remote)?remote:[]),...(Array.isArray(local)?local:[])])];if([LS.vsepr,LS.stereo,LS.sn2].includes(key))return Math.max(Number(local)||0,Number(remote)||0);if(key===LS.history||key===LS.tutor){const map=new Map();[...(Array.isArray(remote)?remote:[]),...(Array.isArray(local)?local:[])].forEach(x=>map.set(x.id||`${x.role}-${x.at}-${x.text}`,x));return [...map.values()].sort((a,b)=>String(a.at)<String(b.at)?1:-1).slice(0,key===LS.history?120:30);}return remote||local;}
  async function mergeCloudState(){if(!cloud||!session||syncing)return;syncing=true;try{const {data,error}=await cloud.from('learner_state').select('state_key,state_value').eq('user_id',session.user.id);if(error)throw error;const remote=Object.fromEntries((data||[]).map(r=>[r.state_key,r.state_value]));const local=knownState();for(const [key,val] of Object.entries(local)){const merged=mergeValue(key,val,remote[key]);if(typeof merged==='string')nativeSetItem.call(localStorage,key,merged);else nativeSetItem.call(localStorage,key,JSON.stringify(merged));}await syncAll();renderProgress();renderLandingRecommendation();}catch(e){console.warn('ChemAtlas cloud merge:',e.message)}finally{syncing=false;}}
  async function syncAll(){if(!cloud||!session)return;const rows=Object.entries(knownState()).map(([state_key,state_value])=>({user_id:session.user.id,state_key,state_value,updated_at:new Date().toISOString()}));const {error}=await cloud.from('learner_state').upsert(rows,{onConflict:'user_id,state_key'});if(error)console.warn('ChemAtlas sync:',error.message);updateSyncBadge(error?'error':'ok');}
  let syncTimer;function queueCloudSync(){clearTimeout(syncTimer);syncTimer=setTimeout(syncAll,1200)}
  function updateSyncBadge(status){const b=document.querySelector('.ca-sync-status');if(!b)return;if(session){b.classList.add('online');b.querySelector('b').textContent='Synced profile';b.querySelector('small').textContent=status==='error'?'sync issue':session.user?.email||'cloud progress';}else{b.classList.remove('online');b.querySelector('b').textContent='Guest';b.querySelector('small').textContent='local progress';}}

  async function initCloud(){
    if(!cfg.supabaseUrl||!cfg.supabasePublishableKey){updateSyncBadge();return;}
    try{await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');cloud=window.supabase?.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);if(!cloud)return;const {data}=await cloud.auth.getSession();session=data.session;cloud.auth.onAuthStateChange((_event,s)=>{session=s;updateSyncBadge();if(s)queueCloudSync();});updateSyncBadge();if(session)await mergeCloudState();}catch(e){console.warn('ChemAtlas cloud init:',e.message)}
  }
  function loadScript(src){return new Promise((resolve,reject)=>{if(document.querySelector(`script[src="${src}"]`))return resolve();const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Could not load cloud client'));document.head.appendChild(s);});}

  function injectAdaptiveDashboard(){
    const home=document.getElementById('homeView');if(!home||home.querySelector('.ca-dashboard-next'))return;const grid=home.querySelector('.dashboard-grid');if(!grid)return;const next=adaptiveNext();const card=document.createElement('article');card.className='panel ca-dashboard-next';card.innerHTML=`<p class="eyebrow">ADAPTIVE REVIEW</p><h3>${esc(next.title)}</h3><p>${esc(next.copy)}</p><button class="text-button" data-route="${esc(next.route)}">Continue →</button>`;grid.appendChild(card);
  }

  function boot(){addShell();injectAdaptiveDashboard();initCloud();routeFromLocation();setInterval(()=>{if(document.getElementById('caProgressView')?.classList.contains('active-view'))renderProgress();},5000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
