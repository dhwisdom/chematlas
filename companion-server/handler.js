// Website requests use the learner’s existing Supabase session.
const SB=Deno.env.get('SUPABASE_URL');
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
async function rest(path,options={}){
 const r=await fetch(SB+'/rest/v1/'+path,{...options,headers:{apikey:SERVICE,authorization:'Bearer '+SERVICE,'content-type':'application/json',...options.headers},signal:AbortSignal.timeout(12000)});
 if(!r.ok){const detail=await r.json().catch(()=>null);if(detail?.code==='P0001')throw Object.assign(new Error(detail.message),{safe:true});throw new Error('Storage request failed ('+r.status+').');}
 const text=await r.text();return text?JSON.parse(text):null;
}
async function learnerState(userId){
 const rows=await rest('learner_state?user_id=eq.'+userId+'&select=state_key,state_value,updated_at');
 const values=Object.fromEntries(rows.map(r=>[r.state_key,r.state_value]));return {events:values[EVENT_KEY]||[],legacy:values[COMPLETED_KEY]||[],updatedAt:rows.map(r=>r.updated_at).sort().at(-1)||null};
}
async function getModules(){const rows=await rest('site_published?select=key,payload,version,published_at');return courseWithOverrides(rows);}
function progressFor(modules,state){const lessons=modules.map(m=>({...publicModule(m),...summarize(m.id,state.events,state.legacy)}));return {accountConnected:true,syncedAt:state.updatedAt,completed:lessons.filter(m=>m.complete).length,mastered:lessons.filter(m=>m.mastered).length,total:lessons.length,dueForReview:lessons.filter(m=>m.due).map(m=>({id:m.id,title:m.title,label:m.label,url:m.url})),recommendedNext:lessons.find(m=>!m.complete)||null,lessons,masteryRule:'Two fully correct, eligible review sets on later days. Immediate repeats are practice.',source:SOURCE};}
async function handleBridge(req){
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const raw=await req.text();if(raw.length>20000)return json({error:'Request too large'},413);
 const authorization=req.headers.get('authorization')||'';
 if(!authorization.startsWith('Bearer '))return json({error:'Sign in to ChemWaypoint to use your learning companion.'},401);
 const auth=await fetch(SB+'/auth/v1/user',{headers:{apikey:SERVICE,authorization},signal:AbortSignal.timeout(10000)});
 if(!auth.ok)return json({error:'Your session expired. Sign in again to continue.'},401);
 const actor=await auth.json();
 if(!actor.id||!actor.email_confirmed_at||actor.is_anonymous)return json({error:'Confirm your ChemWaypoint email before using saved practice.'},403);
 let envelope;try{envelope=JSON.parse(raw);}catch{return json({error:'Invalid request'},400);}
 const {action,args={}}=envelope;
 if(!args||typeof args!=='object'||Array.isArray(args))return json({error:'Invalid arguments'},400);
 if(action==='lookup_compound'){
  const name=String(args.name||'').trim();if(!name||name.length>150)return json({error:'Enter one compound name.'},400);
  const response=await fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/'+encodeURIComponent(name)+'/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES,InChIKey/JSON',{signal:AbortSignal.timeout(15000)});
  if(!response.ok)return json({error:response.status===404?'No compound found. Try a more specific name.':'PubChem is temporarily unavailable. Please try again.'},response.status===404?404:502);
  const payload=await response.json();return json({query:name,source:'NIH PubChem',compounds:(payload.PropertyTable?.Properties||[]).slice(0,5).map(p=>({...p,url:'https://pubchem.ncbi.nlm.nih.gov/compound/'+p.CID}))});
 }
 const modules=await getModules();
 if(action==='search_lessons'){
 const query=String(args.query||'').toLowerCase().trim();const words=query.split(/\s+/).filter(Boolean);let found=modules.filter(m=>!args.semester||m.semester===args.semester).map(m=>{const title=(m.title+' '+m.id).toLowerCase();const all=JSON.stringify(m).toLowerCase();return {m,score:words.reduce((s,w)=>s+(title.includes(w)?5:all.includes(w)?1:0),0)};}).filter(x=>!query||x.score>0).sort((a,b)=>b.score-a.score);return json({lessons:found.slice(0,Math.min(20,Math.max(1,args.limit||8))).map(x=>publicModule(x.m)),source:SOURCE});
 }
 if(action==='get_lesson'){const m=modules.find(m=>m.id===args.module_id);return m?json({lesson:publicModule(m,true),source:SOURCE}):json({error:'Lesson not found. Search lessons for an exact module ID.'},404);}
 const userId=actor.id;
 if(action==='get_companion_status')return json({accountConnected:!!userId,lessonsAvailable:modules.length,accountMatching:'Uses your signed-in ChemWaypoint account.',source:SOURCE,website:'https://www.chemwaypoint.com'});

 const state=await learnerState(userId);
 if(action==='get_learning_progress')return json(progressFor(modules,state));
 if(action==='create_practice_set'){
 const m=modules.find(m=>m.id===args.module_id);if(!m)return json({error:'Lesson not found'},404);
 const current=summarize(m.id,state.events,state.legacy);const bank=questionBank(m);if(bank.length<3)return json({error:'This lesson needs at least three valid concept checks before tracked practice is available.'},422);
 const primary=bank.slice(0,5);const selected=current.complete&&bank.length>5?[bank[5],...primary.filter((_,i)=>i!==current.finished%3)]:primary;
 const id=crypto.randomUUID();const now=Date.now();const run={id,type:'start',moduleId:m.id,at:now,mode:current.complete?'review':'lesson',eligible:current.complete&&current.due,questionIds:selected.map(q=>q.id),source:'chemwaypoint-companion'};
 await rest('companion_practice_sessions',{method:'POST',body:JSON.stringify({id,user_id:userId,module_id:m.id,questions:selected,run})});
 return json({sessionId:id,moduleId:m.id,title:m.title,questions:cleanQuestions(selected),mode:run.mode,eligibleSpacedReview:run.eligible,expiresAt:new Date(now+7200000).toISOString(),instructions:'Present one question at a time. Record each first answer without coaching before submission. Submit all zero-based choice indices once; explanations are returned after grading. Never infer answers on the learner’s behalf.',masteryRule:'Completion and mastery are separate. Two later-day, fully correct reviews are required for mastery.'});
 }
 if(action==='submit_practice_set'){
 if(!/^[a-f0-9-]{36}$/.test(args.session_id||'')||!Array.isArray(args.choices)||args.choices.length>6||!args.choices.every(Number.isInteger))return json({error:'Provide the session ID and integer choice indices.'},400);
 const owned=await rest('companion_practice_sessions?id=eq.'+args.session_id+'&user_id=eq.'+userId+'&select=id');if(!owned.length)return json({error:'Practice set not found'},404);
 // Server/database computes grades; callers never supply correctness or mastery.
 const result=await rest('rpc/companion_submit_practice',{method:'POST',body:JSON.stringify({p_user_id:userId,p_session_id:args.session_id,p_choices:args.choices})});
 const next=await learnerState(userId);return json({...result,mastery:summarize(result.moduleId,next.events,next.legacy)});
 }
 return json({error:'Unknown action'},400);
}
const SITE_ORIGINS=new Set(['https://www.chemwaypoint.com','https://chemwaypoint.com']);
async function serveSiteCompanion(req){
 const origin=req.headers.get('origin');
 if(origin&&!SITE_ORIGINS.has(origin))return json({error:'Origin is not allowed.'},403);
 const headers={'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Max-Age':'600'};
 if(origin)headers['Access-Control-Allow-Origin']=origin;
 let response;
 if(req.method==='OPTIONS')response=new Response(null,{status:204});
 else try{response=await handleBridge(req);}catch(e){response=json({error:e.safe?e.message:'Could not connect to your learning tools. Please try again.'},e.safe?422:502);}
 for(const [key,value]of Object.entries(headers))response.headers.set(key,value);
 return response;
}
Deno.serve(serveSiteCompanion);
