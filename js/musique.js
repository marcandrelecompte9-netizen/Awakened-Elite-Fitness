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
    { fichier: 'je_n_abandonne_pas.mp3', titre: 'Je n\'abandonne pas', type: 'finalboss' },   // combat final
    { fichier: 'combat.mp3', titre: 'Combat', type: 'combat' },                              // Faille ordinaire
    { fichier: 'game_over.mp3', titre: 'Game Over. Non, pas moi', type: 'gameover' },        // Faille ordinaire, 15 % de chance
    { fichier: 'level_up.mp3', titre: 'Level Up', type: 'jeu' },
    { fichier: 'rien_ne_m_arrete.mp3', titre: 'Rien ne m\'arrête', type: 'entrainement' },
    { fichier: 'le_reel_nous_lache_pas.mp3', titre: 'Le Réel nous lâche pas', type: 'entrainement' },
    { fichier: 'la_route_t_appartient.mp3', titre: 'La route t\'appartient', type: 'entrainement' },
    { fichier: 'sul_gym.mp3', titre: 'Sul gym', type: 'entrainement' },
    { fichier: 'jusqu_a_l_aurore.mp3', titre: 'Jusqu\'à l\'Aurore', type: 'entrainement' }
  ];

  var CLE = 'awakMusique';
  var DEF = { auto: true, jeu: true, entrainement: true, perso: true, externe: false, volume: 0.6 };

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
      PERSO.forEach(function (m) { try { URL.revokeObjectURL(m.url); } catch (e) {} });
      PERSO = (tout || []).sort(function (a, b) { return (a.ajout || 0) - (b.ajout || 0); }).map(function (x) {
        return { fichier: 'perso:' + x.id, id: x.id, titre: x.titre, type: 'perso', taille: x.taille || 0, url: URL.createObjectURL(x.blob) };
      });
      majBarre(); rendreReglages();
    }).catch(function () {});
  }
  function ajouterPerso(fichiers) {
    var liste = Array.prototype.slice.call(fichiers || []).filter(function (f) { return /^audio\//.test(f.type) || /\.(mp3|m4a|aac|wav|ogg|flac|opus)$/i.test(f.name); });
    if (!liste.length) return Promise.resolve(0);
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
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
    try { r = JSON.parse(localStorage.getItem(CLE) || '{}') || {}; } catch (e) {}
    var o = {}; for (var k in DEF) o[k] = (k in r) ? r[k] : DEF[k];
    return o;
  }
  function sauver(r) { try { localStorage.setItem(CLE, JSON.stringify(r)); } catch (e) {} }
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
  function permisCombat(type, ctx) {
    if (type === 'finalboss') return ctx === 'final';
    if (type === 'faille') return ctx === 'unique';
    if (type === 'combat') return ctx === 'faille' || ctx === 'faille+gameover';
    if (type === 'gameover') return ctx === 'faille+gameover';
    return false;
  }
  function liste() {
    var r = reglages(); if (r.externe) return [];   // « J'écoute ma musique dans une autre app »
    var jeu = r.jeu && modeJeu(), ctx = jeu ? contexte() : null;
    return AWAK_MUSIQUES.filter(function (m) { return SPECIAUX.indexOf(m.type) >= 0 ? permisCombat(m.type, ctx) : m.type === 'jeu' ? jeu : !!r.entrainement; })
      .concat(r.perso ? PERSO : []);
  }

  var audio = null, file = [], pos = -1, fondu = null, actif = false;
  function el() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = 'auto';
    try { audio.setAttribute('playsinline', ''); } catch (e) {}
    audio.addEventListener('ended', function () { suivante(); });
    audio.addEventListener('error', function () { if (actif && file.length > 1) setTimeout(suivante, 400); else majBarre(); });
    audio.addEventListener('play', majBarre);
    audio.addEventListener('pause', majBarre);
    return audio;
  }
  function melanger(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // Les morceaux de combat du contexte ouvrent la file (Game Over avant Combat),
  // le reste suit mélangé.
  var ORDRE = { finalboss: 0, gameover: 1, faille: 2, combat: 3 };
  function preparerFile() {
    var l = liste();
    var sp = l.filter(function (m) { return SPECIAUX.indexOf(m.type) >= 0; }).sort(function (a, b) { return ORDRE[a.type] - ORDRE[b.type]; });
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
      try { a.volume = Math.max(0, Math.min(1, de + (v - de) * k)); } catch (e) {}
      if (k >= 1) { clearInterval(fondu); fondu = null; if (apres) apres(); }
    }, 50);
  }

  function jouerIndex(i) {
    if (!file.length) preparerFile();
    if (!file.length) { majBarre(); return; }
    pos = ((i % file.length) + file.length) % file.length;
    var m = file[pos], a = el();
    a.src = m.url || ('audio/' + m.fichier);
    a.volume = 0;
    actif = true;
    var p = null;
    try { p = a.play(); } catch (e) {}
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
  function pause() { if (!audio) return; actif = false; fonduVers(0, 400, function () { try { audio.pause(); } catch (e) {} }); }
  function basculer() { if (audio && !audio.paused) pause(); else lecture(); }
  function suivante() { jouerIndex(pos + 1); }
  function precedente() {
    if (audio && audio.currentTime > 4) { audio.currentTime = 0; return; }
    jouerIndex(pos - 1);
  }
  function arreter() {
    actif = false;
    if (!audio || audio.paused) { majBarre(); return; }
    fonduVers(0, 1500, function () { try { audio.pause(); } catch (e) {} majBarre(); });
  }

  // ── Media Session : commandes sur l'écran verrouillé / casque ──
  function majMedia() {
    try {
      if (!('mediaSession' in navigator)) return;
      var m = courant(); if (!m) return;
      navigator.mediaSession.metadata = new MediaMetadata({ title: m.titre, artist: 'Awakened', album: m.type === 'perso' ? 'Mes musiques' : m.type === 'entrainement' ? 'Entraînement' : 'Musiques du jeu' });
      navigator.mediaSession.setActionHandler('play', lecture);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('nexttrack', suivante);
      navigator.mediaSession.setActionHandler('previoustrack', precedente);
    } catch (e) {}
  }

  // ── Icônes ──
  function svg(d, px) { return '<svg viewBox="0 0 24 24" width="' + (px || 18) + '" height="' + (px || 18) + '" fill="currentColor" aria-hidden="true">' + d + '</svg>'; }
  var IC = {
    prec: svg('<path d="M6 5h2v14H6zM20 5v14L9 12z"/>'),
    suiv: svg('<path d="M16 5h2v14h-2zM4 5l11 7-11 7z"/>'),
    lect: svg('<path d="M7 4.5v15L19.5 12z"/>', 20),
    paus: svg('<path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z"/>', 20),
    note: svg('<path d="M10 3v10.6A3.5 3.5 0 1 0 12 17V7h6V3z"/>', 15)
  };

  // ── Barre compacte dans l'écran de séance ──
  function barre() {
    var vue = document.getElementById('exerciseView');
    if (!vue) return null;
    var b = document.getElementById('awakMusBar');
    if (!b) {
      b = document.createElement('div');
      b.id = 'awakMusBar';
      b.setAttribute('data-emoji-keep', '');
      b.style.cssText = 'display:flex;align-items:center;gap:6px;margin:6px 12px 0;padding:5px 6px 5px 11px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);';
      var btn = 'min-height:0;width:34px;height:34px;padding:0;border-radius:50%;border:none;background:transparent;color:#cbd5e1;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;';
      b.innerHTML = '<span style="display:inline-flex;color:#94a3b8;flex-shrink:0;">' + IC.note + '</span>'
        + '<span class="awk-mus-titre" style="flex:1;min-width:0;font-size:12px;font-weight:700;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></span>'
        + '<button data-a="prec" aria-label="Musique précédente" style="' + btn + '">' + IC.prec + '</button>'
        + '<button data-a="lect" aria-label="Lecture ou pause" style="' + btn + 'background:rgba(255,255,255,0.08);color:#fff;">' + IC.lect + '</button>'
        + '<button data-a="suiv" aria-label="Musique suivante" style="' + btn + '">' + IC.suiv + '</button>';
      b.addEventListener('click', function (e) {
        var t = e.target.closest && e.target.closest('button[data-a]'); if (!t) return;
        e.stopPropagation();
        var a = t.getAttribute('data-a');
        if (a === 'prec') precedente(); else if (a === 'suiv') suivante(); else basculer();
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
    b.querySelector('.awk-mus-titre').textContent = m ? m.titre : 'Musique';
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
        if (!enSeance || !reglages().auto || !contexte()) return;
        var c = courant(); if (c && SPECIAUX.indexOf(c.type) >= 0) return;
        preparerFile(); if (file[0] && SPECIAUX.indexOf(file[0].type) >= 0) jouerIndex(0);
      }, 1200);
    } else {
      var fs = false; try { fs = typeof window.awakFailleEnCours === 'function' && window.awakFailleEnCours(true); } catch (e) {}
      if (audio && !audio.paused && fs) { surveillerFaille(); return; }
      arreter();
    }
  }
  function brancher() {
    try { new MutationObserver(surSeance).observe(document.body, { attributes: true, attributeFilter: ['class'] }); } catch (e) {}
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
        + '<span style="flex-shrink:0;width:44px;height:26px;border-radius:99px;position:relative;transition:background .2s;background:' + (on ? '#a855f7' : 'rgba(255,255,255,0.15)') + ';">'
        + '<span style="position:absolute;top:3px;left:' + (on ? '21px' : '3px') + ';width:20px;height:20px;border-radius:50%;background-color:rgb(248,250,252);transition:left .2s;"></span></span></button>';
    };
    var l = liste(), cur = courant();
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
      +     '<button data-mus="importer" style="min-height:0;flex-shrink:0;padding:9px 14px;border-radius:99px;border:1px solid rgba(168,85,247,0.55);background:rgba(168,85,247,0.15);color:#e9d5ff;font-weight:800;font-size:13px;cursor:pointer;">Ajouter</button>'
      +   '</div>'
      +   '<input type="file" accept="audio/*" multiple data-mus="fichier" style="display:none;">'
      +   (nPer ? '<div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;">' + PERSO.map(function (m) {
            return '<div style="display:flex;align-items:center;gap:8px;padding:7px 8px 7px 12px;border-radius:10px;background:rgba(255,255,255,0.03);">'
              + '<span style="flex:1;min-width:0;font-size:13px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + m.titre.replace(/[<>&"]/g, '') + '</span>'
              + '<span style="font-size:11px;color:#64748b;flex-shrink:0;">' + (m.taille ? (m.taille / 1048576).toFixed(1).replace('.', ',') + ' Mo' : '') + '</span>'
              + '<button data-retirer="' + m.id + '" aria-label="Retirer ' + m.titre.replace(/[<>&"]/g, '') + '" style="min-height:0;width:30px;height:30px;padding:0;border-radius:50%;border:none;background:rgba(255,255,255,0.06);color:#cbd5e1;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;">'
              + '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>';
          }).join('') + '</div>' : '')
      + '</div>'
      + '<label style="display:flex;align-items:center;gap:12px;margin:14px 2px 6px;font-size:13px;color:#cbd5e1;font-weight:700;">Volume'
      + '<input type="range" min="0" max="100" value="' + Math.round(r.volume * 100) + '" data-r="volume" style="flex:1;accent-color:#a855f7;"></label>'
      + (l.length ? '<div style="margin-top:8px;font-size:12px;color:#94a3b8;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Morceaux</div>'
        + '<div style="display:flex;flex-direction:column;gap:6px;margin-top:6px;">'
        + l.map(function (m) {
            var ici = cur && cur.fichier === m.fichier && audio && !audio.paused;
            return '<button data-piste="' + m.fichier + '" style="min-height:0;display:flex;align-items:center;gap:10px;text-align:left;padding:10px 12px;border-radius:12px;cursor:pointer;'
              + 'background:' + (ici ? 'rgba(168,85,247,0.14)' : 'rgba(255,255,255,0.03)') + ';border:1px solid ' + (ici ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)') + ';color:#e2e8f0;">'
              + '<span style="display:inline-flex;color:' + (ici ? '#c084fc' : '#94a3b8') + ';">' + (ici ? IC.paus : IC.lect) + '</span>'
              + '<span style="flex:1;min-width:0;font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + m.titre + '</span>'
              + '<span style="font-size:11px;color:#94a3b8;font-weight:700;">' + (m.type === 'perso' ? 'À moi' : m.type === 'jeu' ? 'Jeu' : 'Entraînement') + '</span></button>';
          }).join('') + '</div>'
        : '<p class="settings-sub-desc" style="margin-top:8px;">' + (r.externe ? 'La musique de l\'app est coupée : celle de ton autre app continue pendant la séance.' : 'Aucun morceau avec ces filtres.') + '</p>')
      + (jeuOk && r.jeu ? '<p class="settings-sub-desc" style="margin-top:10px;">Musiques de combat, jouées seulement dans leur combat : '
          + AWAK_MUSIQUES.filter(function (m) { return SPECIAUX.indexOf(m.type) >= 0; }).map(function (m) {
              return '« ' + m.titre + ' » (' + ({ finalboss: 'combat final', faille: 'Failles uniques', combat: 'Failles', gameover: 'Failles, parfois' })[m.type] + ')';
            }).join(', ') + '.</p>' : '');
  }
  function brancherReglages() {
    var h = document.getElementById('awakMusReglages'); if (!h || h._ok) return;
    h._ok = true; h._maj = rendreReglages;
    h.addEventListener('change', function (e) {
      if (e.target.getAttribute('data-mus') !== 'fichier') return;
      var n = e.target.files ? e.target.files.length : 0;
      ajouterPerso(e.target.files).then(function (k) {
        try { if (typeof window.showToast === 'function') window.showToast(k ? k + ' morceau' + (k > 1 ? 'x ajoutés' : ' ajouté') : (n ? 'Ces fichiers ne sont pas de l\'audio' : 'Aucun fichier'), k ? 'success' : 'warning', 2500); } catch (x) {}
        var r = reglages(); if (k && !r.perso) { r.perso = true; sauver(r); rendreReglages(); }
      }).catch(function () { try { window.showToast && window.showToast('Impossible d\'enregistrer ces fichiers (espace plein ?)', 'error', 3000); } catch (x) {} });
      e.target.value = '';
    });
    h.addEventListener('click', function (e) {
      var imp = e.target.closest && e.target.closest('[data-mus="importer"]');
      if (imp) { var inp = h.querySelector('input[data-mus="fichier"]'); if (inp) inp.click(); return; }
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
    try { new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) rendreReglages(); }).observe(h); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancherReglages); else brancherReglages();

  try { if (window.indexedDB) chargerPerso(); } catch (e) {}

  // v1479 : moment épique (climax du combat final) → la musique monte
  function intensifier() {
    if (!audio || audio.paused) return;
    fonduVers(Math.min(1, volCible() + 0.3), 2500);
  }

  window.AwakMusique = { intensifier: intensifier, ajouterPerso: ajouterPerso, retirerPerso: retirerPerso, perso: function () { return PERSO.slice(); }, liste: liste, tous: function () { return AWAK_MUSIQUES.slice(); }, lecture: lecture, pause: pause, suivante: suivante, precedente: precedente, arreter: arreter, reglages: reglages, rendreReglages: rendreReglages, joue: function () { return !!(audio && !audio.paused); }, courant: courant };
})();
