/* ============================================================
   MUSIQUE EN SÉANCE (v1472)
   - Liste des morceaux : AWAK_MUSIQUES ci-dessous (fichiers dans audio/).
     type 'jeu'          : morceaux qui parlent du jeu (Système, Failles…)
     type 'entrainement' : morceaux d'entraînement seulement
   - Les deux types sont mélangés dans une seule file ; un filtre (Réglages >
     Audio & notifications > Musique) retire l'un ou l'autre.
   - Démarre seule au début d'une séance (si activé), s'arrête en fondu à la fin.
   - Barre compacte dans l'écran de séance : précédent / lecture-pause / suivant.
   Aucun emoji : icônes SVG.
   ============================================================ */
(function () {
  'use strict';

  // ── Ajouter un morceau : une ligne ici + le fichier dans audio/ ──
  var AWAK_MUSIQUES = [
    // (v1475 : l'intro n'est plus ici — elle ne joue que pendant l'intro du jeu)
    // type 'faille' : seulement dans les Failles UNIQUES (histoire, sous-boss, compagnon, combat final)
    { fichier: 'brise_la_faille.mp3', titre: 'Brise la faille', type: 'faille' },
    // v1483 : types de combat — joués SEULEMENT dans leur contexte
    { fichier: 'je_n_abandonne_pas.mp3', titre: 'Je n\'abandonne pas', type: 'finalboss', voix: 'esen' },     // combat final (voix d'homme)
    { fichier: 'je_n_abandonne_pas_f.mp3', titre: 'Je n\'abandonne pas', type: 'finalboss', voix: 'nyra' },   // v1505 : joueur = Nyra (voix de femme)
    { fichier: 'combat.mp3', titre: 'Combat', type: 'combat' },                              // Faille ordinaire
    { fichier: 'bataille_1.mp3', titre: 'Bataille I', type: 'combat' },
    { fichier: 'bataille_2.mp3', titre: 'Bataille II', type: 'combat' },
    { fichier: 'game_over.mp3', titre: 'Game Over. Non, pas moi', type: 'gameover' },        // Faille ordinaire, 15 % de chance
    { fichier: 'level_up.mp3', titre: 'Level Up', type: 'jeu' },
    { fichier: 'rien_ne_m_arrete.mp3', titre: 'Rien ne m\'arrête', type: 'entrainement' },
    { fichier: 'le_reel_nous_lache_pas.mp3', titre: 'Le Réel nous lâche pas', type: 'entrainement' },
    { fichier: 'la_route_t_appartient.mp3', titre: 'La route t\'appartient', type: 'entrainement' },
    { fichier: 'sul_gym.mp3', titre: 'Sul gym', type: 'entrainement' },
    { fichier: 'jusqu_a_l_aurore.mp3', titre: 'Jusqu\'à l\'Aurore', type: 'entrainement' },
    { fichier: 'ma_meilleure_version.mp3', titre: 'Ma meilleure version', type: 'entrainement' },
    { fichier: 'on_brule_le_sol.mp3', titre: 'On brûle le sol', type: 'entrainement' },
    { fichier: 'reine_de_sueur.mp3', titre: 'Reine de sueur', type: 'entrainement' },
    // v1640 : type 'zen' — seule musique des séances calmes (yoga, pilates, mobilité, sérénité), en boucle
    { fichier: 'zen.mp3', titre: 'Yoga', type: 'zen' },
    // v1641 : type 'matin' — seulement pendant le Réveil matinal
    { fichier: 'softening_light.mp3', titre: 'Softening Light', type: 'matin' },
    { fichier: 'rise_and_shine.mp3', titre: 'Rise and Shine', type: 'matin' },
    { fichier: 'awakening_the_hero.mp3', titre: 'Awakening the Hero', type: 'matin', jeu: true }   // v1642 : Réveil matinal + mode jeu activé
  ];

  var CLE = 'awakMusique';
  var DEF = { auto: true, jeu: true, entrainement: true, perso: true, externe: false, volume: 0.6, exclus: [], repeter: false };

  // ── v1476 : MES MUSIQUES — fichiers audio importés depuis le téléphone,
  // gardés dans le navigateur (IndexedDB, sur cet appareil seulement).
  var PERSO = [];   // { fichier:'perso:<id>', id, titre, type:'perso', url, taille }
  var DB_NOM = 'awakMusiquesPerso', DB_ST = 'pistes';
  function idb() {
    return new Promise(function (ok, ko) {
      try {
        var rq = indexedDB.open(DB_NOM, 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore(DB_ST, { keyPath: 'id' }); };
        rq.onsuccess = function () { ok(rq.result); };
        rq.onerror = function () { ko(rq.error); };
      } catch (e) { ko(e); }
    });
  }
  function idbTx(mode, fn) {
    return idb().then(function (db) {
      return new Promise(function (ok, ko) {
        var tx = db.transaction(DB_ST, mode), st = tx.objectStore(DB_ST), res;
        var rq = fn(st);
        if (rq) rq.onsuccess = function () { res = rq.result; };
        tx.oncomplete = function () { ok(res); db.close(); };
        tx.onerror = function () { ko(tx.error); db.close(); };
      });
    });
  }
  function chargerPerso() {
    return idbTx('readonly', function (st) { return st.getAll(); }).then(function (tout) {
      PERSO.forEach(function (m) { try { URL.revokeObjectURL(m.url); } catch (e) { _awkE(e); } });
      PERSO = (tout || []).sort(function (a, b) { return (a.ajout || 0) - (b.ajout || 0); }).map(function (x) {
        return { fichier: 'perso:' + x.id, id: x.id, titre: x.titre, type: 'perso', taille: x.taille || 0, url: URL.createObjectURL(x.blob) };
      });
      majBarre(); rendreReglages();
    }).catch(function () {});
  }
  function ajouterPerso(fichiers) {
    var liste = Array.prototype.slice.call(fichiers || []).filter(function (f) { return /^audio\//.test(f.type) || /\.(mp3|m4a|aac|wav|ogg|flac|opus)$/i.test(f.name); });
    if (!liste.length) return Promise.resolve(0);
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { _awkE(e); }
    return idbTx('readwrite', function (st) {
      liste.forEach(function (f, i) {
        st.put({ id: Date.now().toString(36) + i + Math.random().toString(36).slice(2, 6), titre: f.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim() || 'Morceau', blob: f, taille: f.size, ajout: Date.now() + i });
      });
      return null;
    }).then(function () { return chargerPerso().then(function () { return liste.length; }); });
  }
  function retirerPerso(id) {
    var c = courant(); if (c && c.id === id) arreter();
    return idbTx('readwrite', function (st) { return st.delete(id); }).then(chargerPerso);
  }

  function reglages() {
    var r = {};
    try { r = JSON.parse(localStorage.getItem(CLE) || '{}') || {}; } catch (e) { _awkE(e); }
    var o = {}; for (var k in DEF) o[k] = (k in r) ? r[k] : DEF[k];
    return o;
  }
  function sauver(r) { try { localStorage.setItem(CLE, JSON.stringify(r)); } catch (e) { _awkE(e); } }
  function modeJeu() { try { return typeof window.rpgEnabled === 'function' ? window.rpgEnabled() : localStorage.getItem('fitproGameMode') === '1'; } catch (e) { return false; } }

  // Morceaux retenus par le filtre (les morceaux « jeu » exigent le mode jeu)
  // v1483 : contexte de la séance → morceaux de combat permis
  var SPECIAUX = ['finalboss', 'faille', 'combat', 'gameover'];
  var tirages = {};   // Faille ordinaire → « Game Over » tiré une fois par Faille (15 %)
  function contexte() {
    try {
      if (!enSeance || !modeJeu() || typeof window.awakSeanceContexte !== 'function') return null;
      var c = window.awakSeanceContexte();
      if (c && typeof c === 'object') {
        if (!(c.id in tirages)) tirages[c.id] = Math.random() < 0.15;
        return tirages[c.id] ? 'faille+gameover' : 'faille';
      }
      return c;
    } catch (e) { return null; }
  }
  function unique() { return contexte() === 'unique'; }
  // v1505 : héros incarné (avatar femme = Nyra) → la version chantée par sa voix
  function heros() { try { return typeof window.awakHerosJoue === 'function' ? window.awakHerosJoue() : ((localStorage.getItem('fitproAvatarGender') || 'homme') === 'femme' ? 'nyra' : 'esen'); } catch (e) { return 'esen'; } }
  function permisCombat(type, ctx, m) {
    if (type === 'finalboss') return ctx === 'final' && (!m || !m.voix || m.voix === heros());
    if (type === 'faille') return ctx === 'unique';
    if (type === 'combat') return ctx === 'faille' || ctx === 'faille+gameover';
    if (type === 'gameover') return ctx === 'faille+gameover';
    return false;
  }
  // v1493 : morceaux que le joueur a retirés de sa liste
  // v1640 : séance calme → seulement la musique zen, en boucle
  var DISC_ZEN = ['yoga', 'pilates', 'mobilite', 'serenite'];
  var TYPES_ZEN = ['stretch', 'mobility', 'yoga', 'breath', 'breathing', 'cooldown'];
  function seanceZen() {
    try {
      if (!enSeance) return false;
      var w = window.AwakSSBridge && window.AwakSSBridge.getWorkout();
      if (!w) return false;
      if (DISC_ZEN.indexOf(w._discipline) >= 0) return true;
      var ex = (w.exercises || []).filter(function (e) { return e && !e.isRest && !e.isInfo; });
      return ex.length > 0 && ex.every(function (e) { return TYPES_ZEN.indexOf(e.type) >= 0; });
    } catch (e) { return false; }
  }
  function seanceMatin() {
    try { var w = enSeance && window.AwakSSBridge && window.AwakSSBridge.getWorkout(); return !!(w && (w.type === 'morning' || w.fromMorning)); } catch (e) { return false; }
  }
  function exclus() { var e = reglages().exclus; return Array.isArray(e) ? e : []; }
  // Morceaux proposés par les interrupteurs (hors combat, sans les retraits) : liste des Réglages
  function candidats() {
    var r = reglages(); if (r.externe) return [];
    var jeu = r.jeu && modeJeu();
    return AWAK_MUSIQUES.filter(function (m) { return SPECIAUX.indexOf(m.type) < 0 && m.type !== 'zen' && m.type !== 'matin' && (m.type === 'jeu' ? jeu : !!r.entrainement); })
      .concat(r.perso ? PERSO : []);
  }
  function liste() {
    var r = reglages(); if (r.externe) return [];   // « J'écoute ma musique dans une autre app »
    if (seanceMatin()) return r.entrainement ? AWAK_MUSIQUES.filter(function (m) { return m.type === 'matin' && (!m.jeu || modeJeu()); }) : [];   // v1641
    var zen = seanceZen();
    if (zen) return r.entrainement ? AWAK_MUSIQUES.filter(function (m) { return m.type === 'zen'; }) : [];
    var jeu = r.jeu && modeJeu(), ctx = modeJeu() ? contexte() : null, ex = exclus();
    // v1493 : en combat (Faille, Faille unique, combat final), pas de musique d'entraînement
    return AWAK_MUSIQUES.filter(function (m) {
        if (SPECIAUX.indexOf(m.type) >= 0) return jeu && permisCombat(m.type, ctx, m);
        if (m.type === 'zen' || m.type === 'matin') return false;
        if (m.type === 'jeu') return jeu;
        return !!r.entrainement && !ctx;
      })
      .concat(r.perso ? PERSO : [])
      .filter(function (m) { return SPECIAUX.indexOf(m.type) >= 0 || ex.indexOf(m.fichier) < 0; });
  }

  var audio = null, file = [], pos = -1, fondu = null, actif = false;
  // v1517 : COMBAT FINAL — « Je n'abandonne pas » d'abord, puis « milieu » en boucle,
  // puis « climax » en boucle dès la dernière phase (sa vraie forme). Titres cachés.
  var BOUCLES = { milieu: 'boss_final_milieu', climax: 'boss_final_climax' };
  var etapeFinale = null;   // null | 'milieu' | 'climax'
  function enFinal() { try { return enSeance && modeJeu() && typeof window.awakSeanceContexte === 'function' && window.awakSeanceContexte() === 'final'; } catch (e) { return false; } }
  function extBoucle() { try { var t = document.createElement('audio'); return t.canPlayType && t.canPlayType('audio/ogg; codecs="vorbis"') ? '.ogg' : '.mp3'; } catch (e) { return '.mp3'; } }
  function phaseFinale() { try { var w = window.AwakSSBridge && window.AwakSSBridge.getWorkout(); return (w && w._phase) || 0; } catch (e) { return 0; } }
  function jouerBoucle(etape, fonduMs) {
    var a = el();
    etapeFinale = etape;
    var go = function () {
      a.src = 'audio/' + BOUCLES[etape] + extBoucle();
      a.loop = true; a.volume = 0; actif = true;
      var p = null; try { p = a.play(); } catch (e) { _awkE(e); }
      var ok = function () { fonduVers(volCible(), 1500); majMedia(); majBarre(); };
      if (p && p.then) p.then(ok).catch(function () { actif = false; majBarre(); }); else ok();
    };
    if (!a.paused && fonduMs) fonduVers(0, fonduMs, go); else go();
  }
  function climaxFinal() {
    if (!enFinal() || etapeFinale === 'climax') return;
    if (etapeFinale === 'milieu' || (audio && !audio.paused)) {
      // « Je n'abandonne pas » encore en cours : on laisse finir et 'ended' choisira le climax
      if (etapeFinale === 'milieu') jouerBoucle('climax', 1500);
    }
  }
  var erreursSuite = 0;   // v1623
  function el() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = 'auto';
    try { audio.setAttribute('playsinline', ''); } catch (e) { _awkE(e); }
    audio.addEventListener('ended', function () {
      // v1517 : combat final — après « Je n'abandonne pas », la boucle de l'étape en cours
      if (enFinal()) { jouerBoucle(phaseFinale() >= 3 ? 'climax' : 'milieu', 0); return; }
      suivante();
    });
    // v1623 : hors ligne, chaque morceau échouait → suivant toutes les 400 ms, sans fin.
    // On s'arrête après un tour complet de la file et on le dit.
    audio.addEventListener('error', function () {
      erreursSuite++;
      if (actif && file.length > 1 && erreursSuite < file.length) { setTimeout(suivante, 400); return; }
      actif = false; erreursSuite = 0;
      try { if (window.showToast) window.showToast(navigator.onLine === false ? 'Musique indisponible hors ligne' : 'Musique introuvable', 'info', 2500); } catch (x) { _awkE(x); }
      majBarre();
    });
    audio.addEventListener('playing', function () { erreursSuite = 0; });
    audio.addEventListener('play', majBarre);
    audio.addEventListener('pause', majBarre);
    audio.addEventListener('timeupdate', majProgression);   // v1588
    audio.addEventListener('loadedmetadata', majProgression);
    return audio;
  }
  function melanger(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // Les morceaux de combat du contexte ouvrent la file (Game Over avant Combat),
  // le reste suit mélangé.
  var ORDRE = { finalboss: 0, gameover: 1, faille: 2, combat: 3 };
  function preparerFile() {
    var l = liste();
    var sp = melanger(l.filter(function (m) { return SPECIAUX.indexOf(m.type) >= 0; })).sort(   // v1494 : plusieurs musiques de combat → ordre au hasard
      function (a, b) { return ORDRE[a.type] - ORDRE[b.type]; });
    file = sp.concat(melanger(l.filter(function (m) { return SPECIAUX.indexOf(m.type) < 0; })));
    pos = -1;
  }
  function courant() { return file[pos] || null; }

  function volCible() { return Math.max(0, Math.min(1, +reglages().volume || 0)); }
  function fonduVers(v, ms, apres) {
    var a = el(); if (fondu) clearInterval(fondu);
    var de = a.volume, t0 = Date.now();
    fondu = setInterval(function () {
      var k = Math.min(1, (Date.now() - t0) / ms);
      try { a.volume = Math.max(0, Math.min(1, de + (v - de) * k)); } catch (e) { _awkE(e); }
      if (k >= 1) { clearInterval(fondu); fondu = null; if (apres) apres(); }
    }, 50);
  }

  function jouerIndex(i) {
    if (!file.length) preparerFile();
    if (!file.length) { majBarre(); return; }
    pos = ((i % file.length) + file.length) % file.length;
    var m = file[pos], a = el();
    a.loop = (m.type === 'zen') || !!reglages().repeter; etapeFinale = null;   // v1640 : zen en boucle · v1662 : répéter
    a.src = m.url || ('audio/' + m.fichier);
    a.volume = 0;
    actif = true;
    var p = null;
    try { p = a.play(); } catch (e) { _awkE(e); }
    var ok = function () { fonduVers(volCible(), 1200); majMedia(); majBarre(); };
    if (p && typeof p.then === 'function') p.then(ok).catch(function () { actif = false; majBarre(); });
    else ok();
    majBarre();
  }
  function lecture() {
    var a = el();
    if (courant() && a.src && a.paused) {
      actif = true;
      var p = a.play();
      if (p && p.then) p.then(function () { fonduVers(volCible(), 600); }).catch(function () { actif = false; majBarre(); });
      return;
    }
    jouerIndex(pos < 0 ? 0 : pos);
  }
  function pause() { if (!audio) return; actif = false; fonduVers(0, 400, function () { try { audio.pause(); } catch (e) { _awkE(e); } }); }
  function basculer() { if (audio && !audio.paused) pause(); else lecture(); }
  function suivante() { if (enFinal()) return; jouerIndex(pos + 1); }
  function precedente() {
    if (enFinal()) return;
    if (audio && audio.currentTime > 4) { audio.currentTime = 0; return; }
    jouerIndex(pos - 1);
  }
  function arreter() {
    actif = false;
    if (!audio || audio.paused) { majBarre(); return; }
    fonduVers(0, 1500, function () { try { audio.pause(); } catch (e) { _awkE(e); } majBarre(); });
  }

  // ── Media Session : commandes sur l'écran verrouillé / casque ──
  function majMedia() {
    try {
      if (!('mediaSession' in navigator)) return;
      var m = courant(); if (!m) return;
      var fin = enFinal();
      navigator.mediaSession.metadata = new MediaMetadata(fin ? { title: 'Combat final', artist: 'Awakened' }
        : { title: m.titre, artist: 'Awakened', album: m.type === 'perso' ? 'Mes musiques' : m.type === 'entrainement' ? 'Entraînement' : m.type === 'zen' ? 'Détente' : m.type === 'matin' ? 'Réveil' : 'Musiques du jeu' });
      navigator.mediaSession.setActionHandler('play', lecture);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('nexttrack', suivante);
      navigator.mediaSession.setActionHandler('previoustrack', precedente);
    } catch (e) { _awkE(e); }
  }

  // ── Icônes ──
  function svg(d, px) { return '<svg viewBox="0 0 24 24" width="' + (px || 18) + '" height="' + (px || 18) + '" fill="currentColor" aria-hidden="true">' + d + '</svg>'; }
  var IC = {
    prec: svg('<path d="M6 5h2v14H6zM20 5v14L9 12z"/>'),
    suiv: svg('<path d="M16 5h2v14h-2zM4 5l11 7-11 7z"/>'),
    lect: svg('<path d="M7 4.5v15L19.5 12z"/>', 20),
    paus: svg('<path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z"/>', 20),
    note: svg('<path d="M10 3v10.6A3.5 3.5 0 1 0 12 17V7h6V3z"/>', 15),
    // v1662 : répéter le morceau (boucle avec un « 1 »)
    rep: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/><path d="M11.5 10.2 13 9v6" stroke-width="1.8"/></svg>'
  };
  // v1662 : bouton « Répéter » — garde le même morceau en boucle (réglage mémorisé)
  // v1668 : titre trop long → il défile (aller-retour lent) au lieu d'être coupé par « … »
  function defilerTitre(el, txt) {
    if (!el) return;
    if (el.dataset.txt === txt) return;   // même titre : on ne relance pas le défilement
    el.dataset.txt = txt;
    el.style.textOverflow = 'clip';
    el.innerHTML = '';
    var inn = document.createElement('span');
    inn.className = 'awk-mus-defil'; inn.textContent = txt;
    inn.style.display = 'inline-block'; inn.style.paddingRight = '2px';
    el.appendChild(inn);
    var mesurer = function () {
      try {
        var i2 = el.querySelector('.awk-mus-defil'); if (!i2 || !el.clientWidth) return;
        var trop = i2.scrollWidth - el.clientWidth;
        var cle = trop > 4 ? Math.round(trop) : 0;
        if (String(cle) === i2.dataset.trop) return; i2.dataset.trop = String(cle);
        if (cle) {
          i2.style.setProperty('--awk-defil', (-cle - 6) + 'px');
          i2.style.animation = 'awkMusDefil ' + Math.max(6, Math.round(cle / 18 + 4)) + 's ease-in-out infinite';
        } else { i2.style.animation = 'none'; }
      } catch (e) { _awkE(e); }
    };
    requestAnimationFrame(mesurer); setTimeout(mesurer, 1200);
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(mesurer); } catch (e) { _awkE(e); }
    // la barre peut être cachée / réduite au moment du rendu : on remesure quand sa taille change
    if (!el._awkRO && typeof ResizeObserver === 'function') { el._awkRO = new ResizeObserver(mesurer); el._awkRO.observe(el); }
    else if (el._awkRO) { el._awkRO.disconnect(); el._awkRO = new ResizeObserver(mesurer); el._awkRO.observe(el); }
    if (!document.getElementById('awkMusDefilStyle')) {
      var st = document.createElement('style'); st.id = 'awkMusDefilStyle';
      st.textContent = '@keyframes awkMusDefil{0%,18%{transform:translateX(0)}50%,68%{transform:translateX(var(--awk-defil))}100%{transform:translateX(0)}}'
        + '@media (prefers-reduced-motion: reduce){.awk-mus-defil{animation:none!important}}';
      document.head.appendChild(st);
    }
  }
  function basculerRepeter() {
    var r = reglages(); r.repeter = !r.repeter; sauver(r);
    try { var c = courant(); if (audio) audio.loop = r.repeter || !!(c && c.type === 'zen'); } catch (e) { _awkE(e); }
    try { if (typeof window.showToast === 'function') window.showToast(r.repeter ? 'Répéter : ce morceau en boucle' : 'Répéter désactivé', 'info', 1500); } catch (e) { _awkE(e); }
    majBarre();
  }
  function styleRepeter(btn) {
    if (!btn) return; var on = !!reglages().repeter;
    btn.style.color = on ? '#22d3ee' : '#64748b';
    btn.style.background = on ? 'rgba(34,211,238,0.12)' : 'transparent';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Répéter activé' : 'Répéter le morceau');
  }

  // v1588 : habillage des lecteurs (égaliseur animé, barre de progression, temps)
  function styles() {
    if (document.getElementById('awkMusStyles')) return;
    var st = document.createElement('style'); st.id = 'awkMusStyles';
    st.textContent = '.awk-eq{display:inline-flex;align-items:flex-end;gap:2px;width:14px;height:14px}'
      + '.awk-eq i{display:block;flex:1;height:30%;border-radius:2px;background:currentColor}'
      + '.awk-eq.on i{animation:awkEq .9s ease-in-out infinite}'
      + '.awk-eq.on i:nth-child(2){animation-delay:-.3s}.awk-eq.on i:nth-child(3){animation-delay:-.6s}'
      + '@keyframes awkEq{0%,100%{height:25%}50%{height:100%}}'
      + '.awk-mus-prog{height:3px;border-radius:99px;background:rgba(255,255,255,0.08);overflow:hidden}'
      + '.awk-mus-prog>i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#22d3ee,#60a5fa);transition:width .3s linear}'
      + '#awakMusBar button:active,#awakMusReglages [data-mus-ctl]:active{transform:scale(.92)}'
      + '@media (prefers-reduced-motion: reduce){.awk-eq.on i{animation:none;height:70%}}';
    document.head.appendChild(st);
  }
  function eq(on) { return '<span class="awk-eq' + (on ? ' on' : '') + '" aria-hidden="true"><i></i><i></i><i></i></span>'; }
  function mmss(t) { t = Math.max(0, Math.floor(+t || 0)); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); }
  function source(m) { return !m ? '' : m.type === 'perso' ? 'Mes musiques' : m.type === 'entrainement' ? 'Entraînement' : m.type === 'zen' ? 'Détente' : m.type === 'matin' ? 'Réveil' : m.type === 'jeu' ? 'Musiques du jeu' : 'Awakened'; }
  // Progression et temps : mis à jour dans tous les lecteurs affichés
  function majProgression() {
    if (!audio) return;
    var d = audio.duration, c = audio.currentTime;
    var pc = (d && isFinite(d)) ? Math.min(100, c / d * 100) : 0;
    document.querySelectorAll('.awk-mus-prog > i').forEach(function (x) { x.style.width = pc + '%'; });
    document.querySelectorAll('.awk-mus-temps').forEach(function (x) { x.textContent = mmss(c) + ((d && isFinite(d)) ? ' / ' + mmss(d) : ''); });
  }

  // ── Barre compacte dans l'écran de séance ──
  function barre() {
    var vue = document.getElementById('exerciseView');
    if (!vue) return null;
    var b = document.getElementById('awakMusBar');
    if (!b) {
      b = document.createElement('div');
      b.id = 'awakMusBar';
      b.setAttribute('data-emoji-keep', '');
      styles();
      // v1588 : pochette avec égaliseur, titre + source/temps, lecture en cyan, progression en bas
      b.style.cssText = 'position:relative;overflow:hidden;display:flex;align-items:center;gap:8px;margin:6px 12px 0;padding:6px 6px 8px 6px;border-radius:14px;'
        + 'background:linear-gradient(135deg,rgba(34,211,238,0.07),rgba(96,165,250,0.04) 60%,rgba(255,255,255,0.02));border:1px solid rgba(34,211,238,0.18);';
      var btn = 'min-height:0;width:34px;height:34px;padding:0;border-radius:50%;border:none;background:transparent;color:#cbd5e1;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:transform .12s;';
      b.innerHTML = '<span class="awk-mus-poch" style="width:34px;height:34px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;'
        +   'background:linear-gradient(135deg,rgba(34,211,238,0.22),rgba(96,165,250,0.12));color:#67e8f9;">' + eq(false) + '</span>'
        + '<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;">'
        +   '<span class="awk-mus-titre" style="display:block;font-size:12.5px;font-weight:800;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></span>'
        +   '<span style="font-size:10.5px;font-weight:700;color:#8391a7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><span class="awk-mus-src"></span> · <span class="awk-mus-temps">0:00</span></span>'
        + '</span>'
        + '<button data-a="prec" aria-label="Musique précédente" style="' + btn + '">' + IC.prec + '</button>'
        + '<button data-a="lect" aria-label="Lecture ou pause" style="' + btn + 'width:38px;height:38px;background:linear-gradient(135deg,#22d3ee,#3b82f6);color:#04121f;box-shadow:0 2px 10px rgba(34,211,238,0.3);">' + IC.lect + '</button>'
        + '<button data-a="suiv" aria-label="Musique suivante" style="' + btn + '">' + IC.suiv + '</button>'
        + '<button data-a="rep" aria-label="Répéter le morceau" style="' + btn + 'width:30px;height:30px;">' + IC.rep + '</button>'
        + '<span class="awk-mus-prog" style="position:absolute;left:10px;right:10px;bottom:3px;height:2px;"><i></i></span>';
      b.addEventListener('click', function (e) {
        var t = e.target.closest && e.target.closest('button[data-a]'); if (!t) return;
        e.stopPropagation();
        var a = t.getAttribute('data-a');
        if (a === 'prec') precedente(); else if (a === 'suiv') suivante(); else if (a === 'rep') basculerRepeter(); else basculer();
      });
      var top = document.getElementById('workoutTopBar');
      if (top && top.parentNode === vue) vue.insertBefore(b, top.nextSibling); else vue.insertBefore(b, vue.firstChild);
    }
    return b;
  }
  function majBarre() {
    var b = document.getElementById('awakMusBar');
    if (!liste().length) { if (b) b.style.display = 'none'; return; }
    if (!b) return;
    b.style.display = 'flex';
    var m = courant(), joue = audio && !audio.paused;
    // v1517 : combat final — aucun titre, seulement lecture / pause
    var fin = enFinal();
    defilerTitre(b.querySelector('.awk-mus-titre'), fin ? '' : (m ? m.titre : 'Musique'));
    var src = b.querySelector('.awk-mus-src'); if (src) src.textContent = fin ? '' : (m ? source(m) : 'Prête à jouer');
    var info = src && src.parentElement; if (info) info.style.visibility = fin ? 'hidden' : 'visible';
    b.querySelectorAll('button[data-a="prec"],button[data-a="suiv"],button[data-a="rep"]').forEach(function (x) { x.style.display = fin ? 'none' : 'flex'; });
    styleRepeter(b.querySelector('button[data-a="rep"]'));
    var note = b.firstElementChild; if (note) { note.style.visibility = fin ? 'hidden' : 'visible'; var e2 = note.querySelector('.awk-eq'); if (e2) e2.classList.toggle('on', !!joue); }
    var pr = b.querySelector('.awk-mus-prog'); if (pr) pr.style.display = fin ? 'none' : '';
    b.style.justifyContent = fin ? 'flex-end' : '';
    majProgression();
    var l = b.querySelector('button[data-a="lect"]'); l.innerHTML = joue ? IC.paus : IC.lect;
    l.setAttribute('aria-label', joue ? 'Pause' : 'Lecture');
    var r = document.getElementById('awakMusReglages'); if (r && r._maj) r._maj();
  }

  // ── Début / fin de séance : suivi de la classe « in-session » du body ──
  var enSeance = false;
  // v1477 : dans une Faille, la séance s'arrête après chaque groupe d'exercices et à
  // chaque vague, puis reprend : la musique doit CONTINUER jusqu'à la sortie de la Faille.
  function enFaille() { try { return typeof window.awakFailleEnCours === 'function' && window.awakFailleEnCours(); } catch (e) { return false; } }
  var gardeFaille = null, horsFaille = 0;
  function surveillerFaille() {
    if (gardeFaille) return;
    horsFaille = 0;
    gardeFaille = setInterval(function () {
      if (enSeance) { clearInterval(gardeFaille); gardeFaille = null; return; }
      if (enFaille()) { horsFaille = 0; return; }
      if (++horsFaille >= 4) { clearInterval(gardeFaille); gardeFaille = null; arreter(); }   // 4 s hors Faille = sortie
    }, 1000);
  }
  function surSeance() {
    var s = document.body.classList.contains('in-session');
    if (s === enSeance) return;
    enSeance = s;
    if (s) {
      if (!liste().length) return;
      barre(); majBarre();
      var continue_ = audio && !audio.paused && (gardeFaille || enFaille());
      if (gardeFaille) { clearInterval(gardeFaille); gardeFaille = null; }
      if (continue_) return;   // même Faille : la musique continue, même file
      if (reglages().auto) { preparerFile(); jouerIndex(0); }   // nouvelle séance = nouvelle file
      // Le combat peut être reconnu un instant plus tard : basculer sur son morceau
      setTimeout(function () {
        // v1640 : séance calme reconnue après coup → basculer sur la musique zen
        if (enSeance && reglages().auto && seanceMatin()) { var zm = courant(); if (!zm || zm.type !== 'matin') { preparerFile(); jouerIndex(0); } return; }   // v1641
        if (enSeance && reglages().auto && seanceZen()) { var z = courant(); if (!z || z.type !== 'zen') { preparerFile(); jouerIndex(0); } return; }
        if (!enSeance || !reglages().auto || !contexte()) return;
        var c = courant(); if (c && SPECIAUX.indexOf(c.type) >= 0) return;
        preparerFile(); if (file[0] && SPECIAUX.indexOf(file[0].type) >= 0) jouerIndex(0);
      }, 1200);
    } else {
      var fs = false; try { fs = typeof window.awakFailleEnCours === 'function' && window.awakFailleEnCours(true); } catch (e) { _awkE(e); }
      if (audio && !audio.paused && fs) { surveillerFaille(); return; }
      arreter();
    }
  }
  function brancher() {
    try { new MutationObserver(surSeance).observe(document.body, { attributes: true, attributeFilter: ['class'] }); } catch (e) { _awkE(e); }
    surSeance();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancher); else brancher();
  // L'écran de séance peut être reconstruit : remettre la barre si elle a disparu
  setInterval(function () { if (enSeance && liste().length && !document.getElementById('awakMusBar')) { barre(); majBarre(); } }, 1500);

  // ── Réglages > Audio & notifications > Musique ──
  function rendreReglages() {
    var h = document.getElementById('awakMusReglages'); if (!h) return;
    var r = reglages(), jeuOk = modeJeu();
    var nJeu = AWAK_MUSIQUES.filter(function (m) { return m.type === 'jeu'; }).length;
    var nEnt = AWAK_MUSIQUES.filter(function (m) { return m.type === 'entrainement'; }).length;
    var nFai = AWAK_MUSIQUES.filter(function (m) { return m.type === 'faille'; });
    var nPer = PERSO.length;
    // v1476 : interrupteurs compacts (les grandes cartes prenaient tout l'écran)
    var interr = function (id, on, titre, sous, off) {
      return '<button class="awk-mus-int" data-r="' + id + '" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" style="min-height:0;width:100%;display:flex;align-items:center;gap:12px;text-align:left;padding:11px 12px;border-radius:12px;cursor:pointer;'
        + 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;' + (off ? 'opacity:0.45;pointer-events:none;' : '') + '">'
        + '<span style="flex:1;min-width:0;"><span style="display:block;font-size:14px;font-weight:800;color:#f1f5f9;">' + titre + '</span>'
        + '<span style="display:block;font-size:12px;color:#94a3b8;margin-top:1px;">' + sous + '</span></span>'
        + '<span style="flex-shrink:0;width:44px;height:26px;border-radius:99px;position:relative;transition:background .2s;background:' + (on ? '#22d3ee' : 'rgba(255,255,255,0.15)') + ';">'
        + '<span style="position:absolute;top:3px;left:' + (on ? '21px' : '3px') + ';width:20px;height:20px;border-radius:50%;background-color:rgb(248,250,252);transition:left .2s;"></span></span></button>';
    };
    var l = candidats(), ex = exclus(), cur = courant();
    h.innerHTML = '<div style="display:grid;grid-template-columns:1fr;gap:7px;">'
      + interr('auto', r.auto, 'Démarrer seule en séance', r.auto ? 'Au début de chaque séance' : 'Je lance moi-même')
      + interr('jeu', r.jeu && jeuOk, 'Musiques du jeu', jeuOk ? nJeu + ' morceau' + (nJeu > 1 ? 'x' : '') : 'Mode jeu désactivé', !jeuOk)
      + interr('entrainement', r.entrainement, 'Musiques d\'entraînement', nEnt + ' morceau' + (nEnt > 1 ? 'x' : ''))
      + interr('perso', r.perso, 'Mes musiques', nPer ? nPer + ' morceau' + (nPer > 1 ? 'x' : '') + ' importé' + (nPer > 1 ? 's' : '') : 'Aucune pour l\'instant')
      + interr('externe', r.externe, 'J\'écoute ma musique ailleurs', r.externe ? 'L\'app ne joue rien : Spotify, YouTube Music… continuent' : 'Spotify, YouTube Music, radio…')
      + '</div>'
      // Importer ses propres fichiers
      + '<div style="margin-top:14px;padding:12px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">'
      +   '<div style="display:flex;align-items:center;gap:10px;">'
      +     '<div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:800;color:#f1f5f9;">Mes musiques</div>'
      +     '<div style="font-size:12px;color:#94a3b8;margin-top:2px;">Tes fichiers MP3, M4A… depuis ton téléphone. Gardés sur cet appareil seulement.</div></div>'
      +     '<button data-mus="importer" style="min-height:0;flex-shrink:0;padding:9px 14px;border-radius:99px;border:1px solid rgba(34,211,238,0.5);background:rgba(34,211,238,0.12);color:#a5f3fc;font-weight:800;font-size:13px;cursor:pointer;">Ajouter</button>'
      +   '</div>'
      +   '<input type="file" accept="audio/*" multiple data-mus="fichier" style="display:none;">'
      +   (nPer ? '<div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;">' + PERSO.map(function (m) {
            return '<div style="display:flex;align-items:center;gap:8px;padding:7px 8px 7px 12px;border-radius:10px;background:rgba(255,255,255,0.03);">'
              + '<span style="flex:1;min-width:0;font-size:13px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + m.titre.replace(/[<>&"]/g, '') + '</span>'
              + '<span style="font-size:11px;color:#8391a7;flex-shrink:0;">' + (m.taille ? (m.taille / 1048576).toFixed(1).replace('.', ',') + ' Mo' : '') + '</span>'
              + '<button data-retirer="' + m.id + '" aria-label="Retirer ' + m.titre.replace(/[<>&"]/g, '') + '" style="min-height:0;width:30px;height:30px;padding:0;border-radius:50%;border:none;background:rgba(255,255,255,0.06);color:#cbd5e1;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;">'
              + '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>';
          }).join('') + '</div>' : '')
      + '</div>'
      + '<label style="display:flex;align-items:center;gap:12px;margin:14px 2px 6px;font-size:13px;color:#cbd5e1;font-weight:700;">Volume'
      + '<input type="range" min="0" max="100" value="' + Math.round(r.volume * 100) + '" data-r="volume" style="flex:1;accent-color:#22d3ee;"></label>'
      // v1588 : carte « En cours » (titre, source, progression, commandes)
      + (cur && !r.externe ? (function () {
          var j = !!(audio && !audio.paused), cb = 'min-height:0;width:40px;height:40px;padding:0;border-radius:50%;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:transform .12s;';
          return '<div style="margin:12px 0 4px;padding:14px;border-radius:16px;background:linear-gradient(135deg,rgba(34,211,238,0.10),rgba(59,130,246,0.06));border:1px solid rgba(34,211,238,0.25);">'
            + '<div style="display:flex;align-items:center;gap:12px;">'
            +   '<span style="width:46px;height:46px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(34,211,238,0.28),rgba(59,130,246,0.18));color:#67e8f9;"><span style="display:inline-flex;transform:scale(1.6);">' + eq(j) + '</span></span>'
            +   '<span style="flex:1;min-width:0;"><span style="display:block;font-size:10.5px;font-weight:800;letter-spacing:1.2px;color:#67e8f9;">' + (j ? 'EN COURS' : 'EN PAUSE') + '</span>'
            +   '<span style="display:block;font-size:15px;font-weight:900;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;">' + String(cur.titre).replace(/[<>&"]/g, '') + '</span>'
            +   '<span style="display:block;font-size:11.5px;color:#8391a7;font-weight:700;margin-top:1px;">' + source(cur) + ' · <span class="awk-mus-temps">0:00</span></span></span>'
            + '</div>'
            + '<div class="awk-mus-prog" style="margin:12px 0 10px;"><i></i></div>'
            + '<div style="display:flex;align-items:center;justify-content:center;gap:18px;">'
            +   '<button data-mus-ctl="prec" aria-label="Musique précédente" style="' + cb + 'background:rgba(255,255,255,0.05);color:#cbd5e1;">' + IC.prec + '</button>'
            +   '<button data-mus-ctl="lect" aria-label="' + (j ? 'Pause' : 'Lecture') + '" style="' + cb + 'width:52px;height:52px;background:linear-gradient(135deg,#22d3ee,#3b82f6);color:#04121f;box-shadow:0 4px 16px rgba(34,211,238,0.3);">' + (j ? IC.paus : IC.lect) + '</button>'
            +   '<button data-mus-ctl="suiv" aria-label="Musique suivante" style="' + cb + 'background:rgba(255,255,255,0.05);color:#cbd5e1;">' + IC.suiv + '</button>'
            +   '<button data-mus-ctl="rep" aria-label="Répéter le morceau" style="' + cb + 'color:' + (r.repeter ? '#22d3ee' : '#64748b') + ';background:' + (r.repeter ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.05)') + ';">' + IC.rep + '</button>'
            + '</div></div>';
        })() : '')
      + (l.length ? '<div style="margin-top:8px;font-size:12px;color:#94a3b8;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Morceaux</div>'
        + '<div style="display:flex;flex-direction:column;gap:6px;margin-top:6px;">'
        + l.map(function (m) {
            var ici = cur && cur.fichier === m.fichier && audio && !audio.paused;
            var hors = ex.indexOf(m.fichier) >= 0, t = String(m.titre).replace(/[<>&"]/g, '');
            return '<div style="display:flex;align-items:center;gap:6px;">'
              + '<button data-piste="' + m.fichier + '"' + (hors ? ' disabled' : '') + ' style="min-height:0;flex:1;min-width:0;display:flex;align-items:center;gap:10px;text-align:left;padding:10px 12px;border-radius:12px;cursor:' + (hors ? 'default' : 'pointer') + ';'
              + 'background:' + (ici ? 'rgba(34,211,238,0.10)' : 'rgba(255,255,255,0.03)') + ';border:1px solid ' + (ici ? 'rgba(34,211,238,0.45)' : 'rgba(255,255,255,0.08)') + ';color:#e2e8f0;' + (hors ? 'opacity:0.4;' : '') + '">'
              + '<span style="display:inline-flex;width:18px;justify-content:center;color:' + (ici ? '#67e8f9' : '#94a3b8') + ';">' + (ici ? eq(true) : IC.lect) + '</span>'
              + '<span style="flex:1;min-width:0;font-size:13px;font-weight:' + (ici ? '800' : '700') + ';color:' + (ici ? '#f8fafc' : '#e2e8f0') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' + (hors ? 'text-decoration:line-through;' : '') + '">' + t + '</span>'
              // v1588 : pastille de source colorée (jeu = or, entraînement = cyan, à moi = bleu)
              + (function () { var k = hors ? ['Retiré', '#94a3b8', 'rgba(148,163,184,0.10)'] : m.type === 'perso' ? ['À moi', '#93c5fd', 'rgba(96,165,250,0.12)'] : m.type === 'jeu' ? ['Jeu', '#fcd34d', 'rgba(251,191,36,0.12)'] : ['Entraînement', '#67e8f9', 'rgba(34,211,238,0.10)'];
                  return '<span style="flex-shrink:0;font-size:10.5px;font-weight:800;padding:3px 8px;border-radius:99px;color:' + k[1] + ';background:' + k[2] + ';">' + k[0] + '</span>'; })() + '</button>'
              + '<button data-exclure="' + m.fichier + '" aria-label="' + (hors ? 'Remettre ' : 'Retirer de la liste ') + t + '" title="' + (hors ? 'Remettre dans la liste' : 'Retirer de la liste') + '" style="min-height:0;flex-shrink:0;width:38px;height:38px;padding:0;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:' + (hors ? '#67e8f9' : '#94a3b8') + ';cursor:pointer;display:flex;align-items:center;justify-content:center;">'
              + '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">' + (hors ? '<path d="M12 5v14M5 12h14"/>' : '<path d="M5 12h14"/>') + '</svg></button></div>';
          }).join('') + '</div>'
        : '<p class="settings-sub-desc" style="margin-top:8px;">' + (r.externe ? 'La musique de l\'app est coupée : celle de ton autre app continue pendant la séance.' : 'Aucun morceau avec ces filtres.') + '</p>');
      // v1493 : les musiques de combat restent une surprise, rien n'en est dit ici
    styles(); majProgression();
  }
  function brancherReglages() {
    var h = document.getElementById('awakMusReglages'); if (!h || h._ok) return;
    h._ok = true; h._maj = rendreReglages;
    h.addEventListener('change', function (e) {
      if (e.target.getAttribute('data-mus') !== 'fichier') return;
      var n = e.target.files ? e.target.files.length : 0;
      ajouterPerso(e.target.files).then(function (k) {
        try { if (typeof window.showToast === 'function') window.showToast(k ? k + ' morceau' + (k > 1 ? 'x ajoutés' : ' ajouté') : (n ? 'Ces fichiers ne sont pas de l\'audio' : 'Aucun fichier'), k ? 'success' : 'warning', 2500); } catch (x) { _awkE(x); }
        var r = reglages(); if (k && !r.perso) { r.perso = true; sauver(r); rendreReglages(); }
      }).catch(function () { try { window.showToast && window.showToast('Impossible d\'enregistrer ces fichiers (espace plein ?)', 'error', 3000); } catch (x) { _awkE(x); } });
      e.target.value = '';
    });
    h.addEventListener('click', function (e) {
      var ctl = e.target.closest && e.target.closest('[data-mus-ctl]');   // v1588 : carte « En cours »
      if (ctl) {
        var a1 = ctl.getAttribute('data-mus-ctl');
        if (a1 === 'prec') precedente(); else if (a1 === 'suiv') suivante(); else if (a1 === 'rep') basculerRepeter(); else basculer();
        setTimeout(rendreReglages, 250);
        return;
      }
      var imp = e.target.closest && e.target.closest('[data-mus="importer"]');
      if (imp) { var inp = h.querySelector('input[data-mus="fichier"]'); if (inp) inp.click(); return; }
      var exc = e.target.closest && e.target.closest('[data-exclure]');
      if (exc) {
        var f2 = exc.getAttribute('data-exclure'), r2 = reglages(), lx = exclus().slice(), k2 = lx.indexOf(f2);
        if (k2 >= 0) lx.splice(k2, 1); else lx.push(f2);
        r2.exclus = lx; sauver(r2);
        var c2 = courant(); preparerFile();
        if (c2 && c2.fichier === f2 && k2 < 0) { if (liste().length) suivante(); else arreter(); }
        rendreReglages(); majBarre();
        return;
      }
      var ret = e.target.closest && e.target.closest('[data-retirer]');
      if (ret) { retirerPerso(ret.getAttribute('data-retirer')); return; }
      var p = e.target.closest && e.target.closest('[data-piste]');
      if (p) {
        var f = p.getAttribute('data-piste'), cur = courant();
        if (cur && cur.fichier === f && audio && !audio.paused) { pause(); }
        else {
          if (!file.length || !file.some(function (m) { return m.fichier === f; })) preparerFile();
          var i = file.findIndex(function (m) { return m.fichier === f; });
          jouerIndex(i < 0 ? 0 : i);
        }
        setTimeout(rendreReglages, 150);
        return;
      }
      var t = e.target.closest && e.target.closest('.awk-mus-int[data-r]');
      if (!t) return;
      var r = reglages(), k = t.getAttribute('data-r'); r[k] = !r[k]; sauver(r);
      if (k === 'externe' && r.externe) arreter();
      if (k !== 'auto') { var c = courant(); preparerFile(); if (c && !liste().some(function (m) { return m.fichier === c.fichier; })) arreter(); }
      rendreReglages(); majBarre();
    });
    h.addEventListener('input', function (e) {
      if (e.target.getAttribute('data-r') !== 'volume') return;
      var r = reglages(); r.volume = Math.max(0, Math.min(1, e.target.value / 100)); sauver(r);
      if (audio && !audio.paused && !fondu) audio.volume = r.volume;
    });
    rendreReglages();
    // Rafraîchir quand le bloc redevient visible (mode jeu changé entre-temps…)
    try { new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) rendreReglages(); }).observe(h); } catch (e) { _awkE(e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancherReglages); else brancherReglages();

  try { if (window.indexedDB) chargerPerso(); } catch (e) { _awkE(e); }

  // v1479 : moment épique (climax du combat final) → la musique monte
  function intensifier() {
    if (enFinal()) return;   // v1517 : le combat final a ses propres boucles
    if (!audio || audio.paused) return;
    fonduVers(Math.min(1, volCible() + 0.3), 2500);
  }

  window.AwakMusique = { intensifier: intensifier, climaxFinal: climaxFinal, _audio: function () { return audio; }, ajouterPerso: ajouterPerso, retirerPerso: retirerPerso, perso: function () { return PERSO.slice(); }, liste: liste, tous: function () { return AWAK_MUSIQUES.slice(); }, lecture: lecture, pause: pause, suivante: suivante, precedente: precedente, arreter: arreter, reglages: reglages, rendreReglages: rendreReglages, joue: function () { return !!(audio && !audio.paused); }, courant: courant };
})();
