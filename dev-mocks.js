/* Synthetic browser demonstrations only. This adapter does not test database RLS. */
(() => {
  if (!['mock','test'].includes(window.CHEMATLAS_CONFIG?.mode)) return;
  const accounts = {'learner-a@example.invalid':'11111111-1111-4111-8111-111111111111','learner-b@example.invalid':'22222222-2222-4222-8222-222222222222','editor@example.invalid':'33333333-3333-4333-8333-333333333333'};
  const callbacks = [], sessions = new Map();
  let session = null;
  const databaseKey = 'chemwaypoint-demo-database-v1';
  const database = () => JSON.parse(localStorage.getItem(databaseKey) || '{}');
  const save = db => localStorage.setItem(databaseKey,JSON.stringify(db));
  const isEditor = () => session?.user.email === 'editor@example.invalid';
  const emit = () => callbacks.forEach(fn => fn(session ? 'SIGNED_IN' : 'SIGNED_OUT',session));
  function query(table) {
    let operation='select', payload, filters=[], resultSingle=false;
    const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},in(k,v){filters.push([k,v]);return q;},order(){return q;},limit(){return q;},single(){resultSingle=true;return q;},maybeSingle(){resultSingle=true;return q;},upsert(v){operation='upsert';payload=v;return q;},insert(v){operation='insert';payload=v;return q;},update(v){operation='update';payload=v;return q;},delete(){operation='delete';return q;},then(resolve,reject){
      try {
        const db=database();let rows=db[table]||[];
        const own=r=>table==='site_published'||(table==='site_admins'?isEditor():r.user_id===session?.user.id);
        const matches=r=>own(r)&&filters.every(([k,v])=>Array.isArray(v)?v.includes(r[k]):r[k]===v);
        if(operation!=='select') {
          if(!session || table.startsWith('site_')) return Promise.resolve({error:{message:'Demo access denied'}}).then(resolve,reject);
          if(['upsert','insert'].includes(operation)) for(const item of Array.isArray(payload)?payload:[payload]) {
            if(item.user_id!==session.user.id) throw Error('Wrong demo account');
            const index=rows.findIndex(r=>r.user_id===item.user_id&&(item.state_key?r.state_key===item.state_key:r.id===item.id));
            if(index>=0)rows[index]={...rows[index],...item};else rows.push({...item});
          }
          else if(operation==='update')rows=rows.map(r=>matches(r)?{...r,...payload}:r);
          else rows=rows.filter(r=>!matches(r));
          db[table]=rows;save(db);
        }
        const selected=table==='site_admins'?(isEditor()?[{user_id:session.user.id}]:[]):rows.filter(matches);
        return Promise.resolve({data:resultSingle?selected[0]||null:selected,error:null}).then(resolve,reject);
      }catch(error){return Promise.resolve({data:null,error:{message:error.message}}).then(resolve,reject);}
    }};return q;
  }
  const client={auth:{getSession:async()=>({data:{session},error:null}),onAuthStateChange(fn){callbacks.push(fn);return {data:{subscription:{unsubscribe(){const i=callbacks.indexOf(fn);if(i>=0)callbacks.splice(i,1);}}}};},async signInWithPassword({email}){
    const id=accounts[email];if(!id)return {data:{session:null},error:{message:'Demo only: use learner-a@example.invalid, learner-b@example.invalid, or editor@example.invalid. Passwords are ignored in this simulation.'}};
    session={user:{id,email,email_confirmed_at:'2026-01-01T00:00:00Z'},access_token:'demo-'+id};emit();return {data:{session},error:null};
  },async signUp(){return {data:{session:null},error:{message:'Demo registration is disabled. Use a listed synthetic demo account.'}};},async signOut(){session=null;emit();return {error:null};}},from:query,async rpc(name,args={}){
    if(name==='site_my_rights')return {data:isEditor()?['menus','dashboards','content','publish','access']:[],error:null};
    if(name==='site_account_directory')return {data:[],error:null};
    if(name==='merge_assessment_events'&&session){const db=database(),rows=db.learner_state||[],key='chematlas-assessment-events-v1';let row=rows.find(r=>r.user_id===session.user.id&&r.state_key===key);if(!row){row={user_id:session.user.id,state_key:key,state_value:[]};rows.push(row);}row.state_value=window.ChemAtlasAssessment.merge(row.state_value,args.p_events);db.learner_state=rows;save(db);return {data:row.state_value,error:null};}
    return {data:null,error:{message:'This operation requires the real local integration environment.'}};
  }};
  const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  window.ChemAtlasMock={client,async fetch(url,options={}){
    if(url.pathname.startsWith('/rest/v1/site_published'))return response([]);
    if(url.pathname!=='/functions/v1/chemwaypoint-site-companion')return response({error:'Unknown demo request'},404);
    if(!session||options.headers?.Authorization!=='Bearer '+session.access_token)return response({error:'Sign into a synthetic demo account.'},401);
    const {action,args={}}=JSON.parse(options.body||'{}'), modules=window.CHEM_GENCHEM?.modules||[];
    if(action==='get_learning_progress'){const rows=database().learner_state||[],own=rows.filter(r=>r.user_id===session.user.id),events=own.find(r=>r.state_key==='chematlas-assessment-events-v1')?.state_value||[],legacy=own.find(r=>r.state_key==='chematlas-genchem-completed-v1')?.state_value||[];const lessons=modules.map(m=>({...m,...window.ChemAtlasAssessment.summarize(m.id,events,legacy),url:'/genchem/'+m.id}));return response({simulated:true,completed:lessons.filter(m=>m.complete).length,mastered:lessons.filter(m=>m.mastered).length,total:lessons.length,dueForReview:lessons.filter(m=>m.due),recommendedNext:lessons.find(m=>!m.complete)||null});}
    if(action==='get_last_practice_result')return response({result:database().companion_results?.[session.user.id]||null});
    if(action==='lookup_compound')return response({compounds:[{CID:2244,MolecularFormula:'C9H8O4',MolecularWeight:'180.16',IUPACName:'Synthetic aspirin reference fixture',url:'https://pubchem.ncbi.nlm.nih.gov/compound/2244'}]});
    if(action==='create_practice_set'){
      const m=modules.find(m=>m.id===args.module_id);if(!m)return response({error:'Lesson not found'},404);
      const questions=window.ChemAtlasChecks.questions(m).slice(0,5),id=crypto.randomUUID();sessions.set(id,{questions,userId:session.user.id,moduleId:m.id});return response({sessionId:id,moduleId:m.id,eligibleSpacedReview:false,questions:questions.map(({answer,explanation,...q})=>q)});
    }
    if(action==='submit_practice_set'){
      const saved=sessions.get(args.session_id);if(!saved||saved.userId!==session.user.id)return response({error:'Practice not found'},404);
      if(saved.result){if(JSON.stringify(saved.choices)!==JSON.stringify(args.choices))return response({error:'Demo answers already submitted'},422);return response(saved.result);}
      const at=Date.now(),run={id:args.session_id,type:'start',moduleId:saved.moduleId,at,mode:'lesson',eligible:false,questionIds:saved.questions.map(q=>q.id)};
      const events=[run,...saved.questions.map((q,i)=>({id:run.id+'-answer-'+i,type:'answer',moduleId:saved.moduleId,run:run.id,questionId:q.id,choice:args.choices[i],correct:q.answer===args.choices[i],at:at+i+1})),{id:run.id+'-finish',type:'finish',moduleId:saved.moduleId,run:run.id,at:at+10}];
      await client.rpc('merge_assessment_events',{p_events:events});saved.choices=args.choices;saved.result={simulated:true,saved:true,moduleId:saved.moduleId,correct:saved.questions.filter((q,i)=>q.answer===args.choices[i]).length,total:saved.questions.length,mastery:{label:'Simulated result — stored only in this browser demo'},details:[]};const db=database();db.companion_results={...db.companion_results,[saved.userId]:saved.result};save(db);return response(saved.result);
    }
    return response({error:'Use local mode for this integration.'},400);
  }};
})();
