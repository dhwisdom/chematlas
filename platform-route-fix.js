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
    if (location.pathname !== path) history[mode]({}, '', path);
  };

  function openCanonicalModule(id) {
    const slug = canonical(id);
    if (!validModule(slug)) return;
    const open = () => {
      const nav = document.querySelector('.genchem-nav');
      if (!nav) return setTimeout(open, 100);
      nav.dataset.genchemModule = slug;
      nav.click();
      setTimeout(() => setPath(slug), 0);
    };
    open();
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-module],[data-module-nav]');
    if (!target) return;
    const id = target.dataset.module || target.dataset.moduleNav;
    if (id && target.closest('#genchemView')) setTimeout(() => setPath(id, 'pushState'), 0);
  }, true);

  document.addEventListener('click', event => {
    const nav = event.target.closest('.genchem-nav');
    if (nav?.dataset.genchemModule) setTimeout(() => setPath(nav.dataset.genchemModule), 0);
  });

  document.addEventListener('click', event => {
    const goal = event.target.closest('[data-goal="genchem2"]');
    if (goal) setTimeout(() => openCanonicalModule('imf'), 10);
  }, true);

  function repairLocation() {
    const match = location.pathname.match(/^\/genchem\/([^/]+)$/);
    if (!match) return;
    const requested = decodeURIComponent(match[1]);
    const slug = canonical(requested);
    if (slug !== requested || validModule(slug)) {
      if (slug !== requested) history.replaceState({}, '', `/genchem/${slug}`);
      setTimeout(() => openCanonicalModule(slug), 80);
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
  if (window.__CHEMATLAS_UX_LOADER__) return;
  window.__CHEMATLAS_UX_LOADER__ = true;

  if (!document.querySelector('link[href="chematlas-ux.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'chematlas-ux.css';
    document.head.appendChild(link);
  }

  if (!document.querySelector('script[src="chematlas-mobile-nav.js"]')) {
    const script = document.createElement('script');
    script.src = 'chematlas-mobile-nav.js';
    document.body.appendChild(script);
  }
})();
