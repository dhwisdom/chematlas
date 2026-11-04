'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {guard,cleanEnv}=require('../scripts/backend.cjs');
test('local wrapper refuses production targets and hosted project linkage before invoking the CLI',()=>{
 const prior=process.env.DATABASE_URL;process.env.DATABASE_URL='postgres://postgres:placeholder@db.production.supabase.co/postgres';
 try{assert.throws(guard,/loopback/);}finally{if(prior===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=prior;}
 fs.mkdirSync('supabase/.temp',{recursive:true});const file='supabase/.temp/project-ref';
 assert(!fs.existsSync(file),'Safety test requires an unlinked local checkout');
 fs.writeFileSync(file,'synthetic-hosted-link',{flag:'wx'});
 try{assert.throws(guard,/linkage/);}finally{fs.unlinkSync(file);}
});
test('local CLI environment strips inherited privileged and paid-service credentials',()=>{
 const previous=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='synthetic-never-use';
 try{assert.equal(cleanEnv().OPENAI_API_KEY,undefined);assert.equal(cleanEnv().SUPABASE_ACCESS_TOKEN,undefined);}finally{if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous;}
});
