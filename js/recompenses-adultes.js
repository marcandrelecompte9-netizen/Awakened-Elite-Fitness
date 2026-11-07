/* ═══════════════════════════════════════════════════════════════════
   RÉCOMPENSES DES ADULTES — v1696  (onglet Plus › Récompenses)
   · L'adulte se fixe des objectifs concrets : « 20 séances = massage »,
     « 600 minutes = souliers de course ». Compté depuis la création.
   · Il se l'offre lui-même, OU la fait offrir par un autre adulte du
     téléphone (volet couple) : à l'objectif atteint, l'autre voit un
     bandeau « … a atteint son objectif · Je l'offre ».
   · Clé GLOBALE « awakRecompAdultes » { pid: [récompense] } : le
     conjoint doit lire les objectifs de l'autre.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var CLE = 'awakRecompAdultes';
  var OR = '#fbbf24', CY = '#22d3ee';
  var SUGG = [
    { nom: 'Nouvelle gourde', mode: 'seances', cible: 8 },
    { nom: 'Une sortie au choix', mode: 'seances', cible: 10 },
    { nom: 'Un vêtement de sport', mode: 'seances', cible: 15 },
    { nom: 'Un massage', mode: 'seances', cible: 20 },
    { nom: 'Nouveaux souliers de course', mode: 'seances', cible: 30 },
    { nom: 'Un livre ou un film', mode: 'minutes', cible: 300 },
    { nom: 'Une journée détente', mode: 'minutes', cible: 600 },
    { nom: 'Un nouvel équipement', mode: 'minutes', cible: 1200 }
  ];
  // v1697 : récompenses de la SEMAINE (reviennent chaque lundi)
  var SUGG_SEM = [
    { nom: 'Une soirée film', mode: 'seances', cible: 4 },
    { nom: 'Une grasse matinée', mode: 'seances', cible: 3 },
    { nom: 'Un bain ou une douche longue', mode: 'seances', cible: 3 },
    { nom: 'Une sortie de fin de semaine', mode: 'seances', cible: 4 },
    { nom: 'Une heure juste pour moi', mode: 'minutes', cible: 150 },
    { nom: 'Une soirée jeux', mode: 'minutes', cible: 120 }
  ];
  // v1698 : packs prêts à l'emploi selon le rythme (1 récompense de la semaine + 3 paliers)
  var PACKS = [
    { id: 'debut', nom: 'Je commence', rythme: '2 séances par semaine', min: 0, max: 2.4, items: [
      { nom: 'Une soirée film', mode: 'seances', cible: 2, hebdo: true },
      { nom: 'Nouvelle gourde', mode: 'seances', cible: 6 },
      { nom: 'Un vêtement de sport', mode: 'seances', cible: 12 },
      { nom: 'Un massage', mode: 'seances', cible: 24 } ] },
    { id: 'regulier', nom: 'Régulier', rythme: '3 à 4 séances par semaine', min: 2.4, max: 4.5, items: [
      { nom: 'Une soirée film', mode: 'seances', cible: 3, hebdo: true },
      { nom: 'Un vêtement de sport', mode: 'seances', cible: 15 },
      { nom: 'Un massage', mode: 'seances', cible: 30 },
      { nom: 'Nouveaux souliers de course', mode: 'seances', cible: 45 } ] },
    { id: 'sportif', nom: 'Sportif', rythme: '5 séances et plus par semaine', min: 4.5, max: 99, items: [
      { nom: 'Une heure juste pour moi', mode: 'seances', cible: 5, hebdo: true },
      { nom: 'Un vêtement de sport', mode: 'seances', cible: 25 },
      { nom: 'Un massage', mode: 'seances', cible: 50 },
      { nom: 'Un nouvel équipement', mode: 'seances', cible: 80 } ] }
  ];
  // Rythme réel : moyenne des 4 dernières semaines
  function rythme() {
    try { var t0 = Date.now() - 28 * 864e5; return (window.getWorkoutHistory ? getWorkoutHistory() : []).filter(function (h) { return h && h.date && new Date(h.date).getTime() >= t0; }).length / 4; } catch (e) { return 0; }
  }
  var _packsOuverts = false;
  function packsHTML() {
    var r = rythme(), conseil = PACKS.filter(function (p) { return r >= p.min && r < p.max; })[0] || PACKS[0];
    return '<div style="font-size:0.78em;color:#8b95a5;font-weight:700;margin:6px 0 8px;">Packs prêts à l\'emploi</div>'
      + PACKS.map(function (p) {
        var c = p.id === conseil.id;
        return '<div style="padding:12px;border-radius:12px;background:#141821;margin-bottom:8px;border:1px solid ' + (c ? 'rgba(251,191,36,0.5)' : 'transparent') + ';">'
          + '<div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;min-width:0;"><span style="color:#fff;font-weight:900;font-size:0.92em;">' + p.nom + '</span>'
          + (c ? ' <span style="font-size:0.62em;font-weight:900;color:#1a1204;background:' + OR + ';padding:2px 7px;border-radius:99px;vertical-align:2px;">POUR TOI</span>' : '')
          + '<div style="font-size:0.72em;color:#94a3b8;margin-top:2px;">' + p.rythme + '</div></div></div>'
          + '<div style="margin:8px 0 10px;font-size:0.78em;color:#cbd5e1;line-height:1.6;">'
          + p.items.map(function (it) { return '· ' + esc(it.nom) + ' — <span style="color:#fde68a;">' + unite(it, it.cible) + (it.hebdo ? ' par semaine' : '') + '</span>'; }).join('<br>')
          + '</div><button onclick="AwakRecomp.pack(\'' + p.id + '\')" style="' + BTN + 'width:100%;padding:10px;font-size:0.84em;' + (c ? 'background:' + OR + ';color:#1a1204;border:none;' : 'background:transparent;color:#fde68a;border:1px solid rgba(251,191,36,0.45);') + '">Ajouter ce pack</button></div>';
      }).join('');
  }
  function ajouterPack(id) {
    var p = PACKS.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    var d = lire(), l = mes(d, pidActif()), n = 0;
    p.items.forEach(function (it) {
      if (l.some(function (r) { return r.nom === it.nom && !!r.hebdo === !!it.hebdo && r.etat !== 'obtenue'; })) return;
      l.push({ id: uid(), nom: it.nom, mode: it.mode, cible: it.cible, offreur: null, depuis: it.hebdo ? lundi().toISOString() : new Date().toISOString(), etat: 'cours', hebdo: !!it.hebdo, semaine: it.hebdo ? cleSemaine() : undefined });
      n++;
    });
    majEtats(d); ecrire(d); _packsOuverts = false;
    toast(n ? 'Pack « ' + p.nom + ' » : ' + n + ' objectif' + (n > 1 ? 's' : '') + ' ajouté' + (n > 1 ? 's' : '') + '. Touche « Modifier » pour qu\'un conjoint te les offre.' : 'Ces objectifs sont déjà là', n ? 'success' : 'info');
    ouvrir(); rafraichir();
  }
  function lundi(t) { var d = new Date(t || Date.now()); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
  function cleSemaine(t) { var d = lundi(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  function _e(x) { try { if (window._awkE) window._awkE(x); } catch (y) { /* rien */ } }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ic(n, t, c) { return (window.AwakIcon && AwakIcon.get) ? AwakIcon.get(n, t, c) : ''; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function toast(t, k) { try { if (window.showToast) window.showToast(t, k || 'success', 2800); } catch (e) { _e(e); } }

  function lire() { var d = null; try { d = JSON.parse(localStorage.getItem(CLE) || 'null'); } catch (e) { d = null; } return (d && typeof d === 'object') ? d : {}; }
  function ecrire(d) { try { localStorage.setItem(CLE, JSON.stringify(d)); } catch (e) { _e(e); } }
  function pidActif() { try { return (typeof window.getCurrentProfileId === 'function' ? window.getCurrentProfileId() : null) || localStorage.getItem('currentProfileId') || 'solo'; } catch (e) { return 'solo'; } }
  function profils() { try { return (typeof window.getAllProfiles === 'function' ? window.getAllProfiles() : JSON.parse(localStorage.getItem('allProfiles') || '[]')) || []; } catch (e) { return []; } }
  function estEnfant(pid) { try { return !!(window.AwakYouth && AwakYouth.isChildProfile && AwakYouth.isChildProfile(pid)); } catch (e) { return false; } }
  function adultes() { return profils().filter(function (p) { return p && p.id && !estEnfant(p.id); }); }
  function nomDe(pid) { var p = profils().filter(function (x) { return x.id === pid; })[0]; return p ? (p.name || 'Quelqu\'un') : 'Quelqu\'un'; }
  function mes(d, pid) { if (!Array.isArray(d[pid])) d[pid] = []; return d[pid]; }

  // Historique d'un profil (le sien ou celui du conjoint)
  function histoire(pid) {
    try {
      if (pid === pidActif() && typeof window.getWorkoutHistory === 'function') return window.getWorkoutHistory() || [];
      var s = localStorage.getItem('profile_' + pid + '_workoutHistory');
      return s ? (JSON.parse(s) || []) : [];
    } catch (e) { return []; }
  }
  function avance(pid, r) {
    var t0 = new Date(r.depuis).getTime(), n = 0;
    if (r.hebdo) t0 = Math.max(t0, lundi().getTime());   // v1697 : seulement la semaine en cours
    histoire(pid).forEach(function (h) {
      var t = h && h.date ? new Date(h.date).getTime() : 0;
      if (!t || t < t0) return;
      n += r.mode === 'minutes' ? (+h.duration || 0) : 1;
    });
    return Math.round(n);
  }
  // Met à jour l'état (en cours → atteinte) ; renvoie true si quelque chose a changé
  function majEtats(d) {
    var ch = false;
    Object.keys(d).forEach(function (pid) {
      (d[pid] || []).forEach(function (r) {
        // v1697 : nouvelle semaine → la récompense hebdo repart à zéro
        if (r.hebdo && r.semaine !== cleSemaine()) { r.semaine = cleSemaine(); r.etat = 'cours'; r.vuAtteinte = false; r.vuObtenue = true; ch = true; }
        if (r.etat === 'cours' && avance(pid, r) >= r.cible) { r.etat = 'atteinte'; r.atteinteLe = Date.now(); r.vuAtteinte = false; ch = true; }
      });
    });
    return ch;
  }
  function unite(r, n) { return r.mode === 'minutes' ? (n + ' min') : (n + ' séance' + (n > 1 ? 's' : '')); }

  // ── Feuille ──
  var BTN = 'min-height:auto;border-radius:12px;cursor:pointer;font-family:inherit;font-weight:800;';
  var PLEIN = BTN + 'background:' + OR + ';color:#1a1204;border:none;padding:13px;width:100%;font-size:0.92em;';
  var VIDE = BTN + 'background:transparent;color:#cbd5e1;border:1px solid rgba(255,255,255,0.14);padding:12px;width:100%;font-size:0.86em;';
  function feuille(html) {
    var v = document.getElementById('awakRecompSheet'); if (v) v.remove();
    var o = document.createElement('div'); o.id = 'awakRecompSheet';
    o.style.cssText = 'position:fixed;inset:0;z-index:12000;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end;justify-content:center;';
    o.innerHTML = '<div style="width:100%;max-width:520px;background:#0d0f13;border-top:1px solid rgba(251,191,36,0.3);border-radius:20px 20px 0 0;padding:18px 16px calc(20px + env(safe-area-inset-bottom));max-height:90vh;overflow-y:auto;box-sizing:border-box;">'
      + '<div style="width:36px;height:4px;background:rgba(255,255,255,0.18);border-radius:99px;margin:0 auto 14px;"></div>' + html + '</div>';
    o.addEventListener('click', function (ev) { if (ev.target === o) o.remove(); });
    document.body.appendChild(o);
  }
  function fermer() { var v = document.getElementById('awakRecompSheet'); if (v) v.remove(); }
  function pastille(on, t, f) {
    return '<button onclick="' + f + '" style="' + BTN + 'padding:8px 13px;font-size:0.8em;' + (on ? 'background:' + OR + ';color:#1a1204;border:1px solid ' + OR + ';' : 'background:#1a1e26;color:#cbd5e1;border:1px solid #1a1e26;') + '">' + t + '</button>';
  }
  function barre(v, max) {
    var p = max > 0 ? Math.min(100, Math.round(v / max * 100)) : 100;
    return '<div style="height:7px;border-radius:99px;background:rgba(255,255,255,0.08);overflow:hidden;"><div style="height:100%;width:' + p + '%;background:' + OR + ';border-radius:99px;"></div></div>';
  }

  // ── Écran principal ──
  function ouvrir() {
    var d = lire(); if (majEtats(d)) ecrire(d);
    var pid = pidActif(), l = mes(d, pid);
    var aOffrir = [];
    Object.keys(d).forEach(function (o) { if (o !== pid) (d[o] || []).forEach(function (r) { if (r.offreur === pid && r.etat === 'atteinte') aOffrir.push({ pid: o, r: r }); }); });
    var enCours = l.filter(function (r) { return r.etat !== 'obtenue' || r.hebdo; }), obtenues = l.filter(function (r) { return r.etat === 'obtenue' && !r.hebdo; });
    var h = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">' + ic('trophee', 24, OR)
      + '<div style="font-size:1.2em;font-weight:900;color:#fff;">Mes récompenses</div></div>'
      + '<div style="font-size:0.8em;color:#94a3b8;line-height:1.45;margin-bottom:14px;">Fixe-toi un objectif en séances ou en minutes, une fois ou chaque semaine, et ce que tu t\'offres en l\'atteignant.</div>';
    if (aOffrir.length) {
      h += '<div style="font-size:0.78em;color:#fde68a;font-weight:800;margin:4px 0 8px;">À offrir</div>'
        + aOffrir.map(function (x) {
          return '<div style="padding:12px;border-radius:12px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.4);margin-bottom:8px;">'
            + '<div style="color:#fff;font-weight:800;font-size:0.9em;">' + esc(nomDe(x.pid)) + ' a atteint son objectif</div>'
            + '<div style="font-size:0.8em;color:#fde68a;margin:3px 0 10px;">« ' + esc(x.r.nom) + ' » · ' + unite(x.r, x.r.cible) + '</div>'
            + '<button onclick="AwakRecomp.offrir(\'' + x.pid + '\',\'' + x.r.id + '\')" style="' + PLEIN + 'padding:10px;">Je l\'offre</button></div>';
        }).join('');
    }
    h += '<div style="font-size:0.78em;color:#8b95a5;font-weight:700;margin:6px 0 8px;">En cours</div>'
      + (enCours.length ? enCours.map(function (r) {
        var n = avance(pid, r), fini = r.etat === 'atteinte', prise = r.hebdo && r.etat === 'obtenue';
        return '<div style="padding:12px;border-radius:12px;background:#141821;margin-bottom:8px;' + (fini ? 'border:1px solid rgba(251,191,36,0.5);' : '') + '">'
          + '<div style="display:flex;align-items:flex-start;gap:8px;">'
          +   '<div style="flex:1;min-width:0;"><div style="color:#f1f5f9;font-weight:800;font-size:0.9em;">' + esc(r.nom) + '</div>'
          +   '<div style="font-size:0.72em;color:#94a3b8;margin-top:2px;">' + (r.hebdo ? '<b style="color:#67e8f9;">Chaque semaine</b> · ' : '') + (r.offreur ? 'Offerte par ' + esc(nomDe(r.offreur)) : 'Je me l\'offre') + (r.hebdo && r.fois ? ' · obtenue ' + r.fois + ' fois' : '') + '</div></div>'
          +   '<button onclick="AwakRecomp.editer(\'' + r.id + '\')" style="' + BTN + 'padding:6px 9px;font-size:0.72em;background:transparent;color:#cbd5e1;border:1px solid rgba(255,255,255,0.12);">Modifier</button>'
          + '</div>'
          + '<div style="margin-top:10px;">' + barre(n, r.cible) + '</div>'
          + '<div style="font-size:0.74em;color:#cbd5e1;margin-top:6px;">' + (prise ? '<b style="color:#fde68a;">Obtenue cette semaine.</b> Ça repart lundi.'
              : fini ? '<b style="color:#fde68a;">Objectif atteint !</b> ' + (r.offreur ? esc(nomDe(r.offreur)) + ' a été prévenu.' : '')
              : Math.min(n, r.cible) + ' / ' + unite(r, r.cible) + (r.hebdo ? ' cette semaine' : '') + ' · encore ' + unite(r, r.cible - n)) + '</div>'
          + (fini && !r.offreur ? '<button onclick="AwakRecomp.prendre(\'' + r.id + '\')" style="' + PLEIN + 'padding:10px;margin-top:10px;">Je me l\'offre</button>' : '')
          + '</div>';
      }).join('') : '<div style="padding:14px;border-radius:12px;background:#141821;color:#94a3b8;font-size:0.84em;text-align:center;">Aucun objectif pour l\'instant.</div>')
      + '<button onclick="AwakRecomp.editer()" style="' + PLEIN + 'margin-top:6px;">+ Nouvel objectif</button>'
      // v1698 : packs — affichés d'office tant qu'il n'y a aucun objectif
      + (!l.length || _packsOuverts ? '<div style="margin-top:14px;">' + packsHTML() + '</div>'
          : '<button onclick="AwakRecomp._packs()" style="' + VIDE + 'margin-top:8px;">Voir les packs prêts à l\'emploi</button>');
    if (obtenues.length) {
      h += '<div style="font-size:0.78em;color:#8b95a5;font-weight:700;margin:16px 0 8px;">Obtenues</div>'
        + obtenues.slice(-10).reverse().map(function (r) {
          return '<div style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:12px;background:#141821;margin-bottom:6px;">'
            + ic('trophee', 16, OR) + '<span style="flex:1;min-width:0;color:#cbd5e1;font-size:0.84em;">' + esc(r.nom) + '</span>'
            + '<button onclick="AwakRecomp.refaire(\'' + r.id + '\')" style="' + BTN + 'padding:6px 9px;font-size:0.72em;background:transparent;color:#cbd5e1;border:1px solid rgba(255,255,255,0.12);">Recommencer</button></div>';
        }).join('');
    }
    h += '<button onclick="AwakRecomp.fermer()" style="' + VIDE + 'margin-top:12px;">Fermer</button>';
    feuille(h);
  }

  // ── Créer / modifier ──
  var _ed = null;
  function editer(id) {
    var d = lire(), r = id ? mes(d, pidActif()).filter(function (x) { return x.id === id; })[0] : null;
    _ed = r ? { id: r.id, nom: r.nom, mode: r.mode, cible: r.cible, offreur: r.offreur || null, hebdo: !!r.hebdo } : { id: null, nom: '', mode: 'seances', cible: 20, offreur: null, hebdo: false };
    dessinerEd();
  }
  function dessinerEd() {
    var e = _ed, pas = e.mode === 'minutes' ? 60 : 1;
    var autres = adultes().filter(function (p) { return p.id !== pidActif(); });
    var LS = e.hebdo ? SUGG_SEM : SUGG;
    var h = '<div style="font-size:1.15em;font-weight:900;color:#fff;margin-bottom:12px;">' + (e.id ? 'Modifier l\'objectif' : 'Nouvel objectif') + '</div>'
      + '<div style="display:flex;gap:6px;margin-bottom:6px;">' + pastille(!e.hebdo, 'Une fois', 'AwakRecomp._hebdo(false)') + pastille(e.hebdo, 'Chaque semaine', 'AwakRecomp._hebdo(true)') + '</div>'
      + '<div style="font-size:0.72em;color:#94a3b8;line-height:1.4;margin-bottom:14px;">' + (e.hebdo ? 'Se remet à zéro chaque lundi : atteins ton objectif de la semaine et tu y as droit, chaque semaine.' : 'Un grand objectif, compté à partir d\'aujourd\'hui.') + '</div>'
      + (e.id ? '' : '<div style="font-size:0.78em;color:#8b95a5;font-weight:700;margin-bottom:8px;">Idées</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">'
          + LS.map(function (s, i) { return pastille(e.nom === s.nom, esc(s.nom), 'AwakRecomp._sugg(' + i + ')'); }).join('') + '</div>')
      + '<div style="font-size:0.78em;color:#8b95a5;font-weight:700;margin-bottom:6px;">Ce que tu t\'offres</div>'
      + '<input maxlength="60" value="' + esc(e.nom) + '" placeholder="Ex. : un massage" oninput="AwakRecomp._nom(this.value)" style="width:100%;box-sizing:border-box;padding:11px 12px;border-radius:12px;background:#141821;border:1px solid rgba(255,255,255,0.12);color:#fff;font-size:0.9em;font-family:inherit;margin-bottom:14px;">'
      + '<div style="font-size:0.78em;color:#8b95a5;font-weight:700;margin-bottom:8px;">Objectif</div>'
      + '<div style="display:flex;gap:6px;margin-bottom:10px;">' + pastille(e.mode === 'seances', 'En séances', 'AwakRecomp._mode(\'seances\')') + pastille(e.mode === 'minutes', 'En minutes', 'AwakRecomp._mode(\'minutes\')') + '</div>'
      + '<div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:14px;">'
      +   '<button onclick="AwakRecomp._cible(-' + pas + ')" aria-label="Moins" style="' + BTN + 'width:44px;height:44px;font-size:1.3em;background:#1a1e26;color:#fff;border:none;">−</button>'
      +   '<div style="font-size:1.5em;font-weight:900;color:#fff;min-width:120px;text-align:center;">' + unite(e, e.cible) + (e.hebdo ? '<div style="font-size:0.5em;color:#94a3b8;font-weight:700;">par semaine</div>' : '') + '</div>'
      +   '<button onclick="AwakRecomp._cible(' + pas + ')" aria-label="Plus" style="' + BTN + 'width:44px;height:44px;font-size:1.3em;background:#1a1e26;color:#fff;border:none;">+</button>'
      + '</div>'
      + '<div style="font-size:0.78em;color:#8b95a5;font-weight:700;margin-bottom:8px;">Qui te l\'offre ?</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">' + pastille(!e.offreur, 'Moi-même', 'AwakRecomp._off(\'\')')
      +   autres.map(function (p) { return pastille(e.offreur === p.id, esc(p.name || 'Profil'), 'AwakRecomp._off(\'' + p.id + '\')'); }).join('') + '</div>'
      + (autres.length ? '<div style="font-size:0.72em;color:#94a3b8;line-height:1.4;margin-bottom:12px;">' + (e.offreur ? esc(nomDe(e.offreur)) + ' sera prévenu à l\'objectif atteint et pourra te l\'offrir.' : 'Choisis ton conjoint pour qu\'il te l\'offre quand tu y arrives.') + '</div>'
          : '<div style="font-size:0.72em;color:#94a3b8;line-height:1.4;margin-bottom:12px;">Pour qu\'un conjoint te l\'offre, ajoute son profil sur ce téléphone.</div>')
      + '<button onclick="AwakRecomp._sauver()" style="' + PLEIN + '">Enregistrer</button>'
      + (e.id ? '<button onclick="AwakRecomp._suppr()" style="' + VIDE + 'margin-top:8px;color:#fca5a5;border-color:rgba(248,113,113,0.35);">Supprimer</button>' : '')
      + '<button onclick="AwakRecomp.ouvrir()" style="' + VIDE + 'margin-top:8px;">Retour</button>';
    feuille(h);
  }
  function sauver() {
    var e = _ed, nom = String(e.nom || '').trim();
    if (!nom) { toast('Écris ce que tu t\'offres', 'info'); return; }
    var d = lire(), l = mes(d, pidActif());
    if (e.id) l.forEach(function (r) { if (r.id === e.id) { r.nom = nom; r.mode = e.mode; r.cible = e.cible; r.offreur = e.offreur || null; if (!!r.hebdo !== !!e.hebdo) { r.hebdo = !!e.hebdo; r.semaine = cleSemaine(); r.etat = 'cours'; if (!r.hebdo) r.depuis = new Date().toISOString(); } if (r.etat === 'atteinte' && avance(pidActif(), r) < r.cible) r.etat = 'cours'; } });
    // v1697 : une récompense hebdo compte TOUTE la semaine en cours (même les séances d'avant sa création)
    else l.push({ id: uid(), nom: nom, mode: e.mode, cible: e.cible, offreur: e.offreur || null, depuis: e.hebdo ? lundi().toISOString() : new Date().toISOString(), etat: 'cours', hebdo: !!e.hebdo, semaine: e.hebdo ? cleSemaine() : undefined });
    majEtats(d); ecrire(d); ouvrir(); rafraichir();
  }
  function supprimer() {
    var id = _ed && _ed.id; if (!id) return;
    var faire = function () { var d = lire(); d[pidActif()] = mes(d, pidActif()).filter(function (r) { return r.id !== id; }); ecrire(d); ouvrir(); rafraichir(); };
    if (typeof window.showConfirm === 'function') window.showConfirm('Supprimer l\'objectif « ' + _ed.nom + ' » ?', faire, null, { title: 'Supprimer', confirmLabel: 'Supprimer', cancelLabel: 'Annuler' });
    else faire();
  }

  // ── Obtenir ──
  function prendre(id) {
    var d = lire(), r = mes(d, pidActif()).filter(function (x) { return x.id === id; })[0]; if (!r) return;
    r.etat = 'obtenue'; r.obtenueLe = Date.now(); r.vuObtenue = true; if (r.hebdo) r.fois = (r.fois || 0) + 1; ecrire(d);
    bravo('Bravo !', 'Tu t\'es mérité', r.nom, 'Profites-en, tu l\'as gagné séance après séance.');
    rafraichir();
  }
  function offrir(pid, id) {
    var d = lire(), r = mes(d, pid).filter(function (x) { return x.id === id; })[0]; if (!r) return;
    r.etat = 'obtenue'; r.obtenueLe = Date.now(); r.vuObtenue = false; if (r.hebdo) r.fois = (r.fois || 0) + 1; ecrire(d);
    toast(nomDe(pid) + ' sera félicité à sa prochaine ouverture de l\'app');
    ouvrir(); rafraichir();
  }
  function refaire(id) {
    var d = lire(), r = mes(d, pidActif()).filter(function (x) { return x.id === id; })[0]; if (!r) return;
    r.etat = 'cours'; r.depuis = new Date().toISOString(); delete r.atteinteLe; delete r.obtenueLe; ecrire(d); ouvrir(); rafraichir();
  }

  // ── Annonces (popup) et bandeau du conjoint à l'accueil ──
  function bravo(titre, sous, nom, texte, apres) {
    var v = document.getElementById('awakRecompBravo'); if (v) v.remove();
    var o = document.createElement('div'); o.id = 'awakRecompBravo';
    o.style.cssText = 'position:fixed;inset:0;z-index:12500;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:22px;';
    o.innerHTML = '<div role="dialog" aria-label="' + esc(titre) + '" style="width:100%;max-width:380px;text-align:center;padding:26px 20px 20px;border-radius:22px;background:linear-gradient(160deg,#241b06,#0d0f13);border:1.5px solid rgba(251,191,36,0.55);box-shadow:0 0 50px rgba(251,191,36,0.22);">'
      + '<div style="display:flex;justify-content:center;margin-bottom:12px;">' + ic('trophee', 52, OR) + '</div>'
      + '<div style="font-size:1.4em;font-weight:900;color:#fff;margin-bottom:6px;">' + esc(titre) + '</div>'
      + '<div style="font-size:0.92em;color:#fde68a;margin-bottom:4px;">' + esc(sous) + '</div>'
      + '<div style="font-size:1.15em;font-weight:900;color:#fff;margin-bottom:10px;">« ' + esc(nom) + ' »</div>'
      + '<div style="font-size:0.8em;color:#cbd5e1;line-height:1.45;margin-bottom:18px;">' + esc(texte) + '</div>'
      + '<button id="awakRecompBravoOk" style="' + PLEIN + '">Merci !</button></div>';
    document.body.appendChild(o);
    document.getElementById('awakRecompBravoOk').onclick = function () { o.remove(); if (apres) apres(); };
  }
  function annoncer() {
    try {
      if (document.body.classList.contains('in-session') || document.getElementById('awakRecompBravo')) return;
      var pid = pidActif(); if (estEnfant(pid)) return;
      var d = lire(); var ch = majEtats(d);
      var l = mes(d, pid), r;
      // 1) Objectif atteint (pas encore annoncé)
      r = l.filter(function (x) { return x.etat === 'atteinte' && !x.vuAtteinte; })[0];
      if (r) {
        r.vuAtteinte = true; ecrire(d);
        return bravo(r.hebdo ? 'Objectif de la semaine atteint !' : 'Objectif atteint !', r.offreur ? 'Tu as mérité' : 'Tu t\'es mérité', r.nom,
          r.offreur ? nomDe(r.offreur) + ' est prévenu et va te l\'offrir.' : 'Va dans Plus › Récompenses pour te l\'offrir.', annoncer);
      }
      // 2) Offerte par le conjoint
      r = l.filter(function (x) { return x.etat === 'obtenue' && x.offreur && !x.vuObtenue; })[0];
      if (r) {
        r.vuObtenue = true; ecrire(d);
        return bravo('Félicitations !', nomDe(r.offreur) + ' t\'offre', r.nom, 'Tu l\'as bien mérité.', annoncer);
      }
      if (ch) ecrire(d);
    } catch (e) { _e(e); }
  }
  function bandeauAccueil() {
    try {
      var pid = pidActif(); if (estEnfant(pid)) return '';
      var d = lire(); if (majEtats(d)) ecrire(d);
      var x = null;
      Object.keys(d).forEach(function (o) { if (!x && o !== pid) (d[o] || []).forEach(function (r) { if (!x && r.offreur === pid && r.etat === 'atteinte') x = { pid: o, r: r }; }); });
      if (!x) return '';
      return '<button onclick="AwakRecomp.ouvrir()" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;margin:0 0 12px;padding:12px 14px;border-radius:14px;cursor:pointer;font-family:inherit;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.4);">'
        + ic('trophee', 20, OR) + '<span style="flex:1;min-width:0;color:#fde68a;font-size:0.84em;font-weight:700;">' + esc(nomDe(x.pid)) + ' a atteint son objectif : « ' + esc(x.r.nom) + ' »</span>'
        + '<span style="color:#fde68a;font-size:0.78em;font-weight:900;">Je l\'offre ›</span></button>';
    } catch (e) { _e(e); return ''; }
  }
  function rafraichir() { try { if (window.AwakHomePro && AwakHomePro.render) AwakHomePro.render(); } catch (e) { _e(e); } }

  window.AwakRecomp = {
    ouvrir: ouvrir, fermer: fermer, editer: editer, prendre: prendre, offrir: offrir, refaire: refaire,
    annoncer: annoncer, bandeauAccueil: bandeauAccueil, _lire: lire,
    pack: ajouterPack, _packs: function () { _packsOuverts = true; ouvrir(); },
    _hebdo: function (v) { if (_ed && _ed.hebdo !== v) { _ed.hebdo = v; _ed.cible = _ed.mode === 'minutes' ? (v ? 150 : 300) : (v ? 4 : 20); dessinerEd(); } },
    _sugg: function (i) { var s = (_ed && _ed.hebdo ? SUGG_SEM : SUGG)[i]; if (s && _ed) { _ed.nom = s.nom; _ed.mode = s.mode; _ed.cible = s.cible; dessinerEd(); } },
    _nom: function (v) { if (_ed) _ed.nom = v; },
    _mode: function (m) { if (_ed && _ed.mode !== m) { _ed.mode = m; _ed.cible = m === 'minutes' ? (_ed.hebdo ? 150 : 300) : (_ed.hebdo ? 4 : 20); dessinerEd(); } },
    _cible: function (k) { if (_ed) { var n = _ed.nom; _ed.cible = Math.max(_ed.mode === 'minutes' ? 30 : 1, Math.min(_ed.mode === 'minutes' ? 6000 : 200, _ed.cible + k)); dessinerEd(); _ed.nom = n; } },
    _off: function (p) { if (_ed) { _ed.offreur = p || null; dessinerEd(); } },
    _sauver: sauver, _suppr: supprimer
  };
})();
