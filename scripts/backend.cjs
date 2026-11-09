'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {localUrl}=require('../lib/environment.cjs');
const root=path.resolve(__dirname,'..'),state=path.join(root,'.local');
const cli=path.join(root,'node_modules/supabase/dist/supabase.js');
function cleanEnv(){
  const env={...process.env};
  for(const k of Object.keys(env))if(k.startsWith('SUPABASE_')||k.startsWith('OPENAI_')||['DATABASE_URL','DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH','S3_HOST','S3_REGION','S3_ACCESS_KEY','S3_SECRET_KEY'].includes(k))delete env[k];
  return {...env,APP_ENV:'local',SUPABASE_HOME:path.join(state,'supabase-home'),SUPABASE_TELEMETRY_DISABLED:'true'};
}
function guard(){
  process.chdir(root);
  if(process.env.APP_ENV==='production')throw Error('Local commands cannot run in production mode.');
  if(fs.existsSync('supabase/.temp/project-ref'))throw Error('Unlink this checkout first. Local tooling refuses hosted project linkage.');
  if(!fs.readFileSync('supabase/config.toml','utf8').includes('project_id = "chemwaypoint-local"'))throw Error('Unexpected local project ID.');
  for(const key of ['SUPABASE_URL','DATABASE_URL'])if(process.env[key])localUrl(process.env[key]);
  fs.mkdirSync(state,{recursive:true,mode:0o700});
}
let verifiedEndpoint;
function run(args){
  if(!verifiedEndpoint)verifiedEndpoint=localDocker().endpoint;
  const result=spawnSync(process.execPath,[cli,...args,'--network-id','chemwaypoint-loopback'],{cwd:root,env:{...cleanEnv(),DOCKER_HOST:verifiedEndpoint},encoding:'utf8',maxBuffer:8*1024*1024});
  if(result.status!==0)throw Error(`Local Supabase ${args[0]} failed: ${(result.stderr||result.error?.message||'').slice(-1800)}`);
  return result.stdout;
}
function status(){
  const s=JSON.parse(run(['status','-o','json']));
  const runtime={SUPABASE_URL:s.API_URL||s.api_url,SUPABASE_PUBLISHABLE_KEY:s.PUBLISHABLE_KEY||s.ANON_KEY||s.anon_key,SUPABASE_SERVICE_ROLE_KEY:s.SERVICE_ROLE_KEY||s.service_role_key,DATABASE_URL:s.DB_URL||s.db_url};
  localUrl(runtime.SUPABASE_URL,['http:']);localUrl(runtime.DATABASE_URL,['postgres:','postgresql:']);
  if(!runtime.SUPABASE_PUBLISHABLE_KEY||!runtime.SUPABASE_SERVICE_ROLE_KEY)throw Error('Incomplete local runtime credentials.');
  fs.writeFileSync(path.join(state,'runtime.json'),JSON.stringify(runtime,null,2),{mode:0o600});return runtime;
}
function runtime(){guard();const r=JSON.parse(fs.readFileSync(path.join(state,'runtime.json'),'utf8'));localUrl(r.SUPABASE_URL,['http:']);localUrl(r.DATABASE_URL,['postgres:','postgresql:']);return r;}
async function assertDatabase(client){const r=await client.query("select name from dev_guard.identity where name='chemwaypoint-local-only'");if(r.rowCount!==1)throw Error('Not the disposable ChemWaypoint local database.');}
async function seed(r,{preservePasswords=false}={}){
  const {createClient}=require('@supabase/supabase-js');
  const client=createClient(r.SUPABASE_URL,r.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {Client}=require('pg'),db=new Client({connectionString:r.DATABASE_URL});await db.connect();
  try{
    await assertDatabase(db);
    // A reset restarts Postgres; wait for Auth to reconnect before provisioning fixtures.
    let ready=false;
    for(let attempt=0;attempt<12;attempt++){const check=await client.auth.admin.listUsers({page:1,perPage:1});if(!check.error){ready=true;break;}await new Promise(resolve=>setTimeout(resolve,500));}
    if(!ready)throw Error('Local Auth did not reconnect after database startup/reset.');
    const fixtureFile=path.join(state,'accounts.json');
    const fixtureExists=fs.existsSync(fixtureFile);
    const password=fixtureExists?JSON.parse(fs.readFileSync(fixtureFile,'utf8')).password:crypto.randomBytes(24).toString('base64url');
    const accounts=[];
    for(const [name,confirmed]of [['learner-a',true],['learner-b',true],['editor',true],['unconfirmed',false]]){
      const email=name+'@example.invalid';let {data,error}=await client.auth.admin.createUser({email,password,email_confirm:confirmed});
      if(error){
        const found=await db.query('select id from auth.users where email=$1',[email]);if(found.rowCount!==1)throw error;
        // Normal restarts must not reset passwords and invalidate learner sessions.
        if(preservePasswords&&fixtureExists)data={user:{id:found.rows[0].id}};
        else{const updated=await client.auth.admin.updateUserById(found.rows[0].id,{password});if(updated.error)throw updated.error;data=updated.data;}
      }
      const id=data.user.id;accounts.push({email,id});
      if(name==='editor')await db.query('insert into public.site_admins(user_id) values($1) on conflict do nothing',[id]);
      if(name==='learner-a')await db.query("insert into public.learner_state(user_id,state_key,state_value) values($1,'chematlas-genchem-completed-v1','[\"measurement\"]') on conflict do nothing",[id]);
    }
    fs.writeFileSync(fixtureFile,JSON.stringify({password,accounts},null,2),{mode:0o600});
    console.log('Synthetic accounts ready. Password is in ignored .local/accounts.json.');
  }finally{await db.end();}
}
function functionEnv(){
  const keys=crypto.generateKeyPairSync('ed25519');
  const signing={privateKey:keys.privateKey.export({format:'jwk'}),publicKey:keys.publicKey.export({format:'jwk'})};
  const keyFile=path.join(state,'connector-keys.json');
  if(!fs.existsSync(keyFile))fs.writeFileSync(keyFile,JSON.stringify(signing),{mode:0o600});
  const saved=JSON.parse(fs.readFileSync(keyFile,'utf8'));
  fs.writeFileSync(path.join(root,'supabase/functions/.env'),`APP_ENV=local\nAPP_ORIGIN=http://127.0.0.1:3000\nCOMPANION_AUDIENCE=chemwaypoint-local-only\nCOMPANION_VERIFY_KEY=${JSON.stringify(saved.publicKey)}\n`,{mode:0o600});
}
function localDocker(){
  const env=cleanEnv();
  const inspect=spawnSync('docker',['context','inspect','--format','{{json .Endpoints.docker.Host}}'],{env,encoding:'utf8'});
  if(inspect.status!==0)throw Error('Start a local Docker-compatible engine first.');
  const endpoint=JSON.parse(inspect.stdout.trim());
  if(!endpoint.startsWith('unix://')&&!endpoint.startsWith('npipe://'))throw Error('Remote Docker contexts are not allowed.');
  const args=['--host',endpoint];
  const network='chemwaypoint-loopback';
  const existing=spawnSync('docker',[...args,'network','inspect',network],{env,encoding:'utf8'});
  if(existing.status===0){const n=JSON.parse(existing.stdout)[0];if(n.Options?.['com.docker.network.bridge.host_binding_ipv4']!=='127.0.0.1')throw Error('Existing Docker network is not loopback-bound.');}
  else {const created=spawnSync('docker',[...args,'network','create','-o','com.docker.network.bridge.host_binding_ipv4=127.0.0.1',network],{env,encoding:'utf8'});if(created.status!==0)throw Error('Could not create local loopback Docker network.');}
  // Pass the verified local daemon to the CLI, without inheriting arbitrary selectors.
  verifiedEndpoint=endpoint;
  return {endpoint,network};
}
async function main(action){
  guard();
  if(process.argv.length>3)throw Error('Extra arguments are forbidden by local safety wrappers.');
  if(action==='start'){
    functionEnv();
    const {endpoint,network}=localDocker();
    // CLI's clean environment uses a verified endpoint, never a remote context.
    const result=spawnSync(process.execPath,[cli,'start','--network-id',network],{cwd:root,env:{...cleanEnv(),DOCKER_HOST:endpoint},encoding:'utf8',maxBuffer:8*1024*1024});
    if(result.status!==0){fs.writeFileSync(path.join(state,'startup.log'),(result.stdout||'')+(result.stderr||''),{mode:0o600});throw Error('Local startup failed. Inspect ignored .local/startup.log; no mock fallback was substituted.');}
    const r=status();await seed(r,{preservePasswords:true});console.log('Local backend ready.');
  }else if(action==='stop'){run(['stop']);console.log('Local backend stopped; data retained.');}
  else if(action==='status'){const r=status();console.log('Local backend: '+r.SUPABASE_URL+' (credentials saved privately)');}
  else if(action==='seed')await seed(runtime());
  else if(action==='reset'){
    const r=runtime(),{Client}=require('pg'),db=new Client({connectionString:r.DATABASE_URL});await db.connect();try{await assertDatabase(db);}finally{await db.end();}
    run(['db','reset']);await seed(status());console.log('Disposable local database rebuilt.');
  }else throw Error('Use start, stop, status, reset, or seed.');
}
if(require.main===module)main(process.argv[2]).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={guard,runtime,assertDatabase,seed,cleanEnv};
