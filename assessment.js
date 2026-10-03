/* Completion is historical; mastery requires spaced, first-attempt retrieval evidence. */
((root) => {
  'use strict';
  const KEY = 'chematlas-assessment-events-v1';
  const COMPLETED = 'chematlas-genchem-completed-v1';
  const DAY = 86400000;
  const parse = (key, fallback=[]) => { try { return JSON.parse(root.localStorage.getItem(key)) || fallback; } catch (_) { return fallback; } };
  const valid = e => e && typeof e.id === 'string' && typeof e.moduleId === 'string' && Number.isFinite(e.at) && ['start','answer','finish'].includes(e.type);
  function merge(a=[], b=[]) {
    const map = new Map();
    for (const e of [...(Array.isArray(a)?a:[]), ...(Array.isArray(b)?b:[])].filter(valid)) if (!map.has(e.id)) map.set(e.id,e);
    return [...map.values()].sort((a,b)=>a.at-b.at || a.id.localeCompare(b.id));
  }
  const events = () => merge(parse(KEY));
  const uid = () => root.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  function record(event) {
    const result = {id:uid(),at:Date.now(),...event};
    root.localStorage.setItem(KEY,JSON.stringify(merge(events(),[result])));
    root.dispatchEvent(new root.CustomEvent('chematlas:assessment-updated'));
    return result;
  }
  function answersFor(list, run) {
    const answers = new Map();
    for (const e of list) if (e.type==='answer' && e.run===run && !answers.has(e.questionId)) answers.set(e.questionId,e);
    return answers;
  }
  function summarize(moduleId, list=events(), legacy=parse(COMPLETED), now=Date.now()) {
    const own = merge(list).filter(e=>e.moduleId===moduleId);
    const starts = own.filter(e=>e.type==='start');
    const finished = starts.filter(s=>own.some(e=>e.type==='finish'&&e.run===s.id));
    const lastWrong = own.filter(e=>e.type==='answer'&&!e.correct).at(-1)?.at || 0;
    const successful = finished.filter(s=>{
      const a = answersFor(own,s.id);
      return s.mode==='review' && s.eligible && s.at>lastWrong && s.questionIds?.length>=3 && s.questionIds.every(id=>a.get(id)?.correct);
    });
    // Require independently spaced sessions even if events arrive from two devices.
    const spaced=[];
    for(const s of successful) if(!spaced.length || s.at-spaced.at(-1).at>=DAY) spaced.push(s);
    const complete = (Array.isArray(legacy)&&legacy.includes(moduleId)) || finished.length>0;
    const lastAt = own.filter(e=>e.type!=='start').at(-1)?.at || 0;
    const latestSuccess = spaced.at(-1)?.at || 0;
    const needsReview = complete && lastWrong>latestSuccess;
    const mastered = complete && spaced.length>=2 && !needsReview;
    const dueAt = complete ? (lastAt ? lastAt + DAY*(mastered?7:spaced.length?3:1) : now) : null;
    return {complete,mastered,reviewWins:Math.min(2,spaced.length),dueAt,due:complete&&now>=dueAt,
      label:mastered?'Mastery demonstrated':needsReview?'Review recommended':complete?'Building mastery':'Not yet checked',
      lastAt,finished:finished.length};
  }
  function questions(module) {
    // Include a content fingerprint so a changed published question cannot reuse a saved answer.
    return (root.ChemAtlasChecks?.questions(module)||[module.check]).filter(Boolean).map((q,i)=>{
      let hash=2166136261;
      for(const ch of JSON.stringify([q.question,q.choices,q.answer])) hash=Math.imul(hash^ch.charCodeAt(0),16777619);
      return {...q,id:(q.id||module.id+'-'+i)+'-'+(hash>>>0).toString(36)};
    });
  }
  function start(module, now=Date.now()) {
    const state=summarize(module.id,events(),parse(COMPLETED),now), bank=questions(module);
    const primary=bank.slice(0,5);
    const selected=state.complete && bank.length>5 ? [bank[5],...primary.filter((_,i)=>i!==state.finished%3)] : primary;
    return record({type:'start',moduleId:module.id,at:now,mode:state.complete?'review':'lesson',eligible:state.complete&&state.due,
      questionIds:selected.map(q=>q.id)});
  }
  function answer(run, question, choice) {
    if (!Number.isInteger(choice) || choice<0 || choice>=question.choices.length) return null;
    if(answersFor(events(),run.id).has(question.id)) return null;
    return record({type:'answer',run:run.id,moduleId:run.moduleId,questionId:question.id,choice,correct:choice===question.answer});
  }
  function finish(run) {
    const list=events(), answers=answersFor(list,run.id);
    if(!run.questionIds.every(id=>answers.has(id)) || list.some(e=>e.type==='finish'&&e.run===run.id))return;
    record({type:'finish',moduleId:run.moduleId,run:run.id});
    root.localStorage.setItem(COMPLETED,JSON.stringify([...new Set([...parse(COMPLETED),run.moduleId])]));
    root.dispatchEvent(new root.CustomEvent('chematlas:lesson-completed',{detail:{moduleId:run.moduleId}}));
  }
  const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function mount(el,module) {
    if (!el) return;
    let run=null, extra=null;
    const bank=questions(module);
    const list=events();
    run=list.filter(e=>e.moduleId===module.id&&e.type==='start').at(-1);
    if(run && (list.some(e=>e.type==='finish'&&e.run===run.id) || run.questionIds.some(id=>!bank.some(q=>q.id===id))))run=null;
    const notify=()=>el.dispatchEvent(new root.CustomEvent('chematlas:check-state',{bubbles:true}));
    const focus=()=>{const heading=el.querySelector('h3');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});};
    function intro() {
      const s=summarize(module.id), count=Math.min(5,bank.length);
      el.innerHTML=`<div class="gc-check-head"><div><p class="eyebrow">${s.complete?'REINFORCEMENT':'CONCEPT CHECKS'}</p><h3>${s.complete?'Keep this knowledge ready.':'Build understanding, one question at a time.'}</h3></div><span>${count} checks</span></div>
        <p>Recognize → explain → apply → reason → connect. Each answer includes feedback and a chance to revisit the lesson.</p>
        <div class="ca-evidence"><span>${s.complete?'✓ Lesson completed':'Lesson in progress'}</span><strong>${esc(s.label)}</strong><small>${s.reviewWins}/2 spaced reviews demonstrated</small></div>
        <p class="ca-check-note">Mastery requires two fully correct review sets on later days. Immediate repeats are practice. ${s.complete?(s.due?'A review is ready now.':'Next review: '+new Date(s.dueAt).toLocaleDateString()+'.'):''}</p>
        <button class="primary-button" data-check-start>${s.complete?(s.due?'Start review':'Practice again'):'Start '+count+' checks'} →</button>`;
      el.querySelector('[data-check-start]').onclick=()=>{run=start(module);showQuestion();focus();};
      notify();
    }
    function showQuestion() {
      const answers=answersFor(events(),run.id);
      const nextId=run.questionIds.find(id=>!answers.has(id));
      if(!nextId && !extra){finish(run);summary();return;}
      const q=extra||bank.find(q=>q.id===nextId);
      const index=run.questionIds.indexOf(q.id), callback=q.callback;
      const linked=root.CHEM_GENCHEM?.modules.find(m=>m.id===(callback?.moduleId||module.id));
      const section=linked?.sections[callback?.section||0];
      let selected=null;
      el.innerHTML=`<div class="gc-check-head"><div><p class="eyebrow">${extra?'EXTRA REINFORCEMENT':`CHECK ${index+1} OF ${run.questionIds.length}`} · ${esc(q.level||'Apply')}</p><h3>${esc(q.question)}</h3><button type="button" class="pt-open-inline" data-periodic-open>▦ Periodic table & ions</button></div><span>${run.mode==='review'?(run.eligible?'Spaced review':'Practice'):'First pass'}</span></div>
        ${callback?`<p class="ca-callback">↶ Connect to ${esc(linked?.title||callback.moduleId)}</p>`:''}
        <div class="gc-check-options">${q.choices.map((c,i)=>`<button type="button" class="gc-check-choice" data-choice="${i}" aria-pressed="false"><span aria-hidden="true">${String.fromCharCode(65+i)}</span>${esc(c)}</button>`).join('')}</div>
        <div class="gc-check-actions"><button id="gcCheckAnswer" class="primary-button" disabled>Check answer</button><div id="gcFeedback" class="gc-feedback" aria-live="polite"></div></div><div class="ca-check-followup"></div>`;
      el.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{
        selected=Number(b.dataset.choice);
        el.querySelectorAll('[data-choice]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});
        el.querySelector('#gcCheckAnswer').disabled=false;
      });
      el.querySelector('#gcCheckAnswer').onclick=()=>{
        const result=answer(run,q,selected);if(!result)return;
        el.querySelectorAll('[data-choice]').forEach(b=>{b.disabled=true;b.classList.toggle('correct',Number(b.dataset.choice)===q.answer);b.classList.toggle('wrong',Number(b.dataset.choice)===selected&&!result.correct);});
        el.querySelector('#gcCheckAnswer').disabled=true;
        const feedback=el.querySelector('#gcFeedback');feedback.className='gc-feedback '+(result.correct?'good':'bad');feedback.textContent=(result.correct?'Correct. ':'Not quite. ')+q.explanation;
        const reserve=bank.find(x=>!run.questionIds.includes(x.id)&&!answersFor(events(),run.id).has(x.id));
        el.querySelector('.ca-check-followup').innerHTML=`${!result.correct&&section?`<details class="ca-check-revisit"><summary>Revisit: ${esc(section.title)}</summary>${section.body.map(p=>`<p>${esc(p)}</p>`).join('')}<a href="/genchem/${esc(linked.id)}?section=${callback?.section||0}">Open this explanation →</a></details>`:''}
          <div class="ca-check-buttons">${!result.correct&&reserve&&!extra?'<button class="secondary-button" data-fresh-question>Try a fresh question</button>':''}<button class="primary-button" data-check-next>${extra?'Return to checks':index===run.questionIds.length-1?'See results':'Next question'} →</button></div>`;
        el.querySelector('[data-fresh-question]')?.addEventListener('click',()=>{extra=reserve;showQuestion();focus();});
        el.querySelector('[data-check-next]').onclick=()=>{extra=null;showQuestion();focus();};
        notify();
      };
    }
    function summary() {
      const answers=answersFor(events(),run.id), score=run.questionIds.filter(id=>answers.get(id)?.correct).length, s=summarize(module.id);
      el.innerHTML=`<p class="eyebrow">${run.mode==='review'?'REVIEW COMPLETE':'LESSON COMPLETED'}</p><h3>${score} of ${run.questionIds.length} correct on the first try</h3>
        <div class="ca-evidence"><span>✓ Lesson completed</span><strong>${esc(s.label)}</strong><small>${s.reviewWins}/2 spaced reviews demonstrated</small></div>
        <p>${run.mode==='lesson'?'You have completed this lesson’s first pass. Lasting understanding comes from recalling it again later.':run.eligible?'This review contributes evidence about what you retained.':'This was practice; repeating recently seen answers does not add mastery evidence.'}</p>
        <p>Next review: ${new Date(s.dueAt).toLocaleDateString()}. You can keep learning now.</p><button class="secondary-button" data-check-restart>Practice again</button>`;
      el.querySelector('[data-check-restart]').onclick=()=>{run=start(module);showQuestion();focus();};
      notify();
    }
    if(run)showQuestion();else intro();
  }
  root.ChemAtlasAssessment={KEY,DAY,merge,events,summarize,questions,start,answer,finish,mount};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.ChemAtlasAssessment;
})(typeof window!=='undefined'?window:globalThis);
