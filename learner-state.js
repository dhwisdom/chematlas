/* Browser-only owner checkpoints. Existing server keys and evidence formats stay unchanged. */
((root)=>{
  'use strict';
  const OWNER='chematlas-browser-owner-v1',CACHE='chematlas-browser-checkpoints-v1';
  function create(storage){
    // Capture native methods before platform's cloud-sync notification wrapper is installed.
    const put=storage.setItem.bind(storage),remove=storage.removeItem.bind(storage);
    const owner=()=>storage.getItem(OWNER)||'guest';
    const keys=()=>Array.from({length:storage.length},(_,i)=>storage.key(i)).filter(k=>k?.startsWith('chematlas-')&&k!==OWNER&&k!==CACHE);
    const snapshot=()=>Object.fromEntries(keys().map(k=>[k,storage.getItem(k)]));
    function transition(userId,{claimGuest=false}={}){
      const next=userId?'account:'+userId:'guest',previous=owner();
      if(previous===next)return false;
      const saved=storage.getItem(CACHE),cache=saved?JSON.parse(saved):{states:{},guestClaimed:null};
      if(!cache.states||typeof cache.states!=='object')throw new Error('Browser progress checkpoint is unavailable.');
      const current=snapshot();cache.states[previous]=current;
      let restored=cache.states[next]||{};
      if(previous==='guest'&&userId&&claimGuest&&!cache.guestClaimed&&!cache.states[next]){
        restored={...current};cache.guestClaimed=next;
      }
      // Unowned data encountered during session restore has ambiguous provenance.
      // Retain it locally, but never silently attach it to a later different account.
      if(previous==='guest'&&userId&&!cache.guestClaimed)cache.guestClaimed='retained-legacy';
      // Save the recoverable old state before replacing any active key. Fail closed if storage is full.
      put(CACHE,JSON.stringify(cache));
      try{
        keys().forEach(remove);
        for(const [key,value] of Object.entries(restored))put(key,value);
        put(OWNER,next);
      }catch(error){
        keys().forEach(remove);for(const [key,value]of Object.entries(current))put(key,value);put(OWNER,previous);throw error;
      }
      return true;
    }
    return {get owner(){return owner();},transition};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={create,OWNER,CACHE};
  else root.ChemAtlasLearnerState=create(root.localStorage);
})(typeof window!=='undefined'?window:globalThis);
