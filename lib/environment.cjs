'use strict';
const PRODUCTION_REF = 'zslxoqvqxdqwykzdogor';
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);
function localUrl(value, protocols = ['http:', 'postgres:', 'postgresql:']) {
  const url = new URL(value);
  if (!LOCAL_HOSTS.has(url.hostname) || !protocols.includes(url.protocol) || url.search || url.hash) {
    throw new Error('Only an explicit loopback URL is allowed for local development.');
  }
  return url;
}
function publicKey(value) {
  if (typeof value !== 'string') throw new Error('Missing public API key.');
  if (value.startsWith('sb_publishable_')) return value;
  try { if (JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString()).role === 'anon') return value; } catch {}
  throw new Error('Only a publishable or local anon key may enter browser configuration.');
}
function config(env = process.env, requested) {
  const mode = requested || env.APP_ENV || 'mock';
  if (!['mock', 'local', 'test', 'production'].includes(mode)) throw new Error('Unknown APP_ENV.');
  if (env.VERCEL_ENV && env.VERCEL_ENV !== 'production' && mode !== 'mock') throw new Error('Vercel previews must use mock mode.');
  if (mode === 'production') {
    if (env.VERCEL_ENV !== 'production' || env.APP_ENV !== 'production') throw new Error('Production requires explicit production build configuration.');
    const url = new URL(env.SUPABASE_URL);
    if (url.origin !== `https://${PRODUCTION_REF}.supabase.co` || !env.SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_')) throw new Error('Invalid explicit production public configuration.');
    return {mode, supabaseUrl: url.origin, supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY, tutorEndpoint:'/api/tutor', appOrigin:'https://www.chemwaypoint.com', canonicalHost:'www.chemwaypoint.com'};
  }
  // Never silently discard a dangerous supplied target, even in mock mode.
  if (env.SUPABASE_URL) localUrl(env.SUPABASE_URL, ['http:']);
  if (env.DATABASE_URL) localUrl(env.DATABASE_URL, ['postgres:', 'postgresql:']);
  if (mode === 'local') {
    if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) throw new Error('Start the local backend before running local mode.');
    const origin = localUrl(env.APP_ORIGIN || 'http://127.0.0.1:3000', ['http:']).origin;
    return {mode, supabaseUrl:localUrl(env.SUPABASE_URL, ['http:']).origin, supabasePublishableKey:publicKey(env.SUPABASE_PUBLISHABLE_KEY), tutorEndpoint:'/api/tutor', appOrigin:origin, canonicalHost:new URL(origin).host};
  }
  return {mode, supabaseUrl:'https://mock.chemwaypoint.invalid', supabasePublishableKey:'mock-public-placeholder', tutorEndpoint:'/api/tutor', appOrigin:'http://127.0.0.1:3000', canonicalHost:'127.0.0.1:3000'};
}
module.exports = {config, localUrl, PRODUCTION_REF};
