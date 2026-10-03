// One Supabase auth client shared by accounts, tutoring, and the admin editor.
(() => {
  let pending;
  window.ChemAtlasCloud = () => pending ||= (async () => {
    const cfg = window.CHEMATLAS_CONFIG;
    if (!cfg?.supabaseUrl || !cfg.supabasePublishableKey) throw new Error('Account service is not configured.');
    if (!window.supabase?.createClient) await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.min.js';
      script.onload = resolve;
      script.onerror = () => { pending = null; reject(new Error('Could not connect to the account service. Please retry.')); };
      document.head.appendChild(script);
    });
    return window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);
  })();
})();
