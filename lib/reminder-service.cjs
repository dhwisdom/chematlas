'use strict';

const { createHash, timingSafeEqual } = require('node:crypto');
const config = require('../data/platform-config.js');
const uuid = value => typeof value === 'string' && /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value);
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function headers(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function authorize(req, res) {
  const token = process.env.CHEMWAYPOINT_AUTOMATION_TOKEN || '';
  if (token.length < 32 || token.length > 512 || /\s/.test(token) || !configured()) {
    res.status(503).json({error:'Reminder automation is not configured.'});
    return false;
  }
  const supplied = typeof req.headers.authorization === 'string' ? req.headers.authorization.match(/^Bearer ([^\s]{1,512})$/i)?.[1] : null;
  const digest = value => createHash('sha256').update(value).digest();
  if (!supplied || !timingSafeEqual(digest(supplied), digest(token))) {
    res.status(401).json({error:'A valid automation credential is required.'});
    return false;
  }
  return true;
}

function configured() { return (process.env.SUPABASE_SECRET_KEY || '').startsWith('sb_secret_'); }

async function request(path, {parameters = {}, method = 'GET', body, publicRead = false} = {}) {
  const url = new URL(path, config.supabaseUrl);
  url.search = new URLSearchParams(parameters).toString();
  const response = await fetch(url, {
    method, headers:{apikey:publicRead ? config.supabasePublishableKey : process.env.SUPABASE_SECRET_KEY,
      Accept:'application/json', 'Content-Type':'application/json', Prefer:'return=representation'},
    ...(body === undefined ? {} : {body:JSON.stringify(body)}),
    signal:AbortSignal.timeout(4000), redirect:'error'
  });
  if (!response.ok) throw new Error('Reminder service unavailable');
  return response.status === 204 ? null : response.json();
}

const rest = (table, options) => request('/rest/v1/' + table, options);
const rpc = (name, body) => rest('rpc/' + name, {method:'POST', body});

function renderReminder(summary, token) {
  if (!uuid(token)) throw new Error('Invalid unsubscribe token');
  const unsubscribeUrl = 'https://www.chemwaypoint.com/api/reminder-unsubscribe?token=' + token;
  const reviews = summary.reviewsDue;
  const href = value => {
    try { const url = new URL(value); return url.origin === 'https://www.chemwaypoint.com' ? url.href : 'https://www.chemwaypoint.com/progress'; }
    catch (_) { return 'https://www.chemwaypoint.com/progress'; }
  };
  const subject = 'Time for a chemistry review';
  const text = ['Your ChemWaypoint review reminder',
    'A short review can help keep these concepts fresh. Based on your saved progress, these lessons are ready to revisit:',
    ...reviews.map(lesson => lesson.title + ' — ' + href(lesson.reviewUrl)),
    ...summary.warnings,
    'You enabled review reminders in Account & sync. We send at most one reminder every seven days.',
    'Turn off reminders: ' + unsubscribeUrl].join('\n\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;background:#eef3f0;font-family:Arial,Helvetica,sans-serif;color:#263f37;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dce6e0;">
<tr><td style="padding:28px;background:#174c49;color:#ffffff;"><p style="margin:0;font-size:13px;letter-spacing:2px;">CHEMWAYPOINT</p><h1 style="margin:14px 0 0;font-size:27px;line-height:1.3;">Keep your chemistry fresh</h1></td></tr>
<tr><td style="padding:28px;font-size:16px;line-height:1.7;"><p style="margin:0 0 18px;">You have ${reviews.length} ${reviews.length === 1 ? 'lesson' : 'lessons'} ready for review. Start with one whenever you have a few minutes.</p>
${reviews.map(lesson => `<p style="padding:12px 0;border-bottom:1px solid #e5eeea;margin:0;"><a href="${escape(href(lesson.reviewUrl))}" style="color:#087b76;font-weight:bold;">${escape(lesson.title)} &rarr;</a></p>`).join('')}
${summary.warnings.map(warning => `<p style="font-size:13px;color:#6b5129;">${escape(warning)}</p>`).join('')}
<p style="margin:24px 0 0;"><a href="https://www.chemwaypoint.com/progress" style="color:#087b76;">See your progress</a></p></td></tr>
<tr><td style="padding:20px 28px;background:#f6f8f6;color:#697b73;font-size:12px;line-height:1.7;">You enabled review reminders in Account &amp; sync. At most one reminder every seven days.<br><a href="${unsubscribeUrl}" style="color:#087b76;">Turn off review reminders</a></td></tr>
</table></td></tr></table></body></html>`;
  return {subject, text, html};
}

module.exports = {headers, authorize, configured, request, rest, rpc, uuid, renderReminder};
