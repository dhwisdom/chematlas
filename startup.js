/* Reveal the app only after its tutoring shell and requested route are ready. */
(() => {
  let finished=false;
  const timeout=setTimeout(()=>{
    if(finished)return;
    const message=document.getElementById('caStartupMessage');
    if(message)message.textContent='ChemAtlas is taking longer than expected to load.';
    const retry=document.getElementById('caStartupRetry');
    if(retry)retry.hidden=false;
  },15000);
  window.ChemAtlasBoot={ready(){
    if(finished || !document.querySelector('.ca-tutoring-nav-group'))return;
    const path=location.pathname.replace(/\/+$/,'')||'/';
    let selector;
    if(path.startsWith('/genchem'))selector='#genchemView.active-view .ca-focus-shell';
    else if(path==='/')selector='#caLandingView.active-view .ca-marketing-hero';
    else if(path==='/dashboard')selector='#homeView.active-view .ca-home';
    else if(path.startsWith('/organic'))selector='#organicView.active-view';
    else selector=({'/courses':'#coursesView','/curriculum':'#curriculumView','/model-lab':'#labView','/tutor':'#caTutorView','/progress':'#caProgressView'}[path]||'#caLandingView')+'.active-view';
    if(!document.querySelector(selector))return;
    finished=true;clearTimeout(timeout);
    document.documentElement.removeAttribute('data-ca-starting');
    document.getElementById('caStartup')?.remove();
  }};
})();
