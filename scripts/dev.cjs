'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {build}=require('./build.cjs');
const {localUrl}=require('../lib/environment.cjs');
async function start(mode='mock',port=3000,{log=console.log}={}) {
  const progress=(done,message)=>log(`[${'#'.repeat(done)}${'-'.repeat(3-done)}] ${done}/3 ${message}`);
  progress(0,'Checking development configuration...');
  if(mode==='local'){
    let runtime;
    try{runtime=JSON.parse(fs.readFileSync(path.resolve('.local/runtime.json'),'utf8'));}
    catch{throw Error('Local backend settings are missing or unreadable. Run npm run backend:start, then try again.');}
    localUrl(runtime.SUPABASE_URL,['http:']);
    Object.assign(process.env,runtime,{APP_ORIGIN:`http://127.0.0.1:${port}`});
  }
  process.env.APP_ENV=mode;
  progress(1,'Configuration loaded. Building the safe frontend...');
  const {output}=build(process.env,mode);
  progress(2,'Frontend built. Starting the local web server...');
  const server=http.createServer(async(req,res)=>{
    res.once('finish',()=>{
      if(res.statusCode>=400)log(`[request] HTTP ${res.statusCode}`);
      else if(res.getHeader('Content-Type')==='text/html')log(`[browser] Page sent (HTTP ${res.statusCode}).`);
    });
    try{
      const url=new URL(req.url,'http://127.0.0.1');
      res.setHeader('Cache-Control','no-store');
      if(url.pathname.startsWith('/api/')){
        res.setHeader('Content-Type','application/json');
        if(url.pathname==='/api/tutor')return res.end(JSON.stringify({answer:'Simulated tutor: start with the governing relationship and check the units. What would you try first?',model:'mock',usedWeb:false,webSources:[],citations:[]}));
        res.statusCode=503;return res.end(JSON.stringify({error:'Live automation and email are disabled in development.'}));
      }
      let relative=decodeURIComponent(url.pathname).slice(1);
      if(!relative)relative='index.html';
      if(relative==='admin')relative='admin.html';
      if(!path.extname(relative))relative='index.html';
      const file=path.resolve(output,relative);
      if(!file.startsWith(output+path.sep)||relative.split(/[\\/]/).some(s=>s.startsWith('.'))) {res.statusCode=404;return res.end();}
      const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
      res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
      res.end(await fs.promises.readFile(file));
    }catch{res.statusCode=404;res.end('Not found');}
  });
  try{
    await new Promise((resolve,reject)=>{
      server.once('error',reject);
      server.listen(port,'127.0.0.1',()=>{server.removeListener('error',reject);resolve();});
    });
  }catch(error){
    if(error.code==='EADDRINUSE')throw Error(`Port ${port} is already in use. Stop the other development server with Ctrl+C, then try again.`);
    throw error;
  }
  progress(3,'Web server is listening.');
  log(`\nREADY (${mode} mode): http://127.0.0.1:${server.address().port}`);
  log('Open this URL in your browser. Keep this terminal open.');
  log('No output while idle is normal. Page requests and HTTP errors appear below.');
  log('This shows server readiness; check the browser for the finished page.');
  log('Press Ctrl+C to stop the frontend.\n');
  return server;
}
if(require.main===module)start(process.argv[2]).catch(e=>{console.error('STARTUP FAILED: '+e.message);process.exitCode=1;});
module.exports={start};
