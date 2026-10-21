/* Approximate passage times between the existing timetable anchors. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StopTimetable=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function position(xy,p){
  let total=0,best=Infinity,progress=0;
  for(let i=1;i<xy.length;i++){const a=xy[i-1],b=xy[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(!length)continue;const t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/(length*length))),distance=Math.hypot(p.x-a[0]-t*dx,p.y-a[1]-t*dy);if(distance<best){best=distance;progress=total+t*length}total+=length}
  return progress;
 }
 function prepare(data){
  let count=0;
  for(const route of data.routes){
   const anchors=data.points.filter(p=>(p.route===route.id&&p.kind==='boarding')||p.kind==='gate'||p.kind==='finish').filter(p=>Number.isFinite(p.morning)&&Number.isFinite(p.evening)).map(p=>({point:p,position:p.route===route.id&&Number.isFinite(p.routePosition)?p.routePosition:position(route.xy,p)})).sort((a,b)=>a.position-b.position);
   for(const p of data.points.filter(p=>p.route===route.id&&p.kind==='pass')){
    delete p.estimatedMorning;delete p.estimatedEvening;delete p.timeEstimate;
    const progress=Number.isFinite(p.routePosition)?p.routePosition:position(route.xy,p),right=anchors.findIndex(a=>a.position>=progress);
    if(!anchors.length||progress<anchors[0].position-.01||right<0)continue;
    const b=anchors[right],a=anchors[Math.max(0,right-1)],span=b.position-a.position,t=span>0?Math.max(0,Math.min(1,(progress-a.position)/span)):0;
    if(b.point.morning<a.point.morning||b.point.evening<a.point.evening)continue;
    p.estimatedMorning=Math.round(a.point.morning+(b.point.morning-a.point.morning)*t);
    p.estimatedEvening=Math.round(a.point.evening+(b.point.evening-a.point.evening)*t);
    p.timeEstimate={method:'route-distance-between-timetable-points',from:a.point.id,to:b.point.id};count++;
   }
  }
  return count;
 }
 function value(p,shift){const key=shift==='night'?'evening':'morning';return Number.isFinite(p?.[key])?p[key]:p?.[shift==='night'?'estimatedEvening':'estimatedMorning']}
 function estimated(p,shift){return !Number.isFinite(p?.[shift==='night'?'evening':'morning'])&&Number.isFinite(value(p,shift))}
 function format(n){if(!Number.isFinite(n))return '';const m=Math.floor(n+1e-7);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
 function label(p,shift){const n=value(p,shift);return Number.isFinite(n)?(estimated(p,shift)?'≈ ':'')+format(n):''}
 return {position,prepare,value,estimated,format,label};
});
