// v1390 — Photos de progression + mensurations, ensemble.
// v1392 — Séance photo en 3 poses (face, profil, dos), caméra intégrée avec la
//         photo précédente en transparence (« fantôme »), rappel toutes les
//         4 semaines, et discrétion (photos floutées tant qu'on ne touche pas).
//
//  · « Prendre une photo » → fenêtre « Séance photo » : une case par pose.
//    Chaque case ouvre la caméra (repli : choisir une image). Les photos d'une
//    même séance partagent `groupe` et portent `pose`.
//  · « Terminer » → les mesures du jour, rangées avec la séance
//    (measurement.photoId = une des photos de la séance).
//  · « Mes photos » : une case par séance (plus récente d'abord) ; on en coche
//    deux → comparaison avant / après, pose par pose, + écarts des mesures.
// Les photos restent dans IndexedDB (app.js) ; les mesures dans bodyMeasurements.
(function () {
  'use strict';

  var CHAMPS = [
    ['weight', 'measureWeight', 'Poids'],
    ['waist', 'measureWaist', 'Tour de taille'],
    ['hips', 'measureHips', 'Tour de hanches'],
    ['biceps', 'measureBiceps', 'Biceps'],
    ['thighs', 'measureThighs', 'Cuisses'],
    ['height', 'measureHeight', 'Taille']
  ];
  var POSES = [['face', 'Face'], ['profil', 'Profil'], ['dos', 'Dos']];
  var NOM_POSE = { face: 'Face', profil: 'Profil', dos: 'Dos' };
  var RAPPEL_JOURS = 28;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function unitePoids() { try { return typeof window.weightUnit === 'function' ? window.weightUnit() : 'lbs'; } catch (e) { return 'lbs'; } }
  function unite(k) { return k === 'weight' ? unitePoids() : 'po'; }
  // v1391 : taille (grandeur) en pieds et pouces
  function txtTaille(v) { return typeof window.awakTailleTexte === 'function' ? window.awakTailleTexte(v) : fmt(v) + ' po'; }
  function lire(k, txt) { return k === 'height' && typeof window.awakTaillePouces === 'function' ? window.awakTaillePouces(txt) : nb(txt); }
  function aff(k, v) { return k === 'height' ? txtTaille(v) : fmt(v); }
  function nb(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }
  function fmt(v) { return (Math.round(v * 100) / 100).toString().replace('.', ','); }
  function jour(d) { try { var x = new Date(d); return x.getFullYear() + '-' + (x.getMonth() + 1) + '-' + x.getDate(); } catch (e) { return ''; } }
  function dateLongue(d) { try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
  function dateCourte(d) { try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); } catch (e) { return ''; } }
  function toast(m, t, d) { try { window.showToast(m, t || 'info', d || 2200); } catch (e) {} }
  function pid() { try { return typeof window._photoPid === 'function' ? window._photoPid() : ((window.getCurrentProfileId && window.getCurrentProfileId()) || 'default'); } catch (e) { return 'default'; } }
  function lsGet(k) { try { return localStorage.getItem(k + '_' + pid()); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k + '_' + pid(), v); } catch (e) {} }

  function photos() { try { return (typeof window.getProgressPhotos === 'function' ? window.getProgressPhotos() : []) || []; } catch (e) { return []; } }
  function mesures() { try { return (typeof window.getBodyMeasurements === 'function' ? window.getBodyMeasurements() : []) || []; } catch (e) { return []; } }
  function poseDe(p) { return (p && p.pose) || 'face'; }   // anciennes photos : face

  // ── Séances (groupes de photos) ───────────────────────────────────
  function cleDe(p) { return p.groupe || ('p' + p.id); }
  function groupes() {
    var map = {}, ordre = [];
    photos().forEach(function (p) {
      var k = cleDe(p);
      if (!map[k]) { map[k] = { cle: k, poses: {}, liste: [], date: p.date }; ordre.push(k); }
      var g = map[k]; g.liste.push(p);
      if (!g.poses[poseDe(p)]) g.poses[poseDe(p)] = p;
      if (new Date(p.date) < new Date(g.date)) g.date = p.date;
    });
    var l = ordre.map(function (k) { var g = map[k]; g.principale = g.poses.face || g.liste[0]; return g; });
    l.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    return l;
  }
  function groupeDePhoto(p) { var k = cleDe(p); return groupes().find(function (g) { return g.cle === k; }) || null; }

  // Mesures d'une séance : liées par photoId (n'importe quelle photo de la
  // séance), sinon celles du même jour sans lien (photos d'avant v1390).
  function mesuresDe(photoOuGroupe) {
    var g = photoOuGroupe && photoOuGroupe.liste ? photoOuGroupe : groupeDePhoto(photoOuGroupe);
    var ids = g ? g.liste.map(function (p) { return p.id; }) : [photoOuGroupe.id];
    var l = mesures();
    var lie = l.find(function (m) { return m && ids.indexOf(m.photoId) >= 0; });
    if (lie) return lie;
    var j = jour(g ? g.date : photoOuGroupe.date);
    return l.find(function (m) { return m && !m.photoId && jour(m.date) === j; }) || null;
  }
  function valeur(m, k) {
    if (!m) return null;
    if (k === 'weight') { try { return typeof window.awakMesurePoids === 'function' ? window.awakMesurePoids(m) : nb(m.weight); } catch (e) { return nb(m.weight); } }
    return nb(m[k]);
  }

  function enregistrer(vals, photo, existante) {
    var l = mesures();
    var kg = unitePoids() === 'kg';
    var m = existante || { id: Date.now(), date: photo ? photo.date : new Date().toISOString() };
    m.unit = kg ? 'kg' : 'lbs';
    CHAMPS.forEach(function (c) { m[c[0]] = vals[c[0]] || null; });
    if (photo) m.photoId = photo.id;
    if (m.weight && m.height) {
      var wKg = kg ? m.weight : m.weight * 0.453592, hM = (m.height * 2.54) / 100;
      m.bmi = (wKg / (hM * hM)).toFixed(1);
    } else delete m.bmi;
    if (!existante) {
      l.push(m);
      l.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });   // plus récente d'abord
      if (l.length > 100) l.length = 100;
    }
    try { window.saveBodyMeasurements(l); } catch (e) {}
    rafraichir();
  }
  function rafraichir() {
    try { if (typeof window.renderBodyMeasurements === 'function') window.renderBodyMeasurements(); } catch (e) {}
    try { if (typeof window.renderProgressPhotos === 'function') window.renderProgressPhotos(); } catch (e) {}
    try { if (typeof window.awakRenderCorpsCard === 'function') window.awakRenderCorpsCard(); } catch (e) {}
    try { if (typeof window.awakRenderSilhouetteMesures === 'function') window.awakRenderSilhouetteMesures(); } catch (e) {}
  }

  // ── Discrétion (floutage) ─────────────────────────────────────────
  function discret() { return lsGet('awakPhotosFlou') !== '0'; }   // activée par défaut
  function setDiscret(v) { lsSet('awakPhotosFlou', v ? '1' : '0'); }
  function imgFlou(src, cls) {
    return '<img src="' + src + '" alt="" class="' + (cls || '') + (discret() ? ' awk-pm-flou' : '') + '" loading="lazy">';
  }
  // Toucher une photo floutée la révèle (une seule fois, sans autre action)
  document.addEventListener('click', function (e) {
    var im = e.target && e.target.closest && e.target.closest('.awk-pm-flou');
    if (!im || im.closest('.awk-pm-case')) return;   // galerie : bouton « Afficher »
    e.preventDefault(); e.stopPropagation();
    im.classList.remove('awk-pm-flou');
  }, true);

  function fenetre(id, html) {
    var old = document.getElementById(id); if (old) old.remove();
    var f = document.createElement('div');
    f.id = id; f.className = 'awk-pm-fond';
    f.innerHTML = '<div class="awk-pm-carte" role="dialog">' + html + '</div>';
    f.addEventListener('click', function (e) { if (e.target === f) f.remove(); });
    document.body.appendChild(f);
    return f;
  }
  var X = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICO_CAM = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
  function tete(sur, titre) {
    return '<div class="awk-pm-tete"><div><div class="awk-pm-sur">' + sur + '</div><div class="awk-pm-titre">' + titre + '</div></div>'
      + '<button type="button" class="awk-pm-x" data-fermer aria-label="Fermer">' + X + '</button></div>';
  }

  // ── Enregistrement d'une photo (IndexedDB d'app.js) ──────────────
  function sauverPhoto(dataUrl, pose, groupe) {
    var photo = { id: Date.now(), date: new Date().toISOString(), dataUrl: dataUrl, note: '', pose: pose, groupe: groupe };
    if (typeof window.awakPhotoDBPut !== 'function') return Promise.reject(new Error('stockage'));
    return window.awakPhotoDBPut(pid(), photo)
      .then(function () { return typeof window.awakLoadProgressPhotos === 'function' ? window.awakLoadProgressPhotos() : null; })
      .then(function () { rafraichir(); return photo; });
  }
  function supprimerPhoto(photo) {
    if (typeof window.awakPhotoDBDelete !== 'function') return Promise.resolve();
    return window.awakPhotoDBDelete(pid(), photo.id)
      .then(function () { return window.awakLoadProgressPhotos ? window.awakLoadProgressPhotos() : null; })
      .then(rafraichir);
  }
  function compresser(src, ratio) {
    // Recadre au format 3:4 (portrait) si `ratio`, puis max 1080 px, JPEG 0.7
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () {
        try {
          var sw = im.width, sh = im.height, sx = 0, sy = 0;
          if (ratio) { var r = 3 / 4; if (sw / sh > r) { var nw = sh * r; sx = (sw - nw) / 2; sw = nw; } else { var nh = sw / r; sy = (sh - nh) / 2; sh = nh; } }
          var k = Math.min(1, 1080 / Math.max(sw, sh));
          var c = document.createElement('canvas'); c.width = Math.round(sw * k); c.height = Math.round(sh * k);
          c.getContext('2d').drawImage(im, sx, sy, sw, sh, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', 0.7));
        } catch (e) { res(src); }
      };
      im.onerror = function () { res(null); };
      im.src = src;
    });
  }

  // ── 1. Séance photo (3 poses) ─────────────────────────────────────
  var seanceCourante = null;   // { groupe, prises: { pose: photo } }
  function seance() {
    if (!seanceCourante) seanceCourante = { groupe: 'g' + Date.now(), prises: {} };
    var s = seanceCourante;
    var cases = POSES.map(function (p) {
      var ph = s.prises[p[0]];
      return '<div class="awk-pm-pose' + (ph ? ' faite' : '') + '" data-pose="' + p[0] + '">'
        + '<div class="awk-pm-pose-img">' + (ph ? '<img src="' + ph.dataUrl + '" alt="">' : '<span class="awk-pm-pose-ico">' + ICO_CAM + '</span>') + '</div>'
        + '<div class="awk-pm-pose-nom">' + p[1] + '</div>'
        + '<div class="awk-pm-pose-act">' + (ph ? 'Reprendre' : 'Prendre') + '</div></div>';
    }).join('');
    var n = Object.keys(s.prises).length;
    var f = fenetre('awakSeancePhoto',
      tete('Séance photo', 'Face, profil, dos')
      + '<div class="awk-pm-corps">'
      +   '<p class="awk-pm-note">Même endroit, même lumière, même tenue que la dernière fois : c\'est ce qui rend la comparaison juste. La photo précédente s\'affiche en transparence pour t\'aider à te placer. Les photos restent sur ton téléphone.</p>'
      +   '<div class="awk-pm-poses">' + cases + '</div>'
      + '</div>'
      + '<div class="awk-pm-pied"><button type="button" class="awk-btn-2" data-annuler>' + (n ? 'Terminer plus tard' : 'Annuler') + '</button>'
      + '<button type="button" class="awk-btn" data-terminer' + (n ? '' : ' disabled') + '>Terminer' + (n ? ' (' + n + '/3)' : '') + '</button></div>');
    f.querySelector('[data-fermer]').onclick = fermerSeance;
    f.querySelector('[data-annuler]').onclick = fermerSeance;
    f.querySelectorAll('[data-pose]').forEach(function (c) { c.onclick = function () { camera(c.dataset.pose); }; });
    f.querySelector('[data-terminer]').onclick = function () {
      var lst = POSES.map(function (p) { return s.prises[p[0]]; }).filter(Boolean);
      if (!lst.length) return;
      fermerSeance();
      saisir(lst[0], true, lst);
    };
    function fermerSeance() { f.remove(); seanceCourante = null; }
  }

  // Photo précédente de la même pose (pour le fantôme)
  function derniere(pose, saufGroupe) {
    var l = photos().filter(function (p) { return poseDe(p) === pose && cleDe(p) !== saufGroupe; });
    l.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    return l[0] || null;
  }

  // ── 2. Caméra intégrée avec fantôme ──────────────────────────────
  var flux = null;
  function arreterFlux() { try { if (flux) flux.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} flux = null; }
  function camera(pose) {
    var s = seanceCourante; if (!s) return;
    var fant = derniere(pose, s.groupe);
    var avant = lsGet('awakPhotoCam') !== 'env';   // caméra frontale par défaut (seul devant le miroir)
    var minuteur = lsGet('awakPhotoMinuteur') !== '0';
    var old = document.getElementById('awakCamera'); if (old) old.remove();
    var ov = document.createElement('div');
    ov.id = 'awakCamera';
    ov.innerHTML =
      '<div class="awk-cam-haut"><button type="button" class="awk-pm-x" data-fermer aria-label="Fermer">' + X + '</button>'
      + '<div class="awk-cam-titre">' + NOM_POSE[pose] + '</div>'
      + '<button type="button" class="awk-cam-bt" data-retourner aria-label="Changer de caméra"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><path d="M9 13a3 3 0 015-2.2M15 13a3 3 0 01-5 2.2M14 9.5v1.5h-1.5M10 16.5V15h1.5"/></svg></button></div>'
      + '<div class="awk-cam-cadre"><video playsinline muted autoplay></video>'
      +   (fant ? '<img class="awk-cam-fantome" src="' + fant.dataUrl + '" alt="">' : '')
      +   '<div class="awk-cam-guide"></div><div class="awk-cam-decompte"></div>'
      +   '<img class="awk-cam-apercu" alt="" hidden></div>'
      + '<div class="awk-cam-bas">'
      +   '<div class="awk-cam-options">'
      +     (fant ? '<button type="button" class="awk-cam-opt on" data-fantome>Fantôme</button>' : '<span class="awk-cam-astuce">Première photo de face, de profil ou de dos : place-toi au centre, en entier.</span>')
      +     '<button type="button" class="awk-cam-opt' + (minuteur ? ' on' : '') + '" data-minuteur>Minuteur 3 s</button>'
      +   '</div>'
      +   '<div class="awk-cam-actions" data-prise>'
      +     '<button type="button" class="awk-cam-bt" data-galerie aria-label="Choisir une image">Galerie</button>'
      +     '<button type="button" class="awk-cam-declic" data-declic aria-label="Prendre la photo"></button>'
      +     '<span class="awk-cam-bt-vide"></span>'
      +   '</div>'
      +   '<div class="awk-cam-actions" data-valider hidden>'
      +     '<button type="button" class="awk-btn-2" data-reprendre>Reprendre</button>'
      +     '<button type="button" class="awk-btn" data-garder>Garder</button>'
      +   '</div>'
      + '</div>'
      + '<input type="file" accept="image/*" hidden data-fichier>';
    document.body.appendChild(ov);
    var video = ov.querySelector('video'), apercu = ov.querySelector('.awk-cam-apercu'), fichier = ov.querySelector('[data-fichier]');
    var capture = null;

    function demarrer() {
      arreterFlux();
      video.classList.toggle('miroir', avant);
      var md = navigator.mediaDevices;
      if (!md || typeof md.getUserMedia !== 'function') { sansCamera(); return; }
      md.getUserMedia({ video: { facingMode: avant ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 1706 } }, audio: false })
        .then(function (st) { flux = st; video.srcObject = st; try { video.play(); } catch (e) {} })
        .catch(function () { sansCamera(); });
    }
    function sansCamera() {
      ov.classList.add('sans-camera');
      var c = ov.querySelector('.awk-cam-guide');
      if (c) c.innerHTML = '<div class="awk-cam-msg">Caméra non disponible. Choisis une photo dans ta galerie.</div>';
    }
    function fermer() { arreterFlux(); ov.remove(); }
    function montrer(dataUrl) {
      capture = dataUrl;
      apercu.src = dataUrl; apercu.hidden = false;
      ov.querySelector('[data-prise]').hidden = true; ov.querySelector('[data-valider]').hidden = false;
    }
    function declic() {
      if (!video.videoWidth) { fichier.click(); return; }
      var go = function () {
        var vw = video.videoWidth, vh = video.videoHeight, r = 3 / 4, sw = vw, sh = vh, sx = 0, sy = 0;
        if (vw / vh > r) { sw = vh * r; sx = (vw - sw) / 2; } else { sh = vw / r; sy = (vh - sh) / 2; }
        var k = Math.min(1, 1080 / Math.max(sw, sh));
        var c = document.createElement('canvas'); c.width = Math.round(sw * k); c.height = Math.round(sh * k);
        var g = c.getContext('2d');
        if (avant) { g.translate(c.width, 0); g.scale(-1, 1); }   // même sens que l'aperçu (miroir)
        g.drawImage(video, sx, sy, sw, sh, 0, 0, c.width, c.height);
        try { navigator.vibrate && navigator.vibrate(30); } catch (e) {}
        montrer(c.toDataURL('image/jpeg', 0.7));
      };
      if (!minuteur) { go(); return; }
      var d = ov.querySelector('.awk-cam-decompte'), n = 3;
      d.textContent = n; d.classList.add('on');
      var t = setInterval(function () {
        n--; if (n > 0) { d.textContent = n; return; }
        clearInterval(t); d.classList.remove('on'); d.textContent = ''; if (document.body.contains(ov)) go();
      }, 1000);
    }
    ov.querySelector('[data-fermer]').onclick = fermer;
    ov.querySelector('[data-declic]').onclick = declic;
    ov.querySelector('[data-galerie]').onclick = function () { fichier.click(); };
    fichier.onchange = function () {
      var fl = fichier.files && fichier.files[0]; if (!fl) return;
      var rd = new FileReader();
      rd.onload = function (e) { compresser(e.target.result, true).then(function (u) { if (u) montrer(u); else toast('Image illisible.', 'error'); }); };
      rd.readAsDataURL(fl);
    };
    ov.querySelector('[data-retourner]').onclick = function () { avant = !avant; lsSet('awakPhotoCam', avant ? 'user' : 'env'); demarrer(); };
    var bf = ov.querySelector('[data-fantome]');
    if (bf) bf.onclick = function () { bf.classList.toggle('on'); ov.querySelector('.awk-cam-fantome').hidden = !bf.classList.contains('on'); };
    var bm = ov.querySelector('[data-minuteur]');
    bm.onclick = function () { minuteur = !minuteur; bm.classList.toggle('on', minuteur); lsSet('awakPhotoMinuteur', minuteur ? '1' : '0'); };
    ov.querySelector('[data-reprendre]').onclick = function () {
      capture = null; apercu.hidden = true;
      ov.querySelector('[data-prise]').hidden = false; ov.querySelector('[data-valider]').hidden = true;
    };
    ov.querySelector('[data-garder]').onclick = function () {
      if (!capture || !seanceCourante) return;
      var b = this; b.disabled = true;
      var ancienne = seanceCourante.prises[pose];
      sauverPhoto(capture, pose, seanceCourante.groupe).then(function (ph) {
        if (ancienne) supprimerPhoto(ancienne);
        if (seanceCourante) seanceCourante.prises[pose] = ph;
        fermer();
        if (seanceCourante) seance();
      }).catch(function () { b.disabled = false; toast('Impossible d\'enregistrer la photo. Réessaie.', 'error', 4000); });
    };
    demarrer();
  }

  // ── 3. Mesures de la séance ───────────────────────────────────────
  function saisir(photo, nouvelle, liste) {
    var g = groupeDePhoto(photo);
    var ex = mesuresDe(g || photo);
    var ids = g ? g.liste.map(function (p) { return p.id; }) : [photo.id];
    var lieeOk = ex && ids.indexOf(ex.photoId) >= 0;
    var vignettes = (liste || (g ? g.liste : [photo])).map(function (p) { return '<div class="awk-pm-mini"><img src="' + p.dataUrl + '" alt=""><span>' + NOM_POSE[poseDe(p)] + '</span></div>'; }).join('');
    var lignes = CHAMPS.map(function (c) {
      var v = valeur(ex, c[0]);
      return '<label class="awk-pm-ligne"><span>' + c[2] + '</span>'
        + '<input data-k="' + c[0] + '" data-c="' + c[1] + '" readonly inputmode="none" placeholder="Ajouter" value="' + (v != null ? (c[0] === 'height' ? txtTaille(v) : v) : '') + '">'
        + '<small>' + (c[0] === 'height' ? '' : unite(c[0])) + '</small></label>';
    }).join('');
    var f = fenetre('awakPhotoMesures',
      tete(nouvelle ? 'Photos ajoutées' : 'Mesures', 'Ta séance du ' + esc(dateLongue(g ? g.date : photo.date)))
      + '<div class="awk-pm-corps">'
      +   '<div class="awk-pm-minis">' + vignettes + '</div>'
      +   '<p class="awk-pm-note">' + (nouvelle ? 'Ajoute tes mesures du jour : elles seront rangées avec ces photos pour comparer plus tard.' : 'Ces mesures seront rangées avec ces photos.') + '</p>'
      +   '<div class="awk-pm-lignes">' + lignes + '</div>'
      + '</div>'
      + '<div class="awk-pm-pied"><button type="button" class="awk-btn-2" data-plustard>' + (nouvelle ? 'Plus tard' : 'Annuler') + '</button>'
      + '<button type="button" class="awk-btn" data-ok>Enregistrer</button></div>');
    f.querySelectorAll('input[data-k]').forEach(function (inp) {
      inp.addEventListener('click', function () {
        if (inp.dataset.rgClavier) return;
        if (window.AwakRegleMesures) window.AwakRegleMesures.ouvrir(inp.dataset.c, inp);
      });
    });
    f.querySelector('[data-fermer]').onclick = function () { f.remove(); };
    f.querySelector('[data-plustard]').onclick = function () { f.remove(); };
    f.querySelector('[data-ok]').onclick = function () {
      var vals = {}, n = 0;
      f.querySelectorAll('input[data-k]').forEach(function (inp) { var v = lire(inp.dataset.k, inp.value); if (v > 0) { vals[inp.dataset.k] = v; n++; } });
      if (!n) { toast('Entre au moins une mesure, ou touche « Plus tard ».', 'warning', 2500); return; }
      enregistrer(vals, photo, lieeOk ? ex : null);
      f.remove();
      toast('Mesures enregistrées avec les photos', 'success', 2000);
      if (document.getElementById('awakMesPhotos')) ouvrirGalerie();
    };
  }

  // ── 4. Mes photos (une case par séance) ──────────────────────────
  var choix = [], montrer = false;
  function ouvrirGalerie() {
    var l = groupes();
    if (!l.length) { toast('Aucune photo pour le moment.'); return; }
    if (choix.length !== 2 || !choix.every(function (k) { return l.some(function (g) { return g.cle === k; }); })) {
      choix = l.length >= 2 ? [l[0].cle, l[l.length - 1].cle] : [];
    }
    var flou = discret() && !montrer;
    var cases = l.map(function (g) {
      var m = mesuresDe(g), w = valeur(m, 'weight'), t = valeur(m, 'waist');
      var info = m ? [w ? fmt(w) + ' ' + unitePoids() : '', t ? fmt(t) + ' po' : ''].filter(Boolean).join(' · ') : '';
      var n = Object.keys(g.poses).length;
      return '<div class="awk-pm-case' + (choix.indexOf(g.cle) >= 0 ? ' on' : '') + '" data-cle="' + esc(g.cle) + '">'
        + '<div class="awk-pm-img"><img src="' + g.principale.dataUrl + '" alt="" loading="lazy"' + (flou ? ' class="awk-pm-flou"' : '') + '>'
        +   '<span class="awk-pm-coche"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#04121f" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>'
        +   (n > 1 ? '<span class="awk-pm-nb">' + n + ' poses</span>' : '') + '</div>'
        + '<div class="awk-pm-date">' + esc(dateCourte(g.date)) + '</div>'
        + (info ? '<div class="awk-pm-info">' + esc(info) + '</div>'
                : '<button type="button" class="awk-pm-ajout" data-mes="' + esc(g.cle) + '">+ Mesures</button>')
        + '</div>';
    }).join('');
    var f = fenetre('awakMesPhotos',
      tete(l.length + ' séance' + (l.length > 1 ? 's' : ''), 'Mes photos')
      + '<div class="awk-pm-corps">'
      +   '<div class="awk-pm-barre">' + (l.length >= 2 ? '<span>Touche deux séances pour les comparer.</span>' : '<span></span>')
      +     '<button type="button" class="awk-pm-pill' + (discret() ? ' on' : '') + '" data-discret>Discrétion</button>'
      +     (discret() ? '<button type="button" class="awk-pm-pill" data-montrer>' + (montrer ? 'Masquer' : 'Afficher') + '</button>' : '')
      +   '</div>'
      +   '<div class="awk-pm-grille">' + cases + '</div>'
      + '</div>'
      + '<div class="awk-pm-pied"><button type="button" class="awk-btn-2" data-photo>Nouvelle séance</button>'
      + (l.length >= 2 ? '<button type="button" class="awk-btn" data-comparer' + (choix.length === 2 ? '' : ' disabled') + '>Comparer</button>' : '')
      + '</div>');
    f.querySelector('[data-fermer]').onclick = function () { montrer = false; f.remove(); };
    f.querySelector('[data-photo]').onclick = function () { f.remove(); seance(); };
    f.querySelector('[data-discret]').onclick = function () { setDiscret(!discret()); montrer = false; ouvrirGalerie(); rafraichir(); };
    var bm = f.querySelector('[data-montrer]');
    if (bm) bm.onclick = function () { montrer = !montrer; ouvrirGalerie(); };
    var cmp = f.querySelector('[data-comparer]');
    if (cmp) cmp.onclick = function () { if (choix.length === 2) comparerGroupes(choix[0], choix[1]); };
    f.querySelectorAll('[data-mes]').forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); var g = l.find(function (x) { return x.cle === b.dataset.mes; }); if (g) saisir(g.principale, false); };
    });
    f.querySelectorAll('.awk-pm-case').forEach(function (c) {
      c.onclick = function () {
        var k = c.dataset.cle, i = choix.indexOf(k);
        if (i >= 0) choix.splice(i, 1); else { choix.push(k); if (choix.length > 2) choix.shift(); }
        f.querySelectorAll('.awk-pm-case').forEach(function (x) { x.classList.toggle('on', choix.indexOf(x.dataset.cle) >= 0); });
        if (cmp) cmp.disabled = choix.length !== 2;
      };
    });
  }

  // ── 5. Comparaison avant / après, pose par pose ──────────────────
  function comparerGroupes(k1, k2, poseVoulue) {
    var l = groupes();
    var a = l.find(function (g) { return g.cle === k1; }), b = l.find(function (g) { return g.cle === k2; });
    if (!a || !b) return;
    if (new Date(a.date) > new Date(b.date)) { var t = a; a = b; b = t; }
    var communes = POSES.filter(function (p) { return a.poses[p[0]] && b.poses[p[0]]; }).map(function (p) { return p[0]; });
    var pose = communes.indexOf(poseVoulue) >= 0 ? poseVoulue : (communes[0] || null);
    var pa = pose ? a.poses[pose] : a.principale, pb = pose ? b.poses[pose] : b.principale;
    var ma = mesuresDe(a), mb = mesuresDe(b);
    var jours = Math.max(0, Math.round((new Date(b.date) - new Date(a.date)) / 86400000));
    var lignes = CHAMPS.map(function (c) {
      var va = valeur(ma, c[0]), vb = valeur(mb, c[0]);
      if (va == null && vb == null) return '';
      var d = (va != null && vb != null) ? Math.round((vb - va) * 100) / 100 : null;
      var dTxt = d == null ? '' : (d === 0 ? '=' : (d > 0 ? '+' : '−') + fmt(Math.abs(d)));
      return '<div class="awk-pm-cmp-l"><span>' + c[2] + '</span>'
        + '<b>' + (va != null ? aff(c[0], va) : '—') + '</b><b>' + (vb != null ? aff(c[0], vb) : '—') + '</b>'
        + '<em>' + dTxt + (d ? ' ' + unite(c[0]) : '') + '</em></div>';
    }).join('');
    var col = function (p, g, lbl) {
      return '<div class="awk-pm-cmp-col"><div class="awk-pm-cmp-lbl">' + lbl + '</div>'
        + '<div class="awk-pm-cmp-img">' + imgFlou(p.dataUrl) + '</div>'
        + '<div class="awk-pm-date">' + esc(dateLongue(g.date)) + '</div></div>';
    };
    // v1394 : les 3 poses sont toujours proposées dès qu'une des deux séances
    // en a plus d'une ; une pose absente d'un côté est grisée, avec la raison
    // (ex. ancienne séance prise de face seulement).
    var plusieurs = Object.keys(a.poses).length > 1 || Object.keys(b.poses).length > 1;
    var manque = '';
    var onglets = plusieurs ? '<div class="awk-pm-onglets">' + POSES.map(function (pp) {
      var p = pp[0], ok = communes.indexOf(p) >= 0;
      return '<button type="button" class="awk-pm-pill' + (p === pose ? ' on' : '') + (ok ? '' : ' off') + '"' + (ok ? ' data-pose="' + p + '"' : ' data-manque="' + p + '" aria-disabled="true"') + '>' + NOM_POSE[p] + '</button>';
    }).join('') + '</div>' : '';
    var raison = function (p) {
      var g = !a.poses[p] ? a : b;
      return 'Pas de photo de ' + NOM_POSE[p].toLowerCase() + ' le ' + dateLongue(g.date) + '. Elle sera comparable à ta prochaine séance photo.';
    };
    if (plusieurs) {
      var abs = POSES.filter(function (pp) { return communes.indexOf(pp[0]) < 0; }).map(function (pp) { return pp[0]; });
      if (abs.length && communes.length) manque = '<p class="awk-pm-note awk-pm-centre" data-raison>' + esc(raison(abs[0])) + '</p>';
    }
    var f = fenetre('awakPhotoCompare',
      tete(jours + ' jour' + (jours > 1 ? 's' : '') + ' d\'écart', 'Comparer')
      + '<div class="awk-pm-corps">'
      +   onglets + manque
      +   (!communes.length && (Object.keys(a.poses).length > 1 || Object.keys(b.poses).length > 1) ? '<p class="awk-pm-note">Ces deux séances n\'ont pas de pose en commun.</p>' : '')
      +   '<div class="awk-pm-cmp">' + col(pa, a, 'Avant') + col(pb, b, 'Après') + '</div>'
      +   (discret() ? '<p class="awk-pm-note awk-pm-centre">Touche une photo pour l\'afficher.</p>' : '')
      +   (lignes ? '<div class="awk-pm-cmp-tab"><div class="awk-pm-cmp-l awk-pm-cmp-h"><span></span><b>Avant</b><b>Après</b><em>Écart</em></div>' + lignes + '</div>'
                  : '<p class="awk-pm-note">Aucune mesure avec ces photos. Ajoute-les depuis « Mes photos » (+ Mesures).</p>')
      + '</div>'
      + '<div class="awk-pm-pied"><button type="button" class="awk-btn-2" data-retour>Mes photos</button></div>');
    f.querySelector('[data-fermer]').onclick = function () { f.remove(); };
    f.querySelector('[data-retour]').onclick = function () { f.remove(); ouvrirGalerie(); };
    f.querySelectorAll('[data-pose]').forEach(function (bt) { bt.onclick = function () { comparerGroupes(a.cle, b.cle, bt.dataset.pose); }; });
    f.querySelectorAll('[data-manque]').forEach(function (bt) { bt.onclick = function () { var r = f.querySelector('[data-raison]'); if (r) r.textContent = raison(bt.dataset.manque); }; });
  }
  // Ancienne API (ids de photos)
  function comparer(id1, id2) {
    var l = photos();
    var p1 = l.find(function (p) { return p.id === id1; }), p2 = l.find(function (p) { return p.id === id2; });
    if (p1 && p2) comparerGroupes(cleDe(p1), cleDe(p2));
  }

  // ── 6. Rappel toutes les 4 semaines + discrétion sur la carte ────
  function rappelDu() {
    var l = groupes(); if (!l.length) return null;
    var j = Math.floor((Date.now() - new Date(l[0].date).getTime()) / 86400000);
    if (j < RAPPEL_JOURS) return null;
    var report = +(lsGet('awakPhotoRappelReport') || 0);
    if (report && Date.now() < report) return null;
    return { jours: j, date: l[0].date };
  }
  function decorerCarte(host) {
    if (!host) return;
    // discrétion : la grande photo de la carte est floutée tant qu'on ne la touche pas
    if (discret()) host.querySelectorAll('img').forEach(function (im) { if (/^data:/.test(im.getAttribute('src') || '')) im.classList.add('awk-pm-flou'); });
    var r = rappelDu();
    var vieux = host.querySelector('.awk-pm-rappel'); if (vieux) vieux.remove();
    if (!r) return;
    var carte = host.querySelector('.card') || host;
    var div = document.createElement('div');
    div.className = 'awk-pm-rappel';
    div.innerHTML = '<div class="awk-pm-rappel-txt"><b>Photo du mois ?</b><span>Ta dernière séance date du ' + esc(dateCourte(r.date)) + ' (' + r.jours + ' jours).</span></div>'
      + '<button type="button" class="awk-btn" data-go>Prendre</button><button type="button" class="awk-pm-pill" data-tard>Plus tard</button>';
    carte.insertBefore(div, carte.firstChild);
    div.querySelector('[data-go]').onclick = function () { seance(); };
    div.querySelector('[data-tard]').onclick = function () { lsSet('awakPhotoRappelReport', String(Date.now() + 7 * 86400000)); div.remove(); };
  }

  window.AwakPhotoMesures = {
    seance: seance, camera: camera, saisir: saisir, galerie: ouvrirGalerie, comparer: comparer, comparerGroupes: comparerGroupes,
    mesuresDe: mesuresDe, groupes: groupes, decorerCarte: decorerCarte, discret: discret, setDiscret: setDiscret,
    // compat v1390 : une photo prise par l'ancien chemin (fichier) → ses mesures
    apresPhoto: function (photo) { setTimeout(function () { saisir(photo, true); }, 250); }
  };
})();
