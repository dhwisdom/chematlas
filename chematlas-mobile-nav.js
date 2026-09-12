(() => {
  if (window.__CHEMATLAS_MOBILE_NAV__) return;
  window.__CHEMATLAS_MOBILE_NAV__ = true;

  const items = [
    { path: '/dashboard', label: 'Home', icon: '⌂' },
    { path: '/genchem', label: 'Learn', icon: 'Σ' },
    { path: '/model-lab', label: 'Lab', icon: '⚗' },
    { path: '/tutor', label: 'Tutor', icon: '✦' },
    { path: '/progress', label: 'Progress', icon: '◫' }
  ];

  function ensureNav() {
    if (document.querySelector('.ca-mobile-nav')) return;
    const nav = document.createElement('nav');
    nav.className = 'ca-mobile-nav';
    nav.setAttribute('aria-label', 'Mobile primary navigation');
    nav.innerHTML = items.map(item => `
      <button type="button" data-mobile-route="${item.path}" aria-label="${item.label}">
        <span aria-hidden="true">${item.icon}</span><small>${item.label}</small>
      </button>`).join('');
    document.body.appendChild(nav);
    nav.addEventListener('click', event => {
      const button = event.target.closest('[data-mobile-route]');
      if (!button) return;
      const path = button.dataset.mobileRoute;
      if (location.pathname !== path) history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
      updateActive();
    });
    updateActive();
  }

  function routeGroup(path) {
    if (path.startsWith('/genchem')) return '/genchem';
    if (path.startsWith('/organic')) return '/organic';
    return path || '/';
  }

  function updateActive() {
    const current = routeGroup(location.pathname.replace(/\/+$/, '') || '/');
    document.querySelectorAll('.ca-mobile-nav [data-mobile-route]').forEach(button => {
      const active = routeGroup(button.dataset.mobileRoute) === current;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }

  function installViewportBehavior() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) viewport.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');
  }

  function boot() {
    installViewportBehavior();
    ensureNav();
    updateActive();
    window.addEventListener('popstate', updateActive);
    document.addEventListener('click', () => requestAnimationFrame(updateActive), true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
