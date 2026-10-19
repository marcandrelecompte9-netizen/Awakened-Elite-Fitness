// v1410 — Bilan automatique des 4 dernières semaines (Accueil).
// Apparaît une fois toutes les 4 semaines (dès 28 jours après la 1re séance),
// jusqu'à ce qu'on appuie sur « Vu ». Ne montre QUE des données réelles :
// régularité, évolution des charges / répétitions (AwakAnalyse.tendances),
// mensurations et photos si elles existent, puis une prochaine étape.
(function () {
  'use strict';
  var DAY = 86400000, CYCLE = 28;
  var C = { bleu: '#60a8f0', clair: '#93c5fd', violet: '#a78bfa', ambre: '#f59e0b', gris: '#94a3b8' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ico(n, t, c) { try { return (window.AwakIcon && AwakIcon.get(n, t, c)) || ''; } catch (e) { return ''; } }
  function cle() { try { return window._cleProfil('awakBilan4Vu'); } catch (e) { return 'awakBilan4Vu'; } }
  function enfant() { try { return !!(window.AwakYouth && AwakYouth.isChild && AwakYouth.isChild()); } catch (e) { return false; } }
  function hist() { try { return (typeof getWorkoutHistory === 'function' ? getWorkoutHistory() : []) || []; } catch (e) { return []; } }
  function ts(h) { return Date.parse(h && (h.date || h.completedAt || h.timestamp) || ''); }
  function virg(x) { return String(Math.round(x * 10) / 10).replace('.', ','); }
  function nom(n) { try { return typeof window.awakNom === 'function' ? window.awakNom(n) : n; } catch (e) { return n; } }

  function du(force) {
    var H = hist(), now = Date.now();
    var T = H.map(ts).filter(function (t) { return !isNaN(t); });
    if (!T.length) return false;
    if (force) return true;
    var premier = Math.min.apply(null, T);
    if (now - premier < CYCLE * DAY) return false;
    var vu = 0; try { vu = parseInt(localStorage.getItem(cle()), 10) || 0; } catch (e) {}
    return !vu || now - vu >= CYCLE * DAY;
  }

  function donnees() {
    var now = Date.now(), H = hist();
    var R = H.filter(function (h) { var t = ts(h); return !isNaN(t) && now - t < CYCLE * DAY; });
    var semaines = [0, 0, 0, 0];
    R.forEach(function (h) { var i = Math.floor((now - ts(h)) / (7 * DAY)); if (i >= 0 && i < 4) semaines[i]++; });
    var visee = 3;
    try { var s = window.AwakHomePro && AwakHomePro.semaine && AwakHomePro.semaine(); if (s && s.visee) visee = s.visee; } catch (e) {}
    var d = { n: R.length, actives: semaines.filter(function (x) { return x > 0; }).length, visee4: visee * 4, visee: visee, prog: [], stables: 0, plateau: null, mesures: [], photos: null };
    if (!enfant()) {
      try {
        var TT = (window.AwakAnalyse && AwakAnalyse.tendances) ? AwakAnalyse.tendances() : [];
        TT.forEach(function (t) {
          if (t.pct === null) return;
          if (t.pct >= 2) d.prog.push(t); else if (t.pct > -3) d.stables++;
          if (t.plateau && !d.plateau) d.plateau = t;
        });
        d.prog.sort(function (a, b) { return b.pct - a.pct; });
        d.prog = d.prog.slice(0, 3);
      } catch (e) {}
      // Mensurations : la plus récente vs celle d'il y a ~4 semaines (entre 3 et 8 semaines)
      try {
        var M = (typeof window.getBodyMeasurements === 'function' ? window.getBodyMeasurements() : []) || [];
        M = M.filter(function (m) { return m && !isNaN(Date.parse(m.date)); }).sort(function (a, b) { return Date.parse(b.date) - Date.parse(a.date); });
        var recent = M[0], ancien = M.filter(function (m) { var a = now - Date.parse(m.date); return a >= 21 * DAY && a <= 56 * DAY; })[0];
        if (recent && ancien && recent !== ancien && now - Date.parse(recent.date) < 21 * DAY) {
          var up = (typeof window.weightUnit === 'function' ? window.weightUnit() : 'lbs');
          var val = function (m, k) {
            if (k === 'weight') { try { return typeof window.awakMesurePoids === 'function' ? window.awakMesurePoids(m) : parseFloat(m.weight); } catch (e) { return parseFloat(m.weight); } }
            return parseFloat(m[k]);
          };
          [['weight', 'Poids', up], ['waist', 'Tour de taille', 'po'], ['hips', 'Tour de hanches', 'po'], ['biceps', 'Biceps', 'po'], ['thighs', 'Cuisses', 'po']].forEach(function (c) {
            var a = val(ancien, c[0]), b = val(recent, c[0]);
            if (isNaN(a) || isNaN(b) || a == null || b == null || !a) return;
            d.mesures.push({ lbl: c[1], u: c[2], a: a, b: b, ecart: b - a });
          });
        }
        d.aMesures = M.length > 0;
      } catch (e) {}
      try {
        var G = (window.AwakPhotoMesures && AwakPhotoMesures.groupes) ? AwakPhotoMesures.groupes() : [];
        var gRec = G.filter(function (g) { return now - Date.parse(g.date) < CYCLE * DAY; });
        var gAnc = G.filter(function (g) { return now - Date.parse(g.date) >= 21 * DAY; });
        d.photos = { recentes: gRec.length, total: G.length, comparer: (gRec[0] && gAnc[0] && gRec[0].cle !== gAnc[0].cle) ? [gAnc[0].cle, gRec[0].cle] : null };
      } catch (e) {}
    }
    return d;
  }

  function etape(d) {
    if (d.n < Math.ceil(d.visee4 * 0.75)) return { t: 'Vise ' + d.visee + ' séance' + (d.visee > 1 ? 's' : '') + ' par semaine pendant les 4 prochaines semaines. Place-les dans le Calendrier : un jour fixe aide à ne pas sauter.', b: 'Ouvrir le Calendrier', f: "switchTab('calendar')" };
    if (d.plateau) return { t: nom(d.plateau.nom) + ' stagne : change de variante ou de schéma de séries pendant 3 semaines.', b: '', f: '' };
    if (!enfant() && !d.aMesures && !(d.photos && d.photos.total)) return { t: 'Note tes mensurations ou prends une photo aujourd\'hui : le prochain bilan pourra les comparer.', b: 'Photo et mesures', f: 'AwakPhotoMesures.seance()' };
    if (d.prog.length) return { t: 'Garde ce rythme. Quand toutes les séries passent, ajoute un peu de charge ou une répétition.', b: '', f: '' };
    return { t: 'Ta régularité est là. Refais les mêmes exercices quelques semaines : tes progrès de charge apparaîtront ici.', b: '', f: '' };
  }

  function ligne(gauche, droite, coul) {
    return '<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.78em;">'
      + '<span style="color:#e2e8f0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + gauche + '</span>'
      + '<span style="font-weight:800;color:' + (coul || '#e2e8f0') + ';white-space:nowrap;">' + droite + '</span></div>';
  }
  function titre(t, n) { return '<div style="display:flex;align-items:center;gap:6px;font-size:0.66em;font-weight:800;letter-spacing:1px;color:' + C.clair + ';text-transform:uppercase;margin:12px 0 4px;">' + ico(n, 13, C.clair) + '<span>' + t + '</span></div>'; }

  function html(d) {
    var pct = Math.max(3, Math.min(100, Math.round(d.n / Math.max(1, d.visee4) * 100)));
    var h = '<div style="background:linear-gradient(160deg,rgba(96,168,240,0.12),rgba(96,168,240,0.03));border:1px solid rgba(96,168,240,0.35);border-radius:16px;padding:15px 16px;">'
      + '<div style="display:flex;align-items:center;gap:9px;">' + ico('stats', 20, C.clair)
      + '<div style="flex:1;min-width:0;"><div style="font-weight:900;color:#f8fafc;font-size:0.98em;">Bilan de tes 4 semaines</div><div style="font-size:0.66em;color:' + C.gris + ';font-weight:700;">28 derniers jours</div></div>'
      + '<button type="button" data-bilan-vu style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#cbd5e1;border-radius:8px;padding:5px 11px;font-size:0.7em;font-weight:800;cursor:pointer;">Vu</button></div>';
    // Régularité
    h += titre('Régularité', 'calendrier')
      + '<div style="display:flex;align-items:baseline;justify-content:space-between;"><span style="font-size:1.25em;font-weight:900;color:#fff;">' + d.n + ' séance' + (d.n > 1 ? 's' : '') + '</span>'
      + '<span style="font-size:0.72em;color:' + C.gris + ';">objectif ≈ ' + d.visee4 + ' · ' + d.actives + ' / 4 semaines actives</span></div>'
      + '<div style="height:7px;border-radius:99px;background:rgba(255,255,255,0.08);margin:7px 0 2px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:' + C.bleu + ';border-radius:99px;"></div></div>';
    // Charges / répétitions
    if (!enfant()) {
      h += titre('Charges et répétitions', 'halter');
      if (d.prog.length) {
        h += d.prog.map(function (t) { return ligne(esc(nom(t.nom)), '+' + t.pct + ' %', C.clair); }).join('');
        if (d.stables) h += '<div style="font-size:0.7em;color:' + C.gris + ';margin-top:5px;">' + d.stables + ' autre' + (d.stables > 1 ? 's' : '') + ' exercice' + (d.stables > 1 ? 's' : '') + ' stable' + (d.stables > 1 ? 's' : '') + '.</div>';
        h += '<div style="font-size:0.64em;color:#64748b;margin-top:4px;">Meilleure série des 4 dernières semaines comparée aux 4 d\'avant.</div>';
      } else if (d.stables) {
        h += '<div style="font-size:0.76em;color:#cbd5e1;line-height:1.45;">' + d.stables + ' exercice' + (d.stables > 1 ? 's' : '') + ' suivi' + (d.stables > 1 ? 's' : '') + ', stable' + (d.stables > 1 ? 's' : '') + ' pour l\'instant.</div>';
      } else {
        h += '<div style="font-size:0.76em;color:' + C.gris + ';line-height:1.45;">Pas encore assez de données : il faut les mêmes exercices sur 8 semaines pour comparer.</div>';
      }
      // Corps
      if (d.mesures.length || (d.photos && d.photos.recentes)) {
        h += titre('Corps', 'personne');
        h += d.mesures.map(function (m) {
          var e = m.ecart, s = Math.abs(e) < 0.05 ? '= ' + virg(m.b) + ' ' + m.u : (e > 0 ? '+' : '−') + virg(Math.abs(e)) + ' ' + m.u;
          return ligne(esc(m.lbl) + ' <span style="color:#64748b;">' + virg(m.a) + ' → ' + virg(m.b) + '</span>', s, '#e2e8f0');
        }).join('');
        if (d.photos && d.photos.recentes) {
          h += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;font-size:0.74em;color:#cbd5e1;">'
            + '<span>' + d.photos.recentes + ' séance' + (d.photos.recentes > 1 ? 's' : '') + ' photo ce mois-ci</span>'
            + (d.photos.comparer ? '<button type="button" data-bilan-photos style="background:rgba(96,168,240,0.14);border:1px solid rgba(96,168,240,0.45);color:' + C.clair + ';border-radius:8px;padding:5px 10px;font-size:0.95em;font-weight:800;cursor:pointer;">Comparer</button>' : '')
            + '</div>';
        }
      }
    }
    // Prochaine étape
    var et = etape(d);
    h += titre('Prochaine étape', 'cible')
      + '<div style="font-size:0.78em;color:#e2e8f0;line-height:1.5;">' + esc(et.t) + '</div>'
      + (et.b ? '<button type="button" data-bilan-go style="margin-top:9px;width:100%;padding:10px;border-radius:10px;border:1px solid rgba(96,168,240,0.5);background:rgba(96,168,240,0.14);color:' + C.clair + ';font-weight:800;font-size:0.8em;cursor:pointer;">' + esc(et.b) + '</button>' : '');
    h += '</div>';
    return { h: h, et: et };
  }

  function vu() { try { localStorage.setItem(cle(), String(Date.now())); } catch (e) {} }

  // hote : conteneur de l'Accueil (ahpAvant). force : mode dev / test.
  function monter(hote, force) {
    var vieux = document.getElementById('awakBilan4'); if (vieux) vieux.remove();
    if (!hote || !du(force)) return null;
    var d = donnees(), r = html(d);
    var c = document.createElement('div');
    c.id = 'awakBilan4';
    c.innerHTML = r.h;
    hote.insertBefore(c, hote.firstChild);
    var b = c.querySelector('[data-bilan-vu]'); if (b) b.onclick = function () { vu(); c.remove(); };
    var g = c.querySelector('[data-bilan-go]');
    if (g) g.onclick = function () { vu(); c.remove(); try { (new Function(r.et.f))(); } catch (e) {} };
    var p = c.querySelector('[data-bilan-photos]');
    if (p) p.onclick = function () { try { AwakPhotoMesures.comparerGroupes(d.photos.comparer[0], d.photos.comparer[1]); } catch (e) {} };
    return c;
  }

  window.AwakBilan4 = { du: du, donnees: donnees, monter: monter, _vu: vu };
})();
