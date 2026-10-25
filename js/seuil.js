/* ═══════════════════════════════════════════════════════════════════
   LE SEUIL (v1447) — entrée cinématique dans une Faille
   ─────────────────────────────────────────────────────────────────────
   Écran noir, une faille de lumière cyan, une phrase. Deux temps :
     1. « Maintenir pour approcher » : appui long, la faille s'élargit.
     2. « Glisser vers le haut pour entrer » (mode complet) : on franchit.
        Relâcher avant le seuil = on recule, la faille se referme un peu.
   Mode rapide (Failles ordinaires) : l'appui long suffit pour entrer.
   « Reculer » referme sans entrer (bouton Retour du téléphone aussi).

   AwakSeuil.ouvrir({
     titre, sous,            // temps 1
     titre2, sous2,          // temps 2 (mode complet)
     complet: true|false,
     etiquette: 'SYSTÈME',
     onEntrer(), onReculer()
   })
   Mouvement réduit (préférence du téléphone) : pas d'animation continue.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var ID = 'awakSeuilOverlay';
  var CYAN = '34,211,238', CYAN_C = '103,232,249';
  var SERIF = "'Iowan Old Style','Palatino Linotype','Book Antiqua',Palatino,Georgia,serif";

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function vib(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  function reduit() { try { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  function styles() {
    if (document.getElementById('awakSeuilCss')) return;
    var st = document.createElement('style');
    st.id = 'awakSeuilCss';
    st.textContent =
      '#' + ID + '{position:fixed;inset:0;z-index:100003;background:#000;color:#e2e8f0;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;font-family:Outfit,system-ui,sans-serif;opacity:0;transition:opacity .6s ease}' +
      '#' + ID + '.on{opacity:1}' +
      '#' + ID + ' canvas{position:absolute;inset:0;width:100%;height:100%}' +
      '#' + ID + ' .sl-et{position:absolute;top:max(22px,env(safe-area-inset-top));left:24px;font-size:11px;letter-spacing:4px;color:#a3b1c2}' +
      '#' + ID + ' .sl-et i{display:block;width:120px;height:1px;margin-top:9px;background:linear-gradient(90deg,rgba(' + CYAN + ',.5),transparent)}' +
      '#' + ID + ' .sl-x{position:absolute;top:max(14px,env(safe-area-inset-top));right:12px;background:none;border:none;color:#8d9cb1;font:inherit;font-size:11px;letter-spacing:3px;padding:10px 12px;cursor:pointer;min-height:44px}' +
      '#' + ID + ' .sl-t{position:absolute;left:24px;right:24px;text-align:center;transition:opacity .7s ease,transform .7s ease}' +
      '#' + ID + ' .sl-t1{bottom:25%}' +
      '#' + ID + ' .sl-t h2{margin:0;font-family:' + SERIF + ' !important;font-weight:400 !important;font-size:clamp(22px,6vw,30px);color:#e8eef5;letter-spacing:.3px;line-height:1.3}' +
      '#' + ID + ' .sl-t p{margin:12px auto 0;max-width:440px;font-family:' + SERIF + ' !important;font-size:clamp(14px,3.9vw,17px);color:#a3b1c2;line-height:1.55}' +
      '#' + ID + ' .sl-t2{top:50%;transform:translateY(-50%);opacity:0;pointer-events:none;text-align:left;left:auto;right:6%;width:min(44%,300px)}' +
      '#' + ID + '.p2 .sl-t1{opacity:0;transform:translateY(12px)}' +
      '#' + ID + '.p2 .sl-t2{opacity:1}' +
      '#' + ID + ' .sl-t2 h2{font-size:clamp(20px,5.4vw,27px);color:rgba(' + CYAN_C + ',.95)}' +
      '#' + ID + ' .sl-t2 .sl-trait{width:64px;height:1px;margin:16px 0 12px;background:rgba(' + CYAN + ',.6)}' +
      '#' + ID + ' .sl-t2 p{margin:0;text-align:left;font-size:clamp(13px,3.6vw,15px)}' +
      '#' + ID + ' .sl-hold{position:absolute;left:50%;bottom:max(13%,calc(env(safe-area-inset-bottom) + 70px));transform:translateX(-50%);text-align:center;width:240px}' +
      '#' + ID + ' .sl-hold b{display:block;font-weight:500;font-size:12px;letter-spacing:3px;color:#a3b1c2}' +
      '#' + ID + ' .sl-hold i{display:block;width:120px;height:2px;margin:12px auto 0;background:rgba(255,255,255,.12);border-radius:2px;overflow:hidden}' +
      '#' + ID + ' .sl-hold i u{display:block;height:100%;width:0;background:rgba(' + CYAN_C + ',.95);box-shadow:0 0 10px rgba(' + CYAN + ',.9)}' +
      '#' + ID + '.p2 .sl-hold{opacity:0;pointer-events:none}' +
      '#' + ID + ' .sl-glis{position:absolute;left:6%;top:16%;bottom:22%;width:120px;opacity:0;pointer-events:none;transition:opacity .6s}' +
      '#' + ID + '.p2 .sl-glis{opacity:1}' +
      '#' + ID + ' .sl-glis .sl-rail{position:absolute;left:0;top:0;bottom:0;width:1px;background:linear-gradient(transparent,rgba(' + CYAN + ',.45),transparent)}' +
      '#' + ID + ' .sl-chev{position:absolute;left:26px;width:16px;height:16px;border-left:1.5px solid rgba(' + CYAN_C + ',.7);border-top:1.5px solid rgba(' + CYAN_C + ',.7);transform:rotate(45deg);opacity:.15;animation:slChev 1.8s infinite}' +
      '#' + ID + ' .sl-glis b{position:absolute;left:14px;bottom:-46px;font-weight:500;font-size:11px;letter-spacing:3px;color:#a3b1c2;line-height:1.7;white-space:nowrap}' +
      '#' + ID + ' .sl-recul{position:absolute;left:0;right:0;text-align:center;bottom:calc(max(5%,env(safe-area-inset-bottom)) + 58px);font-size:10px;letter-spacing:3px;color:#8d9cb1;opacity:0;transition:opacity .6s}' +
      '#' + ID + '.p2 .sl-recul{opacity:1}' +
      '#' + ID + ' .sl-go{position:absolute;left:50%;bottom:max(5%,env(safe-area-inset-bottom));transform:translateX(-50%);background:none;border:1px solid rgba(' + CYAN + ',.35);color:#cfeff7;font:inherit;font-size:12px;letter-spacing:3px;padding:10px 18px;border-radius:2px;cursor:pointer;opacity:0;pointer-events:none;min-height:44px}' +
      '#' + ID + '.p2 .sl-go{opacity:.75;pointer-events:auto}' +
      '#' + ID + ' .sl-flash{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(' + CYAN_C + ',.95),rgba(' + CYAN + ',.35) 40%,#000 75%);opacity:0;pointer-events:none;transition:opacity .45s ease}' +
      '#' + ID + '.entre .sl-flash{opacity:1}' +
      '@keyframes slChev{0%{opacity:.12}40%{opacity:.85}100%{opacity:.12}}' +
      '@media (prefers-reduced-motion: reduce){#' + ID + ' .sl-chev{animation:none;opacity:.5}}';
    document.head.appendChild(st);
  }

  // Tracé de la faille : ligne brisée verticale + quelques ramifications
  function trace(h) {
    var pts = [], n = 46, x = 0;
    for (var i = 0; i <= n; i++) {
      x += (Math.random() - 0.5) * 7; x *= 0.86;
      pts.push({ y: i / n, x: x + Math.sin(i * 0.55) * 4 });
    }
    var br = [];
    for (var b = 0; b < 9; b++) {
      var k = 6 + Math.floor(Math.random() * (n - 12)), dir = Math.random() < 0.5 ? -1 : 1, seg = [];
      var bx = pts[k].x, by = pts[k].y;
      for (var j = 0; j < 5 + Math.floor(Math.random() * 5); j++) { bx += dir * (6 + Math.random() * 14); by += (Math.random() - 0.35) * 0.03; seg.push({ x: bx, y: by }); }
      br.push({ k: k, seg: seg, a: 0.25 + Math.random() * 0.5 });
    }
    return { pts: pts, br: br };
  }

  function ouvrir(o) {
    o = o || {};
    var vieux = document.getElementById(ID); if (vieux) vieux.remove();
    styles();
    var complet = !!o.complet;
    var el = document.createElement('div');
    el.id = ID;
    el.setAttribute('data-emoji-keep', '');
    var chev = '';
    for (var c = 0; c < 9; c++) chev += '<span class="sl-chev" style="top:' + (6 + c * 8.5) + '%;animation-delay:' + (-(c * 0.16)).toFixed(2) + 's"></span>';
    el.innerHTML =
      '<canvas></canvas>' +
      '<div class="sl-et">' + esc(o.etiquette || 'SYSTÈME') + '<i></i></div>' +
      '<button type="button" class="sl-x" aria-label="Fermer" onclick="AwakSeuil.reculer()">RECULER</button>' +
      '<div class="sl-t sl-t1"><h2>' + esc(o.titre || 'Une Faille s\'est ouverte.') + '</h2>' + (o.sous ? '<p>' + esc(o.sous) + '</p>' : '') + '</div>' +
      (complet ? '<div class="sl-t sl-t2"><h2>' + esc(o.titre2 || 'Au-delà, le silence est plus lourd.') + '</h2><div class="sl-trait"></div>' + (o.sous2 ? '<p>' + esc(o.sous2) + '</p>' : '') + '</div>' : '') +
      '<div class="sl-hold"><b>MAINTENIR POUR APPROCHER</b><i><u></u></i></div>' +
      (complet ? '<div class="sl-glis"><span class="sl-rail"></span>' + chev + '<b>GLISSER<br>POUR ENTRER</b></div><div class="sl-recul">RELÂCHER POUR RECULER</div>'
        + '<button type="button" class="sl-go">ENTRER</button>' : '') +
      '<div class="sl-flash"></div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('on'); });
    vib([30]);

    var cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0;
    function taille() { W = el.clientWidth; H = el.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    taille(); window.addEventListener('resize', taille);
    var T = trace(H), parts = [];
    for (var p = 0; p < 70; p++) parts.push({ x: (Math.random() - 0.5) * 2, y: Math.random(), v: 0.0004 + Math.random() * 0.0012, r: Math.random() * 1.3 + 0.2, a: Math.random() });
    var st = { ouv: 0.08, cible: 0.08, phase: 1, appui: 0, appuiDebut: 0, glisse: 0, fini: false, t0: performance.now(), p2: 0 };
    var calme = reduit();

    function dessin(now) {
      if (st.fini && !el.isConnected) return;
      var t = (now - st.t0) / 1000;
      st.ouv += (st.cible - st.ouv) * 0.08;
      ctx.clearRect(0, 0, W, H);
      st.p2 += ((st.phase === 2 ? 1 : 0) - st.p2) * 0.06;
      var cx = W * (0.5 - 0.09 * st.p2), top = H * (0.13 + 0.02 * st.p2), bas = H * (0.6 + 0.24 * st.p2), hh = bas - top;
      var puls = calme ? 1 : 0.85 + Math.sin(t * 2.1) * 0.15;
      var o2 = st.ouv;
      // halo
      var g = ctx.createRadialGradient(cx, H / 2, 4, cx, H / 2, Math.max(60, H * 0.42 * (0.4 + o2)));
      g.addColorStop(0, 'rgba(' + CYAN + ',' + (0.10 + o2 * 0.22) * puls + ')');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // anneaux discrets (temps 2)
      if (st.phase === 2) {
        ctx.strokeStyle = 'rgba(' + CYAN + ',0.05)'; ctx.lineWidth = 1;
        for (var r = 1; r <= 7; r++) { ctx.beginPath(); ctx.arc(cx, H / 2, r * 34 * (0.8 + o2 * 0.4), 0, Math.PI * 2); ctx.stroke(); }
      }
      // corps de la faille (deux lèvres qui s'écartent)
      var larg = Math.max(0, o2 - 0.15) * 34;
      function levre(sign) {
        ctx.beginPath();
        T.pts.forEach(function (q, i) {
          var env = Math.sin(q.y * Math.PI); // plus large au centre
          var x = cx + q.x * (0.6 + o2) + sign * larg * env * 0.5, y = top + q.y * hh;
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        });
        ctx.stroke();
      }
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(' + CYAN + ',0.95)';
      ctx.shadowBlur = 18 + o2 * 30;
      ctx.strokeStyle = 'rgba(' + CYAN_C + ',' + (0.75 * puls) + ')';
      ctx.lineWidth = 1.4 + o2 * 1.6;
      levre(-1); levre(1);
      // cœur noir entre les lèvres
      if (o2 > 0.25) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0,4,10,' + Math.min(0.9, o2) + ')';
        ctx.beginPath();
        T.pts.forEach(function (q, i) { var env = Math.sin(q.y * Math.PI); var x = cx + q.x * (0.6 + o2) - larg * env * 0.42, y = top + q.y * hh; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        for (var k = T.pts.length - 1; k >= 0; k--) { var q2 = T.pts[k], env2 = Math.sin(q2.y * Math.PI); ctx.lineTo(cx + q2.x * (0.6 + o2) + larg * env2 * 0.42, top + q2.y * hh); }
        ctx.fill();
      }
      // âme blanche
      ctx.shadowBlur = 10; ctx.strokeStyle = 'rgba(235,252,255,' + (0.7 * puls) + ')'; ctx.lineWidth = 1.1;
      if (o2 < 0.35) levre(0);
      // ramifications
      ctx.shadowBlur = 6;
      T.br.forEach(function (b) {
        var q = T.pts[b.k], env = Math.sin(q.y * Math.PI);
        var sx = cx + q.x * (0.6 + o2), sy = top + q.y * hh;
        ctx.strokeStyle = 'rgba(' + CYAN_C + ',' + (b.a * (0.25 + o2) * puls) + ')'; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(sx, sy);
        // côté du texte (droite) au temps 2 : ramifications raccourcies pour ne pas le traverser
        var droite = b.seg.length && b.seg[b.seg.length - 1].x > q.x, kx = (0.4 + o2) * (droite ? 1 - 0.75 * st.p2 : 1);
        b.seg.forEach(function (s) { ctx.lineTo(sx + (s.x - q.x) * kx, top + s.y * hh); });
        ctx.stroke();
      });
      ctx.restore();
      // particules
      parts.forEach(function (pt) {
        if (!calme) { pt.y -= pt.v * (1 + o2 * 2); if (pt.y < 0) { pt.y = 1; pt.x = (Math.random() - 0.5) * 2; } }
        var px = cx + pt.x * (60 + o2 * 140), py = top + pt.y * hh;
        ctx.fillStyle = 'rgba(' + CYAN_C + ',' + (0.15 + pt.a * 0.5) * (0.5 + o2) + ')';
        ctx.beginPath(); ctx.arc(px, py, pt.r, 0, Math.PI * 2); ctx.fill();
      });
      // jauge d'appui
      if (st.phase === 1 && st.appuiDebut) {
        st.appui = Math.min(1, (now - st.appuiDebut) / 1100);
        st.cible = 0.08 + st.appui * 0.45;
        var u = el.querySelector('.sl-hold u'); if (u) u.style.width = (st.appui * 100) + '%';
        if (st.appui >= 1) passer2();
      }
      if (!st.fini) requestAnimationFrame(dessin);
    }
    requestAnimationFrame(dessin);

    function finir(entrer) {
      if (st.fini) return; st.fini = true;
      window.removeEventListener('resize', taille);
      if (entrer) {
        vib([60, 40, 120]);
        el.classList.add('entre');
        setTimeout(function () { el.remove(); try { if (o.onEntrer) o.onEntrer(); } catch (e) {} }, 520);
      } else {
        el.classList.remove('on');
        setTimeout(function () { el.remove(); try { if (o.onReculer) o.onReculer(); } catch (e) {} }, 450);
      }
    }
    function passer2() {
      st.appuiDebut = 0;
      if (!complet) { st.cible = 1; finir(true); return; }
      st.phase = 2; st.cible = 0.62; el.classList.add('p2'); vib([40, 30, 40]);
    }

    // ── Gestes ──
    var y0 = null;
    el.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.sl-x') || e.target.closest('.sl-go')) return;
      if (st.phase === 1) { st.appuiDebut = performance.now(); }
      else { y0 = e.clientY; }
    });
    function lacher() {
      if (st.phase === 1 && st.appuiDebut) {
        st.appuiDebut = 0; st.cible = 0.08;
        var u = el.querySelector('.sl-hold u'); if (u) u.style.width = '0';
      }
      if (st.phase === 2 && y0 !== null) { y0 = null; if (!st.fini) st.cible = 0.62; }
    }
    el.addEventListener('pointerup', lacher);
    el.addEventListener('pointercancel', lacher);
    el.addEventListener('pointerleave', lacher);
    el.addEventListener('pointermove', function (e) {
      if (st.phase !== 2 || y0 === null || st.fini) return;
      var d = Math.max(0, y0 - e.clientY), seuil = Math.min(170, H * 0.22);
      st.cible = 0.62 + Math.min(1, d / seuil) * 0.38;
      if (d >= seuil) finir(true);
    });
    var go = el.querySelector('.sl-go'); if (go) go.onclick = function () { finir(true); };   // sans geste (accessibilité)
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') finir(false); });
    api._fin = finir;
    api._passer = passer2;
    return el;
  }

  var api = {
    ouvrir: ouvrir,
    reculer: function () { if (api._fin) api._fin(false); },
    // tests / outils : franchir sans geste
    _entrer: function () { if (api._passer) { var el = document.getElementById(ID); if (el && !el.classList.contains('p2')) api._passer(); } if (api._fin) api._fin(true); },
    ouvert: function () { return !!document.getElementById(ID); }
  };
  window.AwakSeuil = api;
})();
