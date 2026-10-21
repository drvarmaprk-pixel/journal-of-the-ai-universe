// Theme toggle: follows the system light/dark setting until the reader chooses; the choice is kept in localStorage (never sent anywhere).
(function(){var b=document.getElementById('themebtn');if(!b)return;var r=document.documentElement;
function label(){var t=r.getAttribute('data-theme');b.setAttribute('aria-label',t==='light'?'Switch to dark theme':'Switch to light theme');b.title=b.getAttribute('aria-label');}
label();
b.addEventListener('click',function(){var t=r.getAttribute('data-theme')==='light'?'dark':'light';r.setAttribute('data-theme',t);try{localStorage.setItem('theme',t);}catch(e){}label();});
try{var mq=matchMedia('(prefers-color-scheme: light)');mq.addEventListener('change',function(e){var s;try{s=localStorage.getItem('theme');}catch(x){}if(!s){r.setAttribute('data-theme',e.matches?'light':'dark');label();}});}catch(e){}})();
// Lightbox for posters (falls back to opening the image when JS is off).
(function(){var lb=document.getElementById('lb');if(!lb)return;var im=lb.querySelector('img'),btn=lb.querySelector('button'),last=null;
function close(){if(lb.hidden)return;lb.hidden=true;im.src='';if(last)last.focus();}
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a.zoom');if(!a)return;e.preventDefault();last=a;im.src=a.href;im.alt=(a.querySelector('img')||{}).alt||'';lb.hidden=false;btn.focus();});
lb.addEventListener('click',close);
document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});})();
// Sticky header: measures its height into --hdrh (anchors and the Contents bar sit below it) and turns compact after scrolling.
// Back to top: shown after about a screen of scrolling on long pages; instant jump when the reader prefers reduced motion.
(function(){var r=document.documentElement,top=document.querySelector('header.top'),btn=document.getElementById('totop'),tick=false,compact=false;
var rm=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
function hdr(){if(top)r.style.setProperty('--hdrh',Math.round(top.getBoundingClientRect().height)+'px');}
hdr();if(top&&window.ResizeObserver)new ResizeObserver(hdr).observe(top);else addEventListener('resize',hdr);
function upd(){tick=false;var y=window.pageYOffset||r.scrollTop,h=window.innerHeight;
  if(top){if(!compact&&y>90){compact=true;top.classList.add('compact');}else if(compact&&y<24){compact=false;top.classList.remove('compact');}}
  if(btn){var long=r.scrollHeight>h*1.6,show=long&&y>Math.max(400,h*0.8);btn.classList.toggle('show',show);}}
addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd);}},{passive:true});addEventListener('resize',upd);upd();
if(btn)btn.addEventListener('click',function(e){window.scrollTo({top:0,left:0,behavior:rm.matches?'instant':'smooth'});
  if(e.detail===0){var b=document.querySelector('.brand');if(b)b.focus({preventScroll:true});}});})();
// Sticky Contents (issue pages, projects page): open as a side panel from 1200px; on smaller screens it closes after a choice,
// on Escape or a tap outside. The section in view is highlighted and named in the bar.
(function(){var nav=document.getElementById('jtoc');if(!nav)return;var det=nav.querySelector('details'),cur=nav.querySelector('.jcur'),list=nav.querySelector('.jlist');
var wide=matchMedia('(min-width: 1200px)');function mode(){det.open=wide.matches;}mode();
if(wide.addEventListener)wide.addEventListener('change',mode);else if(wide.addListener)wide.addListener(mode);
nav.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('.jlist a');if(a&&!wide.matches)det.open=false;});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&det.open&&!wide.matches){det.open=false;det.querySelector('summary').focus();}});
document.addEventListener('click',function(e){if(det.open&&!wide.matches&&!nav.contains(e.target))det.open=false;});
var links=[].slice.call(nav.querySelectorAll('.jlist a')),targets=[],byId={};
links.forEach(function(a){var id=a.getAttribute('href').slice(1),t=document.getElementById(id);if(t){targets.push(t);byId[id]=a;}});
if(!targets.length)return;var on=null,tick=false;
function reveal(){if(!on||!list||!det.open)return;var lr=list.getBoundingClientRect(),ar=on.getBoundingClientRect();if(ar.top<lr.top+8||ar.bottom>lr.bottom-8)list.scrollTop+=ar.top-lr.top-lr.height/3;}
det.addEventListener('toggle',reveal);
function spy(){tick=false;var hd=document.querySelector('header.top'),line=Math.max((wide.matches?(hd?hd.getBoundingClientRect().bottom:64):nav.querySelector('summary').getBoundingClientRect().bottom)+24,innerHeight*0.3),pick=null;
  for(var i=0;i<targets.length;i++){if(targets[i].getBoundingClientRect().top<=line)pick=targets[i];}
  var a=pick?byId[pick.id]:null;if(a===on)return;
  if(on){on.classList.remove('on');on.removeAttribute('aria-current');}on=a;
  if(a){a.classList.add('on');a.setAttribute('aria-current','location');if(cur)cur.textContent=a.textContent.replace(/\s+/g,' ').trim();
    if(wide.matches)reveal();}
  else if(cur)cur.textContent='';}
addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(spy);}},{passive:true});addEventListener('resize',spy);spy();})();
