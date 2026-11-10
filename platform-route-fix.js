(() => {
  if (window.__CHEMATLAS_ROUTE_FIX__) return;
  window.__CHEMATLAS_ROUTE_FIX__ = true;

  const aliases = {
    'intermolecular-forces': 'imf',
    'molecular-geometry': 'geometry',
    'acid-base': 'acidbase',
    'acid-base-buffers': 'acidbase',
    'electrochemistry': 'electrochem',
    'electronic-structure': 'electronic',
    'periodic-trends': 'periodic'
  };

  const canonical = id => aliases[id] || id;
  const validModule = id => (window.CHEM_GENCHEM?.modules || []).some(m => m.id === id);
  const setPath = (id, mode = 'replaceState') => {
    if (!id) return;
    const slug = canonical(id);
    if (!validModule(slug)) return;
    const path = `/genchem/${slug}`;
    const query=location.pathname===path?location.search:'';
    if (location.pathname !== path) history[mode]({}, '', path+query);
  };

  // platform.js loads this adapter after installing the shared navigation guard.
  const checkpoint=()=>window.ChemAtlasNavigation.checkpoint();
  const deferPath=(id,mode='replaceState')=>{const current=checkpoint();setTimeout(()=>{if(current())setPath(id,mode);},0);};

  function openCanonicalModule(id) {
    const slug = canonical(id);
    if (!validModule(slug)) return;
    const current=checkpoint();
    const open = () => {
      if(!current())return;
      const nav = document.querySelector('.genchem-nav');
      if (!nav || nav.dataset.genchemReady !== '1') return setTimeout(open, 100);
      // The main router may already have opened this lesson. Do not reset an
      // active reading step or disclosure when the delayed alias repair runs.
      if(document.querySelector('#genchemView.active-view .gc-module-link.active')?.dataset.module===slug){setPath(slug);return;}
      nav.dataset.genchemModule = slug;
      nav.click();
      const afterClick=checkpoint();
      setTimeout(() => {if(afterClick())setPath(slug);}, 0);
    };
    open();
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-module],[data-module-nav]');
    if (!target) return;
    const id = target.dataset.module || target.dataset.moduleNav;
    if (id && target.closest('#genchemView')) deferPath(id,'pushState');
  }, true);

  document.addEventListener('click', event => {
    const nav = event.target.closest('.genchem-nav');
    if (nav?.dataset.genchemModule) deferPath(nav.dataset.genchemModule);
  });

  document.addEventListener('click', event => {
    const goal = event.target.closest('[data-goal="genchem2"]');
    if (goal) openCanonicalModule('imf');
  });

  function repairLocation() {
    const match = location.pathname.match(/^\/genchem\/([^/]+)$/);
    if (!match) return;
    const requested = decodeURIComponent(match[1]);
    const slug = canonical(requested);
    if (slug !== requested || validModule(slug)) {
      if (slug !== requested) history.replaceState({}, '', `/genchem/${slug}${location.search}${location.hash}`);
      const current=checkpoint();
      setTimeout(() => {if(current())openCanonicalModule(slug);}, 80);
    }
  }

  window.addEventListener('popstate', repairLocation);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', repairLocation, { once:true });
  else repairLocation();
})();

(() => {
  if (window.__CHEMATLAS_TUTOR_V2_LOADER__) return;
  window.__CHEMATLAS_TUTOR_V2_LOADER__ = true;

  if (!document.querySelector('link[href="tutor-enhancements.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'tutor-enhancements.css';
    document.head.appendChild(link);
  }

  if (!document.querySelector('script[src="tutor-enhancements.js"]')) {
    const script = document.createElement('script');
    script.src = 'tutor-enhancements.js';
    document.body.appendChild(script);
  }
})();

(() => {
  if (window.__CHEMATLAS_TUTOR_ACTIONS_LOADER__) return;
  window.__CHEMATLAS_TUTOR_ACTIONS_LOADER__ = true;

  if (!document.querySelector('link[href="tutor-actions.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'tutor-actions.css';
    document.head.appendChild(link);
  }

  if (!document.querySelector('script[src="tutor-actions.js"]')) {
    const script = document.createElement('script');
    script.src = 'tutor-actions.js';
    document.body.appendChild(script);
  }
})();

(() => {
  if (window.__CHEMATLAS_TUTORING_UI_LOADER__) return;
  window.__CHEMATLAS_TUTORING_UI_LOADER__ = true;

  if (!document.querySelector('link[href="chematlas-tutoring.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'chematlas-tutoring.css';
    document.head.appendChild(link);
  }

  if (!document.querySelector('script[src="chematlas-tutoring.js"]')) {
    const script = document.createElement('script');
    script.src = 'chematlas-tutoring.js';
    document.body.appendChild(script);
  }
})();
