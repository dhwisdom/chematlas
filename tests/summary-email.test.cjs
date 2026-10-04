'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {buildSummary,stateKeys}=require('../lib/learning-summary.cjs');
const {renderEmail}=require('../lib/summary-email.cjs');
const course=require('../data/genchem.js');
const now=Date.parse('2026-10-04T18:00:00Z');
test('HTML email includes actual totals, direct review links and sync information',()=>{
  const summary=buildSummary([{state_key:stateKeys[1],state_value:['measurement','atoms-moles','formulas'],updated_at:'2026-10-03T23:40:00Z'}],[],now);
  assert.equal(summary.counts.completed,3);assert.equal(summary.counts.reviewsDue,3);
  assert.match(summary.email.html,/3\/19/);assert.match(summary.email.html,/Start a quick review/);
  assert.match(summary.email.html,/href="https:\/\/www\.chemwaypoint\.com\/genchem\/measurement\?review=1"/);
  assert.match(summary.email.html,/Oct 3, 2026, 6:40 PM CDT/);
  assert.match(summary.email.text,/Total lessons completed: 3 of 19/);
  assert.match(summary.email.html,/No new lesson completions were recorded/);
});
test('empty and stale progress warnings remain visible in HTML',()=>{
  const empty=buildSummary([],[],now);
  assert.match(empty.email.html,/No cloud-synced progress found/);
  assert.match(empty.email.html,/No synced record/);
  assert.match(empty.email.html,/Continue learning/);
  assert.match(empty.email.html,/No reviews are due right now/);
  const stale=buildSummary([{state_key:stateKeys[1],state_value:[],updated_at:'2026-09-01T00:00:00Z'}],[],now);
  assert.match(stale.email.html,/more than seven days ago/);
});
test('published titles are escaped in headings, link text and lists',()=>{
  const title='<img src=x onerror="alert(1)"> & Chemistry';
  const summary=buildSummary([], [{key:'module:measurement',payload:{...course.modules[0],title}}],now);
  assert.match(summary.email.html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp; Chemistry/);
  assert(!summary.email.html.includes('<img'));assert(!summary.email.html.includes('<script'));
});
test('email links reject external or executable URLs and do not require remote assets',()=>{
  const summary=buildSummary([],[],now);summary.nextStep.url='javascript:alert(1)';
  summary.reviewsDue=[{title:'Unsafe link',reviewUrl:'https://example.org/',url:'https://example.org/'}];
  const html=renderEmail(summary);
  assert(!html.includes('javascript:'));assert(!html.includes('example.org'));assert(!html.includes('<script'));
  assert(!html.includes('<img'));assert(!html.includes('<link'));
  for(const match of html.matchAll(/href="([^"]+)"/g)) assert(match[1].startsWith('https://www.chemwaypoint.com/'));
});
