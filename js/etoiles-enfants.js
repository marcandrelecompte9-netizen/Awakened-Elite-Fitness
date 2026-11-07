/* ═══════════════════════════════════════════════════════════════════
   ÉTOILES DES ENFANTS — v1683
   · Chaque séance terminée par un profil ENFANT rapporte des étoiles :
     1 garantie, puis 1 par tranche de 15 min (30 min = 2, 45 min = 3…).
   · Les étoiles s'échangent contre des récompenses : l'enfant demande,
     le parent accepte (étoiles retirées) ou refuse.
   · Le parent ajoute des étoiles à sa guise (tâche, comportement…),
     gère la liste des récompenses (une liste de base est proposée).
   · Clé GLOBALE (famille) « awakEtoilesFamille » : hors profil, comme
     l'objectif commun — le parent doit voir tous les enfants.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var CLE = 'awakEtoilesFamille';
  var BASE = [
    { nom: '30 min d\'écran en plus', cout: 4 },
    { nom: 'Choisir le dessert', cout: 4 },
    { nom: 'Choisir le souper', cout: 6 },
    { nom: 'Se coucher 15 min plus tard', cout: 6 },
    { nom: 'Sortie au parc', cout: 8 },
    { nom: 'Soirée film en famille', cout: 10 },
    { nom: 'Choisir l\'activité de la fin de semaine', cout: 15 },
    { nom: 'Un petit jouet ou un livre', cout: 25 }
  ];
  var RAISONS = ['Tâche faite', 'Bon comportement', 'Aide à la maison', 'Effort à l\'école', 'Bravo !'];
  var OR = '#fbbf24';

  function _e(x) { try { if (window._awkE) window._awkE(x); } catch (y) { /* rien */ } }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ic(n, t, c) { return (window.AwakIcon && AwakIcon.get) ? AwakIcon.get(n, t, c) : ''; }
  // v1685 : étoile PLEINE (l'icône du jeu est en contour : pleine et vide se confondaient)
  var ETP = 'M12 2.6l2.85 5.9 6.5.85-4.75 4.5 1.2 6.45L12 17.2l-5.8 3.1 1.2-6.45L2.65 9.35l6.5-.85z';
  function etoile(t) { t = t || 14; return '<svg viewBox="0 0 24 24" width="' + t + '" height="' + t + '" aria-hidden="true" style="display:block;"><path d="' + ETP + '" fill="' + OR + '" stroke="#f59e0b" stroke-width="0.8" stroke-linejoin="round"/></svg>'; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // ── Données ──
  function lire() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(CLE) || 'null'); } catch (e) { d = null; }
    if (!d || typeof d !== 'object') d = {};
    if (!d.enfants) d.enfants = {};
    if (!Array.isArray(d.demandes)) d.demandes = [];
    if (!Array.isArray(d.recompenses)) d.recompenses = BASE.map(function (r) { return { id: uid(), nom: r.nom, cout: r.cout }; });
    return d;
  }
  function ecrire(d) { try { localStorage.setItem(CLE, JSON.stringify(d)); } catch (e) { _e(e); } }
  function fiche(d, pid) {
    if (!d.enfants[pid]) d.enfants[pid] = { solde: 0, gagne: 0, journal: [] };
    return d.enfants[pid];
  }
  function noter(f, n, raison, k) {
    f.journal.unshift({ t: Date.now(), n: n, r: raison, k: k });
    if (f.journal.length > 80) f.journal.length = 80;
  }
  function profils() { try { return (typeof window.getAllProfiles === 'function' ? window.getAllProfiles() : JSON.parse(localStorage.getItem('allProfiles') || '[]')) || []; } catch (e) { return []; } }
  function estEnfant(pid) { try { return !!(window.AwakYouth && AwakYouth.isChildProfile && AwakYouth.isChildProfile(pid)); } catch (e) { return false; } }
  // v1685 : un enfant devenu ado (13 ans) garde ses étoiles visibles tant qu'il en a
  function aDesEtoiles(pid) { try { var d = lire(), f = d.enfants[pid]; return !!(f && (f.solde > 0 || enAttente(d, pid).length)); } catch (e) { return false; } }
  function suivi(pid) { return estEnfant(pid) || aDesEtoiles(pid); }
  function enfants() { return profils().filter(function (p) { return p && suivi(p.id); }); }
  function pidActif() { try { return localStorage.getItem('currentProfileId'); } catch (e) { return null; } }
  function nomDe(pid) { var p = profils().filter(function (x) { return x.id === pid; })[0]; return p ? (p.name || 'Enfant') : 'Enfant'; }
  function enAttente(d, pid) { return d.demandes.filter(function (q) { return q.pid === pid; }); }
  function disponible(d, pid) {
    var f = fiche(d, pid);
    return f.solde - enAttente(d, pid).reduce(function (t, q) { return t + q.cout; }, 0);
  }
  function triees(d) { return d.recompenses.slice().sort(function (a, b) { return a.cout - b.cout; }); }
  function prochaine(d, solde) { return triees(d).filter(function (r) { return r.cout > solde; })[0] || null; }

  // ── Calcul ──
  function pourMinutes(min) { return Math.max(1, Math.floor((+min || 0) / 15)); }

  // Séance terminée (appelé par completeWorkout) : une seule fois par séance
  function gagnerSeance(minutes, debut, nom) { return gagnerPour(pidActif(), minutes, debut, nom); }
  function gagnerPour(pid, minutes, debut, nom) {
    if (!pid || !estEnfant(pid)) return 0;
    var d = lire(), f = fiche(d, pid);
    var cleS = String(debut || '');
    f.seances = f.seances || [];
    if (cleS && f.seances.indexOf(cleS) >= 0) return 0;
    if (cleS) { f.seances.push(cleS); if (f.seances.length > 30) f.seances.shift(); }
    var n = pourMinutes(minutes);
    f.solde += n; f.gagne += n;
    noter(f, n, 'Séance' + (nom ? ' · ' + nom : '') + ' (' + Math.round(minutes) + ' min)', 'seance');
    ecrire(d);
    return n;
  }

  // ── Fenêtre (feuille du bas) ──
  function feuille(id, html) {
    var v = document.getElementById(id); if (v) v.remove();
    var o = document.createElement('div');
    o.id = id;
    o.style.cssText = 'position:fixed;inset:0;z-index:10800;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end;justify-content:center;';
    o.innerHTML = '<div style="width:100%;max-width:520px;background:#0d0f13;border-top:1px solid rgba(251,191,36,0.35);border-radius:20px 20px 0 0;padding:18px 16px calc(20px + env(safe-area-inset-bottom));max-height:90vh;overflow-y:auto;box-sizing:border-box;">'
      + '<div style="width:36px;height:4px;background:rgba(255,255,255,0.18);border-radius:99px;margin:0 auto 14px;"></div>' + html + '</div>';
    o.addEventListener('click', function (ev) { if (ev.target === o) o.remove(); });
    document.body.appendChild(o);
    return o;
  }
  function fermer(id) { var v = document.getElementById(id); if (v) v.remove(); }
  var BTN = 'min-height:auto;border-radius:12px;cursor:pointer;font-family:inherit;font-weight:800;';
  var PLEIN = BTN + 'background:' + OR + ';color:#1a1204;border:none;padding:13px;width:100%;font-size:0.92em;';
  var VIDE = BTN + 'background:transparent;color:#cbd5e1;border:1px solid rgba(255,255,255,0.14);padding:12px;width:100%;font-size:0.86em;';
  function pastille(on, t, f) {
    return '<button onclick="' + f + '" style="' + BTN + 'padding:8px 13px;font-size:0.8em;'
      + (on ? 'background:' + OR + ';color:#1a1204;border:1px solid ' + OR + ';' : 'background:#1a1e26;color:#cbd5e1;border:1px solid #1a1e26;') + '">' + t + '</button>';
  }
  function barre(v, max) {
    var p = max > 0 ? Math.min(100, Math.round(v / max * 100)) : 100;
    return '<div style="height:7px;border-radius:99px;background:rgba(255,255,255,0.08);overflow:hidden;"><div style="height:100%;width:' + p + '%;background:' + OR + ';border-radius:99px;"></div></div>';
  }
  function quand(t) {
    try { var d = new Date(t); return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }); } catch (e) { return ''; }
  }
  function rafraichir() {
    try { if (typeof window.renderFamilyTab === 'function' && document.getElementById('familyContainer')) window.renderFamilyTab(); } catch (e) { _e(e); }
    try { if (window.AwakHomePro && AwakHomePro.render) AwakHomePro.render(); } catch (e) { _e(e); }
  }
  function toast(t, k) { try { if (window.showToast) window.showToast(t, k || 'success', 2600); } catch (e) { _e(e); } }

  // ═════════════ CÔTÉ ENFANT ═════════════
  // v1685 : les étoiles se VOIENT : 10 étoiles = 10 étoiles dessinées (par paquets de 5),
  // puis des étoiles grises pour ce qui manque jusqu'à la prochaine récompense
  function etoileVide(t) { t = t || 14; return '<svg viewBox="0 0 24 24" width="' + t + '" height="' + t + '" aria-hidden="true" style="display:block;"><path d="' + ETP + '" fill="none" stroke="#64748b" stroke-width="1.4" stroke-linejoin="round"/></svg>'; }
  function rangee(pleines, vides, t) {
    pleines = Math.max(0, Math.min(200, pleines | 0)); vides = Math.max(0, Math.min(200 - pleines, vides | 0));
    if (!pleines && !vides) return '';
    var h = '<div aria-label="' + pleines + ' étoile' + (pleines > 1 ? 's' : '') + '" role="img" style="display:flex;flex-wrap:wrap;gap:6px 9px;">', i, g = '';
    for (i = 0; i < pleines + vides; i++) {
      g += '<span style="display:inline-flex;">' + (i < pleines ? etoile(t) : etoileVide(t)) + '</span>';
      if ((i + 1) % 5 === 0 || i === pleines + vides - 1) { h += '<span style="display:inline-flex;gap:1px;">' + g + '</span>'; g = ''; }
    }
    return h + '</div>';
  }
  function carteEnfant() {
    var pid = pidActif(); if (!pid || !suivi(pid)) return '';
    var d = lire(), f = fiche(d, pid), dispo = disponible(d, pid), pr = prochaine(d, dispo), att = enAttente(d, pid).length;
    return '<button onclick="AwakEtoiles.ouvrirEnfant()" style="display:block;width:100%;text-align:left;margin:0 0 12px;padding:14px;border-radius:16px;cursor:pointer;font-family:inherit;background:linear-gradient(160deg,#1c1607,#0d0f13);border:1px solid rgba(251,191,36,0.35);">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'
      +   '<div style="flex:1;min-width:0;font-size:0.7em;letter-spacing:1.5px;color:#fde68a;font-weight:900;">MES ÉTOILES</div>'
      +   '<span style="font-size:0.74em;color:#fde68a;font-weight:800;">Mes récompenses ›</span>'
      + '</div>'
      + (f.solde || pr ? rangee(f.solde, pr ? pr.cout - dispo : 0, 20) : '<div style="font-size:0.8em;color:#cbd5e1;">Fais une séance pour gagner ta première étoile !</div>')
      + (pr ? '<div style="font-size:0.74em;color:#cbd5e1;margin-top:8px;">Les étoiles grises : ce qu\'il te manque pour « ' + esc(pr.nom) + ' »</div>'
            : (f.solde ? '<div style="font-size:0.76em;color:#fde68a;margin-top:8px;">Tu peux choisir une récompense !</div>' : ''))
      + (att ? '<div style="font-size:0.72em;color:#94a3b8;margin-top:4px;">' + att + ' demande' + (att > 1 ? 's' : '') + ' en attente</div>' : '')
      + '<div style="font-size:0.68em;color:#94a3b8;margin-top:6px;">1 étoile par séance, +1 toutes les 15 minutes</div>'
      + '</button>';
  }
  function ouvrirEnfant() {
    var pid = pidActif(); if (!pid) return;
    var d = lire(), f = fiche(d, pid), dispo = disponible(d, pid), att = enAttente(d, pid);
    var h = '<div style="font-size:1.15em;font-weight:900;color:#fff;margin-bottom:10px;">Mes étoiles</div>'
      + (f.solde ? rangee(f.solde, 0, 22) : '<div style="font-size:0.84em;color:#94a3b8;">Pas encore d\'étoile : chaque séance t\'en donne au moins une.</div>');
    if (att.length) {
      h += '<div style="font-size:0.78em;color:#8b95a5;font-weight:700;margin:16px 0 8px;">En attente</div>'
        + att.map(function (q) {
          return '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;background:#141821;margin-bottom:6px;">'
            + '<div style="flex:1;color:#e2e8f0;font-size:0.86em;font-weight:700;">' + esc(q.nom) + '</div>'
            + '<span style="font-size:0.74em;color:#fde68a;">Un parent doit dire oui</span>'
            + '<button onclick="AwakEtoiles.annulerDemande(\'' + q.id + '\')" style="' + BTN + 'padding:6px 10px;font-size:0.72em;background:transparent;color:#94a3b8;border:1px solid rgba(255,255,255,0.12);">Annuler</button></div>';
        }).join('');
    }
    h += '<div style="font-size:0.78em;color:#8b95a5;font-weight:700;margin:16px 0 8px;">Les récompenses</div>'
      + triees(d).map(function (r) {
        var ok = dispo >= r.cout;
        return '<div style="display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:12px;background:#141821;margin-bottom:6px;' + (ok ? 'border:1px solid rgba(251,191,36,0.4);' : 'border:1px solid transparent;') + '">'
          + '<div style="flex:1;min-width:0;"><div style="color:#f1f5f9;font-size:0.88em;font-weight:700;">' + esc(r.nom) + '</div>'
          + (ok ? '' : '<div style="margin-top:7px;">' + rangee(Math.max(0, Math.min(dispo, r.cout)), r.cout - Math.max(0, dispo), 12) + '</div>') + '</div>'
          + '<span style="display:inline-flex;align-items:center;gap:3px;color:#fde68a;font-weight:900;font-size:0.86em;flex-shrink:0;">' + r.cout + etoile(13) + '</span>'
          + (ok ? '<button onclick="AwakEtoiles.demander(\'' + r.id + '\')" style="' + BTN + 'flex-shrink:0;padding:8px 11px;font-size:0.76em;background:' + OR + ';color:#1a1204;border:none;">Je la veux</button>' : '')
          + '</div>';
      }).join('')
      + '<button onclick="AwakEtoiles.fermer()" style="' + VIDE + 'margin-top:10px;">Fermer</button>';
    feuille('awakEtoilesSheet', h);
  }
  function demander(rid) {
    var pid = pidActif(); var d = lire(); var r = d.recompenses.filter(function (x) { return x.id === rid; })[0];
    if (!r || !pid) return;
    if (disponible(d, pid) < r.cout) { toast('Pas encore assez d\'étoiles', 'info'); return; }
    d.demandes.push({ id: uid(), pid: pid, rid: r.id, nom: r.nom, cout: r.cout, t: Date.now() });
    ecrire(d);
    toast('Demande envoyée : un parent va la voir dans l\'onglet Famille');
    ouvrirEnfant(); rafraichir();
  }
  function annulerDemande(id) {
    var d = lire(); d.demandes = d.demandes.filter(function (q) { return q.id !== id; }); ecrire(d);
    if (document.getElementById('awakEtoilesSheet')) { if (estEnfant(pidActif())) ouvrirEnfant(); }
    rafraichir();
  }

  // ═════════════ CÔTÉ PARENT (onglet Famille) ═════════════
  function carteParent() {
    if (estEnfant(pidActif())) return '';
    var ens = enfants(); if (!ens.length) return '';
    var d = lire(), nbAtt = d.demandes.filter(function (q) { return ens.some(function (e) { return e.id === q.pid; }); }).length;
    var lignes = ens.map(function (e) {
      var f = fiche(d, e.id), dispo = disponible(d, e.id), pr = prochaine(d, dispo), att = enAttente(d, e.id).length;
      return '<div style="padding:11px 0;border-top:1px solid rgba(255,255,255,0.07);">'
        + '<div style="display:flex;align-items:center;gap:10px;">'
        +   '<div style="flex:1;min-width:0;"><div style="color:#fff;font-weight:800;font-size:0.92em;">' + esc(e.name || 'Enfant') + '</div>'
        +   '<div style="font-size:0.72em;color:#94a3b8;margin-top:1px;">' + f.gagne + ' gagnées au total' + (att ? ' · <b style="color:#fde68a;">' + att + ' demande' + (att > 1 ? 's' : '') + '</b>' : '') + '</div></div>'
        +   '<span style="display:inline-flex;align-items:center;gap:4px;color:#fff;font-weight:900;font-size:1.05em;">' + f.solde + etoile(16) + '</span>'
        +   '<button onclick="AwakEtoiles.ajouter(\'' + e.id + '\')" aria-label="Ajouter des étoiles à ' + esc(e.name || '') + '" style="' + BTN + 'padding:7px 11px;font-size:0.78em;background:rgba(251,191,36,0.14);color:#fde68a;border:1px solid rgba(251,191,36,0.45);">+ Étoiles</button>'
        + '</div>'
        + (pr ? '<div style="margin-top:8px;">' + barre(Math.max(0, dispo), pr.cout) + '<div style="font-size:0.7em;color:#94a3b8;margin-top:4px;">Prochaine : ' + esc(pr.nom) + ' (' + Math.max(0, dispo) + ' / ' + pr.cout + ')</div></div>' : '')
        + '</div>';
    }).join('');
    return '<div style="margin:0 0 14px;padding:14px 14px 6px;border-radius:16px;background:linear-gradient(160deg,#1c1607,#0d0f13);border:1px solid rgba(251,191,36,0.3);">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' + etoile(18)
      +   '<div style="flex:1;font-size:0.62em;letter-spacing:2px;color:#fde68a;font-weight:900;">ÉTOILES DES ENFANTS</div>'
      +   '<button onclick="AwakEtoiles.ouvrirParent()" style="' + BTN + 'padding:6px 10px;font-size:0.72em;background:transparent;color:#fde68a;border:1px solid rgba(251,191,36,0.4);">' + (nbAtt ? nbAtt + ' demande' + (nbAtt > 1 ? 's' : '') + ' · ' : '') + 'Gérer</button>'
      + '</div>' + lignes + '</div>';
  }
  // v1685 : le parent voit les demandes dès l'accueil (avant : seulement dans l'onglet Famille)
  function bandeauParent() {
    if (estEnfant(pidActif())) return '';
    var ens = enfants(); if (!ens.length) return '';
    var d = lire(), ds = d.demandes.filter(function (q) { return ens.some(function (e) { return e.id === q.pid; }); });
    if (!ds.length) return '';
    var q = ds[0];
    return '<button onclick="AwakEtoiles.ouvrirParent(\'demandes\')" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;margin:0 0 12px;padding:12px 14px;border-radius:14px;cursor:pointer;font-family:inherit;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.4);">'
      + etoile(20) + '<span style="flex:1;min-width:0;color:#fde68a;font-size:0.84em;font-weight:700;">' + esc(nomDe(q.pid)) + ' demande « ' + esc(q.nom) + ' »' + (ds.length > 1 ? ' (+' + (ds.length - 1) + ')' : '') + '</span>'
      + '<span style="color:#fde68a;font-size:0.78em;font-weight:900;">Répondre ›</span></button>';
  }
  var _onglet = 'demandes', _pidVue = null;
  function ouvrirParent(onglet, pid) {
    if (onglet) _onglet = onglet;
    var ens = enfants(); if (!ens.length) return;
    if (pid) _pidVue = pid;
    var d = lire();
    var ong = function (id, t) { return pastille(_onglet === id, t, 'AwakEtoiles.ouvrirParent(\'' + id + '\')'); };
    var nbAtt = d.demandes.length;
    var h = '<div style="font-size:1.2em;font-weight:900;color:#fff;margin-bottom:12px;">Étoiles des enfants</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">' + ong('demandes', 'Demandes' + (nbAtt ? ' (' + nbAtt + ')' : '')) + ong('historique', 'Historique') + ong('recompenses', 'Récompenses') + '</div>';
    if (_onglet === 'demandes') {
      var ds = d.demandes.filter(function (q) { return ens.some(function (e) { return e.id === q.pid; }); });
      h += ds.length ? ds.map(function (q) {
        var assez = fiche(d, q.pid).solde >= q.cout;
        return '<div style="padding:12px;border-radius:12px;background:#141821;margin-bottom:8px;">'
          + '<div style="color:#fff;font-weight:800;font-size:0.9em;">' + esc(nomDe(q.pid)) + ' veut : ' + esc(q.nom) + '</div>'
          + '<div style="font-size:0.74em;color:#94a3b8;margin:3px 0 10px;">' + q.cout + ' étoiles · demandé le ' + quand(q.t) + (assez ? '' : ' · <span style="color:#fca5a5;">solde insuffisant</span>') + '</div>'
          + '<div style="display:flex;gap:8px;">'
          +   '<button onclick="AwakEtoiles.repondre(\'' + q.id + '\',true)" style="' + BTN + 'flex:1;padding:10px;font-size:0.84em;background:' + OR + ';color:#1a1204;border:none;' + (assez ? '' : 'opacity:0.45;') + '">Accepter</button>'
          +   '<button onclick="AwakEtoiles.repondre(\'' + q.id + '\',false)" style="' + BTN + 'flex:1;padding:10px;font-size:0.84em;background:transparent;color:#cbd5e1;border:1px solid rgba(255,255,255,0.14);">Pas maintenant</button>'
          + '</div></div>';
      }).join('') : '<div style="padding:16px;border-radius:12px;background:#141821;color:#94a3b8;font-size:0.84em;text-align:center;">Aucune demande. Quand un enfant choisit une récompense, elle apparaît ici : tu décides si tu l\'appliques.</div>';
    } else if (_onglet === 'historique') {
      if (!_pidVue || !ens.some(function (e) { return e.id === _pidVue; })) _pidVue = ens[0].id;
      var f = fiche(d, _pidVue);
      h += (ens.length > 1 ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">' + ens.map(function (e) { return pastille(e.id === _pidVue, esc(e.name || 'Enfant'), 'AwakEtoiles.ouvrirParent(\'historique\',\'' + e.id + '\')'); }).join('') + '</div>' : '')
        + '<div style="display:flex;gap:8px;margin-bottom:12px;">'
        +   '<div style="flex:1;padding:10px;border-radius:12px;background:#141821;text-align:center;"><div style="font-size:1.2em;font-weight:900;color:#fff;">' + f.solde + '</div><div style="font-size:0.7em;color:#94a3b8;">à dépenser</div></div>'
        +   '<div style="flex:1;padding:10px;border-radius:12px;background:#141821;text-align:center;"><div style="font-size:1.2em;font-weight:900;color:#fff;">' + f.gagne + '</div><div style="font-size:0.7em;color:#94a3b8;">gagnées au total</div></div>'
        + '</div>'
        + (f.journal.length ? f.journal.slice(0, 40).map(function (j) {
            var c = j.k === 'recompense' ? '#fca5a5' : (j.k === 'refus' ? '#94a3b8' : '#fde68a');
            return '<div style="display:flex;align-items:center;gap:8px;padding:8px 2px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:0.8em;">'
              + '<span style="color:#64748b;width:48px;flex-shrink:0;">' + quand(j.t) + '</span>'
              + '<span style="flex:1;color:#cbd5e1;min-width:0;">' + esc(j.r) + '</span>'
              + '<b style="color:' + c + ';flex-shrink:0;">' + (j.n > 0 ? '+' + j.n : (j.n < 0 ? j.n : '')) + '</b></div>';
          }).join('') : '<div style="color:#94a3b8;font-size:0.84em;">Rien encore.</div>')
        + '<button onclick="AwakEtoiles.ajouter(\'' + _pidVue + '\')" style="' + PLEIN + 'margin-top:12px;">+ Ajouter des étoiles</button>';
    } else {
      h += '<div style="font-size:0.78em;color:#94a3b8;margin-bottom:10px;line-height:1.45;">Ce que les enfants peuvent obtenir avec leurs étoiles. Une séance rapporte 1 étoile, puis 1 toutes les 15 minutes.</div>'
        + triees(d).map(function (r) {
          return '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;background:#141821;margin-bottom:6px;">'
            + '<div style="flex:1;min-width:0;color:#f1f5f9;font-size:0.86em;font-weight:700;">' + esc(r.nom) + '</div>'
            + '<span style="display:inline-flex;align-items:center;gap:3px;color:#fde68a;font-weight:900;font-size:0.84em;">' + r.cout + etoile(12) + '</span>'
            + '<button onclick="AwakEtoiles.editerRecompense(\'' + r.id + '\')" style="' + BTN + 'padding:6px 9px;font-size:0.72em;background:transparent;color:#cbd5e1;border:1px solid rgba(255,255,255,0.12);">Modifier</button></div>';
        }).join('')
        + '<button onclick="AwakEtoiles.editerRecompense()" style="' + PLEIN + 'margin-top:8px;">+ Nouvelle récompense</button>';
    }
    h += '<button onclick="AwakEtoiles.fermer()" style="' + VIDE + 'margin-top:10px;">Fermer</button>';
    feuille('awakEtoilesSheet', h);
  }
  function repondre(id, oui) {
    var d = lire(), q = d.demandes.filter(function (x) { return x.id === id; })[0]; if (!q) return;
    var f = fiche(d, q.pid);
    if (oui) {
      if (f.solde < q.cout) { toast('Pas assez d\'étoiles pour cette récompense', 'info'); return; }
      f.solde -= q.cout; noter(f, -q.cout, 'Récompense : ' + q.nom, 'recompense');
      toast(nomDe(q.pid) + ' obtient « ' + q.nom + ' »');
    } else {
      noter(f, 0, 'Pas maintenant : ' + q.nom, 'refus');
      toast('Demande retirée, les étoiles restent à ' + nomDe(q.pid), 'info');
    }
    d.demandes = d.demandes.filter(function (x) { return x.id !== id; });
    ecrire(d); ouvrirParent('demandes'); rafraichir();
  }

  // Ajouter des étoiles (parent)
  var _aj = null;
  function ajouter(pid) {
    if (pid) _aj = { pid: pid, n: (_aj && _aj.pid === pid) ? _aj.n : 1, r: (_aj && _aj.pid === pid) ? _aj.r : RAISONS[0], autre: '' };
    if (!_aj) return;
    var h = '<div style="font-size:1.15em;font-weight:900;color:#fff;margin-bottom:4px;">Des étoiles pour ' + esc(nomDe(_aj.pid)) + '</div>'
      + '<div style="font-size:0.8em;color:#94a3b8;margin-bottom:14px;">Pour féliciter autre chose que le sport.</div>'
      + '<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:14px;">'
      +   '<button onclick="AwakEtoiles._n(-1)" aria-label="Moins" style="' + BTN + 'width:46px;height:46px;font-size:1.3em;background:#1a1e26;color:#fff;border:none;">−</button>'
      +   '<div style="display:inline-flex;align-items:center;gap:6px;font-size:2em;font-weight:900;color:#fff;min-width:80px;justify-content:center;">' + _aj.n + etoile(26) + '</div>'
      +   '<button onclick="AwakEtoiles._n(1)" aria-label="Plus" style="' + BTN + 'width:46px;height:46px;font-size:1.3em;background:#1a1e26;color:#fff;border:none;">+</button>'
      + '</div>'
      + '<div style="font-size:0.78em;color:#8b95a5;font-weight:700;margin-bottom:8px;">Pourquoi ?</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">' + RAISONS.concat(['Autre']).map(function (r, i) { return pastille(_aj.r === r, esc(r), 'AwakEtoiles._r(' + i + ')'); }).join('') + '</div>'
      + (_aj.r === 'Autre' ? '<input id="awakEtoilesAutre" maxlength="60" placeholder="Ex. : a rangé sa chambre" value="' + esc(_aj.autre) + '" oninput="AwakEtoiles._autre(this.value)" style="width:100%;box-sizing:border-box;padding:11px 12px;border-radius:12px;background:#141821;border:1px solid rgba(255,255,255,0.12);color:#fff;font-size:0.9em;font-family:inherit;margin-bottom:6px;">' : '')
      + '<button onclick="AwakEtoiles._donner()" style="' + PLEIN + 'margin-top:8px;">Donner ' + _aj.n + ' étoile' + (_aj.n > 1 ? 's' : '') + '</button>'
      + '<button onclick="AwakEtoiles.fermer()" style="' + VIDE + 'margin-top:8px;">Annuler</button>';
    feuille('awakEtoilesSheet', h);
  }
  function donner() {
    if (!_aj) return;
    var raison = _aj.r === 'Autre' ? (String(_aj.autre || '').trim() || 'Bravo !') : _aj.r;
    var d = lire(), f = fiche(d, _aj.pid);
    f.solde += _aj.n; f.gagne += _aj.n; noter(f, _aj.n, raison, 'parent');
    ecrire(d);
    toast('+' + _aj.n + ' étoile' + (_aj.n > 1 ? 's' : '') + ' pour ' + nomDe(_aj.pid));
    _aj = null; fermer('awakEtoilesSheet'); rafraichir();
  }

  // Récompenses (parent)
  var _ed = null;
  function editerRecompense(id) {
    var d = lire(), r = id ? d.recompenses.filter(function (x) { return x.id === id; })[0] : null;
    _ed = { id: r ? r.id : null, nom: r ? r.nom : '', cout: r ? r.cout : 5 };
    dessinerEd();
  }
  function dessinerEd() {
    var h = '<div style="font-size:1.15em;font-weight:900;color:#fff;margin-bottom:14px;">' + (_ed.id ? 'Modifier la récompense' : 'Nouvelle récompense') + '</div>'
      + '<div style="font-size:0.78em;color:#8b95a5;font-weight:700;margin-bottom:6px;">Récompense</div>'
      + '<input id="awakEtoilesNom" maxlength="60" placeholder="Ex. : choisir la musique dans l\'auto" value="' + esc(_ed.nom) + '" oninput="AwakEtoiles._edNom(this.value)" style="width:100%;box-sizing:border-box;padding:11px 12px;border-radius:12px;background:#141821;border:1px solid rgba(255,255,255,0.12);color:#fff;font-size:0.9em;font-family:inherit;margin-bottom:14px;">'
      + '<div style="font-size:0.78em;color:#8b95a5;font-weight:700;margin-bottom:8px;">Prix en étoiles</div>'
      + '<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:6px;">'
      +   '<button onclick="AwakEtoiles._edCout(-1)" aria-label="Moins" style="' + BTN + 'width:44px;height:44px;font-size:1.3em;background:#1a1e26;color:#fff;border:none;">−</button>'
      +   '<div style="display:inline-flex;align-items:center;gap:6px;font-size:1.7em;font-weight:900;color:#fff;min-width:70px;justify-content:center;">' + _ed.cout + etoile(22) + '</div>'
      +   '<button onclick="AwakEtoiles._edCout(1)" aria-label="Plus" style="' + BTN + 'width:44px;height:44px;font-size:1.3em;background:#1a1e26;color:#fff;border:none;">+</button>'
      + '</div>'
      + '<div style="font-size:0.72em;color:#94a3b8;text-align:center;margin-bottom:10px;">≈ ' + _ed.cout * 15 + ' min de sport, ou ' + _ed.cout + ' séance' + (_ed.cout > 1 ? 's' : '') + ' courte' + (_ed.cout > 1 ? 's' : '') + '</div>'
      + '<button onclick="AwakEtoiles._edSauver()" style="' + PLEIN + '">Enregistrer</button>'
      + (_ed.id ? '<button onclick="AwakEtoiles._edSupprimer()" style="' + VIDE + 'margin-top:8px;color:#fca5a5;border-color:rgba(248,113,113,0.35);">Supprimer</button>' : '')
      + '<button onclick="AwakEtoiles.ouvrirParent(\'recompenses\')" style="' + VIDE + 'margin-top:8px;">Retour</button>';
    feuille('awakEtoilesSheet', h);
    if (!_ed.id) setTimeout(function () { var i = document.getElementById('awakEtoilesNom'); if (i) i.focus(); }, 50);
  }
  function edSauver() {
    var nom = String(_ed.nom || '').trim();
    if (!nom) { toast('Donne un nom à la récompense', 'info'); return; }
    var d = lire();
    if (_ed.id) { d.recompenses.forEach(function (r) { if (r.id === _ed.id) { r.nom = nom; r.cout = _ed.cout; } }); }
    else d.recompenses.push({ id: uid(), nom: nom, cout: _ed.cout });
    ecrire(d); ouvrirParent('recompenses'); rafraichir();
  }
  function edSupprimer() {
    var faire = function () {
      var d = lire(); d.recompenses = d.recompenses.filter(function (r) { return r.id !== _ed.id; });
      d.demandes = d.demandes.filter(function (q) { return q.rid !== _ed.id; });
      ecrire(d); ouvrirParent('recompenses'); rafraichir();
    };
    if (typeof window.showConfirm === 'function') window.showConfirm('Supprimer « ' + _ed.nom + ' » ? Les demandes en attente pour cette récompense seront retirées.', faire, null, { title: 'Supprimer la récompense', confirmLabel: 'Supprimer', cancelLabel: 'Annuler' });
    else faire();
  }

  // ── Pendant la séance (enfant) : annonce de chaque nouvelle étoile ──
  var _vu = { cle: null, n: 0 };
  function estimation() {
    try {
      var b = window.AwakSSBridge, w = b && b.getWorkout && b.getWorkout();
      if (!w || typeof window.awakMinutesActivesSeance !== 'function') return 0;
      return pourMinutes(window.awakMinutesActivesSeance());
    } catch (e) { return 0; }
  }
  setInterval(function () {
    try {
      if (!document.body.classList.contains('in-session') || !estEnfant(pidActif())) return;
      var t0 = (typeof window.awakDebutSeance === 'function') ? window.awakDebutSeance() : null; if (!t0) return;
      var n = pourMinutes(typeof window.awakMinutesActivesSeance === 'function' ? window.awakMinutesActivesSeance() : 0);
      if (_vu.cle !== t0) { _vu = { cle: t0, n: n }; return; }
      if (n > _vu.n) { _vu.n = n; toast('Nouvelle étoile ! Tu en as ' + n + ' pour cette séance'); }
    } catch (e) { _e(e); }
  }, 20000);

  window.AwakEtoiles = {
    gagnerSeance: gagnerSeance, gagnerPour: gagnerPour, pourMinutes: pourMinutes, estimation: estimation, bandeauParent: bandeauParent,
    oublier: function (pid) { try { var d = lire(); delete d.enfants[pid]; d.demandes = d.demandes.filter(function (q) { return q.pid !== pid; }); ecrire(d); } catch (e) { _e(e); } },
    carteEnfant: carteEnfant, carteParent: carteParent,
    ouvrirEnfant: ouvrirEnfant, ouvrirParent: ouvrirParent, demander: demander, annulerDemande: annulerDemande,
    repondre: repondre, ajouter: ajouter, editerRecompense: editerRecompense,
    fermer: function () { fermer('awakEtoilesSheet'); },
    _n: function (k) { if (_aj) { _aj.n = Math.max(1, Math.min(50, _aj.n + k)); ajouter(); } },
    _r: function (i) { if (_aj) { _aj.r = RAISONS.concat(['Autre'])[i]; ajouter(); } },
    _autre: function (v) { if (_aj) _aj.autre = v; },
    _donner: donner,
    _edNom: function (v) { if (_ed) _ed.nom = v; },
    _edCout: function (k) { if (_ed) { _ed.cout = Math.max(1, Math.min(200, _ed.cout + k)); var n = _ed.nom; dessinerEd(); _ed.nom = n; } },
    _edSauver: edSauver, _edSupprimer: edSupprimer,
    _lire: lire
  };
})();
