// Lightbox for posters (falls back to opening the image when JS is off).
(function(){var lb=document.getElementById('lb');if(!lb)return;var im=lb.querySelector('img');
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a.zoom');if(!a)return;e.preventDefault();im.src=a.href;im.alt=(a.querySelector('img')||{}).alt||'';lb.hidden=false;});
lb.addEventListener('click',function(){lb.hidden=true;im.src='';});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){lb.hidden=true;im.src='';}});})();
