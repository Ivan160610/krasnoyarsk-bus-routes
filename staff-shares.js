/* One fixed allocation: every employee belongs to one route and one stop. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StaffShareStats=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function distribution(points,allocations,routeId,variant){
  const counts=allocations.stops;
  const rows=points.filter(p=>['boarding','pass'].includes(p.kind)&&p.route===Number(routeId)).sort((a,b)=>(a.routePosition??a.order??0)-(b.routePosition??b.order??0)).map(p=>({point:p,count:counts[p.id]?.count||0,walkCount:counts[p.id]?.walkCount||0,feederCount:counts[p.id]?.feederCount||0,percent:0}));
  const total=rows.reduce((sum,row)=>sum+row.count,0);
  for(const row of rows)row.percent=total?row.count/total*100:0;
  return {routeId:Number(routeId),variant,total,totalStaff:allocations.totalStaff,walkCount:rows.reduce((sum,row)=>sum+row.walkCount,0),feederCount:rows.reduce((sum,row)=>sum+row.feederCount,0),rows};
 }
 return {distribution};
});

(()=>{
 if(typeof document==='undefined')return;
 const $=selector=>document.querySelector(selector),format=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1});
 const percentage=value=>format.format(value)+'%';
 const allocations=JSON.parse($('#staff-share-data').textContent);
 const stats=routeId=>StaffShareStats.distribution(data.points,allocations,routeId,shift);
 const launcher=document.createElement('button');launcher.id='openStaffShares';launcher.type='button';launcher.className='staff-share-launcher';launcher.textContent='Доли сотрудников';launcher.setAttribute('aria-haspopup','dialog');
 $('#openFeeder').after(launcher);
 const dialog=document.createElement('dialog');dialog.id='staffShareDialog';dialog.className='staff-share-dialog';dialog.setAttribute('aria-labelledby','staffShareTitle');
 dialog.innerHTML='<header class="staff-share-header"><h2 id="staffShareTitle">Доли по остановкам</h2><button id="closeStaffShares" type="button" aria-label="Закрыть доли сотрудников">×</button></header><div class="staff-share-controls"><label>Маршрут<select id="staffShareRoute" aria-label="Маршрут для распределения"></select></label><div><span class="staff-share-field-label">Расписание</span><div class="staff-share-variants" role="group" aria-label="Время прибытия для распределения"><button type="button" data-staff-variant="day">К 07:45</button><button type="button" data-staff-variant="night">К 19:45</button></div></div></div><div class="staff-share-summary" aria-live="polite"><strong id="staffShareTotal"></strong><span id="staffShareBasis"></span></div><div class="staff-share-chart" id="staffShareChart" role="group" aria-label="Распределение сотрудников по всем остановкам"></div><footer class="staff-share-footer"><p>Каждому сотруднику выбран один маршрут и одна остановка: ближайшая в пределах 20 мин пешком, при скорости 4 км/ч. Для остальных выбран подъезд к одной посадке, доступный по прежнему плану утром и вечером. Расстояния — от исходных остановок, домашних адресов нет.</p><p>Всего 199 сотрудников без повторов между маршрутами. Распределение одинаковое для дня и ночи. Доли — от сотрудников выбранного маршрута. Это общий план, фактический состав смен неизвестен.</p><p>Нажмите остановку, чтобы показать её на карте. Городские проездные остановки показаны для планирования посадок; их время проезда остаётся примерным.</p></footer>';
 document.body.append(dialog);
 const routeSelect=$('#staffShareRoute');
 for(const route of data.routes){const option=document.createElement('option');option.value=route.id;option.textContent='№'+route.id+' · '+route.title;routeSelect.append(option)}
 function renderChart(){
  const routeId=Number(routeSelect.value),result=stats(routeId),route=data.routes.find(r=>r.id===routeId),chart=$('#staffShareChart');
  dialog.style.setProperty('--staff-share-color',colors[routeId-1]||route.color);
  $('#staffShareTotal').textContent=result.total?result.total+' чел. — 100% маршрута №'+routeId:'Маршрут №'+routeId+' — пока без назначений';
  $('#staffShareBasis').textContent='Остановок: '+result.rows.length+' · '+result.walkCount+' чел. пешком до 20 мин · '+result.feederCount+' чел. с подъездом. Всего без повторов: '+result.totalStaff+' чел.';
  for(const button of dialog.querySelectorAll('[data-staff-variant]'))button.setAttribute('aria-pressed',String(button.dataset.staffVariant===shift));
  chart.replaceChildren();
  const headings=document.createElement('div');headings.className='staff-share-columns';headings.setAttribute('aria-hidden','true');
  for(const title of ['Остановка','Чел.','Доля']){const span=document.createElement('span');span.textContent=title;headings.append(span)}chart.append(headings);
  for(const row of result.rows){
   const button=document.createElement('button');button.type='button';button.className='staff-share-row';button.dataset.stopId=row.point.id;
   button.setAttribute('aria-label',row.point.name+': '+row.count+' чел., '+percentage(row.percent)+' сотрудников маршрута. Показать на карте');
   button.title='Пешком до 20 мин: '+row.walkCount+' чел.; с подъездом к выбранной посадке: '+row.feederCount+' чел.';
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
