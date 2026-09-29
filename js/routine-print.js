/* ═══════════════════════════════════════════════════════════════════════
   🖨  IMPRIMER UNE ROUTINE — Awakened
   -----------------------------------------------------------------------
   Feuille A4 noir sur blanc, pensée pour la salle : un tableau des
   exercices (séries × reps / durée, repos) avec des CASES VIDES par série
   pour noter charge et répétitions au crayon. Supersets regroupés (A, B, C
   + nombre de tours). Zone de notes et date en bas.

   Aperçu dans l'app, puis window.print() : sur Android la fenêtre
   d'impression propose aussi « Enregistrer en PDF ».
   Au moment d'imprimer, une feuille @media print masque tout le reste.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var LETTRES = ['A', 'B', 'C', 'D', 'E', 'F'];
  var avecImages = false;
  var idxCourant = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function unite() {
    try { return (typeof useKg !== 'undefined' && useKg) ? 'kg' : 'lb'; } catch (e) { return 'kg'; }
  }
  function estMinute(ex) { return ex && (ex.mode === 'timer' || ex.mode === 'duration'); }
  function duree(sec) {
    var s = parseInt(sec, 10) || 0;
    if (s >= 60) { var m = Math.floor(s / 60), r = s % 60; return m + ' min' + (r ? ' ' + r + ' s' : ''); }
    return s + ' s';
  }
  function reposGlobal() {
    try { if (typeof globalRestSeconds === 'number' && globalRestSeconds > 0) return globalRestSeconds; } catch (e) {}
    return 60;
  }
  function groupe(exs, i) {
    var g = exs[i] && exs[i].ss;
    if (!g) return [i];
    var out = [i], k;
    for (k = i - 1; k >= 0 && exs[k] && exs[k].ss === g; k--) out.unshift(k);
    for (k = i + 1; k < exs.length && exs[k] && exs[k].ss === g; k++) out.push(k);
    return out;
  }

  // ── Styles : aperçu à l'écran + impression ──
  function styles() {
    if (document.getElementById('awakPrintCSS')) return;
    var st = document.createElement('style');
    st.id = 'awakPrintCSS';
    st.textContent =
      '#awakPrintRoot{position:fixed;inset:0;z-index:10400;background:rgba(10,12,16,0.96);display:flex;flex-direction:column;}' +
      '#awakPrintBar{flex-shrink:0;display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.08);}' +
      '#awakPrintBar button{font-family:inherit;cursor:pointer;border-radius:10px;font-weight:800;font-size:0.82em;}' +
      '#awakPrintScroll{flex:1;overflow:auto;padding:14px 10px 30px;-webkit-overflow-scrolling:touch;}' +
      '.awp-sheet{background:#fff!important;color:#111;width:720px;margin:0 auto;padding:26px 24px;border-radius:4px;' +
        'font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.35;box-shadow:0 6px 30px rgba(0,0,0,0.5);}' +
      '.awp-sheet *{color:#111;text-transform:none!important;letter-spacing:normal!important;}' +
      '.awp-sheet .awp-titre{font-size:21px;margin:0 0 2px;font-weight:800;color:#111!important;-webkit-text-fill-color:#111!important;background:none!important;text-shadow:none!important;}' +
      '.awp-meta{font-size:11.5px;color:#444!important;margin-bottom:14px;}' +
      '.awp-sheet table{width:100%;border-collapse:collapse;}' +
      '.awp-sheet th{font-size:10.5px;font-weight:700;text-align:left;border:none!important;border-bottom:2px solid #111!important;padding:5px 4px!important;color:#333!important;background:#fff!important;}' +
      '.awp-sheet td{background:#fff!important;}' +
      '.awp-sheet td{border-bottom:1px solid #bbb;padding:7px 4px;vertical-align:middle;}' +
      '.awp-sheet tr{page-break-inside:avoid;break-inside:avoid;}' +
      '.awp-num{width:22px;font-weight:800;text-align:center;}' +
      '.awp-nom{font-weight:700;}' +
      '.awp-mus{font-size:10.5px;color:#555!important;}' +
      '.awp-case{width:62px;text-align:center;}' +
      '.awp-box{display:inline-block;width:56px;height:26px;border:1px solid #777;border-radius:3px;position:relative;}' +
      '.awp-box span{position:absolute;right:3px;bottom:1px;font-size:8px;color:#888!important;}' +
      '.awp-ss td{background:#f1f1f1;font-size:11px;font-weight:700;padding:5px 6px;border-bottom:1px solid #999;}' +
      '.awp-in td:first-child{border-left:3px solid #111;}' +
      '.awp-img{width:46px;height:46px;object-fit:cover;border-radius:4px;border:1px solid #ccc;display:block;}' +
      '.awp-notes{margin-top:18px;border:1px solid #999;border-radius:4px;height:90px;padding:6px 8px;font-size:10.5px;color:#666!important;}' +
      '.awp-pied{margin-top:10px;display:flex;justify-content:space-between;font-size:10px;color:#777!important;}' +
      '@media print{' +
        '@page{size:A4;margin:12mm;}' +
        // Spécificité renforcée : body.dark-mode impose un dégradé sombre en !important
        'html,html body,html body.dark-mode,html body.in-session{background:#fff!important;background-image:none!important;margin:0!important;padding:0!important;}' +
        'body::before,body::after{display:none!important;}' +
        'body>*:not(#awakPrintRoot){display:none!important;}' +
        '#awakPrintRoot{position:static!important;background:#fff!important;display:block!important;}' +
        '#awakPrintBar{display:none!important;}' +
        '#awakPrintScroll{overflow:visible!important;padding:0!important;}' +
        '.awp-sheet{box-shadow:none!important;width:auto!important;zoom:1!important;padding:0!important;border-radius:0!important;}' +
        '.awp-sheet *{-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '}';
    document.head.appendChild(st);
  }

  // ── Contenu de la feuille ──
  function feuilleHTML(r) {
    var exs = (r.exercises || []).filter(function (e) { return e && e.name; });
    var maxSeries = 1;
    exs.forEach(function (e) { maxSeries = Math.max(maxSeries, parseInt(e.sets, 10) || 1); });
    maxSeries = Math.min(maxSeries, 6);   // au-delà, la feuille déborde
    var u = unite();
    var min = 0;
    try { min = window.AwakRoutineEditor && window.AwakRoutineEditor.estimer ? window.AwakRoutineEditor.estimer(exs) : 0; } catch (e) {}

    var entetes = '';
    for (var s = 1; s <= maxSeries; s++) entetes += '<th class="awp-case">Série ' + s + '</th>';

    function cases(ex) {
      var n = Math.max(1, Math.min(maxSeries, parseInt(ex.sets, 10) || 1));
      var html = '';
      for (var k = 1; k <= maxSeries; k++) {
        if (k > n) { html += '<td class="awp-case"></td>'; continue; }
        html += '<td class="awp-case"><span class="awp-box">' + (estMinute(ex) ? '' : '<span>' + u + ' × reps</span>') + '</span></td>';
      }
      return html;
    }
    function prescription(ex) {
      var n = parseInt(ex.sets, 10) || 1;
      return estMinute(ex) ? n + ' × ' + duree(ex.duration || 45) : n + ' × ' + (parseInt(ex.reps, 10) || 10) + ' reps';
    }
    function image(ex) {
      if (!avecImages) return '';
      var src = window.EXERCISE_IMAGES && window.EXERCISE_IMAGES[ex.name];
      return '<td style="width:52px;">' + (src ? '<img class="awp-img" src="' + esc(src) + '" alt="">' : '') + '</td>';
    }

    var lignes = '', num = 0, i = 0;
    var cols = 4 + maxSeries + (avecImages ? 1 : 0);
    while (i < exs.length) {
      var mem = groupe(exs, i);
      if (mem.length > 1 && mem[0] === i) {
        var tours = parseInt(exs[i].sets, 10) || 3;
        var rt = parseInt(exs[i].repos, 10) || reposGlobal();
        lignes += '<tr class="awp-ss"><td colspan="' + cols + '">Superset ' +
          mem.map(function (m, p) { return LETTRES[p] || '•'; }).join('-') +
          ' · ' + tours + ' tours · enchaîner sans repos, puis ' + duree(rt) + ' de repos entre les tours</td></tr>';
        mem.forEach(function (m, p) {
          var ex = exs[m];
          lignes += '<tr class="awp-in">' +
            '<td class="awp-num">' + (LETTRES[p] || '•') + '</td>' + image(ex) +
            '<td><div class="awp-nom">' + esc(ex.name) + '</div><div class="awp-mus">' + esc(ex.muscle || '') + '</div></td>' +
            '<td>' + (estMinute(ex) ? duree(ex.duration || 45) : (parseInt(ex.reps, 10) || 10) + ' reps') + '</td>' +
            '<td>—</td>' + cases(ex) + '</tr>';
        });
        i = mem[mem.length - 1] + 1;
        continue;
      }
      var ex = exs[i];
      num++;
      lignes += '<tr>' +
        '<td class="awp-num">' + num + '</td>' + image(ex) +
        '<td><div class="awp-nom">' + esc(ex.name) + '</div><div class="awp-mus">' + esc(ex.muscle || '') + '</div></td>' +
        '<td>' + esc(prescription(ex)) + '</td>' +
        '<td>' + ((parseInt(ex.sets, 10) || 1) > 1 ? duree(ex.repos || reposGlobal()) : '—') + '</td>' +
        cases(ex) + '</tr>';
      i++;
    }

    return '<div class="awp-sheet">' +
        '<div class="awp-titre">' + esc(r.name || 'Routine') + '</div>' +
        '<div class="awp-meta">' + exs.length + ' exercice' + (exs.length > 1 ? 's' : '') +
          (min ? ' · durée estimée ≈ ' + min + ' min' : '') + ' · charges en ' + u + '</div>' +
        '<table><thead><tr><th class="awp-num">#</th>' + (avecImages ? '<th></th>' : '') +
          '<th>Exercice</th><th>Séries</th><th>Repos</th>' + entetes + '</tr></thead>' +
        '<tbody>' + lignes + '</tbody></table>' +
        '<div class="awp-notes">Notes</div>' +
        '<div class="awp-pied"><span>Date : ____ / ____ / ________</span><span>Awakened</span></div>' +
      '</div>';
  }

  function rendre() {
    var root = document.getElementById('awakPrintRoot');
    if (!root) return;
    var rs = (typeof window.getRoutines === 'function') ? window.getRoutines() : [];
    var r = rs[idxCourant];
    if (!r) { fermer(); return; }
    var hote = document.getElementById('awakPrintScroll');
    hote.innerHTML = feuilleHTML(r);
    // Aperçu : la feuille garde sa largeur A4 et est RÉDUITE pour tenir à
    // l'écran (au lieu d'un tableau coupé à droite sur téléphone).
    var f = hote.querySelector('.awp-sheet');
    if (f) f.style.zoom = String(Math.min(1, (window.innerWidth - 20) / 720));
  }

  function ouvrir(index) {
    var rs = (typeof window.getRoutines === 'function') ? window.getRoutines() : [];
    if (!rs[index]) return;
    if (!rs[index].exercises || !rs[index].exercises.length) {
      if (typeof window.showToast === 'function') window.showToast('Cette routine est vide', 'warning', 2000);
      return;
    }
    idxCourant = index;
    styles();
    fermer();
    var root = document.createElement('div');
    root.id = 'awakPrintRoot';
    root.innerHTML =
      '<div id="awakPrintBar">' +
        '<button onclick="AwakRoutinePrint.fermer()" aria-label="Fermer" style="background:none;border:1px solid rgba(255,255,255,0.15);color:#cbd5e1;padding:8px 12px;">Fermer</button>' +
        '<label style="flex:1;display:flex;align-items:center;justify-content:center;gap:7px;color:#cbd5e1;font-size:0.8em;font-weight:700;cursor:pointer;">' +
          '<input type="checkbox" ' + (avecImages ? 'checked ' : '') + 'onchange="AwakRoutinePrint.images(this.checked)" style="width:18px;height:18px;min-height:0!important;">Images</label>' +
        '<button onclick="AwakRoutinePrint.imprimer()" style="background:#e2e8f0;border:none;color:#0b1220;padding:9px 16px;">Imprimer</button>' +
      '</div>' +
      '<div id="awakPrintScroll"></div>';
    document.body.appendChild(root);
    rendre();
  }

  function fermer() {
    var r = document.getElementById('awakPrintRoot');
    if (r) r.remove();
  }

  function imprimer() {
    // Laisser les images se charger avant d'ouvrir la fenêtre d'impression
    var imgs = document.querySelectorAll('#awakPrintRoot img');
    var attente = 0;
    for (var i = 0; i < imgs.length; i++) if (!imgs[i].complete) attente = 700;
    setTimeout(function () {
      try { window.print(); }
      catch (e) {
        if (typeof window.showToast === 'function') window.showToast('Impression indisponible sur cet appareil', 'warning', 2600);
      }
    }, attente);
  }

  window.AwakRoutinePrint = {
    ouvrir: ouvrir,
    fermer: fermer,
    imprimer: imprimer,
    images: function (on) { avecImages = !!on; rendre(); }
  };
})();
