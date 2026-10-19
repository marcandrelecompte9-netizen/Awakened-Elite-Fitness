// v1410 — Mission de la semaine (mode Aventure).
// Relie l'objectif de séances de la semaine (tuile « Cette semaine » de
// l'Accueil) au monde d'Esen et Nyra : chaque séance réelle fait avancer la
// mission ; objectif atteint → XP versée une fois. Semaine manquée : aucune
// perte, une nouvelle mission commence le lundi.
// Affichée dans l'onglet Jeu (sous la Carte de Chasseur) et en fin de séance.
(function () {
  'use strict';

  var MISSIONS = [
    { t: 'Patrouille du quartier', d: 'Les rues autour de l\'appartement pâlissent. Chaque séance garde le quartier visible une semaine de plus.' },
    { t: 'Escorte du Marchand', d: 'Le Marchand traverse la ville avec sa charrette. Chaque séance trace un bout de chemin devant lui.' },
    { t: 'Sceller les fissures', d: 'De petites fissures s\'ouvrent dans les murs. Chaque séance en referme une.' },
    { t: 'Rallumer les lampadaires', d: 'La lumière du quartier faiblit. Chaque séance rallume un lampadaire.' },
    { t: 'Tenir la ligne', d: 'Esen garde le pont, Nyra le carrefour. Chaque séance leur donne une nuit de plus.' }
  ];

  function actif() { try { return typeof window.rpgEnabled === 'function' && window.rpgEnabled(); } catch (e) { return false; } }
  function lundi(d) { d = d || new Date(); var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function cleSemaine() { try { return window.awakJourLocal(lundi()); } catch (e) { return lundi().toDateString(); } }
  function clePaye() { try { return window._cleProfil('awakMissionSemPayee'); } catch (e) { return 'awakMissionSemPayee'; } }
  function ico(n, t, c) { try { return (window.AwakIcon && AwakIcon.get(n, t, c)) || ''; } catch (e) { return ''; } }

  function mission() {
    var l = lundi(), n = Math.floor(l.getTime() / (7 * 86400000));
    return MISSIONS[((n % MISSIONS.length) + MISSIONS.length) % MISSIONS.length];
  }
  function recompense(visee) { return 100 + 60 * Math.max(1, Math.min(7, visee || 3)); }

  function etat() {
    var s = null;
    try { s = window.AwakHomePro && AwakHomePro.semaine ? AwakHomePro.semaine() : null; } catch (e) {}
    if (!s || !s.visee) return null;
    var m = mission(), visee = Math.max(1, s.visee), fait = Math.max(0, s.fait || 0);
    var paye = false; try { paye = localStorage.getItem(clePaye()) === cleSemaine(); } catch (e) {}
    return { titre: m.t, texte: m.d, fait: fait, visee: visee, xp: recompense(visee), finie: fait >= visee, payee: paye };
  }

  // Verse l'XP une seule fois par semaine, dès que l'objectif est atteint.
  function verser() {
    if (!actif()) return 0;
    var e = etat();
    if (!e || !e.finie || e.payee) return 0;
    if (typeof window.awakGrantLifetimeXP !== 'function') return 0;
    try { localStorage.setItem(clePaye(), cleSemaine()); } catch (x) { return 0; }
    window.awakGrantLifetimeXP(e.xp);
    try { if (typeof showToast === 'function') showToast('Mission accomplie : ' + e.titre + ' (+' + e.xp + ' XP)', 'success', 3500); } catch (x) {}
    return e.xp;
  }

  function pastilles(e) {
    var h = '';
    for (var i = 0; i < e.visee; i++) {
      h += '<span style="flex:1;height:7px;border-radius:99px;' + (i < e.fait ? 'background:linear-gradient(90deg,#a78bfa,#7c3aed);' : 'background:rgba(255,255,255,0.08);') + '"></span>';
    }
    return '<div style="display:flex;gap:4px;margin:10px 0 7px;">' + h + '</div>';
  }

  // Carte pour l'onglet Jeu
  function carte() {
    if (!actif()) return null;
    var e = etat(); if (!e) return null;
    var c = document.createElement('div');
    c.id = 'awakMissionSemaine';
    c.style.cssText = 'margin:0 0 12px;padding:14px 16px;border-radius:14px;background:linear-gradient(160deg,rgba(124,58,237,0.16),rgba(124,58,237,0.04));border:1px solid rgba(167,139,250,0.4);';
    var bas = e.payee || e.finie
      ? '<span style="color:#c4b5fd;font-weight:800;">Mission accomplie</span> · +' + e.xp + ' XP reçus'
      : e.fait + ' / ' + e.visee + ' séance' + (e.visee > 1 ? 's' : '') + ' · <span style="color:#c4b5fd;font-weight:800;">+' + e.xp + ' XP</span> à la fin';
    c.innerHTML = '<div style="display:flex;align-items:center;gap:8px;">' + ico('bouclier', 17, '#c4b5fd')
      + '<span style="font-size:0.66em;font-weight:800;letter-spacing:1.2px;color:#c4b5fd;text-transform:uppercase;">Mission de la semaine</span></div>'
      + '<div style="font-size:1em;font-weight:900;color:#f8fafc;margin-top:6px;">' + e.titre + '</div>'
      + '<div style="font-size:0.78em;color:#cbd5e1;line-height:1.45;margin-top:3px;">' + e.texte + '</div>'
      + pastilles(e)
      + '<div style="font-size:0.76em;color:#e2e8f0;">' + bas + '</div>'
      + '<div style="font-size:0.68em;color:#8b98aa;margin-top:6px;">Objectif tiré de ta semaine (tuile « Cette semaine » de l\'Accueil). Semaine manquée : aucune perte, une nouvelle mission commence lundi.</div>';
    return c;
  }

  // Ligne pour l'écran de fin de séance
  function ligneFin() {
    if (!actif()) return '';
    var e = etat(); if (!e) return '';
    var t = e.finie
      ? 'Mission « ' + e.titre + ' » accomplie' + (e.payee ? ' · +' + e.xp + ' XP' : '')
      : 'Mission « ' + e.titre + ' » : ' + e.fait + ' / ' + e.visee + (e.visee - e.fait === 1 ? ' · plus qu\'une séance' : ' · encore ' + (e.visee - e.fait) + ' séances');
    return '<div style="display:flex;align-items:center;gap:7px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.07);font-size:0.74em;color:#c4b5fd;font-weight:700;">'
      + ico('bouclier', 14, '#c4b5fd') + '<span>' + t + '</span></div>';
  }

  window.AwakMission = { etat: etat, verser: verser, carte: carte, ligneFin: ligneFin, _mission: mission };
})();
