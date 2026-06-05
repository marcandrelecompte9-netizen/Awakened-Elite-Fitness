// ═══════════════════════════════════════════════════════════════════
// Awakened — Standards de Force (Force Réelle / Percentiles)
// ═══════════════════════════════════════════════════════════════════
// Ratios exprimés en MULTIPLES DU POIDS DE CORPS pour un 1RM.
// Basés sur les références publiques du domaine (type Strength Level / ExRx).
// 5 niveaux : Débutant, Novice, Intermédiaire, Avancé, Élite.
// Le ratio indique le SEUIL D'ENTRÉE de chaque niveau.
// ═══════════════════════════════════════════════════════════════════
(function() {
'use strict';

// Pour chaque exercice : seuils de ratio (1RM / poids de corps) par sexe.
// L'ordre = [Débutant, Novice, Intermédiaire, Avancé, Élite]
const STRENGTH_STANDARDS = {
    'Développé couché': {
        homme:  [0.50, 0.75, 1.10, 1.50, 2.00],
        femme:  [0.35, 0.50, 0.75, 1.00, 1.40]
    },
    'Squat': {
        homme:  [0.75, 1.25, 1.50, 2.00, 2.75],
        femme:  [0.50, 0.75, 1.25, 1.50, 2.00]
    },
    'Soulevé de terre': {
        homme:  [1.00, 1.50, 2.00, 2.50, 3.25],
        femme:  [0.50, 1.00, 1.25, 1.75, 2.50]
    },
    'Tractions': {
        // Pour tractions : ratio = (poids corps + charge ajoutée) / poids corps
        homme:  [1.00, 1.15, 1.40, 1.75, 2.20],
        femme:  [0.55, 0.75, 1.00, 1.30, 1.80]
    },
    'Développé militaire': {
        homme:  [0.35, 0.55, 0.80, 1.10, 1.45],
        femme:  [0.20, 0.35, 0.55, 0.75, 1.05]
    }
};

const LEVEL_NAMES = ['Débutant', 'Novice', 'Intermédiaire', 'Avancé', 'Élite'];

// Couleurs cyberpunk par niveau (du plus bas au plus élevé)
const LEVEL_COLORS = ['#60a5fa', '#4ade80', '#fbbf24', '#f59e0b', '#a855f7'];

// Formule Epley pour estimer le 1RM depuis charge × reps
function estimate1RM(weight, reps) {
    if (reps <= 1) return weight;
    return Math.round(weight * (1 + reps / 30));
}

// Calcule le niveau + le percentile estimé
// Retourne { ratio, levelIndex, levelName, color, percentile, nextThresholdKg }
function computeStrengthLevel(exercise, sex, oneRM, bodyweight) {
    const std = STRENGTH_STANDARDS[exercise];
    if (!std || !std[sex] || bodyweight <= 0) return null;
    const thresholds = std[sex];
    const ratio = oneRM / bodyweight;

    // Déterminer le niveau atteint
    let levelIndex = -1;
    for (let i = 0; i < thresholds.length; i++) {
        if (ratio >= thresholds[i]) levelIndex = i;
    }

    // Percentile estimé via interpolation entre les seuils.
    // On considère que Débutant ≈ 5e percentile, Novice ≈ 20e,
    // Intermédiaire ≈ 50e, Avancé ≈ 80e, Élite ≈ 95e.
    const percentilePoints = [5, 20, 50, 80, 95];
    let percentile;
    if (ratio < thresholds[0]) {
        // Sous le seuil débutant : interpolation 0 → 5
        percentile = Math.round((ratio / thresholds[0]) * 5);
    } else if (ratio >= thresholds[thresholds.length - 1]) {
        // Au-delà de l'élite : plafonné à 99
        percentile = 99;
    } else {
        // Entre deux seuils
        for (let i = 0; i < thresholds.length - 1; i++) {
            if (ratio >= thresholds[i] && ratio < thresholds[i + 1]) {
                const frac = (ratio - thresholds[i]) / (thresholds[i + 1] - thresholds[i]);
                percentile = Math.round(percentilePoints[i] + frac * (percentilePoints[i + 1] - percentilePoints[i]));
                break;
            }
        }
    }
    percentile = Math.max(1, Math.min(99, percentile));

    // Prochain palier (charge en kg pour atteindre le niveau suivant)
    let nextThresholdKg = null;
    let nextLevelName = null;
    if (levelIndex < thresholds.length - 1) {
        const nextIdx = Math.max(0, levelIndex + 1);
        nextThresholdKg = Math.ceil(thresholds[nextIdx] * bodyweight);
        nextLevelName = LEVEL_NAMES[nextIdx];
    }

    return {
        ratio: Math.round(ratio * 100) / 100,
        levelIndex,
        levelName: levelIndex >= 0 ? LEVEL_NAMES[levelIndex] : 'Sous-débutant',
        color: levelIndex >= 0 ? LEVEL_COLORS[levelIndex] : '#94a3b8',
        percentile,
        nextThresholdKg,
        nextLevelName,
        thresholds: thresholds.map(t => Math.ceil(t * bodyweight))
    };
}

window.STRENGTH_STANDARDS  = STRENGTH_STANDARDS;
window.STRENGTH_LEVEL_NAMES = LEVEL_NAMES;
window.STRENGTH_LEVEL_COLORS = LEVEL_COLORS;
window.estimate1RM          = estimate1RM;
window.computeStrengthLevel = computeStrengthLevel;

})();
