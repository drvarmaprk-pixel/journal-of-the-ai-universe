/* Journal of the AI Universe: reader features (progress bar, share, follow, feedback, cite, search, language tabs, offline app).
   Vanilla JS, no dependencies, no tracking. Choices are kept in localStorage only. */
(function () {
  "use strict";
  var d = document;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  var CFG = {}; try { CFG = JSON.parse(d.getElementById("rkv-cfg").textContent); } catch (e) {}
  var me = d.querySelector('script[src*="assets/js/features.js"]');
  var ROOT = me ? me.src.replace(/assets\/js\/features\.js.*$/, "") : "/";
  function $$(s, el) { return Array.prototype.slice.call((el || d).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); }

  /* ---- reading progress bar (long pages only) ---- */
  var bar = d.querySelector(".rprog"), barIn = bar && bar.firstElementChild, ticking = false;
  function prog() {
    ticking = false; if (!bar) return;
    var h = d.documentElement, max = h.scrollHeight - innerHeight, long = h.scrollHeight > innerHeight * 2.5;
    bar.classList.toggle("on", long);
    if (long) barIn.style.transform = "scaleX(" + Math.min(1, Math.max(0, (scrollY || h.scrollTop) / (max || 1))) + ")";
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(prog); } }
  addEventListener("scroll", req, {passive: true}); addEventListener("resize", req); addEventListener("load", req); req();

  /* ---- toast + clipboard ---- */
  var tst;
  function toast(msg) {
    if (!tst) { tst = d.createElement("div"); tst.className = "ftoast"; tst.setAttribute("role", "status"); d.body.appendChild(tst); }
    tst.textContent = msg; tst.classList.add("on"); clearTimeout(tst._t); tst._t = setTimeout(function () { tst.classList.remove("on"); }, 2200);
  }
  function copy(text, ok) {
    function fb() { var t = d.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      d.body.appendChild(t); t.select(); try { d.execCommand("copy"); toast(ok); } catch (e) { toast("Copy failed: please copy by hand"); } d.body.removeChild(t); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { toast(ok); }, fb); else fb();
  }

  /* ---- share ---- */
  var canShare = !!navigator.share;
  $$(".shbar .native").forEach(function (b) { if (canShare) b.hidden = false; });
  function links(u, t) {
    var eu = encodeURIComponent(u), et = encodeURIComponent(t);
    return '<a class="sh" href="https://wa.me/?text=' + et + "%20" + eu + '" rel="noopener" target="_blank">WhatsApp</a>' +
      '<a class="sh" href="https://www.linkedin.com/sharing/share-offsite/?url=' + eu + '" rel="noopener" target="_blank">LinkedIn</a>' +
      '<a class="sh" href="https://x.com/intent/post?text=' + et + "&amp;url=" + eu + '" rel="noopener" target="_blank">X</a>' +
      '<button type="button" class="sh cpy" data-u="' + esc(u) + '">Copy link</button>' + (canShare ? '<button type="button" class="sh native">More…</button>' : "");
  }
  d.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button"); if (!b) return;
    if (b.classList.contains("cpy") && b.dataset.u) { copy(b.dataset.u, "Link copied"); return; }
    if (b.classList.contains("native")) {
      var box = b.closest("[data-u]"); if (box && navigator.share) navigator.share({title: box.dataset.t || d.title, url: box.dataset.u}).catch(function () {});
      return;
    }
    if (b.classList.contains("shr")) {
      var li = b.closest("li"), a = li && li.querySelector("a");
      var su = b.dataset.u || (location.origin + location.pathname + "#" + (li ? li.id : "")), st = b.dataset.t || (a ? a.textContent : d.title);
      var coarse = matchMedia("(pointer:coarse)").matches;
      if (canShare && coarse) { navigator.share({title: st, url: su}).catch(function () {}); return; }
      var pop = b.nextElementSibling && b.nextElementSibling.classList.contains("shpop") ? b.nextElementSibling : null;
      if (!pop) { pop = d.createElement("span"); pop.className = "shpop"; pop.setAttribute("data-u", su); pop.setAttribute("data-t", st);
        pop.innerHTML = links(su, st); pop.hidden = true; b.parentNode.insertBefore(pop, b.nextSibling); }
      pop.hidden = !pop.hidden; b.setAttribute("aria-expanded", String(!pop.hidden));
      if (!pop.hidden) pop.querySelector("a").focus();
      return;
    }
    if (b.dataset.copy) { var el = d.querySelector(b.dataset.copy); if (el) copy(el.textContent.replace(/\s+/g, " ").trim(), "Citation copied"); return; }
  });
  d.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var p = e.target.closest && e.target.closest(".shpop");
    if (p) { p.hidden = true; var b = p.previousElementSibling; if (b) { b.setAttribute("aria-expanded", "false"); b.focus(); } }
  });

  /* ---- cite: today's date for "cited" ---- */
  var M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], now = new Date();
  $$(".cdate").forEach(function (s) { s.textContent = now.getFullYear() + " " + M[now.getMonth()] + " " + now.getDate(); });

  /* ---- follow a category ---- */
  var FK = "rkv-follow";
  function getF() { try { var a = JSON.parse(ls(FK) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function setF(a) { ls(FK, JSON.stringify(a)); paint(); renderHome(); }
  function paint() {
    var f = getF();
    $$("button.follow").forEach(function (b) {
      var on = f.indexOf(b.dataset.p) >= 0;
      b.setAttribute("aria-pressed", String(on)); b.classList.toggle("on", on);
      b.querySelector(".fi").textContent = on ? "★" : "☆"; b.querySelector(".flab").textContent = on ? "Following" : "Follow";
    });
  }
  d.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button.follow, button.unf"); if (!b) return;
    var f = getF(), p = b.dataset.p, i = f.indexOf(p);
    if (b.classList.contains("unf") || i >= 0) { if (i >= 0) f.splice(i, 1); toast("Unfollowed"); } else { f.push(p); f.sort(); toast("Following: it will appear first on the home page"); }
    setF(f);
  });
  var home = d.getElementById("following"), homeData = null;
  function renderHome() {
    if (!home) return;
    var f = getF();
    if (!f.length) { home.hidden = true; return; }
    function draw(data) {
      var h = f.filter(function (p) { return data.p[p]; }).map(function (p) {
        var x = data.p[p];
        return '<div class="fitem"><h3><a href="' + ROOT + x.u + '">' + esc(p + " " + x.n) + '</a></h3><p>' + esc(x.lead) + "</p><ul>" +
          x.i.map(function (i) { return '<li><a href="' + ROOT + i[1] + '">' + esc(i[0]) + "</a></li>"; }).join("") +
          '</ul><button type="button" class="unf btn small ghost" data-p="' + p + '">Unfollow<span class="vh"> ' + esc(x.n) + "</span></button></div>";
      }).join("");
      home.querySelector(".flist").innerHTML = '<p class="small">Latest: ' + esc(data.nice) + "</p>" + h; home.hidden = false;
    }
    if (homeData) return draw(homeData);
    fetch(ROOT + home.dataset.src).then(function (r) { return r.json(); }).then(function (j) { homeData = j; draw(j); }).catch(function () {});
  }
  paint(); renderHome();

  /* ---- feedback: saved locally; optional anonymous endpoint (site_config.FEEDBACK_ENDPOINT) ---- */
  function fbShow(box, v, fresh) {
    $$(".fbb", box).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === v)); });
    var more = CFG.em ? ' <a href="mailto:' + esc(CFG.em) + "?subject=" + encodeURIComponent("Feedback: " + box.dataset.k) + '">Tell us more by email</a>.'
      : (CFG.wa ? ' <a href="' + esc(CFG.wa) + '" rel="noopener" target="_blank">Tell us more in the WhatsApp group</a>.' : "");
    box.querySelector(".fbt").innerHTML = (fresh ? "Thank you for your feedback." : "You answered " + (v === "yes" ? "Yes" : "No") + ".") + more;
  }
  $$(".fb").forEach(function (box) { var v = ls("rkv-fb:" + box.dataset.k); if (v) fbShow(box, v, false); });
  d.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".fbb"); if (!b) return;
    var box = b.closest(".fb"), k = box.dataset.k, v = b.dataset.v, old = ls("rkv-fb:" + k);
    ls("rkv-fb:" + k, v); fbShow(box, v, true);
    if (CFG.fb && old !== v && navigator.sendBeacon) { try { navigator.sendBeacon(CFG.fb, new Blob([JSON.stringify({k: k, v: v})], {type: "text/plain"})); } catch (err) {} }
  });

  /* ---- language tabs ---- */
  $$(".ltabs").forEach(function (tl) {
    var tabs = $$('[role="tab"]', tl);
    function sel(t, focus) {
      tabs.forEach(function (x) { var on = x === t; x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1;
        d.getElementById(x.getAttribute("aria-controls")).hidden = !on; });
      if (focus) t.focus(); ls("rkv-lang", t.dataset.lang);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { sel(t); });
      t.addEventListener("keydown", function (e) {
        var k = {ArrowRight: 1, ArrowLeft: -1, Home: -99, End: 99}[e.key]; if (!k) return; e.preventDefault();
        var j = k === -99 ? 0 : k === 99 ? tabs.length - 1 : (i + k + tabs.length) % tabs.length; sel(tabs[j], true);
      });
    });
    var pref = ls("rkv-lang"), p = tabs.filter(function (t) { return t.dataset.lang === pref; })[0];
    if (p) sel(p);
  });

  /* ---- search page ---- */
  var form = d.getElementById("sform");
  if (form) {
    var q = d.getElementById("sq"), res = d.getElementById("sres"), cnt = d.getElementById("scount"), kinds = d.getElementById("skinds");
    var IDX = null, kind = "", shown = 50, KORDER = ["Story", "Issue", "Project", "R&D", "Company", "Topic", "Event", "Weekly", "Page"];
    var fold = function (s) { return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };
    var KW = {Project: 6, Topic: 5, Company: 5, Issue: 3, Weekly: 3, "R&D": 2, Page: 2, Story: 1, Event: 0};
    function load() {
      if (IDX) return Promise.resolve(IDX);
      cnt.textContent = "Loading the search index…";
      return fetch(ROOT + "assets/data/search-index.json").then(function (r) { return r.json(); }).then(function (j) {
        IDX = j.r.map(function (r) { return {k: r[0], t: r[1], u: r[2], x: r[3], d: r[4], ft: fold(r[1]), fx: fold(r[3])}; }); return IDX;
      });
    }
    function mark(s, terms) {
      var h = esc(s);
      terms.forEach(function (t) { if (t.length < 2) return; h = h.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"); });
      return h;
    }
    function run(push) {
      var raw = q.value.trim(); if (push) { var u = new URL(location.href); if (raw) u.searchParams.set("q", raw); else u.searchParams.delete("q"); history.replaceState(null, "", u); }
      if (!raw) { res.innerHTML = ""; cnt.textContent = ""; kinds.innerHTML = ""; return; }
      load().then(function (I) {
        var terms = fold(raw).split(/\s+/).filter(Boolean), phrase = fold(raw);
        var hits = [];
        I.forEach(function (r) {
          var s = 0;
          for (var i = 0; i < terms.length; i++) {
            var t = terms[i], re = new RegExp("(^|[^a-z0-9])" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
            var inT = re.test(r.ft), inX = re.test(r.fx);
            if (!inT && !inX) return;
            s += inT ? 4 : 1;
          }
          if (r.ft.indexOf(phrase) >= 0) s += 6;
          s += KW[r.k] || 0;
          hits.push({r: r, s: s});
        });
        hits.sort(function (a, b) { return b.s - a.s || (b.r.d > a.r.d ? 1 : b.r.d < a.r.d ? -1 : 0); });
        var by = {}; hits.forEach(function (h) { by[h.r.k] = (by[h.r.k] || 0) + 1; });
        kinds.innerHTML = '<button type="button" class="chip" data-k="" aria-pressed="' + (kind === "") + '">All (' + hits.length + ")</button>" +
          KORDER.filter(function (k) { return by[k]; }).map(function (k) { return '<button type="button" class="chip" data-k="' + esc(k) + '" aria-pressed="' + (kind === k) + '">' + esc(k) + " (" + by[k] + ")</button>"; }).join("");
        var list = hits.filter(function (h) { return !kind || h.r.k === kind; });
        cnt.textContent = list.length ? list.length + " result" + (list.length === 1 ? "" : "s") + " for “" + raw + "”" : "No results for “" + raw + "”. Try fewer or different words.";
        res.innerHTML = list.slice(0, shown).map(function (h) {
          var r = h.r;
          return '<li><p class="sk">' + esc(r.k) + (r.d ? " · " + esc(r.d) : "") + '</p><a href="' + ROOT + r.u + '">' + mark(r.t, terms) + "</a>" + (r.x ? "<p>" + mark(r.x, terms) + "</p>" : "") + "</li>";
        }).join("") + (list.length > shown ? '<li class="smore"><button type="button" class="btn small ghost" id="smore">Show more results</button></li>' : "");
      }).catch(function () { cnt.textContent = "The search index could not be loaded. Please try again."; });
    }
    var tmr;
    form.addEventListener("submit", function (e) { e.preventDefault(); shown = 50; run(true); });
    q.addEventListener("input", function () { clearTimeout(tmr); tmr = setTimeout(function () { shown = 50; run(true); }, 220); });
    kinds.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; kind = b.dataset.k; shown = 50; run(false); });
    res.addEventListener("click", function (e) { if (e.target.id === "smore") { shown += 50; run(false); } });
    var q0 = new URL(location.href).searchParams.get("q"); if (q0) { q.value = q0; run(false); }
  }

  /* ---- offline app ---- */
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    addEventListener("load", function () { navigator.serviceWorker.register(ROOT + "sw.js").catch(function () {}); });
  }
})();
/* ---- batch 2: text size, expand/collapse, 'New today' expiry, save for later, audio speed ---- */
(function () {
  "use strict";
  var d = document;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function $$(s, el) { return Array.prototype.slice.call((el || d).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); }
  var me = d.querySelector('script[src*="assets/js/features.js"]'), ROOT = me ? me.src.replace(/assets\/js\/features\.js.*$/, "") : "/";
  /* text size */
  var STEPS = [0.9, 1, 1.12, 1.25, 1.4];
  function curTs() { var v = parseFloat(ls("rkv-ts")) || 1, i = STEPS.indexOf(v); return i < 0 ? 1 : i; }
  function applyTs(i) {
    var v = STEPS[i]; d.documentElement.style.setProperty("--ts", v); if (v === 1) ls("rkv-ts", null); else ls("rkv-ts", String(v));
    $$('.tsize [data-ts="-"]').forEach(function (b) { b.disabled = i === 0; });
    $$('.tsize [data-ts="+"]').forEach(function (b) { b.disabled = i === STEPS.length - 1; });
    $$('.tsize [data-ts="0"]').forEach(function (b) { b.setAttribute("aria-pressed", String(v === 1)); });
  }
  applyTs(curTs());
  d.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".tsize button"); if (!b) return;
    var i = curTs(); i = b.dataset.ts === "+" ? Math.min(STEPS.length - 1, i + 1) : b.dataset.ts === "-" ? Math.max(0, i - 1) : 1; applyTs(i);
  });
  /* expand / collapse category sections (issue pages) */
  function setCol(a, open) {
    a.classList.toggle("collapsed", !open);
    var b = a.querySelector(".colb"); if (!b) return;
    b.setAttribute("aria-expanded", String(open)); b.firstChild.textContent = open ? "Collapse" : "Expand";
  }
  d.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".colb, [data-col]"); if (!b) return;
    if (b.classList.contains("colb")) { var a = b.closest(".brief"); setCol(a, a.classList.contains("collapsed")); return; }
    $$(".brief").forEach(function (a) { setCol(a, b.dataset.col === "open"); });
  });
  function openFor(hash) {
    if (!hash || hash.length < 2) return;
    var t; try { t = d.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { t = null; }
    var a = t && (t.classList.contains("brief") ? t : t.closest(".brief"));
    if (a && a.classList.contains("collapsed")) setCol(a, true);
  }
  d.addEventListener("click", function (e) {   /* before the browser jumps: open the target section (Contents jumps, story links) */
    var l = e.target.closest && e.target.closest('a[href*="#"]'); if (!l) return;
    if (l.pathname === location.pathname && l.hash) openFor(l.hash);
  }, true);
  addEventListener("hashchange", function () { openFor(location.hash); });
  openFor(location.hash);
  /* 'New today' markers disappear 24 h after publication */
  var now = Date.now();
  $$(".newb[data-pub]").forEach(function (s) { var t = Date.parse(s.dataset.pub); if (t && now - t > 864e5) s.hidden = true; });
  /* save for later */
  var SK = "rkv-saved";
  function getS() { try { var a = JSON.parse(ls(SK) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function urlOf(b) { var li = b.closest("li"); return b.dataset.u || (location.origin + location.pathname + "#" + (li ? li.id : "")); }
  function paintS() {
    var urls = getS().map(function (x) { return x.u; });
    $$(".savb").forEach(function (b) { var on = urls.indexOf(urlOf(b)) >= 0; b.setAttribute("aria-pressed", String(on)); b.classList.toggle("on", on); b.querySelector(".savl").textContent = on ? "Saved" : "Save"; });
  }
  d.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".savb"); if (!b) return;
    var s = getS(), u = urlOf(b), i = -1;
    s.forEach(function (x, k) { if (x.u === u) i = k; });
    if (i >= 0) s.splice(i, 1);
    else { var li = b.closest("li"), a = li && li.querySelector("a"); s.unshift({u: u, t: a ? a.textContent.trim() : d.title, p: b.dataset.p || "", d: b.dataset.d || "", src: a ? a.href : ""}); }
    ls(SK, JSON.stringify(s.slice(0, 300))); paintS(); renderSaved();
  });
  var list = d.getElementById("savedlist");
  function renderSaved() {
    if (!list) return;
    var s = getS();
    list.innerHTML = s.map(function (x, k) {
      return '<li><p class="tst"><a href="' + esc(x.u) + '">' + esc(x.t) + '</a></p><p class="imeta">' + esc(x.d) + (x.p ? " · " + esc(x.p) : "") +
        (x.src ? ' · <a href="' + esc(x.src) + '" rel="noopener" target="_blank">Source</a>' : "") +
        ' <button type="button" class="sh unsave" data-k="' + k + '">Remove<span class="vh"> ' + esc(x.t) + "</span></button></p></li>";
    }).join("");
    d.getElementById("savednone").hidden = s.length > 0; d.getElementById("savedclear").hidden = !s.length;
  }
  if (list) {
    list.addEventListener("click", function (e) { var b = e.target.closest(".unsave"); if (!b) return; var s = getS(); s.splice(+b.dataset.k, 1); ls(SK, JSON.stringify(s)); renderSaved(); });
    d.getElementById("savedclear").addEventListener("click", function () { ls(SK, null); renderSaved(); });
  }
  paintS(); renderSaved();
  /* audio playback speed */
  $$(".aspeed").forEach(function (g) {
    var au = g.closest(".listen").querySelector("audio");
    g.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !au) return;
      au.playbackRate = +b.dataset.r; $$("button", g).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    });
  });
})();
/* ---- reader toolbar panels ---- */
(function () {
  "use strict";
  var d = document;
  function close(except) {
    Array.prototype.forEach.call(d.querySelectorAll('.rb[aria-expanded="true"]'), function (b) {
      if (b === except) return; b.setAttribute("aria-expanded", "false"); var p = d.getElementById(b.getAttribute("aria-controls")); if (p) p.hidden = true;
    });
  }
  d.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".rb[aria-controls]");
    if (b) { var p = d.getElementById(b.getAttribute("aria-controls")), open = b.getAttribute("aria-expanded") !== "true";
      close(b); b.setAttribute("aria-expanded", String(open)); p.hidden = !open;
      if (open) { var f = p.querySelector("button:not([hidden]):not(:disabled), a, audio"); if (f && !matchMedia("(pointer:coarse)").matches) f.focus(); }
      return; }
    var t = e.target.closest && e.target.closest(".thm"); if (t) { var tb = d.getElementById("themebtn"); if (tb) tb.click(); return; }
    if (!(e.target.closest && e.target.closest(".rbar"))) close();
  });
  d.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var p = e.target.closest && e.target.closest(".rbar"); if (!p) return;
    var b = p.querySelector('.rb[aria-expanded="true"]'); if (b) { close(); b.focus(); }
  });
  Array.prototype.forEach.call(d.querySelectorAll(".rpanel .native"), function (b) { if (navigator.share) b.hidden = false; });
})();
