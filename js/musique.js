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
    { fichier: 'awakened_intro.mp3', titre: 'Awakened — Intro', type: 'jeu' },
    { fichier: 'brise_la_faille.mp3', titre: 'Brise la faille', type: 'jeu' },
    { fichier: 'level_up.mp3', titre: 'Level Up', type: 'jeu' },
    { fichier: 'rien_ne_m_arrete.mp3', titre: 'Rien ne m\'arrête', type: 'entrainement' }
  ];

  var CLE = 'awakMusique';
  var DEF = { auto: true, jeu: true, entrainement: true, volume: 0.6 };

  function reglages() {
    var r = {};
    try { r = JSON.parse(localStorage.getItem(CLE) || '{}') || {}; } catch (e) {}
    var o = {}; for (var k in DEF) o[k] = (k in r) ? r[k] : DEF[k];
    return o;
  }
  function sauver(r) { try { localStorage.setItem(CLE, JSON.stringify(r)); } catch (e) {} }
  function modeJeu() { try { return typeof window.rpgEnabled === 'function' ? window.rpgEnabled() : localStorage.getItem('fitproGameMode') === '1'; } catch (e) { return false; } }

  // Morceaux retenus par le filtre (les morceaux « jeu » exigent le mode jeu)
  function liste() {
    var r = reglages(), jeu = r.jeu && modeJeu();
    return AWAK_MUSIQUES.filter(function (m) { return m.type === 'jeu' ? jeu : !!r.entrainement; });
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
  function preparerFile() { file = melanger(liste()); pos = -1; }
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
    a.src = 'audio/' + m.fichier;
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
      navigator.mediaSession.metadata = new MediaMetadata({ title: m.titre, artist: 'Awakened', album: m.type === 'jeu' ? 'Musiques du jeu' : 'Entraînement' });
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
  function surSeance() {
    var s = document.body.classList.contains('in-session');
    if (s === enSeance) return;
    enSeance = s;
    if (s) {
      if (!liste().length) return;
      barre(); majBarre();
      if (reglages().auto && !(audio && !audio.paused)) { preparerFile(); jouerIndex(0); }
    } else {
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
    var nEnt = AWAK_MUSIQUES.length - nJeu;
    var interr = function (id, on, titre, sous, off) {
      return '<div class="equipment-item' + (on ? ' selected' : '') + '" data-r="' + id + '" style="cursor:pointer;' + (off ? 'opacity:0.45;pointer-events:none;' : '') + '">'
        + '<div class="equipment-checkmark">✓</div><div class="equipment-name">' + titre + '</div><div class="equipment-count">' + sous + '</div></div>';
    };
    var l = liste(), cur = courant();
    h.innerHTML = '<div style="display:grid;grid-template-columns:1fr;gap:10px;">'
      + interr('auto', r.auto, 'Démarrer seule en séance', r.auto ? 'Au début de chaque séance' : 'Je lance moi-même')
      + interr('jeu', r.jeu && jeuOk, 'Musiques du jeu', jeuOk ? nJeu + ' morceau' + (nJeu > 1 ? 'x' : '') : 'Mode jeu désactivé', !jeuOk)
      + interr('entrainement', r.entrainement, 'Musiques d\'entraînement', nEnt + ' morceau' + (nEnt > 1 ? 'x' : ''))
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
              + '<span style="font-size:11px;color:#94a3b8;font-weight:700;">' + (m.type === 'jeu' ? 'Jeu' : 'Entraînement') + '</span></button>';
          }).join('') + '</div>'
        : '<p class="settings-sub-desc" style="margin-top:8px;">Aucun morceau avec ces filtres.</p>');
  }
  function brancherReglages() {
    var h = document.getElementById('awakMusReglages'); if (!h || h._ok) return;
    h._ok = true; h._maj = rendreReglages;
    h.addEventListener('click', function (e) {
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
      var t = e.target.closest && e.target.closest('.equipment-item[data-r]');
      if (!t) return;
      var r = reglages(), k = t.getAttribute('data-r'); r[k] = !r[k]; sauver(r);
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

  window.AwakMusique = { liste: liste, tous: function () { return AWAK_MUSIQUES.slice(); }, lecture: lecture, pause: pause, suivante: suivante, precedente: precedente, arreter: arreter, reglages: reglages, rendreReglages: rendreReglages, joue: function () { return !!(audio && !audio.paused); }, courant: courant };
})();
