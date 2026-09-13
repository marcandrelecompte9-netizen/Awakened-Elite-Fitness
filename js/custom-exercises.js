/* ═══════════════════════════════════════════════════════════════════════
   ✎  EXERCICES PERSONNALISÉS — Awakened
   -----------------------------------------------------------------------
   Permet d'ajouter un mouvement absent du catalogue : nom, muscle
   PRIMAIRE, muscles SECONDAIRES, équipement, difficulté et photo.

   INTÉGRATION
   Les exercices créés sont injectés dans `exerciseDatabase` au chargement.
   Ils deviennent donc visibles PARTOUT : catalogue, recherche, filtres,
   routines, et générateur de séances — sans toucher au reste du code.

   STOCKAGE
   • Définitions : localStorage `customExercises_<profil>` (par membre).
   • Photos : compressées en 480px JPEG avant enregistrement. Une image
     brute de téléphone (3–5 Mo) saturerait le quota du navigateur et
     ferait échouer TOUTES les sauvegardes suivantes, pas seulement
     celle-ci. Si le quota est malgré tout atteint, l'exercice est
     enregistré SANS photo plutôt que perdu.

   ⚠️ `type: 'exercise'` est obligatoire : c'est ce champ qui distingue un
      exercice d'un échauffement ou d'un étirement dans les générateurs.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CLE = 'customExercises';
  var MAX_PX = 480;          // côté max de la photo enregistrée
  var QUALITE = 0.72;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function attr(s) { return esc(s).replace(/\n/g, ' '); }

  function cle() {
    try {
      var id = (typeof getCurrentProfileId === 'function') ? getCurrentProfileId() : null;
      return id ? CLE + '_' + id : CLE;
    } catch (e) { return CLE; }
  }

  function lire() {
    try {
      var v = JSON.parse(localStorage.getItem(cle()) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }

  function ecrire(liste) {
    try { localStorage.setItem(cle(), JSON.stringify(liste || [])); return true; }
    catch (e) { return false; }
  }

  function db() {
    try { if (typeof exerciseDatabase !== 'undefined' && Array.isArray(exerciseDatabase)) return exerciseDatabase; } catch (e) {}
    try { if (Array.isArray(window.exerciseDatabase)) return window.exerciseDatabase; } catch (e) {}
    return [];
  }

  // Listes déduites du catalogue existant, pour rester cohérent
  function muscles() {
    var s = {};
    db().forEach(function (e) { if (e && e.muscle) s[e.muscle] = 1; });
    return Object.keys(s).sort();
  }
  function equipements() {
    var s = { 'Poids du corps': 1 };
    db().forEach(function (e) { (e && e.equipment ? e.equipment : []).forEach(function (q) { if (q) s[q] = 1; }); });
    return Object.keys(s).sort();
  }

  // ── Injection dans le catalogue ──
  var injectes = [];
  function injecter() {
    var base = db();
    if (!base.length) return;
    // Retire les précédents (changement de profil)
    injectes.forEach(function (ex) {
      var i = base.indexOf(ex);
      if (i >= 0) base.splice(i, 1);
    });
    injectes = [];
    lire().forEach(function (c) {
      var ex = {
        name: c.name,
        muscle: c.muscle,
        secondaryMuscles: c.secondaryMuscles || [],
        difficulty: c.difficulty || 'Intermédiaire',
        type: 'exercise',
        position: c.position || 'debout',
        equipment: c.equipment && c.equipment.length ? c.equipment : ['Poids du corps'],
        description: c.description || 'Exercice personnalisé.',
        instructions: c.instructions || [],
        tips: c.tips || '',
        duration: 45,
        custom: true,
        customId: c.id,
        image: c.image || null
      };
      base.push(ex);
      injectes.push(ex);
    });
  }

  // ── Compression de la photo ──
  function compresser(file, cb) {
    try {
      var reader = new FileReader();
      reader.onload = function (ev) {
        var img = new Image();
        img.onload = function () {
          try {
            var w = img.width, h = img.height;
            var ratio = Math.min(1, MAX_PX / Math.max(w, h));
            var cw = Math.max(1, Math.round(w * ratio));
            var ch = Math.max(1, Math.round(h * ratio));
            var cv = document.createElement('canvas');
            cv.width = cw; cv.height = ch;
            cv.getContext('2d').drawImage(img, 0, 0, cw, ch);
            cb(cv.toDataURL('image/jpeg', QUALITE));
          } catch (e) { cb(null); }
        };
        img.onerror = function () { cb(null); };
        img.src = ev.target.result;
      };
      reader.onerror = function () { cb(null); };
      reader.readAsDataURL(file);
    } catch (e) { cb(null); }
  }

  // ── État du formulaire ──
  var form = { nom: '', primaire: '', secondaires: [], equipement: [], difficulte: 'Intermédiaire', image: null, editId: null };

  function reset() {
    form = { nom: '', primaire: '', secondaires: [], equipement: [], difficulte: 'Intermédiaire', image: null, editId: null };
  }

  function chip(txt, actif, onclick, couleur) {
    var c = couleur || '#22d3ee';
    return '<button onclick="' + onclick + '" style="padding:5px 10px;border-radius:99px;cursor:pointer;' +
      'font-family:inherit;font-size:0.72em;font-weight:700;' +
      'background:' + (actif ? c + '22' : 'rgba(255,255,255,0.04)') + ';' +
      'border:1px solid ' + (actif ? c + '88' : 'rgba(255,255,255,0.1)') + ';' +
      'color:' + (actif ? c : '#94a3b8') + ';">' + esc(txt) + '</button>';
  }

  function ouvrir(editId) {
    reset();
    if (editId) {
      var e = lire().filter(function (x) { return x.id === editId; })[0];
      if (e) {
        form = {
          nom: e.name, primaire: e.muscle, secondaires: (e.secondaryMuscles || []).slice(),
          equipement: (e.equipment || []).slice(), difficulte: e.difficulty || 'Intermédiaire',
          image: e.image || null, editId: e.id
        };
      }
    }
    rendre();
  }

  function rendre() {
    var old = document.getElementById('awakCustomExModal');
    if (old) old.remove();

    var mus = muscles();
    var eq = equipements();

    var primaires = mus.map(function (m) {
      return chip(m, form.primaire === m, "AwakCustomEx.setPrimaire('" + attr(m).replace(/'/g, "\\'") + "')", '#4ade80');
    }).join('');

    var secondaires = mus.filter(function (m) { return m !== form.primaire; }).map(function (m) {
      return chip(m, form.secondaires.indexOf(m) >= 0, "AwakCustomEx.toggleSecondaire('" + attr(m).replace(/'/g, "\\'") + "')", '#a855f7');
    }).join('');

    var equipChips = eq.map(function (q) {
      return chip(q, form.equipement.indexOf(q) >= 0, "AwakCustomEx.toggleEquip('" + attr(q).replace(/'/g, "\\'") + "')", '#60a8f0');
    }).join('');

    var diffChips = ['Débutant', 'Intermédiaire', 'Avancé'].map(function (d) {
      return chip(d, form.difficulte === d, "AwakCustomEx.setDifficulte('" + d + "')", '#fbbf24');
    }).join('');

    var apercu = form.image
      ? '<div style="position:relative;">' +
          '<img src="' + form.image + '" style="width:100%;max-height:170px;object-fit:cover;border-radius:12px;display:block;">' +
          '<button onclick="AwakCustomEx.retirerImage()" style="position:absolute;top:8px;right:8px;' +
            'background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.2);color:#fca5a5;border-radius:8px;' +
            'width:30px;height:30px;min-height:auto;cursor:pointer;font-weight:900;line-height:1;">×</button>' +
        '</div>'
      : '<label style="display:flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;' +
          'padding:18px;border:1.5px dashed rgba(34,211,238,0.35);border-radius:12px;' +
          'background:rgba(34,211,238,0.04);color:#67e8f9;font-size:0.8em;font-weight:700;">' +
          '📷 Ajouter une photo' +
          '<input type="file" accept="image/*" onchange="AwakCustomEx.choisirImage(this)" style="display:none;">' +
        '</label>';

    var modal = document.createElement('div');
    modal.id = 'awakCustomExModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:10250;background:rgba(0,0,0,0.94);' +
      'backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:16px 12px;';
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });

    modal.innerHTML =
      '<div style="width:100%;max-width:540px;background:#0F1014;border-radius:18px;max-height:88vh;' +
        'display:flex;flex-direction:column;border:1px solid rgba(34,211,238,0.3);' +
        'border-top:2px solid #22d3ee;box-shadow:0 24px 60px rgba(0,0,0,0.7);overflow:hidden;">' +
        '<div style="padding:14px 18px 11px;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,0.07);' +
          'display:flex;align-items:center;gap:10px;">' +
          '<span style="font-size:1.3em;flex-shrink:0;">✎</span>' +
          '<div style="min-width:0;flex:1;">' +
            '<div style="font-size:0.56em;letter-spacing:2px;color:#22d3ee;font-weight:900;">CATALOGUE</div>' +
            '<div style="font-size:0.98em;font-weight:900;color:#fff;">' +
              (form.editId ? 'Modifier l\'exercice' : 'Créer un exercice') + '</div>' +
          '</div>' +
          '<button onclick="document.getElementById(\'awakCustomExModal\').remove()" ' +
            'style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#94a3b8;' +
            'border-radius:10px;width:34px;height:34px;min-height:auto;font-size:1.1em;font-weight:800;' +
            'cursor:pointer;flex-shrink:0;line-height:1;">×</button>' +
        '</div>' +

        '<div style="flex:1;overflow-y:auto;padding:15px 18px 18px;-webkit-overflow-scrolling:touch;">' +
          '<div style="font-size:0.58em;letter-spacing:1.6px;color:#64748b;font-weight:900;margin-bottom:6px;">NOM DE L\'EXERCICE</div>' +
          '<input type="text" id="awakCxNom" value="' + attr(form.nom) + '" maxlength="46" autocomplete="off" ' +
            'placeholder="Ex. Tirage horizontal à la sangle" oninput="AwakCustomEx.setNom(this.value)" ' +
            'style="width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(34,211,238,0.3);' +
            'color:#e8f0f8;border-radius:11px;padding:11px 13px;font-size:0.9em;font-weight:700;' +
            'font-family:inherit;box-sizing:border-box;">' +
          '<div id="awakCxErr" style="display:none;color:#f87171;font-size:0.74em;font-weight:700;margin-top:6px;"></div>' +

          '<div style="font-size:0.58em;letter-spacing:1.6px;color:#4ade80;font-weight:900;margin:16px 0 7px;">MUSCLE PRINCIPAL <span style="color:#64748b;">· obligatoire</span></div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;">' + primaires + '</div>' +

          '<div style="font-size:0.58em;letter-spacing:1.6px;color:#a855f7;font-weight:900;margin:16px 0 7px;">MUSCLES SECONDAIRES <span style="color:#64748b;">· facultatif</span></div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;">' + (secondaires || '<span style="font-size:0.75em;color:#64748b;">Choisis d\'abord un muscle principal.</span>') + '</div>' +

          '<div style="font-size:0.58em;letter-spacing:1.6px;color:#60a8f0;font-weight:900;margin:16px 0 7px;">ÉQUIPEMENT</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;">' + equipChips + '</div>' +

          '<div style="font-size:0.58em;letter-spacing:1.6px;color:#fbbf24;font-weight:900;margin:16px 0 7px;">DIFFICULTÉ</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;">' + diffChips + '</div>' +

          '<div style="font-size:0.58em;letter-spacing:1.6px;color:#64748b;font-weight:900;margin:16px 0 7px;">PHOTO <span style="color:#475569;">· facultatif</span></div>' +
          apercu +

          '<button onclick="AwakCustomEx.enregistrer()" ' +
            'style="width:100%;margin-top:20px;padding:14px;border-radius:13px;border:none;' +
            'background:linear-gradient(135deg,#22d3ee,#0891b2);color:#04121f;font-weight:900;' +
            'font-size:0.92em;cursor:pointer;font-family:inherit;">' +
            (form.editId ? 'Enregistrer les modifications' : 'Créer l\'exercice') + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    var champ = document.getElementById('awakCxNom');
    if (champ && !form.editId) setTimeout(function () { try { champ.focus(); } catch (e) {} }, 220);
  }

  // Re-rendu en conservant la saisie et la position de défilement
  function rafraichir() {
    var m = document.getElementById('awakCustomExModal');
    var sc = 0;
    if (m) {
      var body = m.querySelector('div > div:nth-child(2)');
      if (body) sc = body.scrollTop;
      m.remove();
    }
    rendre();
    var m2 = document.getElementById('awakCustomExModal');
    if (m2 && sc) {
      var b2 = m2.querySelector('div > div:nth-child(2)');
      if (b2) b2.scrollTop = sc;
    }
  }

  var API = {};

  API.setNom = function (v) { form.nom = v || ''; };          // pas de re-rendu : garde le focus
  API.setPrimaire = function (m) {
    form.primaire = m;
    // un muscle ne peut pas être à la fois principal et secondaire
    form.secondaires = form.secondaires.filter(function (x) { return x !== m; });
    rafraichir();
  };
  API.toggleSecondaire = function (m) {
    var i = form.secondaires.indexOf(m);
    if (i >= 0) form.secondaires.splice(i, 1); else form.secondaires.push(m);
    rafraichir();
  };
  API.toggleEquip = function (q) {
    var i = form.equipement.indexOf(q);
    if (i >= 0) form.equipement.splice(i, 1); else form.equipement.push(q);
    rafraichir();
  };
  API.setDifficulte = function (d) { form.difficulte = d; rafraichir(); };
  API.retirerImage = function () { form.image = null; rafraichir(); };

  API.choisirImage = function (input) {
    var f = input && input.files && input.files[0];
    if (!f) return;
    if (typeof window.showToast === 'function') window.showToast('📷 Traitement de la photo…', 'info', 1500);
    compresser(f, function (dataUrl) {
      if (!dataUrl) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ Photo illisible', 'error', 3000);
        return;
      }
      form.image = dataUrl;
      rafraichir();
    });
  };

  function erreur(msg) {
    var el = document.getElementById('awakCxErr');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
    if (typeof window.showToast === 'function') window.showToast('⚠️ ' + msg, 'error', 3000);
  }

  API.enregistrer = function () {
    var nom = (form.nom || '').trim();
    if (!nom) return erreur('Donne un nom à ton exercice.');
    if (!form.primaire) return erreur('Choisis le muscle principal.');

    // Doublon ? (catalogue complet, insensible à la casse)
    var existe = db().some(function (e) {
      return e && e.name && e.name.toLowerCase() === nom.toLowerCase() &&
             (!form.editId || e.customId !== form.editId);
    });
    if (existe) return erreur('Un exercice porte déjà ce nom.');

    var liste = lire();
    var obj = {
      id: form.editId || ('cx_' + Date.now() + '_' + Math.floor(Math.random() * 1000)),
      name: nom,
      muscle: form.primaire,
      secondaryMuscles: form.secondaires.slice(),
      equipment: form.equipement.length ? form.equipement.slice() : ['Poids du corps'],
      difficulty: form.difficulte,
      image: form.image || null,
      cree: Date.now()
    };

    if (form.editId) {
      var i = liste.findIndex(function (x) { return x.id === form.editId; });
      if (i >= 0) liste[i] = obj; else liste.push(obj);
    } else liste.push(obj);

    if (!ecrire(liste)) {
      // 🛟 Quota dépassé : on réessaie SANS la photo plutôt que de tout perdre.
      var sansImage = liste.map(function (x) {
        return (x.id === obj.id) ? Object.assign({}, x, { image: null }) : x;
      });
      if (ecrire(sansImage)) {
        injecter();
        if (typeof window.showToast === 'function') {
          window.showToast('✓ Exercice créé, mais la photo n\'a pas pu être enregistrée (mémoire pleine).', 'info', 5000);
        }
      } else {
        return erreur('Mémoire pleine : impossible d\'enregistrer.');
      }
    } else {
      injecter();
      if (typeof window.showToast === 'function') {
        window.showToast(form.editId ? '✓ Exercice modifié' : '✓ « ' + nom +' » ajouté au catalogue', 'success', 2600);
      }
    }

    var m = document.getElementById('awakCustomExModal');
    if (m) m.remove();
    // Rafraîchit l'atelier de routine s'il est ouvert
    try { if (window.AwakBuilder && window.AwakBuilder.refresh) window.AwakBuilder.refresh(false); } catch (e) {}
  };

  API.supprimer = function (id) {
    var liste = lire().filter(function (x) { return x.id !== id; });
    ecrire(liste);
    injecter();
    if (typeof window.showToast === 'function') window.showToast('🗑️ Exercice supprimé', 'success', 2000);
    try { if (window.AwakBuilder && window.AwakBuilder.refresh) window.AwakBuilder.refresh(false); } catch (e) {}
  };

  API.liste = lire;
  API.injecter = injecter;
  API.ouvrir = ouvrir;

  window.AwakCustomEx = API;
  window.awakCreerExercice = function () { ouvrir(null); };

  // Injection au chargement (et après un changement de profil)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injecter);
  } else {
    injecter();
  }
})();
