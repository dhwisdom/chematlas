/* Task views share one curriculum. Layout choice never grants database permissions. */
(() => {
  'use strict';
  const initialPath=location.pathname;
  const previewIds=['measurement','atoms-moles'];
  let user=null, rights=[], ready=false;
  const isAdmin=()=>rights.some(r=>r!=='publish');
  const choiceKey=()=> 'chematlas-task-view:'+user?.id;
  const storedChoice=()=>{try{return sessionStorage.getItem(choiceKey());}catch(_){return null;}};
  function choose(value) {
    if(value==='admin'&&!isAdmin())return;
    if(user)sessionStorage.setItem(choiceKey(),value);
    location.assign(value==='admin'?'/admin':'/dashboard');
  }
  function render() {
    let box=document.querySelector('[data-task-view-switch]');
    if(!box){box=document.createElement('div');box.dataset.taskViewSwitch='';box.className='ca-task-view';(document.querySelector('.sidebar')||document.querySelector('.admin-top'))?.appendChild(box);}
    box.innerHTML=`<label for="caTaskView">TASK VIEW</label><select id="caTaskView" aria-label="Task view" ${!ready?'disabled':''}>${isAdmin()?'<option value="admin">Admin</option>':''}<option value="learner">${user?'Learner':'Guest preview'}</option></select><small>${!ready?'Checking your account…':isAdmin()?'One site, views for different tasks.':user?'Full course · personal progress':'2 lesson previews · create an account for the full course'}</small>${!user&&ready&&location.pathname!=='/admin'?'<button type="button" data-account-open>Create account / sign in</button>':''}`;
    const select=box.querySelector('select');select.value=location.pathname==='/admin'&&isAdmin()?'admin':'learner';select.onchange=()=>choose(select.value);
  }
  function setAccount(session, allowedRights=[], allowDefault=false) {
    const previous=user?.id+'|'+rights.join();
    user=session?.user||null;rights=Array.isArray(allowedRights)?allowedRights:[];ready=true;render();
    if(previous!==user?.id+'|'+rights.join())window.dispatchEvent(new Event('chematlas:view-changed'));
    // Preserve deep links and the lesson already open in an active tab.
    if(allowDefault&&isAdmin()&&!storedChoice()&&['/','/dashboard'].includes(initialPath)&&location.pathname===initialPath)location.replace('/admin');
  }
  function gate(module) {
    if(!ready)return '<section class="panel ca-focus-shell ca-guest-gate"><p role="status">Checking access to this lesson…</p></section>';
    return `<section class="panel ca-focus-shell ca-guest-gate"><p class="eyebrow">GUEST PREVIEW</p><h2>Keep building your chemistry foundation.</h2><p>Create a free account to open the full Learn sequence, save your progress, and return for spaced reviews.</p><p>Your guest preview includes Measurement and Atoms & the Mole. Your work on this browser stays here when you sign in.</p><button class="primary-button" data-account-open>Create account / sign in</button><a href="/genchem/measurement">Explore the first lesson →</a></section>`;
  }
  function describe() {
    return `<section class="editor-card"><h2>Task views</h2><p>Shared content, different working contexts. The Admin view is the administration workspace for accounts with editing rights. Learner and Guest use the same published chemistry content.</p><div class="ca-view-categories"><article><h3>Admin</h3><p>Menus, dashboards, learning content, and users & groups, according to assigned rights.</p><strong>Your administration workspace</strong></article><article><h3>Learner</h3><p>Published lessons, concept checks, spaced reviews, AI Tutor, Practice Lab, Organic Studio, and Model Lab.</p><a href="/dashboard" data-learner-view>Open Learner view →</a></article><article><h3>Guest preview</h3><p>First two Learn modules and reference tools. Remaining Learn modules prompt account creation. Preview progress remains local until sign-in.</p><small>These are presentation categories; admin editing remains protected by database permissions.</small></article></div></section>`;
  }
  document.addEventListener('click',e=>{
    const link=e.target.closest('[data-learner-view]');if(!link)return;
    // Set the view before following a normal link; existing unsaved-change guards still apply.
    if(user)sessionStorage.setItem(choiceKey(),'learner');
  });
  window.ChemAtlasViews={setAccount,choose,render,gate,describe,canLesson:m=>Boolean(user)||previewIds.includes(m.id),isReady:()=>ready};
})();
