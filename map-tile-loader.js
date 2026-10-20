/* Keep a blocked map server from leaving images in the loading state forever. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MapTileLoader=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const pending=new WeakMap();
 function cancel(image){const stop=pending.get(image);if(stop)stop();}
 function load(image,url,onState,timeoutMs=6500){
  cancel(image);let active=true,timer;
  const stop=()=>{active=false;clearTimeout(timer);image.onload=null;image.onerror=null;pending.delete(image)};
  const finish=state=>{if(!active)return;stop();image.dataset.state=state;if(state==='error')image.removeAttribute('href');onState(state)};
  pending.set(image,stop);image.dataset.state='loading';image.onload=()=>finish('ready');image.onerror=()=>finish('error');timer=setTimeout(()=>finish('error'),timeoutMs);
  // Handlers and deadline must exist before a cached image can complete.
  image.setAttribute('href',url);return ()=>cancel(image);
 }
 return {load,cancel};
});
