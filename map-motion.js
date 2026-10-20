/* Move the camera at most once per frame; rebuild details only after the gesture. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MapMotion=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function create({camera,settle,frame=requestAnimationFrame,cancel=cancelAnimationFrame,delay=150}){
  let active=false,pending=null,idle=null;
  function begin(){active=true;clearTimeout(idle);idle=null;}
  function move(autoFinish=false){begin();if(pending===null)pending=frame(()=>{pending=null;camera()});if(autoFinish)idle=setTimeout(finish,delay);}
  function finish(){if(!active)return;clearTimeout(idle);idle=null;if(pending!==null){cancel(pending);pending=null;camera()}active=false;settle();}
  return {begin,move,finish,get active(){return active}};
 }
 return {create};
});
