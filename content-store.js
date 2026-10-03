/* Published content overlays the bundled curriculum; IDs and learner progress stay stable. */
((root) => {
  const defaults = [
    {id:'home',label:'Home',route:'/dashboard',icon:'⌂'},
    {id:'learn',label:'Learn',route:'/genchem',icon:'▤'},
    {id:'practice',label:'Practice',icon:'◎'},
    {id:'labs',label:'Labs',route:'/model-lab',icon:'⚗'},
    {id:'tutor',label:'AI Tutor',route:'/tutor',icon:'✦'},
    {id:'progress',label:'Progress',route:'/progress',icon:'▥'}
  ];
  const destinations=[...defaults.filter(x=>x.route),{id:'organic',label:'Organic Studio',route:'/organic',icon:'↻'},{id:'courses',label:'Course library',route:'/courses',icon:'▤'},{id:'curriculum',label:'Degree map',route:'/curriculum',icon:'⌘'}];
  const dashboardDefaults={columns:2,blocks:[{id:'continue',label:'Continue learning',width:'full'},{id:'recommendations',label:'A good next move',width:'full'},{id:'mastery',label:'Course mastery',width:'half'},{id:'recent',label:'Recent activity',width:'half'},{id:'tutor',label:'Ask your tutor',width:'full'}]};
  function normalizeDashboard(value){
    if(!value||!Array.isArray(value.blocks))return clone(dashboardDefaults);
    const seen=new Set(),blocks=[];
    for(const b of value.blocks.slice(0,20)){
      if(!b||seen.has(b.id))continue;
      const original=dashboardDefaults.blocks.find(x=>x.id===b.id);
      if(!original && !(/^custom-[a-z0-9-]+$/.test(b.id||'') && ['text','shortcut'].includes(b.type)))continue;
      seen.add(b.id);blocks.push({...b,label:text(b.label,100)?b.label.trim():(original?.label||'New block'),body:typeof b.body==='string'?b.body.slice(0,4000):'',width:b.width==='half'?'half':'full',hidden:b.hidden===true,route:destinations.some(x=>x.route===b.route)?b.route:'/genchem'});
    }
    if(!blocks.some(b=>b.id==='continue'))blocks.unshift(clone(dashboardDefaults.blocks[0]));
    blocks.find(b=>b.id==='continue').hidden=false;
    return {columns:value.columns===1?1:2,blocks};
  }
  const clone = value => JSON.parse(JSON.stringify(value));
  const text = (v,max=12000) => typeof v==='string' && v.trim().length>0 && v.length<=max;
  const texts = (v,min=1,max=50) => Array.isArray(v) && v.length>=min && v.length<=max && v.every(x=>text(x));
  function validateModule(m) {
    if (!m || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.id || '') || m.id.length>80) return 'Use a short lowercase lesson ID with hyphens.';
    if (![1,2].includes(m.semester) || !Number.isInteger(m.number) || m.number<1 || m.number>999) return 'Choose a semester and a module number between 1 and 999.';
    if (![m.title,m.subtitle,m.prerequisite].every(x=>text(x))) return 'Add a title, summary, and prerequisites (or “None”).';
    if (!texts(m.outcomes) || !texts(m.vocabulary,0)) return 'Add at least one learning goal; use one goal per line.';
    if (!Array.isArray(m.sections) || !m.sections.length || m.sections.length>30 || !m.sections.every(s=>s && text(s.title) && texts(s.body))) return 'Each reading section needs a heading and at least one paragraph.';
    if (!Array.isArray(m.equations) || m.equations.length>30 || !m.equations.every(e=>e && text(e.label) && text(e.expression))) return 'Each equation needs a label and expression.';
    if (!m.example || !text(m.example.prompt) || !texts(m.example.steps) || !text(m.example.answer)) return 'Complete the worked example: question, steps, and answer.';
    if (!m.check || !text(m.check.question) || !texts(m.check.choices,2,6) || !Number.isInteger(m.check.answer) || m.check.answer<0 || m.check.answer>=m.check.choices.length || !text(m.check.explanation)) return 'Complete the quick check, with 2–6 choices, a valid correct choice, and explanation.';
    if (m.checks!=null) {
      if(!Array.isArray(m.checks)||m.checks.length<3||m.checks.length>6)return 'Use 3–5 concept checks, with an optional sixth reinforcement question.';
      if(new Set(m.checks.map(q=>q?.id)).size!==m.checks.length)return 'Each question needs a unique ID.';
      for(const q of m.checks) {
        if(!q||!text(q.id,120)||!/^[a-z0-9-]+$/.test(q.id)||!text(q.level,40)||!text(q.question)||!texts(q.choices,2,6)||!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.choices.length||!text(q.explanation))return 'Each check needs an ID, stage, question, choices, correct answer, and explanation.';
        if(q.callback&&(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(q.callback.moduleId||'')||!Number.isInteger(q.callback.section)||q.callback.section<0||q.callback.section>29))return 'Choose a valid earlier module ID and section number.';
      }
    }
    if (!m.bridge || !text(m.bridge.course) || !text(m.bridge.text)) return 'Add a connection to a later topic or course.';
    if (m.lab!=null && typeof m.lab!=='string') return 'Lab connection must be text.';
    if (m.tool!=null && (!text(m.tool.label) || m.tool.action!=='lab')) return 'The existing interactive tool link is invalid.';
    return '';
  }
  function normalizeNavigation(value) {
    const input=Array.isArray(value?.items)?value.items:[];
    const items=[],seen=new Set();
    for(const item of input) {
      const original=defaults.find(d=>d.id===item?.id);
      if(!original){
        if(/^custom-[a-z0-9-]+$/.test(item?.id||'') && !seen.has(item.id) && destinations.some(d=>d.route===item.route) && items.length<20){seen.add(item.id);items.push({id:item.id,label:text(item.label,40)?item.label.trim():'Shortcut',route:item.route,icon:'↗'});}
        continue;
      }
      if(seen.has(original.id)) continue;
      seen.add(original.id);
      items.push({...original,label:text(item.label,40)?item.label.trim():original.label});
    }
    return [...items,...defaults.filter(d=>!seen.has(d.id)).map(clone)];
  }
  let published=[], baseModules=null;
  function applyCourse() {
    const course=root.CHEM_GENCHEM;
    if(!course) return;
    baseModules ||= clone(course.modules);
    const byId=new Map(baseModules.map(m=>[m.id,clone(m)]));
    for(const row of published) {
      if(!row.key.startsWith('module:') || row.key.slice(7)!==row.payload?.id || validateModule(row.payload)) continue;
      byId.set(row.payload.id,clone(row.payload));
    }
    course.modules=[...byId.values()].sort((a,b)=>a.semester-b.semester || a.number-b.number || a.id.localeCompare(b.id));
  }
  async function refresh() {
    const cfg=root.CHEMATLAS_CONFIG;
    if(!cfg?.supabaseUrl) return false;
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),5000);
    try {
      const response=await fetch(`${cfg.supabaseUrl}/rest/v1/site_published?select=key,payload,version,published_at`,{
        headers:{apikey:cfg.supabasePublishableKey},signal:controller.signal
      });
      if(!response.ok) throw new Error('Published content unavailable');
      const rows=await response.json();
      if(!Array.isArray(rows)) throw new Error('Invalid published content');
      published=rows; applyCourse();
      root.dispatchEvent?.(new Event('chematlas:content-updated'));
      return true;
    } catch(error) {
      console.warn('ChemAtlas: using bundled content while publishing service is unavailable.');
      return false;
    } finally {clearTimeout(timeout);}
  }
  const api={defaults,destinations,dashboardDefaults,normalizeDashboard,validateModule,normalizeNavigation,applyCourse,refresh,
    navigation:()=>normalizeNavigation(published.find(r=>r.key==='navigation')?.payload),
    dashboard:()=>normalizeDashboard(published.find(r=>r.key==='dashboard')?.payload),
    hasDashboard:()=>published.some(r=>r.key==='dashboard'),
    getPublished:()=>clone(published),getBaseModules:()=>clone(baseModules || root.CHEM_GENCHEM?.modules || [])};
  root.ChemAtlasContent=api;
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else api.ready=refresh();
})(typeof window==='undefined'?globalThis:window);
