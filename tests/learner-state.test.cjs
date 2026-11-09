const {test}=require('node:test'),assert=require('node:assert/strict');
const {create,OWNER,CACHE}=require('../learner-state.js');
function storage(initial={}){const values=new Map(Object.entries(initial));return {get length(){return values.size},key:i=>[...values.keys()][i],getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};}
const KEY='chematlas-assessment-events-v1';
test('account checkpoints restore exactly without copying A into B or changing auth storage',()=>{
  const s=storage({'sb-auth':'untouched'}),state=create(s);state.transition('A');s.setItem(KEY,'A evidence');s.setItem('chematlas-tutor-threads-v2','A private conversation');
  state.transition('B');assert.equal(s.getItem(KEY),null);assert.equal(s.getItem('chematlas-tutor-threads-v2'),null);s.setItem(KEY,'B evidence');
  state.transition('A');assert.equal(s.getItem(KEY),'A evidence');assert.equal(s.getItem('chematlas-tutor-threads-v2'),'A private conversation');assert.equal(s.getItem('sb-auth'),'untouched');
  state.transition('B');assert.equal(s.getItem(KEY),'B evidence');
});
test('first explicit guest claim preserves guest backup and cannot be claimed by another account',()=>{
  const s=storage({[KEY]:'guest evidence'}),state=create(s);state.transition('A',{claimGuest:true});assert.equal(s.getItem(KEY),'guest evidence');
  state.transition(null);assert.equal(s.getItem(KEY),'guest evidence');state.transition('B',{claimGuest:true});assert.equal(s.getItem(KEY),null);
});
test('ambiguous unowned history on restored sign-in stays archived, never uploaded or claimed later',()=>{
  const legacy='[{"label":"General Chemistry lesson completed","value":"[]"}]';
  const s=storage({'chematlas-practice-history-v1':legacy}),state=create(s);state.transition('A');assert.equal(s.getItem('chematlas-practice-history-v1'),null);
  assert.equal(JSON.parse(s.getItem(CACHE)).states.guest['chematlas-practice-history-v1'],legacy);
  state.transition(null);state.transition('B',{claimGuest:true});assert.equal(s.getItem('chematlas-practice-history-v1'),null);
});
test('session restore with the same owner preserves interrupted evidence and does not replace active keys',()=>{
  const s=storage({[OWNER]:'account:A',[KEY]:'partial assessment'}),state=create(s);assert.equal(state.transition('A'),false);assert.equal(s.getItem(KEY),'partial assessment');
});
test('failure to save a checkpoint does not delete the active learner state',()=>{
  const s=storage({[KEY]:'preserved'}),put=s.setItem;s.setItem=(k,v)=>{if(k===CACHE)throw Error('quota');put(k,v)};
  const state=create(s);assert.throws(()=>state.transition('A'),/quota/);assert.equal(s.getItem(KEY),'preserved');assert.equal(state.owner,'guest');
});
