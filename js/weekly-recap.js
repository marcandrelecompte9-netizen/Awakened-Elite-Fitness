if (typeof window.awakJourLocal !== 'function') window.awakJourLocal = function (d) { var x = d ? new Date(d) : new Date(); if (isNaN(x)) x = new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
/* ============================================================
   RÉCAP HEBDOMADAIRE — « Ta semaine »
   S'ouvre une fois par semaine (à partir du lundi) si la semaine
   précédente contient au moins une séance. Résume : séances,
   volume, durée, top muscles, qualités nourries, archétype.
   Construit avec ui-kit.js ; lit workoutHistory + les fonctions
   exposées par awakening-tree.js.
   ============================================================ */
(function () {
  "use strict";

  function _hist() {
    try {
      var pid = (typeof getCurrentProfileId === 'function') ? getCurrentProfileId() : null;
      var saved = (pid && typeof getProfileData === 'function') ? getProfileData(pid, 'workoutHistory') : localStorage.getItem('workoutHistory');
      var h = JSON.parse(saved || '[]');
      return Array.isArray(h) ? h : [];
    } catch (e) { return []; }
  }

  function _mondayOf(d) {
    var m = new Date(d);
    m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
    m.setHours(0, 0, 0, 0);
    return m;
  }

  // Récap de la semaine PRÉCÉDENTE (par défaut) ou courante (mode 'current')
  function showWeeklyRecap(mode) {
    try {
      var now = new Date();
      var thisMonday = _mondayOf(now);
      var start, end, label;
      if (mode === 'current') {
        start = thisMonday; end = now; label = 'Ta semaine en cours';
      } else {
        end = new Date(thisMonday);
        start = new Date(thisMonday); start.setDate(start.getDate() - 7);
        label = 'Ta semaine';
      }
      var entries = _hist().filter(function (w) {
        if (!w || !w.date) return false;
        var d = new Date(w.date);
        return d >= start && d < end;
      });
      if (!entries.length) {
        if (typeof showToast === 'function') showToast('Aucune séance sur cette période.', 'info', 2500);
        return;
      }

      var nSessions = entries.length;
      var volume = 0, minutes = 0, muscles = {};
      var qual = { force: 0, endurance: 0, mental: 0, equilibre: 0, agilite: 0, cardio: 0 };
      entries.forEach(function (w) {
        volume += window.awakVolKg ? awakVolKg(w) : (w.volume || 0);   // v1311 : en kg
        minutes += w.duration || 0;
        (w.muscles || []).forEach(function (m) { if (m && m !== 'Cardio') muscles[m] = (muscles[m] || 0) + 1; });
        if (typeof window.awakQualitiesOfExercises === 'function' && w.workoutData && w.workoutData.exercises) {
          var v = window.awakQualitiesOfExercises(w.workoutData.exercises);
          for (var k in v) qual[k] += v[k];
        }
      });
      var topMuscles = Object.keys(muscles).sort(function (a, b) { return muscles[b] - muscles[a]; }).slice(0, 3);
      var META = window.AWAK_QUALITIES_META || [];
      var topQual = META.map(function (q) { return { q: q, v: qual[q.id] || 0 }; })
        .filter(function (x) { return x.v > 0.05; })
        .sort(function (a, b) { return b.v - a.v; }).slice(0, 2);
      var arch = (typeof window.awakArchetype === 'function' && typeof window.awakComputeQualities === 'function')
        ? window.awakArchetype(window.awakComputeQualities()) : null;

      // v1429 : couleurs du système visuel (cyan, surfaces #12161c), plus de vert
      var stat = function (val, lbl) {
        return '<div style="flex:1;min-width:0;text-align:center;background:#12161c;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:12px 4px;">'
          + '<div style="font-size:19px;font-weight:900;color:#67e8f9;font-variant-numeric:tabular-nums;white-space:nowrap;">' + val + '</div>'
          + '<div style="font-size:11px;color:#8d9cb1;font-weight:700;margin-top:3px;">' + lbl + '</div></div>';
      };
      var titre = function (t) { return '<div style="font-size:11px;color:#8d9cb1;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">' + t + '</div>'; };

      var html = '';
      html += '<div style="display:flex;gap:8px;margin-bottom:12px;">'
        + stat(nSessions, 'Séance' + (nSessions > 1 ? 's' : ''))
        + stat((function () {   // v1311 : affiché dans l'unité choisie
            var lb = typeof weightUnit === 'function' && weightUnit() === 'lbs', v = lb ? volume * 2.20462 : volume;
            return lb ? (v >= 10000 ? (v / 1000).toFixed(1) + 'k lbs' : Math.round(v) + ' lbs') : (v >= 1000 ? (v / 1000).toFixed(1) + ' t' : Math.round(v) + ' kg');
          })(), 'Volume')
        + stat(Math.round(minutes) + ' min', 'Durée')
        + '</div>';
      if (topQual.length) {
        html += uiCard(
          titre('Qualités nourries cette semaine')
          + '<div style="display:flex;flex-wrap:wrap;gap:6px;">'
          + topQual.map(function (x) { return '<span style="padding:5px 11px;border-radius:99px;font-size:13px;font-weight:800;color:' + x.q.col + ';background:' + x.q.col + '1a;border:1px solid ' + x.q.col + '55;">' + x.q.nm + '</span>'; }).join('')
          + '</div>');
      }
      if (topMuscles.length) {
        html += uiCard(
          titre('Muscles les plus travaillés')
          + '<div style="font-size:14px;font-weight:700;color:#e2e8f0;">' + topMuscles.join(' · ') + '</div>');
      }
      if (arch) {
        html += uiCard(
          titre('Ton archétype')
          + '<div style="font-size:16px;font-weight:900;color:#f1f5f9;">' + arch.name + '</div>'
          + '<div style="font-size:12.5px;color:#a3b1c2;margin-top:2px;">' + arch.sub + '</div>',
          'cursor:pointer;', '');
      }
      html += '<button onclick="document.getElementById(\'weeklyRecapOverlay\').remove(); if (typeof showAwakeningTree===\'function\') setTimeout(showAwakeningTree, 120);" style="width:100%;padding:13px;margin-top:6px;background:linear-gradient(135deg,#22d3ee,#0891b2);border:none;border-radius:14px;color:#04121f;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 6px 18px rgba(34,211,238,0.25);">Voir mon arbre</button>';

      var s = uiBottomSheet({ id: 'weeklyRecapOverlay', icon: (window.AwakIcon && AwakIcon.get('calendrier', 28, '#22d3ee')) || '', title: label, subtitle: 'Ce que ton effort a construit.', accent: '#22d3ee', center: true });
      s.body.innerHTML = html + uiCloseButton('weeklyRecapOverlay');
      s.mount();
    } catch (e) {}
  }
  window.showWeeklyRecap = showWeeklyRecap;

  // ── Déclenchement automatique : une fois par semaine, si séances la semaine passée ──
  function _autoRecap() {
    try {
      if (localStorage.getItem('fitproOnboardingDone') !== '1') return;
      var lastMonday = _mondayOf(new Date());
      var prevMonday = new Date(lastMonday); prevMonday.setDate(prevMonday.getDate() - 7);
      var key = awakJourLocal(prevMonday);
      if (localStorage.getItem('awakRecapShown') === key) return;
      var hasSessions = _hist().some(function (w) {
        if (!w || !w.date) return false;
        var d = new Date(w.date);
        return d >= prevMonday && d < lastMonday;
      });
      if (!hasSessions) { localStorage.setItem('awakRecapShown', key); return; }
      localStorage.setItem('awakRecapShown', key);
      showWeeklyRecap();
    } catch (e) {}
  }
  if (document.readyState === 'complete') setTimeout(_autoRecap, 1800);
  else window.addEventListener('load', function () { setTimeout(_autoRecap, 1800); });
})();
