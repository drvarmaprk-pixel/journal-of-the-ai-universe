/* space3d.js: tiny self-hosted 3D viewer for the Journal of the AI Universe (no libraries, no trackers).
   <div class="s3d" data-src="x.json" data-base="../">  .s3dstage (canvas goes here), .s3dfb (static image fallback), .s3dinfo, .s3dctl buttons
   Drag to rotate, pinch or +/- to zoom, tap a point for its name and link. Lazy: starts only when scrolled near; pauses off-screen.
   Respects prefers-reduced-motion (no auto-spin) and Save-Data (keeps the static image). */
(function () {
  "use strict";
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SAVE = navigator.connection && navigator.connection.saveData;
  function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
  function rgba(h, a) { var n = parseInt(h.slice(1), 16); return "rgba(" + (n >> 16) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a.toFixed(3) + ")"; }

  function start(box, d) {
    var stage = box.querySelector(".s3dstage"), info = box.querySelector(".s3dinfo"), base = box.getAttribute("data-base") || "";
    var cv = document.createElement("canvas"), ctx = cv.getContext && cv.getContext("2d");
    if (!ctx || !stage) return;
    cv.className = "s3dc"; cv.tabIndex = 0; cv.setAttribute("role", "img");
    cv.setAttribute("aria-label", (box.getAttribute("data-label") || "Interactive 3D map") + ". Drag to rotate, use the plus and minus buttons to zoom, tap a point for its link. Arrow keys rotate.");
    stage.appendChild(cv); box.classList.add("on");
    var N = d.nodes, E = d.edges || [], P = new Array(N.length);
    var yaw = 0.6, pitch = -0.25, zoom = 1, W = 0, H = 0, dpr = 1, S = 1, auto = !RM, vis = true, sel = -1, hov = -1, need = true, running = false;
    var light = function () { return document.documentElement.getAttribute("data-theme") === "light"; };
    function size() {
      var r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + "px"; cv.style.height = H + "px"; need = true; wake();
    }
    function proj() {
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cam = 3.2;
      S = Math.min(W, H) * (d.sphere ? 0.4 : 0.36) * zoom;
      for (var i = 0; i < N.length; i++) {
        var n = N[i], x = n.x * cy + n.z * sy, z = -n.x * sy + n.z * cy, y = n.y * cp - z * sp; z = n.y * sp + z * cp;
        var f = cam / (cam - z); P[i] = { x: W / 2 + x * S * f, y: H / 2 - y * S * f, z: z, f: f };
      }
    }
    function rad(i) { return N[i].r * P[i].f * Math.sqrt(zoom) * Math.max(0.75, Math.min(1.2, W / 700)); }
    function draw() {
      proj(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var lt = light(), txt = lt ? "20,28,60" : "238,241,248";
      if (d.sphere) {
        ctx.beginPath(); ctx.arc(W / 2, H / 2, S * 1.02, 0, 7); ctx.strokeStyle = lt ? "rgba(40,80,140,.25)" : "rgba(127,220,255,.22)"; ctx.lineWidth = 1; ctx.stroke();
        var g = ctx.createRadialGradient(W / 2 - S * .3, H / 2 - S * .3, S * .1, W / 2, H / 2, S * 1.05);
        g.addColorStop(0, lt ? "rgba(120,170,255,.10)" : "rgba(79,216,255,.10)"); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fill();
      }
      ctx.lineWidth = 1;
      for (var k = 0; k < E.length; k++) {
        var a = P[E[k][0]], b = P[E[k][1]], dep = ((a.z + b.z) / 2 + 1) / 2;
        ctx.strokeStyle = E[k][2] ? "rgba(" + txt + "," + (lt ? 0.04 + 0.1 * dep : 0.06 + 0.16 * dep) + ")" : rgba(N[E[k][1]].c, 0.12 + 0.4 * dep);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      var ord = N.map(function (_, i) { return i; }).sort(function (i, j) { return P[i].z - P[j].z; });
      ctx.font = "600 12px Inter, system-ui, sans-serif"; ctx.textBaseline = "middle";
      for (var q = 0; q < ord.length; q++) {
        var i = ord[q], p = P[i], r = rad(i), al = 0.35 + 0.65 * (p.z + 1) / 2;
        if (r * 2.4 > 3) { ctx.fillStyle = rgba(N[i].c, al * 0.18); ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.2, 0, 7); ctx.fill(); }
        ctx.fillStyle = rgba(N[i].c, al); ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
        if (i === sel || i === hov) { ctx.strokeStyle = "rgba(" + txt + ",.95)"; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1; }
        var lab = (i === sel || i === hov) || (N[i].t !== "p" && p.z > (W < 520 ? 0.45 : 0.1));
        if (lab) {
          var s = N[i].l; if (s.length > 48) s = s.slice(0, 46) + "…";
          ctx.fillStyle = "rgba(" + txt + "," + (i === sel || i === hov ? 1 : 0.4 + 0.6 * p.z) + ")"; var tw = ctx.measureText(s).width;
          if (p.x + r + 4 + tw > W - 4 && p.x - r - 4 - tw >= 4) { ctx.textAlign = "right"; ctx.fillText(s, p.x - r - 4, p.y); ctx.textAlign = "left"; }
          else ctx.fillText(s, Math.max(4, Math.min(p.x + r + 4, W - 4 - tw)), p.y);
        }
      }
    }
    function tick() {
      if (!vis) { running = false; return; }
      if (auto && !drag) { yaw += 0.0025; need = true; }
      if (need) { draw(); need = false; }
      if (auto || need) requestAnimationFrame(tick); else running = false;
    }
    function wake() { need = true; if (!running && vis) { running = true; requestAnimationFrame(tick); } }
    function pick(x, y) {
      var best = -1, bz = -9;
      for (var i = 0; i < N.length; i++) { var p = P[i], r = Math.max(14, rad(i) + 6), dx = p.x - x, dy = p.y - y; if (dx * dx + dy * dy <= r * r && p.z > bz) { bz = p.z; best = i; } }
      return best;
    }
    function url(u) { return /^https?:/.test(u) ? u : base + u; }
    function show(i) {
      sel = i; wake(); if (!info) return; info.textContent = "";
      if (i < 0) { info.appendChild(el("span", "s3dhint", box.getAttribute("data-hint") || "Tap a point to see its name and link.")); return; }
      var n = N[i]; info.appendChild(el("b", null, n.l));
      if (n.s) info.appendChild(el("span", "s3dsub", n.s));
      var a = el("a", "btn small", n.t === "p" ? "Open the paper ↗" : (d.kind === "globe" ? "Category page →" : "Papers in this category →")); a.href = url(n.u);
      if (n.t === "p") { a.target = "_blank"; a.rel = "noopener"; }
      info.appendChild(a);
      if (n.u2) { var b = el("a", "btn small ghost", "Today’s headlines →"); b.href = url(n.u2); info.appendChild(b); }
    }
    // pointer input: one finger/mouse rotates, two fingers pinch-zoom, a tap selects
    var pts = {}, drag = false, moved = 0, last = null, pinch0 = 0, zoom0 = 1;
    function rel(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    cv.addEventListener("pointerdown", function (e) {
      pts[e.pointerId] = rel(e); try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      var ids = Object.keys(pts); drag = true; moved = 0; last = rel(e); auto = false;
      if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = zoom; }
    });
    cv.addEventListener("pointermove", function (e) {
      var p = rel(e);
      if (!drag) { if (e.pointerType === "mouse") { var h = pick(p.x, p.y); if (h !== hov) { hov = h; cv.style.cursor = h >= 0 ? "pointer" : "grab"; wake(); } } return; }
      if (!pts[e.pointerId]) return; pts[e.pointerId] = p; var ids = Object.keys(pts);
      if (ids.length >= 2) { var a = pts[ids[0]], b = pts[ids[1]], dd = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0) zoom = Math.max(0.6, Math.min(3, zoom0 * dd / pinch0)); moved += 10; wake(); return; }
      var dx = p.x - last.x, dy = p.y - last.y; moved += Math.abs(dx) + Math.abs(dy); last = p;
      yaw += dx * 0.008; pitch = Math.max(-1.3, Math.min(1.3, pitch + dy * 0.006)); wake();
    });
    function up(e) {
      var wasTap = drag && moved < 8 && Object.keys(pts).length === 1;
      delete pts[e.pointerId]; if (Object.keys(pts).length) return; drag = false;
      if (wasTap && e.type === "pointerup") { var p = rel(e); show(pick(p.x, p.y)); }
    }
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("pointerleave", function () { if (hov >= 0) { hov = -1; wake(); } });
    cv.addEventListener("keydown", function (e) {
      var k = e.key, used = true;
      if (k === "ArrowLeft") yaw -= 0.15; else if (k === "ArrowRight") yaw += 0.15; else if (k === "ArrowUp") pitch = Math.max(-1.3, pitch - 0.12);
      else if (k === "ArrowDown") pitch = Math.min(1.3, pitch + 0.12); else if (k === "+" || k === "=") zoom = Math.min(3, zoom * 1.2); else if (k === "-") zoom = Math.max(0.6, zoom / 1.2);
      else used = false;
      if (used) { e.preventDefault(); auto = false; wake(); }
    });
    var ctl = box.querySelector(".s3dctl");
    if (ctl) ctl.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return; var a = b.getAttribute("data-a");
      if (a === "in") zoom = Math.min(3, zoom * 1.25); else if (a === "out") zoom = Math.max(0.6, zoom / 1.25);
      else if (a === "reset") { zoom = 1; yaw = 0.6; pitch = -0.25; show(-1); }
      else if (a === "spin") { auto = !auto; b.setAttribute("aria-pressed", auto ? "true" : "false"); }
      wake();
    });
    var sb = box.querySelector('[data-a="spin"]'); if (sb) sb.setAttribute("aria-pressed", auto ? "true" : "false");
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) wake(); }).observe(box);
    if ("MutationObserver" in window) new MutationObserver(function () { wake(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    document.addEventListener("visibilitychange", function () { vis = !document.hidden; if (vis) wake(); });
    if ("ResizeObserver" in window) new ResizeObserver(size).observe(stage); else window.addEventListener("resize", size);
    size(); show(-1);
  }

  function init(box) {
    if (box.getAttribute("data-init")) return; box.setAttribute("data-init", "1");
    if (SAVE) return;   // Save-Data: keep the static image
    fetch(box.getAttribute("data-src")).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { if (d && d.nodes && d.nodes.length) start(box, d); }).catch(function () {});
  }
  function boot() {
    var boxes = document.querySelectorAll(".s3d[data-src]"); if (!boxes.length) return;
    if (!("IntersectionObserver" in window)) { boxes.forEach(init); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); init(e.target); } }); }, { rootMargin: "250px" });
    boxes.forEach(function (b) { io.observe(b); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
