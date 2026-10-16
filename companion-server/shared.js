const DAY=86400000;
const EVENT_KEY='chematlas-assessment-events-v1';
const COMPLETED_KEY='chematlas-genchem-completed-v1';
function courseWithOverrides(rows=[]){
 const map=new Map(BASE_COURSE.modules.map(m=>[m.id,structuredClone(m)]));
 for(const row of rows){const m=row.payload;if(row.key==='module:'+m?.id && /^[a-z0-9-]{1,80}$/.test(m.id) && Array.isArray(m.sections)&&Array.isArray(m.outcomes)&&typeof m.title==='string'&&[1,2].includes(m.semester)&&m.check)map.set(m.id,m);}
 return [...map.values()].sort((a,b)=>a.semester-b.semester||a.number-b.number||a.id.localeCompare(b.id));
}
function questionBank(m){
 let bank=Array.isArray(m.checks)&&m.checks.length>=3?m.checks:BASE_BANKS[m.id]?BASE_BANKS[m.id].map((q,i)=>(LEGACY_SLOTS[m.id]||[]).includes(i)?{...m.check,id:q.id,level:q.level,section:q.section}:q):[m.check];
 return bank.filter(q=>q&&Array.isArray(q.choices)&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length).map((q,i)=>{let hash=2166136261;for(const ch of JSON.stringify([q.question,q.choices,q.answer]))hash=Math.imul(hash^ch.charCodeAt(0),16777619);return {...q,id:(q.id||m.id+'-'+i)+'-'+(hash>>>0).toString(36)};});
}
function mergeEvents(a=[],b=[]){const map=new Map();for(const e of [...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])])if(e&&typeof e.id==='string'&&typeof e.moduleId==='string'&&Number.isFinite(e.at)&&['start','answer','finish'].includes(e.type)&&!map.has(e.id))map.set(e.id,e);return [...map.values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));}
function summarize(moduleId,list=[],legacy=[],now=Date.now()){
 const own=mergeEvents(list).filter(e=>e.moduleId===moduleId),starts=own.filter(e=>e.type==='start'),finished=starts.filter(s=>own.some(e=>e.type==='finish'&&e.run===s.id));
 const lastWrong=own.filter(e=>e.type==='answer'&&!e.correct).at(-1)?.at||0;
 const successful=finished.filter(s=>{const answers=new Map();for(const e of own)if(e.type==='answer'&&e.run===s.id&&!answers.has(e.questionId))answers.set(e.questionId,e);return s.mode==='review'&&s.eligible&&s.at>lastWrong&&s.questionIds?.length>=3&&s.questionIds.every(id=>answers.get(id)?.correct);});
 const spaced=[];for(const s of successful)if(!spaced.length||s.at-spaced.at(-1).at>=DAY)spaced.push(s);
 const complete=(Array.isArray(legacy)&&legacy.includes(moduleId))||finished.length>0,lastAt=own.filter(e=>e.type!=='start').at(-1)?.at||0,latestSuccess=spaced.at(-1)?.at||0,needsReview=complete&&lastWrong>latestSuccess,mastered=complete&&spaced.length>=2&&!needsReview,dueAt=complete?(lastAt?lastAt+DAY*(mastered?7:spaced.length?3:1):now):null;
 return {complete,mastered,reviewWins:Math.min(2,spaced.length),dueAt,due:complete&&now>=dueAt,label:mastered?'Mastery demonstrated':needsReview?'Review recommended':complete?'Building mastery':'Not yet checked',lastAt,finished:finished.length};
}
function publicModule(m,detail=false){return {id:m.id,title:m.title,semester:m.semester,number:m.number,summary:m.subtitle,prerequisite:m.prerequisite,outcomes:m.outcomes,url:'https://www.chemwaypoint.com/genchem/'+m.id,...(detail?{sections:m.sections,equations:m.equations,example:m.example,vocabulary:m.vocabulary,bridge:m.bridge,lab:m.lab}:{} )};}
function cleanQuestions(questions){return questions.map(({id,question,choices,level,callback})=>({id,question,choices,level,callback}));}
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
