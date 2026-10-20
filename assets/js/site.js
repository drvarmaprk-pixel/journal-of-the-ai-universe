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
