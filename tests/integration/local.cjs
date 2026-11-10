'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {Client}=require('pg'),{createClient}=require('@supabase/supabase-js');
const {runtime,assertDatabase}=require('../../scripts/backend.cjs');
let r,db,fixtures,a,b,admin,sessionA,sessionB;
const testAccounts=[];
const authOptions={auth:{persistSession:false,autoRefreshToken:false}};
before(async()=>{
 r=runtime();db=new Client({connectionString:r.DATABASE_URL});await db.connect();await assertDatabase(db);
 fixtures={password:crypto.randomBytes(24).toString('base64url'),run:crypto.randomUUID()};
 admin=createClient(r.SUPABASE_URL,r.SUPABASE_SERVICE_ROLE_KEY,authOptions);
 for(const [name,confirmed] of [['a',true],['b',true],['unconfirmed',false]]){const email=`qa-${fixtures.run}-${name}@example.invalid`;const created=await admin.auth.admin.createUser({email,password:fixtures.password,email_confirm:confirmed});assert.ifError(created.error);testAccounts.push(created.data.user.id);fixtures[name]=email;}
 a=createClient(r.SUPABASE_URL,r.SUPABASE_PUBLISHABLE_KEY,authOptions);b=createClient(r.SUPABASE_URL,r.SUPABASE_PUBLISHABLE_KEY,authOptions);
 const first=await a.auth.signInWithPassword({email:fixtures.a,password:fixtures.password});assert.ifError(first.error);sessionA=first.data.session;
 const second=await b.auth.signInWithPassword({email:fixtures.b,password:fixtures.password});assert.ifError(second.error);sessionB=second.data.session;
});
after(async()=>{try{for(const id of testAccounts)assert.ifError((await admin.auth.admin.deleteUser(id)).error);}finally{await db?.end();}});
test('real local Auth signs in confirmed synthetic accounts and refuses the unconfirmed account',async()=>{
 assert.notEqual(sessionA.user.id,sessionB.user.id);
 const c=createClient(r.SUPABASE_URL,r.SUPABASE_PUBLISHABLE_KEY,authOptions);
 const denied=await c.auth.signInWithPassword({email:fixtures.unconfirmed,password:fixtures.password});assert(denied.error);
 const refreshed=await a.auth.refreshSession();assert.ifError(refreshed.error);sessionA=refreshed.data.session;
});
test('real local RLS isolates progress, denies foreign writes and admin self-promotion',async()=>{
 const key='qa-local-'+crypto.randomUUID();
 assert.ifError((await a.from('learner_state').insert({user_id:sessionA.user.id,state_key:key,state_value:['synthetic']})).error);
 const other=await b.from('learner_state').select().eq('state_key',key);assert.ifError(other.error);assert.equal(other.data.length,0);
 assert((await b.from('learner_state').insert({user_id:sessionA.user.id,state_key:key+'-foreign',state_value:[]})).error);
 assert((await b.from('site_admins').insert({user_id:sessionB.user.id})).error);
 await a.from('learner_state').delete().eq('state_key',key);
});
test('two clients merge immutable assessment evidence without losing existing progress',async()=>{
 const prefix='qa-'+crypto.randomUUID();
 const secondDevice=createClient(r.SUPABASE_URL,r.SUPABASE_PUBLISHABLE_KEY,authOptions);
 assert.ifError((await secondDevice.auth.signInWithPassword({email:fixtures.a,password:fixtures.password})).error);
 await Promise.all([a.rpc('merge_assessment_events',{p_events:[{id:prefix+'-a',moduleId:'measurement',type:'start',at:100}]}),secondDevice.rpc('merge_assessment_events',{p_events:[{id:prefix+'-b',moduleId:'measurement',type:'start',at:200}]})].map(async p=>assert.ifError((await p).error)));
 const merged=await a.rpc('merge_assessment_events',{p_events:[{id:prefix+'-a',moduleId:'measurement',type:'start',at:999}]});assert.ifError(merged.error);
 assert.equal(merged.data.find(e=>e.id===prefix+'-a').at,100);assert(merged.data.some(e=>e.id===prefix+'-b'));
});
async function companion(action,args={},token=sessionA.access_token){
 const response=await fetch(r.SUPABASE_URL+'/functions/v1/chemwaypoint-site-companion',{method:'POST',headers:{apikey:r.SUPABASE_PUBLISHABLE_KEY,Authorization:'Bearer '+token,origin:'http://127.0.0.1:3000','Content-Type':'application/json'},body:JSON.stringify({action,args}),redirect:'error'});
 return {response,body:await response.json()};
}
test('real website Companion grades, saves once, rejects cross-account access and reconciles progress',async()=>{
 assert.equal((await companion('get_last_practice_result')).body.result,null);
 const made=await companion('create_practice_set',{module_id:'atoms-moles'});assert.equal(made.response.status,200,JSON.stringify(made.body));
 assert(made.body.questions.every(q=>!('answer' in q)));const id=made.body.sessionId,choices=made.body.questions.map(()=>0);
 const foreign=await companion('submit_practice_set',{session_id:id,choices},sessionB.access_token);assert.equal(foreign.response.status,404);
 const saved=await companion('submit_practice_set',{session_id:id,choices});assert.equal(saved.response.status,200,JSON.stringify(saved.body));assert.equal(saved.body.saved,true);
 assert(saved.body.url.startsWith('http://127.0.0.1:3000/'));
 const last=await companion('get_last_practice_result',{user_id:sessionB.user.id});assert.equal(last.response.status,200);assert.equal(last.body.result.sessionId,id);assert.deepEqual(last.body.result.details,saved.body.details);
 assert.equal((await companion('get_last_practice_result',{user_id:sessionA.user.id},sessionB.access_token)).body.result,null);
 const retry=await companion('submit_practice_set',{session_id:id,choices});assert.equal(retry.response.status,200);assert.equal(retry.body.completedAt,saved.body.completedAt);
 const changed=await companion('submit_practice_set',{session_id:id,choices:choices.map(()=>1)});assert.equal(changed.response.status,422);
 const progress=await companion('get_learning_progress');assert.equal(progress.response.status,200);assert(progress.body.lessons.find(m=>m.id==='atoms-moles').complete);
 const expired=await companion('create_practice_set',{module_id:'measurement'});
 assert.equal((await companion('get_last_practice_result')).body.result.sessionId,id,'A newer unfinished set must not hide the saved result');
 await db.query("update public.companion_practice_sessions set expires_at=now()-interval '1 minute' where id=$1 and user_id=$2",[expired.body.sessionId,sessionA.user.id]);
 assert.equal((await companion('submit_practice_set',{session_id:expired.body.sessionId,choices})).response.status,422);
 assert.equal((await companion('get_learning_progress',{},'invalid')).response.status,401);
});
test('real connector verifies test signatures, rejects replays and uses only the local audience',async()=>{
 const keys=JSON.parse(fs.readFileSync('.local/connector-keys.json','utf8'));
 const body=JSON.stringify({audience:'chemwaypoint-local-only',at:Date.now(),nonce:crypto.randomUUID(),email:fixtures.a,subject:'local-synthetic-subject',action:'get_learning_progress',args:{}});
 const signature=crypto.sign(null,Buffer.from(body),crypto.createPrivateKey({key:keys.privateKey,format:'jwk'})).toString('base64');
 const request=()=>fetch(r.SUPABASE_URL+'/functions/v1/chemwaypoint-companion',{method:'POST',headers:{'x-companion-signature':signature,'Content-Type':'application/json'},body,redirect:'error'});
 const first=await request();assert.equal(first.status,200,await first.text());assert.equal((await request()).status,409);
 const denied=await fetch(r.SUPABASE_URL+'/functions/v1/chemwaypoint-companion',{method:'POST',headers:{'Content-Type':'application/json'},body,redirect:'error'});assert.equal(denied.status,401);
});
for(const name of ['admin-permissions.sql','group-permissions.sql','assessment-sync.sql','reminder-permissions.sql'])test('local SQL suite: '+name,async()=>{
 const connection=new Client({connectionString:r.DATABASE_URL});await connection.connect();try{await assertDatabase(connection);await connection.query(fs.readFileSync('tests/'+name,'utf8'));}finally{await connection.end();}
});
test('Tutor messages cannot reference another account’s thread',async()=>{
 const thread=crypto.randomUUID();assert.ifError((await a.from('tutor_threads').insert({id:thread,user_id:sessionA.user.id,title:'Synthetic isolation test'})).error);
 assert((await b.from('tutor_messages').insert({thread_id:thread,user_id:sessionB.user.id,role:'user',content:'Synthetic attack fixture'})).error);
 await a.from('tutor_threads').delete().eq('id',thread);
});

test('real local sessions persist across clients, switch accounts, and clear on logout',async()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
 const options={auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage,storageKey:'qa-local-session'}};
 const first=createClient(r.SUPABASE_URL,r.SUPABASE_PUBLISHABLE_KEY,options);
 assert.ifError((await first.auth.signInWithPassword({email:fixtures.a,password:fixtures.password})).error);
 const restored=createClient(r.SUPABASE_URL,r.SUPABASE_PUBLISHABLE_KEY,options);
 const session=await restored.auth.getSession();assert.ifError(session.error);assert.equal(session.data.session.user.id,sessionA.user.id);
 assert.ifError((await restored.auth.signOut({scope:'local'})).error);
 assert.equal((await restored.auth.getSession()).data.session,null);
 assert.equal(values.has('qa-local-session'),false);
 assert.ifError((await restored.auth.signInWithPassword({email:fixtures.b,password:fixtures.password})).error);
 assert.equal((await restored.auth.getSession()).data.session.user.id,sessionB.user.id);
 assert.ifError((await restored.auth.signOut({scope:'local'})).error);
});
test('signup confirmation is captured in local Mailpit without external delivery',async()=>{
 const email=`qa-${fixtures.run}-mail@example.invalid`;
 const client=createClient(r.SUPABASE_URL,r.SUPABASE_PUBLISHABLE_KEY,authOptions);
 const created=await client.auth.signUp({email,password:fixtures.password,options:{emailRedirectTo:'http://127.0.0.1:3000/dashboard'}});
 assert.ifError(created.error);assert(created.data.user);testAccounts.push(created.data.user.id);assert.equal(created.data.session,null);
 let captured=false;
 for(let attempt=0;attempt<20;attempt++){
   const response=await fetch('http://127.0.0.1:54324/api/v1/messages',{redirect:'error'});assert.equal(response.status,200);
   const mailbox=await response.json();captured=(mailbox.messages||[]).some(message=>(message.To||[]).some(to=>to.Address===email));
   if(captured)break;await new Promise(resolve=>setTimeout(resolve,250));
 }
 assert(captured,'Confirmation must be present in the local mail catcher.');
});
