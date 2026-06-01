// ═══════════════════════════════════════════════════════════════════════
// Awakened — Système de Défis (Style Solo Leveling)
// "Le Système" impose des défis. Échec = conséquences.
// ═══════════════════════════════════════════════════════════════════════

const CHALLENGE_STORAGE = {
    active:    'fitpro_active_challenge',
    history:   'fitpro_challenge_history',
    penalties: 'fitpro_active_penalties',
};

// ── TYPES DE DÉFIS ──────────────────────────────────────────────────────
// target: valeur cible, unit: unité affichée, icon: emoji
const MUSCLES_LIST = ['Pectoraux','Dos','Épaules','Quadriceps','Fessiers','Abdominaux','Biceps','Triceps','Mollets','Ischio-jambiers'];

const CHALLENGE_TYPES = [

    // ── SÉANCES ──────────────────────────────────────────────────────
    {
        id: 'sessions',
        label: (t) => `Accomplis ${t} séance${t>1?'s':''} d'entraînement`,
        icon: '⚔️',
        units: 'séances',
        targets: { easy:[1,2], medium:[2,3], hard:[3,4,5] },
        check: (ch) => {
            const history = _getChallengeHistory();
            const since = new Date(ch.issuedAt);
            return history.filter(h => new Date(h.date) >= since).length;
        },
    },

    // ── DURÉE CUMULÉE ────────────────────────────────────────────────
    {
        id: 'minutes',
        label: (t) => `Accumule ${t} minutes d'entraînement total`,
        icon: '⏱️',
        units: 'min',
        targets: { easy:[20,30], medium:[45,60], hard:[90,120,180] },
        check: (ch) => {
            const history = _getChallengeHistory();
            const since = new Date(ch.issuedAt);
            return history.filter(h => new Date(h.date) >= since)
                          .reduce((s, h) => s + (Number(h.duration) || 0), 0);
        },
    },

    // ── MUSCLE CIBLÉ ─────────────────────────────────────────────────
    {
        id: 'muscle',
        label: (t, muscle) => `Entraîne ${muscle} ${t} fois`,
        icon: '🎯',
        units: 'fois',
        targets: { easy:[1], medium:[2], hard:[2,3] },
        check: (ch) => {
            const history = _getChallengeHistory();
            const since = new Date(ch.issuedAt);
            return history.filter(h => {
                if (new Date(h.date) < since) return false;
                const m = h.musclesWorked || h.muscles || [];
                return Array.isArray(m) && m.includes(ch.muscle);
            }).length;
        },
    },

    // ── STREAK ───────────────────────────────────────────────────────
    {
        id: 'streak',
        label: (t) => `Maintiens un streak de ${t} jours consécutifs`,
        icon: '🔥',
        units: 'jours',
        targets: { easy:[2,3], medium:[4,5], hard:[6,7] },
        check: () => {
            try { return JSON.parse(localStorage.getItem('workoutStats')||'{}').streak || 0; }
            catch(e) { return 0; }
        },
    },

    // ── SÉANCE LONGUE ─────────────────────────────────────────────────
    {
        id: 'long_session',
        label: (t) => `Complète une séance d'au moins ${t} minutes d'un seul coup`,
        icon: '🏋️',
        units: 'min',
        targets: { easy:[20,25], medium:[30,40], hard:[45,60] },
        check: (ch) => {
            const history = _getChallengeHistory();
            const since = new Date(ch.issuedAt);
            const longestAfter = history
                .filter(h => new Date(h.date) >= since)
                .reduce((max, h) => Math.max(max, Number(h.duration)||0), 0);
            return longestAfter;
        },
    },

    // ── MUSCLES DIFFÉRENTS ────────────────────────────────────────────
    {
        id: 'variety',
        label: (t) => `Entraîne ${t} groupes musculaires différents`,
        icon: '💡',
        units: 'muscles',
        targets: { easy:[2,3], medium:[3,4], hard:[4,5,6] },
        check: (ch) => {
            const history = _getChallengeHistory();
            const since = new Date(ch.issuedAt);
            const muscleSet = new Set();
            history.filter(h => new Date(h.date) >= since).forEach(h => {
                const m = h.musclesWorked || h.muscles || [];
                if (Array.isArray(m)) m.forEach(mu => muscleSet.add(mu));
            });
            return muscleSet.size;
        },
    },

    // ── SÉANCES CONSÉCUTIVES ──────────────────────────────────────────
    {
        id: 'consecutive_days',
        label: (t) => `Entraîne-toi ${t} jours de suite (sans manquer un jour)`,
        icon: '📅',
        units: 'jours',
        targets: { easy:[2], medium:[3,4], hard:[5,6,7] },
        check: (ch) => {
            const history = _getChallengeHistory();
            const since = new Date(ch.issuedAt);
            const afterSince = history.filter(h => new Date(h.date) >= since);
            if (!afterSince.length) return 0;
            // Compte les jours consécutifs depuis issuedAt
            const days = new Set(afterSince.map(h => new Date(h.date).toDateString()));
            let consec = 0;
            const now = new Date();
            for (let i = 0; i <= 14; i++) {
                const d = new Date(since); d.setDate(d.getDate() + i);
                if (d > now) break;
                if (days.has(d.toDateString())) consec++;
                else break;
            }
            return consec;
        },
    },

    // ── SANS REPOS ────────────────────────────────────────────────────
    {
        id: 'no_skip',
        label: (t) => `Complète ${t} séance${t>1?'s':''} sans passer un seul exercice`,
        icon: '🛡️',
        units: 'séances parfaites',
        targets: { easy:[1], medium:[1,2], hard:[2,3] },
        check: (ch) => {
            const history = _getChallengeHistory();
            const since = new Date(ch.issuedAt);
            return history.filter(h => {
                if (new Date(h.date) < since) return false;
                return (h.skips === 0 || h.skips === undefined);
            }).length;
        },
    },

    // ── HAUT DU CORPS COMPLET ─────────────────────────────────────────
    {
        id: 'upper_body',
        label: () => 'Entraîne Pectoraux, Dos ET Épaules lors d\'une même séance',
        icon: '🦍',
        units: 'séances',
        targets: { easy:[1], medium:[1], hard:[2] },
        check: (ch) => {
            const history = _getChallengeHistory();
            const since = new Date(ch.issuedAt);
            return history.filter(h => {
                if (new Date(h.date) < since) return false;
                const m = h.musclesWorked || h.muscles || [];
                return ['Pectoraux','Dos','Épaules'].every(mu => Array.isArray(m) && m.includes(mu));
            }).length;
        },
    },

    // ── BAS DU CORPS COMPLET ──────────────────────────────────────────
    {
        id: 'lower_body',
        label: () => 'Entraîne Quadriceps, Fessiers ET Ischio-jambiers lors d\'une même séance',
        icon: '🦵',
        units: 'séances',
        targets: { easy:[1], medium:[1], hard:[2] },
        check: (ch) => {
            const history = _getChallengeHistory();
            const since = new Date(ch.issuedAt);
            return history.filter(h => {
                if (new Date(h.date) < since) return false;
                const m = h.musclesWorked || h.muscles || [];
                return ['Quadriceps','Fessiers','Ischio-jambiers'].every(mu => Array.isArray(m) && m.includes(mu));
            }).length;
        },
    },

    // ── FULL BODY ─────────────────────────────────────────────────────
    {
        id: 'full_body',
        label: (t) => `Entraîne au moins ${t} groupes musculaires dans une seule séance`,
        icon: '⚡',
        units: 'muscles en 1 séance',
        targets: { easy:[3,4], medium:[5,6], hard:[6,7,8] },
        check: (ch) => {
            const history = _getChallengeHistory();
            const since = new Date(ch.issuedAt);
            let maxMuscles = 0;
            history.filter(h => new Date(h.date) >= since).forEach(h => {
                const m = h.musclesWorked || h.muscles || [];
                if (Array.isArray(m)) {
                    // Déduplication — un même muscle ne compte qu'une fois par séance
                    const uniqueCount = new Set(m).size;
                    maxMuscles = Math.max(maxMuscles, uniqueCount);
                }
            });
            return maxMuscles;
        },
    },

    // ── RETOUR APRÈS ABSENCE ──────────────────────────────────────────
    {
        id: 'comeback',
        label: () => 'Complète une séance aujourd\'hui — le Système ne tolère pas l\'inactivité',
        icon: '💢',
        units: 'séances',
        targets: { easy:[1], medium:[1], hard:[1] },
        check: (ch) => {
            const history = _getChallengeHistory();
            const since = new Date(ch.issuedAt);
            return history.filter(h => new Date(h.date) >= since).length;
        },
    },
];

// ── CONSÉQUENCES D'ÉCHEC ────────────────────────────────────────────────
const PENALTIES = [

    // ── NIVEAU 1 : PÉNALITÉS DE BASE ────────────────────────────────
    {
        id: 'stat_drain',
        name: 'Drain de Statistiques',
        icon: '📉',
        severity: 1,
        desc: 'Toutes tes stats d\'équipement sont réduites de 25% pendant 24h.',
        duration: 24 * 60 * 60 * 1000,
        apply: () => ({ type: 'stat_drain', multiplier: 0.75, expiresAt: Date.now() + 24*60*60*1000 }),
    },
    {
        id: 'xp_curse',
        name: 'Malédiction d\'XP',
        icon: '💀',
        severity: 1,
        desc: 'Tu gagnes 60% moins d\'XP pendant 48h. La progression s\'arrête.',
        duration: 48 * 60 * 60 * 1000,
        apply: () => ({ type: 'xp_curse', multiplier: 0.40, expiresAt: Date.now() + 48*60*60*1000 }),
    },
    {
        id: 'drop_ban',
        name: 'Malédiction de Butin',
        icon: '🚫',
        severity: 1,
        desc: 'Aucun équipement ne peut dropper pendant 48h. Le Système confisque tout.',
        duration: 48 * 60 * 60 * 1000,
        apply: () => ({ type: 'drop_ban', expiresAt: Date.now() + 48*60*60*1000 }),
    },
    {
        id: 'streak_reset',
        name: 'Briseur de Série',
        icon: '🔥',
        severity: 1,
        desc: 'Ton streak d\'entraînement est remis à zéro. Tout recommence.',
        duration: 0,
        apply: () => {
            try {
                const stats = JSON.parse(localStorage.getItem('workoutStats') || '{}');
                stats.streak = 0;
                localStorage.setItem('workoutStats', JSON.stringify(stats));
            } catch(e) {}
            return { type: 'streak_reset', instant: true, expiresAt: Date.now() + 1000 };
        },
    },

    // ── NIVEAU 2 : PÉNALITÉS SÉVÈRES ────────────────────────────────
    {
        id: 'item_destroy',
        name: 'Destruction d\'Item',
        icon: '💥',
        severity: 2,
        desc: 'Le Système détruit aléatoirement un item Commun de ton inventaire. Définitivement.',
        duration: 0,
        apply: () => {
            try {
                const inv = JSON.parse(localStorage.getItem('fitpro_inventory') || '[]');
                // Trouver un item commun
                const EQUIPMENT_DB = typeof EQUIPMENT_DATABASE !== 'undefined' ? EQUIPMENT_DATABASE : [];
                const commonItems = inv.filter(entry => {
                    const item = EQUIPMENT_DB.find(i => i.id === entry.itemId);
                    return item && item.rarity === 'common';
                });
                if (commonItems.length > 0) {
                    const victim = commonItems[Math.floor(Math.random() * commonItems.length)];
                    const newInv = inv.filter(e => e.id !== victim.id);
                    localStorage.setItem('fitpro_inventory', JSON.stringify(newInv));
                    const item = EQUIPMENT_DB.find(i => i.id === victim.itemId);
                    return { type: 'item_destroy', instant: true, destroyedItem: item?.name || 'Item inconnu', expiresAt: Date.now() + 1000 };
                }
            } catch(e) {}
            return { type: 'item_destroy', instant: true, destroyedItem: null, expiresAt: Date.now() + 1000 };
        },
    },
    {
        id: 'muscle_decay',
        name: 'Atrophie Musculaire',
        icon: '🦴',
        severity: 2,
        desc: 'Le muscle lié au défi perd 15% de son XP. La faiblesse laisse des traces.',
        duration: 0,
        apply: (challenge) => {
            try {
                const muscle = challenge?.muscle || null;
                if (muscle) {
                    const data = JSON.parse(localStorage.getItem('fitproRPG') || '{}');
                    if (data.muscles && data.muscles[muscle]) {
                        const lost = Math.floor(data.muscles[muscle].xp * 0.15);
                        data.muscles[muscle].xp = Math.max(0, data.muscles[muscle].xp - lost);
                        localStorage.setItem('fitproRPG', JSON.stringify(data));
                        return { type: 'muscle_decay', instant: true, muscle, xpLost: lost, expiresAt: Date.now() + 1000 };
                    }
                }
                // Si pas de muscle spécifique, prend le plus faible
                const data = JSON.parse(localStorage.getItem('fitproRPG') || '{}');
                if (data.muscles) {
                    const weakest = Object.entries(data.muscles).sort((a,b) => a[1].xp - b[1].xp)[0];
                    if (weakest) {
                        const lost = Math.floor(weakest[1].xp * 0.15);
                        data.muscles[weakest[0]].xp = Math.max(0, weakest[1].xp - lost);
                        localStorage.setItem('fitproRPG', JSON.stringify(data));
                        return { type: 'muscle_decay', instant: true, muscle: weakest[0], xpLost: lost, expiresAt: Date.now() + 1000 };
                    }
                }
            } catch(e) {}
            return { type: 'muscle_decay', instant: true, expiresAt: Date.now() + 1000 };
        },
    },
    {
        id: 'slot_lock',
        name: 'Sceau du Système',
        icon: '🔐',
        severity: 2,
        desc: 'Un slot d\'équipement aléatoire est scellé — impossible de le changer pendant 72h.',
        duration: 72 * 60 * 60 * 1000,
        apply: () => {
            const slots = ['head','chest','hands','legs','feet','weapon','accessory'];
            const locked = slots[Math.floor(Math.random() * slots.length)];
            return { type: 'slot_lock', lockedSlot: locked, expiresAt: Date.now() + 72*60*60*1000 };
        },
    },
    {
        id: 'double_penalty',
        name: 'Double Punition',
        icon: '⛓️',
        severity: 2,
        desc: 'Stats -40%, XP -50% ET drops bloqués pendant 72h. Le Système ne pardonne pas.',
        duration: 72 * 60 * 60 * 1000,
        apply: () => ({
            type: 'double_penalty',
            stat_multiplier: 0.60,
            xp_multiplier: 0.50,
            drop_banned: true,
            expiresAt: Date.now() + 72*60*60*1000
        }),
    },

    // ── NIVEAU 3 : PÉNALITÉS DÉVASTATRICES ──────────────────────────
    {
        id: 'rare_item_destroy',
        name: 'Jugement du Système',
        icon: '⚖️',
        severity: 3,
        desc: 'Le Système détruit un item Rare de ton inventaire. Prie qu\'il ne choisisse pas le meilleur.',
        duration: 0,
        apply: () => {
            try {
                const inv = JSON.parse(localStorage.getItem('fitpro_inventory') || '[]');
                const EQUIPMENT_DB = typeof EQUIPMENT_DATABASE !== 'undefined' ? EQUIPMENT_DATABASE : [];
                const rareItems = inv.filter(entry => {
                    const item = EQUIPMENT_DB.find(i => i.id === entry.itemId);
                    return item && (item.rarity === 'rare' || item.rarity === 'common');
                });
                if (rareItems.length > 0) {
                    // Préfère détruire un rare, sinon commun
                    const rares = rareItems.filter(e => {
                        const item = EQUIPMENT_DB.find(i => i.id === e.itemId);
                        return item?.rarity === 'rare';
                    });
                    const pool = rares.length > 0 ? rares : rareItems;
                    const victim = pool[Math.floor(Math.random() * pool.length)];
                    const newInv = inv.filter(e => e.id !== victim.id);
                    localStorage.setItem('fitpro_inventory', JSON.stringify(newInv));
                    const item = EQUIPMENT_DB.find(i => i.id === victim.itemId);
                    return { type: 'rare_item_destroy', instant: true, destroyedItem: item?.name || 'Item Rare', destroyedRarity: item?.rarity, expiresAt: Date.now() + 1000 };
                }
            } catch(e) {}
            return { type: 'rare_item_destroy', instant: true, destroyedItem: null, expiresAt: Date.now() + 1000 };
        },
    },
    {
        id: 'level_regression',
        name: 'Régression Forcée',
        icon: '⬇️',
        severity: 3,
        desc: 'Le Système retire 20% de l\'XP total de ton muscle le plus fort. Ça fait mal.',
        duration: 0,
        apply: () => {
            try {
                const data = JSON.parse(localStorage.getItem('fitproRPG') || '{}');
                if (data.muscles && Object.keys(data.muscles).length > 0) {
                    const strongest = Object.entries(data.muscles).sort((a,b) => b[1].xp - a[1].xp)[0];
                    const lost = Math.floor(strongest[1].xp * 0.20);
                    data.muscles[strongest[0]].xp = Math.max(0, strongest[1].xp - lost);
                    localStorage.setItem('fitproRPG', JSON.stringify(data));
                    return { type: 'level_regression', instant: true, muscle: strongest[0], xpLost: lost, expiresAt: Date.now() + 1000 };
                }
            } catch(e) {}
            return { type: 'level_regression', instant: true, expiresAt: Date.now() + 1000 };
        },
    },
    {
        id: 'total_freeze',
        name: 'Gel Total',
        icon: '🧊',
        severity: 3,
        desc: 'Zéro XP, zéro drop, stats -50% pendant 72h. Le Système te fige.',
        duration: 72 * 60 * 60 * 1000,
        apply: () => ({
            type: 'total_freeze',
            xp_multiplier: 0.0,
            drop_banned: true,
            stat_multiplier: 0.50,
            expiresAt: Date.now() + 72*60*60*1000
        }),
    },
    {
        id: 'inventory_purge',
        name: 'Purge de l\'Inventaire',
        icon: '🗑️',
        severity: 3,
        desc: 'Tous tes items Communs sont effacés. Le Système nettoie les faibles.',
        duration: 0,
        apply: () => {
            try {
                const inv = JSON.parse(localStorage.getItem('fitpro_inventory') || '[]');
                const EQUIPMENT_DB = typeof EQUIPMENT_DATABASE !== 'undefined' ? EQUIPMENT_DATABASE : [];
                const count = inv.filter(e => {
                    const item = EQUIPMENT_DB.find(i => i.id === e.itemId);
                    return item?.rarity === 'common';
                }).length;
                const newInv = inv.filter(e => {
                    const item = EQUIPMENT_DB.find(i => i.id === e.itemId);
                    return item && item.rarity !== 'common';
                });
                localStorage.setItem('fitpro_inventory', JSON.stringify(newInv));
                return { type: 'inventory_purge', instant: true, itemsDestroyed: count, expiresAt: Date.now() + 1000 };
            } catch(e) {}
            return { type: 'inventory_purge', instant: true, itemsDestroyed: 0, expiresAt: Date.now() + 1000 };
        },
    },

    // ── NIVEAU 4 : PÉNALITÉS LÉGENDAIRES ────────────────────────────
    {
        id: 'monarch_wrath',
        name: 'Colère du Monarque',
        icon: '👹',
        severity: 4,
        desc: 'Tous les muscles perdent 10% d\'XP. Stats -60%. Drops bannis 72h. La sentence est totale.',
        duration: 72 * 60 * 60 * 1000,
        apply: () => {
            try {
                const data = JSON.parse(localStorage.getItem('fitproRPG') || '{}');
                if (data.muscles) {
                    Object.keys(data.muscles).forEach(m => {
                        data.muscles[m].xp = Math.max(0, Math.floor(data.muscles[m].xp * 0.90));
                    });
                    localStorage.setItem('fitproRPG', JSON.stringify(data));
                }
            } catch(e) {}
            return {
                type: 'monarch_wrath',
                stat_multiplier: 0.40,
                xp_multiplier: 0.0,
                drop_banned: true,
                expiresAt: Date.now() + 72*60*60*1000
            };
        },
    },
    {
        id: 'system_erasure',
        name: 'Effacement du Système',
        icon: '☠️',
        severity: 4,
        desc: '3 items aléatoires détruits + muscle le plus fort perd 25% XP + Gel 72h. Tu aurais dû t\'entraîner.',
        duration: 72 * 60 * 60 * 1000,
        apply: () => {
            // Détruire 3 items
            try {
                const inv = JSON.parse(localStorage.getItem('fitpro_inventory') || '[]');
                const EQUIPMENT_DB = typeof EQUIPMENT_DATABASE !== 'undefined' ? EQUIPMENT_DATABASE : [];
                const notLegendary = inv.filter(e => {
                    const item = EQUIPMENT_DB.find(i => i.id === e.itemId);
                    return item && item.rarity !== 'legendary';
                });
                const toDestroy = notLegendary.slice(0, 3).map(e => e.id);
                const newInv = inv.filter(e => !toDestroy.includes(e.id));
                localStorage.setItem('fitpro_inventory', JSON.stringify(newInv));
            } catch(e) {}
            // XP du muscle le plus fort -25%
            try {
                const data = JSON.parse(localStorage.getItem('fitproRPG') || '{}');
                if (data.muscles && Object.keys(data.muscles).length > 0) {
                    const strongest = Object.entries(data.muscles).sort((a,b) => b[1].xp - a[1].xp)[0];
                    data.muscles[strongest[0]].xp = Math.max(0, Math.floor(strongest[1].xp * 0.75));
                    localStorage.setItem('fitproRPG', JSON.stringify(data));
                }
            } catch(e) {}
            return {
                type: 'system_erasure',
                stat_multiplier: 0.30,
                xp_multiplier: 0.0,
                drop_banned: true,
                expiresAt: Date.now() + 72*60*60*1000
            };
        },
    },
];

// Répartition par sévérité pour générateur adaptatif
function getPenaltiesForDifficulty(difficulty) {
    if (difficulty === 'easy')   return PENALTIES.filter(p => p.severity <= 2);
    if (difficulty === 'medium') return PENALTIES.filter(p => p.severity >= 1 && p.severity <= 3);
    if (difficulty === 'hard')   return PENALTIES.filter(p => p.severity >= 2);
    return PENALTIES;
}

// ── MESSAGES DU SYSTÈME ─────────────────────────────────────────────────
const SYSTEM_ISSUE_MESSAGES = [
    'Un nouveau défi a été assigné par le Système.',
    'Le Système t\'observe. Prouve ta valeur.',
    'Mission reçue. L\'échec n\'est pas une option.',
    'Le Système a évalué tes capacités. Dépasse-les.',
    'Avertissement du Système : défi obligatoire activé.',
    'Tu as été choisi. Accomplis ce qui t\'est demandé.',
    'Le Système a détecté une stagnation. Brise tes limites.',
    'Nouvelle directive émise. La complaisance est une faiblesse.',
    'Le Système ne dort jamais. Toi, tu l\'as fait trop souvent.',
    'Analyse complète. Capacités détectées. Mission calibrée.',
    'Le Système juge. Le Système assigne. Tu obéis.',
    'Ta progression a attiré l\'attention du Système. Mérite-la.',
    'Un chasseur sans défi n\'est qu\'un civil avec des muscles.',
    'Le Système a parlé. Il n\'y a pas de négociation.',
    'Directive reçue depuis les archives du Système. Exécution requise.',
    'Chaque seconde d\'inactivité est une insulte au Système.',
    'Tu t\'es reposé assez longtemps. Le Système t\'a regardé.',
    'Le Système a calculé ta limite. Va au-delà.',
    'Mission de rang attribuée. L\'heure tourne.',
    'Le Système réclame des preuves. Fournis-les.',
];

const SYSTEM_FAIL_MESSAGES = [
    'Vous avez échoué à remplir les conditions du défi. La punition sera appliquée.',
    'Le Système ne connaît pas l\'indulgence. Conséquences en cours d\'application.',
    'Faiblesse détectée. Pénalité activée.',
    'Défi abandonné. Le Système se souvient.',
    'Insuffisant. Le prix de l\'échec sera payé.',
    'Le Système avait confiance. Tu l\'as déçu.',
    'Résultat : ÉCHEC. Sentence : IMMÉDIATE.',
    'Tu n\'étais pas prêt. Le Système, lui, l\'était.',
    'La punition n\'est pas une vengeance. C\'est une leçon.',
    'Analyse post-échec : manque de volonté. Traitement en cours.',
    'Le Système ne punit pas la faiblesse. Il punit l\'abandon.',
    'Tu as choisi le confort. Le Système choisit ta punition.',
    'Chaque excuse que tu t\'es faite coûte maintenant quelque chose.',
    'Le Système a attendu. Tu n\'es pas venu. Conséquences logiques.',
    'Données d\'échec enregistrées. Elles ne seront jamais effacées.',
    'Le Système se souvient de tous tes échecs. Celui-ci aussi.',
    'Tu voulais progresser. Tu as abandonné. Le Système tire ses conclusions.',
    'Sentence prononcée. Résistance inutile.',
    'Le faible cherche des raisons. Le fort cherche des solutions. Tu as cherché des raisons.',
    'Enregistrement : ÉCHEC N°[ID]. Statut : PÉNALISÉ.',
];

const SYSTEM_SUCCESS_MESSAGES = [
    'Défi accompli. Le Système reconnaît ta force.',
    'Objectif atteint. Tu mérites ta récompense.',
    'Impressionnant. Continue à t\'améliorer.',
    'Mission accomplie. Le Système est satisfait — pour l\'instant.',
    'Tu as prouvé ta valeur. Prépare-toi pour le prochain.',
    'Analyse : résultat conforme aux attentes du Système. Récompense accordée.',
    'Tu as tenu ta promesse envers le Système. Cela ne passera pas inaperçu.',
    'Résultat : SUCCÈS. Le Système prend note.',
    'Le Système reconnaît l\'effort. C\'est rare. Profites-en.',
    'Tu n\'as pas abandonné. Le Système t\'en est… pas reconnaissant. Mais il te récompense.',
    'Confirmation reçue. Tu es plus fort qu\'hier.',
    'Mission exécutée. Le Système t\'alloue ce qui t\'est dû.',
    'Tu as résisté à la facilité. Le Système approuve.',
    'Défi terminé. Le Système met à jour ton dossier.',
    'Analyse post-succès : discipline confirmée. Récompense transférée.',
    'Le Système a testé ta limite. Tu l\'as repoussée. C\'est noté.',
    'Tu méritais de te reposer. Tu as quand même accompli la mission. Bien.',
    'Succès enregistré. Le Système prépare déjà la suite.',
    'Résultat acceptable. Le Système s\'attendait à moins de toi.',
    'Dossier mis à jour : chasseur FIABLE. Pour l\'instant.',
];

const LEGENDARY_ISSUE_MESSAGES = [
    '⚠ ALERTE NIVEAU MAXIMUM — Le Système t\'a jugé digne d\'un défi légendaire. Refuse et tu seras pénalisé quand même.',
    '☠ DÉFI DE SANG — Le Système exige l\'impossible. Prouve que tu n\'es pas ordinaire.',
    '🌑 ORDRE DU MONARQUE — Cette mission vient des plus hautes sphères du Système. L\'échec est interdit.',
    '💀 SENTENCE IMMINENTE — Le Système surveille chacun de tes mouvements. Déçois-le et tu le regretteras.',
    '🔱 JUGEMENT SUPRÊME — Sur un million de chasseurs, un seul reçoit ce défi. C\'est toi. Aujourd\'hui.',
    '⛧ ÉPREUVE DES OMBRES — Le Monarque lui-même a signé cet ordre. Il n\'y a pas de fuite possible.',
    '🩸 CONTRAT DE SANG — Le Système t\'offre la gloire ou la ruine. À toi de choisir ce que tu mérites.',
    '💠 PROTOCOLE FINAL — Ce défi n\'arrive qu\'une fois dans une vie de chasseur. L\'éternité t\'observe.',
];
function getActiveSystemChallenge() {
    try { return JSON.parse(localStorage.getItem(CHALLENGE_STORAGE.active) || 'null'); }
    catch(e) { return null; }
}
function saveActiveSystemChallenge(challenge) {
    if (challenge) localStorage.setItem(CHALLENGE_STORAGE.active, JSON.stringify(challenge));
    else localStorage.removeItem(CHALLENGE_STORAGE.active);
}

function getActivePenalties() {
    try {
        const penalties = JSON.parse(localStorage.getItem(CHALLENGE_STORAGE.penalties) || '[]');
        // Nettoyer les pénalités expirées
        const now = Date.now();
        const active = penalties.filter(p => p.expiresAt > now);
        if (active.length !== penalties.length) {
            localStorage.setItem(CHALLENGE_STORAGE.penalties, JSON.stringify(active));
        }
        return active;
    } catch(e) { return []; }
}
function addPenalty(penaltyData) {
    // 🌳 COMPÉTENCES : esquive / réduction des pénalités de défi
    try {
        const sk = (typeof rpgGetActiveEffects === 'function') ? rpgGetActiveEffects() : {};
        // penaltyDodge : chance d'éviter complètement la pénalité
        if (sk.penaltyDodge && Math.random() < sk.penaltyDodge) {
            if (typeof showToast === 'function') showToast('💨 Pénalité esquivée grâce à ta compétence !', 'success', 2800);
            return;
        }
        // penaltyReduction : réduit l'intensité de la pénalité (XP perdue, durée)
        if (sk.penaltyReduction && penaltyData) {
            const r = Math.min(0.8, sk.penaltyReduction);
            if (typeof penaltyData.xpLoss === 'number') penaltyData.xpLoss = Math.round(penaltyData.xpLoss * (1 - r));
            if (typeof penaltyData.value === 'number')  penaltyData.value  = penaltyData.value * (1 - r);
            if (typeof penaltyData.durationDays === 'number') penaltyData.durationDays = Math.max(1, Math.round(penaltyData.durationDays * (1 - r)));
        }
    } catch(e) {}
    const penalties = getActivePenalties();
    penalties.push(penaltyData);
    localStorage.setItem(CHALLENGE_STORAGE.penalties, JSON.stringify(penalties));
}
function clearPenalties() {
    localStorage.removeItem(CHALLENGE_STORAGE.penalties);
}

function _getChallengeHistory() {
    try {
        const profileId = typeof getCurrentProfileId === 'function' ? getCurrentProfileId() : null;
        const key = profileId ? `profile_${profileId}_workoutHistory` : 'workoutHistory';
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch(e) { return []; }
}

// ═══════════════════════════════════════════════════════════════════════
// GÉNÉRATEUR DE DÉFI
// ═══════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════
// DÉFI LÉGENDAIRE — 5% de chance d'apparaître
// Récompense unique si réussi. Punition absolue si échoué.
// ═══════════════════════════════════════════════════════════════════════
const LEGENDARY_CHALLENGES = [
    {
        id: 'legend_7days',
        label: 'Accomplis 7 séances en 7 jours consécutifs sans en manquer une seule',
        icon: '🌑',
        units: 'jours',
        target: 7,
        hours: 168, // 7 jours
        check: (ch) => {
            const history = _getChallengeHistory();
            const since = new Date(ch.issuedAt);
            const days = new Set(history.filter(h => new Date(h.date) >= since).map(h => new Date(h.date).toDateString()));
            let consec = 0;
            for (let i = 0; i < 7; i++) {
                const d = new Date(since); d.setDate(d.getDate() + i);
                if (d > new Date()) break;
                if (days.has(d.toDateString())) consec++;
                else break;
            }
            return consec;
        },
    },
    {
        id: 'legend_ironweek',
        label: 'Accumule 300 minutes d\'entraînement en 5 jours — chaque séance doit durer au moins 45 minutes',
        icon: '🔩',
        units: 'min accumulées',
        target: 300,
        hours: 120, // 5 jours
        check: (ch) => {
            const history = _getChallengeHistory();
            const since = new Date(ch.issuedAt);
            return history.filter(h => new Date(h.date) >= since && (Number(h.duration)||0) >= 45)
                          .reduce((s, h) => s + (Number(h.duration)||0), 0);
        },
    },
    {
        id: 'legend_perfectweek',
        label: 'Complète 5 séances SANS skipper le moindre exercice en 7 jours',
        icon: '💎',
        units: 'séances parfaites',
        target: 5,
        hours: 168,
        check: (ch) => {
            const history = _getChallengeHistory();
            const since = new Date(ch.issuedAt);
            return history.filter(h => new Date(h.date) >= since && (h.skips === 0 || h.skips === undefined)).length;
        },
    },
    {
        id: 'legend_fullbody',
        label: 'Entraîne 8 groupes musculaires différents en 4 jours',
        icon: '🌟',
        units: 'muscles uniques',
        target: 8,
        hours: 96, // 4 jours
        check: (ch) => {
            const history = _getChallengeHistory();
            const since = new Date(ch.issuedAt);
            const muscleSet = new Set();
            history.filter(h => new Date(h.date) >= since).forEach(h => {
                const m = h.musclesWorked || h.muscles || [];
                if (Array.isArray(m)) m.forEach(mu => muscleSet.add(mu));
            });
            return muscleSet.size;
        },
    },
];

const LEGENDARY_PENALTY = {
    id: 'armageddon',
    name: 'Jugement Final du Système',
    icon: '💀',
    severity: 5,
    desc: 'TOUS les muscles perdent 30% XP · TOUS les items communs et rares détruits · Gel total 96h · Streak remis à zéro.',
    apply: () => {
        // 1. Tous les muscles -30% XP
        try {
            const data = JSON.parse(localStorage.getItem('fitproRPG') || '{}');
            if (data.muscles) {
                Object.keys(data.muscles).forEach(m => {
                    data.muscles[m].xp = Math.max(0, Math.floor(data.muscles[m].xp * 0.70));
                });
                localStorage.setItem('fitproRPG', JSON.stringify(data));
            }
        } catch(e) {}
        // 2. Tous les items communs et rares détruits
        let itemsDestroyed = 0;
        try {
            const inv = JSON.parse(localStorage.getItem('fitpro_inventory') || '[]');
            const EQUIPMENT_DB = typeof EQUIPMENT_DATABASE !== 'undefined' ? EQUIPMENT_DATABASE : [];
            const survivors = inv.filter(e => {
                const item = EQUIPMENT_DB.find(i => i.id === e.itemId);
                return item && (item.rarity === 'epic' || item.rarity === 'legendary');
            });
            itemsDestroyed = inv.length - survivors.length;
            localStorage.setItem('fitpro_inventory', JSON.stringify(survivors));
        } catch(e) {}
        // 3. Streak remis à zéro
        try {
            const stats = JSON.parse(localStorage.getItem('workoutStats') || '{}');
            stats.streak = 0;
            localStorage.setItem('workoutStats', JSON.stringify(stats));
        } catch(e) {}
        return {
            type: 'armageddon',
            stat_multiplier: 0.20,
            xp_multiplier: 0.0,
            drop_banned: true,
            itemsDestroyed,
            expiresAt: Date.now() + 96*60*60*1000
        };
    },
};

const LEGENDARY_REWARD = {
    xpBonus: 5000,
    dropGuaranteed: true,
    dropMinRarity: 'epic', // garantit epic ou legendary
    statBoost: { duration: 48*60*60*1000, multiplier: 1.5 }, // +50% stats 48h
    xpBoost:  { duration: 72*60*60*1000, multiplier: 2.0 }, // XP ×2 pendant 72h
};

// Récompenses par difficulté
const CHALLENGE_REWARDS = {
    easy: [
        { id:'xp_100',   label:'+100 XP bonus',                    icon:'⭐', apply: () => _giveXPBonus(100) },
        { id:'xp_200',   label:'+200 XP bonus',                    icon:'⭐', apply: () => _giveXPBonus(200) },
        { id:'drop_up',  label:'+20% chance de drop (prochaine séance)', icon:'🎲', apply: () => _setDropBonus(1.20) },
    ],
    medium: [
        { id:'xp_500',      label:'+500 XP bonus',                     icon:'💫', apply: () => _giveXPBonus(500) },
        { id:'xp_750',      label:'+750 XP bonus',                     icon:'💫', apply: () => _giveXPBonus(750) },
        { id:'drop_up_big', label:'+40% chance de drop (prochaine séance)', icon:'🎲', apply: () => _setDropBonus(1.40) },
        { id:'xp_boost_24', label:'XP ×1.5 pendant 24h',              icon:'⚡', apply: () => _setXPBoost(1.5, 24) },
        { id:'stat_up_24',  label:'Stats équipement +25% pendant 24h', icon:'📈', apply: () => _setStatBoost(1.25, 24) },
    ],
    hard: [
        { id:'xp_1500',     label:'+1500 XP bonus',                   icon:'🔥', apply: () => _giveXPBonus(1500) },
        { id:'xp_2000',     label:'+2000 XP bonus',                   icon:'🔥', apply: () => _giveXPBonus(2000) },
        { id:'drop_rare',   label:'Drop rare garanti à la prochaine séance', icon:'💠', apply: () => _setGuaranteedDrop('rare') },
        { id:'drop_epic',   label:'Drop épique garanti à la prochaine séance', icon:'🟣', apply: () => _setGuaranteedDrop('epic') },
        { id:'xp_boost_48', label:'XP ×2 pendant 48h',                icon:'⚡', apply: () => _setXPBoost(2.0, 48) },
        { id:'stat_up_48',  label:'Stats équipement +50% pendant 48h', icon:'📈', apply: () => _setStatBoost(1.50, 48) },
        { id:'slot_unlock', label:'Tous les slots déscellés immédiatement', icon:'🔓', apply: () => _clearSlotLocks() },
    ],
    legendary: [
        { id:'xp_5000',     label:'+5000 XP bonus (répartis sur tous les muscles)', icon:'👑', apply: () => _giveXPBonus(5000) },
        { id:'drop_leg',    label:'Drop légendaire garanti à la prochaine séance', icon:'🌟', apply: () => _setGuaranteedDrop('legendary') },
        { id:'xp_boost_72', label:'XP ×2 pendant 72h',                icon:'⚡', apply: () => _setXPBoost(2.0, 72) },
        { id:'stat_up_72',  label:'Stats équipement +50% pendant 72h', icon:'📈', apply: () => _setStatBoost(1.50, 72) },
        { id:'penalty_clear', label:'Toutes les pénalités actives effacées', icon:'🧹', apply: () => clearPenalties() },
    ],
};

// ── Helpers de récompenses ────────────────────────────────────────────
function _giveXPBonus(amount) {
    try {
        const data = JSON.parse(localStorage.getItem('fitproRPG') || '{}');
        if (!data.muscles) return;
        const muscleKeys = Object.keys(data.muscles);
        if (!muscleKeys.length) return;
        const perMuscle = Math.floor(amount / muscleKeys.length);
        muscleKeys.forEach(m => { data.muscles[m].xp = (data.muscles[m].xp||0) + perMuscle; });
        localStorage.setItem('fitproRPG', JSON.stringify(data));
    } catch(e) {}
    return { type:'xp_bonus', amount };
}

function _setDropBonus(multiplier) {
    localStorage.setItem('fitpro_drop_bonus', JSON.stringify({ multiplier, expiresAt: Date.now() + 7*24*60*60*1000, sessions: 1 }));
    return { type:'drop_bonus', multiplier };
}

function _setGuaranteedDrop(minRarity) {
    localStorage.setItem('fitpro_guaranteed_drop', JSON.stringify({ minRarity, sessions: 1 }));
    return { type:'guaranteed_drop', minRarity };
}

function _setXPBoost(multiplier, hours) {
    const existing = JSON.parse(localStorage.getItem('fitpro_challenge_rewards') || '{}');
    existing.xp_boost = { multiplier, expiresAt: Date.now() + hours*60*60*1000 };
    localStorage.setItem('fitpro_challenge_rewards', JSON.stringify(existing));
    return { type:'xp_boost', multiplier, hours };
}

function _setStatBoost(multiplier, hours) {
    const existing = JSON.parse(localStorage.getItem('fitpro_challenge_rewards') || '{}');
    existing.stat_boost = { multiplier, expiresAt: Date.now() + hours*60*60*1000 };
    localStorage.setItem('fitpro_challenge_rewards', JSON.stringify(existing));
    return { type:'stat_boost', multiplier, hours };
}

function _clearSlotLocks() {
    const penalties = getActivePenalties().filter(p => p.type !== 'slot_lock');
    localStorage.setItem(CHALLENGE_STORAGE.penalties, JSON.stringify(penalties));
    return { type:'slot_unlock' };
}

function getChallengeRewards() {
    try { return JSON.parse(localStorage.getItem('fitpro_challenge_rewards') || '{}'); } catch(e) { return {}; }
}

function getGuaranteedDrop() {
    try { return JSON.parse(localStorage.getItem('fitpro_guaranteed_drop') || 'null'); } catch(e) { return null; }
}

function applyChallengeReward(challenge) {
    const pool = CHALLENGE_REWARDS[challenge.difficulty] || CHALLENGE_REWARDS.medium;
    const applied = [];

    if (challenge.isLegendary) {
        // Légendaire : toutes les récompenses légendaires
        CHALLENGE_REWARDS.legendary.forEach(r => {
            const result = r.apply();
            applied.push({ label: r.label, icon: r.icon, result });
        });
    } else {
        // Normal : 1 à 2 récompenses aléatoires selon la difficulté
        const count = challenge.difficulty === 'hard' ? 2 : 1;
        const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
        shuffled.forEach(r => {
            const result = r.apply();
            applied.push({ label: r.label, icon: r.icon, result });
        });
    }

    return applied;
}


function generateChallenge() {
    if (!getAdventureEnabled()) return null;

    // 🔒 Les défis du Système n'apparaissent qu'à partir du rang D (niveau 6),
    // pour ne pas décourager les nouveaux chasseurs (rang E).
    if (typeof getPlayerRankInfo === 'function') {
        const info = getPlayerRankInfo();
        const rankOrder = ['E','D','C','B','A','S','SS','SSS','National'];
        if (rankOrder.indexOf(info.rankId) < rankOrder.indexOf('D')) {
            return null;
        }
    }

    const existing = getActiveSystemChallenge();
    if (existing && !isChallengeExpired(existing)) return existing;

    // ── 1% de chance d'obtenir un défi légendaire ────────────────────
    if (Math.random() < 0.01) {
        const lc = LEGENDARY_CHALLENGES[Math.floor(Math.random() * LEGENDARY_CHALLENGES.length)];
        const issueMsg = LEGENDARY_ISSUE_MESSAGES[Math.floor(Math.random() * LEGENDARY_ISSUE_MESSAGES.length)];
        const challenge = {
            id: Date.now(),
            typeId: lc.id,
            label: lc.label,
            icon: lc.icon,
            units: lc.units,
            target: lc.target,
            muscle: null,
            difficulty: 'legendary',
            deadline: new Date(Date.now() + lc.hours * 60*60*1000).toISOString(),
            issuedAt: new Date().toISOString(),
            penaltyId: LEGENDARY_PENALTY.id,
            penaltyName: LEGENDARY_PENALTY.name,
            penaltyDesc: LEGENDARY_PENALTY.desc,
            penaltyIcon: LEGENDARY_PENALTY.icon,
            issueMessage: issueMsg,
            status: 'active',
            hours: lc.hours,
            isLegendary: true,
            rewardXP: LEGENDARY_REWARD.xpBonus,
        };
        saveActiveSystemChallenge(challenge);
        return challenge;
    }

    // ── Défi normal ──────────────────────────────────────────────────
    const totalStats = typeof getPlayerEquipStats === 'function' ? getPlayerEquipStats() : { strength: 10 };
    const playerPower = Object.values(totalStats).reduce((s, v) => s + v, 0);
    const difficulty = playerPower < 80 ? 'easy' : playerPower < 200 ? 'medium' : 'hard';

    const type = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];
    const pool = (type.targets[difficulty] || type.targets['medium'] || [1]);
    const target = pool[Math.floor(Math.random() * pool.length)];

    const muscles = ['Pectoraux', 'Dos', 'Épaules', 'Quadriceps', 'Fessiers', 'Abdominaux', 'Biceps', 'Triceps'];
    const muscle = muscles[Math.floor(Math.random() * muscles.length)];

    const durMap = {
        easy:   { sessions:24, minutes:24, muscle:24, streak:72, long_session:24, variety:48, consecutive_days:72, no_skip:48, upper_body:48, lower_body:48, full_body:48, comeback:12, default:24 },
        medium: { sessions:48, minutes:48, muscle:48, streak:96, long_session:36, variety:72, consecutive_days:96, no_skip:72, upper_body:72, lower_body:72, full_body:72, comeback:18, default:48 },
        hard:   { sessions:72, minutes:72, muscle:72, streak:168, long_session:48, variety:96, consecutive_days:168, no_skip:96, upper_body:96, lower_body:96, full_body:96, comeback:24, default:72 },
    };
    const hours = (durMap[difficulty] || durMap.medium)[type.id] || (durMap[difficulty] || durMap.medium).default;
    const deadline = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    const penaltyPool = getPenaltiesForDifficulty(difficulty);
    const penalty = penaltyPool[Math.floor(Math.random() * penaltyPool.length)];
    const issueMsg = SYSTEM_ISSUE_MESSAGES[Math.floor(Math.random() * SYSTEM_ISSUE_MESSAGES.length)];

    const challenge = {
        id: Date.now(),
        typeId: type.id,
        label: (['muscle'].includes(type.id)) ? type.label(target, muscle)
             : (['upper_body','lower_body','comeback'].includes(type.id)) ? type.label(target)
             : type.label(target),
        icon: type.icon,
        units: type.units,
        target,
        muscle: type.id === 'muscle' ? muscle : null,
        difficulty,
        deadline,
        issuedAt: new Date().toISOString(),
        penaltyId: penalty.id,
        penaltyName: penalty.name,
        penaltyDesc: penalty.desc,
        penaltyIcon: penalty.icon,
        issueMessage: issueMsg,
        status: 'active',
        hours,
        isLegendary: false,
    };

    saveActiveSystemChallenge(challenge);
    return challenge;
}

// ═══════════════════════════════════════════════════════════════════════
// VÉRIFICATION D'UN DÉFI
// ═══════════════════════════════════════════════════════════════════════
function isChallengeExpired(challenge) {
    return new Date(challenge.deadline) < new Date();
}

function getSystemChallengeProgress(challenge) {
    const type = CHALLENGE_TYPES.find(t => t.id === challenge.typeId);
    if (!type) return 0;
    try { return type.check(challenge); }
    catch(e) { return 0; }
}

function isChallengeCompleted(challenge) {
    return getSystemChallengeProgress(challenge) >= challenge.target;
}

// ── Appelé après chaque séance pour vérifier ──────────────────────────
function checkChallengeOnWorkoutComplete() {
    if (!getAdventureEnabled()) return;
    const challenge = getActiveSystemChallenge();
    if (!challenge || challenge.status !== 'active') return;

    if (isChallengeCompleted(challenge)) {
        challenge.status = 'completed';
        saveActiveSystemChallenge(challenge);

        // ── Appliquer les récompenses ────────────────────────────────
        const reward = applyChallengeReward(challenge);
        challenge.rewardApplied = reward;
        saveActiveSystemChallenge(challenge);

        const msg = SYSTEM_SUCCESS_MESSAGES[Math.floor(Math.random() * SYSTEM_SUCCESS_MESSAGES.length)];
        setTimeout(() => showChallengeResultModal(challenge, true, msg, null, reward), 2500);
        return;
    }

    if (isChallengeExpired(challenge)) {
        failChallenge(challenge);
    }
}

function failChallenge(challenge) {
    challenge.status = 'failed';
    saveActiveSystemChallenge(challenge);

    let penaltyData;
    if (challenge.isLegendary) {
        penaltyData = LEGENDARY_PENALTY.apply(challenge);
        addPenalty(penaltyData);
    } else {
        const penaltyDef = PENALTIES.find(p => p.id === challenge.penaltyId);
        if (penaltyDef) {
            penaltyData = penaltyDef.apply(challenge);
            addPenalty(penaltyData);
        }
    }

    const msg = SYSTEM_FAIL_MESSAGES[Math.floor(Math.random() * SYSTEM_FAIL_MESSAGES.length)];
    showChallengeResultModal(challenge, false, msg, penaltyData);
}

// ── Check au démarrage de l'app ────────────────────────────────────────
function checkExpiredChallengeOnLoad() {
    if (!getAdventureEnabled()) return;
    const challenge = getActiveSystemChallenge();
    if (!challenge || challenge.status !== 'active') return;
    if (isChallengeExpired(challenge) && !isChallengeCompleted(challenge)) {
        failChallenge(challenge);
    }
}

// ── Forcer un nouveau défi (pour tests) ────────────────────────────────
function forceNewChallenge() {
    saveActiveSystemChallenge(null);
    const ch = generateChallenge();
    if (ch) {
        renderAdventureTab();
        showChallengeIssuedModal(ch);
    }
}

// ═══════════════════════════════════════════════════════════════════════
// MODALS D'ALERTE DU SYSTÈME
// ═══════════════════════════════════════════════════════════════════════

function showChallengeIssuedModal(challenge) {
    const deadline = new Date(challenge.deadline);
    const dateStr = deadline.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' });
    const isLeg = challenge.isLegendary;

    const modal = document.createElement('div');
    modal.id = 'challengeIssuedModal';
    modal.style.cssText = `
        position:fixed;inset:0;z-index:10002;
        background:${isLeg ? 'rgba(0,0,0,0.97)' : 'rgba(0,0,0,0.95)'};
        display:flex;align-items:center;justify-content:center;
        padding:20px;
        animation:fadeIn 0.3s ease;
    `;

    const borderColor = isLeg ? '#f59e0b' : 'rgba(168,85,247,0.5)';
    const glowColor   = isLeg ? 'rgba(245,158,11,0.4)' : 'rgba(168,85,247,0.2)';
    const accentColor = isLeg ? '#f59e0b' : '#a855f7';
    const btnBg       = isLeg ? 'linear-gradient(135deg,#92400e,#d97706)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)';

    modal.innerHTML = `
        <div style="
            width:100%;max-width:380px;
            background:#0a0a0a;border-radius:24px;
            padding:28px 22px;text-align:center;
            border:${isLeg ? '2px' : '1.5px'} solid ${borderColor};
            box-shadow:0 0 80px ${glowColor}, 0 0 200px ${glowColor.replace('0.4','0.1')};
            animation:challengePop 0.6s cubic-bezier(0.34,1.2,0.64,1);
            position:relative;overflow:hidden;
        ">
            ${isLeg ? `
            <!-- Effet de particules légendaire -->
            <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(245,158,11,0.08),transparent 60%);pointer-events:none;"></div>
            <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#f59e0b,transparent);"></div>
            ` : ''}

            <div style="font-size:0.65em;color:${accentColor};font-weight:700;text-transform:uppercase;letter-spacing:4px;margin-bottom:${isLeg?'8':'16'}px;">
                ${isLeg ? '✦ DÉFI LÉGENDAIRE ✦' : '⚠ ALERTE SYSTÈME ⚠'}
            </div>

            ${isLeg ? `<div style="font-size:0.6em;color:rgba(245,158,11,0.6);font-weight:600;letter-spacing:2px;margin-bottom:14px;">
                ☠ MISSION DE RANG NATIONAL ☠
            </div>` : ''}

            <div style="font-size:${isLeg?'4':'3.5'}em;margin-bottom:14px;animation:pulseIcon 1.5s ease-in-out infinite;">${challenge.icon}</div>

            <div style="font-size:0.82em;color:${accentColor};font-style:italic;margin-bottom:16px;line-height:1.5;">
                "${challenge.issueMessage}"
            </div>

            <div style="background:rgba(${isLeg?'245,158,11':'168,85,247'},0.08);border:1px solid rgba(${isLeg?'245,158,11':'168,85,247'},0.25);border-radius:14px;padding:16px;margin-bottom:16px;">
                <div style="font-size:0.65em;color:rgba(255,255,255,0.4);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Mission assignée</div>
                <div style="font-size:${isLeg?'0.92':'1'}em;font-weight:800;color:white;line-height:1.4;">${challenge.label}</div>
                <div style="font-size:0.72em;color:rgba(255,255,255,0.4);margin-top:8px;">⏰ Avant le ${dateStr}</div>
                ${isLeg ? `<div style="margin-top:8px;display:inline-block;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);border-radius:99px;padding:3px 12px;font-size:0.68em;color:#f59e0b;font-weight:700;">✦ Réussite = +5000 XP + Drop Épique/Légendaire garanti</div>` : ''}
            </div>

            <div style="background:rgba(239,68,68,${isLeg?'0.12':'0.08'});border:${isLeg?'2':'1'}px solid rgba(239,68,68,${isLeg?'0.4':'0.2'});border-radius:12px;padding:12px;margin-bottom:20px;">
                <div style="font-size:0.65em;color:#ef4444;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">⛓️ En cas d'échec</div>
                <div style="font-size:0.85em;font-weight:700;color:#f87171;">${challenge.penaltyIcon} ${challenge.penaltyName}</div>
                <div style="font-size:0.72em;color:rgba(255,255,255,0.4);margin-top:4px;">${challenge.penaltyDesc}</div>
            </div>

            <button onclick="document.getElementById('challengeIssuedModal').remove();"
                    style="width:100%;padding:14px;border-radius:14px;border:none;cursor:pointer;
                           background:${btnBg};
                           color:white;font-size:0.95em;font-weight:800;
                           box-shadow:0 4px 20px ${isLeg?'rgba(245,158,11,0.4)':'rgba(124,58,237,0.4)'};">
                ${isLeg ? '🌑 Accepter le Défi du Destin' : '⚔️ Mission acceptée'}
            </button>
        </div>
        <style>
            @keyframes challengePop { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
            @keyframes pulseIcon { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        </style>
    `;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);

    if (navigator.vibrate) {
        if (isLeg) navigator.vibrate([200,100,200,100,200,100,400]);
        else        navigator.vibrate([100,50,100,50,100,200]);
    }
}
function showChallengeResultModal(challenge, success, message, penaltyData, rewardApplied) {
    const modal = document.createElement('div');
    modal.id = 'challengeResultModal';
    modal.style.cssText = `
        position:fixed;inset:0;z-index:10002;
        background:rgba(0,0,0,0.95);
        display:flex;align-items:center;justify-content:center;
        padding:20px;
        animation:fadeIn 0.3s ease;
    `;

    const color = success ? '#22c55e' : '#ef4444';
    const glow  = success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';

    // Récupérer les détails de la pénalité instantanée si applicable
    const activePenalties = getActivePenalties();
    const lastPenalty = activePenalties[activePenalties.length - 1];
    let instantDetail = '';
    if (!success && lastPenalty) {
        if (lastPenalty.destroyedItem) {
            instantDetail = `<div style="font-size:0.72em;color:#fca5a5;margin-top:5px;">💥 « ${lastPenalty.destroyedItem} » a été détruit.</div>`;
        } else if (lastPenalty.itemsDestroyed > 0) {
            instantDetail = `<div style="font-size:0.72em;color:#fca5a5;margin-top:5px;">🗑️ ${lastPenalty.itemsDestroyed} item(s) purgé(s) de l'inventaire.</div>`;
        }
        if (lastPenalty.xpLost) {
            instantDetail += `<div style="font-size:0.72em;color:#fca5a5;margin-top:3px;">📉 ${lastPenalty.xpLost} XP retirés de ${lastPenalty.muscle || 'ton muscle'}.</div>`;
        }
        if (lastPenalty.muscle && lastPenalty.type === 'level_regression') {
            instantDetail += `<div style="font-size:0.72em;color:#fca5a5;margin-top:3px;">⬇️ ${lastPenalty.muscle} a régressé.</div>`;
        }
    }

    modal.innerHTML = `
        <div style="
            width:100%;max-width:380px;
            background:#0a0a0a;border-radius:24px;
            padding:28px 22px;text-align:center;
            border:1.5px solid ${color};
            box-shadow:0 0 80px ${glow};
            animation:challengePop 0.5s cubic-bezier(0.34,1.2,0.64,1);
        ">
            <div style="font-size:0.65em;color:${color};font-weight:700;text-transform:uppercase;letter-spacing:4px;margin-bottom:16px;">
                ${success ? '✦ SYSTÈME ✦' : '⚠ SYSTÈME ⚠'}
            </div>

            <div style="font-size:4em;margin-bottom:16px;">${success ? '🏆' : '💀'}</div>

            <div style="font-size:1.1em;font-weight:900;color:white;margin-bottom:12px;">
                ${success ? 'Défi Accompli' : 'Défi Échoué'}
            </div>

            <div style="font-size:0.82em;color:rgba(255,255,255,0.5);font-style:italic;margin-bottom:20px;line-height:1.6;">
                "${message}"
            </div>

            ${!success ? `
            <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:14px;margin-bottom:20px;">
                <div style="font-size:0.7em;color:#ef4444;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Pénalité appliquée</div>
                <div style="font-size:0.9em;font-weight:800;color:#f87171;">${challenge.penaltyIcon} ${challenge.penaltyName}</div>
                <div style="font-size:0.75em;color:rgba(255,255,255,0.4);margin-top:4px;">${challenge.penaltyDesc}</div>
                ${instantDetail}
            </div>` : `
            <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.22);border-radius:12px;padding:14px;margin-bottom:20px;">
                <div style="font-size:0.65em;color:#22c55e;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">🏆 Récompenses obtenues</div>
                ${(rewardApplied||[]).map(r => `
                <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(34,197,94,0.1);">
                    <span style="font-size:1em;">${r.icon}</span>
                    <span style="font-size:0.78em;color:#4ade80;font-weight:600;">${r.label}</span>
                </div>`).join('')}
                ${(!rewardApplied||!rewardApplied.length) ? '<div style="font-size:0.78em;color:#4ade80;">+10% de chance de drop ✨</div>' : ''}
            </div>`}

            <button onclick="document.getElementById('challengeResultModal').remove();renderAdventureTab();"
                    style="width:100%;padding:14px;border-radius:14px;border:none;cursor:pointer;
                           background:linear-gradient(135deg,${color},${color}cc);
                           color:white;font-size:0.95em;font-weight:800;
                           box-shadow:0 4px 20px ${glow};">
                ${success ? '🎉 Continuer' : '😤 Accepter la pénalité'}
            </button>
        </div>
    `;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);

    if (navigator.vibrate) {
        if (success) navigator.vibrate([80, 40, 160]);
        else         navigator.vibrate([200, 100, 200, 100, 400]);
    }
}

// ═══════════════════════════════════════════════════════════════════════
// RENDU UI — Section défi dans l'onglet aventure
// ═══════════════════════════════════════════════════════════════════════
function renderChallengeSection() {
    if (!getAdventureEnabled()) return '';

    // 🔒 Cacher toute la section des défis avant le rang D (niveau 6),
    // pour ne pas décourager les nouveaux chasseurs.
    if (typeof getPlayerRankInfo === 'function') {
        const info = getPlayerRankInfo();
        const rankOrder = ['E','D','C','B','A','S','SS','SSS','National'];
        if (rankOrder.indexOf(info.rankId) < rankOrder.indexOf('D')) {
            return '';
        }
    }

    // Vérifier expiration au rendu
    const challenge = getActiveSystemChallenge();
    const penalties = getActivePenalties();

    // ── Pénalités actives ────────────────────────────────────────────
    let penaltyHtml = '';
    if (penalties.length > 0) {
        penaltyHtml = `
            <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:14px;padding:14px;margin-bottom:14px;">
                <div style="font-size:0.65em;color:#ef4444;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">⛓️ Pénalités actives</div>
                ${penalties.map(p => {
                    if (p.instant) return '';
                    const remaining = Math.max(0, Math.round((p.expiresAt - Date.now()) / 3600000));
                    const labels = [];
                    if (p.stat_multiplier !== undefined) labels.push(`Stats -${Math.round((1-p.stat_multiplier)*100)}%`);
                    if (p.multiplier !== undefined && p.type === 'stat_drain') labels.push(`Stats -${Math.round((1-p.multiplier)*100)}%`);
                    if (p.multiplier !== undefined && p.type === 'xp_curse') labels.push(`XP -${Math.round((1-p.multiplier)*100)}%`);
                    if (p.xp_multiplier !== undefined) labels.push(p.xp_multiplier === 0 ? 'XP bloqué' : `XP -${Math.round((1-p.xp_multiplier)*100)}%`);
                    if (p.drop_banned) labels.push('Drops bloqués');
                    if (p.lockedSlot) labels.push(`Slot ${p.lockedSlot} scellé`);
                    if (!labels.length) labels.push('Pénalité active');
                    const severityColor = p.type === 'monarch_wrath' || p.type === 'system_erasure' ? '#be185d' :
                                          p.type === 'total_freeze' || p.type === 'level_regression' ? '#ea580c' : '#ef4444';
                    return `
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(239,68,68,0.1);">
                            <span style="font-size:0.82em;font-weight:700;color:${severityColor};">💀 ${labels.join(' · ')}</span>
                            <span style="font-size:0.68em;color:rgba(255,255,255,0.35);">${remaining}h restantes</span>
                        </div>`;
                }).filter(Boolean).join('')}
            </div>`;
    }

    // ── Défi actif ───────────────────────────────────────────────────
    let challengeHtml = '';
    if (!challenge || challenge.status !== 'active') {
        // Pas de défi actif — afficher option d'en générer un
        challengeHtml = `
            <div style="background:linear-gradient(160deg,#0a0e18,#0F1014);border:1.5px dashed rgba(168,85,247,0.3);border-radius:16px;padding:20px;text-align:center;margin-bottom:14px;">
                <div style="font-size:2em;margin-bottom:10px;opacity:0.5;">📜</div>
                <div style="font-weight:800;color:#c084fc;margin-bottom:6px;font-size:0.95em;letter-spacing:0.5px;">Aucun défi actif</div>
                <div style="font-size:0.78em;color:#94a3b8;line-height:1.5;">Le Système t'observe…<br/>peut-être reviendra-t-il à ta prochaine séance.</div>
            </div>`;
    } else {
        const progress = getSystemChallengeProgress(challenge);
        const pct = Math.min(100, Math.round((progress / challenge.target) * 100));
        const now = Date.now();
        const deadline = new Date(challenge.deadline);
        const msLeft = deadline - now;
        const hoursLeft = Math.max(0, Math.floor(msLeft / 3600000));
        const minsLeft  = Math.max(0, Math.floor((msLeft % 3600000) / 60000));
        const isUrgent  = hoursLeft < 6;
        const urgentColor = isUrgent ? '#ef4444' : '#a855f7';

        challengeHtml = `
            <div onclick="showActiveChallengeDetails()" style="
                background:linear-gradient(135deg,#0a0a14,#14001e);
                border:1.5px solid ${urgentColor}40;
                border-radius:16px;padding:16px;margin-bottom:14px;
                box-shadow:0 0 20px ${urgentColor}15;
                cursor:pointer;transition:all 0.2s;
            " onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 24px ${urgentColor}30';"
               onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 0 20px ${urgentColor}15';">
                <!-- Header -->
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                    <div style="font-size:0.62em;color:${urgentColor};font-weight:700;text-transform:uppercase;letter-spacing:2px;">
                        ${isUrgent ? '⚠️ URGENT' : '📜 DÉFI ACTIF'}
                    </div>
                    <div style="font-size:0.72em;font-weight:700;color:${isUrgent ? '#ef4444' : 'rgba(255,255,255,0.4)'};">
                        ${hoursLeft}h ${minsLeft}m restantes
                    </div>
                </div>

                <!-- Mission -->
                <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;">
                    <span style="font-size:1.8em;flex-shrink:0;">${challenge.icon}</span>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:0.95em;font-weight:800;color:white;line-height:1.4;">${challenge.label}</div>
                        <div style="font-size:0.72em;color:rgba(255,255,255,0.4);margin-top:4px;">
                            Progression : ${progress} / ${challenge.target} ${challenge.units}
                        </div>
                    </div>
                    <div style="font-size:0.7em;color:rgba(255,255,255,0.3);flex-shrink:0;margin-top:2px;">›</div>
                </div>

                <!-- Barre progress -->
                <div style="height:8px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;margin-bottom:12px;">
                    <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:99px;transition:width 0.5s ease;"></div>
                </div>

                <!-- Conséquence en cas d'échec -->
                <div style="background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.15);border-radius:10px;padding:8px 12px;display:flex;align-items:center;gap:8px;">
                    <span style="font-size:1em;">${challenge.penaltyIcon}</span>
                    <div>
                        <span style="font-size:0.72em;color:#f87171;font-weight:600;">Échec → </span>
                        <span style="font-size:0.72em;color:rgba(255,255,255,0.5);">${challenge.penaltyName}</span>
                    </div>
                </div>

                <div style="text-align:center;margin-top:10px;font-size:0.65em;color:rgba(168,85,247,0.5);letter-spacing:1px;">
                    ◈ TAP POUR LES DÉTAILS ◈
                </div>
            </div>`;
    }

    return penaltyHtml + challengeHtml;
}

// ── Patch renderAdventureTab pour inclure les défis ─────────────────────
// This function REPLACES the one in adventure.js once challenges.js loads
// ── renderAdventureTab géré dans adventure.js (qui inclut déjà renderChallengeSection si dispo) ───
// Pas de duplication ici pour éviter d'écraser la version complète d'adventure.js

// ── Timer live pour le compte à rebours du défi ─────────────────────────
let _challengeTimerInterval = null;
function startChallengeTimer() {
    clearInterval(_challengeTimerInterval);
    _challengeTimerInterval = setInterval(() => {
        const challenge = getActiveSystemChallenge();
        if (!challenge || challenge.status !== 'active') {
            clearInterval(_challengeTimerInterval);
            return;
        }
        // Juste mettre à jour le texte du timer sans re-render tout
        const now = Date.now();
        const deadline = new Date(challenge.deadline);
        const msLeft = deadline - now;
        if (msLeft <= 0) {
            clearInterval(_challengeTimerInterval);
            if (!isChallengeCompleted(challenge)) failChallenge(challenge);
            renderAdventureTab();
            return;
        }
        const hoursLeft = Math.floor(msLeft / 3600000);
        const minsLeft  = Math.floor((msLeft % 3600000) / 60000);
        // Update timer display directly
        const timerEls = document.querySelectorAll('[data-challenge-timer]');
        timerEls.forEach(el => {
            el.textContent = `${hoursLeft}h ${minsLeft}m restantes`;
        });
    }, 30000); // Update every 30s
}

// ── Init ────────────────────────────────────────────────────────────────
function initChallengeSystem() {
    if (!getAdventureEnabled()) return;
    checkExpiredChallengeOnLoad();

    const challenge = getActiveSystemChallenge();
    const noActive = !challenge || challenge.status !== 'active';

    if (noActive) {
        // 25% de chance — le Système frappe quand il le décide
        if (Math.random() < 0.25) {
            const delay = 3000 + Math.random() * 5000;
            setTimeout(() => {
                const ch = generateChallenge();
                if (ch) showChallengeIssuedModal(ch);
            }, delay);
        }
    }
}

// Après une séance — pas de nouveau défi automatique,
// le Système peut frapper à la prochaine ouverture de l'app
function tryGenerateChallengeAfterWorkout() {
    // Intentionnellement vide — les défis arrivent à l'ouverture, pas après chaque séance
}

// Affiche les détails complets du défi en cours (rouvre le modal d'émission)
function showActiveChallengeDetails() {
    const challenge = getActiveSystemChallenge();
    if (!challenge || challenge.status !== 'active') return;

    // Calculer la progression actuelle pour l'afficher
    const progress = getSystemChallengeProgress(challenge);
    const pct = Math.min(100, Math.round((progress / challenge.target) * 100));
    const deadline = new Date(challenge.deadline);
    const msLeft = deadline - Date.now();
    const hoursLeft = Math.max(0, Math.floor(msLeft / 3600000));
    const minsLeft  = Math.max(0, Math.floor((msLeft % 3600000) / 60000));
    const dateStr   = deadline.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' });
    const isLeg     = challenge.isLegendary;

    document.getElementById('challengeIssuedModal')?.remove();

    const borderColor = isLeg ? '#f59e0b' : 'rgba(168,85,247,0.5)';
    const glowColor   = isLeg ? 'rgba(245,158,11,0.4)' : 'rgba(168,85,247,0.2)';
    const accentColor = isLeg ? '#f59e0b' : '#a855f7';
    const btnBg       = isLeg ? 'linear-gradient(135deg,#92400e,#d97706)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)';

    const modal = document.createElement('div');
    modal.id = 'challengeIssuedModal';
    modal.style.cssText = `
        position:fixed;inset:0;z-index:10002;
        background:${isLeg ? 'rgba(0,0,0,0.97)' : 'rgba(0,0,0,0.95)'};
        display:flex;align-items:center;justify-content:center;
        padding:20px;animation:fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <div style="
            width:100%;max-width:380px;background:#0a0a0a;border-radius:24px;
            padding:28px 22px;text-align:center;
            border:${isLeg ? '2px' : '1.5px'} solid ${borderColor};
            box-shadow:0 0 80px ${glowColor};
            position:relative;overflow:hidden;max-height:92vh;overflow-y:auto;
        ">
            ${isLeg ? `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(245,158,11,0.08),transparent 60%);pointer-events:none;"></div>` : ''}

            <div style="font-size:0.65em;color:${accentColor};font-weight:700;text-transform:uppercase;letter-spacing:4px;margin-bottom:10px;">
                ${isLeg ? '✦ DÉFI LÉGENDAIRE ✦' : '📜 DÉFI ACTIF'}
            </div>

            <div style="font-size:${isLeg?'4':'3.5'}em;margin-bottom:14px;">${challenge.icon}</div>

            ${challenge.issueMessage ? `<div style="font-size:0.78em;color:${accentColor};font-style:italic;margin-bottom:16px;line-height:1.5;opacity:0.85;">"${challenge.issueMessage}"</div>` : ''}

            <!-- Mission -->
            <div style="background:rgba(${isLeg?'245,158,11':'168,85,247'},0.08);border:1px solid rgba(${isLeg?'245,158,11':'168,85,247'},0.25);border-radius:14px;padding:16px;margin-bottom:14px;">
                <div style="font-size:0.65em;color:rgba(255,255,255,0.4);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Mission</div>
                <div style="font-size:0.95em;font-weight:800;color:white;line-height:1.4;margin-bottom:10px;">${challenge.label}</div>

                <div style="height:8px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;margin-bottom:8px;">
                    <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:99px;"></div>
                </div>
                <div style="font-size:0.72em;color:rgba(255,255,255,0.5);">${progress} / ${challenge.target} ${challenge.units} · <span style="color:${accentColor};font-weight:700;">${pct}%</span></div>
                <div style="font-size:0.7em;color:rgba(255,255,255,0.4);margin-top:6px;">⏰ ${hoursLeft}h ${minsLeft}m · échéance ${dateStr}</div>
                ${isLeg ? `<div style="margin-top:10px;display:inline-block;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);border-radius:99px;padding:3px 12px;font-size:0.66em;color:#f59e0b;font-weight:700;">✦ Réussite = +5000 XP + Drop garanti</div>` : ''}
            </div>

            <!-- Pénalité en cas d'échec -->
            <div style="background:rgba(239,68,68,${isLeg?'0.12':'0.08'});border:${isLeg?'2':'1'}px solid rgba(239,68,68,${isLeg?'0.4':'0.2'});border-radius:12px;padding:12px;margin-bottom:20px;text-align:left;">
                <div style="font-size:0.62em;color:#ef4444;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">⛓️ Pénalité en cas d'échec</div>
                <div style="font-size:0.88em;font-weight:800;color:#f87171;margin-bottom:4px;">${challenge.penaltyIcon} ${challenge.penaltyName}</div>
                <div style="font-size:0.72em;color:rgba(255,255,255,0.5);line-height:1.5;">${challenge.penaltyDesc}</div>
            </div>

            <button onclick="document.getElementById('challengeIssuedModal').remove();"
                    style="width:100%;padding:13px;border-radius:13px;border:none;cursor:pointer;
                           background:${btnBg};color:white;font-size:0.9em;font-weight:800;">
                ⚔️ Fermer
            </button>
        </div>
    `;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
}

window.showActiveChallengeDetails = showActiveChallengeDetails;
window.renderChallengeSection     = renderChallengeSection;
window.startChallengeTimer        = startChallengeTimer;

// Exposer globalement
window.tryGenerateChallengeAfterWorkout = tryGenerateChallengeAfterWorkout;
window.getChallengeRewards  = getChallengeRewards;
window.getGuaranteedDrop    = getGuaranteedDrop;

// ═══════════════════════════════════════════════════════════════════════
// MESSAGES ALÉATOIRES DU SYSTÈME
// Apparaissent à des moments imprévisibles — jamais pendant une séance
// ═══════════════════════════════════════════════════════════════════════

const SYSTEM_RANDOM_MESSAGES = [

    // ── PROVOCATIONS ────────────────────────────────────────────────
    { text: 'Le Système a analysé ton dernier entraînement. Il attend mieux.', type: 'taunt' },
    { text: 'Tu penses à t\'entraîner, ou tu t\'entraînes vraiment ?', type: 'taunt' },
    { text: 'Chaque jour sans progrès est un jour de régression.', type: 'taunt' },
    { text: 'Le Système a vu des chasseurs plus faibles que toi devenir légendaires. Et toi ?', type: 'taunt' },
    { text: 'Tu ouvres cette application. Le Système l\'a remarqué. Maintenant agis.', type: 'taunt' },
    { text: 'La fatigue que tu ressens est temporaire. La médiocrité, elle, s\'installe.', type: 'taunt' },
    { text: 'Quelqu\'un quelque part s\'entraîne pendant que tu lis ceci.', type: 'taunt' },
    { text: 'Le Système ne juge pas les excuses. Il enregistre les résultats.', type: 'taunt' },
    { text: 'Ton rang actuel reflète exactement l\'effort que tu as fourni.', type: 'taunt' },
    { text: 'Les ombres progressent. Toi, tu hésites.', type: 'taunt' },
    { text: 'Le confort est l\'ennemi de l\'éveil. Le Système a parlé.', type: 'taunt' },
    { text: 'Analyse en cours… Potentiel détecté. Exploitation : insuffisante.', type: 'taunt' },

    // ── AVERTISSEMENTS ───────────────────────────────────────────────
    { text: 'Avertissement : une longue absence a été détectée dans ton historique.', type: 'warning' },
    { text: 'Le Système a détecté des signes de stagnation. Agis avant qu\'il n\'agisse.', type: 'warning' },
    { text: 'Tes muscles stagnent. Le Système surveille leur déclin avec intérêt.', type: 'warning' },
    { text: 'Attention : les chasseurs inactifs régressent. Tu n\'es pas une exception.', type: 'warning' },
    { text: 'Le Système a noté ta dernière séance. Il espère que tu peux faire mieux.', type: 'warning' },
    { text: 'Le Système prévient une seule fois : l\'inactivité a un prix.', type: 'warning' },
    { text: 'Alerte : ton potentiel se dégrade pendant que tu attends.', type: 'warning' },

    // ── MYSTÉRIEUX / ATMOSPHÉRIQUES ──────────────────────────────────
    { text: 'Le Système se souvient de tout. Chaque série. Chaque abandon.', type: 'lore' },
    { text: 'Dans les archives du Système, ton nom existe. Pour l\'instant.', type: 'lore' },
    { text: 'Les portes des donjons supérieurs ne s\'ouvrent pas pour les faibles.', type: 'lore' },
    { text: 'Le Monarque des Ombres a commencé exactement là où tu es. La différence : il n\'a jamais arrêté.', type: 'lore' },
    { text: 'Le Système existe depuis avant ta première répétition. Il existera après ta dernière.', type: 'lore' },
    { text: 'Quelque part dans les données du Système, il y a la version de toi qui n\'a pas abandonné.', type: 'lore' },
    { text: 'Le vide entre deux séances n\'est pas du repos. C\'est une épreuve silencieuse.', type: 'lore' },
    { text: 'Les équipements légendaires ne droppent pas pour ceux qui s\'en sentent indignes.', type: 'lore' },
    { text: 'Le Système n\'a pas de pitié. Mais il a de l\'équité : tu reçois exactement ce que tu mérites.', type: 'lore' },
    { text: 'Les rangs ne sont pas des titres. Ils sont des preuves.', type: 'lore' },

    // ── MOTIVANTS (RARES) ────────────────────────────────────────────
    { text: 'Le Système a enregistré ta progression. Elle est réelle. Continue.', type: 'motivate' },
    { text: 'Chaque répétition est une ligne de code dans le programme de ta transformation.', type: 'motivate' },
    { text: 'Le Système voit ce que tu fais même quand personne d\'autre ne regarde.', type: 'motivate' },
    { text: 'Tu es encore là. C\'est déjà plus que la plupart.', type: 'motivate' },
    { text: 'Le Système a calculé ta trajectoire. Si tu continues : rang S accessible.', type: 'motivate' },
    { text: 'La douleur que tu ressentais la première fois n\'est plus là. Le Système appelle ça : progression.', type: 'motivate' },

    // ── CRYPTIQUES ───────────────────────────────────────────────────
    { text: '01001100 01000101 00100000 01010011 01011001 01010011 01010100 01000101 01001101 01000101', type: 'cryptic' },
    { text: 'NIVEAU DE MENACE ÉVALUÉ. CIBLE : TOI-MÊME. STATUT : EN COURS.', type: 'cryptic' },
    { text: 'Entrée détectée. Bienvenue, chasseur. Le Système te voit.', type: 'cryptic' },
    { text: '[ DONNÉES CORROMPUES ] … mais le Système se souvient quand même.', type: 'cryptic' },
    { text: 'ANALYSE_COMPLETE. RÉSULTAT : POTENTIEL_INEXPLOITÉ. RECOMMANDATION : AGIS.', type: 'cryptic' },
];

const SYSTEM_RANDOM_COLORS = {
    taunt:    { border: 'rgba(168,85,247,0.35)', bg: 'rgba(168,85,247,0.06)', text: '#a855f7', icon: '🌑' },
    warning:  { border: 'rgba(239,68,68,0.35)',  bg: 'rgba(239,68,68,0.06)',  text: '#f87171', icon: '⚠️' },
    lore:     { border: 'rgba(6,182,212,0.35)',   bg: 'rgba(6,182,212,0.06)',  text: '#22d3ee', icon: '📜' },
    motivate: { border: 'rgba(34,197,94,0.35)',  bg: 'rgba(34,197,94,0.06)',  text: '#4ade80', icon: '⚡' },
    cryptic:  { border: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.06)', text: '#fbbf24', icon: '💠' },
};

function showSystemRandomMessage() {
    // Ne jamais afficher pendant une séance
    if (typeof currentWorkout !== 'undefined' && currentWorkout !== null) return;
    if (typeof currentTab !== 'undefined' && currentTab === 'workout') return;
    if (document.getElementById('workoutTab')?.classList.contains('active')) return;

    const msg = SYSTEM_RANDOM_MESSAGES[Math.floor(Math.random() * SYSTEM_RANDOM_MESSAGES.length)];
    const colors = SYSTEM_RANDOM_COLORS[msg.type] || SYSTEM_RANDOM_COLORS.lore;

    // Retirer l'ancien si encore affiché
    document.getElementById('systemRandomMsg')?.remove();

    const el = document.createElement('div');
    el.id = 'systemRandomMsg';
    el.style.cssText = [
        'position:fixed',
        'bottom:80px',
        'left:50%',
        'transform:translateX(-50%) translateY(20px)',
        'z-index:9500',
        'max-width:340px',
        'width:calc(100% - 32px)',
        'background:' + colors.bg,
        'border:1px solid ' + colors.border,
        'border-radius:14px',
        'padding:12px 16px',
        'display:flex',
        'align-items:flex-start',
        'gap:10px',
        'backdrop-filter:blur(12px)',
        'box-shadow:0 4px 24px rgba(0,0,0,0.5)',
        'opacity:0',
        'transition:all 0.4s cubic-bezier(0.34,1.2,0.64,1)',
        'cursor:pointer',
    ].join(';');

    el.innerHTML = '<div style="font-size:1.1em;flex-shrink:0;margin-top:1px;">' + colors.icon + '</div>'
        + '<div style="flex:1;min-width:0;">'
        + '<div style="font-size:0.55em;color:' + colors.text + ';font-weight:800;text-transform:uppercase;letter-spacing:2px;margin-bottom:3px;">◈ SYSTÈME</div>'
        + '<div style="font-size:0.78em;color:rgba(255,255,255,0.8);line-height:1.45;font-style:italic;">"' + msg.text + '"</div>'
        + '</div>'
        + '<div style="font-size:0.7em;color:rgba(255,255,255,0.2);flex-shrink:0;margin-left:4px;">✕</div>';

    el.addEventListener('click', () => dismissSystemMessage(el));
    document.body.appendChild(el);

    // Animer l'entrée
    requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Disparaître automatiquement après 8 secondes
    setTimeout(() => dismissSystemMessage(el), 8000);

    if (navigator.vibrate) navigator.vibrate(40);
}

function dismissSystemMessage(el) {
    if (!el || !el.parentNode) return;
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => el?.remove(), 400);
}

// ── Planificateur de messages aléatoires ─────────────────────────────
// Apparaît 1 à 3 fois par session, à des intervalles imprévisibles
function startSystemRandomMessages() {
    if (!getAdventureEnabled()) return;

    function scheduleNext() {
        // Intervalle aléatoire entre 2 et 8 minutes
        const minMs = 2 * 60 * 1000;
        const maxMs = 8 * 60 * 1000;
        const delay = minMs + Math.random() * (maxMs - minMs);

        setTimeout(() => {
            showSystemRandomMessage();
            scheduleNext();
        }, delay);
    }

    // Premier message après 90 secondes minimum
    const firstDelay = 90000 + Math.random() * 120000;
    setTimeout(() => {
        showSystemRandomMessage();
        scheduleNext();
    }, firstDelay);
}

window.showSystemRandomMessage  = showSystemRandomMessage;
window.startSystemRandomMessages = startSystemRandomMessages;
