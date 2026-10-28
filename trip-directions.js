/* Delivery to work and return from work share the map, with separate route data. */
(function(root,factory){const core=factory();if(typeof module==='object'&&module.exports)module.exports=core;else root.TripDirectionsCore=core})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const isOutbound=doc=>doc?.trip?.direction==='outbound';
 const departureMinutes=(doc,variant)=>{const value=doc?.trip?.[variant==='night'?'departureEvening':'departureMorning'];return Number.isFinite(value)?value:variant==='night'?1215:495};
 const routeArrivalMinutes=(doc,routeId,variant)=>{const route=doc?.routes?.find(r=>r.id===Number(routeId)),value=route?.[variant==='night'?'arrivalEvening':'arrivalMorning'];return Number.isFinite(value)?value:null};
 const clock=value=>{if(!Number.isFinite(value))return '';const minute=((Math.round(value)%1440)+1440)%1440;return String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0')};
 const shiftLabel=(doc,variant)=>isOutbound(doc)?variant==='night'?'После дневной смены':'После ночной смены':variant==='night'?'Ночь':'День';
 return {isOutbound,departureMinutes,routeArrivalMinutes,clock,shiftLabel};
});

(()=>{
 if(typeof document==='undefined')return;
 const core=TripDirectionsCore,$=s=>document.querySelector(s),clone=value=>JSON.parse(JSON.stringify(value));
 // The original data has already passed StopTimetable.prepare at this point.
 const inbound=clone(data),outboundNode=$('#outbound-mapdata');
 let outbound=null,mode='inbound',installed=false,restoring=false;
 const originalText=new Map(),originalAttributes=new Map();
 function captureStaticLabels(){
  for(const selector of ['#addressTitle','#addressDialog .eyebrow','#addressDialog .intro','label[for="addressInput"]','#addressPickBanner span','#addressPick','#walkingSection h3','#walkingSection p','.destination small','.arrival-pill small','.public-city-card p','#scheduleTitle']){
   const element=$(selector);if(element)originalText.set(selector,element.textContent);
  }
  for(const selector of ['#addressMapCard','#journeyBar','.search-palette']){
   const element=$(selector);if(element)originalAttributes.set(selector,element.getAttribute('aria-label'));
  }
 }
 function directionText(selector,text){const element=$(selector);if(element&&originalText.has(selector))element.textContent=active()?text:originalText.get(selector)}
 function directionAria(selector,label){const element=$(selector);if(element&&originalAttributes.has(selector)){const value=active()?label:originalAttributes.get(selector);if(value===null)element.removeAttribute('aria-label');else element.setAttribute('aria-label',value)}}
 try{
  if(!outboundNode)throw Error('Missing outbound-mapdata');
  outbound=JSON.parse(outboundNode.textContent);
  if(!core.isOutbound(outbound)||outbound.routes?.length!==4||!Array.isArray(outbound.points))throw Error('Invalid outbound route data');
 }catch(error){console.error('Return route data unavailable:',error.message)}

 const active=()=>mode==='outbound',departureMinutes=variant=>core.departureMinutes(outbound,variant),departure=variant=>core.clock(departureMinutes(variant));
 const routeArrival=(routeId,variant)=>active()?core.clock(core.routeArrivalMinutes(data,routeId,variant)):variant==='night'?'19:45':'07:45';
 const shiftLabel=variant=>active()?(variant==='night'?'После дневной смены':'После ночной смены'):(variant==='night'?'Ночь':'День');
 const replaceData=next=>{for(const key of Object.keys(data))delete data[key];Object.assign(data,clone(next));};

 function setButtonText(button,label,sub){
  if(!button)return;
  const span=button.querySelector('span');if(!span)return;
  const small=span.querySelector('small');
  span.replaceChildren(document.createTextNode(label));
  if(small){small.textContent=sub;span.append(small)}
 }

 function refreshLabels(){
  document.body.dataset.tripDirection=mode;
  const label=active()?'Развоз с базы':'Привоз на базу';
  const mainHeader=document.querySelector('body>header .brand h1');if(mainHeader)mainHeader.textContent=active()?'Со смены':'На смену';
  const directionPanel=$('#tripDirectionPanel');if(directionPanel)directionPanel.setAttribute('aria-labelledby','tripDirection-'+mode);
  for(const button of document.querySelectorAll('.trip-direction-tabs [data-trip-direction]')){
   const chosen=button.dataset.tripDirection===mode;button.setAttribute('aria-selected',String(chosen));button.tabIndex=chosen?0:-1;
  }
  setButtonText($('#day'),active()?'После ночной':'День',active()?'08:15 с базы':'07:45 на базе');
  setButtonText($('#night'),active()?'После дневной':'Ночь',active()?'20:15 с базы':'19:45 на базе');
  for(const [id,value]of [['day',active()?'После ночной смены · выезд в 08:15':'День · прибытие к 07:45'],['night',active()?'После дневной смены · выезд в 20:15':'Ночь · прибытие к 19:45']]){
   const button=$('#'+id);if(button)button.setAttribute('aria-label',value);
  }
  const shifts=document.querySelector('.shifts');if(shifts)shifts.setAttribute('aria-label',active()?'Отправление с базы после смены':'Выбор смены');
  const feeder=$('#openFeeder');if(feeder){feeder.hidden=active();feeder.setAttribute('aria-hidden',String(active()))}
  const filter=document.querySelector('[data-scope="boarding"]');if(filter)filter.textContent=active()?'Высадка':'Посадка';
  const note=$('.city-stops-note');if(note)note.textContent=active()?'Остановки перечислены от базы по ходу развоза. Время высадки рассчитано по дорожному пути, без текущих пробок.':'Остановки перечислены по ходу движения. ≈ — примерное время проезда между точками расписания; без знака ≈ — время из расписания.';
  const chartTimeLabel=$('.journey-arrival small');if(chartTimeLabel)chartTimeLabel.textContent=active()?'С базы':'На базе';
  directionText('#addressTitle','Ваша остановка высадки');
  directionText('#addressDialog .eyebrow','От автобуса до дома');
  directionText('#addressDialog .intro','Введите адрес назначения. Найдём ближайшую остановку высадки на выбранном маршруте и пеший путь от неё.');
  directionText('label[for="addressInput"]','Адрес назначения');
  directionText('#addressPickBanner span','Приблизьте карту и нажмите на место, куда хотите добраться после высадки.');
  directionText('#addressPick','Указать место назначения на карте');
  directionText('#walkingSection h3','От остановки до дома');
  directionText('#walkingSection p','Выберите остановку высадки, чтобы посмотреть путь до места назначения.');
  directionText('.destination small','Последняя остановка');
  directionText('.arrival-pill small','Отправление с базы');
  directionText('.public-city-card p','Городская остановка. Для развоза выберите остановку высадки на линии нужного маршрута.');
  directionText('#scheduleTitle','Развоз: остановки и время');
  directionAria('#addressMapCard','Путь от остановки высадки до дома');
  directionAria('#journeyBar','Развоз с базы: отправление и высадка');
  directionAria('.search-palette','Поиск остановки высадки и пути домой');
  const search=$('#search');if(search)search.placeholder=active()?'Найти остановку высадки':'Найти свою остановку';
  const fitStops=$('#city');if(fitStops){fitStops.setAttribute('aria-label',active()?'Показать места высадки':'Показать места посадки');fitStops.title=active()?'Показать места высадки':'Показать места посадки'}
  const addressRoute=$('#addressRoute');if(addressRoute)addressRoute.setAttribute('aria-label',active()?'Маршрут развоза':'Маршрут привоза');
  const addressShift=$('#addressShift');if(addressShift){
   for(const option of addressShift.options)option.textContent=option.value==='night'?(active()?'После дневной · 20:15 с базы':'Ночь · 19:45'):(active()?'После ночной · 08:15 с базы':'День · 07:45');
  }
  const addressLabel=document.querySelector('label[for="addressShift"]');if(addressLabel)addressLabel.firstChild.textContent=active()?'Выезд с базы':'Смена · прибытие';
  const routeSelect=$('#routeSelect');if(routeSelect)for(const option of routeSelect.options){const r=data.routes.find(route=>route.id===Number(option.value));option.textContent=r?'№'+r.id+' · '+r.title:'Все 4 маршрута'}
  for(const button of document.querySelectorAll('[data-pick-route]')){
   const r=data.routes.find(route=>route.id===Number(button.dataset.pickRoute));button.title=r?r.title:'Общая схема';button.setAttribute('aria-label',r?'Показать маршрут №'+r.id+' — '+r.title:'Показать все маршруты');
  }
  if(active()){
   const r=data.routes.find(route=>route.id===selected),text=r?.corridor||r?.streets?.join(' → ');
   if($('#corridorSummary'))$('#corridorSummary').textContent=text||'Четыре маршрута развоза от базы. Выберите номер маршрута и время отправления.';
   if($('#shiftHeading'))$('#shiftHeading').textContent=shiftLabel(shift);
   if($('#headerArrival'))$('#headerArrival').textContent=departure(shift);
   if($('#shiftTag'))$('#shiftTag').textContent=shift==='night'?'ПОСЛЕ ДНЕВНОЙ':'ПОСЛЕ НОЧНОЙ';
   if($('#mapSubtitle'))$('#mapSubtitle').textContent=selected?shiftLabel(shift)+' · с базы '+departure(shift):'Развоз с базы · выберите маршрут';
   if($('#finishTime'))$('#finishTime').textContent='Отправление от строения 3 в '+departure(shift)+'.';
   if($('#startLabel'))$('#startLabel').textContent='Отправление с базы';
   if($('#startTime'))$('#startTime').textContent=departure(shift);
   if($('#gateTime'))$('#gateTime').textContent=routeArrival(selected,shift)||'—';
   if($('#routeSummary'))$('#routeSummary').textContent=$('#routeSummary').textContent.replace(/места посадки|место посадки|мест посадки/g,match=>match.replace('посадки','высадки'));
   if($('#publishedStatus'))$('#publishedStatus').textContent='Развоз с базы · '+(data.updatedAt?new Date(data.updatedAt).toLocaleDateString('ru-RU'):'новое расписание')+' · выезд 08:15 / 20:15';
  }else if($('#publishedStatus')){
   $('#publishedStatus').textContent='Маршруты обновлены '+new Date(inbound.updatedAt).toLocaleDateString('ru-RU')+' · городской транспорт проверен 19.10.2026';
  }
  window.MapFirstUI?.refreshTripDirection?.();
  document.title=label+' · Красноярск';
 }

 function clearTransientState(){
  if(typeof stopAddressRequest==='function')stopAddressRequest();
  if(typeof addressOrigin!=='undefined')addressOrigin=null;
  if(typeof addressCandidates!=='undefined')addressCandidates=[];
  if(typeof addressWalk!=='undefined')addressWalk=null;
  if(typeof pickingAddress!=='undefined')pickingAddress=false;
  if(typeof addressPickStart!=='undefined')addressPickStart=null;
  if(typeof addressPickMoved!=='undefined')addressPickMoved=false;
  if(typeof activeFeeder!=='undefined')activeFeeder=null;
  if(typeof tableCache!=='undefined')tableCache.clear();
  if(typeof pathCache!=='undefined')pathCache.clear();
  for(const id of ['addressDialog','feederDialog','staffShareDialog']){const dialog=$('#'+id);if(dialog?.open)dialog.close()}
  for(const id of ['addressMapCard','addressPickBanner','publicCityCard']){const element=$('#'+id);if(element)element.hidden=true}
  if($('.public-city-card'))$('.public-city-card').hidden=true;
  $('.map')?.classList.remove('is-picking');
  document.body.dataset.addressWalk='false';document.body.dataset.addressPick='false';
  if($('#addressChoices'))$('#addressChoices').replaceChildren();if($('#addressResults'))$('#addressResults').replaceChildren();
  if($('#addressInput'))$('#addressInput').value='';if($('#originInput'))$('#originInput').value='';
  if($('#addressStatus')){$('#addressStatus').textContent='Введите адрес или укажите точку на карте.';$('#addressStatus').classList.remove('is-error')}
  if($('#search'))$('#search').value='';
  currentPoint=null;scope='all';pendingFit=false;
  if($('#detail'))$('#detail').style.display='none';
  if($('#scheduleScroll'))$('#scheduleScroll').scrollTop=0;
  if(typeof mapMotion!=='undefined')mapMotion.finish();
  if(typeof pointers!=='undefined')pointers.clear();
  if(typeof gesture!=='undefined')gesture=null;
 }

 function updateURL(){
  const url=new URL(location.href);if(active())url.searchParams.set('direction','outbound');else url.searchParams.delete('direction');
  if(selected)url.searchParams.set('route',String(selected));else url.searchParams.delete('route');
  if(shift==='night')url.searchParams.set('shift','night');else url.searchParams.delete('shift');
  history.replaceState(null,'',url.pathname+url.search+url.hash);
 }

 function setDirection(next){
  next=next==='outbound'?'outbound':'inbound';
  if(next==='outbound'&&!outbound)return false;
  if(next===mode){if(installed)refreshLabels();return true}
  const route=selected;
  if(installed)clearTransientState();
  mode=next;replaceData(active()?outbound:inbound);
  if(!installed){document.body.dataset.tripDirection=mode;return true}
  restoring=true;
  try{
   if(typeof syncScope==='function')syncScope();
   openRoute(data.routes.some(r=>r.id===route)?route:0);syncShift();
   if(typeof setMobileView==='function')setMobileView('map');
   refreshLabels();if(typeof fitRoute==='function')fitRoute();updateURL();
  }finally{restoring=false}
  document.dispatchEvent(new CustomEvent('tripdirectionchange',{detail:{direction:mode}}));
  return true;
 }

 function install(){
  if(installed)return;
  installed=true;
  const picker=$('.route-picker'),panel=$('.layout');
  if(!picker||!panel)throw Error('Trip direction UI requires map-first');
  captureStaticLabels();
  panel.id='tripDirectionPanel';panel.setAttribute('role','tabpanel');
  const tabs=document.createElement('div');tabs.className='trip-direction-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Направление поездки');
  for(const [value,label]of [['inbound','Привоз на базу'],['outbound','Развоз с базы']]){
   const button=document.createElement('button');button.type='button';button.id='tripDirection-'+value;button.dataset.tripDirection=value;button.setAttribute('role','tab');button.setAttribute('aria-controls','tripDirectionPanel');button.textContent=label;
   if(value==='outbound'&&!outbound){button.disabled=true;button.title='Данные развоза не загрузились. Обновите страницу.'}
   button.onclick=()=>setDirection(value);tabs.append(button);
  }
  tabs.addEventListener('keydown',event=>{
   const target=event.target.closest('[data-trip-direction]');if(!target||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();const buttons=[...tabs.querySelectorAll('button:not(:disabled)')],index=buttons.indexOf(target),next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
   buttons[next].click();buttons[next].focus();
  });
  picker.prepend(tabs);
  const oldList=list;list=function(){oldList();if(!restoring)refreshLabels()};
  const oldRoute=openRoute;openRoute=function(id){oldRoute(id);if(!restoring){refreshLabels();updateURL()}};
  const oldShift=syncShift;syncShift=function(){oldShift();if(!restoring){refreshLabels();updateURL()}};
  refreshLabels();
  if(active()){
   // Data was selected before map-first and staff modules initialized.
   const r=selected;restoring=true;try{openRoute(r);syncShift();refreshLabels();fitRoute()}finally{restoring=false}
  }
  updateURL();
 }

 window.TripDirections={isOutbound:active,departureMinutes,departure,routeArrival,shiftLabel,setDirection,install,refresh:refreshLabels,getDirection:()=>mode};
 if(new URLSearchParams(location.search).get('direction')==='outbound')setDirection('outbound');
})();
