/* Choose a time first; keep route choices in a small, dismissible dropdown. */
(()=>{
 const initial=new URLSearchParams(location.search);
 let installed=false;
 function install(){
  if(installed)return;installed=true;
  const $=s=>document.querySelector(s),picker=$('.route-picker'),tabs=$('.trip-direction-tabs'),shifts=$('header.app-header>.shifts'),choices=$('.route-choices');
  if(!picker||!tabs||!shifts||!choices)return;
  const linkedRoute=initial.has('route')&&[0,...data.routes.map(r=>r.id)].includes(Number(initial.get('route')));
  let timeChosen=linkedRoute||['day','night'].includes(initial.get('shift')),routeChosen=linkedRoute;
  const dropdown=document.createElement('div');dropdown.className='trip-route-dropdown';
  const toggle=document.createElement('button');toggle.type='button';toggle.id='tripRouteToggle';toggle.className='trip-route-toggle';toggle.setAttribute('aria-controls','tripRouteMenu');toggle.setAttribute('aria-expanded','false');
  const label=document.createElement('span');label.className='trip-route-label';
  const arrow=document.createElement('span');arrow.className='trip-route-arrow';arrow.setAttribute('aria-hidden','true');toggle.append(label,arrow);
  const menu=document.createElement('section');menu.id='tripRouteMenu';menu.className='trip-route-menu';menu.hidden=true;menu.setAttribute('aria-labelledby','tripRouteMenuTitle');
  const heading=document.createElement('div');heading.className='trip-route-menu-heading';
  const title=document.createElement('span');title.id='tripRouteMenuTitle';
  const close=document.createElement('button');close.type='button';close.className='trip-route-close';close.textContent='×';close.setAttribute('aria-label','Закрыть список маршрутов');heading.append(title,close);
  menu.append(heading,choices);dropdown.append(toggle,menu);
  picker.insertBefore(shifts,tabs.nextSibling);picker.append(dropdown);
  if($('#routeCaption'))$('#routeCaption').hidden=true;
  for(const button of choices.children){
   const id=Number(button.dataset.pickRoute);button.replaceChildren();
   if(id){const number=document.createElement('strong');number.className='trip-route-number';number.textContent='№'+id;button.append(number)}
   const name=document.createElement('span');name.className='trip-route-name';button.append(name);
  }
  function refresh(){
   const outbound=TripDirections.isOutbound(),clock=outbound?(shift==='night'?'20:15':'08:15'):(shift==='night'?'19:45':'07:45');
   document.body.dataset.tripTimeChosen=String(timeChosen);
   shifts.setAttribute('aria-label',outbound?'Выберите время развоза с базы':'Выберите время прибытия на базу');
   for(const button of shifts.querySelectorAll('[data-shift]')){
    const night=button.dataset.shift==='night',at=outbound?(night?'20:15':'08:15'):(night?'19:45':'07:45'),active=timeChosen&&button.dataset.shift===shift;
    button.querySelector('span').textContent=at;
    button.setAttribute('aria-label',outbound?'Развоз с базы в '+at:'Прибытие на базу к '+at);
    button.title=outbound?(night?'После дневной смены':'После ночной смены'):'Прибытие на базу';
    button.setAttribute('aria-pressed',String(active));button.classList.toggle('active',active);
   }
   for(const button of choices.children){
    const route=data.routes.find(r=>r.id===Number(button.dataset.pickRoute));
    button.querySelector('.trip-route-name').textContent=route?route.title:'Все маршруты';
   }
   const route=data.routes.find(r=>r.id===selected),text=!timeChosen?'Сначала время':!routeChosen?'Выбрать маршрут':route?'№'+route.id+' · '+route.title:'Все маршруты';
   toggle.disabled=!timeChosen;label.textContent=text;toggle.title=routeChosen&&route?route.title:text;
   toggle.setAttribute('aria-label',!timeChosen?'Выберите время, чтобы открыть список маршрутов':routeChosen?(route?'Выбрать другой маршрут. Сейчас №'+route.id+' — '+route.title:'Выбрать маршрут. Сейчас все маршруты'):'Выбрать маршрут');
   toggle.classList.toggle('has-route',timeChosen&&routeChosen);
   toggle.style.setProperty('--route-color',selected?colors[selected-1]:'var(--brand)');
   title.textContent=outbound?'Развоз с базы в '+clock:'Привоз на базу к '+clock;
  }
  function closeMenu(restoreFocus=false){
   const wasOpen=!menu.hidden;menu.hidden=true;toggle.setAttribute('aria-expanded','false');
   if(wasOpen&&restoreFocus&&!toggle.disabled)toggle.focus();
  }
  function openMenu(){
   if(!timeChosen)return;
   refresh();menu.hidden=false;toggle.setAttribute('aria-expanded','true');
   const active=routeChosen?choices.querySelector('[data-pick-route="'+selected+'"]'):choices.querySelector('[data-pick-route="1"]');
   (active||choices.querySelector('button')).focus();
  }
  toggle.onclick=()=>menu.hidden?openMenu():closeMenu(true);
  close.onclick=()=>closeMenu(true);
  shifts.addEventListener('click',event=>{if(event.target.closest('[data-shift]')){timeChosen=true;refresh();openMenu()}});
  document.addEventListener('tripdirectionchange',()=>{timeChosen=false;routeChosen=false;closeMenu();refresh()});
  document.addEventListener('pointerdown',event=>{if(!picker.contains(event.target))closeMenu()});
  document.addEventListener('focusin',event=>{if(!menu.hidden&&!picker.contains(event.target))closeMenu()});
  picker.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&!menu.hidden){event.preventDefault();event.stopPropagation();closeMenu(true)}
   if(event.target===toggle&&event.key==='ArrowDown'){event.preventDefault();openMenu()}
   if(choices.contains(event.target)&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
    event.preventDefault();const buttons=[...choices.querySelectorAll('button')],index=buttons.indexOf(event.target.closest('button'));
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next].focus();
   }
  });
  const previousRoute=openRoute;openRoute=function(id){const wasOpen=!menu.hidden;previousRoute(id);timeChosen=true;routeChosen=true;closeMenu(wasOpen);refresh()};
  const previousShift=syncShift;syncShift=function(){previousShift();timeChosen=true;refresh()};
  $('#mapTheme')?.addEventListener('change',refresh);
  document.body.classList.add('compact-trip-picker');refresh();
  if(timeChosen&&!routeChosen&&!document.querySelector('dialog[open]'))openMenu();
 }
 window.CompactTripPicker={install};
})();
