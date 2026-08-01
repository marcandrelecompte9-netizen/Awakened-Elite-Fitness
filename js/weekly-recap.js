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
        volume += w.volume || 0;
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

      var stat = function (val, lbl) {
        return '<div style="flex:1;text-align:center;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 4px;">'
          + '<div style="font-size:1.3em;font-weight:900;color:white;">' + val + '</div>'
          + '<div style="font-size:0.56em;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">' + lbl + '</div></div>';
      };

      var html = '';
      html += '<div style="display:flex;gap:8px;margin-bottom:12px;">'
        + stat(nSessions, 'Séance' + (nSessions > 1 ? 's' : ''))
        + stat(volume >= 1000 ? (volume / 1000).toFixed(1) + ' t' : Math.round(volume) + ' kg', 'Volume')
        + stat(Math.round(minutes) + ' min', 'Durée')
        + '</div>';
      if (topQual.length) {
        html += uiCard(
          '<div style="font-size:0.62em;color:#94a3b8;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px;">Qualités nourries cette semaine</div>'
          + '<div style="font-size:0.95em;font-weight:800;color:#e2e8f0;">'
          + topQual.map(function (x) { return x.q.ic + ' <span style="color:' + x.q.col + ';">' + x.q.nm + '</span>'; }).join('  ·  ')
          + '</div>');
      }
      if (topMuscles.length) {
        html += uiCard(
          '<div style="font-size:0.62em;color:#94a3b8;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px;">Muscles les plus travaillés</div>'
          + '<div style="font-size:0.88em;font-weight:700;color:#e2e8f0;">' + topMuscles.join(' · ') + '</div>');
      }
      if (arch) {
        html += uiCard(
          '<div style="font-size:0.62em;color:#94a3b8;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px;">Ton archétype</div>'
          + '<div style="font-size:1.05em;font-weight:900;color:#eafff0;">' + arch.name + '</div>'
          + '<div style="font-size:0.66em;color:#94a3b8;margin-top:2px;">' + arch.sub + '</div>',
          'cursor:pointer;', '');
      }
      html += '<button onclick="document.getElementById(\'weeklyRecapOverlay\').remove(); if (typeof showAwakeningTree===\'function\') setTimeout(showAwakeningTree, 120);" style="width:100%;padding:13px;margin-top:6px;background:linear-gradient(135deg,#22c55e,#16a34a);border:none;border-radius:14px;color:#fff;font-weight:900;cursor:pointer;">🌳 Voir mon arbre</button>';

      var s = uiBottomSheet({ id: 'weeklyRecapOverlay', icon: '📅', title: label, subtitle: 'Ce que ton effort a construit.', accent: '#22c55e', center: true });
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
      var key = prevMonday.toISOString().slice(0, 10);
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
