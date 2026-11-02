/* On-site Companion: one existing account, one curriculum, one progress record. */
(() => {
 'use strict';
 if(window.ChemWaypointCompanion)return;
 const cfg=window.CHEMATLAS_CONFIG||{};
 const API=cfg.supabaseUrl+'/functions/v1/chemwaypoint-site-companion';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 const modules=()=>window.CHEM_GENCHEM?.modules||[];
 const allowed=m=>Boolean(session)||['measurement','atoms-moles'].includes(m.id);
 let root,cloud,session=null,epoch=0,authReady=false,tab='chat',progress=null,messages=[],practice=null,selected=null,questionIndex=0,choices=[],chatBusy=false,practiceBusy=false,practiceFailure=null,submissionChoices=null;
 const controllers=new Set();
 const byId=id=>root?.querySelector('#'+id);
 function status(id,text,error=false){const el=byId(id);if(el){el.textContent=text;el.classList.toggle('error',error);}}
 function navigate(path){history.pushState({},'',path);window.dispatchEvent(new PopStateEvent('popstate'));}
 function resetAccount(next){
  if(session?.user?.id===next?.user?.id&&authReady){session=next;return false;}
  epoch++;for(const c of controllers)c.abort();controllers.clear();session=next;progress=null;messages=[];practice=null;choices=[];selected=null;questionIndex=0;chatBusy=false;practiceBusy=false;practiceFailure=null;submissionChoices=null;authReady=true;
  if(root){byId('cwSources').replaceChildren();byId('cwCompoundResults').replaceChildren();byId('cwChatInput').value='';byId('cwCompoundName').value='';for(const id of ['cwChatStatus','cwPracticeStatus','cwAccountStatus','cwCompoundStatus'])status(id,'');byId('cwPracticeStatus').classList.remove('cw-recovery');renderChat();renderProgress();renderPractice();renderLessons();renderAccount();}return true;
 }
 async function initializeAccount(){
  try{cloud=await window.ChemAtlasCloud();const {data,error}=await cloud.auth.getSession();if(error)throw error;resetAccount(data.session);
   cloud.auth.onAuthStateChange((_event,next)=>setTimeout(()=>{if(resetAccount(next)&&next)loadProgress();},0));
   if(session)await loadProgress();
  }catch{authReady=true;renderAccount();status('cwAccountStatus','Could not check your account. Open Account & sync to reconnect.',true);}
 }
 function mount(){
  if(document.getElementById('caCompanionView')){root=document.getElementById('caCompanionView');return;}
  const main=document.querySelector('.main');if(!main)return;
  root=document.createElement('section');root.id='caCompanionView';root.className='view ca-custom-view';
  root.innerHTML=`<div class="cw-intro"><div><p class="eyebrow">CHEMWAYPOINT COMPANION</p><h2>Your next question.<br>Your next step.</h2><p>Find the explanation, practice the reasoning, and pick up where you left off—all in your learning space.</p></div><span class="cw-badge" id="cwAccountBadge">Checking your account…</span></div>
  <div class="cw-layout"><section class="cw-workspace" aria-label="Companion tools"><div class="cw-tabs" role="tablist" aria-label="Companion tools">${[['chat','Ask companion'],['lessons','Lessons'],['practice','Practice'],['compounds','Compounds']].map(([id,label])=>`<button role="tab" id="cwTab-${id}" aria-controls="cwPanel-${id}" aria-selected="${id==='chat'}" tabindex="${id==='chat'?0:-1}" data-cw-tab="${id}">${label}</button>`).join('')}</div>
  <section id="cwPanel-chat" class="cw-panel" role="tabpanel" aria-labelledby="cwTab-chat"><div id="cwChat" class="cw-chat" role="log" aria-label="Companion conversation" aria-live="polite"></div><div id="cwSources" class="cw-source-list"></div><form id="cwChatForm" class="cw-compose"><label class="sr-only" for="cwChatInput">Your chemistry question</label><textarea id="cwChatInput" rows="3" maxlength="5000" placeholder="What would you like to understand?"></textarea><div class="cw-compose-foot"><label><input id="cwWeb" type="checkbox"> Include web context when useful</label><button class="cw-btn" id="cwSend" type="submit">Ask companion ↗</button></div></form><p id="cwChatStatus" class="cw-status" role="status"></p><p class="cw-hint">Grounded in ChemWaypoint lessons. Your conversation stays in this tab and clears when you switch accounts.</p><button class="cw-text-btn" id="cwClearChat" type="button">Start a new conversation</button></section>
  <section id="cwPanel-lessons" class="cw-panel" role="tabpanel" aria-labelledby="cwTab-lessons" hidden><p class="cw-subtitle">Search the curriculum by topic, concept, or learning goal.</p><form id="cwLessonForm" class="cw-input-row"><input id="cwLessonSearch" type="search" aria-label="Search lessons" placeholder="Try polarity, buffers, or dimensional analysis"><button class="cw-btn" type="submit">Find lessons</button></form><div id="cwLessons" class="cw-lesson-list"></div><div id="cwReading" class="cw-reading"></div></section>
  <section id="cwPanel-practice" class="cw-panel" role="tabpanel" aria-labelledby="cwTab-practice" hidden><p class="cw-subtitle">Work through a concept check, one question at a time. First answers are graded and saved to your account.</p><div class="cw-practice-top"><select id="cwPracticeModule" aria-label="Choose a practice lesson"></select><button id="cwStartPractice" class="cw-btn" type="button">Start practice</button></div><div id="cwPractice"></div><div id="cwPracticeStatus" class="cw-status" role="status"></div></section>
  <section id="cwPanel-compounds" class="cw-panel" role="tabpanel" aria-labelledby="cwTab-compounds" hidden><p class="cw-subtitle">Look up a compound in NIH PubChem, with a link to the original record.</p><form id="cwCompoundForm" class="cw-input-row"><input id="cwCompoundName" maxlength="150" aria-label="Compound name" placeholder="Try aspirin or sodium chloride" required><button id="cwCompoundSearch" class="cw-btn" type="submit">Look up compound</button></form><div id="cwCompoundResults"></div><p id="cwCompoundStatus" class="cw-status" role="status"></p></section></section>
  <aside class="cw-side"><section class="cw-progress-card"><p class="eyebrow">YOUR LEARNING</p><div id="cwProgress"></div><p id="cwAccountStatus" class="cw-status" role="status"></p></section><section class="cw-note"><strong>Completion is a beginning.</strong><p>Mastery comes from recalling a concept again later. Two fully correct, spaced reviews demonstrate mastery; immediate repeats are practice.</p></section></aside></div>`;
  main.appendChild(root);bind();renderChat();renderProgress();renderLessons();renderPractice();initializeAccount();
 }
 function renderAccount(){if(!root)return;byId('cwAccountBadge').textContent=!authReady?'Checking your account…':session?'Connected to your profile':'Guest preview';byId('cwStartPractice').disabled=!session||practiceBusy;byId('cwCompoundSearch').disabled=!session;}
 function switchTab(value){tab=value;root.querySelectorAll('[role=tab][data-cw-tab]').forEach(b=>{const active=b.dataset.cwTab===value;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;byId('cwPanel-'+b.dataset.cwTab).hidden=!active;});if(value==='lessons')renderLessons();if(value==='practice')renderPractice();}
 function renderChat(){
  const box=byId('cwChat');if(!box)return;
  if(!messages.length){box.innerHTML=`<div class="cw-chat-empty"><p class="eyebrow">LET’S MAKE IT CLICK</p><h3>Where does the chemistry stop making sense?</h3><p>Start with a question, or take one of these paths.</p><div class="cw-starters"><button data-cw-prompt="Help me understand the difference between accuracy and precision."><strong>Explain a concept</strong><small>Build a clearer mental model.</small></button><button data-cw-action="next"><strong>Find my next step</strong><small>Use my saved learning progress.</small></button><button data-cw-action="practice"><strong>Practice what I’m learning</strong><small>Check my understanding, one question at a time.</small></button><button data-cw-tab="lessons"><strong>Find the right lesson</strong><small>Connect a question to the curriculum.</small></button></div></div>`;}
  else {box.replaceChildren();for(const m of messages){const block=document.createElement('div');block.className='cw-message '+m.role+(m.error?' error':'');const label=document.createElement('small');label.textContent=m.role==='user'?'You':'Companion';const text=document.createElement('div');text.textContent=m.text;block.append(label,text);box.appendChild(block);}box.scrollTop=box.scrollHeight;}
  byId('cwSend').disabled=chatBusy;byId('cwSend').textContent=chatBusy?'Thinking…':'Ask companion ↗';byId('cwClearChat').disabled=chatBusy;
 }
 function renderProgress(){
  const box=byId('cwProgress');if(!box)return;
  if(!session){box.innerHTML=`<h3>Keep your learning with you.</h3><p>Sign in to see your completed lessons, due reviews, and next step.</p><button class="cw-btn" data-account-open>Sign in / create account</button>`;return;}
  if(!progress){box.innerHTML='<h3>Your progress</h3><p>Loading your saved learning record…</p><button class="cw-text-btn" data-cw-action="refresh">Refresh progress</button>';return;}
  box.innerHTML=`<h3>A good place to continue.</h3><div class="cw-metrics"><div><strong>${progress.completed}/${progress.total}</strong><small>lessons completed</small></div><div><strong>${progress.mastered}</strong><small>mastery demonstrated</small></div></div>${progress.recommendedNext?`<p>Next lesson</p><strong>${esc(progress.recommendedNext.title)}</strong><p><a href="${esc(progress.recommendedNext.url)}">Continue learning →</a></p>`:progress.total>0&&progress.completed===progress.total?'<p>You have completed the first pass through every lesson.</p>':'<p>Choose a lesson from the course map to keep learning.</p>'}<p><strong>${progress.dueForReview.length} reviews ready</strong></p><ul class="cw-review-list">${progress.dueForReview.slice(0,3).map(m=>`<li>${esc(m.title)}<br><button data-cw-review="${esc(m.id)}">Start review →</button></li>`).join('')}</ul><button class="cw-text-btn" data-cw-action="refresh">Refresh progress</button>`;
 }
 function connectionError(code){
  const messages={auth:'Your session expired or changed. Sign in again, then retry.',forbidden:'This account cannot use saved practice yet. Confirm your email or check your account.',missing:'The learning service is unavailable at this address. Please try again later.',server:'The learning service could not complete the request. Please try again.',invalid:'The learning service returned an unexpected response. Please try again.',timeout:'The request took too long. Check your connection and try again.',network:'Could not connect to your learning tools. Check your connection and try again.',validation:'This request could not be saved. Check your selection or try again.'};
  return Object.assign(new Error(messages[code]||messages.network),{code});
 }
 async function request(action,args={}){
  if(!cloud||!session)throw connectionError('auth');
  const requestEpoch=epoch,userId=session.user.id,controller=new AbortController();controllers.add(controller);let timedOut=false;
  const timeout=setTimeout(()=>{timedOut=true;controller.abort();},30000);
  try{
   const {data,error}=await cloud.auth.getSession();
   if(requestEpoch!==epoch)throw new DOMException('Account changed','AbortError');
   if(error||!data.session||data.session.user.id!==userId)throw connectionError('auth');
   const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',apikey:cfg.supabasePublishableKey,Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({action,args}),signal:controller.signal});
   if(requestEpoch!==epoch)throw new DOMException('Account changed','AbortError');
   if(!response.ok)throw connectionError(response.status===401?'auth':response.status===403?'forbidden':response.status===404?'missing':response.status>=500?'server':'validation');
   const result=await response.json().catch(()=>{throw connectionError('invalid');});
   if(requestEpoch!==epoch)throw new DOMException('Account changed','AbortError');
   if(!result||typeof result!=='object')throw connectionError('invalid');
   if(action==='create_practice_set'&&(!result.sessionId||!Array.isArray(result.questions)||!result.questions.length||result.questions.some(q=>!q.question||!Array.isArray(q.choices)||!q.choices.length)))throw connectionError('invalid');
   if(action==='submit_practice_set'&&(!result.moduleId||!Number.isInteger(result.correct)||!Number.isInteger(result.total)||!Array.isArray(result.details)))throw connectionError('invalid');
   return result;
  }catch(error){
   if(requestEpoch!==epoch)throw new DOMException('Account changed','AbortError');
   if(timedOut)throw connectionError('timeout');
   if(error.code&&typeof error.code==='string')throw error;
   throw connectionError('network');
  }finally{clearTimeout(timeout);controllers.delete(controller);}
 }
 function practiceRecovery(error,action,moduleId){
  practiceFailure={error,action,moduleId};
  const el=byId('cwPracticeStatus');status('cwPracticeStatus','',true);el.classList.add('cw-recovery');
  const message=document.createElement('p');message.textContent=error.message;
  const retained=document.createElement('p');retained.textContent=action==='submit'?'Your first answers are retained in this tab. Retry saving the same answers.':'Your selected lesson is retained. Retry when you are ready.';
  el.append(message,retained);
  if(error.code==='auth'||error.code==='forbidden'){
   const account=document.createElement('button');account.type='button';account.className='cw-btn secondary';account.dataset.accountOpen='';account.textContent=error.code==='auth'?'Sign in / reconnect':'Check account';el.append(account);
  }
  if(error.code==='auth'&&cloud?.auth.refreshSession){const reconnect=document.createElement('button');reconnect.type='button';reconnect.className='cw-btn secondary';reconnect.dataset.cwAction='reconnect-practice';reconnect.textContent='Reconnect and retry';el.append(reconnect);}
  const retry=document.createElement('button');retry.type='button';retry.className='cw-btn';retry.dataset.cwAction='retry-practice';retry.textContent=action==='submit'?'Retry save':'Retry practice';el.append(retry);if(tab==='practice')retry.focus();
 }
 async function reconnectPractice(){
  if(!practiceFailure||practiceBusy||!session||!cloud?.auth.refreshSession)return;
  const ownEpoch=epoch,userId=session.user.id,failure=practiceFailure;practiceBusy=true;renderAccount();
  try{const {data,error}=await cloud.auth.refreshSession();if(ownEpoch!==epoch)return;
   if(error||!data.session||data.session.user.id!==userId)throw connectionError('auth');
   session=data.session;practiceBusy=false;
   if(failure.action==='submit')await nextQuestion();else await startPractice(failure.moduleId);
  }catch(error){if(ownEpoch===epoch)practiceRecovery(connectionError('auth'),failure.action,failure.moduleId);}
  finally{if(ownEpoch===epoch){practiceBusy=false;renderAccount();}}
 }
 function clearPracticeFailure(){practiceFailure=null;byId('cwPracticeStatus')?.classList.remove('cw-recovery');}
 async function loadProgress(){if(!session)return;const ownEpoch=epoch;status('cwAccountStatus','Refreshing your saved progress…');try{const data=await request('get_learning_progress');if(ownEpoch!==epoch)return;progress=data;renderProgress();status('cwAccountStatus','Up to date with your ChemWaypoint account.');}catch(e){if(ownEpoch===epoch&&e.name!=='AbortError')status('cwAccountStatus',e.message,true);}}
 function rankLessons(query){const words=String(query||'').toLowerCase().match(/[a-z0-9]+/g)?.filter(w=>w.length>2)||[];return modules().map(m=>{const title=(m.title+' '+m.id).toLowerCase(),all=JSON.stringify([m.title,m.subtitle,m.outcomes,m.vocabulary,m.sections]).toLowerCase();return {m,score:words.reduce((s,w)=>s+(title.includes(w)?6:all.includes(w)?1:0),0)};}).filter(x=>!words.length||x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.m);}
 function renderLessons(){const box=byId('cwLessons');if(!box)return;const found=rankLessons(byId('cwLessonSearch')?.value).slice(0,12);box.innerHTML=found.length?found.map(m=>`<article class="cw-lesson"><small>General Chemistry ${m.semester} · Lesson ${m.number}</small><h3>${esc(m.title)}</h3><p>${esc(m.subtitle)}</p><div class="cw-lesson-actions">${allowed(m)?`<button class="cw-text-btn" data-cw-read="${esc(m.id)}">Read explanation →</button><a href="/genchem/${esc(m.id)}">Open lesson</a><button class="cw-text-btn" data-cw-review="${esc(m.id)}">Practice</button>`:'<button class="cw-text-btn" data-account-open>Sign in to open this lesson →</button>'}</div></article>`).join(''):'<p class="cw-status">No matching lessons yet. Try a broader chemistry topic.</p>';}
 function readLesson(id){const m=modules().find(m=>m.id===id);if(!m||!allowed(m))return;byId('cwReading').innerHTML=`<button class="cw-text-btn" data-cw-action="close-reading">← Back to results</button><h2>${esc(m.title)}</h2><p>${esc(m.subtitle)}</p><h3>What you’ll learn</h3><ul>${m.outcomes.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>${m.sections.map(s=>`<h3>${esc(s.title)}</h3>${s.body.map(v=>`<p>${esc(v)}</p>`).join('')}`).join('')}${(m.equations||[]).map(e=>`<p class="cw-equation"><strong>${esc(e.label)}</strong><br>${esc(e.expression)}</p>`).join('')}<h3>Worked example</h3><p>${esc(m.example.prompt)}</p><ol>${m.example.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p><strong>${esc(m.example.answer)}</strong></p><a href="/genchem/${esc(m.id)}">Open the full lesson →</a>`;byId('cwLessons').hidden=true;byId('cwReading').hidden=false;}
 async function ask(event){
  event?.preventDefault();const input=byId('cwChatInput');const question=input.value.trim();if(!question||chatBusy)return;
  chatBusy=true;renderChat();const ownEpoch=epoch;const conversation=messages.filter(m=>!m.error).slice(-10).map(m=>({role:m.role,content:m.text}));
  if(/^\s*(what.*(?:next|progress)|check my progress|what should i study)/i.test(question)&&session&&!progress)await loadProgress();
  if(ownEpoch!==epoch)return;const relevant=rankLessons(question).filter(allowed).slice(0,3);const context=relevant.map(m=>`${m.title}\n${m.outcomes.join('\n')}\n${m.sections.map(s=>s.title+'\n'+s.body.join('\n')).join('\n')}\n${m.equations.map(e=>e.label+': '+e.expression).join('\n')}`).join('\n\n').slice(0,18000);
  messages.push({role:'user',text:question});input.value='';chatBusy=true;renderChat();status('cwChatStatus','Finding the explanation in your course…');byId('cwSources').replaceChildren();
  const controller=new AbortController();controllers.add(controller);const timeout=setTimeout(()=>controller.abort(),60000);
  try{const response=await fetch(cfg.tutorEndpoint||'/api/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,conversation,context,includeWeb:byId('cwWeb').checked,learner:{goal:localStorage.getItem('chematlas-learning-goal-v1')||'Build chemistry understanding',currentModule:relevant[0]?.title||'',masterySummary:progress?`${progress.completed} lessons completed; ${progress.mastered} with mastery demonstrated. Due reviews: ${progress.dueForReview.map(m=>m.title).join(', ')}.`:'Saved progress unavailable. Do not infer completion or mastery.',nextStep:progress?.recommendedNext?.title||'not available'}}),signal:controller.signal});const data=await response.json();if(ownEpoch!==epoch)return;if(!response.ok||!data.answer)throw new Error(data.error||'The tutor did not return an explanation. Please try again.');messages.push({role:'assistant',text:data.answer});status('cwChatStatus','');const links=relevant.map(m=>({url:'/genchem/'+m.id,title:m.title}));for(const item of data.webSources||[]){try{if(new URL(item.url).protocol==='https:')links.push(item);}catch{}}
   byId('cwSources').innerHTML=links.map(l=>`<a href="${esc(l.url)}" ${l.url.startsWith('https:')?'target="_blank" rel="noopener"':''}>${esc(l.title)} ↗</a>`).join('');
  }catch(e){if(ownEpoch===epoch){const text=e.name==='AbortError'?'That request took too long. Please try again.':e.message;messages.push({role:'assistant',text,error:true});status('cwChatStatus',text,true);}}
  finally{clearTimeout(timeout);controllers.delete(controller);if(ownEpoch===epoch){chatBusy=false;renderChat();}}
 }
 function renderPractice(){const select=byId('cwPracticeModule');if(!select)return;const old=select.value;select.innerHTML=modules().map(m=>`<option value="${esc(m.id)}">${m.number}. ${esc(m.title)}</option>`).join('');if(modules().some(m=>m.id===old))select.value=old;renderAccount();const box=byId('cwPractice');if(!session){box.innerHTML='<p>Sign in to save practice to your ChemWaypoint account.</p><button class="cw-btn" data-account-open>Sign in / create account</button>';return;}
  if(!practice){box.innerHTML='<div class="cw-note"><strong>One concept, a few good questions.</strong><p>Choose a lesson above. You’ll answer each question once, then see explanations and your saved result.</p></div>';return;}
  if(practice.result){showResult(practice.result);return;}
  const q=practice.questions[questionIndex];box.innerHTML=`<div class="cw-question"><p class="eyebrow">QUESTION ${questionIndex+1} OF ${practice.questions.length} · ${esc(q.level||'Concept check')}</p><p class="cw-hint">${practice.eligibleSpacedReview?'This set is eligible for a spaced review.':'This set builds practice evidence.'}</p><h3 tabindex="-1" id="cwQuestionHeading">${esc(q.question)}</h3><div class="cw-options">${q.choices.map((c,i)=>`<button class="cw-option" type="button" data-cw-choice="${i}" aria-pressed="${selected===i}" ${practiceBusy||submissionChoices?'disabled':''}><span>${String.fromCharCode(65+i)}</span>${esc(c)}</button>`).join('')}</div><div class="cw-question-foot"><small class="cw-hint">Answers are checked after the full set.</small><button class="cw-btn" id="cwNextQuestion" type="button" ${(selected===null&&!submissionChoices)||practiceBusy?'disabled':''}>${practiceBusy?'Saving…':questionIndex===practice.questions.length-1?'Save answers':'Lock answer & continue →'}</button></div></div>`;
  byId('cwNextQuestion')?.addEventListener('click',nextQuestion);
 }
 async function startPractice(id){if(!session){document.querySelector('[data-account-open]')?.click();return;}if(practiceBusy)return;const ownEpoch=epoch,moduleId=id||byId('cwPracticeModule').value;let started=false;byId('cwPracticeModule').value=moduleId;clearPracticeFailure();practiceBusy=true;renderAccount();status('cwPracticeStatus','Preparing your concept checks…');try{const next=await request('create_practice_set',{module_id:moduleId});if(ownEpoch!==epoch)return;practice=next;started=true;questionIndex=0;choices=[];selected=null;submissionChoices=null;status('cwPracticeStatus','');}catch(e){if(ownEpoch===epoch&&e.name!=='AbortError')practiceRecovery(e,'start',moduleId);}finally{if(ownEpoch===epoch){practiceBusy=false;renderPractice();if(started)byId('cwQuestionHeading')?.focus();}}}
 async function nextQuestion(){
  if((selected===null&&!submissionChoices)||practiceBusy)return;if(!submissionChoices)choices[questionIndex]=selected;
  if(questionIndex<practice.questions.length-1){questionIndex++;selected=null;renderPractice();byId('cwQuestionHeading')?.focus();return;}
  const ownEpoch=epoch;submissionChoices=submissionChoices||choices.slice();clearPracticeFailure();practiceBusy=true;renderPractice();status('cwPracticeStatus','Grading and saving your first answers…');
  try{const result=await request('submit_practice_set',{session_id:practice.sessionId,choices:submissionChoices});if(ownEpoch!==epoch)return;practice.result=result;status('cwPracticeStatus','Saved to your ChemWaypoint account.');await reconcileProgress(result.moduleId,ownEpoch);await loadProgress();}
  catch(e){if(ownEpoch===epoch&&e.name!=='AbortError')practiceRecovery(e,'submit',practice.moduleId);}
  finally{if(ownEpoch===epoch){practiceBusy=false;renderPractice();const target=practiceFailure?byId('cwPracticeStatus').querySelector('[data-cw-action="retry-practice"]'):byId('cwPractice').querySelector('h2');if(target?.matches('h2'))target.setAttribute('tabindex','-1');target?.focus();}}
 }
 async function reconcileProgress(moduleId,ownEpoch){
  try{const {data,error}=await cloud.from('learner_state').select('state_key,state_value').eq('user_id',session.user.id);if(error)throw error;if(ownEpoch!==epoch)return;const row=(data||[]).find(r=>r.state_key==='chematlas-assessment-events-v1');if(row&&window.ChemAtlasAssessment){let existing=[];try{existing=JSON.parse(localStorage.getItem(row.state_key)||'[]');}catch{}localStorage.setItem(row.state_key,JSON.stringify(window.ChemAtlasAssessment.merge(existing,row.state_value)));}
   const key='chematlas-genchem-completed-v1';let completed=[];try{completed=JSON.parse(localStorage.getItem(key)||'[]');}catch{}localStorage.setItem(key,JSON.stringify([...new Set([...completed,moduleId])]));window.dispatchEvent(new Event('chematlas:progress-synced'));
  }catch{status('cwPracticeStatus','Your answers are saved. Refresh the page to update the lesson’s local progress indicator.');}
 }
 function showResult(result){byId('cwPractice').innerHTML=`<p class="eyebrow">PRACTICE SAVED</p><h2>${result.correct} of ${result.total} correct</h2><p>${esc(result.mastery?.label||'Lesson completed')} · ${result.mastery?.reviewWins||0}/2 spaced reviews demonstrated</p>${result.details.map(d=>`<article class="cw-result"><strong>${d.correct?'✓ Correct':'Review this concept'} · ${esc(d.question)}</strong><p>${esc(d.explanation)}</p>${d.callback?`<a href="/genchem/${esc(d.callback.moduleId)}?section=${d.callback.section||0}">Revisit the connected lesson →</a>`:''}</article>`).join('')}<button class="cw-btn secondary" data-cw-action="again">Practice again</button> <a href="/progress">View my progress →</a>`;}
 async function lookup(event){event.preventDefault();if(!session){status('cwCompoundStatus','Sign in to use compound lookup.',true);return;}const ownEpoch=epoch;byId('cwCompoundSearch').disabled=true;status('cwCompoundStatus','Looking up the compound in PubChem…');byId('cwCompoundResults').replaceChildren();try{const data=await request('lookup_compound',{name:byId('cwCompoundName').value.trim()});if(ownEpoch!==epoch)return;byId('cwCompoundResults').innerHTML=data.compounds.map(c=>`<article class="cw-compound"><p class="eyebrow">NIH PUBCHEM · CID ${c.CID}</p><h3>${esc(c.MolecularFormula)}</h3><dl><dt>Molecular weight</dt><dd>${esc(c.MolecularWeight)} g/mol</dd><dt>IUPAC name</dt><dd>${esc(c.IUPACName)}</dd><dt>SMILES</dt><dd>${esc(c.ConnectivitySMILES||c.CanonicalSMILES||'Not available')}</dd></dl><a href="${esc(c.url)}" target="_blank" rel="noopener">Open PubChem record ↗</a></article>`).join('');status('cwCompoundStatus',data.compounds.length>1?'Multiple records matched. Check the identity before using a result.':'Retrieved from NIH PubChem.');}catch(e){if(ownEpoch===epoch&&e.name!=='AbortError')status('cwCompoundStatus',e.message,true);}finally{if(ownEpoch===epoch)renderAccount();}}
 function bind(){
  root.addEventListener('click',event=>{const el=event.target.closest('button');if(!el)return;if(el.dataset.cwTab){switchTab(el.dataset.cwTab);return;}if(el.dataset.cwPrompt){byId('cwChatInput').value=el.dataset.cwPrompt;byId('cwChatInput').focus();return;}if(el.dataset.cwRead){readLesson(el.dataset.cwRead);return;}if(el.dataset.cwReview){switchTab('practice');byId('cwPracticeModule').value=el.dataset.cwReview;startPractice(el.dataset.cwReview);return;}if(el.dataset.cwChoice!=null){selected=Number(el.dataset.cwChoice);renderPractice();return;}
   const action=el.dataset.cwAction;if(action==='reconnect-practice')reconnectPractice();if(action==='retry-practice'&&practiceFailure&&!practiceBusy){const failure=practiceFailure;if(failure.action==='submit')nextQuestion();else startPractice(failure.moduleId);}if(action==='refresh')loadProgress();if(action==='next'){if(session){byId('cwChatInput').value='Based on my saved progress, what should I study next and why?';ask();}else document.querySelector('[data-account-open]')?.click();}if(action==='practice')switchTab('practice');if(action==='close-reading'){byId('cwReading').hidden=true;byId('cwLessons').hidden=false;}if(action==='again'){practice=null;choices=[];selected=null;submissionChoices=null;clearPracticeFailure();status('cwPracticeStatus','');renderPractice();}
  });
  root.querySelector('[role=tablist]').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=['chat','lessons','practice','compounds'];let i=tabs.indexOf(tab);i=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4;switchTab(tabs[i]);byId('cwTab-'+tabs[i]).focus();});
  byId('cwChatForm').addEventListener('submit',ask);byId('cwLessonForm').addEventListener('submit',e=>{e.preventDefault();byId('cwReading').hidden=true;byId('cwLessons').hidden=false;renderLessons();});byId('cwLessonSearch').addEventListener('input',()=>{byId('cwReading').hidden=true;byId('cwLessons').hidden=false;renderLessons();});byId('cwCompoundForm').addEventListener('submit',lookup);byId('cwStartPractice').addEventListener('click',()=>startPractice());byId('cwClearChat').addEventListener('click',()=>{messages=[];byId('cwSources').replaceChildren();status('cwChatStatus','');renderChat();});
  byId('cwChatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();ask();}});
 }
 function open(){mount();if(root){renderLessons();renderPractice();renderAccount();}if(session&&!progress)loadProgress();window.ChemAtlasBoot?.ready();}
 window.ChemWaypointCompanion={mount,open};
 window.addEventListener('chematlas:content-updated',()=>{renderLessons();if(!practice)renderPractice();});window.addEventListener('chematlas:genchem-ready',()=>{renderLessons();if(!practice)renderPractice();});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
