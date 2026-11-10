/* Safe source-checkout default. Build output supplies public configuration only. */
((root) => {
  const config = root.CHEMATLAS_BUILD_CONFIG || {
    mode:'mock', supabaseUrl:'https://mock.chemwaypoint.invalid',
    supabasePublishableKey:'mock-public-placeholder', tutorEndpoint:'/api/tutor',
    appOrigin:'http://127.0.0.1:3000', canonicalHost:'127.0.0.1:3000'
  };
  if (typeof window !== 'undefined') {
    const local = host => ['localhost','127.0.0.1','[::1]'].includes(host);
    if (!['mock','local','test','production'].includes(config.mode)) throw Error('Invalid application environment.');
    const target = new URL(config.supabaseUrl);
    if (config.mode === 'production') {
      if (location.hostname !== config.canonicalHost || target.hostname !== 'zslxoqvqxdqwykzdogor.supabase.co') throw Error('Production configuration is forbidden on this host.');
    } else if (config.mode === 'local') {
      if (!local(location.hostname) || !local(target.hostname) || target.protocol !== 'http:') throw Error('Local backend must be on loopback.');
    } else if (target.origin !== 'https://mock.chemwaypoint.invalid') throw Error('Mock mode cannot use a real backend.');
    const originalFetch = root.fetch.bind(root);
    root.fetch = (input, options) => {
      const url = new URL(typeof input === 'string' ? input : input.url || String(input), location.href);
      if (config.mode !== 'production') {
        if (url.origin === 'https://mock.chemwaypoint.invalid') {
          if (!root.ChemAtlasMock) return Promise.reject(Error('Mock services have not loaded.'));
          return root.ChemAtlasMock.fetch(url, options);
        }
        if (url.origin !== location.origin && !(config.mode === 'local' && url.origin === target.origin)) return Promise.reject(Error('External requests are disabled in development.'));
      }
      return originalFetch(input, options);
    };
    document.addEventListener('DOMContentLoaded', () => {
      if (config.mode === 'production') return;
      const banner = document.createElement('div');
      banner.textContent = config.mode === 'local' ? 'LOCAL TEST DATA · AI and outbound email disabled' : 'FRONTEND DEMO · Synthetic data and simulated services';
      banner.setAttribute('role','note');
      // Keep the warning visible in page flow, below navigation and modal overlays.
      banner.style.cssText='padding:8px;background:#fff2c2;color:#333;text-align:center;position:relative;z-index:1';
      document.body.prepend(banner);
    });
  }
  root.CHEMATLAS_CONFIG = Object.freeze(config);
  if (typeof module !== 'undefined' && module.exports) module.exports = config;
})(typeof window === 'undefined' ? globalThis : window);
