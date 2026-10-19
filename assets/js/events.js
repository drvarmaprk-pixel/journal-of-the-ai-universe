// Events Ahead: client-side search and filters (no external services). Works on GitHub Pages and Netlify.
// URL state: ?q=Bengaluru&loc=c:India&p=04,17,33&f=online&m=2026-11&in=1&h=1   (p also accepts a single value or repeated p=)
(function(){
  var form=document.getElementById('efil'); if(!form) return;
  var items=[].slice.call(document.querySelectorAll('#evlist li.ev'));
  var secs=[].slice.call(document.querySelectorAll('#evlist section.evm'));
  var $=function(id){return document.getElementById(id);};
  var q=$('q'),loc=$('loc'),f=$('f'),m=$('m'),ind=$('in'),h=$('h'),cnt=$('ecount'),none=$('enone');
  var pbtn=$('pbtn'),panel=$('ppanel'),chips=$('pchips');
  var pboxes=[].slice.call(panel.querySelectorAll('input[name=p]'));
  var pname={};pboxes.forEach(function(b){pname[b.value]=b.parentNode.querySelector('.pnm').textContent;});
  function fold(s){s=(s||'').toLowerCase();try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(e){}return s;}
  var d=new Date(),today=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
  // whole-word match when the word exists as a token anywhere (so 'India' does not match 'Indiana'), else prefix match ('Benga' -> Bengaluru)
  var TOK={};items.forEach(function(li){li._t=' '+li.dataset.k+' ';li.dataset.k.split(' ').forEach(function(w){TOK[w]=1;});});
  var u=new URLSearchParams(location.search);
  function setSel(el,v){if(!v)return;for(var i=0;i<el.options.length;i++){if(el.options[i].value===v||el.options[i].value==='c:'+v||el.options[i].value==='r:'+v){el.selectedIndex=i;return;}}}
  q.value=u.get('q')||''; setSel(loc,u.get('loc')); setSel(f,u.get('f')); setSel(m,u.get('m'));
  ind.checked=u.get('in')==='1'; h.checked=u.get('h')==='1';
  var want={};u.getAll('p').join(',').split(/[\s,]+/).forEach(function(v){if(/^\d{1,2}$/.test(v))want[('0'+parseInt(v,10)).slice(-2)]=1;});
  pboxes.forEach(function(b){b.checked=!!want[b.value];});

  function selected(){return pboxes.filter(function(b){return b.checked;}).map(function(b){return b.value;});}
  function drawSel(sel){
    pbtn.textContent=sel.length===0||sel.length===pboxes.length?'Projects: all 50':sel.length===1?'Projects: '+sel[0]+' '+pname[sel[0]]:'Projects: '+sel.length+' selected';
    chips.innerHTML='';
    if(sel.length&&sel.length<pboxes.length){sel.forEach(function(v){var c=document.createElement('button');c.type='button';c.className='pchip';c.dataset.v=v;
      c.setAttribute('aria-label','Remove '+v+' '+pname[v]);c.innerHTML='<b></b> <span></span> <i aria-hidden="true">×</i>';
      c.querySelector('b').textContent=v;c.querySelector('span').textContent=pname[v];chips.appendChild(c);});}
    chips.hidden=!chips.firstChild;
  }
  function run(push){
    var words=fold(q.value).split(/[^a-z0-9]+/).filter(Boolean).map(function(w){return TOK[w]?' '+w+' ':' '+w;}),
        L=loc.value,F=f.value,M=m.value,I=ind.checked,H=h.checked,n=0,total=0,sel=selected(),S={};
    sel.forEach(function(v){S[v]=1;}); var useP=sel.length>0;
    items.forEach(function(li){
      var ds=li.dataset, ok=ds.e>=today; if(ok) total++;
      if(ok&&words.length){var k=li._t;for(var i=0;i<words.length;i++){if(k.indexOf(words[i])<0){ok=false;break;}}}
      if(ok&&L){ok=L.charAt(0)==='r'?ds.r===L.slice(2):ds.c===L.slice(2);}
      if(ok&&useP) ok=!!S[ds.p];                       // ANY selected project (OR); other filters AND
      if(ok&&F){ok=F==='in-person'?(ds.f==='in-person'||ds.f==='hybrid'):F==='online'?(ds.f==='online'||ds.f==='hybrid'):F==='online-only'?ds.f==='online':ds.f===F;}
      if(ok&&M) ok=(' '+ds.m+' ').indexOf(' '+M+' ')>=0;
      if(ok&&I) ok=ds['in']==='1';
      if(ok&&H) ok=ds.h==='1';
      li.hidden=!ok; if(ok) n++;
    });
    secs.forEach(function(s){s.hidden=!s.querySelector('li.ev:not([hidden])');});
    cnt.textContent=(n===total?n+' upcoming event'+(n===1?'':'s'):n+' of '+total+' upcoming events match');
    none.hidden=n>0; drawSel(sel);
    if(push){var o=new URLSearchParams();if(q.value.trim())o.set('q',q.value.trim());if(L)o.set('loc',L);
      if(useP&&sel.length<pboxes.length)o.set('p',sel.join(','));if(F)o.set('f',F);if(M)o.set('m',M);if(I)o.set('in','1');if(H)o.set('h','1');
      var s=o.toString().replace(/%2C/g,',');history.replaceState(null,'',location.pathname+(s?'?'+s:'')+location.hash);}
  }
  // project panel
  function openPanel(open,focusBack){panel.hidden=!open;pbtn.setAttribute('aria-expanded',open?'true':'false');
    if(open){var first=panel.querySelector('input:checked')||pboxes[0];first.focus({preventScroll:true});panel.scrollIntoView({block:'nearest'});}
    else if(focusBack){pbtn.focus();}}
  pbtn.addEventListener('click',function(){openPanel(panel.hidden);});
  ['pdone','pdone2'].forEach(function(id){$(id).addEventListener('click',function(){openPanel(false,true);pbtn.scrollIntoView({block:'nearest'});});});
  panel.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();openPanel(false,true);}});
  panel.addEventListener('change',function(e){if(e.target.name==='p')run(true);});
  $('pall').addEventListener('click',function(){pboxes.forEach(function(b){b.checked=true;});run(true);});
  $('pnone').addEventListener('click',function(){pboxes.forEach(function(b){b.checked=false;});run(true);});
  [].slice.call(panel.querySelectorAll('.pga')).forEach(function(bt){bt.addEventListener('click',function(){
    var g=bt.dataset.g,v=bt.dataset.act==='all';pboxes.forEach(function(b){if(b.dataset.g===g)b.checked=v;});run(true);});});
  chips.addEventListener('click',function(e){var c=e.target.closest&&e.target.closest('.pchip');if(!c)return;
    var nxt=c.nextElementSibling||c.previousElementSibling,v=c.dataset.v;
    pboxes.forEach(function(b){if(b.value===v)b.checked=false;});run(true);
    var again=nxt&&chips.querySelector('.pchip[data-v="'+nxt.dataset.v+'"]');(again||pbtn).focus();});
  var t;q.addEventListener('input',function(){clearTimeout(t);t=setTimeout(function(){run(true);},120);});
  [loc,f,m,ind,h].forEach(function(el){el.addEventListener('change',function(){run(true);});});
  $('eclear').addEventListener('click',function(){q.value='';[loc,f,m].forEach(function(el){el.selectedIndex=0;});pboxes.forEach(function(b){b.checked=false;});
    ind.checked=false;h.checked=false;run(true);});
  run(false);
})();
