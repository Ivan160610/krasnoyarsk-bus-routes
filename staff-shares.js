/* One fixed allocation: every employee belongs to one route and one stop. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StaffShareStats=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function remainingMinutes(point,arrival,variant){
  const key=variant==='night'?'evening':'morning',estimate=variant==='night'?'estimatedEvening':'estimatedMorning';
  const departure=Number.isFinite(point[key])?point[key]:point[estimate];
  if(!Number.isFinite(arrival)||!Number.isFinite(departure)||departure>arrival)return null;
  return Math.round(arrival-departure);
 }
 function elapsedMinutes(point,departure,variant){
  const key=variant==='night'?'evening':'morning',estimate=variant==='night'?'estimatedEvening':'estimatedMorning';
  const at=Number.isFinite(point[key])?point[key]:point[estimate];
  if(!Number.isFinite(departure)||!Number.isFinite(at)||at<departure)return null;
  return Math.round(at-departure);
 }
 function distribution(points,allocations,routeId,variant,trip){
  const counts=allocations.stops,key=variant==='night'?'evening':'morning',estimate=variant==='night'?'estimatedEvening':'estimatedMorning',arrival=points.find(p=>p.kind==='finish')?.[key];
  const outbound=trip?.direction==='outbound',departure=variant==='night'?trip?.departureEvening:trip?.departureMorning;
  const rows=points.filter(p=>['boarding','pass'].includes(p.kind)&&p.route===Number(routeId)).sort((a,b)=>(a.routePosition??a.order??0)-(b.routePosition??b.order??0)).map(p=>({point:p,count:counts[p.id]?.count||0,walkCount:counts[p.id]?.walkCount||0,feederCount:counts[p.id]?.feederCount||0,percent:0,remainingMinutes:remainingMinutes(p,arrival,variant),tripMinutes:outbound?elapsedMinutes(p,departure,variant):remainingMinutes(p,arrival,variant),timeEstimated:!Number.isFinite(p[key])&&Number.isFinite(p[estimate])}));
  const total=rows.reduce((sum,row)=>sum+row.count,0);
  for(const row of rows)row.percent=total?row.count/total*100:0;
  return {routeId:Number(routeId),variant,direction:outbound?'outbound':'inbound',total,totalStaff:allocations.totalStaff,walkCount:rows.reduce((sum,row)=>sum+row.walkCount,0),feederCount:rows.reduce((sum,row)=>sum+row.feederCount,0),rows};
 }
 return {distribution,remainingMinutes,elapsedMinutes};
});

(()=>{
 if(typeof document==='undefined')return;
 const $=selector=>document.querySelector(selector),format=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1});
 const percentage=value=>format.format(value)+'%';
 const allocations=JSON.parse($('#staff-share-data').textContent);
 const stats=routeId=>StaffShareStats.distribution(data.points,allocations,routeId,shift,data.trip);
 const launcher=document.createElement('button');launcher.id='openStaffShares';launcher.type='button';launcher.className='staff-share-launcher';launcher.textContent='Доли сотрудников';launcher.setAttribute('aria-haspopup','dialog');
 $('#openFeeder').after(launcher);
 const dialog=document.createElement('dialog');dialog.id='staffShareDialog';dialog.className='staff-share-dialog';dialog.setAttribute('aria-labelledby','staffShareTitle');
 dialog.innerHTML='<header class="staff-share-header"><h2 id="staffShareTitle">Доли по остановкам</h2><button id="closeStaffShares" type="button" aria-label="Закрыть доли сотрудников">×</button></header><div class="staff-share-controls"><label>Маршрут<select id="staffShareRoute" aria-label="Маршрут для распределения"></select></label><div><span class="staff-share-field-label">Расписание</span><div class="staff-share-variants" role="group" aria-label="Время прибытия для распределения"><button type="button" data-staff-variant="day">К 07:45</button><button type="button" data-staff-variant="night">К 19:45</button></div></div></div><div class="staff-share-summary" aria-live="polite"><strong id="staffShareTotal"></strong><span id="staffShareBasis"></span><span id="staffShareRoster"></span></div><div class="staff-share-chart" id="staffShareChart" role="group" aria-label="Распределение сотрудников по всем остановкам"></div>';
 document.body.append(dialog);
 const routeSelect=$('#staffShareRoute');
 for(const route of data.routes){const option=document.createElement('option');option.value=route.id;option.textContent='№'+route.id+' · '+route.title;routeSelect.append(option)}
 function renderChart(){
  const routeId=Number(routeSelect.value),result=stats(routeId),route=data.routes.find(r=>r.id===routeId),chart=$('#staffShareChart'),outbound=result.direction==='outbound',durationTitle=outbound?'От базы':'До базы';
  $('#staffShareTitle').textContent=outbound?'Доли по остановкам · развоз':'Доли по остановкам';
  for(const option of routeSelect.options){const current=data.routes.find(r=>r.id===Number(option.value));if(current)option.textContent='№'+current.id+' · '+current.title}
  dialog.style.setProperty('--staff-share-color',colors[routeId-1]||route.color);
  $('#staffShareTotal').textContent=result.total?result.total+' чел. — 100% маршрута №'+routeId:'Маршрут №'+routeId+' — пока без назначений';
  $('#staffShareBasis').textContent=outbound?'Остановок по маршруту: '+result.rows.length+' · распределение по назначениям привоза.':'Остановок: '+result.rows.length+' · '+result.walkCount+' чел. пешком до 20 мин · '+result.feederCount+' чел. с подъездом.';
  $('#staffShareRoster').textContent='Всего сотрудников: '+allocations.totalStaff+' · Автобусами: '+allocations.assignedStaff+' · Самостоятельно: '+allocations.selfTransportStaff;
  for(const button of dialog.querySelectorAll('[data-staff-variant]')){button.setAttribute('aria-pressed',String(button.dataset.staffVariant===shift));button.textContent=outbound?(button.dataset.staffVariant==='day'?'С 08:15':'С 20:15'):(button.dataset.staffVariant==='day'?'К 07:45':'К 19:45');button.setAttribute('aria-label',outbound?(button.dataset.staffVariant==='day'?'После ночной смены, выезд 08:15':'После дневной смены, выезд 20:15'):button.textContent)}
  dialog.querySelector('.staff-share-variants').setAttribute('aria-label',outbound?'Время выезда с базы для распределения':'Время прибытия для распределения');
  chart.replaceChildren();
  if(allocations.pendingStaff){
   const pending=document.createElement('details');pending.className='staff-share-pending';
   const summary=document.createElement('summary');summary.textContent='Уточнить посадку: '+allocations.pendingStaff+' чел.';pending.append(summary);
   const pendingList=document.createElement('ul');
   for(const item of allocations.pending){const li=document.createElement('li');li.textContent=item.origin+' ('+item.count+' чел.): '+item.reason;pendingList.append(li)}
   pending.append(pendingList);chart.append(pending);
  }
  const headings=document.createElement('div');headings.className='staff-share-columns';headings.setAttribute('aria-hidden','true');
  for(const title of ['Остановка','Чел.','Доля',durationTitle]){const span=document.createElement('span');span.textContent=title;headings.append(span)}chart.append(headings);
  for(const row of result.rows){
   const button=document.createElement('button');button.type='button';button.className='staff-share-row';button.dataset.stopId=row.point.id;
   button.setAttribute('aria-label',row.point.name+': '+row.count+' чел., '+percentage(row.percent)+' сотрудников маршрута. '+durationTitle+': '+(row.tripMinutes===null?'время неизвестно':(row.timeEstimated?'примерно ':'')+row.tripMinutes+' мин')+'. Показать на карте');
   button.title=outbound?'Распределение сотрудников по назначениям привоза; плановая высадка на обратном маршруте.':'Пешком до 20 мин: '+row.walkCount+' чел.; с подъездом к выбранной посадке: '+row.feederCount+' чел.';
   const name=document.createElement('span');name.className='staff-share-stop';name.textContent=row.point.name;
   const count=document.createElement('strong');count.className='staff-share-count';count.textContent=row.count;
   const share=document.createElement('strong');share.className='staff-share-percent';share.textContent=percentage(row.percent);
   const remaining=document.createElement('strong');remaining.className='staff-share-remaining';remaining.textContent=row.tripMinutes===null?'—':(row.timeEstimated?'≈ ':'')+row.tripMinutes+' мин';
   remaining.title=(outbound?'Время от выезда с базы до этой остановки':'Время от этой остановки до высадки на базе')+(row.timeEstimated?'; ≈ — расчётное время проезда':'');
   const track=document.createElement('span');track.className='staff-share-track';track.setAttribute('aria-hidden','true');
   const bar=document.createElement('span');bar.style.width=row.percent+'%';track.append(bar);button.append(name,count,share,remaining,track);
   button.onclick=()=>{dialog.close();openRoute(routeId);focus(row.point)};chart.append(button);
  }
 }
 function decorateShares(){
  const cache=new Map();const get=id=>{if(!cache.has(id))cache.set(id,stats(id));return cache.get(id)};
  for(const tr of document.querySelectorAll('#list tr[data-kind="boarding"],#list tr[data-kind="pass"]')){
   const result=get(Number(tr.dataset.route)),row=result.rows.find(row=>row.point.id===tr.dataset.id),note=tr.querySelector('.stop small');
   if(row&&note)note.textContent=row.count+' чел. · '+percentage(row.percent)+' сотрудников маршрута';
  }
  const p=currentPoint;
  if(p&&['boarding','pass'].includes(p.kind)){
   const row=get(p.route).rows.find(row=>row.point.id===p.id);
   if(row)$('#journeyHint').textContent=row.count+' чел. · '+percentage(row.percent)+' сотрудников маршрута';
  }
 }
 launcher.onclick=()=>{routeSelect.value=String(selected||currentPoint?.route||data.routes[0].id);renderChart();dialog.showModal()};
 $('#closeStaffShares').onclick=()=>dialog.close();routeSelect.onchange=renderChart;
 for(const button of dialog.querySelectorAll('[data-staff-variant]'))button.onclick=()=>{shift=button.dataset.staffVariant;syncShift()};
 const previousList=list;list=function(){previousList();decorateShares();if(dialog.open)renderChart()};
 const previousDetail=detail;detail=function(point){previousDetail(point);decorateShares()};
 const previousRoute=openRoute;openRoute=function(id){previousRoute(id);decorateShares()};
 const previousShift=syncShift;syncShift=function(){previousShift();decorateShares();if(dialog.open)renderChart()};
 $('#closeDetail').addEventListener('click',decorateShares);
 decorateShares();
 if(new URLSearchParams(location.search).get('staff')==='1')launcher.click();
})();
