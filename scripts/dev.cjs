'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {build}=require('./build.cjs');
const {localUrl}=require('../lib/environment.cjs');
function start(mode='mock',port=3000) {
  if(mode==='local'){
    const runtime=JSON.parse(fs.readFileSync(path.resolve('.local/runtime.json'),'utf8'));
    localUrl(runtime.SUPABASE_URL,['http:']);
    Object.assign(process.env,runtime,{APP_ORIGIN:`http://127.0.0.1:${port}`});
  }
  process.env.APP_ENV=mode;
  const {output}=build(process.env,mode);
  const server=http.createServer(async(req,res)=>{
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
  return new Promise(resolve=>server.listen(port,'127.0.0.1',()=>{console.log(`${mode} development: http://127.0.0.1:${server.address().port}`);resolve(server);}));
}
if(require.main===module)start(process.argv[2]).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={start};
