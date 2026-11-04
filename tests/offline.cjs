'use strict';
// The default test command cannot spend API credit or deliver email.
process.env.APP_ENV='test';
delete process.env.VERCEL_ENV;
for(const name of ['OPENAI_API_KEY','SUPABASE_SECRET_KEY','SUPABASE_ACCESS_TOKEN','DATABASE_URL','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY'])delete process.env[name];
const net=require('node:net');
const allowed=host=>['localhost','127.0.0.1','::1','[::1]'].includes(host);
const original=net.Socket.prototype.connect;
net.Socket.prototype.connect=function(...args){
  let opt=args[0];if(Array.isArray(opt))opt=opt[0];
  const host=typeof opt==='object'?opt.host:typeof args[1]==='string'?args[1]:'localhost';
  if(!allowed(host||'localhost'))throw Error('Test network guard blocked a nonlocal connection.');
  return original.apply(this,args);
};
const fetch=globalThis.fetch;
globalThis.fetch=(input,options)=>{
  const url=new URL(typeof input==='string'?input:input.url||String(input));
  if(!allowed(url.hostname))return Promise.reject(Error('Test network guard blocked an external fetch.'));
  if(options?.redirect && options.redirect!=='error')throw Error('Tests must reject network redirects.');
  return fetch(input,{...options,redirect:'error'});
};
