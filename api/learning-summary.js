'use strict';

const { createHash, timingSafeEqual } = require('node:crypto');
const { buildSummary, stateKeys } = require('../lib/learning-summary.cjs');
const config = require('../data/platform-config.js');

const digest = value => createHash('sha256').update(value).digest();

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'GET required.' });
  }
  const token = process.env.CHEMWAYPOINT_AUTOMATION_TOKEN || '';
  if (token.length < 32 || token.length > 512 || /\s/.test(token)) {
    return res.status(503).json({ error: 'Learning-summary automation is not configured.' });
  }
  const supplied = typeof req.headers.authorization === 'string'
    ? req.headers.authorization.match(/^Bearer ([^\s]{1,512})$/i)?.[1] : null;
  if (!supplied || !timingSafeEqual(digest(supplied), digest(token))) {
    return res.status(401).json({ error: 'A valid automation credential is required.' });
  }
  // Account scope comes only from server configuration, never request parameters.
  if (Object.keys(req.query || {}).length) {
    return res.status(400).json({ error: 'This endpoint does not accept query parameters.' });
  }
  const userId = process.env.CHEMWAYPOINT_AUTOMATION_USER_ID || '';
  const secret = process.env.SUPABASE_SECRET_KEY || '';
  if (!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(userId) || !secret.startsWith('sb_secret_')) {
    return res.status(503).json({ error: 'Learning-summary automation is not configured.' });
  }
  const read = async (table, parameters) => {
    const url = new URL('/rest/v1/' + table, config.supabaseUrl);
    url.search = new URLSearchParams(parameters).toString();
    const response = await fetch(url, {
      headers: { apikey: secret, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000), redirect: 'error'
    });
    if (!response.ok) throw new Error('Progress service unavailable');
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('Unexpected progress response');
    return rows;
  };
  try {
    const [rows, published] = await Promise.all([
      read('learner_state', { select: 'state_key,state_value,updated_at', user_id: 'eq.' + userId, state_key: 'in.(' + stateKeys.join(',') + ')' }),
      read('site_published', { select: 'key,payload', key: 'like.module:*' })
    ]);
    return res.status(200).json(buildSummary(rows, published));
  } catch (_) {
    // Never forward database errors, learner records, or credentials to the caller/logs.
    return res.status(502).json({ error: 'Could not load saved progress. Retry shortly.' });
  }
};
