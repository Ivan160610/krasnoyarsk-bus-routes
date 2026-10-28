/* GitHub Pages: a dated snapshot, without API keys or automatic tracking. */
(()=>{
 const panel=document.createElement('details');panel.className='live-bus-panel';panel.open=!matchMedia('(max-width:750px)').matches;
 const summary=document.createElement('summary');summary.textContent='Автобусы · подключение…';panel.append(summary);
 const note=document.createElement('p');note.textContent='Последние известные положения · автобусы пока не назначены на маршруты';panel.append(note);
 const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Загружаем сохранённые положения автобусов…';panel.append(status);
 const showAll=document.createElement('button');showAll.type='button';showAll.className='live-bus-row';showAll.textContent='Показать все автобусы';showAll.disabled=true;showAll.onclick=()=>focusBuses(vehicles.filter(valid));panel.append(showAll);
 const list=document.createElement('div');panel.append(list);document.querySelector('.map').append(panel);
 const group=elem('g',{id:'liveBuses','aria-label':'Последние положения автобусов'});
 let vehicles=[],failed=false;
 const valid=b=>Number.isFinite(b.latitude)&&Number.isFinite(b.longitude)&&Math.abs(b.latitude)<=90&&Math.abs(b.longitude)<=180&&Number.isFinite(b.positionTimeUnix)&&b.positionTimeUnix>0;
 const stamp=b=>new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Krasnoyarsk',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(b.positionTimeUnix*1000);
 const stale=b=>failed||Date.now()/1000-b.positionTimeUnix>300||b.positionTimeUnix>Date.now()/1000+60;
 function focusBuses(rows){
  setMobileView('map');const mobile=matchMedia('(max-width:750px)').matches;if(mobile)panel.open=false;
  const points=rows.map(b=>RouteAdminCore.project(b.longitude,b.latitude));if(!points.length)return;
  const width=svg.clientWidth,height=svg.clientHeight,left=130,right=panel.open?panel.getBoundingClientRect().width+100:60,top=85,bottom=(document.querySelector('#journeyBar')?.getBoundingClientRect().height||90)+70;
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const units=Math.max((maxX-minX+40)/Math.max(80,width-left-right),(maxY-minY+40)/Math.max(80,height-top-bottom),.02);
  pendingFit=false;box={x:(minX+maxX)/2-(left+(width-left-right)/2)*units,y:(minY+maxY)/2-(top+(height-top-bottom)/2)*units,w:width*units,h:height*units};redraw();
 }
 function draw(){
  group.replaceChildren();const f=scale();
  vehicles.filter(valid).forEach((b,i)=>{
   const [x,y]=RouteAdminCore.project(b.longitude,b.latitude),color=stale(b)?'#9a650c':'#146b57';
   const marker=elem('g',{'data-vehicle-id':b.id,role:'button',tabindex:0,'aria-label':`${b.name}. ${stale(b)?'Устаревшие данные':'Снимок положения'} ${stamp(b)}`},group);
   elem('circle',{cx:x,cy:y,r:8*f,fill:color,stroke:'#fff','stroke-width':2*f},marker);
   const direction=-1,tx=x+direction*14*f,ty=y-(15+Math.floor(i/2)*24)*f;
   elem('line',{x1:x,y1:y,x2:tx,y2:ty,stroke:color,'stroke-width':f},marker);
   const text=elem('text',{x:tx,y:ty,'text-anchor':direction>0?'start':'end','font-size':12*f,fill:color,stroke:'#fff','stroke-width':3*f,'paint-order':'stroke'},marker);text.textContent=b.name.replace(' Higer','');
   elem('title',{},marker).textContent=`${b.name}: ${stamp(b)} (Красноярск)`;
   const show=()=>focusBuses([b]);
   marker.onclick=e=>{e.stopPropagation();show()};marker.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show()}};
  });
 }
 function render(){
  summary.textContent=failed?'Автобусы · нет данных':`Автобусы · ${vehicles.length}`;showAll.disabled=!vehicles.some(valid);status.textContent=failed?'Не удалось загрузить сохранённые положения. Обновите страницу, чтобы повторить.':'Снимок данных. Автоматическое обновление не подключено. Время положения — по Красноярску.';
  list.replaceChildren();for(const b of vehicles){const button=document.createElement('button');button.type='button';button.className='live-bus-row';const title=document.createElement('strong');title.textContent=b.name;const label=document.createElement('span');label.textContent=valid(b)?`${stale(b)?'Устаревшие данные':'Снимок положения'} · ${stamp(b)}`:'Нет координат';button.append(title,label);button.disabled=!valid(b);button.onclick=()=>focusBuses([b]);list.append(button)}draw();
 }
 const before=redraw;redraw=function(){before();if(!mapMotion.active)draw()};
 async function refresh(){try{const response=await fetch('./bus-positions.json',{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('snapshot');const payload=await response.json();if(payload.mode!=='snapshot'||!Array.isArray(payload.positions))throw Error('format');vehicles=payload.positions;failed=false}catch{failed=true}render();}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});refresh();
})();

