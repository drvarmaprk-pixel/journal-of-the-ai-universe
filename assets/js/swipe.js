/* Swipe mode for the Journal of the AI Universe (no libraries). Vertical flip (CSS scroll-snap), horizontal swipe, arrow keys and
   on-screen buttons; #card-N deep links; share (Web Share API, WhatsApp share-URL fallback); bookmarks, "My categories" and
   "New since your last visit" are kept on this device only (localStorage). No tracking, no analytics, no network requests. */
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

  /* ---- position, counter, progress, hash */
  function at() {   // index of the visible card at the top of the deck
    var y = deck.scrollTop + deck.clientHeight * 0.35, lo = 0, hi = vis.length - 1;
    while (lo < hi) { var m = (lo + hi + 1) >> 1; if (vis[m].offsetTop <= y) lo = m; else hi = m - 1; }
    return lo;
  }
  function update(force) {
    var i = at(); if (i === cur && !force) return; cur = i;
    var n = vis.length; ctr.textContent = (i + 1) + ' / ' + n;
    prog.style.width = (n > 1 ? (i / (n - 1)) * 100 : 100) + '%';
    prev.disabled = i <= 0; next.disabled = i >= n - 1;
    var id = vis[i] && vis[i].id;
    if (id && location.hash !== '#' + id) try { history.replaceState(null, '', '#' + id); } catch (e) {}
  }
  function go(i, instant) {
    i = Math.max(0, Math.min(vis.length - 1, i));
    if (Math.abs(i - cur) > 3) instant = true;   // long jumps (deep links, category chips) are instant
    deck.scrollTo({ top: vis[i].offsetTop, behavior: instant || reduce ? 'instant' : 'smooth' });
    if (instant) {   // settle on the exact position once late images/fonts have changed card heights
      var el = vis[i], f = 0;
      (function fix() { if (Math.abs(deck.scrollTop - el.offsetTop) > 2) deck.scrollTop = el.offsetTop; if (++f < 6) requestAnimationFrame(fix); else update(true); })();
    }
  }
  var raf = 0;
  deck.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; update(); }); }, { passive: true });
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

  /* ---- horizontal swipe as a secondary gesture (left = next, right = previous) */
  var sx = 0, sy = 0, st = 0;
  deck.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = (e.target.closest && e.target.closest('.scats')) ? 0 : Date.now(); }, { passive: true });
  deck.addEventListener('touchend', function (e) {
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (st && Math.abs(dx) > 60 && Math.abs(dx) > 1.6 * Math.abs(dy) && Date.now() - st < 800) go(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });

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
  var me = d.querySelector('script[src*="assets/js/swipe.js"]'), ROOT = me ? me.src.replace(/assets\/js\/swipe\.js.*$/, '') : '/';
  if ('serviceWorker' in navigator && W.isSecureContext) W.addEventListener('load', function () { navigator.serviceWorker.register(ROOT + 'sw.js').catch(function () {}); });
  var AK = 'rkv-a2hs-asked', defer = null, viewed = 0;
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
  deck.addEventListener('scroll', function () { if (++viewed === 40) setTimeout(offer, 1500); }, { passive: true });   // only after some reading
  W.addEventListener('offline', function () { toast('Offline: reading the saved copy'); });

  /* ---- start */
  refresh(); paint();
  if (!(id0 && show(id0, true))) update(true);
  deck.focus({ preventScroll: true });
})();
