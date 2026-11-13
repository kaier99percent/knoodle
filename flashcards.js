/* ==========================================================================
   Knoodle — flashcards.js
   Loaded only when the Languages tab is opened. It then loads vocab.js
   (also lazily), builds the cards, and runs the session.

   Idea: a word is only "known" when you can pull it out of your own head,
   on different days, in different ways. So the card type changes as you
   improve:
     new      -> meet the word, then pick its meaning
     box 1    -> French -> English (typed)
     box 2    -> fill the gap in a sentence
     box 3    -> English -> French (typed, with article = gender)
     box 4+   -> gap-fill / English -> French, mixed
   Before each typed answer you make a "gut check" (know it / not sure /
   no idea). At the end Knoodle shows how well your gut matched reality.
   No points, no streaks. Wrong answers come back a few cards later.

   Progress lives in localStorage per user (see `store`). To sync it to
   Supabase later, only `store.load` / `store.save` need to change.
   ========================================================================== */
(function () {
  'use strict';

  var SIZE = 10, NEW_MAX = 5, MIN = 60000, DAY = 864e5;
  var BOX_DAYS = [0, 0, 1, 3, 7, 16, 35];   // days until due once a box is reached
  var KNOWN_BOX = 4;                          // box >= 4 counts as "known"
  var KEY = 'knoodle-progress-v1-';

  var root, uid = 'anon', decks = {}, deckId = null, S = null;

  /* ---------- progress store ---------- */
  var store = {
    data: {},
    load: function (id) {
      try { this.data = JSON.parse(localStorage.getItem(KEY + id)) || {}; } catch (e) { this.data = {}; }
    },
    save: function () {
      try { localStorage.setItem(KEY + uid, JSON.stringify(this.data)); } catch (e) {}
      try { window.dispatchEvent(new Event('knoodle:progress')); } catch (e) {}
    }
  };

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function strip(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function norm(s) {
    return String(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/œ/g, 'oe').replace(/æ/g, 'ae')
      .replace(/[.,;:!?¿¡"“”«»]/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function prep(s, fr) { s = norm(s); return fr ? s : s.replace(/^(the|a|an) /, ''); }
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) d[i] = [i];
    for (j = 1; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  function enVariants(en) {
    var out = [];
    en.split(/\s*\/\s*/).forEach(function (p) {
      out.push(p.replace(/\s*\([^)]*\)/g, ''));
      out.push(p.replace(/[()]/g, ''));
    });
    return out;
  }
  function dueIn(b) { return b <= 1 ? 10 * MIN : BOX_DAYS[Math.min(b, 6)] * DAY; }
  function when(ms) {
    if (ms <= 0) return 'now';
    var m = Math.round(ms / MIN);
    if (m < 60) return 'about ' + Math.max(m, 1) + ' min';
    var h = Math.round(m / 60);
    if (h < 24) return 'about ' + h + (h === 1 ? ' hour' : ' hours');
    var d = Math.round(h / 24);
    return d + (d === 1 ? ' day' : ' days');
  }

  /* ---------- answer checking ---------- */
  function check(ans, accepted, o) {
    var a = prep(ans, o.fr);
    if (!a) return { r: 'bad' };
    var best = { r: 'bad' };
    for (var i = 0; i < accepted.length; i++) {
      var n = prep(accepted[i], o.fr);
      if (a === n) return { r: 'ok' };
      if (strip(a) === strip(n)) { best = { r: 'close', msg: 'Right word — mind the accents.' }; continue; }
      if (o.fr && o.noun) {
        var na = n.replace(/^(le|la|les|un|une|l') ?/, '');
        if (a === na || strip(a) === strip(na)) { best = { r: 'close', msg: 'Include the article — it tells you the gender.' }; continue; }
      }
      if (best.r === 'bad' && n.length >= 5 && lev(strip(a), strip(n)) <= 1) best = { r: 'close', msg: 'So close — just a tiny typo.' };
    }
    return best;
  }

  /* ---------- deck building ---------- */
  function buildDeck(d) {
    var words = [];
    d.sections.forEach(function (s) {
      s.words.forEach(function (r) {
        var o = r[4] || {}, fr = r[0];
        var g = o.g || (/^(le|un)\s/i.test(fr) ? 'm' : /^(la|une)\s/i.test(fr) ? 'f' : null);
        var w = {
          id: o.id || (s.id + ':' + fr), sec: s.id, secTitle: s.title, trap: s.flag === 'trap',
          fr: fr, en: r[1], enMain: r[1].split(/\s*\/\s*/)[0], enAcc: enVariants(r[1]),
          frAcc: [fr].concat(o.altFr || []), exFr: r[2], exEn: r[3], note: o.note, g: g, noun: !!g, cloze: null
        };
        var base = fr.replace(/^(?:(?:le|la|les|un|une)\s+|l['’])/i, '');
        [o.cloze, base, fr].some(function (t) {
          if (!t) return false;
          var re = new RegExp('(^|[^\\p{L}])(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![\\p{L}])', 'iu');
          var m = re.exec(w.exFr);
          if (!m) return false;
          var at = m.index + m[1].length;
          w.cloze = { pre: w.exFr.slice(0, at), ans: m[2], post: w.exFr.slice(at + m[2].length) };
          return true;
        });
        words.push(w);
      });
    });
    return { id: d.id, name: d.name, from: d.from, to: d.to, speech: d.speech || 'fr-FR', sections: d.sections, words: words };
  }
  function D() { return decks[deckId]; }

  /* ---------- scheduling ---------- */
  function modeFor(w, b) {
    if (b === 0) return 'meet';
    if (b === 1) return 'fr2en';
    if (b === 2) return w.cloze ? 'cloze' : 'en2fr';
    if (b === 3) return 'en2fr';
    return (w.cloze && Math.random() < 0.5) ? 'cloze' : 'en2fr';
  }
  function counts(ws) {
    var c = { known: 0, shaky: 0, fresh: 0, due: 0 }, now = Date.now();
    ws.forEach(function (w) {
      var r = store.data[w.id];
      if (!r) { c.fresh++; return; }
      if (r.b >= KNOWN_BOX) c.known++; else c.shaky++;
      if (r.d <= now) c.due++;
    });
    return c;
  }
  function pick(secId) {
    var now = Date.now(), ws = D().words.filter(function (w) { return !secId || w.sec === secId; });
    var due = [], fresh = [];
    ws.forEach(function (w) {
      var r = store.data[w.id];
      if (!r) fresh.push(w); else if (r.d <= now) due.push(w);
    });
    due.sort(function (a, b) { return store.data[a.id].d - store.data[b.id].d; });
    due = due.slice(0, SIZE);
    fresh = fresh.slice(0, Math.min(NEW_MAX, SIZE - due.length));
    var items = due.map(function (w) { var p = store.data[w.id]; return { w: w, prev: p, mode: modeFor(w, p.b) }; })
      .concat(fresh.map(function (w) { return { w: w, prev: null, mode: 'meet' }; }));
    if (!items.length) {   // nothing due: extra practice on the weakest words, no box credit
      ws.filter(function (w) { return store.data[w.id]; })
        .sort(function (a, b) { return store.data[a.id].b - store.data[b.id].b; })
        .slice(0, SIZE).forEach(function (w) {
          var p = store.data[w.id]; items.push({ w: w, prev: p, mode: modeFor(w, Math.max(p.b, 1)), early: true });
        });
    }
    return shuffle(items);
  }
  function grade(it, r) {
    if (it.retry) return;
    var now = Date.now(), p = it.prev || { b: 0, s: 0, l: 0, d: 0 };
    var n = { b: p.b, s: (p.s || 0) + 1, l: p.l || 0, d: p.d || 0, t: now };
    if (r === 'ok') n.b = Math.min(6, p.b + 1);
    else if (r === 'close') n.b = Math.max(p.b, 1);
    else { n.b = Math.max(1, p.b - 2); n.l = n.l + 1; }
    n.d = now + (r === 'ok' ? dueIn(n.b) : 10 * MIN);
    if (it.early && r !== 'bad') { n.b = p.b; n.d = p.d; }
    store.data[it.w.id] = n;
    store.save();
  }

  /* ---------- rendering pieces ---------- */
  var SPK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M19 5a10 10 0 0 1 0 14"></path></svg>';
  function frHtml(w) {
    var m = /^(le|la|les|un|une|l['’])(\s*)(.*)$/i.exec(w.fr);
    if (w.g && m) return '<span class="kf-art kf-' + w.g + '">' + esc(m[1] + m[2]) + '</span>' + esc(m[3]);
    return esc(w.fr);
  }
  function spk(t) { return '<button type="button" class="kf-ico" data-act="say" data-t="' + esc(t) + '" aria-label="Listen">' + SPK + '</button>'; }
  function say(t) {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(t); u.lang = D().speech; u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function tag(it) {
    var l = { meet: 'New word', recog: 'Pick the meaning', fr2en: 'Translate to ' + D().to, en2fr: 'Say it in ' + D().from, cloze: 'Fill the gap' }[it.mode];
    return '<div class="kf-tag"><span>' + esc(l) + '</span>' + (it.w.trap ? '<span class="kf-trap">Watch out</span>' : '') +
      '<span class="kf-sec">' + esc(it.w.secTitle) + '</span></div>';
  }
  var ACCENTS = ['é', 'è', 'ê', 'à', 'â', 'ç', 'ù', 'û', 'ô', 'î', 'ï', 'œ'];

  /* ---------- screens ---------- */
  function renderHome() {
    S = null;
    var d = D(), all = counts(d.words), h = '';
    var newCap = Math.min(NEW_MAX, all.fresh), n = Math.min(all.due, SIZE) + Math.min(newCap, Math.max(0, SIZE - all.due));
    h += '<div class="kf"><div class="kf-card kf-hero"><div class="kf-title">Languages</div>';
    h += '<p class="kf-muted">Retrieval beats re-reading. Each session mixes card types and brings back what\'s slipping. No points, no streaks.</p>';
    var ids = Object.keys(decks);
    if (ids.length > 1) {
      h += '<div class="kf-decks">' + ids.map(function (id) {
        return '<button type="button" class="kf-chip' + (id === deckId ? ' on' : '') + '" data-act="deck" data-id="' + esc(id) + '">' + esc(decks[id].name) + '</button>';
      }).join('') + '</div>';
    } else h += '<div class="kf-deckname">' + esc(d.name) + '</div>';
    h += '<div class="kf-stats"><div class="kf-stat k"><b>' + all.known + '</b>known</div><div class="kf-stat s"><b>' + all.shaky + '</b>shaky</div><div class="kf-stat d"><b>' + all.due + '</b>due</div><div class="kf-stat n"><b>' + all.fresh + '</b>new</div></div>';
    h += '<button type="button" class="kf-btn" data-act="start">' + (n ? 'Start a session · ' + n + ' cards (~' + Math.max(2, Math.round(n * 0.4)) + ' min)' : 'Extra practice on shaky words') + '</button>';
    h += '<p class="kf-fine">A word counts as <b>known</b> only after you have recalled it several times, on different days, in different ways. Seeing it once isn\'t enough.</p></div>';
    h += '<div class="kf-card"><div class="kf-h2">Topics</div>';
    d.sections.forEach(function (s) {
      var c = counts(d.words.filter(function (w) { return w.sec === s.id; })), t = c.known + c.shaky + c.fresh || 1;
      var label = c.due ? 'Review ' + c.due : c.fresh ? 'Learn' : 'Practise';
      h += '<div class="kf-row"><div class="kf-rowmain"><div class="kf-rowtitle">' + esc(s.title) + (s.flag === 'trap' ? ' <span class="kf-trap">Watch out</span>' : '') + '</div>' +
        '<div class="kf-fine">' + esc(s.blurb || '') + '</div>' +
        '<div class="kf-bar"><i class="k" style="width:' + (c.known / t * 100) + '%"></i><i class="s" style="width:' + (c.shaky / t * 100) + '%"></i></div>' +
        '<div class="kf-fine">' + c.known + ' known · ' + c.shaky + ' shaky · ' + c.fresh + ' new</div></div>' +
        '<button type="button" class="kf-btn kf-sm ghost" data-act="start" data-sec="' + esc(s.id) + '">' + label + '</button></div>';
    });
    h += '</div></div>';
    root.innerHTML = h;
  }

  function startSession(secId) {
    var items = pick(secId);
    if (!items.length) { renderHome(); return; }
    S = { q: items, i: 0, log: [], secId: secId };
    show();
  }
  function cur() { return S.q[S.i]; }
  function show() {
    while (S.q[S.i] && S.q[S.i].skip) S.i++;
    if (S.i >= S.q.length) { renderSummary(); return; }
    var it = cur();
    it.stage = it.mode === 'meet' ? 'intro' : 'ask';
    if (it.stage === 'ask') prepAsk(it);
    render();
  }
  function prepAsk(it) {
    if (it.mode !== 'recog') return;
    var w = it.w, pool = D().words.filter(function (x) { return x.sec === w.sec && x.enMain.toLowerCase() !== w.enMain.toLowerCase(); });
    var rest = D().words.filter(function (x) { return x.sec !== w.sec && x.enMain.toLowerCase() !== w.enMain.toLowerCase(); });
    var seen = {}, opts = [];
    shuffle(pool).concat(shuffle(rest)).forEach(function (x) {
      var k = x.enMain.toLowerCase();
      if (opts.length < 3 && !seen[k]) { seen[k] = 1; opts.push(x.enMain); }
    });
    it.opts = shuffle(opts.concat([w.enMain]));
  }

  function top() {
    var pct = Math.round(S.i / S.q.length * 100);
    return '<div class="kf-top"><button type="button" class="kf-link" data-act="end">✕ End session</button><div class="kf-prog"><i style="width:' + pct + '%"></i></div><span class="kf-fine">' + Math.min(S.i + 1, S.q.length) + '/' + S.q.length + '</span></div>';
  }

  function render() {
    var it = cur(), w = it.w, h = '<div class="kf">' + top() + '<div class="kf-card kf-q">' + tag(it);
    if (it.stage === 'intro') {
      h += '<div class="kf-big">' + frHtml(w) + ' ' + spk(w.fr) + '</div><div class="kf-en">' + esc(w.en) + '</div>';
      h += '<div class="kf-ex"><div>' + esc(w.exFr) + '</div><div class="kf-muted">' + esc(w.exEn) + '</div></div>';
      if (w.note) h += '<div class="kf-note">' + esc(w.note) + '</div>';
      if (w.g) h += '<div class="kf-fine">' + (w.g === 'm' ? 'Masculine (blue)' : 'Feminine (coral)') + ' — learn the article with the word.</div>';
      h += '<button type="button" class="kf-btn" data-act="test" id="kf-focus">I\'ve got it — test me</button>';
    } else if (it.stage === 'ask') {
      if (it.mode === 'recog') {
        h += '<div class="kf-big">' + frHtml(w) + ' ' + spk(w.fr) + '</div><div class="kf-opts">';
        it.opts.forEach(function (o, i) { h += '<button type="button" class="kf-opt" data-act="opt" data-i="' + i + '"><kbd>' + (i + 1) + '</kbd>' + esc(o) + '</button>'; });
        h += '</div>';
      } else {
        if (it.mode === 'fr2en') h += '<div class="kf-big">' + frHtml(w) + ' ' + spk(w.fr) + '</div>';
        else if (it.mode === 'en2fr') h += '<div class="kf-big">' + esc(w.enMain) + '</div>' + (w.noun ? '<div class="kf-fine">A noun — type it with its article (le / la / l\').</div>' : '');
        else h += '<div class="kf-sent">' + esc(w.cloze.pre) + '<span class="kf-gap">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>' + esc(w.cloze.post) + '</div><div class="kf-muted">' + esc(w.exEn) + '</div>';
        h += '<div class="kf-gut"><span class="kf-fine">Gut check:</span>' +
          [['sure', 'I know this'], ['maybe', 'Not sure'], ['none', 'No idea']].map(function (g) {
            return '<button type="button" class="kf-chip' + (it.gut === g[0] ? ' on' : '') + '" data-act="gut" data-g="' + g[0] + '">' + g[1] + '</button>';
          }).join('') + '</div>';
        var tofr = it.mode !== 'fr2en';
        h += '<input id="kf-in" class="kf-in" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" lang="' + (tofr ? 'fr' : 'en') + '" placeholder="Type your answer…" value="">';
        if (tofr) h += '<div class="kf-acc">' + ACCENTS.map(function (a) { return '<button type="button" data-act="acc" data-c="' + a + '">' + a + '</button>'; }).join('') + '</div>';
        h += '<div class="kf-hint" id="kf-hint"></div>';
        h += '<div class="kf-actions"><button type="button" class="kf-btn" data-act="check">Check</button><button type="button" class="kf-btn ghost" data-act="hint">First letter</button><button type="button" class="kf-btn ghost" data-act="giveup">Show me</button></div>';
      }
    } else {
      h += feedback(it);
    }
    h += '</div></div>';
    root.innerHTML = h;
    var f = root.querySelector('#kf-in') || root.querySelector('#kf-focus') || root.querySelector('#kf-next');
    if (f) try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); }
  }

  function feedback(it) {
    var w = it.w, r = it.res, h = '';
    h += '<div class="kf-res ' + r + '">' + (r === 'ok' ? (it.override ? 'Counted as correct' : 'Correct') : r === 'close' ? 'Almost' : 'Not quite') + '</div>';
    if (it.msg) h += '<div class="kf-fine">' + esc(it.msg) + '</div>';
    if (it.typed && r !== 'ok') h += '<div class="kf-fine">You wrote: <b>' + esc(it.typed) + '</b></div>';
    h += '<div class="kf-answer">' + frHtml(w) + ' ' + spk(w.fr) + '<div class="kf-en">' + esc(w.en.split(/\s*\/\s*/).join(' · ')) + '</div></div>';
    h += '<div class="kf-ex"><div>' + esc(w.exFr) + '</div><div class="kf-muted">' + esc(w.exEn) + '</div></div>';
    if (w.note) h += '<div class="kf-note">' + esc(w.note) + '</div>';
    if (it.gut === 'sure' && r === 'bad') h += '<div class="kf-gutmsg">You felt sure — these are the sneaky ones. It will come back soon.</div>';
    else if (it.gut === 'none' && r === 'ok') h += '<div class="kf-gutmsg">You said “no idea” — and you knew it. You know more than you think.</div>';
    if (it.retry) h += '<div class="kf-fine">Second look — this one doesn\'t change your progress.</div>';
    h += '<div class="kf-actions">';
    if (r === 'bad' && !it.retry && (it.mode === 'fr2en' || it.mode === 'cloze' || it.mode === 'en2fr')) h += '<button type="button" class="kf-btn ghost" data-act="override">Mine was right too</button>';
    h += '<button type="button" class="kf-btn" id="kf-next" data-act="next">Next →</button></div>';
    return h;
  }

  /* ---------- answering ---------- */
  function finish(it, r, msg, typed) {
    it.res = r; it.msg = msg || ''; it.typed = typed || ''; it.stage = 'fb';
    grade(it, r);
    if (!it.retry) S.log.push(it);
    if (r === 'bad' && !it.retry) {
      it.rt = { w: it.w, mode: 'recog', retry: true };
      S.q.splice(Math.min(S.i + 4, S.q.length), 0, it.rt);
    }
    render();
  }
  function submit(giveUp) {
    var it = cur(), w = it.w, inp = root.querySelector('#kf-in'), typed = inp ? inp.value : '';
    var fr = it.mode !== 'fr2en';
    var acc = it.mode === 'cloze' ? [w.cloze.ans] : fr ? w.frAcc : w.enAcc;
    var c = giveUp ? { r: 'bad' } : check(typed, acc, { fr: fr, noun: w.noun && it.mode === 'en2fr' });
    var r = c.r, msg = c.msg;
    if (r === 'ok' && it.hint) { r = 'close'; msg = 'Correct — but you used a hint, so it will come back soon.'; }
    finish(it, r, msg, giveUp ? '' : typed);
  }
  function chooseOpt(i) {
    var it = cur(), ok = it.opts[i] === it.w.enMain;
    finish(it, ok ? 'ok' : 'bad', '', ok ? '' : it.opts[i]);
  }
  function hint() {
    var it = cur(), w = it.w, t = it.mode === 'cloze' ? w.cloze.ans : it.mode === 'en2fr' ? w.fr : w.enMain;
    it.hint = true;
    var el = root.querySelector('#kf-hint');
    if (el) el.textContent = 'Starts with “' + t.charAt(0) + '” · ' + t.length + ' characters';
  }

  /* ---------- summary ---------- */
  function renderSummary() {
    var log = S.log, ok = 0, bad = [], g = { sureOk: 0, sureBad: 0, noneOk: 0, noneBad: 0 }, rated = 0;
    log.forEach(function (it) {
      if (it.res === 'ok') ok++;
      if (it.res === 'bad') bad.push(it.w);
      if (it.gut === 'sure' || it.gut === 'none') {
        rated++;
        g[(it.gut === 'sure' ? 'sure' : 'none') + (it.res === 'ok' ? 'Ok' : 'Bad')]++;
      }
    });
    var nextD = Infinity;
    log.forEach(function (it) { var r = store.data[it.w.id]; if (r && r.d < nextD) nextD = r.d; });
    var h = '<div class="kf"><div class="kf-card"><div class="kf-title">Session done</div>';
    if (!log.length) h += '<p class="kf-muted">No cards answered this time.</p>';
    else {
      h += '<p class="kf-muted">You recalled <b>' + ok + ' of ' + log.length + '</b> on the first try.</p>';
      if (bad.length) {
        h += '<div class="kf-h2">Slipping — worth another look</div>';
        bad.forEach(function (w) { h += '<div class="kf-slip"><span>' + frHtml(w) + '</span><span class="kf-muted">' + esc(w.enMain) + '</span></div>'; });
        h += '<p class="kf-fine">These will return in a few minutes, and again after that.</p>';
      } else h += '<p class="kf-muted">Nothing slipped. Nice.</p>';
      if (rated >= 3) {
        h += '<div class="kf-h2">How well do you know what you know?</div>';
        if (g.sureBad) h += '<div class="kf-gutmsg">You felt sure about ' + g.sureBad + ' word' + (g.sureBad > 1 ? 's' : '') + ' you actually missed. Feeling familiar isn\'t the same as knowing.</div>';
        if (g.noneOk) h += '<div class="kf-gutmsg">You said “no idea” on ' + g.noneOk + ' word' + (g.noneOk > 1 ? 's' : '') + ' you got right. You know more than you think.</div>';
        if (!g.sureBad && !g.noneOk) h += '<div class="kf-gutmsg">Your gut matched reality. That\'s a good sign.</div>';
      }
      if (isFinite(nextD)) h += '<p class="kf-fine">Your next review is ready in <b>' + when(nextD - Date.now()) + '</b>. There\'s no need to come back every day — come back when it\'s due.</p>';
    }
    h += '<div class="kf-actions"><button type="button" class="kf-btn" data-act="home">Back to topics</button></div></div></div>';
    root.innerHTML = h;
    S = null;
  }

  /* ---------- events ---------- */
  function onClick(e) {
    var b = e.target.closest('[data-act]');
    if (!b || !root.contains(b)) return;
    var a = b.getAttribute('data-act');
    if (a === 'say') say(b.getAttribute('data-t'));
    else if (a === 'deck') { deckId = b.getAttribute('data-id'); renderHome(); }
    else if (a === 'start') startSession(b.getAttribute('data-sec') || null);
    else if (a === 'home') renderHome();
    else if (a === 'end') { if (S && S.log.length) renderSummary(); else renderHome(); }
    else if (!S) return;
    else if (a === 'test') { var it = cur(); it.mode = 'recog'; it.stage = 'ask'; prepAsk(it); render(); }
    else if (a === 'opt') chooseOpt(+b.getAttribute('data-i'));
    else if (a === 'gut') { cur().gut = b.getAttribute('data-g'); root.querySelectorAll('[data-act=gut]').forEach(function (x) { x.classList.toggle('on', x === b); }); var f = root.querySelector('#kf-in'); if (f) f.focus(); }
    else if (a === 'acc') { var inp = root.querySelector('#kf-in'); if (inp) { var p = inp.selectionStart || inp.value.length; inp.value = inp.value.slice(0, p) + b.getAttribute('data-c') + inp.value.slice(inp.selectionEnd || p); inp.focus(); inp.setSelectionRange(p + 1, p + 1); } }
    else if (a === 'check') submit(false);
    else if (a === 'giveup') { var c = cur(); if (!c.gut) c.gut = 'none'; submit(true); }
    else if (a === 'hint') hint();
    else if (a === 'override') { var o = cur(); o.res = 'ok'; o.override = true; o.msg = ''; if (o.rt) o.rt.skip = true; grade(o, 'ok'); render(); }
    else if (a === 'next') { S.i++; show(); }
  }
  function onKey(e) {
    if (!S) return;
    var it = cur();
    if (e.key === 'Enter' && e.target.id === 'kf-in') { e.preventDefault(); submit(false); }
    else if (it && it.stage === 'ask' && it.mode === 'recog' && /^[1-4]$/.test(e.key)) { if (it.opts[+e.key - 1] != null) chooseOpt(+e.key - 1); }
  }

  /* ---------- styles ---------- */
  var CSS = '.kf{max-width:720px;margin:0 auto;display:grid;gap:16px;font-family:inherit;color:var(--text-main)}' +
    '.kf-card{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius-b);padding:24px;box-shadow:var(--card-shadow)}' +
    '.kf-title{font-size:26px;font-weight:850;letter-spacing:-.5px}.kf-h2{font-size:17px;font-weight:800;margin:18px 0 10px}' +
    '.kf-muted{color:var(--text-muted);font-weight:600}.kf-fine{color:var(--text-muted);font-size:13px;font-weight:600;margin:6px 0}' +
    '.kf-deckname{display:inline-block;margin:6px 0 14px;font-weight:800;color:var(--primary)}.kf-decks{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}' +
    '.kf-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}' +
    '.kf-stat{border-radius:var(--radius-c);padding:12px 6px;text-align:center;font-size:12px;font-weight:700}.kf-stat b{display:block;font-size:24px;font-weight:850}' +
    '.kf-stat.k{background:var(--stat-solid-bg);color:var(--stat-solid-color)}.kf-stat.s{background:var(--stat-shaky-bg);color:var(--stat-shaky-color)}' +
    '.kf-stat.d{background:var(--stat-due-bg);color:var(--stat-due-color)}.kf-stat.n{background:var(--primary-light);color:var(--primary)}' +
    '.kf-btn{font:inherit;font-weight:800;cursor:pointer;border:1.5px solid var(--primary);background:var(--primary);color:var(--btn-text);padding:12px 22px;border-radius:var(--radius-a);transition:transform .15s,background .2s}' +
    '.kf-btn:hover{background:var(--primary-hover);transform:translateY(-1px)}.kf-btn.ghost{background:transparent;color:var(--primary)}.kf-btn.ghost:hover{background:var(--primary-light)}.kf-sm{padding:8px 14px;font-size:13px;white-space:nowrap}' +
    '.kf-chip{font:inherit;font-size:13px;font-weight:700;cursor:pointer;border:1.5px solid var(--border);background:var(--surface);color:var(--text-main);padding:6px 12px;border-radius:99px}' +
    '.kf-chip.on{border-color:var(--primary);background:var(--primary-light);color:var(--primary)}' +
    '.kf-row{display:flex;gap:14px;align-items:center;justify-content:space-between;padding:14px 0;border-top:1.5px dashed var(--border)}.kf-rowmain{flex:1;min-width:0}.kf-rowtitle{font-weight:800}' +
    '.kf-bar{height:8px;background:var(--border);border-radius:9px;overflow:hidden;display:flex;margin:8px 0 2px}.kf-bar i{display:block;height:100%}' +
    '.kf-bar .k{background:var(--stat-solid-color)}.kf-bar .s{background:var(--stat-shaky-color)}' +
    '.kf-trap{display:inline-block;font-size:11px;font-weight:800;padding:2px 8px;border-radius:99px;background:var(--error-bg);color:var(--error-text);margin-left:6px}' +
    '.kf-top{display:flex;align-items:center;gap:12px}.kf-prog{flex:1;height:8px;background:var(--border);border-radius:9px;overflow:hidden}.kf-prog i{display:block;height:100%;background:var(--primary);transition:width .3s}' +
    '.kf-link{font:inherit;font-size:13px;font-weight:700;background:none;border:0;color:var(--text-muted);cursor:pointer}' +
    '.kf-tag{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:var(--primary);margin-bottom:14px}.kf-sec{margin-left:auto;color:var(--text-muted);text-transform:none;letter-spacing:0}' +
    '.kf-big{font-size:36px;font-weight:850;line-height:1.2;margin:6px 0 8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.kf-en{font-size:20px;font-weight:700;color:var(--text-main)}' +
    '.kf-art{border-radius:10px;padding:0 8px;font-size:.7em}.kf-m{background:var(--stat-due-bg);color:var(--stat-due-color)}.kf-f{background:var(--primary-light);color:var(--primary)}' +
    '.kf-ico{border:0;background:var(--primary-light);color:var(--primary);width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}' +
    '.kf-ex{margin:14px 0;padding:12px 14px;border-left:4px solid var(--icon-border);background:var(--bg);border-radius:0 12px 12px 0;font-weight:700}.kf-ex .kf-muted{font-weight:600;font-size:14px}' +
    '.kf-note{margin:10px 0;padding:10px 14px;border-radius:var(--radius-c);background:var(--stat-shaky-bg);color:var(--stat-shaky-color);font-size:14px;font-weight:700}' +
    '.kf-sent{font-size:24px;font-weight:800;line-height:1.5;margin:6px 0}.kf-gap{display:inline-block;min-width:90px;border-bottom:3px solid var(--primary);margin:0 4px}' +
    '.kf-gut{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:16px 0 10px}' +
    '.kf-in{width:100%;font:inherit;font-size:20px;font-weight:700;padding:14px 16px;border-radius:var(--radius-a);border:1.5px solid var(--border);background:var(--bg);color:var(--text-main);outline:none}.kf-in:focus{border-color:var(--primary)}' +
    '.kf-acc{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.kf-acc button{font:inherit;font-weight:700;width:34px;height:34px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface);color:var(--text-main);cursor:pointer}' +
    '.kf-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.kf-hint{min-height:20px;font-size:13px;font-weight:700;color:var(--primary);margin-top:6px}' +
    '.kf-opts{display:grid;gap:10px;margin-top:16px}.kf-opt{font:inherit;font-weight:700;text-align:left;cursor:pointer;padding:14px 16px;border-radius:var(--radius-a);border:1.5px solid var(--border);background:var(--surface);color:var(--text-main);display:flex;gap:12px;align-items:center}.kf-opt:hover{border-color:var(--primary);background:var(--primary-light)}' +
    '.kf-opt kbd{font:inherit;font-size:12px;border:1px solid var(--border);border-radius:6px;padding:0 6px;color:var(--text-muted)}' +
    '.kf-res{font-size:22px;font-weight:850;margin-bottom:6px}.kf-res.ok{color:var(--stat-solid-color)}.kf-res.close{color:var(--stat-shaky-color)}.kf-res.bad{color:var(--error-text)}' +
    '.kf-answer{margin:10px 0}.kf-gutmsg{margin:10px 0;padding:10px 14px;border-radius:var(--radius-c);background:var(--stat-due-bg);color:var(--stat-due-color);font-size:14px;font-weight:700}' +
    '.kf-slip{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1.5px dashed var(--border);font-weight:800}' +
    '@media(max-width:520px){.kf-card{padding:18px}.kf-big{font-size:30px}.kf-row{flex-direction:column;align-items:stretch}.kf-stats{gap:6px}}';

  /* ---------- mount ---------- */
  function init() {
    var V = window.KNOODLE_VOCAB || {};
    Object.keys(V).forEach(function (id) { if (!decks[id]) decks[id] = buildDeck(V[id]); });
    if (!deckId || !decks[deckId]) deckId = Object.keys(decks)[0];
    if (!deckId) { root.innerHTML = '<div class="kf"><div class="kf-card">No vocabulary found in vocab.js.</div></div>'; return; }
    renderHome();
  }
  function mount(el, userId) {
    root = el; uid = userId || 'anon';
    if (!document.getElementById('kf-css')) {
      var st = document.createElement('style'); st.id = 'kf-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    store.load(uid);
    root.onclick = onClick; root.onkeydown = onKey;
    if (S) return;                       // a session is running: don't reset it when the tab is re-opened
    if (window.KNOODLE_VOCAB) { init(); return; }
    root.innerHTML = '<div class="kf"><div class="kf-card kf-muted">Loading vocabulary…</div></div>';
    var s = document.createElement('script'); s.src = 'vocab.js';
    s.onload = init;
    s.onerror = function () { root.innerHTML = '<div class="kf"><div class="kf-card">Couldn\'t load the vocabulary. Check your connection and <button type="button" class="kf-btn kf-sm" onclick="Knoodle.Flash.mount(document.getElementById(\'flashApp\'),window.KNOODLE_USER_ID)">try again</button></div></div>'; };
    document.head.appendChild(s);
  }

  window.Knoodle = window.Knoodle || {};
  window.Knoodle.Flash = { mount: mount, _check: check };
})();
