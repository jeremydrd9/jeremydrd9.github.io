/* AcneTrack site — comportements (aucune dépendance). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var html = document.documentElement;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) html.classList.add('reduce');

  /* ── Lien de démarrage ──
     Quand le funnel web sera en ligne : FUNNEL_URL = 'https://quiz.acne-track.com/'
     et tous les boutons .cta (barre épinglée comprise) y mèneront.
     Vide : store selon l'appareil, sinon la section #download. */
  var FUNNEL_URL = '';
  var APP_STORE = 'https://apps.apple.com/us/app/acnetrack-your-acne-journey/id6743371480';
  var PLAY = 'https://play.google.com/store/apps/details?id=com.acnetrack.app';
  var ua = navigator.userAgent;
  var storeHref = /iPhone|iPad|iPod/.test(ua) ? APP_STORE : /Android/.test(ua) ? PLAY : '';
  $$('.cta').forEach(function (a) {
    if (FUNNEL_URL) a.href = FUNNEL_URL;
    else if (storeHref) { a.href = storeHref; a.target = '_blank'; a.rel = 'noopener'; }
  });

  /* ── Captures de l'app dans la langue de la page ──
     assets/app/<lang>/<nom>.jpg, repli sur l'anglais si la capture n'existe pas. */
  var SHOTS = {
    en: ['dashboard', 'routine', 'evolution', 'today', 'quiz', 'coach', 'food-scan', 'product-scan', 'scan', 'cause'],
    fr: ['dashboard', 'routine', 'evolution', 'today', 'quiz', 'coach', 'food-scan', 'product-scan', 'cause'],
    de: ['dashboard', 'routine', 'evolution', 'today', 'quiz', 'cause']
  };
  function applyShots(lang) {
    var have = SHOTS[lang] || [];
    $$('img[data-shot]').forEach(function (img) {
      var name = img.dataset.shot;
      var l = have.indexOf(name) >= 0 ? lang : 'en';
      var src = 'assets/app/' + l + '/' + name + '.jpg';
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    });
  }

  /* ── Nav + barre épinglée ── */
  var nav = $('nav'), dock = $('dock');
  var onScroll = function () { nav.classList.toggle('scrolled', scrollY > 8); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if ('IntersectionObserver' in window) {
    var heroCtaOut = false, dlIn = false;
    var syncDock = function () {
      var show = heroCtaOut && !dlIn;
      dock.classList.toggle('show', show);
      dock.setAttribute('aria-hidden', show ? 'false' : 'true');
      dock.querySelector('a').tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(function (es) { heroCtaOut = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; syncDock(); }).observe(document.querySelector('.hero .hero-cta'));
    new IntersectionObserver(function (es) { dlIn = es[0].isIntersecting; syncDock(); }).observe($('download'));
  }

  /* ── Apparitions ── */
  html.classList.add('anim');
  // blocs dont les enfants arrivent en cascade
  $$('.sec-head, .plan-text, .checks, .card, .tile-text, .faq .rv, .download .wrap').forEach(function (el) {
    el.classList.add('st');
    Array.prototype.forEach.call(el.children, function (c, i) { c.style.setProperty('--i', i); });
  });
  var revealables = $$('.rv, .fan, .st');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    revealables.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      revealables.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight * .9 && r.bottom > 0) el.classList.add('in'); });
    }, 900);
  } else revealables.forEach(function (el) { el.classList.add('in'); });
  requestAnimationFrame(function () { requestAnimationFrame(function () { html.classList.add('ready'); $('heroFan').classList.add('in'); }); });

  /* ── Scan visage : les trois étapes s'enchaînent en boucle ── */
  $$('.facescan').forEach(function (scr, k) {
    var pills = $$('.fs-pill', scr), step = 0;
    var render = function () {
      pills.forEach(function (p, i) {
        p.classList.toggle('on', step > i * 2);
        p.classList.toggle('done', step > i * 2 + 1 && i < pills.length - 1);
      });
    };
    if (still) { step = pills.length * 2; render(); return; }
    render();
    setTimeout(function tick() {
      step = (step + 1) % (pills.length * 2 + 3);
      render();
      setTimeout(tick, step === 0 ? 700 : 900);
    }, 600 + k * 350);
  });

  /* ── Bandeau avant/après et mur d'avis : pistes doublées pour une boucle continue ── */
  var track = $('baTrack');
  if (track) {
    var base = $$('.ba-pair', track);
    while (track.children.length < 8) base.forEach(function (k) { var c = k.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
    $$('.ba-pair', track).forEach(function (k) { var c = k.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
  }
  $$('.wall-row').forEach(function (row) {
    $$('.review', row).forEach(function (r) { var c = r.cloneNode(true); c.setAttribute('aria-hidden', 'true'); row.appendChild(c); });
  });

  /* ── Rail d'outils : points de pagination sur mobile ── */
  var rail = $('toolsRail'), dots = $('railDots');
  if (rail && dots) {
    var cards = $$('.card', rail);
    dots.innerHTML = cards.map(function () { return '<i></i>'; }).join('');
    var dotEls = $$('i', dots);
    var syncDots = function () {
      var w = cards[0].getBoundingClientRect().width + 14;
      var idx = Math.round(rail.scrollLeft / w);
      dotEls.forEach(function (d, i) { d.classList.toggle('on', i === Math.min(idx, dotEls.length - 1)); });
    };
    rail.addEventListener('scroll', syncDots, { passive: true }); syncDots();
  }

  /* ── Causes : une puce s'allume à tour de rôle ── */
  var causes = $$('#causes span');
  if (causes.length && !still) {
    var ci = 0;
    setInterval(function () {
      var vis = causes.filter(function (c) { return c.offsetParent !== null; });
      causes.forEach(function (c) { c.classList.remove('hot'); });
      if (vis.length) vis[ci % vis.length].classList.add('hot'); ci += 3;
    }, 1100);
  } else if (causes.length) causes[0].classList.add('hot');

  /* ── Comparateur avant/après ── */
  var cmp = $('compare');
  if (cmp) {
    var range = cmp.querySelector('input');
    var setP = function (v) { cmp.style.setProperty('--p', v + '%'); };
    range.addEventListener('input', function () { setP(range.value); });
    if ('IntersectionObserver' in window && !still) {
      var hinted = false;
      new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting || hinted) return; hinted = true;
        var t0 = performance.now();
        (function anim(t) {
          var x = Math.min(1, (t - t0) / 1800);
          var v = 50 + Math.sin(x * Math.PI * 2) * 28;
          setP(v); range.value = v;
          if (x < 1) requestAnimationFrame(anim);
        })(t0);
      }, { threshold: .6 }).observe(cmp);
    }
  }

  /* ── Coach : questions et réponses qui se jouent en boucle ── */
  var chatLog = $('chatLog');
  var playChat = null;
  if (chatLog) {
    var src = $$('.chat-src p');
    var pairs = [];
    for (var i = 0; i + 1 < src.length; i += 2) pairs.push([src[i], src[i + 1]]);
    var turn = 0, timers = [];
    var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
    var bubble = function (cls, text) { var b = document.createElement('div'); b.className = 'msg ' + cls; if (text != null) b.textContent = text; chatLog.appendChild(b); requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('on'); }); }); return b; };
    playChat = function () {
      timers.forEach(clearTimeout); timers = [];
      chatLog.innerHTML = '';
      var pair = pairs[turn % pairs.length]; turn++;
      if (still) { bubble('q', pair[0].textContent); bubble('a', pair[1].textContent); return; }
      later(function () { bubble('q', pair[0].textContent); }, 300);
      later(function () { var t = bubble('typing'); t.innerHTML = '<i></i><i></i><i></i>'; later(function () { t.remove(); bubble('a', pair[1].textContent); }, 1300); }, 1100);
      later(playChat, 7600);
    };
    if ('IntersectionObserver' in window) {
      var started = false;
      new IntersectionObserver(function (es) { if (es[0].isIntersecting && !started) { started = true; playChat(); } }, { threshold: .3 }).observe(chatLog);
    } else playChat();
  }

  /* ── Comparateur : plusieurs paires avant/après, au choix ou en rotation ── */
  var cmpBox = $('compare'), cmpDots = $('compareDots');
  if (cmpBox && cmpDots) {
    var dotsB = $$('button', cmpDots), cmpTimer = null, cmpIdx = 0;
    var showPair = function (i) {
      cmpIdx = i; var id = dotsB[i].dataset.pair;
      cmpBox.classList.add('swap');
      setTimeout(function () {
        cmpBox.querySelector(':scope > img').src = 'assets/ba/' + id + '-after.jpg';
        cmpBox.querySelector('.compare-before img').src = 'assets/ba/' + id + '-before.jpg';
        cmpBox.classList.remove('swap');
      }, 250);
      dotsB.forEach(function (b, j) { b.classList.toggle('on', j === i); });
    };
    dotsB.forEach(function (b, i) { b.addEventListener('click', function (e) { e.stopPropagation(); clearInterval(cmpTimer); showPair(i); }); });
    if (!still) {
      cmpTimer = setInterval(function () { showPair((cmpIdx + 1) % dotsB.length); }, 4500);
      cmpBox.querySelector('input').addEventListener('pointerdown', function () { clearInterval(cmpTimer); });
    }
  }

  /* ── Langues ── */
  var I18N = window.ACNETRACK_I18N || {};
  var AGE_WORD = { en: '', fr: ' ans', de: ' Jahre' };
  var langBtn = $('langBtn'), langMenu = $('langMenu'), langLabel = $('langLabel');
  var setMenu = function (o) { langMenu.classList.toggle('open', o); langBtn.setAttribute('aria-expanded', o); };
  langBtn.addEventListener('click', function (e) { e.stopPropagation(); setMenu(!langMenu.classList.contains('open')); });
  document.addEventListener('click', function () { setMenu(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  var defaults = { 'meta.title': document.title, 'meta.description': (document.querySelector('meta[name=description]') || {}).content || '' };
  $$('[data-i18n],[data-i18n-html]').forEach(function (el) {
    var k = el.dataset.i18n || el.dataset.i18nHtml;
    if (!(k in defaults)) defaults[k] = el.dataset.i18n ? el.textContent : el.innerHTML;
  });
  function applyLang(lang) {
    var dict = I18N[lang] || {};
    $$('[data-i18n]').forEach(function (el) { var k = el.dataset.i18n, v = dict[k] != null ? dict[k] : defaults[k]; if (v != null) el.textContent = v; });
    $$('[data-i18n-html]').forEach(function (el) { var k = el.dataset.i18nHtml, v = dict[k] != null ? dict[k] : defaults[k]; if (v != null) el.innerHTML = v; });
    $$('[data-age]').forEach(function (el) { el.textContent = '· ' + el.dataset.age + (AGE_WORD[lang] || ''); });
    html.lang = lang;
    langLabel.textContent = lang.toUpperCase();
    $$('[data-lang]').forEach(function (b) { b.setAttribute('aria-current', b.dataset.lang === lang ? 'true' : 'false'); });
    document.title = dict['meta.title'] || defaults['meta.title'];
    var m = document.querySelector('meta[name=description]'); if (m) m.content = dict['meta.description'] || defaults['meta.description'];
    applyShots(lang);
    try { localStorage.setItem('lang', lang); } catch (e) { /* navigation privée */ }
  }
  $$('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      applyLang(b.dataset.lang); setMenu(false);
      var u = new URL(location.href); if (b.dataset.lang === 'en') u.searchParams.delete('lang'); else u.searchParams.set('lang', b.dataset.lang);
      history.replaceState(null, '', u);
    });
  });
  var wanted = new URL(location.href).searchParams.get('lang');
  if (!wanted) { try { wanted = localStorage.getItem('lang'); } catch (e) { /* navigation privée */ } }
  if (!wanted) { var nl = (navigator.language || 'en').slice(0, 2).toLowerCase(); if (I18N[nl]) wanted = nl; }
  applyLang(wanted && I18N[wanted] ? wanted : 'en');
})();
