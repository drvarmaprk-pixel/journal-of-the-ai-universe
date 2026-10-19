// Events Ahead: client-side search and filters (no external services). Works on GitHub Pages and Netlify.
(function(){
  var form=document.getElementById('efil'); if(!form) return;
  var items=[].slice.call(document.querySelectorAll('#evlist li.ev'));
  var secs=[].slice.call(document.querySelectorAll('#evlist section.evm'));
  var $=function(id){return document.getElementById(id);};
  var q=$('q'),loc=$('loc'),p=$('p'),f=$('f'),m=$('m'),ind=$('in'),h=$('h'),cnt=$('ecount'),none=$('enone');
  function fold(s){s=(s||'').toLowerCase();try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(e){}return s;}
  var d=new Date(),today=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
  // read state from the URL (?q=Bengaluru&loc=c:India&p=04&f=online&m=2026-11&in=1&h=1)
  // whole-word match when the word exists as a token anywhere (so 'India' does not match 'Indiana'), else prefix match ('Benga' -> Bengaluru)
  var TOK={};items.forEach(function(li){li._t=' '+li.dataset.k+' ';li.dataset.k.split(' ').forEach(function(w){TOK[w]=1;});});
  var u=new URLSearchParams(location.search);
  function setSel(el,v){if(!v)return;for(var i=0;i<el.options.length;i++){if(el.options[i].value===v||el.options[i].value==='c:'+v||el.options[i].value==='r:'+v){el.selectedIndex=i;return;}}}
  q.value=u.get('q')||''; setSel(loc,u.get('loc')); setSel(p,u.get('p')); setSel(f,u.get('f')); setSel(m,u.get('m'));
  ind.checked=u.get('in')==='1'; h.checked=u.get('h')==='1';
  function run(push){
    var words=fold(q.value).split(/[^a-z0-9]+/).filter(Boolean).map(function(w){return TOK[w]?' '+w+' ':' '+w;}),L=loc.value,P=p.value,F=f.value,M=m.value,I=ind.checked,H=h.checked,n=0,total=0;
    items.forEach(function(li){
      var ds=li.dataset, ok=ds.e>=today; if(ok) total++;
      if(ok&&words.length){var k=li._t;for(var i=0;i<words.length;i++){if(k.indexOf(words[i])<0){ok=false;break;}}}
      if(ok&&L){ok=L.charAt(0)==='r'?ds.r===L.slice(2):ds.c===L.slice(2);}
      if(ok&&P) ok=ds.p===P;
      if(ok&&F){ok=F==='in-person'?(ds.f==='in-person'||ds.f==='hybrid'):F==='online'?(ds.f==='online'||ds.f==='hybrid'):F==='online-only'?ds.f==='online':ds.f===F;}
      if(ok&&M) ok=(' '+ds.m+' ').indexOf(' '+M+' ')>=0;
      if(ok&&I) ok=ds['in']==='1';
      if(ok&&H) ok=ds.h==='1';
      li.hidden=!ok; if(ok) n++;
    });
    secs.forEach(function(s){s.hidden=!s.querySelector('li.ev:not([hidden])');});
    cnt.textContent=(n===total?n+' upcoming event'+(n===1?'':'s'):n+' of '+total+' upcoming events match');
    none.hidden=n>0;
    if(push){var o=new URLSearchParams();if(q.value.trim())o.set('q',q.value.trim());if(L)o.set('loc',L);if(P)o.set('p',P);if(F)o.set('f',F);if(M)o.set('m',M);if(I)o.set('in','1');if(H)o.set('h','1');
      var s=o.toString();history.replaceState(null,'',location.pathname+(s?'?'+s:'')+location.hash);}
  }
  var t;q.addEventListener('input',function(){clearTimeout(t);t=setTimeout(function(){run(true);},120);});
  [loc,p,f,m,ind,h].forEach(function(el){el.addEventListener('change',function(){run(true);});});
  $('eclear').addEventListener('click',function(){q.value='';[loc,p,f,m].forEach(function(el){el.selectedIndex=0;});ind.checked=false;h.checked=false;run(true);});
  run(false);
})();
