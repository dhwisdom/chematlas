/* Reveal the app only after its tutoring shell and requested route are ready. */
(() => {
  const aliases={
    'intermolecular-forces':'imf','molecular-geometry':'geometry',
    'acid-base':'acidbase','acid-base-buffers':'acidbase',
    'electrochemistry':'electrochem','electronic-structure':'electronic','periodic-trends':'periodic'
  };
  const canonicalModule=id=>Object.hasOwn(aliases,id)?aliases[id]:id;
  function resolveLocation(){
    const path=location.pathname.replace(/\/+$/,'')||'/';
    const match=path.match(/^\/genchem\/([^/]+)$/);
    if(!match)return path;
    let id;try{id=decodeURIComponent(match[1]);}catch{return path;}
    const canonical=canonicalModule(id);
    if(canonical===id)return path;
    const next='/genchem/'+canonical;
    history.replaceState({},'',next+(location.search||'')+(location.hash||''));
    return next;
  }
  resolveLocation();
  let finished=false;
  const timeout=setTimeout(()=>{
    if(finished)return;
    const message=document.getElementById('caStartupMessage');
    if(message)message.textContent='ChemWaypoint is taking longer than expected to load.';
    const retry=document.getElementById('caStartupRetry');
    if(retry)retry.hidden=false;
  },15000);
  window.ChemAtlasBoot={canonicalModule,resolveLocation,ready(){
    if(finished || !document.querySelector('.ca-tutoring-nav-group'))return;
    const path=resolveLocation();
    const requested=path.match(/^\/genchem\/([^/]+)$/)?.[1];
    if(requested&&(window.CHEM_GENCHEM?.modules||[]).some(m=>m.id===requested)&&document.querySelector('#genchemView.active-view .gc-module-link.active')?.dataset.module!==requested)return;
    let selector;
    if(path.startsWith('/genchem'))selector='#genchemView.active-view .ca-focus-shell';
    else if(path==='/')selector='#caLandingView.active-view .ca-marketing-hero';
    else if(path==='/dashboard')selector='#homeView.active-view .ca-home';
    else if(path.startsWith('/organic'))selector='#organicView.active-view';
    else selector=({'/courses':'#coursesView','/curriculum':'#curriculumView','/model-lab':'#labView','/tutor':'#caTutorView','/companion':'#caCompanionView','/progress':'#caProgressView'}[path]||'#caLandingView')+'.active-view';
    if(!document.querySelector(selector))return;
    finished=true;clearTimeout(timeout);
    document.documentElement.removeAttribute('data-ca-starting');
    document.getElementById('caStartup')?.remove();
  }};
})();
