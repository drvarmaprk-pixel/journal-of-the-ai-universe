/* PPT slides on AI — swipeable deck viewer (from 22 Nov 2026). */
(function(){
  function reduced(){return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;}
  function setup(root){
    if(root.dataset.aisReady) return;
    root.dataset.aisReady="1";
    var track=root.querySelector(".ais-track");
    if(!track) return;
    var slides=[].slice.call(root.querySelectorAll(".ais-slide"));
    var prev=root.querySelector(".ais-prev");
    var next=root.querySelector(".ais-next");
    var count=root.querySelector(".ais-count");
    var chips=[].slice.call(root.querySelectorAll("[data-ais-go]"));
    var n=slides.length;
    function index(){
      var w=track.clientWidth||1;
      return Math.max(0, Math.min(n-1, Math.round(track.scrollLeft/w)));
    }
    function go(i){
      i=Math.max(0, Math.min(n-1, i));
      var sl=slides[i];
      if(!sl) return;
      var left=sl.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
      track.scrollTo({left:left, behavior:reduced()?"auto":"smooth"});
      update(i);
    }
    function update(i){
      if(i==null) i=index();
      if(count) count.textContent=(i+1)+" / "+n;
      if(prev) prev.disabled=i===0;
      if(next) next.disabled=i===n-1;
      chips.forEach(function(c){
        var g=parseInt(c.getAttribute("data-ais-go"),10);
        c.setAttribute("aria-current", g===i+1 ? "true":"false");
      });
    }
    if(prev) prev.addEventListener("click", function(){go(index()-1);});
    if(next) next.addEventListener("click", function(){go(index()+1);});
    var ticking=false;
    track.addEventListener("scroll", function(){
      if(ticking) return;
      ticking=true;
      requestAnimationFrame(function(){ ticking=false; update(); });
    }, {passive:true});
    track.addEventListener("keydown", function(e){
      var k=e.key;
      if(k==="ArrowRight"||k==="ArrowDown"||k==="PageDown"){e.preventDefault();go(index()+1);}
      else if(k==="ArrowLeft"||k==="ArrowUp"||k==="PageUp"){e.preventDefault();go(index()-1);}
      else if(k==="Home"){e.preventDefault();go(0);}
      else if(k==="End"){e.preventDefault();go(n-1);}
    });
    chips.forEach(function(c){
      c.addEventListener("click", function(){go(parseInt(c.getAttribute("data-ais-go"),10)-1);});
    });
    var fs=root.querySelector(".ais-full");
    var stage=root.querySelector(".ais-stage")||root;
    if(fs){
      fs.addEventListener("click", function(){
        if(!document.fullscreenElement && stage.requestFullscreen) stage.requestFullscreen();
        else if(document.exitFullscreen) document.exitFullscreen();
      });
    }
    update(0);
  }
  function init(){ document.querySelectorAll(".ais-viewer").forEach(setup); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
