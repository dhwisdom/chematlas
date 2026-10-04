'use strict';

const ORIGIN = 'https://www.chemwaypoint.com';
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const date = (value, withTime = false) => new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric',
  ...(withTime ? {hour:'numeric', minute:'2-digit', timeZoneName:'short'} : {})
}).format(new Date(value));

function renderEmail(summary) {
  const {counts, completedInPeriod, mastered, reviewsDue, nextStep, period, lastSyncedAt, warnings} = summary;
  // URLs originate in the summary builder. Enforce the first-party origin here too.
  const href = value => {
    try { const url = new URL(value); return escape(url.origin === ORIGIN ? url.href : ORIGIN + '/progress'); }
    catch (_) { return ORIGIN + '/progress'; }
  };
  const links = (lessons, action = 'Open lesson', review = false) => lessons.map(lesson => `
    <tr><td style="padding:12px 0;border-bottom:1px solid #e5eeea;font-size:15px;line-height:1.5;word-break:break-word;">
      <a href="${href(review ? lesson.reviewUrl : lesson.url)}" style="color:#087b76;font-weight:bold;text-decoration:underline;">${escape(lesson.title)}</a>
      <div style="font-size:12px;color:#60746e;margin-top:3px;">${escape(action)}</div>
    </td></tr>`).join('');
  const section = (heading, lessons, empty, action, review = false) => `
    <h2 style="font-size:19px;line-height:1.3;color:#174c49;margin:28px 0 8px;">${heading}</h2>
    ${lessons.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${links(lessons,action,review)}</table>` : `<p style="margin:0;color:#60746e;font-size:14px;line-height:1.6;">${empty}</p>`}`;
  const cta = nextStep.type === 'review' ? 'Start a quick review' : nextStep.type === 'lesson' ? 'Continue learning' : 'View your progress';
  const stats = [
    [counts.completed + '/' + counts.totalLessons, 'Lessons completed'],
    [counts.mastered, 'Mastery demonstrated'],
    [counts.reviewsDue, 'Reviews due']
  ].map(([value,label])=>`<td class="stat" width="33.33%" valign="top" style="padding:14px 8px;background:#edf5f1;border:3px solid #ffffff;text-align:center;">
      <div style="font-size:27px;line-height:1.2;font-weight:bold;color:#174c49;">${escape(value)}</div>
      <div style="font-size:12px;line-height:1.4;color:#48675e;margin-top:5px;">${label}</div>
    </td>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Your ChemWaypoint learning summary</title>
<style>@media only screen and (max-width:480px){.content{padding:24px 18px!important}.stat{display:block!important;width:auto!important;text-align:left!important}}</style></head>
<body style="margin:0;padding:0;background:#eef3f0;color:#263f37;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${counts.completedInPeriod} lessons completed in the last 7 days. ${counts.reviewsDue} reviews ready to revisit.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef3f0;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dce6e0;border-radius:16px;overflow:hidden;">
<tr><td style="background:#174c49;padding:28px 28px 26px;color:#ffffff;">
  <div style="font-size:13px;font-weight:bold;letter-spacing:2px;color:#c0e4d8;">CHEMWAYPOINT</div>
  <h1 style="font-size:28px;line-height:1.2;margin:14px 0 8px;color:#ffffff;">Your week in chemistry</h1>
  <p style="font-size:14px;line-height:1.5;margin:0;color:#d0e7df;">${date(period.from)} &ndash; ${date(period.to)}<br>Learning summary &middot; Last 7 days</p>
</td></tr>
<tr><td class="content" style="padding:28px;">
  <p style="margin:0 0 20px;font-size:16px;line-height:1.7;">A look at what you&rsquo;ve covered, what&rsquo;s sticking, and what to revisit next.</p>
  ${warnings.map(warning=>`<p style="padding:14px 16px;background:#fff7e5;border-left:3px solid #bd8a28;color:#6b5129;font-size:14px;line-height:1.6;margin:0 0 20px;">${escape(warning)}</p>`).join('')}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${stats}</tr></table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;background:#f3f8f5;border:1px solid #dce9e1;border-radius:10px;"><tr><td style="padding:20px;">
    <div style="font-size:11px;font-weight:bold;letter-spacing:1.5px;color:#087b76;">YOUR NEXT STEP</div>
    <h2 style="font-size:20px;line-height:1.4;color:#174c49;margin:8px 0 16px;">${escape(nextStep.title)}</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#087b76" style="border-radius:6px;">
      <a href="${href(nextStep.url)}" style="display:inline-block;padding:13px 19px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;border-radius:6px;">${cta} &rarr;</a>
    </td></tr></table>
  </td></tr></table>
  ${section('Completed in the last 7 days',completedInPeriod,'No new lesson completions were recorded in this period. Earlier completions are included in your total above.','Revisit this lesson')}
  ${section('Ready for reinforcement',reviewsDue,'No reviews are due right now. Your next step is shown above.','Open a review — recall an earlier concept',true)}
  ${section('Mastery demonstrated',mastered,'Mastery builds through successful reviews on later days. A completed lesson is the first step.','Understanding demonstrated through spaced reviews')}
  <p style="font-size:13px;line-height:1.7;color:#60746e;margin:24px 0 0;padding-top:18px;border-top:1px solid #e5eeea;">Completion records what you covered. Mastery reflects what you can recall over time.</p>
  <p style="margin:12px 0 0;font-size:14px;"><a href="${ORIGIN}/progress" style="color:#087b76;text-decoration:underline;">See all your progress &rarr;</a></p>
</td></tr>
<tr><td style="padding:18px 28px;background:#f6f8f6;border-top:1px solid #e5eeea;font-size:12px;line-height:1.7;color:#697b73;">
  Last progress sync: ${lastSyncedAt ? date(lastSyncedAt,true) : 'No synced record'}<br>
  Based on saved ChemWaypoint progress. Dates and times use Central Time.
</td></tr>
</table></td></tr></table>
</body></html>`;
}

module.exports = { renderEmail };
