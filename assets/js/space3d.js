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
    if (d.kind === "ribbon" && d.series && !d.nodes) {
      var dates = d.dates, ser = d.series, T = dates.length, C = ser.length, mx = 1, rel = d.rel || "";
      for (var si = 0; si < C; si++) for (var sj = 0; sj < T; sj++) if (ser[si].v[sj] > mx) mx = ser[si].v[sj];
      d.nodes = []; d.edges = [];
      for (var si = 0; si < C; si++) for (var sj = 0; sj < T; sj++) {
        var x = T === 1 ? 0 : sj / (T - 1) * 2 - 1, z = ser[si].z != null ? ser[si].z : (C === 1 ? 0 : si / (C - 1) * 3.6 - 1.8), y = ser[si].v[sj] / mx * 1.8;
        var nn = (ser[si].n < 10 ? "0" : "") + ser[si].n;
        d.nodes.push({ x: x, y: y, z: z, r: 2 + 3.5 * y, c: ser[si].c, l: ser[si].l + " · " + dates[sj], u: rel + "issues/" + dates[sj] + "/#p" + nn, t: "c", s: ser[si].v[sj] + (ser[si].v[sj] === 1 ? " item" : " items") });
        if (sj) d.edges.push([si * T + sj - 1, si * T + sj]);
      }
    }
    var N = d.nodes, E = d.edges || [], P = new Array(N.length);
    var yaw0 = d.yaw != null ? d.yaw : 0.6, pitch0 = d.pitch != null ? d.pitch : -0.25;
    var yaw = yaw0, pitch = pitch0, zoom = 1, W = 0, H = 0, dpr = 1, S = 1, auto = !RM, vis = true, sel = -1, hov = -1, need = true, running = false;
    var fit = d.fit || d.kind === "atlas" || d.kind === "ribbon" || d.kind === "bars";
    var mid = { x: 0, y: 0, z: 0 }, ox = 0, oy = 0, bright = {}, F = N;
    if (fit) {
      F = [];
      for (var fi = 0; fi < N.length; fi++) { F.push(N[fi]); if (d.kind === "bars") F.push({ x: N[fi].x, y: 0, z: N[fi].z }); }
      for (fi = 0; fi < F.length; fi++) { mid.x += F[fi].x; mid.y += F[fi].y; mid.z += F[fi].z; }
      mid.x /= F.length; mid.y /= F.length; mid.z /= F.length;
    }
    if (d.kind === "atlas") N.map(function (_, i) { return i; }).sort(function (a, b) { return N[b].r - N[a].r; }).slice(0, 8).forEach(function (i) { bright[i] = 1; });
    var light = function () { return document.documentElement.getAttribute("data-theme") === "light"; };
    function size() {
      var r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + "px"; cv.style.height = H + "px"; need = true; wake();
    }
    function projectPoint(x, y, z) {
      if (fit) { x -= mid.x; y -= mid.y; z -= mid.z; }
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cam = 3.2;
      var X = x * cy + z * sy, Z = -x * sy + z * cy, Y = y * cp - Z * sp; Z = y * sp + Z * cp;
      var f = cam / (cam - Z); return { x: W / 2 + ox + X * S * f, y: H / 2 + oy - Y * S * f, z: Z, f: f };
    }
    function proj() {
      var factor = d.sphere ? 0.4 : d.kind === "bars" ? 0.42 : 0.36;
      S = Math.min(W, H) * factor * zoom; ox = 0; oy = 0;
      if (fit) {
        factor = d.fill != null ? d.fill : 0.4; S = 1;
        var minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
        for (var fi = 0; fi < F.length; fi++) {
          var q = projectPoint(F[fi].x, F[fi].y, F[fi].z);
          if (q.x < minx) minx = q.x; if (q.y < miny) miny = q.y; if (q.x > maxx) maxx = q.x; if (q.y > maxy) maxy = q.y;
        }
        var pw = maxx - minx || 1, ph = maxy - miny || 1;
        S = Math.min(Math.max(24, W * 2 * factor - 36) / pw, Math.max(24, H * 2 * factor - 36) / ph) * zoom;
        ox = -S * ((minx + maxx) / 2 - W / 2); oy = -S * ((miny + maxy) / 2 - H / 2);
      }
      for (var i = 0; i < N.length; i++) P[i] = projectPoint(N[i].x, N[i].y, N[i].z);
    }
    function linked(e) { return sel >= 0 && (e[0] === sel || e[1] === sel); }
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
        var a = P[E[k][0]], b = P[E[k][1]], dep = ((a.z + b.z) / 2 + 1) / 2, on = linked(E[k]);
        var dim = sel >= 0 && !on;
        ctx.lineWidth = on ? 2.2 : 1;
        ctx.strokeStyle = E[k][2]
          ? (on ? "rgba(255,230,160," + (0.45 + 0.4 * dep) + ")" : "rgba(" + txt + "," + (dim ? 0.03 : (lt ? 0.04 + 0.1 * dep : 0.06 + 0.16 * dep)) + ")")
          : rgba(N[E[k][1]].c, dim ? 0.05 : (on ? 0.55 + 0.4 * dep : 0.12 + 0.4 * dep));
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.lineWidth = 1;
      if (d.kind === "bars") {
        for (var bi = 0; bi < N.length; bi++) {
          var top = P[bi], base = projectPoint(N[bi].x, 0, N[bi].z), al = 0.35 + 0.65 * (top.z + 1) / 2;
          var bw = Math.max(2, rad(bi) * 0.7);
          ctx.fillStyle = rgba(N[bi].c, al * (sel >= 0 && bi !== sel ? 0.35 : 0.85));
          ctx.beginPath(); ctx.moveTo(base.x - bw, base.y); ctx.lineTo(top.x - bw * 0.55, top.y);
          ctx.lineTo(top.x + bw * 0.55, top.y); ctx.lineTo(base.x + bw, base.y); ctx.closePath(); ctx.fill();
        }
      }
      var linkedTo = {};
      if (sel >= 0) for (var lk = 0; lk < E.length; lk++) { if (E[lk][0] === sel) linkedTo[E[lk][1]] = 1; if (E[lk][1] === sel) linkedTo[E[lk][0]] = 1; }
      var ord = N.map(function (_, i) { return i; }).sort(function (i, j) { return P[i].z - P[j].z; });
      ctx.font = "600 12px Inter, system-ui, sans-serif"; ctx.textBaseline = "middle";
      for (var q = 0; q < ord.length; q++) {
        var i = ord[q], p = P[i], r = rad(i), al = 0.35 + 0.65 * (p.z + 1) / 2;
        if (r * 2.4 > 3) { ctx.fillStyle = rgba(N[i].c, al * 0.18); ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.2, 0, 7); ctx.fill(); }
        if (sel >= 0 && i !== sel && !linkedTo[i]) al *= 0.4;
        ctx.fillStyle = rgba(N[i].c, al); ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
        if (i === sel || i === hov) { ctx.strokeStyle = "rgba(" + txt + ",.95)"; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1; }
        var lab = (i === sel || i === hov) || (N[i].t !== "p" && p.z > (W < 520 ? 0.45 : 0.1) && d.kind !== "ribbon" && (d.kind !== "events" || (N[i].r > 8 && p.z > 0.15)) && (d.kind !== "atlas" || W >= 520 || bright[i]));
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
    function url(u) { return !u || /^https?:/.test(u) || u.charAt(0) === "#" ? u : base + u; }
    function show(i) {
      sel = i; wake(); if (!info) return; info.textContent = "";
      if (i < 0) { info.appendChild(el("span", "s3dhint", box.getAttribute("data-hint") || "Tap a point to see its name and link.")); return; }
      var n = N[i]; info.appendChild(el("b", null, n.l));
      if (n.s) info.appendChild(el("span", "s3dsub", n.s));
      var lab = n.t === "p" ? "Open the paper ↗" : n.t === "e" ? "Open the event ↗" : (d.kind === "globe" ? "Category page →" : d.kind === "cover" ? "Headlines in this category →" : d.kind === "archive" ? "Open this issue →" : d.kind === "bars" || d.kind === "atlas" || d.kind === "ribbon" ? "Headlines in this category →" : "Papers in this category →");
      var a = el("a", "btn small", lab); a.href = url(n.u);
      if (n.t === "p" || n.t === "e") { a.target = "_blank"; a.rel = "noopener"; }
      info.appendChild(a);
      if (n.u2) { var b = el("a", "btn small ghost", d.kind === "cover" ? "Category page →" : "Today’s headlines →"); b.href = url(n.u2); info.appendChild(b); }
      if (n.links && n.links.length) {
        var ul = el("ul", "s3dlist"); n.links.forEach(function (L) {
          var li = el("li"); var la = el("a", null, L[0]); la.href = url(L[1]); li.appendChild(la);
          if (L[2]) li.appendChild(el("span", "s3dsub", " · " + L[2])); ul.appendChild(li);
        }); info.appendChild(ul);
      }
      if (n.latest && n.latest.length) {
        info.appendChild(el("span", "s3dsub", d.kind === "events" ? "Upcoming events:" : "Latest items:"));
        var ul = el("ul", "s3dlist"); n.latest.forEach(function (L) {
          var li = el("li"); var la = el("a", null, L[0]); la.href = url(L[1]);
          if (/^https?:/.test(L[1])) { la.target = "_blank"; la.rel = "noopener"; }
          li.appendChild(la); if (L[2]) li.appendChild(el("span", "s3dsub", " · " + L[2])); ul.appendChild(li);
        }); info.appendChild(ul);
      }
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
      else if (a === "reset") { zoom = 1; yaw = yaw0; pitch = pitch0; show(-1); }
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
      .then(function (d) { if (d && ((d.nodes && d.nodes.length) || (d.kind === "ribbon" && d.series && d.series.length))) start(box, d); }).catch(function () {});
  }
  function boot() {
    var boxes = document.querySelectorAll(".s3d[data-src]"); if (!boxes.length) return;
    if (!("IntersectionObserver" in window)) { boxes.forEach(init); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); init(e.target); } }); }, { rootMargin: "250px" });
    boxes.forEach(function (b) { io.observe(b); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
