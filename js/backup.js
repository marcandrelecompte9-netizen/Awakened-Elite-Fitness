/* ═══════════════════════════════════════════════════════════════════════
   SAUVEGARDE — Awakened (v1242)
   -----------------------------------------------------------------------
   Toutes les données vivent dans le stockage du navigateur : vider les
   données du site, changer de téléphone ou désinstaller = tout perdre.
   Ce module :
   • collecte TOUT le stockage (l'ancienne copie auto ne prenait que
     fitpro* / workout* / userProfile : les données par profil
     profile_<id>_*, les sorties GPS, plans, Éveil… étaient oubliées) ;
   • envoie la sauvegarde par la feuille de partage (Drive, courriel) ou
     la télécharge ;
   • restaure en sécurité : vérifie que le fichier vient d'Awakened, garde
     une copie « Avant restauration » sur le téléphone, et remet tout en
     place si l'écriture échoue (espace plein) ;
   • rappelle gentiment de sauvegarder (tous les 14 jours au plus, si la
     dernière sauvegarde envoyée date de plus de 30 jours).
   Formats acceptés : v1 {appName, data}, v2 (à plat + _backupMeta), v3.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var BLEU = '#60a8f0', CLAIR = '#93c5fd', JOUR = 864e5;
  var K_DERNIERE = 'awakDerniereSauvegarde', K_RAPPEL = 'awakRappelSauvegarde';

  function toast(m, t, d) { try { if (typeof showToast === 'function') showToast(m, t || 'info', d || 3000); } catch (e) {} }
  function ico(n, t, c) { return window.AwakIcon ? AwakIcon.get(n, t || 18, c || CLAIR) : ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ── collecte ──
  function collecter() {
    var data = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k != null) data[k] = localStorage.getItem(k);
    }
    return { appName: 'Awakened', version: 3, exportedAt: new Date().toISOString(), data: data };
  }
  function octets() {
    var n = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i) || '';
      n += (k.length + (localStorage.getItem(k) || '').length) * 2;
    }
    return n;
  }
  function mo(o) { return o < 1048576 ? Math.max(1, Math.round(o / 1024)) + ' Ko' : (o / 1048576).toFixed(1).replace('.', ',') + ' Mo'; }

  // ── formats ──
  function normaliser(obj) {
    if (!obj || typeof obj !== 'object') return null;
    if (obj.data && typeof obj.data === 'object' && (obj.appName === 'Awakened' || obj.version)) return obj.data;
    if (obj._backupMeta) {
      var d = {};
      Object.keys(obj).forEach(function (k) { if (k !== '_backupMeta') d[k] = obj[k]; });
      return d;
    }
    return null;
  }
  function valide(data) {
    if (!data) return false;
    var ks = Object.keys(data);
    if (!ks.length) return false;
    return ks.some(function (k) { return k === 'allProfiles' || k === 'userProfile' || /^profile_/.test(k) || /^fitpro/.test(k); })
      && ks.every(function (k) { return typeof data[k] === 'string'; });
  }
  function dateDe(obj) {
    try {
      if (obj.exportedAt) return new Date(obj.exportedAt);
      if (obj._backupMeta) return new Date(JSON.parse(obj._backupMeta).date);
    } catch (e) {}
    return null;
  }
  function resume(data) {
    var noms = [];
    try { noms = JSON.parse(data.allProfiles || '[]').map(function (p) { return p.name; }).filter(Boolean); } catch (e) {}
    // Historique par profil (profile_<id>_workoutHistory) ; repli sur la clé globale
    var seances = 0, cles = Object.keys(data).filter(function (k) { return /^profile_.+_workoutHistory$/.test(k); });
    if (!cles.length && data.workoutHistory) cles = ['workoutHistory'];
    cles.forEach(function (k) { try { seances += (JSON.parse(data[k]) || []).length; } catch (e) {} });
    return { noms: noms, seances: seances };
  }

  // ── copies sur le téléphone (IndexedDB, base historique « AwakenedBackups ») ──
  function base(cb) {
    try {
      var req = indexedDB.open('AwakenedBackups', 1);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains('backups')) db.createObjectStore('backups', { keyPath: 'id', autoIncrement: true });
      };
      req.onsuccess = function (e) { cb(e.target.result); };
      req.onerror = function () { cb(null); };
    } catch (e) { cb(null); }
  }
  function ajouterCopie(copie, cb) {
    base(function (db) {
      if (!db) { cb && cb(false); return; }
      try {
        var tx = db.transaction(['backups'], 'readwrite'), st = tx.objectStore('backups');
        st.add(copie);
        var all = st.getAll();
        all.onsuccess = function () {
          var l = (all.result || []).sort(function (a, b) { return a.id - b.id; });
          if (l.length > 8) l.slice(0, l.length - 8).forEach(function (b) { st.delete(b.id); });
        };
        tx.oncomplete = function () { cb && cb(true); };
        tx.onerror = function () { cb && cb(false); };
      } catch (e) { cb && cb(false); }
    });
  }
  function listerCopies(cb) {
    base(function (db) {
      if (!db || !db.objectStoreNames.contains('backups')) { cb([]); return; }
      try {
        var r = db.transaction(['backups'], 'readonly').objectStore('backups').getAll();
        r.onsuccess = function () { cb((r.result || []).sort(function (a, b) { return new Date(b.exportedAt) - new Date(a.exportedAt); })); };
        r.onerror = function () { cb([]); };
      } catch (e) { cb([]); }
    });
  }
  function lireCopie(id, cb) {
    base(function (db) {
      if (!db) { cb(null); return; }
      try {
        var r = db.transaction(['backups'], 'readonly').objectStore('backups').get(id);
        r.onsuccess = function () { cb(r.result || null); };
        r.onerror = function () { cb(null); };
      } catch (e) { cb(null); }
    });
  }

  // ── écriture sûre ──
  function ecrire(data) {
    var avant = collecter().data;
    try {
      localStorage.clear();
      Object.keys(data).forEach(function (k) { localStorage.setItem(k, data[k]); });
      return true;
    } catch (e) {
      // Échec (espace plein…) : on remet exactement ce qu'il y avait
      try { localStorage.clear(); Object.keys(avant).forEach(function (k) { localStorage.setItem(k, avant[k]); }); } catch (e2) {}
      return false;
    }
  }

  function restaurer(obj, origine) {
    var data = normaliser(obj);
    if (!valide(data)) { toast('Ce fichier n\'est pas une sauvegarde Awakened', 'error', 3500); return; }
    var d = dateDe(obj), R = resume(data);
    var msg = 'Sauvegarde ' + (d && !isNaN(d) ? 'du <b>' + d.toLocaleString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + '</b>' : '')
      + (R.noms.length ? '<br>Profils : <b>' + esc(R.noms.join(', ')) + '</b>' : '')
      + (R.seances ? ' · ' + R.seances + ' séance' + (R.seances > 1 ? 's' : '') : '')
      + '<br><br>Tes données actuelles seront remplacées. Une copie « Avant restauration » est gardée sur ce téléphone pour revenir en arrière.';
    var go = function () {
      var copie = collecter(); copie.avant = true;
      ajouterCopie(copie, function () {
        if (ecrire(data)) {
          toast('Restauration réussie. Redémarrage…', 'success', 1800);
          setTimeout(function () { location.reload(); }, 1400);
        } else {
          toast('Espace insuffisant sur le téléphone : rien n\'a été modifié', 'error', 4500);
        }
      });
    };
    if (typeof showConfirm === 'function') {
      showConfirm(msg, go, null, { title: 'Restaurer cette sauvegarde ?', subtitle: origine || '◈ RESTAURATION ◈', confirmLabel: 'Restaurer', cancelLabel: 'Annuler', danger: true });
    } else if (confirm('Restaurer cette sauvegarde ?')) go();
  }

  function depuisFichier(file) {
    if (!file) return;
    var r = new FileReader();
    r.onload = function (e) {
      var obj = null;
      try { obj = JSON.parse(e.target.result); } catch (er) {}
      if (!obj) { toast('Fichier illisible : ce n\'est pas une sauvegarde', 'error', 3500); return; }
      restaurer(obj, '◈ DEPUIS UN FICHIER ◈');
    };
    r.readAsText(file);
  }

  // ── envoi ──
  function envoyer() {
    var s = collecter();
    var texte = JSON.stringify(s);
    var nom = 'Awakened-Sauvegarde-' + new Date().toISOString().split('T')[0] + '.json';
    var noter = function () { try { localStorage.setItem(K_DERNIERE, String(Date.now())); } catch (e) {} rendreReglages(); };
    var telecharger = function () {
      try {
        var url = URL.createObjectURL(new Blob([texte], { type: 'application/json' }));
        var a = document.createElement('a');
        a.href = url; a.download = nom; document.body.appendChild(a); a.click();
        setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 200);
        noter();
        toast('Sauvegarde téléchargée (' + mo(texte.length * 2) + '). Garde-la dans Drive ou envoie-la par courriel.', 'success', 4500);
      } catch (e) { toast('Impossible de créer la sauvegarde', 'error', 3000); }
    };
    var essai = (window.AwakNative && AwakNative.exporterFichier) ? AwakNative.exporterFichier(nom, texte) : Promise.resolve(false);
    Promise.resolve(essai).then(function (ok) {
      if (ok) { noter(); toast('Sauvegarde prête : choisis Drive ou ton courriel', 'success', 4000); }
      else telecharger();
    }).catch(telecharger);
  }

  // ── copie automatique quotidienne (complète) ──
  function copieAuto() {
    try {
      var last = parseInt(localStorage.getItem('fitproLastAutoBackup') || '0', 10);
      if (Date.now() - last < JOUR) return;
      var c = collecter();
      if (Object.keys(c.data).length < 4) return;
      ajouterCopie(c, function (ok) { if (ok) try { localStorage.setItem('fitproLastAutoBackup', String(Date.now())); } catch (e) {} });
    } catch (e) {}
  }

  // ── fenêtre des copies sur le téléphone ──
  function copies() {
    listerCopies(function (l) {
      var old = document.getElementById('backupManagerModal'); if (old) old.remove();
      var ov = document.createElement('div');
      ov.id = 'backupManagerModal';
      ov.style.cssText = 'position:fixed;inset:0;z-index:10100;background:rgba(0,0,0,0.85);display:flex;align-items:flex-end;justify-content:center;';
      ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
      ov.innerHTML = '<div style="width:100%;max-width:480px;max-height:88vh;overflow-y:auto;box-sizing:border-box;background:#0d1117;border:1px solid rgba(96,168,240,0.25);border-radius:20px 20px 0 0;padding:12px 16px calc(18px + env(safe-area-inset-bottom));">'
        + '<div style="width:40px;height:4px;background:rgba(255,255,255,0.15);border-radius:99px;margin:0 auto 12px;"></div>'
        + '<div style="font-size:1.1em;font-weight:900;color:#fff;">Copies sur ce téléphone</div>'
        + '<div style="font-size:0.72em;color:#94a3b8;line-height:1.5;margin:4px 0 12px;">Une copie complète est faite chaque jour (les 8 dernières sont gardées). Elles aident après une erreur, mais <b style="color:#fbbf24;">disparaissent si tu vides les données du site ou changes de téléphone</b> : envoie-toi aussi une sauvegarde.</div>'
        + (l.length ? l.map(function (b) {
            var d = new Date(b.exportedAt), n = Object.keys(b.data || {}).length;
            return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:6px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid ' + (b.avant ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)') + ';">'
              + '<div style="flex:1;min-width:0;"><div style="font-size:0.84em;font-weight:800;color:#fff;">' + d.toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }) + '</div>'
              + '<div style="font-size:0.66em;color:' + (b.avant ? '#fbbf24' : '#64748b') + ';">' + (b.avant ? 'Avant restauration · ' : '') + n + ' entrées</div></div>'
              + '<button data-copie="' + b.id + '" style="flex-shrink:0;min-height:auto;padding:7px 12px;border-radius:10px;cursor:pointer;font-weight:800;font-size:0.74em;background:rgba(96,168,240,0.12);border:1px solid rgba(96,168,240,0.4);color:' + CLAIR + ';">Restaurer</button></div>';
          }).join('') : '<div style="text-align:center;color:#64748b;font-size:0.8em;padding:16px;">Aucune copie pour l\'instant. La première est faite demain.</div>')
        + '<button onclick="document.getElementById(\'backupManagerModal\').remove()" style="width:100%;margin-top:10px;min-height:auto;padding:12px;border-radius:12px;cursor:pointer;font-weight:800;font-size:0.84em;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;">Fermer</button>'
        + '</div>';
      document.body.appendChild(ov);
      ov.querySelectorAll('[data-copie]').forEach(function (b) {
        b.onclick = function () {
          lireCopie(+b.getAttribute('data-copie'), function (c) {
            if (!c) { toast('Copie introuvable', 'error'); return; }
            ov.remove();
            restaurer(c, c.avant ? '◈ ANNULER LA RESTAURATION ◈' : '◈ COPIE DU TÉLÉPHONE ◈');
          });
        };
      });
    });
  }

  // ── carte des Réglages (Compte & données › Gestion des données) ──
  function depuis(ts) {
    if (!ts) return null;
    var j = Math.floor((Date.now() - ts) / JOUR);
    return j <= 0 ? 'aujourd\'hui' : (j === 1 ? 'hier' : 'il y a ' + j + ' jours');
  }
  function rendreReglages() {
    var h = document.getElementById('awakSauvegardeCarte');
    if (!h) return;
    var last = parseInt(localStorage.getItem(K_DERNIERE) || '0', 10);
    var vieux = !last || Date.now() - last > 30 * JOUR;
    var o = octets(), pct = Math.min(100, o / (5 * 1048576) * 100);
    var btn = function (on, txt, principal) {
      return '<button onclick="' + on + '" style="width:100%;min-height:auto;padding:13px;border-radius:12px;cursor:pointer;font-weight:900;font-size:0.86em;display:flex;align-items:center;justify-content:center;gap:8px;'
        + (principal ? 'background:linear-gradient(135deg,#22d3ee,#0891b2);border:none;color:#04121f;' : 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.13);color:#cbd5e1;') + '">' + txt + '</button>';
    };
    h.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:12px;margin-bottom:10px;background:' + (vieux ? 'rgba(251,191,36,0.08)' : 'rgba(96,168,240,0.07)') + ';border:1px solid ' + (vieux ? 'rgba(251,191,36,0.35)' : 'rgba(96,168,240,0.25)') + ';">'
      + ico(vieux ? 'alerte' : 'valide', 20, vieux ? '#fbbf24' : CLAIR)
      + '<div style="flex:1;min-width:0;font-size:0.78em;line-height:1.45;color:#e2e8f0;">'
      + (last ? 'Dernière sauvegarde envoyée : <b>' + depuis(last) + '</b>' : '<b>Aucune sauvegarde envoyée.</b>')
      + '<div style="font-size:0.9em;color:#94a3b8;">' + (vieux ? 'Tes données ne sont que sur ce téléphone : envoie-toi une copie.' : 'Tes données sont à l\'abri.') + '</div></div></div>'
      + '<div style="display:grid;gap:8px;">'
      +   btn('AwakSauvegarde.envoyer()', ico('lien', 18, '#fff') + 'Sauvegarder maintenant', true)
      +   '<label style="width:100%;box-sizing:border-box;padding:13px;border-radius:12px;cursor:pointer;font-weight:900;font-size:0.86em;display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.13);color:#cbd5e1;">'
      +     ico('porte', 18, '#cbd5e1') + 'Restaurer depuis un fichier'
      +     '<input type="file" accept=".json,application/json" style="display:none;" onchange="AwakSauvegarde.depuisFichier(this.files[0]);this.value=\'\';"></label>'
      +   btn('AwakSauvegarde.copies()', ico('liste', 18, '#cbd5e1') + 'Copies sur ce téléphone', false)
      + '</div>'
      + '<div style="font-size:0.66em;color:#64748b;margin-top:10px;">Espace utilisé : ' + mo(o) + ' sur environ 5 Mo</div>'
      + '<div style="height:4px;border-radius:99px;background:rgba(255,255,255,0.07);margin-top:4px;overflow:hidden;"><div style="height:100%;width:' + pct.toFixed(0) + '%;background:' + (pct > 80 ? '#f87171' : BLEU) + ';"></div></div>';
  }

  // ── rappel ──
  function ecranLibre() {
    if (document.body.classList.contains('in-session')) return false;
    var c = document.querySelectorAll('[id$="Modal"], [id$="Overlay"], [id*="Onb"], [id*="story"], [id*="Story"], [id*="tuto"], [id*="Welcome"], #awakRunScreen');
    for (var i = 0; i < c.length; i++) {
      var cs = getComputedStyle(c[i]), r = c[i].getBoundingClientRect();
      if (cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0 && r.width > 100 && r.height > 100) return false;
    }
    return true;
  }
  function assezDeDonnees() {
    var n = 0;
    Object.keys(localStorage).forEach(function (k) {
      if (/^profile_.+_(workoutHistory|awakRuns)$/.test(k)) { try { n += (JSON.parse(localStorage.getItem(k)) || []).length; } catch (e) {} }
    });
    return n >= 3;
  }
  function rappel(essai) {
    try {
      var up = (typeof getUserProfile === 'function') ? getUserProfile() : null;
      if (!up || !up.setupComplete) return;
      var last = parseInt(localStorage.getItem(K_DERNIERE) || '0', 10);
      var rap = parseInt(localStorage.getItem(K_RAPPEL) || '0', 10);
      if (last && Date.now() - last < 30 * JOUR) return;
      if (rap && Date.now() - rap < 14 * JOUR) return;
      if (!assezDeDonnees()) return;
      if (!ecranLibre()) { if ((essai || 0) < 10) setTimeout(function () { rappel((essai || 0) + 1); }, 30000); return; }
      localStorage.setItem(K_RAPPEL, String(Date.now()));
      if (typeof showConfirm !== 'function') return;
      showConfirm('Tes séances, sorties et progrès ne sont enregistrés que sur ce téléphone. Envoie-toi une copie (Drive, courriel) : ça prend 10 secondes, et rien ne se perd si tu changes de téléphone.',
        envoyer, null, { title: 'Mets tes données à l\'abri', subtitle: last ? '◈ DERNIÈRE SAUVEGARDE : ' + depuis(last).toUpperCase() + ' ◈' : '◈ AUCUNE SAUVEGARDE ◈', confirmLabel: 'Sauvegarder', cancelLabel: 'Plus tard' });
    } catch (e) {}
  }

  window.AwakSauvegarde = {
    collecter: collecter, envoyer: envoyer, restaurer: restaurer, depuisFichier: depuisFichier,
    copies: copies, copieAuto: copieAuto, rendreReglages: rendreReglages, rappel: rappel, octets: octets,
    _test: { normaliser: normaliser, valide: valide, ecrire: ecrire, listerCopies: listerCopies }
  };

  var init = function () {
    rendreReglages();
    var h = document.getElementById('awakSauvegardeCarte');
    var hd = h && h.closest('.accordion-section') && h.closest('.accordion-section').querySelector('.accordion-header');
    if (hd) hd.addEventListener('click', function () { setTimeout(rendreReglages, 50); });
    setTimeout(rappel, 30000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
