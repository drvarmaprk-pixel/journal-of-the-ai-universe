/* Research Papers Today: filters (group, category, evidence, search) and lazy "Show all" from papers.json. Vanilla JS, no tracking. */
(function () {
  var list = document.getElementById('rslist'); if (!list) return;
  var form = document.getElementById('rsf'), g = document.getElementById('rg'), c = document.getElementById('rc'),
      e = document.getElementById('re'), q = document.getElementById('rq'), cnt = document.getElementById('rcount'),
      none = document.getElementById('rsnone'), SHOW = +list.getAttribute('data-show') || 10, data = null, loading = null, expanded = {};
  form.hidden = false;
  [].forEach.call(document.querySelectorAll('.rsmore'), function (b) { b.hidden = false; });
  function load() {
    if (data) return Promise.resolve(data);
    if (!loading) loading = fetch(list.getAttribute('data-src')).then(function (r) { return r.json(); }).then(function (j) { data = j; return j; });
    return loading;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (ch) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[ch]; }); }
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function dt(d) { var p = d.split('-'); return (+p[2]) + ' ' + MON[+p[1] - 1] + ' ' + p[0]; }
  function a(u, t) { return '<a href="' + esc(u) + '" rel="noopener" target="_blank">' + t + '</a>'; }
  function li(r) {
    var ev = r[4], lab = {DOI: 'DOI ', arXiv: 'arXiv:', PMID: 'PMID ', OpenAlex: 'OpenAlex '}[r[5]] || '';
    var id = a(r[7], esc(lab + r[6]));
    if (r[5] === 'DOI' && r[10]) id += ' · ' + a('https://pubmed.ncbi.nlm.nih.gov/' + r[10] + '/', 'PMID ' + esc(r[10]));
    if (r[5] === 'DOI' && r[11]) id += ' · ' + a('https://arxiv.org/abs/' + r[11], 'arXiv:' + esc(r[11]));
    return '<li class="rsp" data-e="' + ev + '"><a class="rst" href="' + esc(r[8]) + '" rel="noopener" target="_blank">' + esc(r[0]) + '</a>' +
      (r[1] ? '<span class="rsa">' + esc(r[1]) + '</span>' : '') +
      '<span class="rsm"><span class="rsv">' + esc(r[2]) + '</span> · <time datetime="' + esc(r[3]) + '">' + dt(r[3]) + '</time> · <span class="rse e' + ev + '">' +
      (ev === 'P' ? 'Peer-reviewed' : 'Preprint') + '</span> · ' + id + (r[9] ? ' · <span class="rsoa">Open access</span>' : '') + '</span></li>';
  }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function filtersOn() { return !!(e.value || q.value.trim()); }
  function render() {
    var gv = g.value, cv = c.value, ev = e.value, words = norm(q.value.trim()).split(/\s+/).filter(Boolean), total = 0;
    [].forEach.call(list.querySelectorAll('.rsgrp'), function (gs) { gs.hidden = !!gv && gs.getAttribute('data-g') !== gv; });
    [].forEach.call(list.querySelectorAll('.rscat'), function (sec) {
      var k = sec.getAttribute('data-c'), ol = sec.querySelector('.rsl'), btn = sec.querySelector('.rsmore');
      var show = (!gv || sec.getAttribute('data-g') === gv) && (!cv || k === cv);
      if (!show) { sec.hidden = true; return; }
      var n = +sec.getAttribute('data-n');
      if (data) {
        var rows = data.cats[k].filter(function (r) {
          if (ev && r[4] !== ev) return false;
          if (!words.length) return true;
          var h = norm(r[0] + ' ' + r[1] + ' ' + r[2] + ' ' + r[6]);
          return words.every(function (w) { return h.indexOf(w) >= 0; });
        });
        var lim = expanded[k] || SHOW;
        ol.innerHTML = rows.slice(0, lim).map(li).join('');
        if (btn) { btn.hidden = rows.length <= lim; btn.textContent = 'Show ' + Math.min(100, rows.length - lim) + ' more of ' + rows.length; }
        n = rows.length;
      }
      sec.hidden = n === 0; total += n;
    });
    [].forEach.call(list.querySelectorAll('.rsgrp'), function (gs) {
      if (!gs.hidden) gs.hidden = !gs.querySelector('.rscat:not([hidden])');
    });
    cnt.textContent = total + (total === 1 ? ' paper' : ' papers');
    none.hidden = total > 0;
    var u = new URLSearchParams(); if (gv) u.set('g', gv); if (cv) u.set('c', cv); if (ev) u.set('e', ev); if (q.value.trim()) u.set('q', q.value.trim());
    var s = u.toString(); history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
  }
  function update() { if (filtersOn() && !data) { cnt.textContent = 'Loading…'; load().then(render, function () { cnt.textContent = 'Could not load the full list.'; }); } else render(); }
  list.addEventListener('click', function (ev) {
    var b = ev.target.closest('.rsmore'); if (!b) return;
    var k = b.getAttribute('data-c');
    b.disabled = true;
    load().then(function () { expanded[k] = (expanded[k] || SHOW) + 100; b.disabled = false; render(); });
  });
  g.addEventListener('change', function () {
    [].forEach.call(c.options, function (o) { o.hidden = !!g.value && !!o.value && o.getAttribute('data-g') !== g.value; });
    if (c.value && c.selectedOptions[0].hidden) c.value = '';
    update();
  });
  c.addEventListener('change', update); e.addEventListener('change', update);
  var t; q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(update, 200); });
  document.getElementById('rclear').addEventListener('click', function () { g.value = c.value = e.value = q.value = '';
    [].forEach.call(c.options, function (o) { o.hidden = false; }); expanded = {}; render(); });
  var p = new URLSearchParams(location.search);
  if (p.get('g')) g.value = p.get('g'); if (p.get('c')) c.value = p.get('c'); if (p.get('e')) e.value = p.get('e'); if (p.get('q')) q.value = p.get('q');
  if (p.toString()) { if (g.value) g.dispatchEvent(new Event('change')); else update(); }
})();
