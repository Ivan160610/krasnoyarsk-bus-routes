/* Percentages use one recommended boarding per employee group, not every option. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StaffShareStats=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function distribution(points,origins,routeId,variant){
  const rows=points.filter(p=>p.kind==='boarding'&&p.route===Number(routeId)).sort((a,b)=>(a.order||0)-(b.order||0)).map(p=>({point:p,count:0,percent:0}));
  const byId=new Map(rows.map(row=>[row.point.id,row]));
  let totalStaff=0;
  for(const origin of origins){
   const count=Number(origin.count);if(!Number.isFinite(count)||count<0)continue;
   totalStaff+=count;
   const journey=origin[variant]?.[0],row=journey&&byId.get(journey.hubId);
   if(row&&journey.route===Number(routeId))row.count+=count;
  }
  const total=rows.reduce((sum,row)=>sum+row.count,0);
  for(const row of rows)row.percent=total?row.count/total*100:0;
  return {routeId:Number(routeId),variant,total,totalStaff,rows};
 }
 return {distribution};
});

(()=>{
 if(typeof document==='undefined')return;
 const $=selector=>document.querySelector(selector),format=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1});
 const percentage=value=>format.format(value)+'%';
 const stats=routeId=>StaffShareStats.distribution(data.points,feederPlan.origins,routeId,shift);
 const launcher=document.createElement('button');launcher.id='openStaffShares';launcher.type='button';launcher.className='staff-share-launcher';launcher.textContent='Доли сотрудников';launcher.setAttribute('aria-haspopup','dialog');
 $('#openFeeder').after(launcher);
 const dialog=document.createElement('dialog');dialog.id='staffShareDialog';dialog.className='staff-share-dialog';dialog.setAttribute('aria-labelledby','staffShareTitle');
 dialog.innerHTML='<header class="staff-share-header"><h2 id="staffShareTitle">Доли по остановкам</h2><button id="closeStaffShares" type="button" aria-label="Закрыть доли сотрудников">×</button></header><div class="staff-share-controls"><label>Маршрут<select id="staffShareRoute" aria-label="Маршрут для распределения"></select></label><div><span class="staff-share-field-label">Вариант подъезда</span><div class="staff-share-variants" role="group" aria-label="Время прибытия для распределения"><button type="button" data-staff-variant="day">К 07:45</button><button type="button" data-staff-variant="night">К 19:45</button></div></div></div><div class="staff-share-summary" aria-live="polite"><strong id="staffShareTotal"></strong><span id="staffShareBasis"></span></div><div class="staff-share-chart" id="staffShareChart" role="group" aria-label="Распределение сотрудников по посадкам"></div><footer class="staff-share-footer"><p>Нажмите остановку, чтобы показать её на карте.</p><p>По рекомендуемым посадкам всего списка. Состав смен неизвестен — это план распределения, а не число пассажиров конкретного рейса. Проездные городские остановки без назначений в диаграмму не включены.</p></footer>';
 document.body.append(dialog);
 const routeSelect=$('#staffShareRoute');
 for(const route of data.routes){const option=document.createElement('option');option.value=route.id;option.textContent='№'+route.id+' · '+route.title;routeSelect.append(option)}
 function renderChart(){
  const routeId=Number(routeSelect.value),result=stats(routeId),route=data.routes.find(r=>r.id===routeId),chart=$('#staffShareChart');
  dialog.style.setProperty('--staff-share-color',colors[routeId-1]||route.color);
  $('#staffShareTotal').textContent=result.total?result.total+' чел. — 100% маршрута №'+routeId:'Маршрут №'+routeId+' — пока без назначений';
  $('#staffShareBasis').textContent=result.total?'Доля каждой остановки рассчитана от '+result.total+' чел. выбранного маршрута.':'На этом маршруте пока нет рекомендованных назначений.';
  dialog.querySelector('.staff-share-footer p:last-child').textContent='В обоих вариантах — общий список из '+result.totalStaff+' чел. Меняются рекомендуемые посадки. Состав смен неизвестен. Показаны только назначенные посадки.';
  for(const button of dialog.querySelectorAll('[data-staff-variant]'))button.setAttribute('aria-pressed',String(button.dataset.staffVariant===shift));
  chart.replaceChildren();
  const headings=document.createElement('div');headings.className='staff-share-columns';headings.setAttribute('aria-hidden','true');
  for(const title of ['Остановка','Чел.','Доля']){const span=document.createElement('span');span.textContent=title;headings.append(span)}chart.append(headings);
  for(const row of result.rows){
   const button=document.createElement('button');button.type='button';button.className='staff-share-row';button.dataset.stopId=row.point.id;
   button.setAttribute('aria-label',row.point.name+': '+row.count+' чел., '+percentage(row.percent)+' сотрудников маршрута. Показать на карте');
   const name=document.createElement('span');name.className='staff-share-stop';name.textContent=row.point.name;
   const count=document.createElement('strong');count.className='staff-share-count';count.textContent=row.count;
   const share=document.createElement('strong');share.className='staff-share-percent';share.textContent=percentage(row.percent);
   const track=document.createElement('span');track.className='staff-share-track';track.setAttribute('aria-hidden','true');
   const bar=document.createElement('span');bar.style.width=row.percent+'%';track.append(bar);button.append(name,count,share,track);
   button.onclick=()=>{dialog.close();openRoute(routeId);focus(row.point)};chart.append(button);
  }
 }
 function decorateShares(){
  const cache=new Map();const get=id=>{if(!cache.has(id))cache.set(id,stats(id));return cache.get(id)};
  for(const tr of document.querySelectorAll('#list tr[data-kind="boarding"]')){
   const result=get(Number(tr.dataset.route)),row=result.rows.find(row=>row.point.id===tr.dataset.id),note=tr.querySelector('.stop small');
   if(row&&note)note.textContent=row.count+' чел. · '+percentage(row.percent)+' сотрудников маршрута';
  }
  const p=currentPoint;
  if(p?.kind==='boarding'){
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
