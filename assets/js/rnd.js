// R&D Intelligence: client-side company multi-select, category, evidence and readiness filters plus search (no external services).
// Daily pages filter the company entries already on the page; /rnd/ searches every edition through rnd/index.json.
// URL state: ?co=01,04,AT&cat=hardware&ev=preprint&trl=commercial&q=PyTorch
(function(){
  var form=document.getElementById('rfil'); if(!form) return;
  var $=function(id){return document.getElementById(id);};
  var q=$('q'),cat=$('cat'),ev=$('ev'),trl=$('trl'),cnt=$('rcount'),none=$('rnone');
  var pbtn=$('pbtn'),panel=$('ppanel'),chips=$('pchips'),list=$('rklist'),xl=$('rkx');
  var pboxes=[].slice.call(panel.querySelectorAll('input[name=co]'));
  var pname={};pboxes.forEach(function(b){pname[b.value]=b.parentNode.querySelector('.pnm').textContent;});
  var NCO=pboxes.filter(function(b){return b.value!=='AT';}).length;
  function fold(s){s=(s||'').toLowerCase();try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(e){}return s;}
  function norm(s){return ' '+fold(s).replace(/[^a-z0-9]+/g,' ').trim()+' ';}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  var items=[],TOK={},mode=list?'page':'index';
  function index(arr){arr.forEach(function(it){it._t=norm(it.k);it._t.split(' ').forEach(function(w){if(w)TOK[w]=1;});});}
  var u=new URLSearchParams(location.search);
  function setSel(el,v){if(!v)return;for(var i=0;i<el.options.length;i++){if(el.options[i].value===v){el.selectedIndex=i;return;}}}
  q.value=u.get('q')||'';setSel(cat,u.get('cat'));setSel(ev,u.get('ev'));setSel(trl,u.get('trl'));
  var want={};u.getAll('co').join(',').split(/[\s,]+/).forEach(function(v){v=v.toUpperCase();if(v==='AT')want.AT=1;else if(/^\d{1,2}$/.test(v))want[('0'+parseInt(v,10)).slice(-2)]=1;});
  pboxes.forEach(function(b){b.checked=!!want[b.value];});
  function selected(){return pboxes.filter(function(b){return b.checked;}).map(function(b){return b.value;});}
  function drawSel(sel){
    pbtn.textContent=sel.length===0||sel.length===pboxes.length?'Companies: all':sel.length===1?'Companies: '+(sel[0]==='AT'?'':sel[0]+' ')+pname[sel[0]]:'Companies: '+sel.length+' selected';
    chips.innerHTML='';
    if(sel.length&&sel.length<pboxes.length){sel.forEach(function(v){var c=document.createElement('button');c.type='button';c.className='pchip';c.dataset.v=v;
      c.setAttribute('aria-label','Remove '+pname[v]);c.innerHTML='<b></b> <span></span> <i aria-hidden="true">×</i>';
      c.querySelector('b').textContent=v==='AT'?'+':v;c.querySelector('span').textContent=pname[v];chips.appendChild(c);});}
    chips.hidden=!chips.firstChild;
  }
  function has(list,v){return (' '+list+' ').indexOf(' '+v+' ')>=0;}
  function rowHTML(e){
    var co=e.co==='AT'?'<span class="pbadge" style="--c:#cfd8ee">'+esc(e.cn)+'</span>':'<a class="pbadge" style="--c:#7fdcff" href="companies/'+esc(e.s)+'/">'+esc(e.co)+' '+esc(e.cn)+'</a>';
    var ch=(e.cat?'<span class="rc cat-'+esc(e.cat)+'">'+esc(e.cat==='co-design'?'Co-design':e.cat.charAt(0).toUpperCase()+e.cat.slice(1))+'</span>':'')
      +e.evl.map(function(x){return '<span class="rc ev">'+esc(x)+'</span>';}).join('')+e.trll.map(function(x){return '<span class="rc trl">TRL: '+esc(x)+'</span>';}).join('');
    var src=(e.src||[]).map(function(s){var h=s.replace(/^https?:\/\/(www\.)?/,'').split('/')[0];return '<a href="'+esc(s)+'" rel="noopener" target="_blank">'+esc(h)+'</a>';}).join(' · ');
    var href=e.d+'/#'+(e.co==='AT'?'also':'c'+e.co);
    return '<div class="evd"><time datetime="'+esc(e.dp)+'">'+esc(e.dp)+'</time></div><div class="evb"><h3><a href="'+href+'">'+esc(e.t)+'</a></h3>'
      +(e.f?'<p class="evo">'+esc(e.f)+'</p>':'')+'<p class="evt">'+co+ch+'</p><p class="small">Edition '+esc(e.d)+' · Evidence: '+esc(e.ev)+' · TRL: '+esc(e.trl)+(src?' · Sources: '+src:'')+'</p></div>';
  }
  function run(push){
    var words=fold(q.value).split(/[^a-z0-9]+/).filter(Boolean).map(function(w){return TOK[w]?' '+w+' ':' '+w;}),
        C=cat.value,E=ev.value,T=trl.value,n=0,nat=0,sel=selected(),S={};
    sel.forEach(function(v){S[v]=1;});var useP=sel.length>0&&sel.length<pboxes.length;
    var shown=[];
    items.forEach(function(it){
      var ok=true;
      if(words.length){for(var i=0;i<words.length;i++){if(it._t.indexOf(words[i])<0){ok=false;break;}}}
      if(ok&&useP) ok=!!S[it.co];                      // ANY selected company (OR); other filters AND
      if(ok&&C) ok=has(it.cat,C);
      if(ok&&E) ok=has(it.ev,E);
      if(ok&&T) ok=has(it.trl,T);
      if(it.el) it.el.hidden=!ok;
      if(ok){if(it.co==='AT')nat++;else n++;shown.push(it);}
    });
    var total=items.length;
    if(mode==='page'){
      var al=$('also'); if(al) al.hidden=!al.querySelector('li.rk-item:not([hidden])');
      var tot=items.filter(function(i){return i.co!=='AT';}).length;
      cnt.textContent=(n===tot&&nat===total-tot?tot+' compan'+(tot===1?'y':'ies'):n+' of '+tot+' companies match')+(total>tot?' · '+nat+' also tracked':'');
    } else {
      var m=n+nat; cnt.textContent=m===total?total+' entries in all editions':m+' of '+total+' entries match';
      var frag=document.createDocumentFragment();
      shown.slice(0,300).forEach(function(it){if(!it.el){it.el=document.createElement('li');it.el.className='ev rentry';it.el.innerHTML=rowHTML(it.e);}frag.appendChild(it.el);});
      xl.innerHTML='';xl.appendChild(frag);
      if(shown.length>300){var li=document.createElement('li');li.className='small';li.textContent='Showing the first 300. Narrow the filters to see the rest.';xl.appendChild(li);}
    }
    none.hidden=(n+nat)>0;drawSel(sel);
    if(push){var o=new URLSearchParams();if(q.value.trim())o.set('q',q.value.trim());
      if(useP)o.set('co',sel.join(','));if(C)o.set('cat',C);if(E)o.set('ev',E);if(T)o.set('trl',T);
      var s=o.toString().replace(/%2C/g,',');history.replaceState(null,'',location.pathname+(s?'?'+s:'')+location.hash);}
  }
  function openPanel(open,focusBack){panel.hidden=!open;pbtn.setAttribute('aria-expanded',open?'true':'false');
    if(open){var first=panel.querySelector('input:checked')||pboxes[0];first.focus({preventScroll:true});panel.scrollIntoView({block:'nearest'});}
    else if(focusBack){pbtn.focus();}}
  pbtn.addEventListener('click',function(){openPanel(panel.hidden);});
  ['pdone','pdone2'].forEach(function(id){$(id).addEventListener('click',function(){openPanel(false,true);pbtn.scrollIntoView({block:'nearest'});});});
  panel.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();openPanel(false,true);}});
  panel.addEventListener('change',function(e){if(e.target.name==='co')run(true);});
  $('pall').addEventListener('click',function(){pboxes.forEach(function(b){b.checked=true;});run(true);});
  $('pnone').addEventListener('click',function(){pboxes.forEach(function(b){b.checked=false;});run(true);});
  chips.addEventListener('click',function(e){var c=e.target.closest&&e.target.closest('.pchip');if(!c)return;
    var nxt=c.nextElementSibling||c.previousElementSibling,v=c.dataset.v;
    pboxes.forEach(function(b){if(b.value===v)b.checked=false;});run(true);
    var again=nxt&&chips.querySelector('.pchip[data-v="'+nxt.dataset.v+'"]');(again||pbtn).focus();});
  var t;q.addEventListener('input',function(){clearTimeout(t);t=setTimeout(function(){run(true);},120);});
  [cat,ev,trl].forEach(function(el){el.addEventListener('change',function(){run(true);});});
  $('rclear').addEventListener('click',function(){q.value='';[cat,ev,trl].forEach(function(el){el.selectedIndex=0;});pboxes.forEach(function(b){b.checked=false;});run(true);});
  if(mode==='page'){
    items=[].slice.call(document.querySelectorAll('.rk-item')).map(function(el){var d=el.dataset;return {el:el,co:d.co,cat:d.cat,ev:d.ev,trl:d.trl,k:d.k};});
    index(items);run(false);
  } else {
    cnt.textContent='Loading the search index…';
    fetch(xl.dataset.src).then(function(r){return r.json();}).then(function(J){
      items=J.entries.map(function(e){return {e:e,co:e.co,cat:e.cat,ev:e.evg.join(' '),trl:e.trlg.join(' '),
        k:[e.cn,e.co==='AT'?'also tracked':'',e.t,e.f,e.cat,e.ev,e.trl,e.d,e.id].join(' ')};});
      index(items);run(false);
    }).catch(function(){cnt.textContent='The search index could not be loaded. Browse the archive or the company pages instead.';});
  }
})();
