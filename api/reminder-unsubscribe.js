'use strict';

const service = require('../lib/reminder-service.cjs');
const page = (copy, form = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ChemWaypoint email preferences</title></head><body style="margin:0;background:#eef3f0;font:16px/1.7 Arial,Helvetica,sans-serif;color:#263f37;"><main style="max-width:480px;margin:8vh auto;padding:28px;background:white;border:1px solid #dce6e0;"><p style="color:#087b76;font-weight:bold;">CHEMWAYPOINT</p><h1 style="font-size:25px;">Review reminders</h1><p>${copy}</p>${form}<p><a href="/progress" style="color:#087b76;">Back to your progress</a></p></main></body></html>`;

module.exports = async function handler(req,res) {
  service.headers(res);
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
  if (!['GET','POST'].includes(req.method)) {res.setHeader('Allow','GET, POST');return res.status(405).send(page('GET or POST required.'));}
  const token = req.query?.token;
  if (!service.uuid(token) || Object.keys(req.query || {}).some(key => key !== 'token')) return res.status(400).send(page('This reminder link is invalid. You can change reminders in Account &amp; sync.'));
  // Link scanners may fetch GET: only an explicit form POST changes the preference.
  if (req.method === 'GET') return res.status(200).send(page('Turn off chemistry review reminders? You can enable them again in Account &amp; sync.',
    `<form method="post" action="/api/reminder-unsubscribe?token=${token}"><button type="submit" style="background:#087b76;color:white;border:0;padding:13px 18px;font-size:16px;cursor:pointer;">Turn off reminders</button></form>`));
  if (!service.configured()) return res.status(503).send(page('Email preferences are temporarily unavailable. Please try again shortly.'));
  try {
    const rows = await service.rest('notification_preferences',{method:'PATCH', parameters:{unsubscribe_token:'eq.' + token, select:'review_reminders'}, body:{review_reminders:false}});
    return res.status(rows.length ? 200 : 400).send(page(rows.length ? 'Review reminders are turned off. You can enable them again in Account &amp; sync.' : 'This link has expired. You can change reminders in Account &amp; sync.'));
  } catch (_) {return res.status(502).send(page('Could not update your preference. Please try again shortly.'));}
};
