/* Swipe mode for the Journal of the AI Universe (no libraries). Alternative stacked-cards effect (Swiper-like):
   the top card slides and rotates aside, revealing the next cards stacked underneath with their edges visible.
   Selectable with RKV_SWIPE_STYLE=cards; the default from 2026-11-17 stays swipe-fade until RK chooses.
   16 Nov keeps swipe.js (vertical flip). Same features otherwise (gestures, keys, buttons, bookmarks, My categories).
   No tracking, no analytics, no network requests. */
(function () {
  var d = document, R = d.documentElement, W = window, id0 = location.hash.slice(1);
  R.classList.add('js');
  try { history.scrollRestoration = 'manual'; } catch (e) {}
  var deck = d.getElementById('deck'); if (!deck) return;
  var all = [].slice.call(deck.querySelectorAll('.sc')), vis = all, cur = -1;
  var ctr = d.getElementById('sctr'), prog = d.getElementById('sprog'), prev = d.getElementById('sprev'), next = d.getElementById('snext');
  var reduce = W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function get(k, s) { try { var v = (s || localStorage).getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function put(k, v, s) { try { (s || localStorage).setItem(k, JSON.stringify(v)); } catch (e) {} }
  function h(s) { var x = 5381; for (var i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0; return (x >>> 0).toString(36); }
  function txt(el, sel) { var e = el.querySelector(sel); return e ? e.textContent.trim() : ''; }
  function link(c) { var a = c.querySelector('.sread'); return a ? a.href : ''; }
  function toast(m) {
    var t = d.getElementById('stoast');
    if (!t) { t = d.createElement('p'); t.id = 'stoast'; t.className = 'stoast'; t.setAttribute('role', 'status'); d.body.appendChild(t); }
    t.textContent = m; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(function () { t.hidden = true; }, 1800);
  }

  /* ---- stacked cards (Swiper-like): top card throws aside, next 3 peek behind */
  var fading = false, fadeMs = reduce ? 180 : 450, viewed = 0;
  var tx = 0, ty = -1, drag = 0, PEEK = 3, OFF = 18, ROT = 2, FLY = 28;
  function panel(c) { return (c && c.querySelector('.sin')) || c; }
  function update(force) {
    var i = cur, n = vis.length;
    if (i < 0) i = 0;
    ctr.textContent = (n ? (i + 1) : 0) + ' / ' + n;
    prog.style.width = (n > 1 ? (i / (n - 1)) * 100 : 100) + '%';
    prev.disabled = i <= 0; next.disabled = i >= n - 1;
    var id = vis[i] && vis[i].id;
    if (id && location.hash !== '#' + id) try { history.replaceState(null, '', '#' + id); } catch (e) {}
  }
  function styleCard(el, c, settling) {
    var sin = panel(el), abs = Math.abs(c);
    var showFly = fading || Math.abs(drag) > 0.001 || settling;
    var live = c < PEEK + 0.55 && (c >= -0.02 || (showFly && c > -1.05));
    if (!live) {
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
      el.classList.remove('is-current', 'is-peek');
      sin.style.transition = 'none';
      return;
    }
    el.style.visibility = 'visible';
    var ox = 0, oy = 0, rot = 0, scale = 1, z = -100 * abs;
    if (c >= 0) {
      ox = OFF * c;
      oy = OFF * 1.15 * c;
      rot = ROT * c;
      scale = 1 - 0.03 * c;
    } else {
      var p = -c, w = deck.clientWidth || 400, h = deck.clientHeight || 800;
      var ax = tx || 0, ay = ty || -1;
      if (!ax && !ay) ay = -1;
      ox = ax * p * w * 0.95;
      oy = ay * p * h * 0.9;
      rot = (ax ? -ax : ay) * p * FLY;
      scale = 1 - 0.08 * p;
      if (c > -1 && !reduce) {
        var e = Math.pow(1 - Math.abs((abs - 0.5) / 0.5), 0.5);
        rot += -FLY * c * e * 0.35;
        scale -= 0.06 * e;
      }
    }
    if (reduce) { rot = 0; scale = 1; if (c < 0) { ox *= 0.25; oy *= 0.25; } }
    el.style.zIndex = String(400 - Math.round(c * 20));
    el.style.pointerEvents = (Math.abs(c) < 0.02) ? 'auto' : 'none';
    el.classList.toggle('is-current', Math.abs(c) < 0.02);
    el.classList.toggle('is-peek', c > 0.05 && c < PEEK + 0.05);
    sin.style.transform = 'translate3d(' + ox.toFixed(1) + 'px,' + oy.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateZ(' + rot.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
  }
  function apply(d, animate) {
    var ms = animate ? fadeMs : 0;
    var ease = 'transform ' + ms + 'ms cubic-bezier(0.22, 1, 0.36, 1)';
    all.forEach(function (el) {
      var i = vis.indexOf(el);
      var sin = panel(el);
      if (i < 0) {
        el.style.visibility = 'hidden';
        el.style.pointerEvents = 'none';
        el.classList.remove('is-current', 'is-peek');
        return;
      }
      sin.style.transition = ms ? ease : 'none';
      styleCard(el, i - cur - d, animate);
    });
  }
  function go(i, instant) {
    if (!vis.length) return;
    i = Math.max(0, Math.min(vis.length - 1, i));
    if (i === cur && cur >= 0 && !instant) return;
    if (fading && !instant) return;
    if (Math.abs(i - cur) > 3) instant = true;   // long jumps (deep links, category chips) are instant
    var from = cur >= 0 ? vis[cur] : null, to = vis[i], dir = i - cur;
    if (!to) { update(true); return; }
    if (!tx && !ty) { tx = 0; ty = dir > 0 ? -1 : 1; }
    if (instant || !from || from === to || cur < 0) {
      cur = i;
      fading = false;
      apply(0, false);
      update(true);
      return;
    }
    if (dir < 0) {
      var incoming = vis[i], sin = panel(incoming);
      sin.style.transition = 'none';
      styleCard(incoming, -1, false);
      incoming.offsetHeight;
    }
    cur = i;
    fading = true;
    apply(0, true);
    bumpView();
    update(true);
    var token = ++go.tok || (go.tok = 1);
    setTimeout(function () {
      if (token !== go.tok) return;
      fading = false;
      tx = 0; ty = 0; drag = 0;
      apply(0, false);
    }, fadeMs);
  }
  prev.addEventListener('click', function () { go(cur - 1); });
  next.addEventListener('click', function () { go(cur + 1); });

  /* ---- keyboard */
  d.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var open = d.querySelector('.spanel:not([hidden])');
    if (e.key === 'Escape') { if (open) closePanel(open); else location.href = d.querySelector('.sclose').href; return; }
    if (open || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
    var k = e.key;
    if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); go(cur + 1); }
    else if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); go(cur - 1); }
    else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(vis.length - 1); }
  });

  /* ---- swipe: up or left = next, down or right = previous; the top card follows the finger */
  var sx = 0, sy = 0, st = 0, tracking = false, axis = '', md = false;
  function startSwipe(x, y, ignore) {
    sx = x; sy = y; st = ignore ? 0 : Date.now(); tracking = !ignore; axis = ''; drag = 0;
  }
  function progressFrom(dx, dy) {
    if (!axis) {
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return 0;
      axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    }
    var w = deck.clientWidth || 400, h = deck.clientHeight || 800, p;
    if (axis === 'x') { tx = dx < 0 ? -1 : 1; ty = 0; p = -dx / (w * 0.55); }
    else { tx = 0; ty = dy < 0 ? -1 : 1; p = -dy / (h * 0.4); }
    if ((cur <= 0 && p < 0) || (cur >= vis.length - 1 && p > 0)) p *= 0.22;
    return Math.max(-1, Math.min(1, p));
  }
  function moveSwipe(x, y) {
    if (!tracking || !st || fading) return 0;
    var p = progressFrom(x - sx, y - sy);
    drag = p;
    apply(p, false);
    return p;
  }
  function endSwipe(x, y) {
    if (!st) { tracking = false; return; }
    var dx = x - sx, dy = y - sy, adx = Math.abs(dx), ady = Math.abs(dy);
    var dt = Math.max(1, Date.now() - st);
    var p = progressFrom(dx, dy);
    st = 0; tracking = false; md = false;
    var flick = (axis === 'x' ? adx : ady) / dt > 0.45;
    var enough = Math.abs(p) > 0.28 || (flick && Math.abs(p) > 0.12);
    if (!enough) { drag = 0; apply(0, true); return; }
    var next = p > 0 ? 1 : -1;
    drag = 0;
    go(cur + next);
  }
  deck.addEventListener('touchstart', function (e) { var t = e.touches[0]; startSwipe(t.clientX, t.clientY, e.target.closest && e.target.closest('.scats, .spanel, a, button, input')); }, { passive: true });
  deck.addEventListener('touchmove', function (e) {
    if (!tracking || !st) return;
    var t = e.touches[0], adx = Math.abs(t.clientX - sx), ady = Math.abs(t.clientY - sy);
    if (adx > 12 || ady > 12) e.preventDefault();
    moveSwipe(t.clientX, t.clientY);
  }, { passive: false });
  deck.addEventListener('touchend', function (e) { var t = e.changedTouches[0]; endSwipe(t.clientX, t.clientY); }, { passive: true });
  deck.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch' || e.button) return;
    if (e.target.closest && e.target.closest('.scats, .spanel, a, button, input')) return;
    md = true; startSwipe(e.clientX, e.clientY, false);
    try { deck.setPointerCapture(e.pointerId); } catch (err) {}
  });
  deck.addEventListener('pointermove', function (e) {
    if (!md) return;
    moveSwipe(e.clientX, e.clientY);
  });
  deck.addEventListener('pointerup', function (e) { if (!md) return; endSwipe(e.clientX, e.clientY); });
  deck.addEventListener('pointercancel', function () { md = false; st = 0; tracking = false; drag = 0; apply(0, true); });
  var wheelLock = 0;
  deck.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaY) < 8 && Math.abs(e.deltaX) < 8) return;
    e.preventDefault();
    if (fading || Date.now() < wheelLock) return;
    wheelLock = Date.now() + fadeMs + 40;
    tx = 0; ty = (e.deltaY > 0 || e.deltaX > 0) ? -1 : 1;
    go(cur + ((e.deltaY > 0 || e.deltaX > 0) ? 1 : -1));
  }, { passive: false });

  /* ---- in-deck links (#card-N): jump within the deck */
  function show(id, instant) {
    var el = id && d.getElementById(id); if (!el || !el.classList.contains('sc')) return false;
    if (el.hidden) { el.hidden = false; el.classList.add('sforce'); refresh(); }
    var i = vis.indexOf(el); if (i < 0) return false; go(i, instant); return true;
  }
  deck.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#card-"]');
    if (a) { e.preventDefault(); show(a.getAttribute('href').slice(1)); }
  });
  W.addEventListener('hashchange', function () { show(location.hash.slice(1)); });

  /* ---- close: back to the page we came from when that was the parent page */
  var close = d.querySelector('.sclose');
  close.addEventListener('click', function (e) {
    try { var r = new URL(d.referrer); if (r.origin === location.origin && r.pathname === new URL(close.href).pathname && history.length > 1) { e.preventDefault(); history.back(); } } catch (x) {}
  });

  /* ---- theme (same key as the site) */
  var tb = d.getElementById('stheme');
  if (tb) tb.addEventListener('click', function () { var t = R.getAttribute('data-theme') === 'light' ? 'dark' : 'light'; R.setAttribute('data-theme', t); try { localStorage.setItem('theme', t); } catch (e) {} });

  /* ---- panels */
  var opener = null;
  function openPanel(id) { var p = d.getElementById(id); if (!p) return; opener = d.activeElement; if (id === 'sp-saved') renderSaved(); p.hidden = false; var f = p.querySelector('input,button'); if (f) f.focus(); }
  function closePanel(p) { p.hidden = true; if (opener && opener.focus) opener.focus(); }
  d.addEventListener('click', function (e) {
    var o = e.target.closest && e.target.closest('[data-open]'); if (o) { openPanel(o.getAttribute('data-open')); return; }
    var c = e.target.closest && e.target.closest('[data-close]'); if (c) { closePanel(c.closest('.spanel')); return; }
    if (e.target.classList && e.target.classList.contains('spanel')) closePanel(e.target);
  });

  /* ---- My categories (hidden list; default: all shown) */
  var HK = 'rkv-swipe-hide', hide = get(HK) || [];
  var boxes = [].slice.call(d.querySelectorAll('#sp-cats input[type=checkbox]'));
  function refresh() {
    vis = all.filter(function (c) { var n = +c.getAttribute('data-cat'); var off = n && hide.indexOf(n) >= 0 && !c.classList.contains('sforce'); c.hidden = !!off; return !off; });
    [].forEach.call(d.querySelectorAll('.scats li[data-cat]'), function (li) { li.hidden = hide.indexOf(+li.getAttribute('data-cat')) >= 0; });
    var f = d.querySelector('.sfil'); if (f) f.hidden = !hide.length;
    update(true);
  }
  boxes.forEach(function (b) { b.checked = hide.indexOf(+b.value) < 0; });
  function saveHide() { hide = boxes.filter(function (b) { return !b.checked; }).map(function (b) { return +b.value; }); put(HK, hide); all.forEach(function (c) { c.classList.remove('sforce'); }); var top = vis[cur]; refresh(); var i = vis.indexOf(top); if (i >= 0) go(i, true); }
  boxes.forEach(function (b) { b.addEventListener('change', saveHide); });
  var ba = d.getElementById('spc-all'), bn = d.getElementById('spc-none');
  if (ba) ba.addEventListener('click', function () { boxes.forEach(function (b) { b.checked = true; }); saveHide(); });
  if (bn) bn.addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); saveHide(); });

  /* ---- bookmarks */
  var SK = 'rkv-swipe-saved';
  function saved() { return get(SK) || []; }
  function isSaved(u) { return saved().some(function (s) { return s.u === u; }); }
  function paint() {
    [].forEach.call(deck.querySelectorAll('.ssave'), function (b) { var on = isSaved(link(b.closest('.sc'))); b.setAttribute('aria-pressed', on); b.textContent = on ? '★ Saved' : '☆ Save'; });
    var n = saved().length, c = d.getElementById('ssn'); if (c) { c.hidden = !n; c.textContent = n; }
  }
  function renderSaved() {
    var ul = d.getElementById('spsl'), list = saved(); ul.innerHTML = '';
    if (!list.length) { var li = d.createElement('li'); li.className = 'sstn'; li.textContent = 'Nothing saved yet. Tap ☆ Save on any card.'; ul.appendChild(li); return; }
    list.slice().reverse().forEach(function (s) {
      var li = d.createElement('li'), box = d.createElement('span'), a = d.createElement('a'), m = d.createElement('span'), o = d.createElement('a'), x = d.createElement('button');
      box.className = 'sst'; a.href = s.l; a.textContent = s.h; m.className = 'ssm'; m.textContent = (s.c ? s.c + ' · ' : '') + (s.d || '') + ' · ';
      o.href = s.u; o.rel = 'noopener'; o.target = '_blank'; o.textContent = 'Read original ↗'; m.appendChild(o);
      box.appendChild(a); box.appendChild(m); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Remove: ' + s.h);
      x.addEventListener('click', function () { put(SK, saved().filter(function (y) { return y.u !== s.u; })); renderSaved(); paint(); });
      li.appendChild(box); li.appendChild(x); ul.appendChild(li);
    });
  }
  var clr = d.getElementById('sps-clear');
  if (clr) clr.addEventListener('click', function () { put(SK, []); renderSaved(); paint(); });

  /* ---- per-card share + save */
  deck.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.sshare, .ssave'); if (!b) return;
    var c = b.closest('.sc'), hl = txt(c, '.shl'), url = location.origin + location.pathname + '#' + c.id;
    if (b.classList.contains('sshare')) {
      if (navigator.share) navigator.share({ title: hl, text: hl, url: url }).catch(function () {});
      else W.open('https://wa.me/?text=' + encodeURIComponent(hl + ' ' + url), '_blank', 'noopener');
    } else {
      var u = link(c), list = saved();
      if (isSaved(u)) { put(SK, list.filter(function (s) { return s.u !== u; })); toast('Removed from Saved'); }
      else { list.push({ u: u, h: hl, l: url, c: txt(c, '.sno') + ' ' + txt(c, '.snm'), d: txt(c, '.sdt') }); put(SK, list.slice(-300)); toast('Saved on this device'); }
      paint();
    }
  });

  /* ---- New since your last visit (story URLs seen before; the first visit sets the baseline) */
  var NK = 'rkv-swipe-seen', story = all.filter(function (c) { return c.querySelector('.sread[target]'); });
  var base = get('rkv-swipe-base', sessionStorage);
  if (!base) { var s0 = get(NK); base = s0 && s0.h ? s0.h : null; put('rkv-swipe-base', base || [], sessionStorage); }
  var keys = story.map(function (c) { return h(link(c)); });
  if (base && base.length) {
    var set = {}; base.forEach(function (k) { set[k] = 1; }); var fresh = 0;
    story.forEach(function (c, i) { if (!set[keys[i]]) { fresh++; var m = c.querySelector('.snew'); if (m) m.hidden = false; c.classList.add('isnew'); } });
    var nc = d.querySelector('.snewc'); if (nc && fresh) { nc.hidden = false; nc.textContent = ' · ' + fresh + ' new since your last visit'; }
  }
  var prevSeen = (get(NK) || {}).h || [], seenSet = {}, merged = [];
  keys.concat(prevSeen).forEach(function (k) { if (!seenSet[k]) { seenSet[k] = 1; merged.push(k); } });
  put(NK, { at: Date.now(), h: merged.slice(0, 5000) });

  /* ---- offline reading + a gentle, one-time "Add to home screen" offer */
  var me = d.querySelector('script[src*="assets/js/swipe"]'), ROOT = me ? me.src.replace(/assets\/js\/swipe[^/]*$/, '') : '/';
  if ('serviceWorker' in navigator && W.isSecureContext) W.addEventListener('load', function () { navigator.serviceWorker.register(ROOT + 'sw.js').catch(function () {}); });
  var AK = 'rkv-a2hs-asked', defer = null;
  function offer() {
    if (!defer || get(AK) || d.getElementById('sa2hs')) return;
    put(AK, Date.now());   // shown once only, whatever the answer
    var bx = d.createElement('div'); bx.id = 'sa2hs'; bx.className = 'sa2hs'; bx.setAttribute('role', 'dialog'); bx.setAttribute('aria-label', 'Install the app');
    bx.innerHTML = '<p><b>Read offline?</b> Add the Journal of the AI Universe to your home screen.</p><p class="spa"><button type="button" class="btn bsm" id="sa2y">Add to home screen</button><button type="button" class="btn bsm ghost" id="sa2n">Not now</button></p>';
    d.body.appendChild(bx);
    d.getElementById('sa2y').addEventListener('click', function () { bx.remove(); defer.prompt(); defer = null; });
    d.getElementById('sa2n').addEventListener('click', function () { bx.remove(); });
  }
  W.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); defer = e; });
  W.addEventListener('appinstalled', function () { put(AK, Date.now()); var bx = d.getElementById('sa2hs'); if (bx) bx.remove(); });
  function bumpView() { if (++viewed === 8) setTimeout(offer, 1500); }
  W.addEventListener('offline', function () { toast('Offline: reading the saved copy'); });

  /* ---- start */
  refresh(); paint();
  if (!(id0 && show(id0, true))) go(0, true);
  deck.focus({ preventScroll: true });
})();
