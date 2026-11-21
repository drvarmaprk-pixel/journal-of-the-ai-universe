/* Ask the Journal widget. No question is written to localStorage or the console. */
(function () {
  var root = document.getElementById("rkv-ask-root");
  if (!root) return;
  var cfg = {};
  try {
    var raw = document.getElementById("rkv-ask");
    if (raw) cfg = JSON.parse(raw.textContent || "{}");
  } catch (e) { cfg = {}; }
  var btn = document.getElementById("rkv-ask-btn");
  var panel = document.getElementById("rkv-ask-panel");
  var close = document.getElementById("rkv-ask-close");
  var form = document.getElementById("rkv-ask-form");
  var input = document.getElementById("rkv-ask-q");
  var log = document.getElementById("rkv-ask-log");
  var priv = document.getElementById("rkv-ask-priv");
  var send = form ? form.querySelector(".rkv-ask-send") : null;
  if (priv) priv.textContent = cfg.privacy || "";
  document.body.classList.add("rkv-ask-on");

  function openPanel() {
    if (!panel) return;
    panel.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    document.body.classList.add("rkv-ask-open");
    if (input) input.focus();
  }
  function closePanel() {
    if (!panel) return;
    panel.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("rkv-ask-open");
    if (btn) btn.focus();
  }
  function addMsg(role, text) {
    var el = document.createElement("div");
    el.className = "rkv-ask-m " + role;
    el.textContent = text;
    // Turn bare journal URLs into links, without interpreting other HTML.
    el.innerHTML = el.textContent.replace(
      /(https:\/\/aiuniversejournal\.org\/[^\s<]+)/g,
      '<a href="$1">$1</a>'
    );
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }

  if (btn) btn.addEventListener("click", function () {
    if (panel && panel.hidden) openPanel(); else closePanel();
  });
  if (close) close.addEventListener("click", closePanel);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel && !panel.hidden) closePanel();
  });

  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = (input && input.value || "").trim();
    if (!q) return;
    input.value = "";
    addMsg("user", q);
    if (send) send.disabled = true;
    var endpoint = cfg.endpoint || "/ask";
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: q })
    }).then(function (r) {
      return r.json().then(function (data) {
        return { ok: r.ok, status: r.status, data: data };
      }).catch(function () {
        return { ok: r.ok, status: r.status, data: {} };
      });
    }).then(function (res) {
      var msg;
      if (res.status === 429) msg = (res.data && res.data.answer) || "The journal’s daily question limit has been reached. Please try again tomorrow, or use search and the categories.";
      else if (!res.ok) msg = (res.data && res.data.answer) || "The assistant is unavailable just now. Please try the journal’s search or categories.";
      else msg = (res.data && res.data.answer) || (cfg.idk || "I don't know — try the journal's search or categories.");
      addMsg("bot", msg);
    }).catch(function () {
      addMsg("bot", "The assistant is unavailable just now. Please try the journal’s search or categories.");
    }).then(function () {
      if (send) send.disabled = false;
      if (input) input.focus();
    });
  });
})();
