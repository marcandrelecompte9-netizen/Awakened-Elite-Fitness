/* ═══════════════════════════════════════════════════════════════════
   PARTAGER UNE SÉANCE ENTRE DEUX TÉLÉPHONES (v1254)
   ─────────────────────────────────────────────────────────────────────
   Pas de serveur : la séance tient ENTIÈREMENT dans un lien
   (…/#seance=<données compressées>). Le lien s'affiche en code QR et peut
   partir par message. L'ami scanne avec l'appareil photo (ou depuis
   l'app : « Recevoir ») → Awakened s'ouvre sur la séance → il la commence
   ou la garde dans ses routines.
   • Seuls les réglages voyagent (exercices, ordre, séries, reps, durées,
     repos, supersets). Pas de charges : chacun garde les siennes.
   • À l'arrivée, la séance passe par la préparation normale : filtres de
     matériel, douleurs et profil jeune de l'ami s'appliquent.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var CLE = 'seance=';
  // Champs d'exercice qui voyagent (le reste vient de la base de l'ami).
  var CHAMPS = ['sets', 'reps', 'duration', 'mode', 'rest', 'repos', 'restTime', 'restBetweenSets', 'ss', 'isRest', 'type',
                '_seriesMinutees', '_baseName', 'side', 'perSide', 'unilateral', 'tempo', 'note'];
  var CHAMPS_HORS_BASE = ['muscle', 'equipment', 'difficulty', 'description'];

  function ic(n, t, c) { try { return window.AwakIcon ? AwakIcon.get(n, t || 18, c) : ''; } catch (e) { return ''; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nom(n) { try { return typeof window.awakNom === 'function' ? window.awakNom(n) : n; } catch (e) { return n; } }
  function db(n) { var L = window.exerciseDatabase || []; for (var i = 0; i < L.length; i++) if (L[i] && L[i].name === n) return L[i]; return null; }
  function moi() {
    try { var p = typeof getCurrentProfile === 'function' ? getCurrentProfile() : null; if (p && p.name) return p.name; } catch (e) {}
    try { var u = typeof getUserProfile === 'function' ? getUserProfile() : null; if (u && u.name) return u.name; } catch (e) {}
    return '';
  }

  // ── Encodage : JSON compact → deflate (si dispo) → base64url ─────────
  function b64(bytes) {
    var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function deb64(t) {
    t = t.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '=';
    var s = atob(t), b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b;
  }
  function flux(bytes, F) {
    var s = new Blob([bytes]).stream().pipeThrough(new F('deflate-raw'));
    return new Response(s).arrayBuffer().then(function (a) { return new Uint8Array(a); });
  }
  function compacter(w) {
    var ex = (w.exercises || []).filter(function (e) { return e && !e.isInfo; }).map(function (e) {
      var base = e._baseName || e.name, d = db(base), o = { n: base };
      CHAMPS.forEach(function (k) { if (e[k] !== undefined && e[k] !== null && e[k] !== '' && typeof e[k] !== 'object' && (!d || d[k] !== e[k])) o[k] = e[k]; });
      if (!d && !e.isRest) CHAMPS_HORS_BASE.forEach(function (k) { if (e[k] !== undefined) o[k] = e[k]; });
      return o;
    });
    return { v: 1, t: w.name || 'Séance', de: moi(), d: w.duration || null, e: ex };
  }
  function encoder(w) {
    var bytes = new TextEncoder().encode(JSON.stringify(compacter(w)));
    if (typeof CompressionStream === 'function') {
      return flux(bytes, CompressionStream).then(function (z) { return 'z' + b64(z); }).catch(function () { return 'j' + b64(bytes); });
    }
    return Promise.resolve('j' + b64(bytes));
  }
  function decoder(t) {
    var mode = t.charAt(0), bytes = deb64(t.slice(1));
    var p = (mode === 'z') ? flux(bytes, DecompressionStream) : Promise.resolve(bytes);
    return p.then(function (b) { return JSON.parse(new TextDecoder().decode(b)); });
  }
  function lienDe(code) {
    return location.origin + location.pathname + '#' + CLE + code;
  }

  // Reconstruit une séance jouable à partir des données reçues.
  function reconstruire(data) {
    var ex = (data.e || []).map(function (o) {
      var d = o.isRest ? null : db(o.n);
      var e = d ? Object.assign({}, d) : { name: o.n, type: o.isRest ? undefined : 'exercise' };
      Object.keys(o).forEach(function (k) { if (k !== 'n') e[k] = o[k]; });
      if (o.isRest) e.name = o.n || 'Repos';
      return e;
    });
    return { name: data.t || 'Séance partagée', duration: data.d || undefined, exercises: ex,
             type: 'partagee', _partageDe: data.de || '', _forceNew: true };
  }

  // ── Fenêtre ──────────────────────────────────────────────────────────
  function fenetre(id, contenu) {
    var old = document.getElementById(id); if (old) old.remove();
    var ov = document.createElement('div');
    ov.id = id;
    ov.style.cssText = 'position:fixed;inset:0;z-index:12500;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:16px 12px;box-sizing:border-box;';
    ov.onclick = function (e) { if (e.target === ov) fermer(id); };
    ov.innerHTML = '<div style="margin:auto 0;width:100%;max-width:420px;box-sizing:border-box;background:linear-gradient(160deg,#121722,#0d0f14);border:1px solid rgba(96,168,240,0.25);border-radius:20px;padding:20px 18px;color:#e2e8f0;text-align:center;">' + contenu + '</div>';
    document.body.appendChild(ov);
    return ov;
  }
  function fermer(id) {
    var el = document.getElementById(id || 'awakPartageModal'); if (el) el.remove();
    arreterCamera();
  }
  var BTN = 'width:100%;padding:13px;border:none;border-radius:13px;cursor:pointer;font-weight:900;font-size:0.9em;display:flex;align-items:center;justify-content:center;gap:8px;';
  var BTN2 = 'width:100%;padding:11px;border-radius:12px;cursor:pointer;font-weight:800;font-size:0.8em;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;display:flex;align-items:center;justify-content:center;gap:7px;';

  function qrSVG(texte) {
    if (typeof window.qrcode !== 'function') return '';
    var q = window.qrcode(0, 'L'); q.addData(texte); q.make();
    var n = q.getModuleCount(), m = 2, t = n + m * 2, r = '';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (q.isDark(y, x)) r += 'M' + (x + m) + ' ' + (y + m) + 'h1v1h-1z';
    // Fond blanc forcé (!important) : le thème sombre assombrit les fonds, et un
    // code QR sans contraste ne se scanne pas.
    return '<div style="background:#fff !important;border-radius:14px;padding:10px;max-width:260px;margin:0 auto;box-sizing:border-box;">'
      + '<svg viewBox="0 0 ' + t + ' ' + t + '" width="100%" style="display:block;" shape-rendering="crispEdges"><rect width="' + t + '" height="' + t + '" fill="#ffffff"/><path d="' + r + '" fill="#000000"/></svg></div>';
  }

  var _dernier = null;
  function partager(w) {
    w = w || (typeof window.getPendingWorkout === 'function' ? window.getPendingWorkout() : null);
    if (!w || !Array.isArray(w.exercises) || !w.exercises.length) {
      if (typeof window.showToast === 'function') window.showToast('Aucune séance à partager', 'info', 2500);
      return;
    }
    var nb = w.exercises.filter(function (e) { return e && !e.isRest && !e.isInfo; }).length;
    return encoder(w).then(function (code) {
      var lien = lienDe(code); _dernier = { lien: lien, titre: w.name || 'Séance' };
      fenetre('awakPartageModal',
        '<div style="display:flex;align-items:center;justify-content:center;gap:8px;font-size:1.08em;font-weight:900;color:#fff;margin-bottom:4px;">' + ic('lien', 18, '#93c5fd') + 'Partager la séance</div>'
        + '<div style="font-size:0.76em;color:#94a3b8;margin-bottom:14px;">' + esc(w.name || 'Séance') + ' · ' + nb + ' exercice' + (nb > 1 ? 's' : '') + '</div>'
        + '<div id="awakPartageQR" style="padding:4px;margin-bottom:12px;">' + qrSVG(lien) + '</div>'
        + '<div style="font-size:0.72em;color:#94a3b8;line-height:1.45;margin-bottom:14px;">Ton ami scanne ce code avec l\'appareil photo de son téléphone : la séance s\'ouvre dans son Awakened. Chacun garde ses propres charges.</div>'
        + '<div style="display:grid;gap:8px;">'
        +   '<button onclick="AwakPartage.envoyer()" style="' + BTN + 'background:linear-gradient(135deg,#3b82f6,#1d5fa8);color:#fff;">' + ic('message', 17, '#fff') + 'Envoyer par message</button>'
        +   '<button onclick="AwakPartage.copier()" style="' + BTN2 + '">' + ic('lien', 15) + 'Copier le lien</button>'
        +   '<button onclick="AwakPartage.recevoir()" style="' + BTN2 + '">' + ic('personne', 15) + 'Recevoir la séance de mon ami</button>'
        +   '<button onclick="AwakPartage.fermer()" style="' + BTN2 + 'border:none;background:transparent;color:#94a3b8;">Fermer</button>'
        + '</div>');
    });
  }
  function envoyer() {
    if (!_dernier) return;
    var txt = 'Ma séance Awakened : ' + _dernier.titre + '. Ouvre ce lien pour la faire avec moi :';
    if (navigator.share) {
      navigator.share({ title: _dernier.titre, text: txt, url: _dernier.lien }).catch(function () {});
    } else copier();
  }
  function copier() {
    if (!_dernier) return;
    var fait = function () { if (typeof window.showToast === 'function') window.showToast('Lien copié', 'success', 2000); };
    try { navigator.clipboard.writeText(_dernier.lien).then(fait, function () { prompt('Copie ce lien :', _dernier.lien); }); }
    catch (e) { prompt('Copie ce lien :', _dernier.lien); }
  }

  // ── Recevoir : scanner (si le téléphone sait lire les QR) ou coller ──
  var _cam = null;
  function arreterCamera() {
    if (_cam) { try { _cam.flux.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} clearInterval(_cam.timer); _cam = null; }
  }
  function recevoir() {
    var scanOk = ('BarcodeDetector' in window) && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    fenetre('awakPartageModal',
      '<div style="font-size:1.08em;font-weight:900;color:#fff;margin-bottom:6px;">Recevoir une séance</div>'
      + '<div style="font-size:0.74em;color:#94a3b8;margin-bottom:14px;line-height:1.45;">' + (scanOk ? 'Scanne le code affiché sur le téléphone de ton ami, ou colle le lien qu\'il t\'a envoyé.' : 'Colle le lien que ton ami t\'a envoyé, ou scanne son code avec l\'appareil photo du téléphone.') + '</div>'
      + (scanOk ? '<video id="awakPartageVideo" playsinline muted style="width:100%;border-radius:12px;background:#000;display:none;margin-bottom:10px;"></video>'
                + '<button id="awakPartageScan" onclick="AwakPartage.scanner()" style="' + BTN + 'background:linear-gradient(135deg,#3b82f6,#1d5fa8);color:#fff;margin-bottom:8px;">' + ic('cible', 17, '#fff') + 'Scanner le code</button>' : '')
      + '<input id="awakPartageLien" type="url" placeholder="Colle le lien ici" style="width:100%;box-sizing:border-box;padding:12px;border-radius:11px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.04);color:#fff;margin-bottom:8px;">'
      + '<div style="display:grid;gap:8px;">'
      +   '<button onclick="AwakPartage.ouvrirLien(document.getElementById(\'awakPartageLien\').value)" style="' + BTN2 + '">Ouvrir la séance</button>'
      +   '<button onclick="AwakPartage.fermer()" style="' + BTN2 + 'border:none;background:transparent;color:#94a3b8;">Fermer</button>'
      + '</div>');
  }
  function scanner() {
    var v = document.getElementById('awakPartageVideo'); if (!v) return;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function (f) {
      v.srcObject = f; v.style.display = 'block'; v.play();
      var b = document.getElementById('awakPartageScan'); if (b) b.style.display = 'none';
      var det = new window.BarcodeDetector({ formats: ['qr_code'] });
      _cam = { flux: f, timer: setInterval(function () {
        det.detect(v).then(function (r) {
          if (r && r[0] && r[0].rawValue && r[0].rawValue.indexOf(CLE) >= 0) { var val = r[0].rawValue; arreterCamera(); ouvrirLien(val); }
        }).catch(function () {});
      }, 400) };
    }).catch(function () {
      if (typeof window.showToast === 'function') window.showToast('Caméra indisponible : colle le lien à la place', 'warning', 3500);
    });
  }
  function ouvrirLien(txt) {
    var i = String(txt || '').indexOf(CLE);
    if (i < 0) { if (typeof window.showToast === 'function') window.showToast('Ce lien ne contient pas de séance', 'warning', 3000); return; }
    var code = String(txt).slice(i + CLE.length).split(/[&\s]/)[0];
    return importer(code);
  }

  // ── Arrivée d'une séance ─────────────────────────────────────────────
  var _recue = null;
  function importer(code) {
    return decoder(code).then(function (data) {
      if (!data || !Array.isArray(data.e) || !data.e.length) throw new Error('vide');
      _recue = reconstruire(data);
      var reels = _recue.exercises.filter(function (e) { return !e.isRest; });
      var inconnus = reels.filter(function (e) { return !db(e._baseName || e.name); }).length;
      var liste = reels.slice(0, 12).map(function (e) {
        var det = (e.sets ? e.sets + ' × ' : '') + ((e.mode === 'timer' || e.mode === 'temps') ? (e.duration ? e.duration + ' s' : '') : (e.reps || ''));
        return '<div style="display:flex;justify-content:space-between;gap:8px;font-size:0.76em;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);"><span style="color:#e2e8f0;text-align:left;">' + esc(nom(e._baseName || e.name)) + '</span><span style="color:#94a3b8;white-space:nowrap;">' + esc(det) + '</span></div>';
      }).join('') + (reels.length > 12 ? '<div style="font-size:0.7em;color:#64748b;padding-top:4px;">+ ' + (reels.length - 12) + ' autres</div>' : '');
      fenetre('awakPartageModal',
        '<div style="display:flex;align-items:center;justify-content:center;gap:8px;font-size:1.05em;font-weight:900;color:#fff;margin-bottom:4px;">' + ic('groupe', 18, '#93c5fd') + (data.de ? 'Séance de ' + esc(data.de) : 'Séance partagée') + '</div>'
        + '<div style="font-size:0.76em;color:#94a3b8;margin-bottom:12px;">' + esc(data.t || '') + ' · ' + reels.length + ' exercice' + (reels.length > 1 ? 's' : '') + (data.d ? ' · ' + data.d + ' min' : '') + '</div>'
        + '<div style="text-align:left;background:rgba(255,255,255,0.03);border-radius:12px;padding:8px 12px;margin-bottom:12px;max-height:40vh;overflow-y:auto;">' + liste + '</div>'
        + (inconnus ? '<div style="font-size:0.68em;color:#fbbf24;margin-bottom:10px;">' + inconnus + ' exercice' + (inconnus > 1 ? 's' : '') + ' personnalisé' + (inconnus > 1 ? 's' : '') + ' de ton ami, sans image ni consignes chez toi.</div>' : '')
        + '<div style="font-size:0.68em;color:#64748b;margin-bottom:12px;">Tes charges et ton matériel sont utilisés, pas ceux de ton ami.</div>'
        + '<div style="display:grid;gap:8px;">'
        +   '<button onclick="AwakPartage.commencer()" style="' + BTN + 'background:linear-gradient(135deg,#3b82f6,#1d5fa8);color:#fff;">' + ic('eclair', 17, '#fff') + 'Commencer maintenant</button>'
        +   '<button onclick="AwakPartage.garder()" style="' + BTN2 + '">' + ic('liste', 15) + 'Garder dans mes routines</button>'
        +   '<button onclick="AwakPartage.fermer()" style="' + BTN2 + 'border:none;background:transparent;color:#94a3b8;">Plus tard</button>'
        + '</div>');
    }).catch(function () {
      if (typeof window.showToast === 'function') window.showToast('Séance illisible : demande à ton ami de renvoyer le lien', 'error', 4000);
    });
  }
  function commencer() {
    if (!_recue) return;
    fermer();
    try { if (typeof switchTab === 'function') switchTab('workouts'); } catch (e) {}
    var w = JSON.parse(JSON.stringify(_recue));
    if (typeof window.showWorkoutPreparation === 'function') window.showWorkoutPreparation(w);
  }
  function garder() {
    if (!_recue) return;
    try {
      var pid = typeof getCurrentProfileId === 'function' ? getCurrentProfileId() : null;
      var k = pid ? 'routines_' + pid : 'routines';
      var L = JSON.parse(localStorage.getItem(k) || '[]') || [];
      var nomR = (_recue._partageDe ? _recue.name + ' (' + _recue._partageDe + ')' : _recue.name);
      // Format des routines : exercices seulement (les repos se règlent par exercice).
      var exR = _recue.exercises.filter(function (e) { return e && !e.isRest && e.type !== 'warmup' && e.type !== 'stretch'; }).map(function (e) {
        var o = { name: e._baseName || e.name, sets: e.sets || 3, reps: e.reps || 10, mode: (e.mode === 'temps' ? 'timer' : (e.mode || 'reps')) };
        if (e.duration) o.duration = e.duration;
        if (e.repos || e.rest) o.repos = e.repos || e.rest;
        if (e.ss) o.ss = e.ss;
        if (!db(o.name)) { o.muscle = e.muscle; o.equipment = e.equipment; }
        return o;
      });
      L.push({ id: 'r' + Date.now(), name: nomR, exercises: exR, createdAt: new Date().toISOString(), partageDe: _recue._partageDe || '' });
      localStorage.setItem(k, JSON.stringify(L));
      if (typeof window.renderRoutinesList === 'function') { try { window.renderRoutinesList(); } catch (e) {} }
      if (typeof window.showToast === 'function') window.showToast('Ajoutée à tes routines : ' + nomR, 'success', 3000);
    } catch (e) {}
    fermer();
  }

  // Lien ouvert : …/#seance=… → proposer la séance une fois l'app prête.
  function verifierArrivee() {
    var h = location.hash || '';
    var i = h.indexOf(CLE);
    if (i < 0) return;
    var code = h.slice(i + CLE.length);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    setTimeout(function () { importer(code); }, 1800);
  }

  window.AwakPartage = { partager: partager, envoyer: envoyer, copier: copier, recevoir: recevoir, scanner: scanner,
    ouvrirLien: ouvrirLien, importer: importer, commencer: commencer, garder: garder, fermer: function () { fermer(); },
    encoder: encoder, decoder: decoder, reconstruire: reconstruire };
  window.addEventListener('hashchange', verifierArrivee);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', verifierArrivee);
  else verifierArrivee();
})();
