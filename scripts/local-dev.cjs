'use strict';
const path=require('node:path'),{spawn}=require('node:child_process');
const {start}=require('./dev.cjs');

function startBackend(){
  return new Promise((resolve,reject)=>{
    // Use the existing safety wrapper, without shell-specific npm invocation.
    const child=spawn(process.execPath,[path.join(__dirname,'backend.cjs'),'start'],{
      cwd:path.resolve(__dirname,'..'),stdio:['ignore','inherit','inherit']
    });
    child.once('error',()=>reject(Error('Could not launch the local backend command.')));
    child.once('close',(code,signal)=>{
      if(code===0)resolve();
      else reject(Error(signal?'Local backend startup was interrupted.':'Local backend startup failed. Open Docker Desktop and check the backend message above.'));
    });
  });
}

async function develop({backend=startBackend,frontend=()=>start('local'),log=console.log}={}){
  log('[backend] Starting or resuming local Supabase. Docker must be running.');
  log('[backend] Existing local data is retained. First startup may download images.');
  const waiting=setInterval(()=>log('[backend] Still starting; waiting for the local database and authentication...'),5000);
  try{await backend();}
  catch(error){throw Error(error.message+' Frontend was not started.');}
  finally{clearInterval(waiting);}
  log('[backend] Ready. Starting the frontend...');
  const server=await frontend();
  log('Local backend remains running after Ctrl+C. Stop it with npm run backend:stop when finished.');
  return server;
}

if(require.main===module)develop().catch(error=>{console.error('STARTUP FAILED: '+error.message);process.exitCode=1;});
module.exports={develop};
