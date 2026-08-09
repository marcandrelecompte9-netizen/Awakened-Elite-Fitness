/* ═══════════════════════════════════════════════════════════════════
   MODE DOULEUR — adapter la séance en évitant une zone qui fait mal
   ───────────────────────────────────────────────────────────────────
   L'utilisateur signale une ou plusieurs zones douloureuses (ex : « bras »).
   La séance générée évite alors ces muscles — pas seulement comme cible, mais
   aussi comme muscle SECONDAIRE (un développé couché sollicite les triceps,
   donc on l'écarte si le bras fait mal).
   État valable pour la séance du jour (clé locale, réinitialisable).
   Ce n'est pas un avis médical : en cas de douleur forte ou persistante,
   consulter un professionnel de santé.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ⚠️ ZONES DOULOUREUSES PAR PROFIL (v663). Auparavant la clé était GLOBALE :
  // une douleur signalée par un membre restreignait les séances de TOUS les
  // autres. Protection par excès, mais absurde — l'épaule sensible du père
  // privait sa fille d'exercices d'épaules.
  // La clé est maintenant préfixée par le profil actif. Une MIGRATION unique
  // reprend l'ancienne clé globale au profit du profil courant, pour ne perdre
  // aucun signalement en cours.
  var LEGACY_KEY = 'awakPainZones';
  function KEY() {
    try {
      var pid = (typeof window.getCurrentProfileId === 'function') ? window.getCurrentProfileId() : null;
      return pid ? ('profile_' + pid + '_awakPainZones') : LEGACY_KEY;
    } catch (e) { return LEGACY_KEY; }
  }
  // Reprise unique de l'ancienne clé globale vers le profil actif.
  function _migrer() {
    try {
      var ancien = localStorage.getItem(LEGACY_KEY);
      if (!ancien) return;
      var cible = KEY();
      if (cible === LEGACY_KEY) return;            // profil inconnu : on attend
      if (!localStorage.getItem(cible)) localStorage.setItem(cible, ancien);
      localStorage.removeItem(LEGACY_KEY);
    } catch (e) {}
  }

  // Zones proposées → muscles (dbName) qu'elles recouvrent.
  var ZONES = [
    { id: 'bras',    label: 'Bras',            emoji: '💪', muscles: ['Biceps', 'Triceps', 'Avant-bras'] },
    { id: 'epaules', label: 'Épaules',         emoji: '🤷', muscles: ['Épaules', 'Trapèzes'] },
    { id: 'poitrine',label: 'Poitrine',        emoji: '🫁', muscles: ['Pectoraux'] },
    { id: 'dos',     label: 'Dos',             emoji: '🦴', muscles: ['Dos', 'Trapèzes'] },
    { id: 'abdos',   label: 'Ventre',          emoji: '🔥', muscles: ['Abdominaux', 'Obliques'] },
    { id: 'jambes',  label: 'Jambes',          emoji: '🦵', muscles: ['Quadriceps', 'Ischio-jambiers', 'Mollets', 'Fessiers', 'Adducteurs'] },
    { id: 'poignets',label: 'Poignets / mains',emoji: '✋', muscles: ['Avant-bras'] },
    { id: 'genoux',  label: 'Genoux',          emoji: '🦿', muscles: ['Quadriceps', 'Ischio-jambiers', 'Mollets'] }
  ];


  // 🧍 Correspondance muscle (silhouette) → zone de douleur.
  var MUSCLE_TO_ZONE = {
    'Biceps':'bras', 'Triceps':'bras', 'Avant-bras':'bras',
    'Épaules':'epaules', 'Trapèzes':'epaules',
    'Pectoraux':'poitrine', 'Dos':'dos',
    'Abdominaux':'abdos', 'Obliques':'abdos',
    'Quadriceps':'jambes', 'Ischio-jambiers':'jambes', 'Mollets':'jambes',
    'Fessiers':'jambes', 'Adducteurs':'jambes'
  };
  // Clic sur un muscle du personnage → bascule la zone correspondante.
  window.AwakPainToggleMuscle = function (muscleName) {
    var zid = MUSCLE_TO_ZONE[muscleName];
    if (zid) window.AwakPainToggle(zid);
  };
  // Rallume sur le personnage tous les muscles des zones actives.
  function _paintBody() {
    if (!window._mmpHighlight) return;
    var active = _load();
    for (var m in MUSCLE_TO_ZONE) {
      window._mmpHighlight(m, active.indexOf(MUSCLE_TO_ZONE[m]) !== -1);
    }
  }

  function _load() {
    try {
      _migrer();
      var raw = localStorage.getItem(KEY());
      if (!raw) return [];
      var a = JSON.parse(raw);
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  function _save(a) { try { _migrer(); localStorage.setItem(KEY(), JSON.stringify(a || [])); } catch (e) {} }

  function activeZones() { return _load(); }

  // Zones douloureuses d'un AUTRE profil — nécessaire aux jeux à deux, où il
  // faut protéger les deux joueurs et pas seulement celui qui tient l'appareil.
  function zonesOf(profileId) {
    if (!profileId) return [];
    try {
      var raw = localStorage.getItem('profile_' + profileId + '_awakPainZones');
      var a = raw ? JSON.parse(raw) : [];
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  // Un exercice touche-t-il une zone douloureuse de l'un des profils fournis ?
  function exerciseHitsPainFor(ex, profileIds) {
    if (!ex) return false;
    var zones = [];
    (profileIds || []).forEach(function (id) {
      zonesOf(id).forEach(function (z) { if (zones.indexOf(z) === -1) zones.push(z); });
    });
    if (!zones.length) return false;
    var muscles = [];
    zones.forEach(function (zid) {
      var z = zoneById(zid);
      if (z) z.muscles.forEach(function (m) { if (muscles.indexOf(m) === -1) muscles.push(m); });
    });
    if (!muscles.length) return false;
    if (ex.muscle && muscles.indexOf(ex.muscle) !== -1) return true;
    if (Array.isArray(ex.secondaryMuscles)) {
      for (var i = 0; i < ex.secondaryMuscles.length; i++) {
        var sm = ex.secondaryMuscles[i];
        var nom = (sm && sm.muscle) ? sm.muscle : sm;
        if (nom && muscles.indexOf(nom) !== -1) return true;
      }
    }
    return false;
  }
  function isActive() { return _load().length > 0; }
  function clear() { try { localStorage.removeItem(KEY()); localStorage.removeItem(LEGACY_KEY); } catch (e) {} }

  function toggleZone(id) {
    var a = _load();
    var i = a.indexOf(id);
    if (i === -1) a.push(id); else a.splice(i, 1);
    _save(a);
    return a;
  }

  function zoneById(id) {
    for (var i = 0; i < ZONES.length; i++) if (ZONES[i].id === id) return ZONES[i];
    return null;
  }

  // Ensemble des muscles (dbName) à éviter, d'après les zones actives.
  function painfulMuscles() {
    var set = {};
    _load().forEach(function (zid) {
      var z = zoneById(zid);
      if (z) z.muscles.forEach(function (m) { set[m] = true; });
    });
    return Object.keys(set);
  }

  // Un muscle donné est-il douloureux ?
  function isMusclePainful(muscleName) {
    return painfulMuscles().indexOf(muscleName) !== -1;
  }

  // Un exercice sollicite-t-il un muscle douloureux (principal OU secondaire) ?
  function exerciseHitsPain(ex) {
    if (!ex) return false;
    var painful = painfulMuscles();
    if (!painful.length) return false;
    if (ex.muscle && painful.indexOf(ex.muscle) !== -1) return true;
    if (Array.isArray(ex.secondaryMuscles)) {
      for (var i = 0; i < ex.secondaryMuscles.length; i++) {
        var sm = ex.secondaryMuscles[i];
        var name = (sm && sm.muscle) ? sm.muscle : sm;
        if (name && painful.indexOf(name) !== -1) return true;
      }
    }
    return false;
  }

  // Filtrer une liste de noms de muscles cibles en retirant les douloureux.
  function filterTargetMuscles(muscleNames) {
    if (!Array.isArray(muscleNames)) return muscleNames;
    var painful = painfulMuscles();
    if (!painful.length) return muscleNames;
    return muscleNames.filter(function (m) { return painful.indexOf(m) === -1; });
  }

  window.AwakPain = {
    ZONES: ZONES,
    activeZones: activeZones,
    isActive: isActive,
    clear: clear,
    toggleZone: toggleZone,
    zoneById: zoneById,
    painfulMuscles: painfulMuscles,
    isMusclePainful: isMusclePainful,
    exerciseHitsPain: exerciseHitsPain,
    zonesOf: zonesOf,
    exerciseHitsPainFor: exerciseHitsPainFor,
    filterTargetMuscles: filterTargetMuscles
  };

  // ═══════════════════════════════════════════════════════════════════
  // INTERFACE — bouton d'accueil + modale de sélection des zones
  // ═══════════════════════════════════════════════════════════════════
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Bouton à afficher sur l'accueil (rempli par updatePainButton).
  function renderButton() {
    var active = _load();
    if (active.length > 0) {
      var names = active.map(function (id) { var z = zoneById(id); return z ? z.emoji + ' ' + z.label : ''; }).filter(Boolean).join(', ');
      return '<button onclick="AwakPainOpen()" style="width:100%;padding:13px 15px;border:1px solid rgba(245,158,11,0.5);border-radius:14px;cursor:pointer;background:rgba(245,158,11,0.1);color:#f59e0b;font-weight:800;font-size:0.86em;text-align:left;display:flex;align-items:center;gap:10px;">'
        + '<span style="font-size:1.3em;">🤕</span>'
        + '<span style="flex:1;min-width:0;">Douleur signalée : <span style="color:#fcd34d;">' + esc(names) + '</span><br><span style="font-size:0.82em;color:#94a3b8;font-weight:600;">Les séances éviteront ces zones · touche pour modifier</span></span>'
        + '</button>';
    }
    return '<button onclick="AwakPainOpen()" style="width:100%;padding:12px 15px;border:1px solid rgba(255,255,255,0.12);border-radius:14px;cursor:pointer;background:rgba(255,255,255,0.03);color:#cbd5e1;font-weight:700;font-size:0.84em;text-align:left;display:flex;align-items:center;gap:10px;">'
      + '<span style="font-size:1.25em;">🤕</span>'
      + '<span style="flex:1;">J\'ai mal quelque part<br><span style="font-size:0.82em;color:#64748b;font-weight:600;">Adapte la séance en évitant une zone douloureuse</span></span>'
      + '</button>';
  }

  // Injecte le bouton dans #painButtonContainer (appelé au chargement + après maj).
  function updateButton() {
    var host = document.getElementById('painButtonContainer');
    if (host) host.innerHTML = renderButton();
  }

  window.AwakPainOpen = function () {
    var active = _load();
    // Le personnage passe en mode « douleur » (surbrillance rouge, clics → zones)
    try { if (window._mmpSetMode) { window._mmpSetMode('pain'); window._mmpResetView(); } } catch (e) {}
    // Zones sans équivalent sur la silhouette → conservées en pastilles
    var extraChips = ZONES.filter(function (z) { return z.id === 'poignets' || z.id === 'genoux'; }).map(function (z) {
      var on = active.indexOf(z.id) !== -1;
      return '<button onclick="AwakPainToggle(\'' + z.id + '\')" style="display:flex;align-items:center;justify-content:center;gap:7px;padding:11px 8px;border-radius:12px;cursor:pointer;border:1.5px solid ' + (on ? '#f59e0b' : 'rgba(255,255,255,0.1)') + ';background:' + (on ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.03)') + ';color:' + (on ? '#f59e0b' : '#94a3b8') + ';font-weight:800;font-size:0.78em;">'
        + '<span style="font-size:1.2em;">' + z.emoji + '</span>' + esc(z.label) + (on ? ' ✓' : '') + '</button>';
    }).join('');
    var chips = ZONES.map(function (z) {
      var on = active.indexOf(z.id) !== -1;
      return '<button onclick="AwakPainToggle(\'' + z.id + '\')" style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:14px 8px;border-radius:14px;cursor:pointer;border:2px solid ' + (on ? '#f59e0b' : 'rgba(255,255,255,0.1)') + ';background:' + (on ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)') + ';color:#fff;transition:all 0.15s;">'
        + '<span style="font-size:1.7em;">' + z.emoji + '</span>'
        + '<span style="font-size:0.76em;font-weight:800;text-align:center;">' + esc(z.label) + '</span>'
        + (on ? '<span style="font-size:0.6em;color:#f59e0b;font-weight:800;">✓ ÉVITÉ</span>' : '')
        + '</button>';
    }).join('');

    var overlay = document.createElement('div');
    overlay.id = 'awakPainModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:flex-end;justify-content:center;padding:0;';
    overlay.onclick = function (e) { if (e.target === overlay) _closeModal(); };
    overlay.innerHTML = '<div style="background:linear-gradient(160deg,#1a1410,#0d0d12);border-top:1px solid rgba(245,158,11,0.35);border-radius:22px 22px 0 0;padding:22px;max-width:460px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 -8px 40px rgba(0,0,0,0.6);">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;">'
      +   '<span style="font-size:1.5em;">🤕</span>'
      +   '<div style="flex:1;"><div style="font-size:1.1em;font-weight:900;color:#fff;">Où as-tu mal ?</div>'
      +   '<div style="font-size:0.76em;color:#94a3b8;">Sélectionne les zones à éviter aujourd\'hui.</div></div>'
      + '</div>'
      + (window._mmpBodyBlock
            ? '<div id="mmpBodyHost" style="margin:12px 0 4px;">' + window._mmpBodyBlock() + '</div>'
              + '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin:6px 0 14px;">' + extraChips + '</div>'
            : '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:16px 0;">' + chips + '</div>')
      + '<div style="font-size:0.72em;color:#64748b;line-height:1.4;margin-bottom:14px;">Les séances générées éviteront ces zones, y compris les exercices qui les sollicitent indirectement. Pense à consulter un professionnel si la douleur est forte ou dure.</div>'
      + '<div style="padding:10px 12px;margin-bottom:14px;border-radius:11px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.25);">'
      +   '<div style="font-size:0.76em;color:#7dd3fc;font-weight:700;margin-bottom:4px;">🛡️ Blessure ou pause forcée ?</div>'
      +   '<div style="font-size:0.72em;color:#94a3b8;line-height:1.4;margin-bottom:8px;">Le mode récupération gèle ta progression RPG le temps de guérir — aucune perte d\'XP.</div>'
      +   '<button onclick="AwakPainCloseModal(); if(window.AwakRecoveryOffer) AwakRecoveryOffer();" style="width:100%;padding:9px;border:none;border-radius:9px;cursor:pointer;background:rgba(56,189,248,0.15);color:#7dd3fc;font-weight:700;font-size:0.78em;">En savoir plus</button>'
      + '</div>'
      + '<button onclick="AwakPainClear()" style="width:100%;padding:11px;border:none;border-radius:11px;cursor:pointer;background:rgba(255,255,255,0.05);color:#94a3b8;font-weight:700;font-size:0.82em;margin-bottom:8px;">Tout réinitialiser (aucune douleur)</button>'
      + '<button onclick="AwakPainCloseModal()" style="width:100%;padding:13px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;font-size:0.9em;">Terminé</button>'
      + '</div>';
    document.body.appendChild(overlay);
    try { _paintBody(); } catch (e) {}
  };

  window.AwakPainToggle = function (id) {
    toggleZone(id);
    _closeModal();
    window.AwakPainOpen();   // rouvrir pour refléter l'état
  };
  window.AwakPainClear = function () {
    clear();
    _closeModal();
    updateButton();
  };
  function _closeModal() { var el = document.getElementById('awakPainModal'); if (el) el.remove(); }
  window.AwakPainCloseModal = function () { _closeModal(); try { if (window._mmpSetMode) window._mmpSetMode('select'); } catch (e) {} updateButton(); try { if (window.awakRenderPainCard) window.awakRenderPainCard(); } catch (e) {} };

  window.AwakPain.renderButton = renderButton;
  window.AwakPain.updateButton = updateButton;
})();
