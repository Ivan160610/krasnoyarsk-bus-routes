/* Progressive enhancement: retain the existing map, routing and search engines. */
(()=>{
 const $=s=>document.querySelector(s);
 const header=document.querySelector('body>header'),layout=$('.layout'),drawer=layout.querySelector('aside'),map=$('.map'),routeCard=$('.route-card');
 header.classList.add('app-header');drawer.id='schedulePanel';drawer.classList.add('schedule-panel');drawer.setAttribute('aria-label','Остановки и расписание');
 header.querySelector('.eyebrow').textContent='Красноярск';
 const routePicker=document.createElement('div');routePicker.className='route-picker';
 const selector=document.createElement('select');selector.id='routeSelect';selector.setAttribute('aria-label','Выберите маршрут');
 for(const id of [0,...data.routes.map(r=>r.id)]){const option=document.createElement('option');option.value=id;option.textContent=id?`№${id} · ${data.routes.find(r=>r.id===id).title}`:'Все 4 маршрута';selector.append(option)}
 selector.hidden=true;
 const routeChoices=document.createElement('div');routeChoices.className='route-choices';routeChoices.setAttribute('role','group');routeChoices.setAttribute('aria-label','Показать маршрут на карте');
 for(const id of [0,...data.routes.map(r=>r.id)]){const button=document.createElement('button'),route=data.routes.find(r=>r.id===id);button.type='button';button.dataset.pickRoute=String(id);button.textContent=id?'№'+id:'Все';button.setAttribute('aria-label',route?'Показать маршрут №'+id+' — '+route.title:'Показать все маршруты');button.title=route?route.title:'Общая схема';button.onclick=()=>openRoute(id);routeChoices.append(button)}
 const routeCaption=document.createElement('div');routeCaption.className='route-caption';routeCaption.id='routeCaption';
 routePicker.append(selector,routeChoices,routeCaption);header.insertBefore(routePicker,$('.header-info'));header.append($('.shifts'));
 const searchPalette=document.createElement('section');searchPalette.className='search-palette';searchPalette.setAttribute('aria-label','Поиск остановки и пути');
 const searchLine=document.createElement('div');searchLine.className='search-line';searchLine.append($('.search-wrap'));
 const addressButton=$('#openAddressSearch');addressButton.lastChild.textContent='Адрес';addressButton.setAttribute('aria-label','Найти остановку по адресу');searchLine.append(addressButton);
 searchPalette.append(searchLine,$('#openFeeder'));map.prepend(searchPalette);
 $('#openFeeder').firstChild.textContent='Подобрать пересадку ';
 const drawerHeader=document.createElement('div');drawerHeader.className='drawer-header';drawerHeader.innerHTML='<h2 id="scheduleTitle">Остановки и расписание</h2><button id="closeSchedule" type="button" aria-label="Закрыть расписание">×</button>';drawer.prepend(drawerHeader);drawer.setAttribute('aria-labelledby','scheduleTitle');
 const corridor=document.createElement('details');corridor.className='route-corridor';const corridorLabel=document.createElement('summary');corridorLabel.textContent='Улицы маршрута';corridor.append(corridorLabel,$('#corridorSummary'));routeCard.after(corridor);
 $('.stop-filters').hidden=!data.points.some(p=>p.kind==='pass'||p.kind==='walk');
 drawer.querySelector('footer').append($('#publishedStatus'));
 const options=$('.map-options .option-content');if($('.public-city-toggle'))options.append($('.public-city-toggle'));options.append($('#mapQuality'));
 const sourceField=document.createElement('label');sourceField.className='theme-field';sourceField.innerHTML='Подложка карты<select id="mapSource" aria-label="Подложка карты"><option value="auto">Автоматически</option><option value="local">Встроенная карта</option></select>';options.append(sourceField);
 const sourceSelect=$('#mapSource');try{if(localStorage.getItem('commute-map-source')==='local')sourceSelect.value='local'}catch{}
 function applyMapSource(){mapServices.mode=sourceSelect.value;clearTimeout(tileTimer);for(const img of tileNodes.values()){MapTileLoader.cancel(img);img.remove()}tileNodes.clear();try{localStorage.setItem('commute-map-source',sourceSelect.value)}catch{}drawVisibleTiles()}
 sourceSelect.onchange=applyMapSource;applyMapSource();
 const themeField=document.createElement('label');themeField.className='theme-field';themeField.textContent='Оформление';themeField.innerHTML+='<select id="mapTheme" aria-label="Оформление карты"><option value="auto">Как на устройстве</option><option value="light">Светлое</option><option value="dark">Тёмное</option></select>';options.append(themeField);
 const journey=document.createElement('section');journey.id='journeyBar';journey.className='journey-bar';journey.setAttribute('aria-label','Ваша поездка');journey.innerHTML='<div class="journey-main"><div class="journey-kicker"><span id="journeyRoute" class="journey-route"></span><span id="journeyDirection"></span></div><h2 id="journeyStop">Выберите свою остановку</h2><p id="journeyHint" class="journey-hint">На карте или в расписании</p></div><div class="journey-times"><div><small id="journeyTimeLabel">Посадка</small><strong id="journeyTime">—</strong></div><div class="journey-arrival"><small>На базе</small><strong id="journeyArrival">07:45</strong></div></div><button id="journeyStops" type="button" aria-controls="schedulePanel" aria-expanded="false"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h12M9 12h12M9 19h12M3 5h.01M3 12h.01M3 19h.01"/></svg>Остановки</button><button id="journeyClear" type="button" aria-label="Сбросить выбранную остановку" hidden>×</button>';map.append(journey);
 journey.setAttribute('aria-live','polite');
 let labelsCustomized=false,returnFocus=null;
 const boardingFor=p=>p?.kind==='walk'?data.points.find(q=>q.kind==='boarding'&&q.route===p.route&&(p.targetId?q.id===p.targetId:q.name===p.target)):p;
 function updateJourney(){
  const point=currentPoint,routeId=point?.route||selected,route=data.routes.find(r=>r.id===routeId),first=data.points.filter(p=>p.kind==='boarding'&&p.route===routeId).sort((a,b)=>(a.order||0)-(b.order||0))[0],boarding=boardingFor(point);
  journey.dataset.pointKind=point?.kind||'overview';
  selector.value=String(selected);
  for(const button of routeChoices.children){const id=Number(button.dataset.pickRoute),active=id===selected;button.setAttribute('aria-pressed',String(active));button.classList.toggle('active',active);button.style.setProperty('--pick-color',id?colors[id-1]:'var(--brand)')}
  routeCaption.textContent=selected?data.routes.find(r=>r.id===selected)?.title||'':'Все маршруты · выберите номер для просмотра';
  $('#journeyRoute').textContent=routeId?String(routeId).padStart(2,'0'):'4';$('#journeyRoute').dataset.all=String(!routeId);
  journey.style.setProperty('--journey-color',routeId?colors[routeId-1]:'var(--brand)');
  $('#journeyDirection').textContent=route?`Маршрут №${route.id} · ${route.title}`:'Маршруты Красноярска';
  $('#journeyStop').textContent=point?.name||(route?first?.name||route.title:'Выберите свою остановку');
  $('#journeyStop').title=$('#journeyStop').textContent;
  $('#journeyHint').textContent=point?.kind==='walk'?`Пешком ${point.walkMin} мин до «${point.target}»`:point?.kind==='pass'?'Городская остановка по пути · примерное время проезда':point?.kind==='gate'?'Въезд на территорию базы':point?.kind==='finish'?'Высадка у строения 3':point?.id==='m2-3'?'Посадка на проспекте Мира':point?'Место посадки на служебный автобус':route?'Начало маршрута → база':'Нажмите на точку карты или откройте список остановок';
  $('#journeyTimeLabel').textContent=point?.kind==='pass'?'Время автобуса':point?.kind==='gate'?'Въезд':point?.kind==='finish'?'Высадка':point?'Посадка':route?'Отправление':'Посадка';
  $('#journeyTime').textContent=point?(point.kind==='pass'?(tripTime(point)||'—'):boarding?tripTime(boarding)||'—':'—'):first?tripTime(first):'—';
  $('#journeyArrival').textContent=arrival();$('#journeyClear').hidden=!point;
 }
 function safeMapArea(){
  const width=svg.clientWidth,height=svg.clientHeight,mobile=width<=750;
  const activeCard=document.body.dataset.addressWalk==='true'?$('#addressMapCard'):journey;
  const cardHeight=activeCard.hidden||document.body.dataset.view==='list'?0:activeCard.getBoundingClientRect().height;
  const top=mobile?108:82,bottom=cardHeight+(mobile?55:65),left=document.body.dataset.view==='list'?Math.min(drawer.getBoundingClientRect().right+24,width*.6):32,right=mobile?46:74;
  return {width,height,left,right,top,bottom,usableWidth:Math.max(70,width-left-right),usableHeight:Math.max(90,height-top-bottom)};
 }
 fitCoordinates=function(xy){
  const area=safeMapArea();if(!area.width||!area.height)return;
  if(!xy.length)xy=[[150,50],[1150,1100]];
  const xs=xy.map(p=>p[0]),ys=xy.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const units=Math.max((maxX-minX+35)/area.usableWidth,(maxY-minY+35)/area.usableHeight,.02);
  box={x:(minX+maxX)/2-(area.left+area.usableWidth/2)*units,y:(minY+maxY)/2-(area.top+area.usableHeight/2)*units,w:area.width*units,h:area.height*units};redraw();
 };
 fitRoute=function(){pendingFit=false;fitCoordinates(data.routes.filter(r=>!selected||r.id===selected).flatMap(r=>r.xy))};
 focus=function(point){
  pendingFit=false;setMobileView('map');detail(point);
  const area=safeMapArea(),units=250/Math.max(area.width,1);
  box={x:point.x-(area.left+area.usableWidth/2)*units,y:point.y-(area.top+area.usableHeight/2)*units,w:area.width*units,h:area.height*units};redraw();
 };
 const originalList=list;list=function(){originalList();updateJourney()};
 const originalDetail=detail;detail=function(point){
  originalDetail(point);$('#detail').style.display='none';updateJourney();
  const area=safeMapArea(),units=box.w/Math.max(area.width,1),x=(point.x-box.x)/units,y=(point.y-box.y)/units;
  if(x<area.left||x>area.width-area.right||y<area.top||y>area.height-area.bottom){box.x=point.x-(area.left+area.usableWidth/2)*units;box.y=point.y-(area.top+area.usableHeight/2)*units;redraw()}
 };
 setMobileView=function(view){
  const open=view==='list';document.body.dataset.view=open?'list':'map';drawer.hidden=!open;drawer.inert=!open;
  $('#journeyStops').setAttribute('aria-expanded',String(open));
  for(const [id,v]of [['showMap','map'],['showList','list']]){$('#'+id).classList.toggle('active',view===v);$('#'+id).setAttribute('aria-pressed',String(view===v))}
  if(!open)requestAnimationFrame(redraw);
 };
 const originalRoute=openRoute;openRoute=function(id){
  if(!labelsCustomized)$('#names').checked=!!id;
  originalRoute(id);setMobileView('map');updateJourney();fitRoute();
 };
 const originalShift=syncShift;syncShift=function(){originalShift();updateJourney()};
 selector.addEventListener('change',()=>openRoute(Number(selector.value)));
 $('#names').addEventListener('change',()=>labelsCustomized=true);
 $('#journeyStops').onclick=()=>{returnFocus=$('#journeyStops');setMobileView('list');$('#closeSchedule').focus();if(currentPoint){const row=[...$('#list').children].find(row=>row.dataset.id===currentPoint.id);if(row)row.scrollIntoView({block:'nearest'})}};
 $('#closeSchedule').onclick=()=>{setMobileView('map');(returnFocus||$('#journeyStops')).focus()};
 $('#journeyClear').onclick=()=>{$('#closeDetail').click();updateJourney()};
 $('#closeDetail').addEventListener('click',updateJourney);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.dataset.view==='list'){setMobileView('map');$('#search').focus()}});
 const originalRedraw=redraw;redraw=function(){
  if(mapMotion.active)return;
  originalRedraw();
  for(const point of dots.querySelectorAll('.point')){point.setAttribute('role','button');point.setAttribute('tabindex','0');point.setAttribute('aria-label',point.querySelector('title')?.textContent||'Остановка');point.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();point.dispatchEvent(new MouseEvent('click',{bubbles:true}))}})}
 };
 const media=matchMedia('(prefers-color-scheme: dark)'),themeSelect=$('#mapTheme');
 const darkColors=['#8cc6d4','#ee9be2','#ff9a7b','#aaa5ff'];
 function applyTheme(){
  const mode=themeSelect.value,dark=mode==='dark'||mode==='auto'&&media.matches;
  document.documentElement.dataset.mapTheme=dark?'dark':'light';
  renderRouteButtons();
  for(const route of data.routes)colors[route.id-1]=dark?(darkColors[route.id-1]||route.color):route.color;
  document.documentElement.style.setProperty('--accent',selected?colors[selected-1]:dark?'#c8e4a7':'#214d3a');
  list();redraw();if(currentPoint)detail(currentPoint);
 }
 try{const saved=localStorage.getItem('commute-map-theme');if(['auto','light','dark'].includes(saved))themeSelect.value=saved}catch{}
 themeSelect.onchange=()=>{try{localStorage.setItem('commute-map-theme',themeSelect.value)}catch{}applyTheme()};media.addEventListener('change',()=>{if(themeSelect.value==='auto')applyTheme()});
 document.body.classList.add('map-first');$('#names').checked=!!selected;setMobileView('map');applyTheme();updateJourney();
 requestAnimationFrame(()=>{if(currentPoint)redraw();else fitRoute()});
 window.addEventListener('resize',()=>requestAnimationFrame(()=>{
  if(typeof addressWalk!=='undefined'&&addressWalk){fitAddressCoordinates(addressWalk.path||[addressCore.project(addressWalk.origin.lon,addressWalk.origin.lat),[addressWalk.point.x,addressWalk.point.y]])}
  else if(currentPoint)focus(currentPoint);else fitRoute();
 }));
})();
