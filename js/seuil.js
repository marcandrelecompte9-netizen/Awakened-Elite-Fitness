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

  // v1518 : couleur de la Faille (thème) — cyan par défaut ; pas de vert (palette du jeu)
  function couleurFaille(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim()); if (!m) return CYAN;
    var n = parseInt(m[1], 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0;
    if (mx !== mn) { var d = mx - mn; h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
    if (mx - mn < 30 || (h > 75 && h < 165)) return CYAN;
    return r + ',' + g + ',' + b;
  }
  function eclaircir(c) { var p = c.split(',').map(Number); return p.map(function (v) { return Math.round(v + (255 - v) * 0.45); }).join(','); }

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
    // v1518 : LE SEUIL refait — ville au loin, brume, faille à plusieurs couches de
    // lumière, monde intérieur qui tourbillonne, éclairs, débris aspirés, onde de choc, reflet au sol.
    var COL = couleurFaille(o.couleur), COLC = eclaircir(COL);
    // v1519 : image de fond (images/seuil_fond.webp) — si elle charge, elle remplace le ciel
    // et la ville dessinés ; la faille, ses éclairs et ses débris restent dessinés par-dessus.
    var fondOk = false;
    (function () { var im = new Image(); im.onload = function () { fondOk = true; el.style.backgroundImage = 'url(images/seuil_fond.webp)'; el.style.backgroundSize = 'cover'; el.style.backgroundPosition = 'center'; }; im.src = 'images/seuil_fond.webp'; })();
    try { el.querySelector('.sl-flash').style.background = 'radial-gradient(ellipse at 50% 50%,rgba(255,255,255,.95),rgba(' + COLC + ',.6) 30%,rgba(' + COL + ',.3) 50%,#000 78%)'; } catch (e) {}
    var T = trace(H), parts = [], debris = [], eclairs = [], ondes = [], ville = [];
    for (var p = 0; p < 90; p++) parts.push({ x: (Math.random() - 0.5) * 2, y: Math.random(), v: 0.0004 + Math.random() * 0.0012, r: Math.random() * 1.4 + 0.2, a: Math.random() });
    for (var d = 0; d < 26; d++) debris.push(nouveauDebris(true));
    (function () { var x = -10; while (x < 1400) { var w = 16 + Math.random() * 50, h = 0.025 + Math.random() * 0.075 * (Math.random() < 0.2 ? 1.9 : 1); ville.push({ x: x, w: w, h: h, f: Math.random(), c1: Math.random(), c2: Math.random() }); x += w + Math.random() * 10; } })();
    function nouveauDebris(init) { return { a: Math.random() * Math.PI * 2, r: init ? 0.2 + Math.random() * 0.9 : 0.85 + Math.random() * 0.3, s: 2 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.08, v: 0.0012 + Math.random() * 0.002, al: 0.3 + Math.random() * 0.5 }; }
    var st = { ouv: 0.08, cible: 0.08, phase: 1, appui: 0, appuiDebut: 0, glisse: 0, fini: false, t0: performance.now(), p2: 0, prochainEclair: 0, choc: 0 };
    var calme = reduit();
    function onde(force) { ondes.push({ t: performance.now(), f: force || 1 }); st.choc = Math.max(st.choc, 0.6 * (force || 1)); }
    api._onde = onde;

    function bordsX(q, o2, larg, cote) { var env = Math.sin(q.y * Math.PI); return q.x * (0.6 + o2) + cote * larg * env * 0.5; }
    function cheminFaille(cx, top, hh, o2, larg, k) {
      ctx.beginPath();
      T.pts.forEach(function (q, i) { var x = cx + bordsX(q, o2, larg, -k), y = top + q.y * hh; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      for (var j = T.pts.length - 1; j >= 0; j--) { var q2 = T.pts[j]; ctx.lineTo(cx + bordsX(q2, o2, larg, k), top + q2.y * hh); }
      ctx.closePath();
    }

    function dessin(now) {
      if (st.fini && !el.isConnected) return;
      var t = (now - st.t0) / 1000;
      st.ouv += (st.cible - st.ouv) * 0.08;
      st.p2 += ((st.phase === 2 ? 1 : 0) - st.p2) * 0.06;
      st.choc *= 0.9;
      var o2 = st.ouv, puls = calme ? 1 : 0.85 + Math.sin(t * 2.1) * 0.15;
      var cx = W * (0.5 - 0.09 * st.p2), top = H * (0.13 + 0.02 * st.p2), bas = H * (0.6 + 0.24 * st.p2), hh = bas - top, cy = top + hh / 2;
      var larg = Math.max(0, o2 - 0.12) * Math.min(110, W * 0.26);
      // tremblement (appui, onde de choc)
      var tr = calme ? 0 : (st.appui * 1.6 + st.choc * 7);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      if (tr > 0.05) ctx.translate((Math.random() - 0.5) * tr, (Math.random() - 0.5) * tr);

      // 1. ciel : nuit profonde teintée par la faille
      var ciel = ctx.createLinearGradient(0, 0, 0, H);
      ciel.addColorStop(0, '#010104'); ciel.addColorStop(0.7, 'rgba(' + COL + ',' + (0.02 + o2 * 0.035) + ')'); ciel.addColorStop(1, '#020308');
      if (!fondOk) { ctx.fillStyle = ciel; ctx.fillRect(-20, -20, W + 40, H + 40); }
      else { ctx.fillStyle = 'rgba(0,0,0,' + (0.45 - o2 * 0.2) + ')'; ctx.fillRect(-20, -20, W + 40, H + 40); }   // l'image s'éclaire quand la faille s'ouvre
      var halo = ctx.createRadialGradient(cx, cy, 4, cx, cy, Math.max(80, H * 0.55 * (0.45 + o2)));
      halo.addColorStop(0, 'rgba(' + COL + ',' + (0.12 + o2 * 0.22) * puls + ')');
      halo.addColorStop(0.5, 'rgba(' + COL + ',' + (0.03 + o2 * 0.05) + ')');
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo; ctx.fillRect(-20, -20, W + 40, H + 40);

      // 2. ville au loin + brume
      var sol = H * 0.86;
      if (!fondOk) ville.forEach(function (b) {
        var bx = b.x * (W / 1000) - 20, bh = b.h * H, d = Math.abs(bx + b.w / 2 - cx) / W;
        // v1520 : ville intacte (toits droits, parfois une antenne)
        var bw = b.w * (W / 1000) + 1;
        ctx.fillStyle = 'rgba(5,7,12,' + (0.95 - d * 0.15) + ')';
        ctx.fillRect(bx, sol - bh, bw, bh);
        if (b.c1 > 0.8) ctx.fillRect(bx + bw * 0.5 - 1, sol - bh - 10, 2, 10);
        if (b.c2 > 0.55) { ctx.fillStyle = 'rgba(253,230,138,' + (0.05 + 0.05 * Math.sin(t * 0.7 + b.x)) + ')'; ctx.fillRect(bx + bw * 0.3, sol - bh * 0.7, 2, 2); ctx.fillRect(bx + bw * 0.6, sol - bh * 0.45, 2, 2); }
        // bord éclairé par la faille
        ctx.fillStyle = 'rgba(' + COL + ',' + Math.max(0, (0.22 - d * 0.5) * (0.3 + o2)) + ')';
        ctx.fillRect(bx + (bx < cx ? b.w * (W / 1000) - 1.5 : 0), sol - bh, 1.5, bh);
        if (b.f > 0.7) { ctx.fillStyle = 'rgba(' + COLC + ',' + (0.08 + 0.1 * Math.sin(t * 1.3 + b.x)) + ')'; ctx.fillRect(bx + 4, sol - bh + 6, 2, 2); }
      });
      var brume = ctx.createLinearGradient(0, sol - H * 0.12, 0, H);
      brume.addColorStop(0, 'rgba(' + COL + ',0)'); brume.addColorStop(0.5, 'rgba(' + COL + ',' + (0.05 + o2 * 0.07) + ')'); brume.addColorStop(1, 'rgba(1,2,6,0.95)');
      if (!fondOk) { ctx.fillStyle = brume; ctx.fillRect(-20, sol - H * 0.12, W + 40, H); }
      // reflet de la faille au sol
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var refl = ctx.createRadialGradient(cx, sol + 6, 2, cx, sol + 6, W * 0.5);
      refl.addColorStop(0, 'rgba(' + COLC + ',' + (0.12 + o2 * 0.25) * puls + ')'); refl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = refl; ctx.beginPath(); ctx.ellipse(cx, sol + 6, W * 0.5, 18 + o2 * 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // 3. ondes de choc
      ondes = ondes.filter(function (w) { return now - w.t < 1400; });
      ondes.forEach(function (w) {
        var k = (now - w.t) / 1400, R = 20 + k * Math.max(W, H) * 0.8 * w.f;
        ctx.strokeStyle = 'rgba(' + COLC + ',' + (0.5 * (1 - k)) + ')'; ctx.lineWidth = 2 + 10 * (1 - k);
        ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.92, 0, 0, Math.PI * 2); ctx.stroke();
      });

      // 4. monde intérieur (dans l'ouverture) : nébuleuse qui tourne + étoiles
      if (larg > 1.5) {
        ctx.save();
        cheminFaille(cx, top, hh, o2, larg, 0.46); ctx.clip();
        var coeur = ctx.createRadialGradient(cx, cy, 2, cx, cy, hh * 0.55);
        coeur.addColorStop(0, 'rgba(255,255,255,' + (0.55 + o2 * 0.4) + ')');
        coeur.addColorStop(0.25, 'rgba(' + COLC + ',0.85)');
        coeur.addColorStop(0.7, 'rgba(' + COL + ',0.45)');
        coeur.addColorStop(1, 'rgba(2,4,12,0.95)');
        ctx.fillStyle = coeur; ctx.fillRect(cx - larg * 2, top, larg * 4, hh);
        ctx.globalCompositeOperation = 'lighter';
        for (var s = 0; s < 7; s++) {
          var ang = t * (0.5 + s * 0.13) * (s % 2 ? 1 : -1) + s;
          ctx.strokeStyle = 'rgba(' + COLC + ',' + (0.12 + 0.06 * s / 7) + ')'; ctx.lineWidth = 2 + s;
          ctx.beginPath(); ctx.ellipse(cx, cy, larg * (0.3 + s * 0.16), hh * (0.06 + s * 0.05), ang, 0, Math.PI * 1.3); ctx.stroke();
        }
        for (var e = 0; e < 18; e++) { var ey = top + ((e * 0.137 + t * 0.05) % 1) * hh; ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.5 * Math.abs(Math.sin(t * 3 + e))) + ')'; ctx.fillRect(cx + Math.sin(e * 7.3) * larg * 0.3, ey, 1.4, 1.4); }
        ctx.restore();
      }

      // 5. lèvres de la faille : 3 couches de lumière (halo large, lueur, âme blanche)
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
      function levre(sign, lw, alpha, blur, couleur) {
        ctx.shadowColor = 'rgba(' + COL + ',1)'; ctx.shadowBlur = blur;
        ctx.strokeStyle = 'rgba(' + couleur + ',' + alpha + ')'; ctx.lineWidth = lw;
        ctx.beginPath();
        T.pts.forEach(function (q, i) { var x = cx + bordsX(q, o2, larg, sign), y = top + q.y * hh; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.stroke();
      }
      [-1, 1].forEach(function (sg) {
        levre(sg, 10 + o2 * 14, 0.10 * puls, 40 + o2 * 30, COL);
        levre(sg, 3 + o2 * 3, 0.55 * puls, 18 + o2 * 20, COLC);
        levre(sg, 1.2, 0.95, 6, '240,253,255');
      });
      if (o2 < 0.3) levre(0, 1.4, 0.9 * puls, 10, '255,255,255');
      // ramifications
      ctx.shadowBlur = 8;
      T.br.forEach(function (b) {
        var q = T.pts[b.k], sx = cx + q.x * (0.6 + o2), sy = top + q.y * hh;
        ctx.strokeStyle = 'rgba(' + COLC + ',' + (b.a * (0.3 + o2) * puls) + ')'; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(sx, sy);
        var droite = b.seg.length && b.seg[b.seg.length - 1].x > q.x, kx = (0.4 + o2) * (droite ? 1 - 0.75 * st.p2 : 1);
        b.seg.forEach(function (s2) { ctx.lineTo(sx + (s2.x - q.x) * kx, top + s2.y * hh); });
        ctx.stroke();
      });
      // 6. éclairs qui crépitent depuis les bords (plus fréquents quand on approche)
      if (!calme && now > st.prochainEclair) {
        st.prochainEclair = now + 260 + Math.random() * (900 - (st.appui + o2) * 500);
        var qk = T.pts[3 + Math.floor(Math.random() * (T.pts.length - 6))], dir = Math.random() < 0.5 ? -1 : 1, pts2 = [], ex = 0, ey2 = 0;
        for (var z = 0; z < 7; z++) { ex += dir * (10 + Math.random() * 22) * (0.6 + o2); ey2 += (Math.random() - 0.5) * 26; pts2.push([ex, ey2]); }
        eclairs.push({ x: qk.x, y: qk.y, side: dir, pts: pts2, t: now });
      }
      eclairs = eclairs.filter(function (z2) { return now - z2.t < 220; });
      eclairs.forEach(function (z2) {
        var ox = cx + bordsX({ x: z2.x, y: z2.y }, o2, larg, z2.side), oy = top + z2.y * hh;
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - (now - z2.t) / 220)) + ')'; ctx.lineWidth = 1.3; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.moveTo(ox, oy); z2.pts.forEach(function (pp) { ctx.lineTo(ox + pp[0], oy + pp[1]); }); ctx.stroke();
      });
      ctx.restore();

      // 7. débris aspirés vers la faille + particules qui montent
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      debris.forEach(function (db, i) {
        if (!calme) { db.r -= db.v * (1 + o2 * 2 + st.appui * 2); db.rot += db.vr; db.a += 0.004; }
        if (db.r < 0.04) { debris[i] = nouveauDebris(false); return; }
        var R = db.r * Math.max(W, H) * 0.6, x = cx + Math.cos(db.a) * R, y = cy + Math.sin(db.a) * R * 0.8;
        ctx.save(); ctx.translate(x, y); ctx.rotate(db.rot);
        ctx.fillStyle = 'rgba(' + COLC + ',' + (db.al * (1 - db.r * 0.6) * (0.4 + o2)) + ')';
        ctx.beginPath(); ctx.moveTo(-db.s, 0); ctx.lineTo(0, -db.s * 0.6); ctx.lineTo(db.s * 0.8, db.s * 0.3); ctx.closePath(); ctx.fill();
        ctx.restore();
      });
      parts.forEach(function (pt) {
        if (!calme) { pt.y -= pt.v * (1 + o2 * 2); if (pt.y < 0) { pt.y = 1; pt.x = (Math.random() - 0.5) * 2; } }
        var px = cx + pt.x * (60 + o2 * 160), py = top + pt.y * hh;
        ctx.fillStyle = 'rgba(' + COLC + ',' + (0.15 + pt.a * 0.5) * (0.5 + o2) + ')';
        ctx.beginPath(); ctx.arc(px, py, pt.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
      // vignette
      var vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.fillStyle = vg; ctx.fillRect(-20, -20, W + 40, H + 40);
      ctx.restore();

      // jauge d'appui
      if (st.phase === 1 && st.appuiDebut) {
        st.appui = Math.min(1, (now - st.appuiDebut) / 1100);
        st.cible = 0.08 + st.appui * 0.45;
        var u = el.querySelector('.sl-hold u'); if (u) u.style.width = (st.appui * 100) + '%';
        if (st.appui >= 1) passer2();
      } else st.appui *= 0.85;
      if (el.isConnected) requestAnimationFrame(dessin);
    }
    requestAnimationFrame(dessin);

    function finir(entrer) {
      if (st.fini) return; st.fini = true;
      window.removeEventListener('resize', taille);
      if (entrer) {
        vib([60, 40, 120]);
        st.cible = 1.2; onde(1.5);
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
      st.phase = 2; st.cible = 0.62; el.classList.add('p2'); vib([40, 30, 40]); onde(1);
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
