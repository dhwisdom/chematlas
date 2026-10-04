'use strict';

const {buildSummary, stateKeys} = require('../lib/learning-summary.cjs');
const service = require('../lib/reminder-service.cjs');
const BATCH = 25;

module.exports = async function handler(req, res) {
  service.headers(res);
  if (!['GET','POST'].includes(req.method)) {
    res.setHeader('Allow','GET, POST');
    return res.status(405).json({error:'GET or POST required.'});
  }
  if (!service.authorize(req,res)) return;
  if (Object.keys(req.query || {}).length) return res.status(400).json({error:'Query parameters are not supported.'});
  const body = req.body ?? {};
  if (typeof body !== 'object' || Array.isArray(body) || body === null) return res.status(400).json({error:'A JSON object is required.'});
  const action = body.action || 'prepare';
  const allowed = action === 'acknowledge' ? ['action','deliveryId','status'] : ['action'];
  if (!['prepare','acknowledge'].includes(action) || Object.keys(body).some(key => !allowed.includes(key)) || (req.method === 'GET' && Object.keys(body).length)) {
    return res.status(400).json({error:'Unsupported reminder request.'});
  }
  if (action === 'acknowledge' && (!service.uuid(body.deliveryId) || !['sent','failed'].includes(body.status))) {
    return res.status(400).json({error:'A valid deliveryId and sent or failed status are required.'});
  }
  try {
    if (action === 'acknowledge') {
      const rows = await service.rpc('acknowledge_review_reminder', {p_delivery_id:body.deliveryId, p_status:body.status});
      if (!rows.length) return res.status(404).json({error:'Delivery not found.'});
      return res.status(200).json({acknowledged:true, status:rows[0].status});
    }
    const now = Date.now(), timestamp = new Date(now).toISOString();
    const preferences = await service.rest('notification_preferences', {parameters:{
      select:'user_id,unsubscribe_token', review_reminders:'eq.true',
      or:'(next_eligible_at.is.null,next_eligible_at.lte.' + timestamp + ')',
      order:'last_checked_at.asc.nullsfirst,user_id.asc', limit:String(BATCH)
    }});
    // With no opted-in users, don't request account or progress data.
    if (!preferences.length) return res.status(200).json({preview:req.method === 'GET', checked:0, skipped:0, errors:0, batchFull:false, reminders:[]});
    const published = await service.rest('site_published', {publicRead:true, parameters:{select:'key,payload', key:'like.module:*'}});
    const reminders = [];
    let skipped = 0, errors = 0, checked = 0;
    // Limit concurrent upstream calls and isolate failures so prepared deliveries stay in the response.
    for (let start = 0; start < preferences.length; start += 5) {
      // Leave time to finish the in-flight wave and return claimed emails within the function budget.
      if (Date.now() - now > 35000) break;
      await Promise.all(preferences.slice(start,start+5).map(async preference => {
        checked++;
        try {
          const rows = await service.rest('learner_state', {parameters:{select:'state_key,state_value,updated_at',
            user_id:'eq.' + preference.user_id, state_key:'in.(' + stateKeys.join(',') + ')'}});
          const summary = buildSummary(rows,published,now);
          if (!summary.hasSyncedProgress || !summary.reviewsDue.length) { skipped++; return; }
          // Email destination always comes from the verified Auth account, never caller input.
          const account = await service.request('/auth/v1/admin/users/' + preference.user_id);
          if (account.id !== preference.user_id || !account.email_confirmed_at || !account.email || account.is_anonymous ||
              (account.banned_until && Date.parse(account.banned_until) > now) || account.deleted_at) { skipped++; return; }
          let token = preference.unsubscribe_token, deliveryId = null;
          // Render before claiming so a template error cannot reserve a delivery.
          let email = service.renderReminder(summary,token);
          if (req.method === 'POST') {
            const claim = await service.rpc('claim_review_reminder',{p_user_id:preference.user_id});
            if (!claim.length) { skipped++; return; }
            deliveryId = claim[0].delivery_id;
            token = claim[0].unsubscribe_token;
            email = service.renderReminder(summary,token);
          }
          reminders.push({deliveryId, to:account.email, email});
        } catch (_) {
          errors++;
        } finally {
          if (req.method === 'POST') {
            try {
              await service.rest('notification_preferences',{method:'PATCH', parameters:{user_id:'eq.' + preference.user_id}, body:{last_checked_at:timestamp}});
            } catch (_) { errors++; }
          }
        }
      }));
    }
    return res.status(200).json({preview:req.method === 'GET', checked, skipped, errors,
      batchFull:preferences.length === BATCH || checked < preferences.length, reminders});
  } catch (_) {
    console.error('[review-reminders] service request failed');
    return res.status(502).json({error:'Could not prepare reminders. Retry the preparation request shortly.'});
  }
};
