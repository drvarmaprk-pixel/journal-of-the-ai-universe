/* living_art.js: "Living category art" (Journal of the AI Universe, from the 16 Nov 2026 issue). Category icons
   (assets/img/med/NN.webp or NN-128.webp) gently loop (2.4 s, muted, no sound track) only while visible on screen.
   Never under prefers-reduced-motion or Save-Data; the still image stays if a video cannot play. No trackers. */
(function () {
  "use strict";
  var mq = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)");
  if ((mq && mq.matches) || (navigator.connection && navigator.connection.saveData) || !("IntersectionObserver" in window)) return;
  var RE = /assets\/img\/med\/(\d\d)(?:-128)?\.webp/, PROPS = ["width", "height", "padding", "margin", "borderRadius", "boxShadow",
    "backgroundImage", "backgroundColor", "display", "verticalAlign", "flex", "maxWidth", "maxHeight", "objectFit"], MAX = 60, live = [];
  var probe = document.createElement("video"), webm = probe.canPlayType && probe.canPlayType('video/webm; codecs="vp9"');
  function swap(img) {
    var m = RE.exec(img.getAttribute("src") || ""); if (!m) return null;
    var cs = getComputedStyle(img), w = img.getBoundingClientRect().width; if (!w) return null;
    var sz = w > 132 ? 220 : 128, base = img.getAttribute("src").replace(RE, "assets/img/med/anim/" + m[1] + "-" + sz);
    var v = document.createElement("video");
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.setAttribute("muted", "");
    v.setAttribute("aria-hidden", "true"); v.preload = "auto"; v.poster = img.currentSrc || img.src; v.className = img.className + " la-v";
    PROPS.forEach(function (p) { v.style[p] = cs[p]; });
    v.style.width = cs.width; v.style.height = cs.height; v.style.objectFit = "cover";
    v.src = base + (webm ? ".webm" : ".mp4");
    v.addEventListener("error", function () { if (v.parentNode) { v.parentNode.replaceChild(img, v); } });
    img.parentNode.replaceChild(v, img); v._img = img; return v;
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var t = e.target;
      if (e.isIntersecting) {
        if (t.tagName === "IMG") { if (live.length >= MAX) return; var v = swap(t); if (!v) return; io.unobserve(t); io.observe(v); live.push(v); t = v; }
        var p = t.play(); if (p && p.catch) p.catch(function () {});
      } else if (t.tagName === "VIDEO") t.pause();
    });
  }, { threshold: 0.5 });
  function scan() { document.querySelectorAll('img[src*="assets/img/med/"]').forEach(function (i) { if (RE.test(i.getAttribute("src"))) io.observe(i); }); }
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { if (mq.matches) live.forEach(function (v) { v.pause(); if (v.parentNode) v.parentNode.replaceChild(v._img, v); }); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan); else scan();
})();
