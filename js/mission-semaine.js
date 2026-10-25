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
  // v1439 : missions d'HISTOIRE — débloquées par une scène vue (vu), retirées
  // après une autre (avant). Elles passent avant les missions de base.
  var ECHEC = function (id) { try { return !!(window.awakNarrativeRiftFailed && window.awakNarrativeRiftFailed(id)); } catch (e) { return false; } };
  var HISTOIRE = [
    { id: 'encoches', vu: 'evt_serie_7', t: 'Les encoches', d: 'Nyra grave une encoche par jour d\'entraînement sur le lampadaire. Aide-la à remplir la semaine.' },
    { id: 'croissant', vu: 'evt_n5_boulangerie', si: function () { return !ECHEC('bakery_fading'); }, t: 'Le croissant du bout', d: 'Nyra repasse chaque matin devant la boulangerie. Chaque séance garde la vitrine allumée.' },
    { id: 'chanson', vu: 'evt_oubli_chanson', avant: 'evt_chanson_retrouvee', t: 'Garder la chanson', d: 'Une chanson que plus personne ne connaît. Chaque séance en garde un couplet.' },
    { id: 'traces', vu: 'evt_n15_ambiance_traces', avant: 'evt_n35_ambiance_nabdano_nom', t: 'Les pas anciens', d: 'Des pas anciens dans la poussière blanche. Chaque séance les suit un peu plus loin.' },
    { id: 'cailloux', vu: 'evt_n17_fait_nyra', t: 'Collection de cailloux', d: 'Nyra cherche un caillou parfait pour chaque séance. Rapporte-lui de quoi remplir la semaine.' },
    { id: 'mur', vu: 'evt_boulangerie_faille', si: function () { return ECHEC('bakery_fading'); }, t: 'Un mur propre', d: 'Là où était la boulangerie, il n\'y a plus qu\'un mur. Chaque séance aide Nyra à se souvenir qu\'il y avait quelque chose.' },
    { id: 'inscription', vu: 'evt_n31_dialogue_duo', avant: 'evt_n35_ambiance_nabdano_nom', t: 'L\'inscription', d: 'Sur le mur, l\'inscription s\'efface lettre par lettre. Chaque séance en sauve une.' },
    { id: 'nom', vu: 'evt_n35_ambiance_nabdano_nom', avant: 'evt_fin_ancre', t: 'Le nom qu\'on n\'oublie pas', d: 'Le Système répète un nom pour ne pas le perdre. Chaque séance le grave un peu plus profond.' },
    { id: 'voix', vu: 'evt_n39_ambiance_voix', avant: 'evt_echo_retour', t: 'Faire taire la voix', d: 'La voix revient la nuit, et elle a la tienne. Chaque séance la fait reculer d\'une rue.' },
    { id: 'portee', vu: 'evt_echo_retour', t: 'Rester à portée', d: 'Depuis l\'Écho, Esen et Nyra ne s\'éloignent plus d\'une salle. Chaque séance les garde à portée de voix.' },
    { id: 'vraievoix', vu: 'evt_faux_systeme', avant: 'evt_fin_ancre', t: 'La vraie voix', d: 'Deux voix s\'affichent encore, parfois. Chaque séance t\'apprend à reconnaître la bonne.' },
    { id: 'clients', vu: 'evt_marchand_dette', t: 'Clients fidèles', d: 'Le Marchand tient tant qu\'on lui rend visite. Chaque séance compte comme une visite.' },
    { id: 'ville', vu: 'evt_nabdano_passe', avant: 'evt_fin_ancre', t: 'La ville figée', d: 'La ville que Nabdano a portée commence à bouger. Chaque séance remet une rue en mouvement.' },
    { id: 'porte', vu: 'evt_avant_porte_bilan', avant: 'evt_fin_ancre', t: 'Avant la porte', d: 'La Dernière Porte attend. Chaque séance te rend plus solide pour la franchir.' },
    { id: 'questions', vu: 'evt_quatre_epreuves', avant: 'evt_fin_ancre', t: 'Quatre questions', d: 'Les quatre gardiens observent. Chaque séance est une réponse.' },
    { id: 'noms', vu: 'evt_fin_ancre', t: 'Les rues retrouvent leurs noms', d: 'Après l\'Effaceur, les rues reprennent leurs noms une à une. Chaque séance en rend un.' },
    { id: 'reste', vu: 'evt_ce_qui_reste', t: 'Ce qui reste', d: 'Des milliers d\'objets rangés attendent quelqu\'un. Chaque séance en rend un à son propriétaire.' }
  ];
  function vue(id) { try { return !!(window.storyEventSeen && window.storyEventSeen(id)); } catch (e) { return false; } }
  function disponibles() {
    return HISTOIRE.filter(function (m) {
      if (!vue(m.vu)) return false;
      if (m.avant && vue(m.avant)) return false;
      if (m.si) { try { if (!m.si()) return false; } catch (e) { return false; } }
      return true;
    });
  }
  function cleChoix() { try { return window._cleProfil('awakMissionSemChoix'); } catch (e) { return 'awakMissionSemChoix'; } }

  function actif() { try { return typeof window.rpgEnabled === 'function' && window.rpgEnabled(); } catch (e) { return false; } }
  function lundi(d) { d = d || new Date(); var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function cleSemaine() { try { return window.awakJourLocal(lundi()); } catch (e) { return lundi().toDateString(); } }
  function clePaye() { try { return window._cleProfil('awakMissionSemPayee'); } catch (e) { return 'awakMissionSemPayee'; } }
  function ico(n, t, c) { try { return (window.AwakIcon && AwakIcon.get(n, t, c)) || ''; } catch (e) { return ''; } }

  function missionDeBase() {
    var l = lundi(), n = Math.floor(l.getTime() / (7 * 86400000));
    return MISSIONS[((n % MISSIONS.length) + MISSIONS.length) % MISSIONS.length];
  }
  // v1439 : la mission est CHOISIE une fois par semaine (puis gardée jusqu'à lundi,
  // même si une scène débloque autre chose entre-temps). Priorité aux missions
  // d'histoire les plus récentes, sans reprendre une des 3 dernières semaines.
  function mission() {
    var sem = cleSemaine(), o = null;
    try { o = JSON.parse(localStorage.getItem(cleChoix()) || 'null'); } catch (e) {}
    if (o && o.sem === sem && o.t) return { t: o.t, d: o.d };
    var recentes = (o && Array.isArray(o.hist)) ? o.hist : [];
    var dispo = disponibles().filter(function (m) { return recentes.indexOf(m.id) < 0; });
    var m = dispo.length ? dispo[dispo.length - 1] : null;
    var choix = m ? { id: m.id, t: m.t, d: m.d } : (function () { var b = missionDeBase(); return { id: 'base:' + b.t, t: b.t, d: b.d }; })();
    try { localStorage.setItem(cleChoix(), JSON.stringify({ sem: sem, id: choix.id, t: choix.t, d: choix.d, hist: [choix.id].concat(recentes).slice(0, 3) })); } catch (e) {}
    return { t: choix.t, d: choix.d };
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
      + '<div style="font-size:0.76em;color:#e2e8f0;">' + bas + '</div>';
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

  window.AwakMission = { etat: etat, verser: verser, carte: carte, ligneFin: ligneFin, _mission: mission, _histoire: HISTOIRE, _disponibles: disponibles };
})();
