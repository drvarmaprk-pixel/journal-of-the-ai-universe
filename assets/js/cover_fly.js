/* cover_fly.js (LIVE from the 16 Nov 2026 issue): a 3.6 s camera fly-through on the interactive issue cover, past the day's
   busiest categories, then it settles into the normal interactive view. Tap, drag, key or scroll-wheel on the cover skips it.
   Never runs under prefers-reduced-motion or Save-Data. Needs the s3dApi hook in space3d.js (installed 15 Nov 2026; issue covers from 16 Nov 2026 only). */
(function () {
  "use strict";
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (navigator.connection && navigator.connection.saveData) return;
  var DUR = 3600, STOPS = 3;
  function ease(u) { u = Math.max(0, Math.min(1, u)); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function wrapA(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
  function face(n) {   // camera angles that bring node n to the front, facing the viewer
    var yaw = Math.atan2(-n.x, n.z), zr = Math.hypot(n.x, n.z), pitch = Math.atan2(n.y, zr);
    return { yaw: yaw, pitch: Math.max(-1.2, Math.min(1.2, pitch)) };
  }
  function fly(box) {
    var api = box.s3dApi; if (!api || api.kind !== "cover" || box.getAttribute("data-flown")) return;
    box.setAttribute("data-flown", "1");
    var idx = api.nodes.map(function (_, i) { return i; }).sort(function (a, b) { return api.nodes[b].r - api.nodes[a].r; }).slice(0, STOPS);
    var c0 = api.cam(), end = { yaw: c0.yaw0, pitch: c0.pitch0, zoom: 1 };
    var keys = [{ yaw: c0.yaw0 - 1.4, pitch: c0.pitch0 + 0.5, zoom: 0.65, sel: -1 }];
    var yawAcc = keys[0].yaw;
    idx.forEach(function (i) { var f = face(api.nodes[i]); yawAcc += wrapA(f.yaw - yawAcc); keys.push({ yaw: yawAcc, pitch: f.pitch, zoom: 1.9, sel: i }); });
    keys.push({ yaw: yawAcc + wrapA(end.yaw - yawAcc), pitch: end.pitch, zoom: 1, sel: -1 });
    var skip = document.createElement("button"); skip.type = "button"; skip.className = "s3dskip"; skip.textContent = "Skip intro ›";
    skip.setAttribute("aria-label", "Skip the cover fly-through");
    skip.style.cssText = "position:absolute;right:10px;top:10px;z-index:3;font:600 12px Inter,system-ui,sans-serif;padding:6px 10px;border-radius:999px;border:1px solid rgba(246,198,106,.6);background:rgba(7,11,29,.7);color:#f6c66a";
    var stage = box.querySelector(".s3dstage") || box; if (getComputedStyle(stage).position === "static") stage.style.position = "relative"; stage.appendChild(skip);
    var t0 = null, done = false, lastSel = -2;
    function finish() {
      if (done) return; done = true; api.cam({ yaw: keys[keys.length - 1].yaw, pitch: end.pitch, zoom: 1, auto: true }); api.show(-1);
      skip.remove(); ["pointerdown", "wheel", "keydown"].forEach(function (e) { box.removeEventListener(e, finish, true); });
    }
    ["pointerdown", "wheel", "keydown"].forEach(function (e) { box.addEventListener(e, finish, true); });
    skip.addEventListener("click", finish);
    api.cam({ auto: false, yaw: keys[0].yaw, pitch: keys[0].pitch, zoom: keys[0].zoom });
    function step(ts) {
      if (done) return; if (t0 == null) t0 = ts;
      var u = (ts - t0) / DUR; if (u >= 1) return finish();
      var seg = u * (keys.length - 1), k = Math.min(keys.length - 2, Math.floor(seg)), f = ease(seg - k), A = keys[k], B = keys[k + 1];
      api.cam({ yaw: A.yaw + (B.yaw - A.yaw) * f, pitch: A.pitch + (B.pitch - A.pitch) * f, zoom: A.zoom + (B.zoom - A.zoom) * f });
      var near = f > 0.55 ? B.sel : A.sel; if (near !== lastSel) { lastSel = near; api.show(near); }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  document.addEventListener("s3d:ready", function (e) { var b = e.target; if (b && b.closest && b.closest(".cov3d")) fly(b); });
})();
