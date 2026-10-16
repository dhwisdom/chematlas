const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const path=require('path'),base=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(base,f),'utf8');
const settle=()=>new Promise(r=>setTimeout(r,20));
async function setup(signed=true){
 const dom=new JSDOM('<main class="main"></main><button data-account-open>Account</button>',{url:'https://www.chemwaypoint.com/companion',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;let session=signed?{user:{id:'user-a'},access_token:'test-user-a'}:null;const callbacks=[],calls=[],errors=[];let holdChat;
 const progress={completed:3,mastered:0,total:19,dueForReview:[{id:'measurement',title:'Measurement'}],recommendedNext:{id:'stoichiometry',title:'Stoichiometry',url:'/genchem/stoichiometry'}};
 const cloud={auth:{getSession:async()=>({data:{session}}),onAuthStateChange:fn=>callbacks.push(fn)},from(){return {select(){return this},eq:async()=>({data:[{state_key:'chematlas-assessment-events-v1',state_value:[]}]})}}};
 w.CHEMATLAS_CONFIG={supabaseUrl:'https://project.test',supabasePublishableKey:'public-key',tutorEndpoint:'/api/tutor'};w.ChemAtlasCloud=async()=>cloud;
 w.addEventListener('error',e=>errors.push(e.error));
 w.fetch=async(url,options)=>{const body=JSON.parse(options.body);calls.push({url,body,headers:options.headers});let result;if(url==='/api/tutor'){if(holdChat)return holdChat();result={answer:'A safe explanation <img src=x onerror=alert(1)>',webSources:[]};}
 else if(body.action==='get_learning_progress')result=progress;
 else if(body.action==='create_practice_set')result={sessionId:'practice-123',moduleId:'measurement',eligibleSpacedReview:false,questions:[0,1,2].map(i=>({id:'q'+i,question:'Question '+i,choices:['First','Second'],level:'Apply'}))};
 else if(body.action==='submit_practice_set')result={saved:true,moduleId:'measurement',correct:2,total:3,mastery:{label:'Building mastery',reviewWins:0},details:[{question:'Question',correct:true,explanation:'Safe <script>explanation</script>'}]};
 else if(body.action==='lookup_compound')result={compounds:[{CID:2244,MolecularFormula:'C9H8O4',MolecularWeight:'180.16',IUPACName:'Aspirin',url:'https://pubchem.ncbi.nlm.nih.gov/compound/2244'}]};
 return {ok:true,json:async()=>result};};
 for(const f of ['data/genchem.js','data/concept-checks.js','assessment.js','companion.js'])w.eval(read(f));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));await settle();
 return {w,d:w.document,calls,errors,change(next){session=next;for(const fn of callbacks)fn('SIGNED_OUT',next);},hold(fn){holdChat=fn;}};
}
(async()=>{
 const guest=await setup(false);assert(guest.d.querySelector('#caCompanionView'));assert.equal(guest.d.querySelector('#cwStartPractice').disabled,true);assert.equal(guest.d.querySelector('#cwAccountBadge').textContent,'Guest preview');assert.equal(guest.calls.length,0);
 guest.d.querySelector('[data-cw-tab="lessons"]').click();guest.d.querySelector('#cwLessonSearch').value='polarity';guest.d.querySelector('#cwLessonSearch').dispatchEvent(new guest.w.Event('input'));assert(guest.d.querySelector('#cwLessons').textContent.includes('Molecular Geometry'));assert(!guest.d.querySelector('[data-cw-read="geometry"]'),'guest cannot open gated lesson');
 const a=await setup();assert(a.d.querySelector('#cwProgress').textContent.includes('3/19'));assert(a.calls[0].headers.Authorization==='Bearer test-user-a');
 a.d.querySelector('#cwChatInput').value='Explain precision';a.d.querySelector('#cwChatForm').dispatchEvent(new a.w.Event('submit',{cancelable:true,bubbles:true}));await settle();assert(a.d.querySelector('#cwChat').textContent.includes('A safe explanation'));assert(!a.d.querySelector('#cwChat img'),'model output is text');assert(a.calls.find(c=>c.url==='/api/tutor').body.context.includes('Measurement'));
 a.d.querySelector('[data-cw-tab="practice"]').click();a.d.querySelector('#cwStartPractice').click();await settle();
 for(let i=0;i<3;i++){assert(a.d.querySelector('#cwQuestionHeading').textContent.includes('Question '+i));a.d.querySelector('[data-cw-choice="0"]').click();a.d.querySelector('#cwNextQuestion').click();await settle();}
 const submission=a.calls.find(c=>c.body.action==='submit_practice_set');assert.deepEqual(submission.body.args.choices,[0,0,0]);assert(!('user_id' in submission.body.args));assert(a.d.querySelector('#cwPractice').textContent.includes('2 of 3'));assert(a.d.querySelector('#cwPractice').textContent.includes('Building mastery'));assert(!a.d.querySelector('#cwPractice script'));assert(JSON.parse(a.w.localStorage.getItem('chematlas-genchem-completed-v1')).includes('measurement'));
 a.d.querySelector('[data-cw-tab="compounds"]').click();a.d.querySelector('#cwCompoundName').value='aspirin';a.d.querySelector('#cwCompoundForm').dispatchEvent(new a.w.Event('submit',{cancelable:true}));await settle();assert(a.d.querySelector('#cwCompoundResults').textContent.includes('180.16'));
 a.change(null);await settle();assert(!a.d.querySelector('#cwChat').textContent.includes('A safe explanation'));assert(!a.d.querySelector('#cwProgress').textContent.includes('3/19'));assert.equal(a.d.querySelector('#cwCompoundResults').textContent,'');assert.equal(a.d.querySelector('#cwPractice').textContent.includes('2 of 3'),false);
 const b=await setup();let resolveChat;b.hold(()=>new Promise(resolve=>{resolveChat=resolve;}));b.d.querySelector('#cwChatInput').value='private account question';b.d.querySelector('#cwChatForm').dispatchEvent(new b.w.Event('submit',{cancelable:true}));await settle();b.change({user:{id:'user-b'},access_token:'test-user-b'});await settle();resolveChat({ok:true,json:async()=>({answer:'OLD PRIVATE RESPONSE'})});await settle();assert(!b.d.querySelector('#cwChat').textContent.includes('OLD PRIVATE RESPONSE'));
 assert.deepEqual(a.errors,[]);assert.deepEqual(guest.errors,[]);assert.deepEqual(b.errors,[]);guest.w.close();a.w.close();b.w.close();console.log('PASS: guest gating, signed-in progress, safe course-grounded chat, first-answer practice and save, compound lookup, sign-out clearing, and cross-account stale response isolation.');
})().catch(e=>{console.error(e);process.exit(1);});
