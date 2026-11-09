/* Read-only presentation of assessment evidence. Never edits assessment or legacy history. */
((root)=>{
  'use strict';
  function completedRuns(events=[],now=Date.now()){
    const unique=new Map();
    for(const event of Array.isArray(events)?events:[]){
      if(event&&typeof event.id==='string'&&Number.isFinite(event.at)&&Number.isFinite(new Date(event.at).getTime())&&event.at<=now&&!unique.has(event.id))unique.set(event.id,event);
    }
    const ordered=[...unique.values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
    const starts=new Map(ordered.filter(e=>e.type==='start').map(e=>[e.id,e]));
    const answersByRun=new Map();
    for(const answer of ordered){
      const start=starts.get(answer.run);
      if(answer.type!=='answer'||!start||answer.moduleId!==start.moduleId||answer.at<start.at||!Number.isInteger(answer.choice))continue;
      if(!answersByRun.has(start.id))answersByRun.set(start.id,new Map());
      const answers=answersByRun.get(start.id);if(!answers.has(answer.questionId))answers.set(answer.questionId,answer.at);
    }
    const runs=new Set(),lessons=new Set(),result=[];
    for(const finish of ordered){
      if(finish.type!=='finish'||runs.has(finish.run))continue;
      const start=starts.get(finish.run),ids=start?.questionIds;
      if(!start||start.moduleId!==finish.moduleId||finish.at<start.at||!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length)continue;
      const answers=answersByRun.get(start.id);
      if(!ids.every(id=>answers?.has(id)&&answers.get(id)<=finish.at))continue;
      runs.add(start.id);
      const kind=start.mode==='lesson'&&!lessons.has(start.moduleId)?'lesson':start.mode==='review'&&start.eligible?'review':'practice';
      if(kind==='lesson')lessons.add(start.moduleId);
      result.push({id:'assessment:'+start.id,source:'assessment',kind,runId:start.id,moduleId:start.moduleId,at:new Date(finish.at).toISOString(),
        key:'chematlas-genchem-completed-v1',value:JSON.stringify([start.moduleId]),verified:true,
        label:kind==='lesson'?'General Chemistry lesson completed':kind==='review'?'Spaced review completed':'Assessment practice completed'});
    }
    return result;
  }
  function history(events=[],legacy=[],now=Date.now()){
    const verified=completedRuns(events,now),ids=new Set(verified.map(e=>e.id));
    const earlier=(Array.isArray(legacy)?legacy:[]).filter(e=>e&&!ids.has(e.id)).map(e=>e.source==='practice'?{...e,verified:true}:{...e,verified:false,legacyLabel:e.label,label:'Earlier activity (unverified)'});
    return [...verified,...earlier].sort((a,b)=>String(b.at||'').localeCompare(String(a.at||''))||String(a.id).localeCompare(String(b.id)));
  }
  function dayNumber(at,timeZone){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date(at));
    const value=type=>Number(parts.find(p=>p.type===type).value);
    return Date.UTC(value('year'),value('month')-1,value('day'))/86400000;
  }
  function streak(events=[],now=Date.now(),timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone){
    const days=new Set(completedRuns(events,now).map(e=>dayNumber(e.at,timeZone))),today=dayNumber(now,timeZone);
    let day=days.has(today)?today:today-1,count=0;
    while(days.has(day)){count++;day--;}
    return {count,activeDays:days.size,timeZone};
  }
  const api={completedRuns,history,streak};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.ChemAtlasActivity=api;
})(typeof window!=='undefined'?window:globalThis);
