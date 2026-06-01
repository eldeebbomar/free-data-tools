/* Free Data Tools — widget runtime (no dependencies)
   Each tool page sets window.TOOL before this script loads. */
(function () {
  "use strict";
  var TOOL = window.TOOL || null;

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  function highlightJSON(obj) {
    var json = JSON.stringify(obj, null, 2);
    return esc(json)
      .replace(/(&quot;[^&]*?&quot;)(\s*:)/g, '<span class="k">$1</span>$2')
      .replace(/:\s*(&quot;.*?&quot;)/g, ': <span class="s">$1</span>')
      .replace(/:\s*(-?\d+(?:\.\d+)?)/g, ': <span class="n">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span class="n">$1</span>');
  }

  function collectFields() {
    var out = {};
    $all("[data-key]").forEach(function (inp) {
      var k = inp.getAttribute("data-key");
      var v = inp.value;
      if (v === "" || v == null) return;
      if (inp.getAttribute("data-type") === "number") v = Number(v);
      if (inp.getAttribute("data-type") === "list") v = v.split(",").map(function (x) { return x.trim(); }).filter(Boolean);
      out[k] = v;
    });
    return out;
  }

  function buildInput() {
    var base = {};
    if (TOOL && TOOL.inputTemplate) base = JSON.parse(JSON.stringify(TOOL.inputTemplate));
    var f = collectFields();
    for (var k in f) base[k] = f[k];
    return base;
  }

  function renderJSON() {
    var panel = $("#json-code");
    if (!panel) return;
    var input = buildInput();
    panel.innerHTML = highlightJSON(input);
  }

  function wireCopy() {
    var btn = $("#copy-json");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var txt = JSON.stringify(buildInput(), null, 2);
      navigator.clipboard.writeText(txt).then(function () {
        btn.classList.add("copied"); var o = btn.textContent; btn.textContent = "copied ✓";
        setTimeout(function () { btn.classList.remove("copied"); btn.textContent = o; }, 1600);
      });
    });
  }

  /* ---------- live: Greenhouse hiring snapshot ---------- */
  var SIGNALS = [
    { key: "expanding-sales", words: ["sales", "account executive", "ae,", "revenue", "business development", "bdr", "sdr", "gtm", "go-to-market"] },
    { key: "engineering-build-out", words: ["engineer", "developer", "software", "swe", "backend", "frontend", "infrastructure", "platform", "devops", "sre"] },
    { key: "data-and-ai-push", words: ["data", "machine learning", "ml ", "ai ", "analytics", "scientist"] },
    { key: "marketing-ramp", words: ["marketing", "growth", "demand gen", "content", "brand", "seo"] },
    { key: "exec-hiring", words: ["head of", "vp ", "director", "chief", "lead "] },
    { key: "ops-scale", words: ["operations", "support", "success", "recruit", "people", "finance", "legal"] },
  ];
  function classify(titles) {
    var counts = {};
    SIGNALS.forEach(function (s) { counts[s.key] = 0; });
    titles.forEach(function (t) {
      var lt = " " + t.toLowerCase() + " ";
      SIGNALS.forEach(function (s) { if (s.words.some(function (w) { return lt.indexOf(w) > -1; })) counts[s.key]++; });
    });
    var best = null;
    for (var k in counts) if (best === null || counts[k] > counts[best]) best = k;
    return { signal: best, count: counts[best], all: counts };
  }

  function runGreenhouse() {
    var status = $("#status"), out = $("#results");
    var tokenInp = $("[data-gh-token]");
    var token = (tokenInp && tokenInp.value.trim().toLowerCase()) || "";
    if (!token) { status.innerHTML = '<span class="err">Enter a company board name first (e.g. stripe).</span>'; return; }
    status.innerHTML = '<span class="run">› fetching ' + esc(token) + ' open roles…</span>';
    out.innerHTML = "";
    var url = "https://boards-api.greenhouse.io/v1/boards/" + encodeURIComponent(token) + "/jobs?content=false";
    fetch(url).then(function (r) {
      if (!r.ok) throw new Error(r.status === 404 ? "No public Greenhouse board for '" + token + "'. Try stripe, airbnb, gitlab, figma…" : "HTTP " + r.status);
      return r.json();
    }).then(function (data) {
      var jobs = (data && data.jobs) || [];
      if (!jobs.length) { status.innerHTML = '<span class="err">Board found but no open roles.</span>'; return; }
      var titles = jobs.map(function (j) { return j.title || ""; });
      var locs = {};
      jobs.forEach(function (j) { var l = (j.location && j.location.name) || "—"; locs[l] = (locs[l] || 0) + 1; });
      var topLocs = Object.keys(locs).sort(function (a, b) { return locs[b] - locs[a]; }).slice(0, 3);
      var c = classify(titles);
      status.innerHTML = '<span class="ok">✓ ' + jobs.length + ' open roles · live from Greenhouse</span>';
      var head = el("div", "result-item");
      head.innerHTML = '<div class="rt">' + esc(token) + ' is hiring — <span class="signal-pill">' + esc(c.signal) + '</span></div>' +
        '<div class="rm"><span><b>' + jobs.length + '</b> open roles</span><span>top locations: <b>' + topLocs.map(esc).join("</b>, <b>") + '</b></span></div>';
      out.appendChild(head);
      var ul = el("ul", "result-list");
      jobs.slice(0, 8).forEach(function (j) {
        var li = el("li", "result-item");
        li.innerHTML = '<div class="rt">' + esc(j.title) + '</div><div class="rm"><span>' + esc((j.location && j.location.name) || "—") + '</span><span>updated <b>' + esc((j.updated_at || "").slice(0, 10)) + '</b></span></div>';
        ul.appendChild(li);
      });
      out.appendChild(ul);
      if (jobs.length > 8) { var more = el("div", "term-hint"); more.style.marginTop = "12px"; more.textContent = "+ " + (jobs.length - 8) + " more roles. The actor pulls them all — across 25,000+ companies — with AI intent tags + weekly change alerts."; out.appendChild(more); }
      // feed the CTA input with this company
      var tmpl = (TOOL && TOOL.inputTemplate) || {};
      var demoBox = $("#json-code");
      if (demoBox) { var inp = JSON.parse(JSON.stringify(tmpl)); inp.atsTargets = [{ ats: "greenhouse", slug: token }]; demoBox.innerHTML = highlightJSON(inp); window.__ctaInput = inp; }
    }).catch(function (e) {
      status.innerHTML = '<span class="err">' + esc(e.message) + '</span>';
    });
  }

  /* read a value from a field marked with a custom data-attribute, e.g. data-hn-query */
  function fieldAttr(name) { var i = $("[data-" + name + "]"); return i ? (i.value || "").trim() : ""; }
  function setCTA(inp) { var box = $("#json-code"); if (box) { box.innerHTML = highlightJSON(inp); window.__ctaInput = inp; } }

  /* ---------- live: Hacker News search (Algolia API, CORS-open) ---------- */
  function runHackerNews() {
    var status = $("#status"), out = $("#results");
    var q = fieldAttr("hn-query");
    var tag = fieldAttr("hn-tags") || "story";
    var sort = fieldAttr("hn-sort") || "relevance";
    var minp = parseInt(fieldAttr("hn-minpoints"), 10) || 0;
    if (!q) { status.innerHTML = '<span class="err">Enter a keyword to search (e.g. Claude, GPT-5, rust).</span>'; return; }
    status.innerHTML = '<span class="run">› searching Hacker News for "' + esc(q) + '"…</span>';
    out.innerHTML = "";
    var base = sort === "date" ? "search_by_date" : "search";
    var url = "https://hn.algolia.com/api/v1/" + base + "?query=" + encodeURIComponent(q) + "&tags=" + encodeURIComponent(tag) + "&hitsPerPage=20";
    if (minp > 0) url += "&numericFilters=" + encodeURIComponent("points>=" + minp);
    fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HN Algolia API returned HTTP " + r.status);
      return r.json();
    }).then(function (data) {
      var hits = (data && data.hits) || [];
      if (!hits.length) { status.innerHTML = '<span class="err">No matches for "' + esc(q) + '" with these filters. Try a broader keyword or lower min points.</span>'; }
      else { status.innerHTML = '<span class="ok">✓ ' + hits.length + ' live results · Hacker News (Algolia API)</span>'; }
      var ul = el("ul", "result-list");
      hits.slice(0, 10).forEach(function (h) {
        var li = el("li", "result-item");
        var title = h.title || h.story_title || h.comment_text || "(untitled)";
        var hnUrl = "https://news.ycombinator.com/item?id=" + h.objectID;
        li.innerHTML = '<div class="rt">' + esc(title) + '</div><div class="rm">' +
          '<span>points: <b>' + (h.points != null ? h.points : 0) + '</b></span>' +
          '<span>comments: <b>' + (h.num_comments != null ? h.num_comments : 0) + '</b></span>' +
          '<span>by <b>' + esc(h.author || "—") + '</b></span>' +
          '<span>' + esc((h.created_at || "").slice(0, 10)) + '</span></div>';
        ul.appendChild(li);
      });
      out.appendChild(ul);
      var note = el("div", "term-hint"); note.style.marginTop = "12px";
      note.textContent = "↑ Live from the public HN Algolia API (the same source the actor uses). The actor adds 9 modes — full nested comment trees, user histories, the monthly Who-is-hiring parser, date/score/domain filters — and exports JSON/CSV/API at scale.";
      out.appendChild(note);
      setCTA({ mode: "search", searchQuery: q, sortSearchBy: sort, searchTags: [tag], minScore: minp, maxItems: 30 });
    }).catch(function (e) { status.innerHTML = '<span class="err">' + esc(e.message) + '</span>'; });
  }

  /* ---------- live: App Store top charts (Apple iTunes RSS, CORS-open) ---------- */
  function runAppStore() {
    var status = $("#status"), out = $("#results");
    var cc = (fieldAttr("as-country") || "us").toLowerCase();
    var chart = fieldAttr("as-chart") || "top-free";
    var feedMap = { "top-free": "topfreeapplications", "top-paid": "toppaidapplications", "top-grossing": "topgrossingapplications" };
    var feed = feedMap[chart] || "topfreeapplications";
    status.innerHTML = '<span class="run">› fetching App Store ' + esc(chart) + ' — ' + esc(cc.toUpperCase()) + '…</span>';
    out.innerHTML = "";
    var url = "https://itunes.apple.com/" + encodeURIComponent(cc) + "/rss/" + feed + "/limit=25/json";
    fetch(url).then(function (r) {
      if (!r.ok) throw new Error("Apple iTunes RSS returned HTTP " + r.status);
      return r.json();
    }).then(function (data) {
      var entries = (data && data.feed && data.feed.entry) || [];
      if (!Array.isArray(entries)) entries = [entries];
      if (!entries.length) { status.innerHTML = '<span class="err">No chart data for "' + esc(cc) + '". Try a valid 2-letter country code (us, gb, de, jp…).</span>'; return; }
      status.innerHTML = '<span class="ok">✓ live App Store ' + esc(chart) + ' · ' + esc(cc.toUpperCase()) + '</span>';
      var ul = el("ul", "result-list");
      entries.slice(0, 10).forEach(function (e2, i) {
        var li = el("li", "result-item");
        var name = (e2["im:name"] && e2["im:name"].label) || "—";
        var dev = (e2["im:artist"] && e2["im:artist"].label) || "—";
        var cat = (e2.category && e2.category.attributes && e2.category.attributes.label) || "—";
        li.innerHTML = '<div class="rt"><b>#' + (i + 1) + '</b>  ' + esc(name) + '</div><div class="rm"><span>' + esc(dev) + '</span><span>' + esc(cat) + '</span></div>';
        ul.appendChild(li);
      });
      out.appendChild(ul);
      var note = el("div", "term-hint"); note.style.marginTop = "12px";
      note.textContent = "↑ Live from Apple's official iTunes RSS feed (top 10 shown; Apple caps this feed at 100/chart). The actor tracks 150+ countries × all 3 charts + categories, enriches each app (ratings, reviews, developer, screenshots), computes rank deltas + risers/fallers + a forecast, and exports JSON/CSV/API. (Google Play is server-side only.)";
      out.appendChild(note);
      setCTA({ platforms: ["apple"], countries: [cc], chartTypes: [chart], resultsPerChart: 100 });
    }).catch(function (e) { status.innerHTML = '<span class="err">' + esc(e.message) + '</span>'; });
  }

  /* ---------- configurator: build input + show sample ---------- */
  function runConfigurator() {
    var status = $("#status"), out = $("#results");
    renderJSON();
    status.innerHTML = '<span class="ok">✓ query ready — copy it below and paste into the actor for live results</span>';
    out.innerHTML = "";
    if (!TOOL || !TOOL.sampleUrl) return;
    fetch(TOOL.sampleUrl).then(function (r) { return r.json(); }).then(function (rows) {
      var head = el("div", "example-head");
      head.innerHTML = '<span class="example-badge">Example output</span> A fixed sample showing the <b>data shape</b> the actor returns — not live results for your query.';
      out.appendChild(head);
      var ul = el("ul", "result-list");
      rows.slice(0, 6).forEach(function (row) {
        var li = el("li", "result-item");
        var f = TOOL.sampleFields || Object.keys(row).slice(0, 3);
        li.innerHTML = '<div class="rt">' + esc(row[f[0]] || "—") + '</div><div class="rm">' +
          f.slice(1).map(function (k) { return "<span>" + esc(k) + ": <b>" + esc(row[k] != null ? row[k] : "—") + "</b></span>"; }).join("") + '</div>';
        ul.appendChild(li);
      });
      out.appendChild(ul);
      var note = el("div", "term-hint"); note.style.marginTop = "12px";
      note.textContent = "↑ Fixed example — the same rows every time, not your live results. To run the exact query you built above, paste it into the actor (free to start, then pay-as-you-go); it fetches live at scale and exports JSON/CSV/API.";
      out.appendChild(note);
    }).catch(function () { /* the built query is already shown above; the example sample is optional */ });
  }

  /* ---------- boot ---------- */
  function boot() {
    if (!TOOL) return;
    wireCopy();
    renderJSON();
    $all("[data-key]").forEach(function (i) { i.addEventListener("input", renderJSON); });
    var runBtn = $("#run");
    var RUNNERS = { "live-greenhouse": runGreenhouse, "live-hackernews": runHackerNews, "live-appstore": runAppStore };
    if (runBtn) runBtn.addEventListener("click", function () {
      (RUNNERS[TOOL.mode] || runConfigurator)();
    });
    // allow Enter to run from a text field
    $all(".term-input").forEach(function (i) { i.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); runBtn && runBtn.click(); } }); });

    // reveal-on-scroll (respect reduced motion)
    if (!window.matchMedia || !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.style.opacity = 1; en.target.style.transform = "none"; io.unobserve(en.target); } }); }, { threshold: .12 });
      $all("[data-reveal]").forEach(function (n) { n.style.opacity = 0; n.style.transform = "translateY(14px)"; n.style.transition = "opacity .5s ease, transform .5s ease"; io.observe(n); });
    }
  }
  if (document.readyState !== "loading") boot(); else document.addEventListener("DOMContentLoaded", boot);
})();
