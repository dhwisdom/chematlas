((root) => {
const config = {
  supabaseUrl: 'https://zslxoqvqxdqwykzdogor.supabase.co',
  supabasePublishableKey: 'sb_publishable_CQnGVuXMrI_wR6cbCcTkDA_dbk5wOD8',
  tutorEndpoint: '/api/tutor',
  canonicalHost: 'www.chemwaypoint.com'
};

// Server-side tutor credentials are configured only in Vercel environment variables.
// Deployment refresh marker: 2026-09-11 tutor environment activation.

root.CHEMATLAS_CONFIG = config;
if (typeof module !== "undefined" && module.exports) module.exports = config;
})(typeof window === "undefined" ? globalThis : window);
