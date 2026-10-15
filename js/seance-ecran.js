// v1369 — Écran de séance : mise en page
// Appelé par startExercise() (app.js) à chaque exercice. Ne touche PAS au
// déroulement (séries, minuteurs, superset) : seulement à l'affichage.
//  · #exerciseView[data-mode] = reps | timer → le CSS réduit l'image en mode
//    répétitions pour que la grille des séries soit visible tout de suite ;
//    un toucher sur l'image l'agrandit (classe awk-img-grande).
//  · ligne « Ensuite : … » sous le titre (le bloc d'origine est masqué sur mobile).
//  · « Quitter la séance » ajouté au menu « ⋯ ».
(function () {
  'use strict';

  function prochain(workout, idx) {
    if (!workout || !Array.isArray(workout.exercises)) return null;
    for (var i = idx + 1; i < workout.exercises.length; i++) {
      var e = workout.exercises[i];
      if (e && !e.isRest && !e.isInfo) return e;
    }
    return null;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function maj(ex, workout, idx) {
    var vue = document.getElementById('exerciseView');
    if (!vue || !ex) return;
    var mode = ex.isRest ? 'rest' : ex.isInfo ? 'info' : (ex.mode === 'reps' ? 'reps' : 'timer');
    vue.setAttribute('data-mode', mode);
    vue.classList.remove('awk-img-grande');

    // « Ensuite : … »
    var chip = document.getElementById('repsRangeChip');
    var hote = document.getElementById('awakEnsuite');
    if (!hote && chip && chip.parentNode) {
      hote = document.createElement('div');
      hote.id = 'awakEnsuite';
      chip.parentNode.insertBefore(hote, chip.nextSibling);
    }
    if (hote) {
      var n = prochain(workout, idx);
      var nom = n ? (n._baseName || n.name || '') : '';
      try { if (n && typeof window.awakNom === 'function') nom = window.awakNom(nom) || nom; } catch (e) {}
      hote.innerHTML = n ? '<span class="awk-ens-lbl">Ensuite</span> ' + esc(nom) : '<span class="awk-ens-lbl">Dernier exercice</span>';
      hote.style.display = (mode === 'reps' || mode === 'timer') ? '' : 'none';
    }
    placerBarre();
    brancherImage();
    brancherMenu();
  }

  // La barre Préc./Remplacer/Suivant est « sticky » : elle ne peut coller que
  // dans son PARENT. Son bloc d'origine ne fait que ~110 px → on la remonte
  // d'un niveau (juste après ce bloc), dans la zone de l'exercice.
  function placerBarre() {
    var barre = document.getElementById('awakBarreActions');
    if (!barre || barre.getAttribute('data-placee')) return;
    var bloc = barre.parentElement;
    if (!bloc || !bloc.parentElement) return;
    bloc.parentElement.insertBefore(barre, bloc.nextSibling);
    barre.setAttribute('data-placee', '1');
  }

  // Toucher l'image = l'agrandir / la réduire (mode répétitions)
  var imgBranchee = false;
  function brancherImage() {
    if (imgBranchee) return;
    var f = document.getElementById('exerciseVisualFrame');
    if (!f) return;
    imgBranchee = true;
    f.addEventListener('click', function (e) {
      var vue = document.getElementById('exerciseView');
      if (!vue || vue.getAttribute('data-mode') !== 'reps') return;
      if (e.target.closest('button')) return;
      vue.classList.toggle('awk-img-grande');
    });
  }

  // « Quitter la séance » dans le menu ⋯ (le bouton du haut devient discret)
  function brancherMenu() {
    var panel = document.getElementById('workoutOptionsPanel');
    if (!panel || document.getElementById('awakMenuQuitter')) return;
    var b = document.createElement('button');
    b.id = 'awakMenuQuitter';
    b.type = 'button';
    b.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg><span>Quitter la séance</span>';
    b.onclick = function () { panel.style.display = 'none'; if (typeof window.quitWorkout === 'function') window.quitWorkout(); };
    panel.appendChild(b);
  }

  window.AwakSeanceEcran = { maj: maj };
})();
