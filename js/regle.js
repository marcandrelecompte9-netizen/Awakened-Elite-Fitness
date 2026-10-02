/* ═══════════════════════════════════════════════════════════════════════
   RÈGLE GLISSANTE — Awakened (v1233)
   -----------------------------------------------------------------------
   Choisir un nombre (âge, poids…) en glissant une règle graduée de
   gauche à droite, sans ouvrir le clavier. Boutons − / + de chaque côté
   (appui long = défilement rapide). Chaque graduation s'aimante au centre
   (scroll-snap) et le téléphone vibre légèrement à chaque dizaine.

   Utilisation :
     AwakRegle.html('monId', { min: 5, max: 99, pas: 1, val: 30, unite: 'ans' })
     → insérer dans la page, puis AwakRegle.init('monId')
     AwakRegle.valeur('monId') → nombre choisi
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var LARG = 12;   // largeur d'une graduation (px)
  var COUL = '#60a8f0';

  function css() {
    if (document.getElementById('awkRegleCss')) return;
    var st = document.createElement('style');
    st.id = 'awkRegleCss';
    st.textContent = ''
      + '.awk-regle{user-select:none;-webkit-user-select:none;}'
      + '.awk-regle-val{text-align:center;font-family:var(--font-display),sans-serif;font-weight:900;color:#fff;line-height:1;margin-bottom:10px;}'
      + '.awk-regle-val .n{font-size:2.6em;font-variant-numeric:tabular-nums;letter-spacing:-1px;}'
      + '.awk-regle-val .u{font-size:0.95em;color:#94a3b8;font-weight:800;margin-left:6px;}'
      + '.awk-regle-zone{display:flex;align-items:center;gap:8px;}'
      + '.awk-regle-btn{flex-shrink:0;width:42px;height:42px;min-height:auto !important;padding:0 !important;border-radius:12px;cursor:pointer;'
      +   'background:rgba(96,168,240,0.1);border:1px solid rgba(96,168,240,0.35);color:#93c5fd;display:flex;align-items:center;justify-content:center;touch-action:manipulation;}'
      + '.awk-regle-cadre{position:relative;flex:1;min-width:0;height:64px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.09);overflow:hidden;}'
      + '.awk-regle-piste{position:absolute;inset:0;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;touch-action:pan-x;}'
      + '.awk-regle-piste::-webkit-scrollbar{display:none;}'
      + '.awk-regle-rail{display:flex;align-items:flex-start;height:100%;width:max-content;}'
      + '.awk-regle-esp{flex-shrink:0;height:1px;}'
      + '.awk-regle-t{flex-shrink:0;width:' + LARG + 'px;height:100%;position:relative;scroll-snap-align:center;}'
      + '.awk-regle-t i{position:absolute;left:50%;top:0;width:2px;margin-left:-1px;background:rgba(148,163,184,0.45);border-radius:0 0 2px 2px;}'
      + '.awk-regle-t b{position:absolute;left:50%;top:34px;transform:translateX(-50%);font-size:11px;font-weight:800;color:#64748b;white-space:nowrap;}'
      + '.awk-regle-centre{position:absolute;left:50%;top:0;bottom:0;width:3px;margin-left:-1.5px;background:' + COUL + ';border-radius:2px;box-shadow:0 0 10px rgba(96,168,240,0.8);pointer-events:none;}'
      + '.awk-regle-piste{-webkit-mask-image:linear-gradient(90deg,transparent,#000 40px,#000 calc(100% - 40px),transparent);mask-image:linear-gradient(90deg,transparent,#000 40px,#000 calc(100% - 40px),transparent);}';
    document.head.appendChild(st);
  }

  var ICO_MOINS = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 12h14"/></svg>';
  var ICO_PLUS = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';

  function fmt(v, pas) { return pas < 1 ? v.toFixed(1).replace('.', ',') : String(Math.round(v)); }

  function html(id, o) {
    css();
    o = o || {};
    var min = +o.min || 0, max = +o.max || 100, pas = +o.pas || 1;
    var val = Math.min(max, Math.max(min, +o.val || min));
    var n = Math.round((max - min) / pas);
    var ticks = '';
    for (var i = 0; i <= n; i++) {
      var v = min + i * pas;
      var r = Math.round(v / pas);
      var dix = Math.abs(v % 10) < 1e-6, cinq = Math.abs(v % 5) < 1e-6;
      var h = dix ? 28 : (cinq ? 19 : 11);
      ticks += '<div class="awk-regle-t" data-i="' + i + '"><i style="height:' + h + 'px;' + (dix ? 'background:rgba(203,213,225,0.75);' : '') + '"></i>'
        + (dix ? '<b>' + fmt(v, pas) + '</b>' : '') + '</div>';
    }
    return '<div class="awk-regle" id="' + id + '" data-min="' + min + '" data-max="' + max + '" data-pas="' + pas + '" data-val="' + val + '">'
      + '<div class="awk-regle-val"><span class="n">' + fmt(val, pas) + '</span><span class="u">' + (o.unite || '') + '</span></div>'
      + '<div class="awk-regle-zone">'
      +   '<button type="button" class="awk-regle-btn" data-dir="-1" aria-label="Moins">' + ICO_MOINS + '</button>'
      +   '<div class="awk-regle-cadre">'
      +     '<div class="awk-regle-piste" data-no-swipe><div class="awk-regle-rail">'
      +       '<div class="awk-regle-esp"></div>' + ticks + '<div class="awk-regle-esp"></div>'
      +     '</div></div>'
      +     '<div class="awk-regle-centre"></div>'
      +   '</div>'
      +   '<button type="button" class="awk-regle-btn" data-dir="1" aria-label="Plus">' + ICO_PLUS + '</button>'
      + '</div>'
      + (o.aide ? '<div style="text-align:center;font-size:0.7em;color:#64748b;margin-top:8px;">' + o.aide + '</div>' : '')
      + '</div>';
  }

  function vibrer(ms) { try { if (window.AwakNative) AwakNative.vibrer(ms); else if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  function init(id, surChange) {
    var el = document.getElementById(id);
    if (!el || el._awkRegle) return;
    el._awkRegle = true;
    var min = +el.dataset.min, max = +el.dataset.max, pas = +el.dataset.pas;
    var piste = el.querySelector('.awk-regle-piste');
    var num = el.querySelector('.awk-regle-val .n');
    var esp = el.querySelectorAll('.awk-regle-esp');
    var dernierDix = null, raf = 0;

    function placerEspaces() {
      var w = piste.clientWidth || 240;
      esp.forEach(function (s) { s.style.width = (w / 2 - LARG / 2) + 'px'; });
    }
    function idxDe(v) { return Math.round((v - min) / pas); }
    function versIdx(i, doux) {
      piste.scrollTo({ left: i * LARG, behavior: doux ? 'smooth' : 'auto' });
    }
    function lire() {
      var i = Math.round(piste.scrollLeft / LARG);
      var v = Math.min(max, Math.max(min, +(min + i * pas).toFixed(2)));
      if (String(v) !== el.dataset.val) {
        el.dataset.val = v;
        num.textContent = fmt(v, pas);
        var d = Math.floor(v / 10);
        if (dernierDix !== null && d !== dernierDix) vibrer(8);
        dernierDix = d;
        if (typeof surChange === 'function') { try { surChange(v); } catch (e) {} }
      }
    }
    piste.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; lire(); });
    }, { passive: true });

    // − / + : un toucher = un pas ; appui long = défilement qui accélère
    el.querySelectorAll('.awk-regle-btn').forEach(function (b) {
      var dir = +b.dataset.dir, t1 = null, t2 = null, n = 0;
      var un = function () {
        var i = idxDe(+el.dataset.val) + dir;
        i = Math.max(0, Math.min(idxDe(max), i));
        versIdx(i, false); lire(); vibrer(6);
      };
      var stop = function () { clearTimeout(t1); clearInterval(t2); t1 = t2 = null; };
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault(); un(); n = 0;
        t1 = setTimeout(function () {
          t2 = setInterval(function () { n++; un(); if (n === 12) { clearInterval(t2); t2 = setInterval(un, 40); } }, 110);
        }, 380);
      });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, stop); });
      b.addEventListener('click', function (e) { e.preventDefault(); });
    });

    placerEspaces();
    requestAnimationFrame(function () { placerEspaces(); versIdx(idxDe(+el.dataset.val), false); dernierDix = Math.floor(+el.dataset.val / 10); });
    window.addEventListener('resize', placerEspaces);
  }

  function valeur(id) {
    var el = document.getElementById(id);
    return el ? +el.dataset.val : null;
  }

  window.AwakRegle = { html: html, init: init, valeur: valeur };
})();
