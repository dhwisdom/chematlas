'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(require.resolve('../platform.js'),'utf8');
const accountSource=source.slice(source.indexOf('  function renderAccount()'),source.indexOf('  async function authSubmit('));
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function setup({preference=null,saveError=false,loadError=false}={}){
  const dom=new JSDOM('<h2 id="caAccountTitle"></h2><p id="caAccountCopy"></p><div id="caAccountBody"></div>',{runScripts:'outside-only'}),w=dom.window,calls=[];
  w.testSession={user:{id:'one',email:'one@example.invalid'}};
  w.fakeCloud={from(table){let op='read',body;const builder={select(){return builder;},eq(field,value){calls.push({field,value});return builder;},maybeSingle:async()=>({data:preference,error:loadError?{}:null}),update(value){op='update';body=value;return builder;},insert(value){op='insert';body=value;return builder;},single:async()=>{calls.push({table,op,body});return {data:{review_reminders:body.review_reminders},error:saveError?{}:null};}};return builder;}};
  w.eval(`(()=>{const cfg={},cloud=window.fakeCloud;let session=window.testSession;const esc=v=>v;const syncAll=()=>{},updateSyncBadge=()=>{};${accountSource}window.renderAccount=renderAccount;window.setSession=value=>session=value;})();`);
  w.renderAccount();return {w,d:w.document,calls,close:()=>w.close()};
}
test('missing preference starts off; enabling saves for the signed-in account',async t=>{
  const x=setup();t.after(x.close);await settle();const input=x.d.getElementById('caReviewReminders');
  assert.equal(x.d.getElementById('caAccountTitle').textContent,'Account & sync');assert(!x.d.getElementById('caAccountCopy').textContent.includes('Guest mode'));
  assert.equal(input.checked,false);assert.equal(input.disabled,false);input.checked=true;input.dispatchEvent(new x.w.Event('change'));await settle();
  assert(x.calls.some(c=>c.op==='insert'&&c.body.user_id==='one'&&c.body.review_reminders===true));assert.match(x.d.getElementById('caReminderFeedback').textContent,/Saved/);
});
test('saved opt-in loads and can be turned off; failed save restores prior state',async t=>{
  for(const saveError of [false,true])await t.test(String(saveError),async t=>{
    const x=setup({preference:{review_reminders:true},saveError});t.after(x.close);await settle();const input=x.d.getElementById('caReviewReminders');
    assert(input.checked);input.checked=false;input.dispatchEvent(new x.w.Event('change'));await settle();assert.equal(input.checked,saveError);assert.equal(input.disabled,false);
    assert.match(x.d.getElementById('caReminderFeedback').textContent,saveError?/Could not save/:/are off/);
  });
});
test('failed load remains disabled; signed-out account has no reminder control',async t=>{
  const x=setup({loadError:true});t.after(x.close);await settle();assert(x.d.getElementById('caReviewReminders').disabled);assert.match(x.d.getElementById('caReminderFeedback').textContent,/Could not load/);
  x.w.setSession(null);x.w.renderAccount();assert.equal(x.d.getElementById('caReviewReminders'),null);assert.match(x.d.getElementById('caAccountCopy').textContent,/Guest mode/);
});
