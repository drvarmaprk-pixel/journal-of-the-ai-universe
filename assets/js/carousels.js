/* Weekly digest carousels: scroll-snap + dots + full-screen lightbox. No libraries, no tracking.
   Horizontal pointer/touch events are stopped so swipe-mode vertical flip does not steal them. */
(function(){
  var d=document, W=window, reduce=W.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function closestCar(el){ return el && el.closest && el.closest('.wkdig-car'); }

  /* ---- lightbox ---- */
  var lb=d.getElementById('wkdig-lb'), last=null;
  if(!lb){
    lb=d.createElement('div'); lb.id='wkdig-lb'; lb.className='wkdig-lb'; lb.hidden=true;
    lb.setAttribute('role','dialog'); lb.setAttribute('aria-modal','true'); lb.setAttribute('aria-label','Slide viewer');
    lb.innerHTML='<button type="button" aria-label="Close">×</button><img alt="">';
    d.body.appendChild(lb);
  }
  var lbim=lb.querySelector('img'), lbbtn=lb.querySelector('button');
  function closeLb(){ if(lb.hidden)return; lb.hidden=true; lbim.src=''; d.body.classList.remove('wkdig-lb-open'); if(last&&last.focus)last.focus(); }
  function openLb(a){
    last=a; lbim.src=a.getAttribute('href'); lbim.alt=(a.querySelector('img')||{}).alt||'';
    d.body.classList.add('wkdig-lb-open'); lb.hidden=false; if(lbbtn)lbbtn.focus();
  }
  d.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a.wkdig-zoom'); if(!a)return;
    e.preventDefault(); openLb(a);
  });
  lb.addEventListener('click',function(e){ if(e.target===lb || e.target===lbbtn) closeLb(); });
  d.addEventListener('keydown',function(e){ if(e.key==='Escape') closeLb(); });

  /* ---- each carousel ---- */
  [].forEach.call(d.querySelectorAll('.wkdig-car'), function(car){
    var track=car.querySelector('.wkdig-track'); if(!track)return;
    var slides=[].slice.call(track.querySelectorAll('.wkdig-slide'));
    var dots=[].slice.call(car.querySelectorAll('.wkdig-dot'));
    var prev=car.querySelector('.wkdig-prev'), next=car.querySelector('.wkdig-next');
    var i=0, ticking=false;
    function origin(){ return slides[0] ? slides[0].offsetLeft : 0; }
    function go(n, instant){
      n=Math.max(0, Math.min(slides.length-1, n)); i=n;
      var sl=slides[n];
      if(sl){
        var left=sl.offsetLeft-origin();
        if(instant||reduce){
          var sb=track.style.scrollBehavior;
          track.style.scrollBehavior='auto';
          track.scrollLeft=left;
          track.style.scrollBehavior=sb;
        } else {
          track.scrollTo({left:left, behavior:'smooth'});
        }
      }
      dots.forEach(function(b,k){ b.setAttribute('aria-current', k===n?'true':'false'); });
      if(prev) prev.disabled=n<=0; if(next) next.disabled=n>=slides.length-1;
    }
    function fromScroll(){
      var x=track.scrollLeft, best=0, bd=1e9, o=origin();
      slides.forEach(function(s,k){ var dd=Math.abs(s.offsetLeft-o-x); if(dd<bd){bd=dd;best=k;} });
      if(best!==i){
        i=best;
        dots.forEach(function(b,k){ b.setAttribute('aria-current', k===best?'true':'false'); });
      }
      if(prev) prev.disabled=best<=0; if(next) next.disabled=best>=slides.length-1;
    }
    track.addEventListener('scroll',function(){ if(ticking)return; ticking=true; requestAnimationFrame(function(){ ticking=false; fromScroll(); }); }, {passive:true});
    dots.forEach(function(b,k){ b.addEventListener('click',function(){ go(k); }); });
    if(prev) prev.addEventListener('click',function(){ go(i-1); });
    if(next) next.addEventListener('click',function(){ go(i+1); });
    track.addEventListener('keydown',function(e){
      if(e.key==='ArrowLeft'||e.key==='ArrowUp'){ e.preventDefault(); go(i-1); }
      else if(e.key==='ArrowRight'||e.key==='ArrowDown'){ e.preventDefault(); go(i+1); }
      else if(e.key==='Home'){ e.preventDefault(); go(0); }
      else if(e.key==='End'){ e.preventDefault(); go(slides.length-1); }
    });
    /* do not start a vertical swipe-mode flip from inside the carousel */
    ['touchstart','touchmove','pointerdown','pointermove','wheel'].forEach(function(ev){
      track.addEventListener(ev, function(e){ e.stopPropagation(); }, {passive: ev!=='touchmove' && ev!=='wheel' && ev!=='pointermove'});
    });
    go(0, true);
  });
})();
