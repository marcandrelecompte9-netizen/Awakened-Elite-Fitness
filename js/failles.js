// Awakened — FAILLES & CHASSES (extrait d'app.js en v1623, contenu inchangé).
// Failles (vagues, boss, Assaut), monstres échappés et Chasses, compagnons et leurs
// Failles, Le Marchand. Chargé juste après app.js : mêmes variables globales
// (currentWorkout, awakActiveRiftSession…), mêmes fonctions globales.

        // ═══════════════════════════════════════════════════════════════
        // 🌀 SYSTÈME DE FAILLES (Rifts) — Cœur du gameplay RPG
        // ═══════════════════════════════════════════════════════════════
        //
        // Une Faille = mission RPG narrative
        // - Apparition aléatoire (2-5/semaine, rang ±1 du joueur)
        // - Vagues de monstres à vaincre avec exercices ciblés
        // - Boss final avec mécanique unique
        // - Récompenses : XP, loot, fragments
        // - Si non fermée à temps → monstre s'échappe
        //

        const RIFT_STORAGE_KEY = 'awakRifts';
        const RIFT_LAST_GENERATED_KEY = 'awakRiftLastGen';
        const RIFT_MAX_ACTIVE = 2;             // Base : 2 simultanées (augmente avec le niveau)

        // 📊 Nombre max de Failles simultanées, selon le NIVEAU du joueur.
        // NARRATIF : ce n'est pas le joueur qui "débloque" plus de Failles en progressant —
        // c'est la MENACE (le Déclin) qui s'intensifie et déchire la réalité en plus d'endroits.
        // Les paliers sont DÉCALÉS de 2 niveaux APRÈS le changement de rang (et l'apparition
        // du compagnon associé), pour éviter que tout se débloque en même temps : le joueur
        // monte de rang, rencontre le compagnon, puis quelques séances plus tard la menace
        // s'aggrave et une Faille supplémentaire s'ouvre — chaque événement reste distinct.
        //   < niv 22  → 2 Failles | niv 22-36 → 3 Failles | niv 37+ → 4 Failles
        const RIFT_TIER2_LEVEL = 22;          // 2 → 3 Failles (2 niv après rang C / Kira)
        const RIFT_TIER3_LEVEL = 37;          // 3 → 4 Failles (2 niv après rang B / Élise)
        function awakGetMaxActiveRifts() {
            try {
                const lvl = (typeof _awakGetCurrentLevel === 'function') ? _awakGetCurrentLevel() : 1;
                if (lvl >= RIFT_TIER3_LEVEL) return 4;
                if (lvl >= RIFT_TIER2_LEVEL) return 3;
                return RIFT_MAX_ACTIVE; // 2
            } catch(e) { return RIFT_MAX_ACTIVE; }
        }
        window.awakGetMaxActiveRifts = awakGetMaxActiveRifts;

        // 🔔 Notifie le joueur quand il franchit un palier de Failles simultanées.
        // Appelée après un gain d'XP ; ne notifie qu'une seule fois par palier.
        function awakCheckRiftCapacityUnlock() {
            try {
                if (typeof getAdventureEnabled === 'function' && !getAdventureEnabled()) return;
                const lvl = (typeof _awakGetCurrentLevel === 'function') ? _awakGetCurrentLevel() : 1;
                const seenKey = 'awakRiftCapSeen';
                const seen = parseInt(localStorage.getItem(seenKey) || '2'); // capacité déjà annoncée (2 par défaut)
                const current = awakGetMaxActiveRifts();
                if (current > seen) {
                    localStorage.setItem(seenKey, String(current));
                    const msg = current === 3
                        ? 'La menace s\'intensifie. Le Déclin ronge la réalité en plus d\'endroits — jusqu\'à 3 Failles peuvent désormais s\'ouvrir en même temps. Ne reste pas seul : tes compagnons peuvent t\'épauler.'
                        : 'Le mal gagne du terrain. Les Failles se multiplient — jusqu\'à 4 peuvent déchirer le monde simultanément. Tes compagnons ne seront pas de trop pour tenir le front.';
                    if (typeof showAlert === 'function') {
                        setTimeout(() => showAlert(`🌀 La menace grandit : ${current} Failles`, msg), 1800);
                    } else if (typeof showToast === 'function') {
                        setTimeout(() => showToast(`🌀 Le Déclin s\'étend : jusqu\'à ${current} Failles simultanées !`, 'warning', 4500), 1800);
                    }
                }
            } catch(e) { _awkE(e); }
        }
        window.awakCheckRiftCapacityUnlock = awakCheckRiftCapacityUnlock;
        const RIFT_COOLDOWN_HOURS = 48;        // 2 jours entre 2 spawns (au lieu de 14h)
        const RIFT_LIFETIME_DAYS = { E: 8, D: 8, C: 10, B: 10, A: 14, S: 14, SS: 16, SSS: 18 }; // Plus de temps pour les faire
        const RIFT_SPAWN_PROBABILITY = 0.35;   // 35% si conditions remplies (au lieu de 70%)
        const RIFT_MIN_SESSION_MINUTES = 15;   // Vraie séance requise (>15 min)
        const RIFT_MIN_EXERCISES = 5;          // Au moins 5 exercices complétés
        const RIFT_MIN_PLAYER_LEVEL = 2;       // 🔒 Pacing : pas de Failles normales au tout début (v1403 : niv. 2, avant 3 — un débutant attendait 3 semaines)

        // ── THÈMES DE FAILLES ─────────────────────────────────────────
        // Chaque thème détermine l'ambiance et le type d'exercices proposés
        const RIFT_THEMES = [
            {
                id: 'frozen_city',
                name: 'Ville Figée',
                emoji: '🏙️',
                color: '#06b6d4',
                description: 'Une ville où le temps s\'est arrêté. Les habitants sont devenus des statues qui s\'animent au passage.',
                briefing: 'Mouvement lent. Force pure. Le temps t\'aidera ici.',
                primaryStat: 'STR',
                exerciseFilter: ex => /squat|deadlift|press|bench|développé|soulevé|barre|haltère/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'organic_desert',
                name: 'Désert Organique',
                emoji: '🌵',
                color: '#f59e0b',
                description: 'Une étendue infinie de chair pulsante et de sable brûlant. Tout y est vivant.',
                briefing: 'Tu vas avoir chaud. Tiens bon. Adapte-toi.',
                primaryStat: 'END',
                exerciseFilter: ex => /cardio|course|run|hiit|burpee|jumping/.test((ex.name || '').toLowerCase())
                                       || ex.type === 'cardio'
            },
            {
                id: 'underground_ocean',
                name: 'Océan Souterrain',
                emoji: '🌊',
                color: '#3b82f6',
                description: 'Un océan sans fin sous la terre. Les créatures qui y nagent n\'ont jamais vu la lumière.',
                briefing: 'Respire. Bouge fluide. Endurance.',
                primaryStat: 'END',
                exerciseFilter: ex => /natation|swim|cardio|rope|corde/.test((ex.name || '').toLowerCase())
                                       || ex.type === 'cardio'
            },
            {
                id: 'inverted_reality',
                name: 'Réalité Inversée',
                emoji: '🪞',
                color: '#a855f7',
                description: 'Tout est à l\'envers. La gravité, la logique, les couleurs. Même toi, peut-être.',
                briefing: 'Tes réflexes vont mentir. Concentre-toi.',
                primaryStat: 'PER',
                exerciseFilter: ex => /équilibre|unilatéral|single|pistol|turkish|pallof|planche/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'living_hospital',
                name: 'Hôpital Vivant',
                emoji: '🏥',
                color: '#22c55e',
                description: 'Les murs respirent. Les couloirs guérissent. Les patients ne sont jamais sortis.',
                briefing: 'Souplesse. Récupération. Le lieu t\'observe.',
                primaryStat: 'SEN',
                exerciseFilter: ex => /fente|lunge|squat|unilatéral|pistol|step|pompe|push|mountain|burpee/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'dimensional_train',
                name: 'Train Dimensionnel',
                emoji: '🚂',
                color: '#ef4444',
                description: 'Un train qui traverse les réalités. Tu ne sais pas combien de wagons il a. Personne ne sait.',
                briefing: 'Vagues rapides. Pas de répit. Cadence.',
                primaryStat: 'VIT',
                exerciseFilter: ex => /hiit|tabata|circuit|burpee|jumping|mountain|sprint/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'infinite_library',
                name: 'Bibliothèque Infinie',
                emoji: '📚',
                color: '#8b5cf6',
                description: 'Des rayonnages sans fin contenant chaque livre jamais écrit, et tous ceux qui ne le seront jamais.',
                briefing: 'Le savoir pèse lourd. Concentre-toi sur chaque geste.',
                primaryStat: 'PER',
                exerciseFilter: ex => /équilibre|unilatéral|pallof|planche|gainage|core|abdo/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'celestial_forge',
                name: 'Forge Céleste',
                emoji: '⚒️',
                color: '#f97316',
                description: 'Là où les étoiles sont martelées en existence. La chaleur fait fondre la volonté des faibles.',
                briefing: 'Frappe fort, frappe lourd. Ici, seule la puissance compte.',
                primaryStat: 'STR',
                exerciseFilter: ex => /deadlift|soulevé|squat|press|développé|barre|haltère|rowing/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'carnivore_garden',
                name: 'Jardin Carnivore',
                emoji: '🌺',
                color: '#ec4899',
                description: 'Un jardin trop beau pour être honnête. Chaque fleur a une bouche. Chaque parfum est un piège.',
                briefing: 'Reste mobile. Ne t\'arrête jamais. Le sol veut t\'avaler.',
                primaryStat: 'AGI',
                exerciseFilter: ex => /lunge|fente|step|jumping|burpee|mountain|saut/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'glass_cathedral',
                name: 'Cathédrale de Verre',
                emoji: '⛪',
                color: '#22d3ee',
                description: 'Un lieu sacré entièrement en verre. Le moindre faux mouvement résonne dans l\'éternité.',
                briefing: 'Maîtrise totale. Contrôle chaque répétition. Le silence te juge.',
                primaryStat: 'SEN',
                exerciseFilter: ex => /squat|fente|lunge|pompe|push|équilibre|unilatéral|pistol|dips|traction/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'ash_wasteland',
                name: 'Terres de Cendre',
                emoji: '🌋',
                color: '#dc2626',
                description: 'Tout a brûlé ici, il y a longtemps. Les survivants ne sont plus tout à fait vivants.',
                briefing: 'Endurance pure. L\'air brûle tes poumons. Tiens la distance.',
                primaryStat: 'END',
                exerciseFilter: ex => /cardio|course|run|hiit|corde|rope|burpee/.test((ex.name || '').toLowerCase())
                                       || ex.type === 'cardio'
            },
            {
                id: 'clockwork_void',
                name: 'Néant Mécanique',
                emoji: '⚙️',
                color: '#94a3b8',
                description: 'Un vide rempli d\'engrenages géants qui tournent sans raison. Le temps y est une machine.',
                briefing: 'Cadence régulière. Synchronise-toi avec les rouages.',
                primaryStat: 'VIT',
                exerciseFilter: ex => /circuit|tabata|hiit|mountain|jumping|sprint/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'drowned_palace',
                name: 'Palais Englouti',
                emoji: '🏛️',
                color: '#0ea5e9',
                description: 'Un palais royal au fond d\'un océan oublié. La cour danse encore, lentement, dans l\'eau noire.',
                briefing: 'Mouvements fluides et continus. Ne lutte pas contre le courant.',
                primaryStat: 'END',
                exerciseFilter: ex => /natation|swim|cardio|rope|corde|rowing/.test((ex.name || '').toLowerCase())
                                       || ex.type === 'cardio'
            },
            {
                id: 'mirror_labyrinth',
                name: 'Labyrinthe de Miroirs',
                emoji: '🔮',
                color: '#a855f7',
                description: 'Mille reflets de toi, tous légèrement différents. L\'un d\'eux ment. Peut-être tous.',
                briefing: 'Tes sens te trahiront. Concentre-toi sur le vrai.',
                primaryStat: 'PER',
                exerciseFilter: ex => /unilatéral|single|pistol|turkish|équilibre|pallof/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'titan_graveyard',
                name: 'Cimetière de Titans',
                emoji: '💀',
                color: '#78716c',
                description: 'Les ossements de géants morts forment des montagnes. Quelque chose les fait encore bouger.',
                briefing: 'Soulève l\'impossible. Ici, on mesure ta force brute.',
                primaryStat: 'STR',
                exerciseFilter: ex => /deadlift|soulevé|squat|press|développé|barre|farmer/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'storm_peak',
                name: 'Pic de la Tempête',
                emoji: '⛰️',
                color: '#0891b2',
                description: 'Un sommet où la foudre ne s\'arrête jamais. L\'air est rare. Chaque pas est une victoire.',
                briefing: 'Explosivité. Frappe entre les éclairs. Sois rapide.',
                primaryStat: 'AGI',
                exerciseFilter: ex => /jumping|saut|box|plyo|burpee|sprint|lunge/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'whisper_marsh',
                name: 'Marais des Murmures',
                emoji: '🌿',
                color: '#16a34a',
                description: 'Une tourbière où chaque pas s\'enfonce. Des voix sous la boue appellent ton nom.',
                briefing: 'Mouvements lents et contrôlés. Ne force pas, enfonce-toi avec maîtrise.',
                primaryStat: 'SEN',
                exerciseFilter: ex => /fente|lunge|squat|step|pompe|push|gainage|unilatéral|équilibre/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'neon_megacity',
                name: 'Mégapole Néon',
                emoji: '🌃',
                color: '#d946ef',
                description: 'Une ville verticale sans fin, éclairée de néons morts. Les habitants ont oublié le sol.',
                briefing: 'Rythme urbain. Enchaîne sans pause. La ville ne dort pas.',
                primaryStat: 'VIT',
                exerciseFilter: ex => /hiit|circuit|tabata|jumping|mountain|burpee|sprint/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'bone_colosseum',
                name: 'Colisée d\'Os',
                emoji: '🏟️',
                color: '#b45309',
                description: 'Une arène bâtie dans la cage thoracique d\'une créature colossale. La foule n\'est qu\'écho.',
                briefing: 'Combat frontal. Pas d\'esquive. Donne tout, série après série.',
                primaryStat: 'STR',
                exerciseFilter: ex => /press|développé|bench|push|pompe|dips|rowing|traction|pull/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'frozen_aurora',
                name: 'Aurore Gelée',
                emoji: '❄️',
                color: '#38bdf8',
                description: 'Un ciel polaire figé en pleine aurore. Le froid mord, mais la beauté hypnotise.',
                briefing: 'Garde le corps chaud. Bouge en continu ou la glace te prendra.',
                primaryStat: 'END',
                exerciseFilter: ex => /cardio|course|run|hiit|corde|rope/.test((ex.name || '').toLowerCase())
                                       || ex.type === 'cardio'
            },
            {
                id: 'dream_engine',
                name: 'Machine à Rêves',
                emoji: '🌙',
                color: '#818cf8',
                description: 'Un mécanisme qui fabrique les songes de l\'humanité. Tu marches dans les rêves des autres.',
                briefing: 'Rien n\'est stable ici. Fie-toi à ton équilibre, pas à tes yeux.',
                primaryStat: 'PER',
                exerciseFilter: ex => /équilibre|unilatéral|pistol|turkish|planche|pallof/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'hollow_sun',
                name: 'Soleil Creux',
                emoji: '☀️',
                color: '#eab308',
                description: 'L\'intérieur d\'une étoile éteinte. Une cathédrale de lumière morte, vaste comme un monde.',
                briefing: 'Le combat final des braves. Force, endurance, volonté. Tout à la fois.',
                primaryStat: 'STR',
                exerciseFilter: ex => /squat|deadlift|press|développé|soulevé|burpee|traction/.test((ex.name || '').toLowerCase())
            }
        ];

        // ── MONSTRES PAR THÈME ─────────────────────────────────────────
        const RIFT_MONSTERS = {
            frozen_city: [
                { name: 'Statue Animée', emoji: '🗿', baseHp: 100 },
                { name: 'Habitant Cristallisé', emoji: '👤', baseHp: 130 },
                { name: 'Gardien de Glace', emoji: '🛡️', baseHp: 180 },
                { name: 'Sentinelle Figée', emoji: '⚔️', baseHp: 220 }
            ],
            organic_desert: [
                { name: 'Ver des Sables', emoji: '🐍', baseHp: 90 },
                { name: 'Scarabée Vivant', emoji: '🪲', baseHp: 110 },
                { name: 'Mante Chitineuse', emoji: '🦗', baseHp: 170 },
                { name: 'Léviathan Organique', emoji: '🐲', baseHp: 240 }
            ],
            underground_ocean: [
                { name: 'Anguille Aveugle', emoji: '🐍', baseHp: 100 },
                { name: 'Méduse Profonde', emoji: '🪼', baseHp: 130 },
                { name: 'Kraken Mineur', emoji: '🐙', baseHp: 200 },
                { name: 'Léviathan des Abysses', emoji: '🐋', baseHp: 260 }
            ],
            inverted_reality: [
                { name: 'Reflet Brisé', emoji: '🪞', baseHp: 110 },
                { name: 'Écho de Toi-même', emoji: '👁️', baseHp: 150 },
                { name: 'Ombre Inversée', emoji: '🌫️', baseHp: 200 },
                { name: 'Anti-Soi', emoji: '🌀', baseHp: 280 }
            ],
            living_hospital: [
                { name: 'Patient Oublié', emoji: '👤', baseHp: 90 },
                { name: 'Infirmière Suturée', emoji: '🩹', baseHp: 130 },
                { name: 'Chirurgien Perdu', emoji: '⚕️', baseHp: 180 },
                { name: 'Cœur Battant des Murs', emoji: '💗', baseHp: 250 }
            ],
            dimensional_train: [
                { name: 'Voyageur Sans Visage', emoji: '🎭', baseHp: 100 },
                { name: 'Contrôleur du Néant', emoji: '🎫', baseHp: 140 },
                { name: 'Conducteur Spectral', emoji: '👻', baseHp: 190 },
                { name: 'Locomotive Vivante', emoji: '🚂', baseHp: 270 }
            ],
            infinite_library: [
                { name: 'Page Errante', emoji: '📄', baseHp: 95 },
                { name: 'Gardien des Mots', emoji: '📖', baseHp: 130 },
                { name: 'Bibliothécaire Aveugle', emoji: '👓', baseHp: 185 },
                { name: 'Le Livre Interdit', emoji: '📕', baseHp: 250 }
            ],
            celestial_forge: [
                { name: 'Étincelle Vivante', emoji: '✨', baseHp: 110 },
                { name: 'Marteau Animé', emoji: '🔨', baseHp: 150 },
                { name: 'Forgeron de Lumière', emoji: '⚒️', baseHp: 200 },
                { name: 'Enclume Stellaire', emoji: '🌟', baseHp: 280 }
            ],
            carnivore_garden: [
                { name: 'Lierre Affamé', emoji: '🌿', baseHp: 90 },
                { name: 'Orchidée Dentée', emoji: '🌸', baseHp: 120 },
                { name: 'Ronce Reine', emoji: '🥀', baseHp: 180 },
                { name: 'Fleur-Mère Carnivore', emoji: '🌺', baseHp: 255 }
            ],
            glass_cathedral: [
                { name: 'Vitrail Brisé', emoji: '🔷', baseHp: 100 },
                { name: 'Choriste de Cristal', emoji: '🎶', baseHp: 135 },
                { name: 'Prêtre Translucide', emoji: '⛪', baseHp: 190 },
                { name: 'Cloche du Jugement', emoji: '🔔', baseHp: 260 }
            ],
            ash_wasteland: [
                { name: 'Cendreux Errant', emoji: '💨', baseHp: 95 },
                { name: 'Survivant Calciné', emoji: '🧟', baseHp: 130 },
                { name: 'Golem de Suie', emoji: '🗿', baseHp: 185 },
                { name: 'Phénix Éteint', emoji: '🦅', baseHp: 250 }
            ],
            clockwork_void: [
                { name: 'Rouage Égaré', emoji: '⚙️', baseHp: 100 },
                { name: 'Automate Cassé', emoji: '🤖', baseHp: 140 },
                { name: 'Horloger du Vide', emoji: '🕰️', baseHp: 195 },
                { name: 'Grande Mécanique', emoji: '🛠️', baseHp: 270 }
            ],
            drowned_palace: [
                { name: 'Courtisan Noyé', emoji: '👤', baseHp: 100 },
                { name: 'Danseuse des Abysses', emoji: '💃', baseHp: 135 },
                { name: 'Garde Royal Submergé', emoji: '🛡️', baseHp: 190 },
                { name: 'Roi des Profondeurs', emoji: '👑', baseHp: 265 }
            ],
            mirror_labyrinth: [
                { name: 'Reflet Trompeur', emoji: '🪞', baseHp: 105 },
                { name: 'Double Inversé', emoji: '👥', baseHp: 145 },
                { name: 'Gardien de Verre', emoji: '🔲', baseHp: 195 },
                { name: 'Le Vrai Toi', emoji: '🧍', baseHp: 275 }
            ],
            titan_graveyard: [
                { name: 'Os Rampant', emoji: '🦴', baseHp: 110 },
                { name: 'Crâne Géant', emoji: '💀', baseHp: 155 },
                { name: 'Carcasse Animée', emoji: '🦷', baseHp: 210 },
                { name: 'Titan Ressuscité', emoji: '🗿', baseHp: 290 }
            ],
            storm_peak: [
                { name: 'Élémentaire d\'Éclair', emoji: '⚡', baseHp: 100 },
                { name: 'Aigle de Foudre', emoji: '🦅', baseHp: 135 },
                { name: 'Spectre du Vent', emoji: '🌬️', baseHp: 185 },
                { name: 'Seigneur de la Tempête', emoji: '🌩️', baseHp: 260 }
            ],
            whisper_marsh: [
                { name: 'Feu Follet', emoji: '🔥', baseHp: 90 },
                { name: 'Noyé Murmurant', emoji: '💧', baseHp: 125 },
                { name: 'Sorcière des Tourbes', emoji: '🧙', baseHp: 180 },
                { name: 'Cœur du Marais', emoji: '🌿', baseHp: 245 }
            ],
            neon_megacity: [
                { name: 'Drone Hostile', emoji: '🛸', baseHp: 100 },
                { name: 'Hacker Fantôme', emoji: '💻', baseHp: 140 },
                { name: 'Exécuteur Cybernétique', emoji: '🤖', baseHp: 195 },
                { name: 'IA Souveraine', emoji: '🌐', baseHp: 270 }
            ],
            bone_colosseum: [
                { name: 'Gladiateur Squelette', emoji: '⚔️', baseHp: 110 },
                { name: 'Bête de l\'Arène', emoji: '🐗', baseHp: 150 },
                { name: 'Champion Déchu', emoji: '🛡️', baseHp: 205 },
                { name: 'Colosse de l\'Arène', emoji: '🏟️', baseHp: 285 }
            ],
            frozen_aurora: [
                { name: 'Esprit de Givre', emoji: '❄️', baseHp: 95 },
                { name: 'Loup des Glaces', emoji: '🐺', baseHp: 130 },
                { name: 'Géant de Frimas', emoji: '🧊', baseHp: 185 },
                { name: 'Reine de l\'Aurore', emoji: '👑', baseHp: 255 }
            ],
            dream_engine: [
                { name: 'Cauchemar Naissant', emoji: '🌫️', baseHp: 100 },
                { name: 'Songe Errant', emoji: '💭', baseHp: 140 },
                { name: 'Tisseur de Rêves', emoji: '🕸️', baseHp: 195 },
                { name: 'Le Dormeur Éternel', emoji: '🌙', baseHp: 270 }
            ],
            hollow_sun: [
                { name: 'Flamme Morte', emoji: '🔥', baseHp: 120 },
                { name: 'Gardien Solaire', emoji: '☀️', baseHp: 165 },
                { name: 'Cœur de l\'Étoile', emoji: '💛', baseHp: 220 },
                { name: 'Le Vide Lumineux', emoji: '🌟', baseHp: 300 }
            ]
        };

        // ── PRÉFIXES UNIQUES POUR LES NOMS DE FAILLES ──────────────────
        // Le nom est révélé seulement à l'entrée (le scénario le précise)
        const RIFT_NAME_PREFIXES = [
            'la Faille de', 'la Brèche de', 'la Déchirure de', 'l\'Ouverture de',
            'l\'Antre de', 'la Cicatrice de', 'le Couloir de', 'le Seuil de'
        ];

        // ── MODIFICATEURS DE FAILLES ───────────────────────────────────
        // Appliqués aléatoirement par-dessus n'importe quel thème.
        // hpMult : multiplie les HP des monstres. xpMult : multiplie l'XP final.
        // hideHp : masque les HP restants. flag : marqueur pour effets visuels.
        // Le 1er (id:'none') = Faille normale, le plus fréquent (poids élevé).
        const RIFT_MODIFIERS = [
            { id:'none',      name:'Standard',    emoji:'',   color:'#94a3b8', weight:48,
              desc:'', hpMult:1.0, xpMult:1.0, hideHp:false },
            { id:'overload',  name:'Surcharge',   emoji:'⚡', color:'#fbbf24', weight:14,
              desc:'Les monstres sont gonflés d\'énergie. +50% HP, mais le double d\'XP.',
              hpMult:1.5, xpMult:2.0, hideHp:false },
            { id:'fog',       name:'Brouillard',  emoji:'🌫️', color:'#64748b', weight:12,
              desc:'Un voile masque tes ennemis. Tu ne vois plus leurs HP. Frappe à l\'aveugle.',
              hpMult:1.0, xpMult:1.3, hideHp:true },
            { id:'elite',     name:'Élite',       emoji:'👑', color:'#a855f7', weight:10,
              desc:'Une seule entité, colossale. Pas de vagues — juste un mur de chair à abattre.',
              hpMult:1.0, xpMult:1.6, hideHp:false, eliteSingleWave:true },
            { id:'frenzy',    name:'Frénésie',    emoji:'🔥', color:'#ef4444', weight:10,
              desc:'La Faille s\'effondre vite. Durée de vie réduite, mais récompense majorée.',
              hpMult:0.85, xpMult:1.5, hideHp:false, lifetimeCut:0.5 },
            { id:'echo',      name:'Écho',        emoji:'🪞', color:'#06b6d4', weight:6,
              desc:'Tout est dédoublé. Plus de monstres, plus d\'XP. Le combat sera long.',
              hpMult:0.7, xpMult:1.8, hideHp:false, extraWave:true },
            { id:'lode',      name:'Filon',       emoji:'💎', color:'#10b981', weight:8,
              desc:'Une veine de minéraux affleure dans cette Faille. Récolte triplée pour qui la ferme.',
              hpMult:1.1, xpMult:1.2, hideHp:false, mineralMult:3.0 },
            { id:'motherlode',name:'Filon Majeur',emoji:'🏆', color:'#fbbf24', weight:3, rankMin:'B',
              desc:'Un gisement d\'une richesse exceptionnelle. La récolte de minéraux est quintuplée.',
              hpMult:1.25, xpMult:1.3, hideHp:false, mineralMult:5.0 },
            // ── MUTATIONS RANG A+ : règles de combat altérées (débloquées au rang A) ──
            { id:'bloodmoon', name:'Lune de Sang', emoji:'🌕', color:'#dc2626', weight:8, rankMin:'A',
              desc:'Aucun soin entre les vagues. Chaque point de vie compte. XP plus que doublée.',
              hpMult:1.0, xpMult:2.2, hideHp:false, noHeal:true },
            { id:'tempest',   name:'Tempête',      emoji:'⛈️', color:'#0ea5e9', weight:8, rankMin:'A',
              desc:'Les monstres frappent 50% plus fort — mais toi aussi (+25%). Un duel déchaîné.',
              hpMult:1.0, xpMult:1.8, hideHp:false, counterMult:1.5, playerDmgMult:1.25 },
            { id:'volcanic',  name:'Volcanique',   emoji:'🌋', color:'#ea580c', weight:7, rankMin:'A',
              desc:'Chaque vague vaincue explose et te brûle (10% de tes HP max). Termine vite.',
              hpMult:0.9, xpMult:2.0, hideHp:false, eruptPct:0.10 },
            { id:'anomaly',   name:'Anomalie',    emoji:'🌌', color:'#fbbf24', weight:2,
              desc:'Une Faille où l\'Oubli a mordu plus profond qu\'ailleurs. Extrêmement rare. Une récompense légendaire t\'attend si tu la fermes.',
              hpMult:1.4, xpMult:3.0, hideHp:false, isEvent:true, guaranteedLegendary:true },
            { id:'worldboss', name:'Boss Mondial', emoji:'👹', color:'#dc2626', weight:0,
              desc:'Une entité colossale, unique cette semaine. Tout le monde affronte le même monstre. Récompense légendaire garantie.',
              hpMult:1.0, xpMult:3.0, hideHp:false, guaranteedLegendary:true }
        ];

        function awakPickRiftModifier() {
            // Les mutations rankMin ne sont éligibles qu'à partir du rang indiqué
            const _order = ['E','D','C','B','A','S','SS','SSS'];
            const _pRank = (typeof awakGetRank === 'function') ? awakGetRank().id : 'E';
            const pool = RIFT_MODIFIERS.filter(m => m.weight > 0 && (!m.rankMin || _order.indexOf(_pRank) >= _order.indexOf(m.rankMin)));
            const total = pool.reduce((s, m) => s + m.weight, 0);
            let r = Math.random() * total;
            for (const m of pool) {
                r -= m.weight;
                if (r <= 0) return m;
            }
            return RIFT_MODIFIERS[0];
        }
        function awakGetRiftModifier(id) {
            return RIFT_MODIFIERS.find(m => m.id === id) || RIFT_MODIFIERS[0];
        }
        window.RIFT_MODIFIERS = RIFT_MODIFIERS;

        function awakRiftsLoad() {
            try {
                const profileId = typeof getCurrentProfileId === 'function' ? getCurrentProfileId() : null;
                const key = profileId ? `${RIFT_STORAGE_KEY}_${profileId}` : RIFT_STORAGE_KEY;
                return JSON.parse(localStorage.getItem(key) || '[]');
            } catch(e) { return []; }
        }

        function awakRiftsSave(rifts) {
            try {
                const profileId = typeof getCurrentProfileId === 'function' ? getCurrentProfileId() : null;
                const key = profileId ? `${RIFT_STORAGE_KEY}_${profileId}` : RIFT_STORAGE_KEY;
                // v1616 : une Faille s'ouvre pendant qu'on regarde l'onglet Jeu → la carte suit
                // (avant : toast « Une Faille s'est ouverte » + carte « Aucune brèche »)
                let _avant = 0; try { _avant = (JSON.parse(localStorage.getItem(key) || '[]') || []).filter(r => r && !r.completed).length; } catch (e) { _awkE(e); }
                localStorage.setItem(key, JSON.stringify(rifts));
                const _apres = (rifts || []).filter(r => r && !r.completed).length;
                if (_apres > _avant) setTimeout(() => {
                    try {
                        const t = document.getElementById('gameTab');
                        if (t && t.classList.contains('active') && !document.body.classList.contains('in-session') && typeof renderGameTab === 'function') renderGameTab();
                    } catch (e) { _awkE(e); }
                }, 400);
            } catch(e) { _awkE(e); }
        }

        /**
         * Génère une nouvelle Faille aléatoire
         * Rang basé sur le rang du joueur (±1)
         */

        // ══════════════════════════════════════════════════════════════
        // ⚡ FAILLES D'ASSAUT — combat au chrono
        // --------------------------------------------------------------
        // Second type de Faille, à côté des Failles classiques (séries et
        // répétitions). Ici, pas de saisie : un chrono tourne et le joueur
        // FRAPPE automatiquement toutes les N secondes tant qu'il bouge.
        // Chaque Assaut a un THÈME qui restreint le pool d'exercices —
        // deux Assauts ne se ressemblent plus.
        // ⚠️ Le thème FILTRE un pool, il ne dicte pas une liste : les
        // douleurs déclarées, le matériel réel et les protections enfant
        // continuent de s'appliquer. Un Assaut « haltères » n'apparaît
        // pas si le joueur n'a pas d'haltères.
        // ══════════════════════════════════════════════════════════════


        // ⏳ FIN DU CHRONO — le monstre est-il tombé ?
        // Appelé quand la séance d'Assaut arrive au bout de ses exercices.
        function awakAssautFinDuTemps() {
            const sess = (typeof awakActiveRiftSession !== 'undefined') ? awakActiveRiftSession : null;
            if (!sess || !sess.rift) return false;
            const wave = sess.rift.waves && sess.rift.waves[sess.rift.currentWaveIdx || 0];
            if (!wave || wave.hpCurrent <= 0) return false;   // vaincu : rien à faire

            awakAssautStop();
            const pct = Math.round((wave.hpCurrent / (wave.hpMax || 1)) * 100);
            const dejaProlonge = !!sess._prolonge;

            const ov = document.createElement('div');
            ov.id = 'awakAssautEchecModal';
            ov.style.cssText = 'position:fixed;inset:0;z-index:12000;background:rgba(0,0,0,0.94);'
                + 'backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;';
            ov.innerHTML =
                '<div style="width:100%;max-width:420px;background:linear-gradient(160deg,#140e18,#0d0d12);'
              +   'border:1px solid rgba(168,85,247,0.4);border-radius:20px;padding:24px;text-align:center;">'
              +   '<div style="margin-bottom:6px;display:flex;justify-content:center;">' + (window.AwakIcon ? AwakIcon.get('faille', 40, '#c084fc') : '') + '</div>'
              +   '<div style="font-size:0.6em;letter-spacing:2.5px;color:#c084fc;font-weight:900;">◈ LE TEMPS EST ÉCOULÉ</div>'
              +   '<div style="font-family:var(--font-display),sans-serif;font-size:1.3em;font-weight:700;color:#fff;margin:6px 0 12px;">'
              +     'Il tient encore</div>'
              +   '<div style="height:9px;background:rgba(0,0,0,0.5);border-radius:99px;overflow:hidden;margin-bottom:8px;">'
              +     '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#7e22ce,#c084fc);"></div></div>'
              +   '<div style="font-size:0.8em;color:#94a3b8;margin-bottom:18px;">'
              +     'Il lui reste <strong style="color:#c084fc;">' + pct + ' %</strong> de vie.</div>'
              + (dejaProlonge
                  ? ('<div style="font-size:0.8em;color:#e2e8f0;line-height:1.55;margin-bottom:16px;">'
                     + 'Tu as déjà donné tout ce que tu avais. La brèche reste ouverte — '
                     + '<strong style="color:#4ade80;">les dégâts infligés sont conservés</strong>. Reviens la finir.</div>')
                  : ('<div style="font-size:0.8em;color:#e2e8f0;line-height:1.55;margin-bottom:16px;">'
                     + 'Tu peux t\'arrêter là — la brèche restera ouverte et '
                     + '<strong style="color:#4ade80;">les dégâts sont conservés</strong> — '
                     + 'ou pousser encore cinq minutes.</div>'
                     + '<button onclick="awakAssautProlonger()" style="width:100%;padding:14px;border-radius:14px;'
                     + 'background:linear-gradient(135deg,#a855f7,#7e22ce);border:none;color:#fff;font-weight:900;'
                     + 'font-size:0.85em;letter-spacing:1px;cursor:pointer;margin-bottom:9px;">'
                     + '⚡ ENCORE 5 MINUTES</button>'))
              +   '<button onclick="awakAssautAbandonner()" style="width:100%;padding:12px;border-radius:13px;'
              +     'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.14);color:#94a3b8;'
              +     'font-weight:800;font-size:0.78em;letter-spacing:1px;cursor:pointer;">'
              +     (dejaProlonge ? 'TERMINER' : 'S\'ARRÊTER LÀ') + '</button>'
              + '</div>';
            document.body.appendChild(ov);
            return true;
        }
        window.awakAssautFinDuTemps = awakAssautFinDuTemps;

        // ⚡ +5 minutes : on rallonge la séance avec de nouveaux exercices
        // du même thème, et le chrono d'attaque repart.
        function awakAssautProlonger() {
            document.getElementById('awakAssautEchecModal')?.remove();
            const sess = (typeof awakActiveRiftSession !== 'undefined') ? awakActiveRiftSession : null;
            if (!sess || !currentWorkout) return;
            sess._prolonge = true;
            try {
                const rift = sess.rift;
                const rallonge = awakBuildAssautWorkout(rift);
                if (rallonge && rallonge.exercises && rallonge.exercises.length) {
                    // ~5 min : on prend les premiers exercices de la rallonge
                    const ajout = rallonge.exercises.slice(0, 7);
                    currentWorkout.exercises = currentWorkout.exercises.concat(ajout);
                    if (typeof showToast === 'function') showToast('⚡ Cinq minutes de plus. Finis-le.', 'info', 2600);
                    awakAssautStart();
                    if (typeof nextExercise === 'function') nextExercise();
                    else if (typeof startExercise === 'function') startExercise();
                }
            } catch (e) { _awkE(e); }
        }
        window.awakAssautProlonger = awakAssautProlonger;

        // 🚪 S'arrêter : la Faille RESTE ouverte, les dégâts sont conservés.
        // Principe de l'app : on ne perd jamais l'effort réellement fourni.
        function awakAssautAbandonner() {
            document.getElementById('awakAssautEchecModal')?.remove();
            awakAssautStop();
            try {
                if (typeof showToast === 'function') {
                    showToast('◈ La brèche reste ouverte. Tes coups ont porté.', 'info', 3000);
                }
            } catch (e) { _awkE(e); }
            try { if (typeof awakAbandonRift === 'function') { awakActiveRiftSession = null; } } catch (e) { _awkE(e); }
            try {
                currentWorkout = null;
                if (typeof clearActiveWorkoutState === 'function') clearActiveWorkoutState();
                if (typeof stopTimer === 'function') stopTimer();
                document.getElementById('exerciseView')?.classList.add('hidden');
                document.body.classList.remove('in-session', 'workout-fullscreen');
                // ⚠️ On bascule d'ABORD vers le Jeu, on réaffiche la sélection
                // de séance ENSUITE : l'inverse laissait voir l'onglet
                // Entraîner pendant une frame avant la bascule.
                if (typeof switchTab === 'function') switchTab('game');
                const ws = document.getElementById('workoutSelection');
                if (ws) ws.style.display = '';
            } catch (e) { _awkE(e); }
        }
        window.awakAssautAbandonner = awakAssautAbandonner;

        // ⚔️ ATTAQUE AU CHRONO — le cœur de l'Assaut.
        // Pendant l'effort, le joueur frappe tout seul toutes les CADENCE
        // secondes. Aucune saisie : bouger EST l'attaque.
        const ASSAUT_CADENCE = 15;   // secondes entre deux frappes
        let _assautTimer = null;

        function awakAssautStart() {
            awakAssautStop();
            _assautTimer = setInterval(function () {
                try {
                    if (!currentWorkout || !currentWorkout._isAssaut) { awakAssautStop(); return; }
                    // On ne frappe QUE pendant un exercice, jamais pendant le repos
                    const ex = currentWorkout.exercises[currentExerciseIndex];
                    if (!ex || ex.isRest) return;
                    if (typeof isPaused !== 'undefined' && isPaused) return;
                    awakAssautFrapper();
                } catch (e) { _awkE(e); }
            }, ASSAUT_CADENCE * 1000);
        }
        function awakAssautStop() {
            if (_assautTimer) { clearInterval(_assautTimer); _assautTimer = null; }
        }
        window.awakAssautStart = awakAssautStart;
        window.awakAssautStop = awakAssautStop;

        function awakAssautFrapper() {
            const sess = (typeof awakActiveRiftSession !== 'undefined') ? awakActiveRiftSession : null;
            if (!sess || !sess.rift) return;
            const wave = sess.rift.waves && sess.rift.waves[sess.rift.currentWaveIdx || 0];
            if (!wave || wave.hpCurrent <= 0) return;

            // Mêmes dégâts que le combat classique : le build compte autant.
            // Même formule que le combat classique (socle + stat thématique avec
            // rendement décroissant), pondérée à 0,8 : une frappe automatique
            // vaut un peu moins qu'une série validée à la main.
            let degats = 40;
            try {
                const st = (typeof getPlayerEquipStats === 'function') ? getPlayerEquipStats() : {};
                const primaire = st[(sess.rift.primaryStat || 'STR')] || 10;
                const SOFT = 80;
                const eff = primaire <= SOFT ? primaire : SOFT + Math.sqrt(primaire - SOFT) * Math.sqrt(SOFT);
                degats = Math.max(10, Math.round((4 + eff * 1.5) * 0.8));
            } catch (e) { _awkE(e); }

            wave.hpCurrent = Math.max(0, wave.hpCurrent - degats);
            // 💾 SAUVEGARDE IMMÉDIATE des dégâts.
            // ⚠️ `sess.rift` est une RÉFÉRENCE à la Faille stockée : les PV
            // baissaient bien en mémoire, mais sans awakRiftsSave() rien
            // n'était écrit sur disque. Fermer l'app après un Assaut abandonné
            // faisait donc repartir le monstre à plein — précisément le
            // scénario où l'on veut que la progression tienne.

            // 💎 Chaque frappe compte comme une SÉRIE d'effort : sans ça,
            // setsCompleted resterait à 0 et dropMineralsForRift renverrait
            // une liste vide — un Assaut ne rapporterait aucun minerai.
            // ⚖️ Une frappe vaut une DEMI-série : un Assaut de 6 min produit
            // ~12 frappes, soit 6 séries — comparable à une Faille classique
            // (~9 séries) rapportée à sa durée. Sans cette pondération,
            // l'Assaut serait la façon la plus rentable de farmer.
            try {
                sess._frappes = (sess._frappes || 0) + 1;
                sess.setsCompleted = Math.floor(sess._frappes / 2);
                sess.totalDamageDealt = (sess.totalDamageDealt || 0) + degats;
            } catch (e) { _awkE(e); }
            // (sauvegarde déjà faite plus haut — voir v997)

            const pct = Math.round((wave.hpCurrent / (wave.hpMax || 1)) * 100);
            try {
                if (typeof showToast === 'function') {
                    showToast('⚔️ −' + degats + ' PV · ' + (wave.name || 'ennemi') + ' ' + pct + ' %',
                              wave.hpCurrent <= 0 ? 'success' : 'info', 1600);
                }
            } catch (e) { _awkE(e); }
            try { if (typeof _renderAssautHpBar === 'function') _renderAssautHpBar(); } catch (e) { _awkE(e); }

            // Vague vaincue → passer à la suivante, ou Faille terminée
            if (wave.hpCurrent <= 0) {
                const idx = (sess.rift.currentWaveIdx || 0) + 1;
                if (sess.rift.waves && idx < sess.rift.waves.length) {
                    sess.rift.currentWaveIdx = idx;
                    try { if (typeof showToast === 'function') showToast('◈ Vague suivante', 'info', 1800); } catch (e) { _awkE(e); }
                } else {
                    awakAssautStop();
                    // ⚠️ FERMER LA SÉANCE AVANT d'ouvrir l'écran de victoire.
                    // La modale de récompense s'affichait bien, mais SOUS
                    // l'écran de séance en plein écran (body.workout-fullscreen),
                    // qui couvre tout le viewport : on ne voyait donc rien se
                    // passer alors que la Faille était bel et bien terminée.
                    try {
                        if (typeof stopTimer === 'function') stopTimer();
                        document.getElementById('exerciseView')?.classList.add('hidden');
                        document.body.classList.remove('in-session', 'workout-fullscreen');
                        document.getElementById('awakAssautHpBar')?.remove();
                        const _ws = document.getElementById('workoutSelection');
                        if (_ws) _ws.style.display = '';
                    } catch (e) { _awkE(e); }
                    try { if (typeof awakCompleteRift === 'function') awakCompleteRift(); } catch (e) { _awkE(e); }
                }
            }

            // 💾 SAUVEGARDE APRÈS l'avancement de vague.
            // ⚠️ Elle avait lieu AVANT : currentWaveIdx tout juste
            // incrémenté n'était donc pas écrit sur disque, et la
            // vague suivante ne démarrait jamais vraiment.
            // ⚠️ awakRiftsSave() ATTEND la liste complète : l'appeler sans
            // argument écrirait `undefined` et effacerait TOUTES les Failles.
            try {
                if (typeof awakRiftsLoad === 'function' && typeof awakRiftsSave === 'function') {
                    const _all = awakRiftsLoad();
                    const _i = _all.findIndex(function (r) { return r && r.id === sess.rift.id; });
                    if (_i >= 0) { _all[_i] = sess.rift; awakRiftsSave(_all); }
                }
            } catch (e) { _awkE(e); }
        }

        // Barre de vie de l'Assaut, en haut de l'écran d'exercice
        function _renderAssautHpBar() {
            const sess = (typeof awakActiveRiftSession !== 'undefined') ? awakActiveRiftSession : null;
            if (!sess || !sess.rift || !currentWorkout || !currentWorkout._isAssaut) return;
            const wave = sess.rift.waves && sess.rift.waves[sess.rift.currentWaveIdx || 0];
            if (!wave) return;
            const host = document.getElementById('exerciseView');
            if (!host) return;
            let bar = document.getElementById('awakAssautHpBar');
            if (!bar) {
                bar = document.createElement('div');
                bar.id = 'awakAssautHpBar';
                bar.style.cssText = 'margin:0 0 12px;padding:10px 13px;border-radius:14px;'
                    + 'background:linear-gradient(135deg,rgba(168,85,247,0.12),rgba(0,0,0,0.25));'
                    + 'border:1px solid rgba(168,85,247,0.35);';
                host.insertBefore(bar, host.firstChild);
            }
            const pct = Math.round((wave.hpCurrent / (wave.hpMax || 1)) * 100);
            const nv = (sess.rift.currentWaveIdx || 0) + 1;
            const nt = (sess.rift.waves || []).length;
            bar.innerHTML =
                '<div style="display:flex;align-items:center;gap:9px;margin-bottom:7px;">'
              +   '<span style="display:inline-flex;">' + (window.AwakIcon ? AwakIcon.get('faille', 20, '#c084fc') : '') + '</span>'
              +   '<div style="flex:1;min-width:0;">'
              +     '<div style="font-size:0.58em;color:#c084fc;font-weight:900;letter-spacing:1.5px;">VAGUE ' + nv + ' / ' + nt + '</div>'
              +     '<div style="font-size:0.74em;color:#e2e8f0;font-weight:800;">' + wave.hpCurrent + ' / ' + wave.hpMax + ' PV</div>'
              +   '</div>'
              +   '<div style="font-size:0.9em;font-weight:900;color:#c084fc;">' + pct + ' %</div>'
              + '</div>'
              + '<div style="height:9px;background:rgba(0,0,0,0.4);border-radius:99px;overflow:hidden;">'
              +   '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#7e22ce,#c084fc);border-radius:99px;transition:width .4s;"></div>'
              + '</div>';
        }
        window._renderAssautHpBar = _renderAssautHpBar;

        const ASSAUT_THEMES = [
            { id: 'corps',    name: 'La Meute',        emoji: '🐺', color: '#4ade80',
              desc: 'Ils arrivent vite et en nombre. Rien pour te défendre que ton corps.',
              filtre: (e, eq) => eq.every(x => ['Poids du corps', 'Aucun'].includes(x)),
              besoin: null },
            { id: 'fonte',    name: 'Le Poids du Monde', emoji: '🏋️', color: '#f59e0b',
              desc: 'Cette Faille pèse. Chaque geste doit porter une charge.',
              filtre: (e, eq) => eq.some(x => /haltère|barre/i.test(x)),
              besoin: /^(haltères|barre)$/i },
            { id: 'souffle',  name: 'La Course Sans Fin', emoji: '💨', color: '#38bdf8',
              desc: 'Elle ne frappe pas. Elle attend que tu ralentisses.',
              filtre: (e) => /saut|jump|burpee|jack|high knee|climber|corde à sauter|sprint|montée/i.test(e.name),
              besoin: null },
            { id: 'tension',  name: 'Les Liens', emoji: '🎗️', color: '#a855f7',
              desc: 'Quelque chose tire dans l\'autre sens. Résiste.',
              filtre: (e, eq) => eq.some(x => /élastique|kettlebell/i.test(x)),
              besoin: /^(élastique|kettlebell)$/i }
        ];

        // 🐛 v1248 : même règle que le filtre de sécurité de showWorkoutPreparation.
        // `isExerciseAvailable` n'existe pas : un Assaut tirait des exercices dont
        // le matériel n'est pas coché (tapis, corde, roue…). La préparation les
        // retirait ensuite, laissant deux « Repos » d'affilée : l'exercice
        // semblait sauter directement au temps de repos.
        function _assautMaterielOk(e) {
            try {
                if (typeof getSelectedEquipmentNames !== 'function') return true;
                const dispo = new Set(getSelectedEquipmentNames());
                dispo.add('Poids du corps'); dispo.add('Aucun');
                const eq = e.equipment || [];
                return eq.length === 0 || eq.some(x => dispo.has(x));
            } catch (err) { return true; }
        }

        // v1317 : UN SEUL matériel par Assaut. On ne change pas d'équipement au
        // chrono (haltères puis barre puis élastique) : l'Assaut se fait soit au
        // poids du corps, soit avec une seule « arme ». Clé = matériel hors poids
        // du corps ; un exercice qui demande deux choses (barre + banc) est écarté.
        function _assautCleMateriel(e) {
            const eq = (e.equipment || []).filter(x => x && x !== 'Poids du corps' && x !== 'Aucun');
            return eq.length > 1 ? null : (eq[0] || '');
        }
        const ASSAUT_MIN_EXOS = 4;
        // Groupes jouables d'un pool : { cle: [exercices] } avec au moins 4 exercices
        function _assautGroupes(pool, theme) {
            const g = {};
            pool.forEach(e => {
                const k = _assautCleMateriel(e);
                if (k === null) return;
                if (theme && theme.id === 'corps' && k !== '') return;
                if (theme && theme.besoin && !(k && theme.besoin.test(k))) return;
                (g[k] = g[k] || []).push(e);
            });
            Object.keys(g).forEach(k => { if (g[k].length < ASSAUT_MIN_EXOS) delete g[k]; });
            return g;
        }
        // Choisit (et retient sur la Faille) le matériel de l'Assaut
        function _assautChoisirArme(rift, groupes) {
            const cles = Object.keys(groupes);
            if (!cles.length) return null;
            if (rift && rift.assautArme != null && groupes[rift.assautArme]) return rift.assautArme;
            const k = cles[Math.floor(Math.random() * cles.length)];
            try { if (rift) rift.assautArme = k; } catch (e) { _awkE(e); }
            return k;
        }

        // Thèmes réellement disponibles pour ce joueur (matériel du lieu actif)
        function _assautThemesDispo() {
            let dispo = [];
            try {
                const pool = (typeof _dbMuscu === 'function' ? _dbMuscu() : exerciseDatabase)
                    .filter(e => e.type === 'exercise');
                ASSAUT_THEMES.forEach(t => {
                    const filtres = pool.filter(e => {
                        const eq = (e.equipment && e.equipment.length) ? e.equipment : ['Poids du corps'];
                        // matériel réellement disponible ?
                        if (typeof awakExerciseBlockedByLocation === 'function'
                            && awakExerciseBlockedByLocation(e)) return false;
                        if (!_assautMaterielOk(e)) return false;
                        return t.filtre(e, eq);
                    });
                    // il faut de quoi varier AVEC UN SEUL matériel
                    if (Object.keys(_assautGroupes(filtres, t)).length) dispo.push(t);
                });
            } catch (e) { _awkE(e); }
            // Le corps est toujours possible : jamais de liste vide.
            if (!dispo.length) dispo = [ASSAUT_THEMES[0]];
            return dispo;
        }

        // Construit la séance d'un Assaut : uniquement du TEMPS.
        // Aucune saisie, aucun choix — le joueur bouge, le chrono frappe.
        function awakBuildAssautWorkout(rift) {
            const theme = ASSAUT_THEMES.find(t => t.id === rift.assautTheme) || ASSAUT_THEMES[0];
            let pool = (typeof _dbMuscu === 'function' ? _dbMuscu() : exerciseDatabase)
                .filter(e => e.type === 'exercise')
                .filter(e => {
                    const eq = (e.equipment && e.equipment.length) ? e.equipment : ['Poids du corps'];
                    if (typeof awakExerciseBlockedByLocation === 'function'
                        && awakExerciseBlockedByLocation(e)) return false;
                    if (!_assautMaterielOk(e)) return false;
                    return theme.filtre(e, eq);
                });

            // 🩹 Douleurs déclarées : on retire les exercices concernés.
            try {
                if (window.AwakPain && typeof window.AwakPain.filterExercises === 'function') {
                    pool = window.AwakPain.filterExercises(pool);
                }
            } catch (e) { _awkE(e); }
            // 🧒 Profil enfant : poids du corps uniquement.
            try {
                if (window.AwakYouth && typeof window.AwakYouth.isChild === 'function'
                    && window.AwakYouth.isChild()) {
                    pool = pool.filter(e => {
                        const eq = (e.equipment && e.equipment.length) ? e.equipment : ['Poids du corps'];
                        return eq.every(x => ['Poids du corps', 'Aucun'].includes(x));
                    });
                }
            } catch (e) { _awkE(e); }
            // v1478 : pas d'échauffement ni d'exercices pour enfants dans un Assaut
            try { const _pa = pool.filter(awakExoCombatOk); if (_pa.length >= 6) pool = _pa; } catch (e) { _awkE(e); }
            // v1317 : un seul matériel (ou poids du corps seul) pour tout l'Assaut
            let _arme = null;
            {
                const groupes = _assautGroupes(pool, theme);
                _arme = _assautChoisirArme(rift, groupes);
                pool = _arme === null ? [] : groupes[_arme];
            }
            // 🔄 REPLI ÉQUIPEMENT — le joueur a pu changer de lieu depuis
            // l'apparition de la Faille (haltères à la maison, rien en voyage).
            // Plutôt qu'une Faille injouable, elle se rabat sur le corps :
            // narrativement, « tes armes ne sont pas là, il faudra faire sans ».
            let _replié = false;
            if (pool.length < 4) {
                _replié = true;
                pool = (typeof _dbMuscu === 'function' ? _dbMuscu() : exerciseDatabase)
                    .filter(e => e.type === 'exercise')
                    .filter(e => {
                        if (typeof awakExerciseBlockedByLocation === 'function'
                            && awakExerciseBlockedByLocation(e)) return false;
                        return _assautCleMateriel(e) === '';
                    });
                _arme = '';
                try {
                    if (window.AwakPain && typeof window.AwakPain.filterExercises === 'function') {
                        pool = window.AwakPain.filterExercises(pool);
                    }
                } catch (e) { _awkE(e); }
            }
            if (!pool.length) return null;

            // Mélange puis sélection, en évitant les variantes du même mouvement
            const melange = pool.slice().sort(() => Math.random() - 0.5);
            const choisis = [];
            const fams = {};
            for (const e of melange) {
                const f = (typeof _famille === 'function') ? _famille(e.name) : e.name;
                if (fams[f]) continue;
                fams[f] = true;
                choisis.push(e);
                if (choisis.length >= 6) break;
            }
            while (choisis.length < 4 && melange.length) choisis.push(melange[choisis.length]);

            const TRAVAIL = 40, REPOS = 20;
            const exercises = [];
            choisis.forEach((e, i) => {
                exercises.push({ ...e, mode: 'timer', duration: TRAVAIL, _assaut: true });
                if (i < choisis.length - 1) {
                    exercises.push({ name: 'Repos', duration: REPOS, isRest: true, mode: 'timer' });
                }
            });

            return {
                name: theme.emoji + ' ' + theme.name,
                type: 'assaut',
                _isRift: true,
                _isAssaut: true,
                _riftId: rift.id,
                _assautTheme: theme.id,
                _assautReplie: _replié,
                _assautArme: _arme || '',
                exercises: exercises,
                duration: Math.round(exercises.reduce((n, x) => n + (x.duration || 0), 0) / 60)
            };
        }
        window.awakBuildAssautWorkout = awakBuildAssautWorkout;
        window.ASSAUT_THEMES = ASSAUT_THEMES;
        // Durée prévue d'un Assaut (6 × 40 s + 5 repos de 20 s) et son matériel,
        // pour le briefing. Le matériel est choisi ici et retenu sur la Faille.
        function awakAssautApercu(rift) {
            let arme = '', n = 6;
            try { const w = awakBuildAssautWorkout(rift); if (w) { arme = w._assautArme || ''; n = w.exercises.filter(x => !x.isRest).length || 6; } } catch (e) { _awkE(e); }
            const sec = n * 40 + (n - 1) * 20;
            return { sec: sec, n: n, label: Math.floor(sec / 60) + ' min ' + String(sec % 60).padStart(2, '0'), arme: arme || 'Poids du corps' };
        }
        window.awakAssautApercu = awakAssautApercu;

        // ⚖️ ÉQUILIBRAGE v1218 (simulation de progression sur 12 mois, 3 profils) :
        // les PV d'origine étaient calibrés pour un joueur aux stats de départ.
        // Avec les points, l'équipement, la classe et les compagnons, les dégâts
        // d'un joueur sont multipliés par ~60 de E à S, les PV des monstres par ~8
        // seulement → une série tuait une vague dès le 1er mois.
        // Cible au rang égal : ~3 séries par vague, ~6 par boss (à l'objectif de reps).
        // Les Assauts (dégâts au chrono) gardent leurs PV d'origine.
        const AWAK_HP_SCALE      = { E: 2, D: 4.5, C: 10, B: 15, A: 13, S: 15, SS: 15, SSS: 15 };
        const AWAK_HP_SCALE_BOSS = { E: 1, D: 1,   C: 1.3, B: 1.6, A: 2, S: 2.2, SS: 2.2, SSS: 2.2 };
        function awakRiftHpScale(rank, isBoss) {
            const n = AWAK_HP_SCALE[rank] || 15;
            return isBoss ? n * (AWAK_HP_SCALE_BOSS[rank] || 2.2) : n;
        }
        window.awakRiftHpScale = awakRiftHpScale;

        function awakGenerateRift(forceRank) {
            const playerRank = awakGetRank();
            const rankIds = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
            const playerRankIdx = rankIds.indexOf(playerRank.id);

            // Faille ±1 du rang du joueur, jamais au-dessus du max
            let riftRank;
            if (forceRank) {
                riftRank = forceRank;
            } else {
                // 60% même rang, 25% +1, 15% -1
                const r = Math.random();
                let offset = 0;
                if (r < 0.6) offset = 0;
                else if (r < 0.85) offset = 1;
                else offset = -1;

                let targetIdx = Math.max(0, Math.min(rankIds.length - 1, playerRankIdx + offset));
                // Joueur E ne reçoit pas S
                riftRank = rankIds[targetIdx];
            }

            // Choisir un thème aléatoire (v1569 : « le combat final des braves » pas avant le rang B)
            const _themesRang = RIFT_THEMES.filter(t => !(t.id === 'hollow_sun' && ['E', 'D', 'C'].indexOf(riftRank) >= 0));
            const theme = _themesRang[Math.floor(Math.random() * _themesRang.length)] || RIFT_THEMES[0];

            // Préfixe + nom thématique
            const prefix = RIFT_NAME_PREFIXES[Math.floor(Math.random() * RIFT_NAME_PREFIXES.length)];
            const fullName = `${prefix} ${theme.name}`;

            // Nombre de vagues + difficulté basés sur le rang
            const rankConfigs = {
                E: { waves: 2, hpMult: 0.34, recommendedPower: 0,    minStat: 0 },
                D: { waves: 2, hpMult: 0.72, recommendedPower: 500,  minStat: 15 },
                C: { waves: 3, hpMult: 1.08, recommendedPower: 1200, minStat: 30 },
                B: { waves: 3, hpMult: 1.7, recommendedPower: 2200, minStat: 50 },
                A: { waves: 4, hpMult: 2.1, recommendedPower: 3800, minStat: 70 },
                S: { waves: 4, hpMult: 2.6, recommendedPower: 6500, minStat: 100 },
                // ⚠️ SS et SSS MANQUAIENT alors que rankIds les contient : un joueur
                // de rang S pouvait tirer une Faille SS (offset +1), rankConfigs['SS']
                // valait undefined, et lire .waves plantait tout le générateur
                // (« Cannot read properties of undefined (reading 'waves') »).
                SS:  { waves: 5, hpMult: 3.3, recommendedPower: 10000, minStat: 130 },
                SSS: { waves: 5, hpMult: 4.2, recommendedPower: 15000, minStat: 165 }
            };
            // Filet : un rang inconnu retombe sur le plus proche connu plutôt
            // que de faire échouer la génération entière.
            const config = rankConfigs[riftRank] || rankConfigs.SSS || rankConfigs.S;

            // ── MODIFICATEUR DE FAILLE ──
            const modifier = awakPickRiftModifier();
            // Nombre de vagues ajusté par le modificateur
            let waveCount = config.waves;
            if (modifier.eliteSingleWave) waveCount = 1;       // Élite : 1 seule vague (boss)
            else if (modifier.extraWave) waveCount = config.waves + 1; // Écho : +1 vague

            // Générer les vagues
            const monstersForTheme = RIFT_MONSTERS[theme.id];

            // 🎭 Phase 4 : bonus compagnons (boss HP cut)
            const compBonus = typeof awakCompanionsGetActiveBonuses === 'function'
                ? awakCompanionsGetActiveBonuses() : {};
            const bossHpCut = compBonus.bossHpCut || 0;

            const waves = [];
            for (let i = 0; i < waveCount; i++) {
                const isBossWave = (i === waveCount - 1);
                const monster = isBossWave
                    ? monstersForTheme[monstersForTheme.length - 1] // Boss = dernier monstre
                    : monstersForTheme[Math.min(i, monstersForTheme.length - 2)];

                // Boss bien plus coriace (×4) — un vrai combat de plusieurs séries même surpuissant
                // Boss légèrement plus coriace qu'un monstre normal (×1.6) — combat court
                // 👹 Boss de vague : ×1,6 en général, mais ADOUCI aux premiers
                // rangs. Un débutant (stat ~15, ~30 dgts/série) affrontait un
                // boss de rang E à 176 PV, soit 6 séries pour la seule dernière
                // vague — décourageant quand on découvre le jeu.
                // On se base sur le rang de la FAILLE (riftRank), pas du joueur.
                const _idxRang = Math.max(0, rankIds.indexOf(riftRank));
                const _bossMult = _idxRang === 0 ? 1.15      // rang E : boss à peine plus dur
                                : _idxRang === 1 ? 1.30      // rang D
                                : _idxRang === 2 ? 1.45      // rang C
                                : 1.6;                        // B et au-delà : inchangé
                let hp = Math.round(monster.baseHp * config.hpMult * (isBossWave ? _bossMult : 1));
                // Modificateur de Faille : ajustement HP global
                hp = Math.round(hp * (modifier.hpMult || 1));
                // Élite : un seul monstre, donc bien plus gros (×2.2)
                if (modifier.eliteSingleWave) hp = Math.round(hp * 2.2);
                // Dr Halberd : -20% HP boss
                if (isBossWave && bossHpCut > 0) {
                    hp = Math.round(hp * (1 - bossHpCut));
                }

                waves.push({
                    index: i,
                    isBoss: isBossWave,
                    rank: riftRank, // rang de la Faille : pilote les dégâts de contre-attaque
                    name: isBossWave ? `${monster.name} (Boss)` : monster.name,
                    emoji: monster.emoji,
                    hpMax: hp,
                    hpCurrent: hp,
                    // Boss : mécanique unique aléatoire
                    bossMech: isBossWave ? awakPickBossMechanic() : null
                });
            }

            let lifetimeDays = RIFT_LIFETIME_DAYS[riftRank];
            // v1536 : Maître Chen — les nouvelles Failles durent 10 % de plus (vrai effet)
            try { const _cb = (typeof awakCompanionsGetActiveBonuses === 'function') ? awakCompanionsGetActiveBonuses() : {}; if (_cb.riftDurationCut) lifetimeDays = Math.round(lifetimeDays * (1 + _cb.riftDurationCut) * 10) / 10; } catch (e) { _awkE(e); }
            // Frénésie : durée de vie réduite
            if (modifier.lifetimeCut) lifetimeDays = Math.max(2, Math.round(lifetimeDays * modifier.lifetimeCut));

            // ⚡ UNE FAILLE SUR TROIS EST UN ASSAUT (combat au chrono).
            // Elle passe par le MÊME générateur, donc elle est soumise au même
            // plafond de Failles actives (2 au début, 3 puis 4 selon le niveau)
            // et au même cooldown : aucune Faille supplémentaire n'apparaît.
            let _assautTheme = null;
            try {
                if (Math.random() < 0.34 && typeof _assautThemesDispo === 'function') {
                    const dispo = _assautThemesDispo();
                    if (dispo.length) _assautTheme = dispo[Math.floor(Math.random() * dispo.length)].id;
                }
            } catch (e) { _awkE(e); }

            // ⚖️ v1218 : échelle de PV (voir awakRiftHpScale) — sauf Assaut.
            if (!_assautTheme) {
                waves.forEach(w => {
                    w.hpMax = Math.round(w.hpMax * awakRiftHpScale(riftRank, w.isBoss));
                    w.hpCurrent = w.hpMax;
                });
            }

            return {
                id: 'rift_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                createdAt: Date.now(),
                expiresAt: Date.now() + lifetimeDays * 24 * 60 * 60 * 1000,
                isAssaut: !!_assautTheme,
                assautTheme: _assautTheme,
                rank: riftRank,
                themeId: theme.id,
                name: fullName,
                modifierId: modifier.id,   // 🆕 modificateur de Faille
                discovered: false, // pas encore entrée pour la 1ère fois
                state: 'stable', // stable → unstable → breach → exploded
                waves,
                currentWaveIdx: 0,
                recommendedPower: config.recommendedPower,
                minStatRequired: config.minStat,
                primaryStat: theme.primaryStat,
                attempts: 0,
                completed: false
            };
        }

        /**
         * Mécaniques de Boss
         */
        // ═══════════════════════════════════════════════════════════════
        // v1470 : MÉCANIQUES PROPRES À CHAQUE BOSS DE FAILLE
        // Surtout des RÉCOMPENSES (bien jouer = gros bonus) ; quelques boss
        // punissent (spores, foudre, froid, soins) pour garder de la tension.
        // Appliquées à chaque série dans awakDealDamageToWave.
        // ═══════════════════════════════════════════════════════════════
        const AWAK_BOSS_MECH = {
            'sentinelle figée':      { id: 'bm_glace',     name: 'Garde de glace', desc: 'La 1re série d\'un exercice est amortie ; la 2e du même exercice passe ×1,5.' },
            'léviathan organique':   { id: 'bm_sable',     name: 'Sous le sable',  desc: '1 coup sur 3, il s\'enfouit : seul un exercice explosif l\'en sort (×2).' },
            'léviathan des abysses': { id: 'bm_pression',  name: 'Pression',       desc: 'Il encaisse de mieux en mieux ; une série au-dessus de l\'objectif remet la pression à zéro (×1,3).' },
            'anti-soi':              { id: 'bm_inversion', name: 'Inversion',      desc: 'Moins de reps qu\'à ta série d\'avant : il récupère des PV. Plus de reps : ×1,3.' },
            'cœur battant des murs': { id: 'bm_battement', name: 'Battements',     desc: 'Toutes les 3 séries il se soigne, sauf si tu as fait du cardio ou de l\'explosif entre-temps.' },
            'locomotive vivante':    { id: 'bm_wagons',    name: 'Wagons',         desc: '3 wagons-armures : chacun cède à un type d\'effort différent (force, cardio, explosif).' },
            'le livre interdit':     { id: 'bm_pages',     name: 'Pages',          desc: 'Un exercice déjà utilisé contre lui frappe moins ; un nouvel exercice ×1,25.' },
            'enclume stellaire':     { id: 'bm_forge',     name: 'Forge',          desc: 'Chaque série de force chauffe l\'enclume (jusqu\'à ×2) ; un autre effort la refroidit.' },
            'fleur-mère carnivore':  { id: 'bm_spores',    name: 'Spores',         desc: 'Toutes les 4 séries, ses spores te blessent, sauf si cette série est du cardio.' },
            'cloche du jugement':    { id: 'bm_glas',      name: 'Le glas',        desc: 'Toutes les 3 séries elle sonne : atteins l\'objectif (×2) ou elle se soigne.' },
            'phénix éteint':         { id: 'bm_phenix',    name: 'Renaissance',    desc: 'La première fois qu\'il tombe, il renaît à 30 % de ses PV.' },
            'grande mécanique':      { id: 'bm_cadence',   name: 'Cadence',        desc: 'Garde des repos réguliers d\'une série à l\'autre : ×1,4.' },
            'roi des profondeurs':   { id: 'bm_maree',     name: 'Marée',          desc: 'La marée alterne toutes les 2 séries : bas du corps puis haut du corps (×1,4).' },
            'le vrai toi':           { id: 'bm_reflet',    name: 'Reflet',         desc: 'Égale ou bats tes reps de la série d\'avant, sinon −50 %.' },
            'titan ressuscité':      { id: 'bm_os',        name: 'Os brisés',      desc: '4 pièces d\'armure : jambes, poussée, tirage, tronc. Chaque partie nouvelle en brise une (×1,5).' },
            'seigneur de la tempête':{ id: 'bm_foudre',    name: 'Foudre',         desc: 'Toutes les 3 séries il charge : une série explosive détourne l\'éclair (×2), sinon il te frappe.' },
            'cœur du marais':        { id: 'bm_marais',    name: 'Enlisement',     desc: 'Chaque série sous l\'objectif t\'enlise (−15 %) ; une série au-dessus te libère.' },
            'ia souveraine':         { id: 'bm_adapt',     name: 'Adaptation',     desc: 'Ton type d\'effort le plus utilisé contre elle frappe moins ; change pour la surprendre (×1,3).' },
            'colosse de l\'arène':   { id: 'bm_foule',     name: 'La foule',       desc: '3 séries au-dessus de l\'objectif : la foule rugit, coup de grâce ×3.' },
            'reine de l\'aurore':    { id: 'bm_froid',     name: 'Froid',          desc: 'Chaque minute sans série te coûte des PV. Bouge sans t\'arrêter.' },
            'le dormeur éternel':    { id: 'bm_berceuse',  name: 'Berceuse',       desc: 'Une série de plus de 15 reps l\'endort : le coup suivant ×2.' },
            'le vide lumineux':      { id: 'bm_eclipse',   name: 'Éclipse',        desc: 'Il exige un type d\'effort qui change à chaque coup : ×2 si tu le donnes, sinon ×0,6.' }
        };
        const _AWAK_MECH_GENERIQUES = ['phases', 'weakness', 'enrage', 'adds'];
        const _AWAK_ECLIPSE = ['force', 'cardio', 'explosif', 'abdos'];
        const _AWAK_EFFORT_NOM = { force: 'force', cardio: 'cardio', explosif: 'explosif', abdos: 'abdos', autre: 'autre' };
        function _awakNomBossCle(n) {
            return String(n || '').toLowerCase().replace(/’/g, '\'').replace(/\s*\((boss|élite|elite)\)\s*$/i, '').replace(/^[^a-zàâäéèêëîïôöùûüçœ]+/i, '').trim();
        }
        function awakBossMechPourNom(n) { const m = AWAK_BOSS_MECH[_awakNomBossCle(n)]; return m ? Object.assign({}, m) : null; }
        window.awakBossMechPourNom = awakBossMechPourNom;
        // Un boss déjà généré avec une mécanique générique reçoit la sienne.
        function awakAssurerMechBoss(rift, wave) {
            try {
                if (!wave || !wave.isBoss || wave.companionMech || (rift && rift.subBossMech)) return;
                if (rift && rift._initiation) return;   // v1617 : Faille d'initiation sans mécanique de boss
                if (wave.bossMech && _AWAK_MECH_GENERIQUES.indexOf(wave.bossMech.id) < 0) return;
                const m = awakBossMechPourNom(wave.name);
                if (m) { wave.bossMech = m; wave._enraged = false; wave.weaknessStat = null; }
            } catch (e) { _awkE(e); }
        }
        window.awakAssurerMechBoss = awakAssurerMechBoss;

        function _awakPartieCorps(ex, effort) {
            const t = ((ex && ex.muscle) || '') + ' ' + ((ex && ex.name) || '');
            const s = t.toLowerCase();
            if (effort === 'abdos' || /abdo|oblique|lombaire|gainage|planche|plank|tronc/.test(s)) return 'tronc';
            if (/quadri|ischio|fessier|mollet|adduct|jambe|squat|fente|lunge|hip thrust|glute|step|calf/.test(s)) return 'jambes';
            if (/dos|biceps|trap|row|tirage|traction|pull|curl|face pull/.test(s)) return 'tirage';
            if (/pector|épaule|epaule|triceps|pompe|push|dip|développé|developpe|press/.test(s)) return 'poussee';
            return null;
        }

        // Applique la mécanique du boss au coup courant. Retourne { damage, toasts }.
        function awakApplyBossUnique(rift, wave, c) {
            const m = wave && wave.bossMech;
            const out = { damage: c.damage, toasts: [] };
            if (!m || !/^bm_/.test(m.id)) return out;
            const S = wave._bm || (wave._bm = {});
            const t = (msg, type) => out.toasts.push({ msg: msg, type: type || 'info' });
            const maxPV = (typeof awakGetPlayerMaxHP === 'function') ? awakGetPlayerMaxHP() : 100;
            const blesse = (pct, src) => { try { if (typeof awakDamagePlayer === 'function') awakDamagePlayer(Math.max(1, Math.round(maxPV * pct)), src); } catch (e) { _awkE(e); } };
            const soigneBoss = pct => { const h = Math.round(wave.hpMax * pct); wave.hpCurrent = Math.min(wave.hpMax, wave.hpCurrent + h); return h; };
            const au = c.ratio >= 1.05, sous = c.ratio < 0.9, ok = c.ratio >= 0.95;
            const exNom = (c.ex && c.ex.name) || '';
            S.n = (S.n || 0) + 1;
            let d = c.damage;
            switch (m.id) {
                case 'bm_glace': {
                    S.ex = S.ex || {};
                    S.ex[exNom] = (S.ex[exNom] || 0) + 1;
                    if (S.ex[exNom] === 1) { d *= 0.6; t('Garde de glace : 1re série amortie. Refais le même exercice.'); }
                    else { d *= 1.5; t('La glace cède : ×1,5', 'success'); }
                    break;
                }
                case 'bm_sable': {
                    if (S.n % 3 === 0) {
                        if (c.effort === 'explosif') { d *= 2; t('Tu le sors du sable : ×2', 'success'); }
                        else { d *= 0.3; t('Il s\'enfouit : un exercice explosif l\'en sortirait.', 'warning'); }
                    }
                    break;
                }
                case 'bm_pression': {
                    if (au) { S.p = 0; d *= 1.3; t('Pression relâchée : ×1,3', 'success'); }
                    else { S.p = Math.min(5, (S.p || 0) + 1); d *= (1 - 0.08 * S.p); if (S.p >= 2) t('La pression monte : −' + (8 * S.p) + ' %. Dépasse l\'objectif.', 'warning'); }
                    break;
                }
                case 'bm_inversion': {
                    if (typeof S.prev === 'number') {
                        if (c.reps < S.prev) { const h = soigneBoss(0.04); t('Inversion : tu ralentis, il récupère ' + h + ' PV.', 'warning'); }
                        else if (c.reps > S.prev) { d *= 1.3; t('Tu le dépasses : ×1,3', 'success'); }
                    }
                    S.prev = c.reps;
                    break;
                }
                case 'bm_battement': {
                    if (c.effort === 'cardio' || c.effort === 'explosif') { S.emballe = true; }
                    if (S.n % 3 === 0) {
                        if (S.emballe) t('Le cœur s\'emballe : pas de soin.', 'success');
                        else { const h = soigneBoss(0.05); t('Battement : il se soigne de ' + h + ' PV. Du cardio l\'en empêche.', 'warning'); }
                        S.emballe = false;
                    }
                    break;
                }
                case 'bm_wagons': {
                    S.w = S.w || {};
                    const cle = c.effort === 'abdos' || c.effort === 'autre' ? null : c.effort;
                    if (cle && !S.w[cle]) { S.w[cle] = true; d *= 1.4; t('Wagon ' + _AWAK_EFFORT_NOM[cle] + ' arraché (' + Object.keys(S.w).length + '/3) : ×1,4', 'success'); }
                    else if (Object.keys(S.w).length < 3) { d *= 0.7; }
                    break;
                }
                case 'bm_pages': {
                    S.vu = S.vu || {};
                    if (S.vu[exNom]) { d *= 0.7; t('Page déjà lue : change d\'exercice.', 'warning'); }
                    else { S.vu[exNom] = 1; d *= 1.25; t('Nouvelle page : ×1,25', 'success'); }
                    break;
                }
                case 'bm_forge': {
                    if (c.effort === 'force') { S.h = Math.min(5, (S.h || 0) + 1); }
                    else if (S.h) { S.h = 0; t('L\'enclume refroidit.', 'warning'); }
                    const mult = 1 + 0.2 * (S.h || 0);
                    d *= mult;
                    if (S.h) t('Forge chauffée : ×' + mult.toFixed(1).replace('.', ','), 'success');
                    break;
                }
                case 'bm_spores': {
                    if (S.n % 4 === 0) {
                        if (c.effort === 'cardio') t('Tu cours hors du nuage de spores.', 'success');
                        else { blesse(0.08, '(spores)'); t('Spores : tu es touché. Une série cardio les évite.', 'warning'); }
                    }
                    break;
                }
                case 'bm_glas': {
                    if (S.n % 3 === 0) {
                        if (ok) { d *= 2; t('Le glas résonne pour toi : ×2', 'success'); }
                        else { const h = soigneBoss(0.08); t('Le glas : objectif manqué, elle récupère ' + h + ' PV.', 'warning'); }
                    } else if (S.n % 3 === 2) t('La cloche va sonner : atteins l\'objectif à la prochaine série.');
                    break;
                }
                case 'bm_cadence': {
                    if (S.lastT) {
                        const gap = (c.now - S.lastT) / 1000;
                        if (S.gap && Math.abs(gap - S.gap) <= 25) { d *= 1.4; t('Cadence tenue : ×1,4', 'success'); }
                        S.gap = gap;
                    }
                    S.lastT = c.now;
                    break;
                }
                case 'bm_maree': {
                    const haute = Math.floor((S.n - 1) / 2) % 2 === 0;   // haute : bas du corps
                    const p = _awakPartieCorps(c.ex, c.effort);
                    const bon = haute ? p === 'jambes' : (p === 'poussee' || p === 'tirage');
                    if (bon) { d *= 1.4; t('La marée te porte : ×1,4', 'success'); }
                    break;
                }
                case 'bm_reflet': {
                    if (typeof S.prev === 'number') {
                        if (c.reps >= S.prev) t('Tu dépasses ton reflet.', 'success');
                        else { d *= 0.5; t('Ton reflet fait mieux (' + S.prev + ' reps) : −50 %.', 'warning'); }
                    }
                    S.prev = c.reps;
                    break;
                }
                case 'bm_os': {
                    S.os = S.os || {};
                    const p = _awakPartieCorps(c.ex, c.effort);
                    if (p && !S.os[p]) { S.os[p] = 1; d *= 1.5; t('Armure brisée : ' + ({ jambes: 'jambes', poussee: 'poussée', tirage: 'tirage', tronc: 'tronc' })[p] + ' (' + Object.keys(S.os).length + '/4) : ×1,5', 'success'); }
                    else if (Object.keys(S.os).length < 4) d *= 0.8;
                    break;
                }
                case 'bm_foudre': {
                    if (S.n % 3 === 0) {
                        if (c.effort === 'explosif') { d *= 2; t('Éclair détourné : ×2', 'success'); }
                        else { blesse(0.1, '(foudre)'); t('La foudre te frappe. Une série explosive la détourne.', 'warning'); }
                    } else if (S.n % 3 === 2) t('Il charge la foudre : série explosive à la prochaine.');
                    break;
                }
                case 'bm_marais': {
                    if (au) { if (S.e) t('Tu te libères du marais.', 'success'); S.e = 0; }
                    else if (sous) { S.e = Math.min(4, (S.e || 0) + 1); t('Tu t\'enlises : −' + (15 * S.e) + ' %.', 'warning'); }
                    d *= (1 - 0.15 * (S.e || 0));
                    break;
                }
                case 'bm_adapt': {
                    S.u = S.u || {};
                    const k = c.effort || 'autre';
                    const max = Math.max(0, ...Object.values(S.u));
                    if (max >= 2 && (S.u[k] || 0) === max) { d *= 0.6; t('Elle a appris ce mouvement : −40 %. Change de type d\'effort.', 'warning'); }
                    else if (max >= 2) { d *= 1.3; t('Elle ne l\'avait pas prévu : ×1,3', 'success'); }
                    S.u[k] = (S.u[k] || 0) + 1;
                    break;
                }
                case 'bm_foule': {
                    if (au) S.f = (S.f || 0) + 1;
                    if (S.f >= 3) { S.f = 0; d *= 3; t('LA FOULE RUGIT : coup de grâce ×3', 'success'); }
                    else if (au) t('La foule s\'échauffe (' + S.f + '/3).', 'success');
                    break;
                }
                case 'bm_froid': {
                    if (S.lastT) {
                        const min = Math.floor((c.now - S.lastT) / 60000) - 1;   // 1re minute gratuite (repos)
                        if (min > 0) { blesse(Math.min(0.12, 0.04 * min), '(froid)'); t('Le froid t\'a saisi pendant l\'arrêt.', 'warning'); }
                    }
                    S.lastT = c.now;
                    break;
                }
                case 'bm_berceuse': {
                    if (S.dort) { S.dort = false; d *= 2; t('Il dormait : ×2', 'success'); }
                    if (c.reps > 15) { S.dort = true; t('Berceuse : il s\'endort. Prochain coup ×2.', 'success'); }
                    break;
                }
                case 'bm_eclipse': {
                    const voulu = S.voulu || _AWAK_ECLIPSE[0];
                    if (c.effort === voulu) { d *= 2; t('Éclipse servie (' + voulu + ') : ×2', 'success'); }
                    else { d *= 0.6; t('L\'éclipse voulait : ' + voulu + '. ×0,6', 'warning'); }
                    S.voulu = _AWAK_ECLIPSE[(Math.floor(Math.random() * 3) + 1 + _AWAK_ECLIPSE.indexOf(voulu)) % 4];
                    break;
                }
            }
            out.damage = Math.max(1, Math.round(d));
            return out;
        }
        window.awakApplyBossUnique = awakApplyBossUnique;

        // État court affiché sur l'écran de combat et le bandeau de séance.
        function awakBossMechEtat(wave) {
            try {
                const m = wave && wave.bossMech; if (!m || !/^bm_/.test(m.id)) return '';
                const S = wave._bm || {}; const n = S.n || 0;
                switch (m.id) {
                    case 'bm_sable': return (n % 3 === 2) ? 'Il va s\'enfouir : prépare un explosif' : '';
                    case 'bm_pression': return S.p ? 'Pression −' + (8 * S.p) + ' %' : '';
                    case 'bm_inversion': case 'bm_reflet': return typeof S.prev === 'number' ? 'À battre : ' + S.prev + ' reps' : '';
                    case 'bm_battement': return 'Soin dans ' + (3 - n % 3) + ' série' + (3 - n % 3 > 1 ? 's' : '');
                    case 'bm_wagons': { const w = Object.keys(S.w || {}); return 'Wagons : ' + (3 - w.length) + '/3' + (w.length < 3 ? ' (reste : ' + ['force', 'cardio', 'explosif'].filter(x => w.indexOf(x) < 0).join(', ') + ')' : ''); }
                    case 'bm_forge': return S.h ? 'Chaleur ×' + (1 + 0.2 * S.h).toFixed(1).replace('.', ',') : 'Enclume froide';
                    case 'bm_spores': return 'Spores dans ' + (4 - n % 4) + ' série' + (4 - n % 4 > 1 ? 's' : '');
                    case 'bm_glas': return 'Glas dans ' + (3 - n % 3) + ' série' + (3 - n % 3 > 1 ? 's' : '');
                    case 'bm_phenix': return wave._renait ? 'Il est déjà revenu une fois' : 'Renaîtra une fois';
                    case 'bm_maree': return Math.floor(n / 2) % 2 === 0 ? 'Marée haute : bas du corps' : 'Marée basse : haut du corps';
                    case 'bm_os': { const o = Object.keys(S.os || {}); return 'Armure : ' + (4 - o.length) + '/4'; }
                    case 'bm_foudre': return (n % 3 === 2) ? 'Foudre chargée : série explosive !' : 'Foudre dans ' + (3 - n % 3) + ' série' + (3 - n % 3 > 1 ? 's' : '');
                    case 'bm_marais': return S.e ? 'Enlisé −' + (15 * S.e) + ' %' : '';
                    case 'bm_foule': return 'Foule ' + (S.f || 0) + '/3';
                    case 'bm_berceuse': return S.dort ? 'Il dort : prochain coup ×2' : '';
                    case 'bm_eclipse': return 'Exige : ' + (S.voulu || _AWAK_ECLIPSE[0]);
                }
            } catch (e) { _awkE(e); }
            return '';
        }
        window.awakBossMechEtat = awakBossMechEtat;

        function awakPickBossMechanic() {
            const mechanics = [
                { id: 'phases',   name: 'Phases', desc: 'Le boss change de pattern à 50% HP' },
                { id: 'weakness', name: 'Faiblesse', desc: 'Le boss subit ×2 dégâts d\'une stat précise' },
                { id: 'enrage',   name: 'Enrage', desc: 'Le boss s\'enrage après X minutes' },
                { id: 'adds',     name: 'Invocations', desc: 'Le boss invoque des renforts' }
            ];
            return mechanics[Math.floor(Math.random() * mechanics.length)];
        }

        /**
         * Met à jour les états des Failles existantes (vieillissement)
         */
        function awakUpdateRiftsState() {
            // 🔒 Aucune logique de Faille si le mode Aventure/Chasseur n'est pas activé
            if (typeof getAdventureEnabled === 'function' && !getAdventureEnabled()) {
                return (typeof awakRiftsLoad === 'function') ? awakRiftsLoad() : [];
            }
            const rifts = awakRiftsLoad();
            const now = Date.now();
            let changed = false;

            for (const r of rifts) {
                if (r.completed) continue;
                // 🛡️ Les Failles narratives n'expirent JAMAIS : elles attendent le joueur
                // indéfiniment. Sans ça, une Faille-clé pourrait disparaître et bloquer
                // définitivement la progression de l'histoire (porte narrative).
                if (r.isNarrative) {
                    // v1422 : seule exception, une Faille d'histoire à durée limitée
                    // (« La Boulangerie qui s'efface ») : expirée = souvenir perdu, l'histoire continue.
                    if (r.narrativeId && r.narrativeData && r.narrativeData.expireDays && now > r.expiresAt) {
                        r.completed = true; r.completedAt = now; r.echec = true; changed = true;
                        try {
                            localStorage.setItem('awakNarrativeDone_' + r.narrativeId, '1');
                            localStorage.setItem('awakStoryEvt__echec_' + r.narrativeId, '1');
                        } catch (e) { _awkE(e); }
                        try { if (typeof showToast === 'function') setTimeout(() => showToast('« ' + r.name + ' » s\'est refermée sans toi. Ce souvenir est perdu.', 'warning', 5000), 1500); } catch (e) { _awkE(e); }
                        try { if (typeof storyCheckEvents === 'function') setTimeout(() => storyCheckEvents({ delay: 400 }), 2500); } catch (e) { _awkE(e); }
                        continue;
                    }
                    if (r.state !== 'stable') { r.state = 'stable'; changed = true; }
                    continue;
                }
                // 👹 Le Boss Hebdomadaire ne se dégrade pas : il attend, immuable, jusqu'à la fin de semaine
                if (r.isWeeklyBoss) {
                    if (r.state !== 'stable') { r.state = 'stable'; changed = true; }
                    continue;
                }
                const lifetime = r.expiresAt - r.createdAt;
                const elapsed = now - r.createdAt;
                const ratio = elapsed / lifetime;

                let newState = r.state;
                if (ratio >= 1.2) newState = 'exploded';       // 6+ jours après expiration
                else if (ratio >= 1.0) newState = 'breach';     // expiré → un monstre s'échappe
                else if (ratio >= 0.65) newState = 'unstable';  // ~4-5 jours = renforcée
                else newState = 'stable';

                if (newState !== r.state) {
                    r.state = newState;
                    // Si la faille passe en breach, monstre s'échappe (TODO Phase 3)
                    // Si la faille passe en exploded, plusieurs monstres
                    changed = true;
                }
            }

            // Nettoyer les failles complétées/explosées de plus de 7 jours
            const cleaned = rifts.filter(r => {
                // 🛡️ Une Faille narrative non complétée n'est JAMAIS supprimée
                if (r.isNarrative && !r.completed) return true;
                // 👹 Boss Hebdomadaire d'une semaine passée → retiré (un nouveau apparaîtra)
                if (r.isWeeklyBoss && r.weekKey !== ('W' + Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)))) return false;
                if (r.completed && now - r.createdAt > 7 * 24 * 60 * 60 * 1000) return false;
                if (r.state === 'exploded' && now - r.expiresAt > 7 * 24 * 60 * 60 * 1000) return false;
                return true;
            });

            if (changed || cleaned.length !== rifts.length) {
                awakRiftsSave(cleaned);
            }

            // 👹 Phase 3 : vérifier si des monstres doivent s'échapper
            try {
                if (typeof awakCheckRiftsForMonsterSpawn === 'function') {
                    awakCheckRiftsForMonsterSpawn();
                }
            } catch(e) { _awkE(e); }

            return cleaned;
        }
        window.awakUpdateRiftsState = awakUpdateRiftsState;

        /**
         * Tente de générer une nouvelle Faille (respect cooldown + max actives)
         * Retourne la Faille générée ou null
         */
        // ═══════════════════════════════════════════════════════════════
        // 📜 JOURNAL DE COMBAT (Failles / Chasses)
        // Les dégâts n'étaient signalés que par une notification fugace. Le
        // journal conserve les coups de la session en cours pour qu'ils soient
        // consultables à tout moment.
        // ═══════════════════════════════════════════════════════════════
        const AWAK_COMBAT_LOG_KEY = 'awakCombatLog';
        const AWAK_COMBAT_LOG_MAX = 60;          // au-delà, on oublie les plus anciens

        function awakCombatLogAdd(entree) {
            try {
                const j = awakCombatLogGet();
                j.push(entree);
                while (j.length > AWAK_COMBAT_LOG_MAX) j.shift();
                localStorage.setItem(AWAK_COMBAT_LOG_KEY, JSON.stringify(j));
                if (typeof awakRenderCombatLog === 'function') awakRenderCombatLog();
            } catch (e) { _awkE(e); }
        }
        function awakCombatLogGet() {
            try {
                const a = JSON.parse(localStorage.getItem(AWAK_COMBAT_LOG_KEY) || '[]');
                return Array.isArray(a) ? a : [];
            } catch (e) { return []; }
        }
        function awakCombatLogClear() {
            try { localStorage.removeItem(AWAK_COMBAT_LOG_KEY); } catch (e) { _awkE(e); }
        }
        window.awakCombatLogGet = awakCombatLogGet;
        window.awakCombatLogClear = awakCombatLogClear;

        // Rendu du journal dans la vue de séance (Faille/Chasse uniquement).
        function awakRenderCombatLog() {
            const hote = document.getElementById('awakCombatLogPanel');
            if (!hote) return;
            // Masquer si l'on est dans une séance qui N'EST PAS un combat : le
            // journal de la dernière Faille n'a rien à faire dans un entraînement
            // ordinaire. En revanche on le CONSERVE quand aucune séance n'est en
            // cours, pour pouvoir le relire juste après le combat.
            try {
                if (currentWorkout && !currentWorkout._isRift && !currentWorkout._isHunt) {
                    if (window.AwakRiftVis) AwakRiftVis.hud(null);
                    hote.innerHTML = ''; return;
                }
            } catch (e) { _awkE(e); }
            const j = awakCombatLogGet();

            // 🩸 En-tête PV : PV du personnage ET du boss courant, visible pendant
            // le combat (calculé AVANT la sortie anticipée pour s'afficher même en
            // tout début de combat, avant le 1er coup ; masqué hors combat).
            let hpHeader = '';
            // ⚔ Bandeau de combat en haut de l'écran (monstre + PV) : remplace la
            // double jauge du bas pendant une Faille classique (pas Assaut/Chasse).
            let _hudActif = false;
            try {
                const _s = (typeof awakActiveRiftSession !== 'undefined') ? awakActiveRiftSession : null;
                const _w = _s && _s.rift && _s.rift.waves ? _s.rift.waves[_s.rift.currentWaveIdx || 0] : null;
                const _h = (typeof awakActiveHuntSession !== 'undefined') ? awakActiveHuntSession : null;
                if (window.AwakRiftVis && _h && _h.monster && currentWorkout && currentWorkout._isHunt) {
                    // v1304 : la Chasse a aussi son bandeau en haut (avant : rien en haut,
                    // et la double jauge du bas affichait les PV d'une ancienne Faille).
                    const _jl = awakCombatLogGet();
                    const _der = _jl.length ? _jl[_jl.length - 1] : null;
                    AwakRiftVis.hud({
                        nom: _h.monster.name || (_h.type && _h.type.name) || 'Monstre', couleur: (_h.type && _h.type.color) || '#f59e0b', boss: false,
                        pv: Math.max(0, _h.monster.hpCurrent), pvMax: _h.monster.hpMax, cache: false,
                        joueur: null, joueurMax: null, vague: 1, vagues: 1, ouverture: null,
                        coup: (_der && (_der.type === 'hit' || _der.type === 'crit')) ? { t: _der.t, dmg: _der.dmg || 0, crit: _der.type === 'crit' } : null
                    });
                    _hudActif = true;
                } else if (window.AwakRiftVis && _s && _w && currentWorkout && currentWorkout._isRift && !currentWorkout._isAssaut) {
                    if (!_s.theme) _s.theme = { color: '#a855f7' };   // v1304 : sans thème, le bandeau ne s'affichait pas → double jauge en bas
                    const _mod = (typeof awakGetRiftModifier === 'function') ? awakGetRiftModifier(_s.rift.modifierId) : null;
                    const _jMax = (typeof awakGetPlayerMaxHP === 'function') ? awakGetPlayerMaxHP() : 100;
                    const _jCur = (typeof awakGetPlayerHP === 'function') ? awakGetPlayerHP() : _jMax;
                    const _jl = awakCombatLogGet();
                    const _der = _jl.length ? _jl[_jl.length - 1] : null;
                    AwakRiftVis.hud({
                        nom: _w.name, couleur: _s.theme.color, boss: !!_w.isBoss,
                        pv: Math.max(0, _w.hpCurrent), pvMax: _w.hpMax, cache: !!(_mod && _mod.hideHp),
                        joueur: Math.max(0, _jCur), joueurMax: _jMax,
                        vague: (_s.rift.currentWaveIdx || 0) + 1, vagues: _s.rift.waves.length,
                        ouverture: (_w._ouverture && typeof _w._ouverture === 'object') ? _w._ouverture.cible : null,
                        mecanique: (_w.isBoss && typeof awakBossMechEtat === 'function') ? (function () { try { awakAssurerMechBoss(_s.rift, _w); const m = _w.bossMech; if (!m || !/^bm_/.test(m.id)) return null; const e = awakBossMechEtat(_w); return m.name + (e ? ' · ' + e : ''); } catch (e) { return null; } })() : null,
                        coup: (_der && (_der.type === 'hit' || _der.type === 'crit')) ? { t: _der.t, dmg: _der.dmg || 0, crit: _der.type === 'crit' } : null
                    });
                    _hudActif = true;
                } else if (window.AwakRiftVis) AwakRiftVis.hud(null);
            } catch (e) { _awkE(e); }
            try {
                // v1304 : la double jauge du bas n'est plus jamais dessinée — les PV
                // sont dans le bandeau du haut (Faille, Chasse) ou la jauge d'Assaut.
                const sess = null;
                // ⚡ ASSAUT : ne PAS dessiner la barre de vie ici.
                // ⚠️ Un Assaut affiche déjà sa propre barre de vague en haut de
                // l'écran (_renderAssautHpBar, v880). Ce bandeau en ajoutait une
                // SECONDE dans le journal de combat, en bas : deux jauges pour
                // le même monstre, affichant le même chiffre.
                const _estAssaut = !!(currentWorkout && currentWorkout._isAssaut);
                if (sess && !_estAssaut) {
                    const maxHP = (typeof awakGetPlayerMaxHP === 'function') ? awakGetPlayerMaxHP() : 100;
                    const curHP = (typeof awakGetPlayerHP === 'function') ? awakGetPlayerHP() : maxHP;
                    const pPct = maxHP > 0 ? Math.max(0, Math.min(100, Math.round((curHP / maxHP) * 100))) : 0;
                    const pColor = pPct <= 25 ? '#f87171' : (pPct <= 50 ? '#fbbf24' : '#4ade80');
                    let bossCur = null, bossMax = null;
                    if (sess.rift && sess.rift.waves) {
                        const w = sess.rift.waves[sess.rift.currentWaveIdx || 0];
                        if (w && typeof w.hpCurrent === 'number' && typeof w.hpMax === 'number') {
                            bossCur = Math.max(0, w.hpCurrent); bossMax = w.hpMax;
                        }
                    }
                    const bPct = (bossMax > 0) ? Math.max(0, Math.min(100, Math.round((bossCur / bossMax) * 100))) : 0;
                    const bar = function (label, valTxt, pct, colTxt, grad) {
                        // 🩸 BARRE DE VIE — cadre gravé, liseré lumineux et
                        // segments, dans l'esprit de l'interface de combat.
                        // Le fond est creusé (ombre interne), la jauge posée
                        // par-dessus avec un halo à sa couleur.
                        var segments = '';
                        for (var _s = 1; _s < 10; _s++) {
                            segments += '<div style="position:absolute;top:0;bottom:0;left:' + (_s * 10)
                              + '%;width:1px;background:rgba(0,0,0,0.35);"></div>';
                        }
                        return '<div style="flex:1;min-width:0;">'
                            + '<div style="display:flex;justify-content:space-between;align-items:baseline;'
                            +   'font-size:0.56em;letter-spacing:1.5px;color:#94a3b8;font-weight:900;margin-bottom:4px;">'
                            +   '<span>' + label + '</span>'
                            +   '<span style="color:' + colTxt + ';white-space:nowrap;font-size:1.08em;'
                            +     'text-shadow:0 0 8px ' + colTxt + '66;">' + valTxt + '</span></div>'
                            + '<div style="position:relative;height:13px;border-radius:4px;overflow:hidden;'
                            +   'background:#0a0d13;border:1px solid ' + colTxt + '3a;'
                            +   'box-shadow:inset 0 2px 5px rgba(0,0,0,0.85);">'
                            +   '<div style="position:absolute;inset:0;width:' + pct + '%;background:' + grad + ';'
                            +     'box-shadow:0 0 12px ' + colTxt + '99;transition:width .45s ease;"></div>'
                            +   '<div style="position:absolute;inset:0 0 60% 0;width:' + pct + '%;'
                            +     'background:linear-gradient(180deg,rgba(255,255,255,0.30),transparent);'
                            +     'pointer-events:none;"></div>'
                            +   segments
                            + '</div></div>';
                    };
                    hpHeader = '<div style="display:flex;gap:10px;margin-bottom:9px;">'
                        + bar('🛡️ TOI', Math.max(0, Math.round(curHP)) + ' / ' + Math.round(maxHP), pPct, pColor, 'linear-gradient(90deg,' + pColor + ',' + pColor + ')')
                        + (bossCur !== null ? bar('👹 BOSS', bossCur.toLocaleString('fr-FR') + ' / ' + bossMax.toLocaleString('fr-FR'), bPct, '#f87171', 'linear-gradient(90deg,#f87171,#dc2626)') : '')
                        + '</div>';
                }
            } catch (e) { hpHeader = ''; }

            if (!j.length) {
                if (_hudActif && AwakRiftVis.journal(null)) { hote.innerHTML = ''; return; }
                hote.innerHTML = hpHeader; return;
            }

            const total = j.reduce((s, e) => s + (e.dmg || 0), 0);
            const crits = j.filter(e => e.type === 'crit').length;
            const effets = j.filter(e => e.type === 'effet').length;

            const lignes = j.slice().reverse().slice(0, 14).map(e => {
                // Effets de combat (armure, esquive, vulnérabilité, drain…)
                if (e.type === 'effet') {
                    const tons = { success:'#4ade80', warning:'#fbbf24', error:'#f87171', info:'#7dd3fc' };
                    const c = tons[e.ton] || '#94a3b8';
                    return '<div style="padding:3px 0;font-size:0.72em;color:' + c + ';line-height:1.35;">'
                        + String(e.msg || '').replace(/[<>]/g, '') + '</div>';
                }
                if (e.type === 'miss') {
                    return '<div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;font-size:0.72em;color:#8391a7;">'
                        + '<span>⚠️ Aucun dégât</span><span>—</span></div>';
                }
                const c = e.type === 'crit' ? '#fbbf24' : '#4ade80';
                const et = e.type === 'crit' ? '💥 CRITIQUE' : '⚔ Coup';
                const nom = (e.exo ? ('<span style="color:#8391a7;"> · ' + String(e.exo).slice(0, 22) + '</span>') : '')
                    + (e.faible ? '<span style="color:#fbbf24;font-weight:900;"> · point faible</span>' : '');
                // 🌫️ BROUILLARD : ce modificateur masque volontairement les HP de
                // l'ennemi (« Frappe à l'aveugle »). La barre de vie les cachait bien,
                // mais le JOURNAL DE COMBAT les affichait quand même à chaque coup —
                // il suffisait d'ouvrir la séance pour contourner tout le modificateur.
                let _fog = false;
                try {
                    const _s = (typeof awakActiveRiftSession !== 'undefined') ? awakActiveRiftSession : null;
                    const _r = _s && _s.rift;
                    const _m = (_r && typeof awakGetRiftModifier === 'function') ? awakGetRiftModifier(_r.modifierId) : null;
                    _fog = !!(_m && _m.hideHp);
                } catch (err) { _awkE(err); }
                const pv = (!_fog && typeof e.hp === 'number') ? ('<span style="color:#8391a7;font-size:0.9em;"> · ' + e.hp + ' PV</span>') : '';
                return '<div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;font-size:0.72em;color:#cbd5e1;">'
                    + '<span style="min-width:0;">' + et + nom + '</span>'
                    + '<b style="color:' + c + ';white-space:nowrap;">-' + e.dmg + (e.killed ? ' ☠️' : '') + pv + '</b></div>';
            }).join('');

            // ⚔ Faille classique : le journal vit dans le bandeau du haut (dépliable)
            if (_hudActif && AwakRiftVis.journal({
                resume: '<span style="color:#f87171;font-weight:900;">' + total + ' dégâts'
                    + (crits ? ' · ' + crits + ' crit.' : '')
                    + (effets ? ' <span style="color:#7dd3fc;">· ' + effets + ' effet' + (effets > 1 ? 's' : '') + '</span>' : '')
                    + '</span>',
                lignes: lignes
            })) { hote.innerHTML = ''; return; }

            hote.innerHTML =
                hpHeader
                // 📜 Cadre du journal : plaque gravée bleu-acier, liseré
                // lumineux en haut, coins marqués — l'esprit d'un rapport
                // de combat plutôt qu'un simple bloc dépliant.
                // 🌀 Fond : brume de Faille, même famille visuelle que
                // constellation_bg et faille_fermee_bg (même luminosité, même
                // dominante bleu-violet). Voile fort : on lit des chiffres ici.
                // ⚠️ url() SANS guillemets — le style vit dans un attribut HTML
                // délimité par des doubles quotes (piège de v907).
                + '<details style="position:relative;margin-bottom:12px;border-radius:12px;overflow:hidden;'
                +   'background-color:#0a0d14;'
                +   'background-image:linear-gradient(160deg,rgba(10,13,20,0.42),rgba(10,13,20,0.58)), '
                +     'url(images/combat_bg_v1.webp?v=1622);'
                +   'background-size:cover,cover;background-position:center,center;'
                +   'background-repeat:no-repeat,no-repeat;'
                +   'border:1px solid rgba(125,211,252,0.28);'
                +   'box-shadow:0 0 22px rgba(56,189,248,0.10),inset 0 1px 0 rgba(255,255,255,0.07);">'
                + '<div style="position:absolute;top:0;left:0;right:0;height:1px;'
                +   'background:linear-gradient(90deg,transparent,rgba(125,211,252,0.75),transparent);"></div>'
                + '<summary style="padding:10px 13px;cursor:pointer;font-size:0.72em;font-weight:800;color:#cbd5e1;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:8px;">'
                +   '<span>📜 Journal de combat</span>'
                +   '<span style="color:#4ade80;font-weight:900;">' + total + ' dégâts'
                +     (crits ? ' · ' + crits + ' crit.' : '')
                +     (effets ? ' <span style="color:#7dd3fc;">· ' + effets + ' effet' + (effets > 1 ? 's' : '') + '</span>' : '')
                +   '</span>'
                + '</summary>'
                + '<div style="padding:2px 13px 11px;max-height:190px;overflow-y:auto;border-top:1px solid rgba(255,255,255,0.07);">' + lignes + '</div>'
                + '</details>';
        }
        window.awakRenderCombatLog = awakRenderCombatLog;

        function awakTryGenerateRift(sessionContext) {
            // 🔒 GARDE-FOU MAÎTRE : aucune Faille si le mode Jeu est désactivé.
            // Le seul appelant actuel teste déjà getAdventureEnabled(), mais on
            // verrouille AUSSI ici : c'est la fonction qui crée la Faille, elle ne
            // doit jamais pouvoir en produire une pour un profil au jeu éteint,
            // quel que soit le chemin d'appel ajouté par la suite.
            try { if (typeof rpgEnabled === 'function' && !rpgEnabled()) return null; } catch (e) { _awkE(e); }
            // 🎓 v1404 : FAILLE D'INITIATION garantie après la 2e vraie séance (sans tirage
            // ni attente). Avant : niveau 3 + séance de 15 min + 35 % + 48 h → un débutant
            // qui suit l'Éveil (séances de 11-12 min) ne voyait aucune Faille avant la 3e semaine.
            try {
                const _kInit = _cleProfil('awakFailleInit');
                if (localStorage.getItem(_kInit) !== '1') {
                    const _pid = getCurrentProfileId();
                    const _hist = JSON.parse((_pid ? getProfileData(_pid, 'workoutHistory') : localStorage.getItem('workoutHistory')) || '[]');
                    if (_hist.length >= 2) {
                        const r0 = awakGenerateRift('E');
                        const w0 = Object.assign({}, r0.waves[0], { index: 0, isBoss: true, bossMech: null });
                        w0.name = w0.name.replace(/\s*\(Boss\)$/, '') + ' (Boss)';
                        // v1617 : une 1re Faille se gagne — PV plafonnés (avant : 60 à 115 PV selon le tirage → Game Over possible)
                        w0.hpMax = Math.min(w0.hpMax || 55, 55); w0.hpCurrent = w0.hpMax;
                        const init = Object.assign(r0, { name: 'Faille d\'initiation', isAssaut: false, assautTheme: null, modifierId: 'none', waves: [w0], currentWaveIdx: 0, _initiation: true,
                            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
                        const all = awakUpdateRiftsState();
                        all.push(init); awakRiftsSave(all);
                        localStorage.setItem(_kInit, '1');
                        localStorage.setItem(RIFT_LAST_GENERATED_KEY, String(Date.now()));
                        return init;
                    }
                }
            } catch (e) { _awkE(e); }
            // 🔒 Pacing : aucune Faille normale tant que le joueur débute (niveau 2).
            if (typeof _awakGetCurrentLevel === 'function' && _awakGetCurrentLevel() < RIFT_MIN_PLAYER_LEVEL) return null;

            const rifts = awakUpdateRiftsState();
            const activeRifts = rifts.filter(r => !r.completed && r.state !== 'exploded');

            // Max de failles actives simultanées (dynamique : augmente avec les compagnons acquis)
            if (activeRifts.length >= awakGetMaxActiveRifts()) return null;

            // Cooldown : 48h entre 2 failles
            const lastGen = parseInt(localStorage.getItem(RIFT_LAST_GENERATED_KEY) || '0');
            const now = Date.now();
            if (now - lastGen < RIFT_COOLDOWN_HOURS * 60 * 60 * 1000) return null;

            // 🎯 NOUVEAU : qualité de séance requise (vraie séance, pas une mini)
            if (sessionContext) {
                // v1404 : pendant le Parcours de l'Éveil (séances courtes), 10 min suffisent
                let _minMin = RIFT_MIN_SESSION_MINUTES;
                try { if (typeof awakEveilAujourdhui === 'function' && awakEveilAujourdhui()) _minMin = 10; } catch (e) { _awkE(e); }
                if (sessionContext.durationMin < _minMin) return null;
                if (sessionContext.exercisesCompleted < RIFT_MIN_EXERCISES) return null;
            }

            // Probabilité d'apparition : 35% si conditions remplies (au lieu de 70%)
            if (Math.random() > RIFT_SPAWN_PROBABILITY) return null;

            const newRift = awakGenerateRift();
            rifts.push(newRift);
            awakRiftsSave(rifts);
            localStorage.setItem(RIFT_LAST_GENERATED_KEY, String(now));

            return newRift;
        }
        window.awakTryGenerateRift = awakTryGenerateRift;
        // v1404 : ce qu'il faut faire pour qu'une Faille s'ouvre (carte vide de l'onglet Jeu)
        function awakProchaineFaille() {
            try {
                const _pid = getCurrentProfileId();
                const n = JSON.parse((_pid ? getProfileData(_pid, 'workoutHistory') : localStorage.getItem('workoutHistory')) || '[]').length;
                if (localStorage.getItem(_cleProfil('awakFailleInit')) !== '1') {
                    const r = Math.max(1, 2 - n);
                    return 'Fais encore ' + r + ' séance' + (r > 1 ? 's' : '') + ' pour ouvrir ta première Faille.';
                }
                if (_awakGetCurrentLevel() < RIFT_MIN_PLAYER_LEVEL) return 'Atteins le niveau ' + RIFT_MIN_PLAYER_LEVEL + ' : des Failles s\'ouvriront après tes séances.';
                let min = RIFT_MIN_SESSION_MINUTES;
                try { if (typeof awakEveilAujourdhui === 'function' && awakEveilAujourdhui()) min = 10; } catch (e) { _awkE(e); }
                const reste = RIFT_COOLDOWN_HOURS * 3600000 - (Date.now() - parseInt(localStorage.getItem(RIFT_LAST_GENERATED_KEY) || '0'));
                if (reste > 0) return 'Prochaine Faille possible dans ' + Math.ceil(reste / 3600000) + ' h, après une séance d\'au moins ' + min + ' min.';
                return 'Une Faille peut s\'ouvrir après ta prochaine séance d\'au moins ' + min + ' min.';
            } catch (e) { return 'Entraîne-toi : les Failles s\'ouvrent après tes vraies séances.'; }
        }
        window.awakProchaineFaille = awakProchaineFaille;

        /**
         * Récupère les failles actives (non complétées, non explosées)
         */
        function awakGetActiveRifts() {
            return awakUpdateRiftsState().filter(r => !r.completed && r.state !== 'exploded');
        }
        window.awakGetActiveRifts = awakGetActiveRifts;

        // v1477 : un combat de Faille / Chasse est-il en cours (entre deux exercices,
        // entre deux vagues) ? → la musique continue jusqu'à la sortie de la Faille.
        window.awakFailleEnCours = function (seulementSession) {
            try {
                const s = awakActiveRiftSession || awakActiveHuntSession;
                if (!s) return false;
                if (seulementSession) return true;
                return !!(document.getElementById('awakRiftCombatModal') || document.getElementById('awakHuntCombatModal')
                    || document.getElementById('awkBossIntro') || document.body.classList.contains('in-session'));
            } catch (e) { return false; }
        };
        // v1483 : contexte musical de la séance : 'final' (combat final), 'unique'
        // (histoire, sous-boss, compagnon), 'faille' (Faille ordinaire, Assaut), ou null.
        window.awakSeanceContexte = function () {
            try {
                const w = currentWorkout; if (!w) return null;
                if (w._isFinalBoss) return 'final';
                if (!w._isRift) return null;
                const r = (w._riftId && awakGetRiftById(w._riftId)) || (awakActiveRiftSession && awakActiveRiftSession.rift);
                if (r && (r.narrativeId || r.isSubBoss || r.subBossId || r.isCompanionRift || r.companionId)) return 'unique';
                return { cle: 'faille', id: (r && r.id) || w._riftId || '' };
            } catch (e) { return null; }
        };
        // v1475 : la séance en cours est-elle une Faille UNIQUE (histoire, sous-boss,
        // compagnon) ou le combat final ? → musique « Brise la faille » (musique.js)
        window.awakSeanceFailleUnique = function () {
            try {
                const w = currentWorkout; if (!w) return false;
                if (w._isFinalBoss) return true;
                if (!w._isRift) return false;
                const r = (w._riftId && awakGetRiftById(w._riftId)) || (awakActiveRiftSession && awakActiveRiftSession.rift);
                return !!(r && (r.narrativeId || r.isSubBoss || r.subBossId || r.isCompanionRift || r.companionId));
            } catch (e) { return false; }
        };
        function awakGetRiftById(id) {
            return awakRiftsLoad().find(r => r.id === id);
        }
        window.awakGetRiftById = awakGetRiftById;

        /**
         * Calcule le temps restant pour une Faille (en heures arrondies)
         */
        function awakRiftTimeRemaining(rift) {
            // 🛡️ Les Failles narratives n'expirent jamais : pas de compte à rebours
            if (rift && rift.isNarrative) {
                return { expired: false, label: 'Permanente', permanent: true };
            }
            let expiresAt = rift.expiresAt;
            // 🎭 Phase 4 : Maître Chen — riftDurationCut (perçu seulement)
            // On ne touche pas à la valeur stockée, juste l'affichage
            try {
                if (typeof awakCompanionsGetActiveBonuses === 'function') {
                    const compBonus = awakCompanionsGetActiveBonuses();
                    if (false && compBonus.riftDurationCut) {   // v1536 : retiré (affichage trompeur) — l'effet est appliqué à la création
                        const lifetime = rift.expiresAt - rift.createdAt;
                        expiresAt = rift.createdAt + lifetime * (1 - compBonus.riftDurationCut);
                    }
                }
            } catch(e) { _awkE(e); }

            const ms = expiresAt - Date.now();
            if (ms <= 0) return { expired: true, label: 'Expirée' };
            const hours = Math.floor(ms / (60 * 60 * 1000));
            const days = Math.floor(hours / 24);
            if (days >= 1) return { expired: false, label: `${days}j ${hours % 24}h` };
            return { expired: false, label: `${hours}h` };
        }
        window.awakRiftTimeRemaining = awakRiftTimeRemaining;

        /**
         * Étoiles de difficulté (recommandation visuelle)
         * Compare power du joueur vs recommandé
         */
        function awakRiftDifficulty(rift) {
            const power = awakGetPowerScore();
            const ratio = power / Math.max(1, rift.recommendedPower);
            if (ratio >= 1.5) return { stars: 1, color: '#22c55e', label: 'Trivial', emoji: '☆' };
            if (ratio >= 1.1) return { stars: 2, color: '#4ade80', label: 'Facile', emoji: '★☆' };
            if (ratio >= 0.85) return { stars: 3, color: '#f59e0b', label: 'Équilibré', emoji: '★★★' };
            if (ratio >= 0.6) return { stars: 4, color: '#fb923c', label: 'Difficile', emoji: '★★★★' };
            return { stars: 5, color: '#ef4444', label: 'Périlleux', emoji: '★★★★★' };
        }
        window.awakRiftDifficulty = awakRiftDifficulty;

        // ═══════════════════════════════════════════════════════════════
        // 🎨 RENDER : Affichage des Failles actives
        // ═══════════════════════════════════════════════════════════════
        function renderActiveRiftsCard() {
            const rifts = awakGetActiveRifts();
            const _rcorn = (pos) => `<div style="position:absolute;${pos};width:11px;height:11px;border:2px solid rgba(192,132,252,0.7);${pos.includes('top')?'border-bottom:none;':'border-top:none;'}${pos.includes('left')?'border-right:none;':'border-left:none;'}pointer-events:none;"></div>`;
            const _rcorners = _rcorn('top:6px;left:6px')+_rcorn('top:6px;right:6px')+_rcorn('bottom:6px;left:6px')+_rcorn('bottom:6px;right:6px');
            if (rifts.length === 0) {
                // ◈ État vide façon Système (avant : rien du tout)
                return `
            <div class="card" style="background:linear-gradient(160deg,#0a0e18,#0F1014);border:1px solid rgba(168,85,247,0.16);padding:16px 18px;margin-bottom:14px;position:relative;">
                ${_rcorners}
                <div style="font-family:var(--font-display);font-size:0.62em;color:#c084fc;font-weight:700;letter-spacing:2.5px;margin-bottom:6px;">◈ FAILLES</div>
                <div style="font-size:0.78em;color:#94a3b8;font-family:'Courier New',monospace;">[ Système ] Aucune anomalie détectée pour l'instant. Continue de t'entraîner — ton signal attire les Failles.</div>
            </div>`;
            }

            const stateColors = {
                stable: { bg: 'rgba(74,222,128,0.06)', border: 'rgba(74,222,128,0.25)', accent: '#4ade80' },
                unstable: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.3)', accent: '#fbbf24' },
                breach: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.35)', accent: '#f87171' }
            };
            const stateLabels = {
                stable: 'STABLE',
                unstable: 'INSTABLE',
                breach: 'BRÈCHE'
            };

            return `
            <div class="card" style="background:linear-gradient(160deg,#0a0e18,#0F1014);border:1px solid rgba(168,85,247,0.25);padding:18px;margin-bottom:14px;position:relative;">
                ${_rcorners}
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                    <div style="font-family:var(--font-display);font-size:0.64em;color:#c084fc;font-weight:700;letter-spacing:2.5px;">◈ FAILLES ACTIVES</div>
                    <button onclick="awakShowRiftHelp()" style="background:rgba(168,85,247,0.15);border:1px solid rgba(192,132,252,0.4);color:#c084fc;border-radius:99px;padding:3px 9px;font-size:0.6em;font-weight:800;cursor:pointer;flex-shrink:0;">ⓘ Aide</button>
                    <div style="flex:1;height:1px;background:linear-gradient(90deg,rgba(168,85,247,0.3),transparent);"></div>
                    <div style="font-size:0.7em;color:#94a3b8;font-weight:700;">${rifts.length}/${awakGetMaxActiveRifts()}</div>
                </div>

                <div style="display:flex;flex-direction:column;gap:10px;">
                ${rifts.map(rift => {
                    let theme = RIFT_THEMES.find(t => t.id === rift.themeId);
                    if (!theme && rift.isNarrative && rift.narrativeData) {
                        // 🐛 Les Failles de SOUS-BOSS stockent leur icône dans
                        // `emoji`, les Failles narratives dans `themeEmoji` :
                        // lire un seul des deux affichait « undefined » sur la carte.
                        theme = {
                            color: rift.narrativeData.color || '#a855f7',
                            emoji: rift.narrativeData.themeEmoji || rift.narrativeData.emoji || rift.emoji || '🌀'
                        };
                    }
                    if (!theme) return '';
                    const time = awakRiftTimeRemaining(rift);
                    const diff = awakRiftDifficulty(rift);
                    const stateColor = stateColors[rift.state] || stateColors.stable;
                    const stateLabel = stateLabels[rift.state] || rift.state.toUpperCase();
                    const displayName = rift.discovered ? rift.name : '???';
                    const isNarrativeBadge = rift.isNarrative ? '<span style="background:#fbbf24;color:black;padding:0 4px;border-radius:6px;font-size:0.55em;font-weight:900;letter-spacing:1px;margin-right:4px;">◇ UNIQUE</span>' : '';
                    // Badge modificateur (si présent et non standard)
                    const _mod = (typeof awakGetRiftModifier === 'function') ? awakGetRiftModifier(rift.modifierId) : null;
                    const modBadge = (_mod && _mod.id !== 'none')
                        ? `<span style="background:${_mod.color}25;color:${_mod.color};border:1px solid ${_mod.color}55;padding:1px 6px;border-radius:6px;font-size:0.6em;font-weight:900;letter-spacing:0.5px;">${_mod.emoji} ${_mod.name.toUpperCase()}</span>`
                        : '';

                    return `
                    <div onclick="awakOpenRiftBriefing('${rift.id}')" style="cursor:pointer;background:${stateColor.bg};border:1px solid ${stateColor.border};border-radius:14px;padding:14px 12px;transition:transform 0.15s ease;">
                        <div style="display:flex;align-items:center;gap:11px;">
                            <div style="font-size:1.9em;line-height:1;flex-shrink:0;filter:drop-shadow(0 0 6px ${theme.color}80);">${theme.emoji}</div>
                            <div style="flex:1;min-width:0;">
                                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px;">
                                    ${isNarrativeBadge}
                                    <span style="background:${theme.color}25;color:${theme.color};border:1px solid ${theme.color}50;padding:1px 6px;border-radius:6px;font-size:0.62em;font-weight:900;letter-spacing:1px;">${rift.rank}</span>
                                    ${modBadge}
                                    <span style="font-weight:800;color:white;font-size:0.92em;">${displayName}</span>
                                </div>
                                <div style="display:flex;gap:8px;align-items:center;font-size:0.7em;color:#94a3b8;font-weight:600;">
                                    <span style="color:${stateColor.accent};font-weight:800;">◈ ${stateLabel}</span>
                                    <span>·</span>
                                    <span>⏱ ${time.label}</span>
                                    <span>·</span>
                                    <span style="color:${diff.color};">${diff.emoji}</span>
                                </div>
                            </div>
                            <div style="color:#8391a7;font-size:1.2em;flex-shrink:0;">›</div>
                        </div>
                    </div>`;
                }).join('')}
                </div>
            </div>`;
        }
        window.renderActiveRiftsCard = renderActiveRiftsCard;

        // ═══════════════════════════════════════════════════════════════
        // 🎬 ÉCRAN D'ENTRÉE / BRIEFING D'UNE FAILLE
        // ═══════════════════════════════════════════════════════════════
        // v1458 : « l'Ouverture de Hôpital Vivant » → « L'Ouverture de l'Hôpital Vivant »
        function awakNomFailleAffiche(nom) {
            let s = String(nom || '');
            // article selon le thème : « de la Ville », « du Train », « des Terres », « de l'Océan »
            const ART = { 'Ville Figée': 'de la', 'Train Dimensionnel': 'du', 'Bibliothèque Infinie': 'de la', 'Forge Céleste': 'de la',
                'Jardin Carnivore': 'du', 'Cathédrale de Verre': 'de la', 'Terres de Cendre': 'des', 'Néant Mécanique': 'du',
                'Palais Englouti': 'du', 'Labyrinthe de Miroirs': 'du', 'Cimetière de Titans': 'du', 'Pic de la Tempête': 'du',
                'Marais des Murmures': 'du', 'Mégapole Néon': 'de la', 'Colisée d\'Os': 'du', 'Machine à Rêves': 'de la', 'Soleil Creux': 'du' };
            const m = s.match(/^(la Faille|la Brèche|la Déchirure|l'Ouverture|l'Antre|la Cicatrice|le Couloir|le Seuil) de (.+)$/);
            if (m) {
                const art = ART[m[2]] || (/^[AEIOUÉÈÊÂÎÔH]/.test(m[2]) ? "de l'" : 'de');
                s = m[1] + ' ' + art + (art.endsWith("'") ? '' : ' ') + m[2];
            }
            return s.charAt(0).toUpperCase() + s.slice(1);
        }
        window.awakNomFailleAffiche = awakNomFailleAffiche;
        function awakOpenRiftBriefing(riftId) {
            const rift = awakGetRiftById(riftId);
            if (!rift) return;
            // 🌌 Pour les Failles narratives, utiliser leurs données propres comme theme
            let theme = RIFT_THEMES.find(t => t.id === rift.themeId);
            if (!theme && rift.isNarrative && rift.narrativeData) {
                theme = {
                    id: rift.themeId,
                    name: rift.narrativeData.name,
                    // Même correctif : sous-boss → `emoji`, narratif → `themeEmoji`.
                    emoji: rift.narrativeData.themeEmoji || rift.narrativeData.emoji || rift.emoji || '🌀',
                    color: rift.narrativeData.color || '#a855f7',
                    description: rift.narrativeData.description,
                    briefing: rift.narrativeData.briefing,
                    primaryStat: rift.primaryStat,
                    exerciseFilter: rift.narrativeData.exerciseFilter
                };
            }
            if (!theme) return;
            const time = awakRiftTimeRemaining(rift);
            const diff = awakRiftDifficulty(rift);
            const playerPower = awakGetPowerScore();
            const playerStats = awakGetTotalStats();

            // Marquer comme découverte
            if (!rift.discovered) {
                const rifts = awakRiftsLoad();
                const r = rifts.find(x => x.id === riftId);
                if (r) { r.discovered = true; awakRiftsSave(rifts); }
            }

            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.id = 'awakRiftBriefingModal';
            // 📱 Fix mobile : scroll fiable avec align-items:flex-start sur petits écrans
            // 📱 center quand ça tient, flex-start sinon : sur un petit écran, un
            // contenu plus haut que la fenêtre resterait inaccessible en center.
            modal.style.cssText = 'background:rgba(0,0,0,0.92);backdrop-filter:blur(12px);align-items:center;justify-content:center;padding:16px 12px 32px;overflow-y:auto;-webkit-overflow-scrolling:touch;';

            modal.innerHTML = `
            <div class="modal-content" style="max-width:520px;background:linear-gradient(160deg,#0a0e18,#0F1014);border:1px solid ${theme.color}50;padding:0;overflow:visible;border-radius:20px;max-height:none;margin:auto;">
                <!-- Header thématique -->
                <!-- 🌀 En-tête : la brèche elle-même en fond (image déjà utilisée
                     sur l'écran de victoire), voilée pour garder le texte net.
                     L'emoji flotte au-dessus, le rang et le type sont côte à côte. -->
                <div style="background-color:#07070b;background-image:linear-gradient(180deg,rgba(7,7,11,0.30) 0%,rgba(7,7,11,0.80) 65%,rgba(7,7,11,0.96) 100%), url(images/faille_ouverte.webp?v=1622);background-size:cover,100% auto;background-position:center,center top;background-repeat:no-repeat,no-repeat;padding:26px 22px 22px;border-bottom:1px solid ${theme.color}30;text-align:center;position:relative;border-radius:20px 20px 0 0;overflow:hidden;">
                    <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${theme.color},transparent);"></div>
                    <!-- ⚠️ EMOJI RETIRÉ (v1024) : un emoji système de 3,4 em au
                         centre du briefing cassait le ton — et son rendu change
                         d'un téléphone à l'autre. L'image de brèche en fond porte
                         désormais l'ambiance ; un losange fin marque le thème. -->
                    <!-- v1289 : le losange tournait mal (l'animation écrasait la rotation) et
                         ressemblait à une image manquante : on montre le boss de la Faille. -->
                    <!-- v1458 : boss en grand, nom, ambiance, puis UNE ligne de puces -->
                    <div style="margin:4px auto 12px;width:128px;height:128px;display:flex;align-items:center;justify-content:center;animation:awakBriefFloat 4s ease-in-out infinite;filter:drop-shadow(0 0 18px ${theme.color}55);">
                        ${(() => { const _b = (rift.waves || []).find(x => x.isBoss) || (rift.waves || [])[0]; return (_b && window.AwakRiftVis && AwakRiftVis.monstre) ? AwakRiftVis.monstre(_b.name, theme.color, 124, true) : ''; })()}
                    </div>
                    <h2 style="margin:0;color:#fff !important;font-size:1.42em;font-weight:900;letter-spacing:0.5px;line-height:1.2;font-family:var(--font-display),sans-serif;text-wrap:balance;">${awakNomFailleAffiche(rift.name)}</h2>
                    <div style="margin-top:8px;color:#cbd5e1;font-size:0.82em;line-height:1.55;font-style:italic;max-width:340px;margin-left:auto;margin-right:auto;">${theme.description}</div>
                    <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:14px;flex-wrap:wrap;">
                        ${(() => {
                            const puce = (txt, col, ic) => `<span style="display:inline-flex;align-items:center;gap:5px;background:${col}1f;color:${col};border:1px solid ${col}55;padding:4px 10px;border-radius:99px;font-size:0.7em;font-weight:900;letter-spacing:1px;white-space:nowrap;">${ic && window.AwakIcon ? AwakIcon.get(ic, 12, col) : ''}${txt}</span>`;
                            let h = puce('RANG ' + rift.rank, theme.color);
                            if (rift.isAssaut) h += puce('ASSAUT', '#f59e0b', 'eclair');
                            if (!time.permanent) h += puce(time.expired ? 'Expirée' : time.label, time.expired ? '#ef4444' : '#cbd5e1', 'chrono');
                            h += puce(diff.label, diff.color);
                            return h;
                        })()}
                    </div>
                </div>

                <!-- v1458 : Système et anomalie dans un seul bloc court -->
                <div style="padding:16px 22px;background:rgba(0,0,0,0.3);border-bottom:1px solid rgba(255,255,255,0.06);">
                    <div style="font-size:0.6em;color:${theme.color};font-weight:900;letter-spacing:2px;margin-bottom:6px;">SYSTÈME</div>
                    <div style="color:#cbd5e1;font-size:0.88em;line-height:1.5;font-style:italic;">${theme.briefing}</div>
                    ${(() => {
                        const m = (typeof awakGetRiftModifier === 'function') ? awakGetRiftModifier(rift.modifierId) : null;
                        if (!m || m.id === 'none') return '';
                        return `<div style="display:flex;gap:8px;align-items:flex-start;margin-top:11px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">
                            <span style="display:inline-flex;flex-shrink:0;margin-top:1px;">${window.AwakIcon ? AwakIcon.get('alerte', 15, m.color) : ''}</span>
                            <div style="font-size:0.8em;line-height:1.45;color:#cbd5e1;"><b style="color:${m.color};letter-spacing:1px;">${m.name}</b> · ${m.desc}</div>
                        </div>`;
                    })()}
                </div>

                <div style="padding:18px 22px;">
                    <!-- 🧪 Consommables actifs (Phase 5) -->
                    ${(() => {
                        const activeConsum = JSON.parse(localStorage.getItem('awakActiveConsumables') || '[]');
                        if (activeConsum.length === 0) return '';
                        return `
                        <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.25);border-radius:10px;padding:11px;margin-bottom:14px;">
                            <div style="font-size:0.6em;color:#4ade80;font-weight:800;letter-spacing:1.5px;margin-bottom:6px;">PRÉPARATION ACTIVE</div>
                            <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                ${activeConsum.map(id => {
                                    const item = CONSUMABLES.find(c => c.id === id);
                                    if (!item) return '';
                                    return `<div style="background:${item.color}15;border:1px solid ${item.color}40;padding:4px 8px;border-radius:6px;font-size:0.7em;color:${item.color};font-weight:700;">${item.icon || item.emoji} ${item.name}</div>`;
                                }).join('')}
                            </div>
                        </div>`;
                    })()}

                    <!-- Actions -->
                    <div style="display:flex;gap:8px;">
                        <button onclick="document.getElementById('awakRiftBriefingModal').remove()" style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;border-radius:10px;padding:14px;font-weight:800;font-size:0.85em;cursor:pointer;">↩ Plus tard</button>
                        <button onclick="awakEntrerFaille('${rift.id}')" style="flex:2;background:linear-gradient(135deg,${theme.color},${theme.color}dd);border:none;color:white;border-radius:10px;padding:14px;font-weight:900;font-size:0.9em;letter-spacing:1px;cursor:pointer;box-shadow:0 4px 16px ${theme.color}40;">ENTRER</button>
                    </div>

                    <!-- v1458 : le reste, repliable -->
                    <details class="awk-brief-det" style="margin-top:12px;">
                        <summary style="list-style:none;cursor:pointer;text-align:center;color:#94a3b8;font-size:0.8em;font-weight:700;padding:8px;">Détails</summary>
                        <div style="padding-top:8px;">
                    ${rift.isAssaut ? (() => { const A = awakAssautApercu(rift); return `<div style="display:flex;align-items:center;gap:12px;background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.35);border-radius:10px;padding:11px 13px;margin-bottom:10px;">
                        <div style="flex:1;min-width:0;"><div style="font-size:0.6em;color:#f59e0b;font-weight:900;letter-spacing:1.5px;margin-bottom:3px;">DURÉE DE L'ASSAUT</div>
                        <div style="font-size:1.1em;font-weight:900;color:white;">${A.label}</div>
                        <div style="font-size:0.62em;color:#94a3b8;margin-top:2px;">${A.n} exercices de 40 s · 20 s de repos entre chacun</div></div>
                        <div style="text-align:right;min-width:0;"><div style="font-size:0.6em;color:#94a3b8;font-weight:800;letter-spacing:1.5px;margin-bottom:3px;">MATÉRIEL</div>
                        <div style="font-size:0.82em;font-weight:900;color:#fde68a;">${String(A.arme).replace(/[<>&"]/g, '')}</div></div>
                    </div>`; })() : ''}
                    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:10px;">
                        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:11px;">
                            <div style="font-size:0.6em;color:#94a3b8;font-weight:800;letter-spacing:1.5px;margin-bottom:4px;">TON POWER</div>
                            <div style="font-size:1.1em;font-weight:900;color:white;">${playerPower.toLocaleString('fr-FR')}</div>
                            ${rift.recommendedPower > 0 ? `<div style="font-size:0.62em;color:#8391a7;margin-top:2px;">recommandé : ${rift.recommendedPower.toLocaleString('fr-FR')}</div>` : ''}
                        </div>
                        <div style="background:rgba(255,255,255,0.03);border:1px solid ${theme.color}40;border-radius:10px;padding:11px;">
                            <div style="font-size:0.6em;color:#94a3b8;font-weight:800;letter-spacing:1.5px;margin-bottom:4px;">ATTRIBUT</div>
                            <div style="font-size:1.1em;font-weight:900;color:${theme.color};">${rift.primaryStat}</div>
                            <div style="font-size:0.62em;color:#8391a7;margin-top:2px;">${playerStats[rift.primaryStat] || 0} pts actuels</div>
                        </div>
                    </div>
                    <!-- Vagues prévues -->
                    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:10px;padding:11px;margin-bottom:10px;">
                        <div style="font-size:0.6em;color:#94a3b8;font-weight:800;letter-spacing:1.5px;margin-bottom:8px;">VAGUES (${rift.waves.length})</div>
                        <div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${rift.waves.map((w, i) => `
                                <div title="${String(w.name || '').replace(/"/g, '&quot;')}" style="width:46px;height:46px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${w.isBoss ? theme.color + '22' : 'rgba(255,255,255,0.04)'};border:1px solid ${w.isBoss ? theme.color : 'rgba(255,255,255,0.08)'};">
                                    ${(window.AwakRiftVis && AwakRiftVis.monstre) ? AwakRiftVis.monstre(w.name, theme.color, 38, !!w.isBoss) : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    ${(() => {
                        const check = typeof awakCanDelegateRift === 'function' ? awakCanDelegateRift(rift) : {ok:false};
                        const dur = typeof awakCompanionMissionDuration === 'function' ? awakCompanionMissionDuration(rift.rank) : 0;
                        const hrs = dur/3600000;
                        const durTxt = hrs >= 1 ? `${hrs.toFixed(1)} h` : `${Math.round(hrs*60)} min`;
                        if (check.ok) {
                            // 🎭 Le bouton ouvre maintenant le CHOIX des compagnons
                            const nDispo = typeof awakCompanionsDisponibles === 'function' ? awakCompanionsDisponibles().length : 0;
                            return `<button onclick="awakOpenDelegatePicker('${rift.id}')" style="width:100%;margin-top:4px;background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.4);color:#c084fc;border-radius:10px;padding:13px;font-weight:800;font-size:0.82em;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;">
                                <span>Envoyer des compagnons <span style="opacity:0.7;font-weight:600;">(sans loot)</span></span>
                                <span style="font-size:0.85em;color:#94a3b8;font-weight:700;">Choisir qui envoyer · ${nDispo} disponible${nDispo>1?'s':''}</span>
                            </button>`;
                        } else {
                            return `<div style="width:100%;margin-top:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);color:#8391a7;border-radius:10px;padding:11px;font-size:0.72em;text-align:center;">Délégation indisponible — ${check.reason}</div>`;
                        }
                    })()}
                        </div>
                    </details>
                </div>
            </div>`;

            document.body.appendChild(modal);
            dismissOnBackdrop(modal);
        }
        window.awakOpenRiftBriefing = awakOpenRiftBriefing;

        // ═══════════════════════════════════════════════════════════════
        // ⚔️ COMBAT EN VAGUES — état de session de Faille
        // ═══════════════════════════════════════════════════════════════
        let awakActiveRiftSession = null;

        function awakStartRift(riftId) {
            const rift = awakGetRiftById(riftId);
            if (!rift) return;
            // v1304 : une séance de combat d'une AUTRE Faille (ou d'une Chasse) encore
            // ouverte est fermée, et ses bandeaux retirés.
            try {
                if (currentWorkout && (currentWorkout._isRift || currentWorkout._isHunt) && currentWorkout._riftId !== riftId) _forceExitRiftSession();
                else _awakNettoyerCombatUI();
            } catch (e) { _awkE(e); }

            // ⚡ ASSAUT : séance entièrement chronométrée, exercices imposés par
            // le thème. On court-circuite la préparation classique (choix de
            // muscles, de durée…) : dans un Assaut, on n'a rien à choisir.
            if (rift.isAssaut && typeof awakBuildAssautWorkout === 'function') {
                const w = awakBuildAssautWorkout(rift);
                if (w) {
                    document.getElementById('awakRiftBriefingModal')?.remove();
                    awakActiveRiftSession = {
                        rift: rift,
                        startTime: Date.now(),
                        totalDamageDealt: 0,
                        setsCompleted: 0,
                        exercisesUsed: []
                    };
                    try { if (typeof switchTab === 'function') switchTab('workouts'); } catch (e) { _awkE(e); }
                    if (w._assautReplie && typeof showToast === 'function') {
                        showToast('◈ Tes armes ne sont pas là. Il faudra faire sans.', 'info', 3200);
                    }
                    w._forceNew = true;
                    if (typeof showWorkoutPreparation === 'function') showWorkoutPreparation(w);
                    return;
                }
            }
            const theme = RIFT_THEMES.find(t => t.id === rift.themeId) || {
                id: rift.themeId, name: rift.name, emoji: '◇', color: '#a855f7',
                description: '', briefing: '', primaryStat: rift.primaryStat,
                exerciseFilter: ex => true
            };

            // 🧪 Phase 5 : appliquer effets consommables (HP cut sur vagues)
            const consumEffects = typeof awakConsumablesGetActiveEffects === 'function'
                ? awakConsumablesGetActiveEffects() : {};

            // 💾 Vérifier si la Faille est déjà en cours (HP entamés sur la vague actuelle)
            const currentWaveIdx = rift.currentWaveIdx || 0;
            const currentWave = rift.waves[currentWaveIdx];
            const isInProgress = currentWave && currentWave.hpCurrent < currentWave.hpMax;

            if (!isInProgress) {
                // Première entrée OU après abandon → reset les HP
                rift.waves.forEach((w, i) => {
                    // Ne reset que les vagues pas encore vaincues
                    if (i < currentWaveIdx) return; // vague déjà passée, garde HP=0
                    let hpMax = w.hpMax;
                    if (consumEffects.hpCut) {
                        hpMax = Math.round(hpMax * (1 - consumEffects.hpCut));
                    }
                    // v1538 : Chevalier Brisé (monstre échappé) — monstres plus résistants
                    try { const _ha = awakGetActiveHandicaps(); if (_ha.armure > 0) hpMax = Math.round(hpMax * (1 + _ha.armure / 100)); } catch (e) { _awkE(e); }
                    // v1522 : vague renforcée selon l'aide de l'équipe (une seule fois par vague)
                    if (!w._hpEquipe) { const _fe = awakRiftFacteurPV(rift); w._hpEquipe = _fe; hpMax = Math.round(hpMax * _fe); }
                    w.hpMax = hpMax;
                    w.hpCurrent = hpMax;
                    // Reset boss mechanics flags
                    w._phaseTriggered = false;
                    w._weaknessRevealed = false;
                    w._enraged = false;
                    w._addSpawned = false;
                    w._ouverture = null;
                    w._hitCount = 0;
                });
                if (currentWaveIdx === 0) rift.attempts = (rift.attempts || 0) + 1;
            }
            // Sinon : on reprend là où on en était (HP intacts)

            awakActiveRiftSession = {
                rift,
                theme,
                startTime: Date.now(),
                totalDamageDealt: 0,
                setsCompleted: 0,
                exercisesUsed: [],
                workout: null
            };

            // Fermer le briefing
            document.getElementById('awakRiftBriefingModal')?.remove();

            // 💬 Phase 4 : dialogue compagnon
            try { setTimeout(() => awakCompanionShowDialogue('onFightStart'), 800); } catch(e) { _awkE(e); }

            // Afficher l'écran de combat
            awakShowRiftCombatScreen();
        }
        window.awakStartRift = awakStartRift;

        // v1447 : franchir le SEUIL avant d'entrer dans une Faille.
        //   Faille d'histoire, abysse, sous-boss, compagnon (1re entrée) : séquence complète
        //   (maintenir puis glisser). Failles ordinaires : appui long seulement.
        //   Séquence déjà vue il y a moins de 10 min (apparition) : appui long seulement.
        function awakEntrerFaille(riftId) {
            const rift = awakGetRiftById(riftId);
            if (!rift || !window.AwakSeuil) { awakStartRift(riftId); return; }
            if (currentWorkout && (currentWorkout._isRift || currentWorkout._isHunt)) { awakStartRift(riftId); return; }
            const speciale = !!(rift.narrativeId || rift.isAbyss || rift.isSubBoss || rift.subBossId || rift.isCompanionRift || rift.companionId);
            const vu = (window._awakSeuilVu || {})[rift.id];
            const complet = speciale && !(vu && Date.now() - vu < 600000) && !(rift.attempts > 0);
            const theme = (typeof RIFT_THEMES !== 'undefined' && RIFT_THEMES.find(t => t.id === rift.themeId)) || {};
            const nd = rift.narrativeData || {};
            const phr = (t, n) => { t = String(t || '').trim(); const m = t.match(/^[^.!?…]+[.!?…]/); t = m ? m[0] : t; return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; };
            const rang = rift.rank ? 'Rang ' + rift.rank : '';
            const vagues = (rift.waves || []).length;
            AwakSeuil.ouvrir({
                complet,
                couleur: nd.color || theme.color,   // v1518 : la faille prend la couleur de son thème
                titre: rift.discovered === false ? 'Une Faille inconnue' : (rift.name || theme.name || 'Faille'),
                sous: [rang, vagues ? vagues + ' vague' + (vagues > 1 ? 's' : '') : ''].filter(Boolean).join(' · '),
                titre2: phr(nd.description || theme.description, 70) || 'Au-delà, le silence est plus lourd.',
                sous2: phr(nd.briefing || theme.briefing, 150),
                onEntrer: () => awakStartRift(riftId)
            });
        }
        window.awakEntrerFaille = awakEntrerFaille;

        // Icône SVG d'exercice (choix d'attaque Failles / Chasse) — remplace les emojis
        function awakExoIconBox(muscle, color) {
            const m = String(muscle || '').toLowerCase();
            const n = /cardio/.test(m) ? 'course' : /(abdo|oblique|gainage)/.test(m) ? 'bouclier'
                : /(quadri|ischio|fessier|mollet|adducteur|jambe)/.test(m) ? 'eclair'
                : /(biceps|triceps|avant-bras|épaule|epaule)/.test(m) ? 'muscle' : 'halter';
            const svg = window.AwakIcon ? AwakIcon.get(n, 20, color) : '';
            return '<div style="width:38px;height:38px;flex-shrink:0;border-radius:10px;display:flex;align-items:center;justify-content:center;background:' + color + '18;border:1px solid ' + color + '40;">' + svg + '</div>';
        }
        window.awakExoIconBox = awakExoIconBox;

        // v1422 — choix de la voix (Faille « Le Faux Système »)
        const AWAK_VOIX = [
            ['Respire. La vague ne partira pas sans toi.', 'Ne respire pas. Chaque seconde de repos te rapproche de l\'effacement.'],
            ['Tu as le droit d\'avoir mal. Ralentis si tu dois. Mais reviens.', 'Une Ancre ne ralentit jamais. Ralentir, c\'est déjà commencer à s\'asseoir.'],
            ['Je ne sais pas si on va gagner. Je sais que je préfère le faire avec toi.', 'Victoire assurée. Tu n\'as besoin de personne. Tu n\'en as jamais eu besoin.']
        ];
        function awakFauxSystemeChoix(rift, idx) {
            if (document.getElementById('awakVoixOverlay')) return;
            const wave = rift.waves[idx]; if (!wave || wave._voix) return;
            const paire = AWAK_VOIX[Math.min(idx, AWAK_VOIX.length - 1)];
            const vraiEnHaut = Math.random() < 0.5;
            const msgs = vraiEnHaut ? [[paire[0], 'vrai'], [paire[1], 'faux']] : [[paire[1], 'faux'], [paire[0], 'vrai']];
            const o = document.createElement('div');
            o.id = 'awakVoixOverlay';
            o.style.cssText = 'position:fixed;inset:0;z-index:100002;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);padding:20px;';
            o.innerHTML = '<div style="max-width:420px;width:100%;background:linear-gradient(160deg,#0a0e18,#0F1014);border:1px solid #c084fc55;border-radius:18px;padding:22px 18px;text-align:center;">'
                + '<div style="font-size:0.6em;letter-spacing:2.5px;color:#c084fc;font-weight:900;margin-bottom:6px;">VAGUE ' + (idx + 1) + ' / ' + rift.waves.length + '</div>'
                + '<div style="color:#e2e8f0;font-weight:800;font-size:1em;margin-bottom:14px;">Deux voix. Laquelle est le Système ?</div>'
                + msgs.map(m => '<button data-voix="' + m[1] + '" style="display:block;width:100%;text-align:left;margin-bottom:10px;background:rgba(192,132,252,0.07);border:1px solid rgba(192,132,252,0.35);border-left:3px solid #c084fc;border-radius:12px;padding:12px 14px;cursor:pointer;">'
                    + '<div style="font-size:0.58em;letter-spacing:2px;color:#c084fc;font-weight:900;margin-bottom:4px;">SYSTÈME</div>'
                    + '<div style="color:#cbd5e1;font-size:0.86em;font-style:italic;line-height:1.5;">« ' + m[0] + ' »</div></button>').join('')
                + '</div>';
            document.body.appendChild(o);
            o.querySelectorAll('[data-voix]').forEach(b => b.onclick = () => {
                const vrai = b.getAttribute('data-voix') === 'vrai';
                wave._voix = vrai ? 'vrai' : 'faux';
                const f = vrai ? 0.8 : 1.25;
                wave.hpMax = Math.max(1, Math.round(wave.hpMax * f)); wave.hpCurrent = wave.hpMax;
                if (!vrai) rift._fauxCount = (rift._fauxCount || 0) + 1;
                try { const all = awakRiftsLoad(); const i = all.findIndex(r => r.id === rift.id); if (i >= 0) { all[i] = rift; awakRiftsSave(all); } } catch (e) { _awkE(e); }
                o.remove();
                try { showToast(vrai ? 'C\'était bien moi. La vague faiblit (−20 % PV).' : 'Ce n\'était pas moi. La vague se renforce (+25 % PV).', vrai ? 'success' : 'warning', 3500); } catch (e) { _awkE(e); }
                try { if (document.getElementById('awakRiftCombatModal')) awakShowRiftCombatScreen(); } catch (e) { _awkE(e); }
            });
        }
        window.awakFauxSystemeChoix = awakFauxSystemeChoix;

        function awakShowRiftCombatScreen() {
            const session = awakActiveRiftSession;
            if (!session) return;
            const { rift, theme } = session;
            const currentWave = rift.waves[rift.currentWaveIdx];
            if (!currentWave) {
                // Toutes les vagues vaincues → victoire
                awakCompleteRift();
                return;
            }

            // v1422 — LE FAUX SYSTÈME : avant chaque vague, deux messages « SYSTÈME ».
            // Le vrai n'interdit jamais le repos (« Ce qu'est une Ancre ») ; le faux parle comme Nabdano.
            if (rift.narrativeId === 'false_system' && !currentWave._voix && currentWave.hpCurrent >= currentWave.hpMax) {
                setTimeout(() => { try { awakFauxSystemeChoix(rift, rift.currentWaveIdx); } catch (e) { _awkE(e); } }, 350);
            }

            try { awakAssurerMechBoss(rift, currentWave); } catch (e) { _awkE(e); }
            // v1468 : un boss se présente (nom + image) avant son combat, une fois par vague.
            try {
                const _cle = rift.id + ':' + rift.currentWaveIdx;
                if (currentWave.isBoss && session._bossIntro !== _cle && window.AwakRiftVis && AwakRiftVis.bossIntro) {
                    session._bossIntro = _cle;
                    setTimeout(() => {
                        try { AwakRiftVis.bossIntro({ nom: currentWave.name, couleur: theme.color, sousTitre: rift.isSubBoss ? 'ÉPREUVE' : 'BOSS', ligne: currentWave.bossMech && /^bm_/.test(currentWave.bossMech.id) ? (currentWave.bossMech.name + ' — ' + currentWave.bossMech.desc) : '' }); } catch (e) { _awkE(e); }
                    }, 250);
                }
            } catch (e) { _awkE(e); }

            // Modal full screen pour le combat
            document.getElementById('awakRiftCombatModal')?.remove();
            const modal = document.createElement('div');
            modal.id = 'awakRiftCombatModal';
            modal.className = 'modal active';
            // 📱 Fix mobile : scroll fiable
            modal.style.cssText = 'background:rgba(0,0,0,0.95);backdrop-filter:blur(8px);align-items:flex-start;padding:12px 12px 40px;overflow-y:auto;-webkit-overflow-scrolling:touch;';

            // Exercices proposés (filtrés par thème)
            const exercises = awakGetExercisesForRift(rift, 4);

            const hpPercent = Math.max(0, Math.round((currentWave.hpCurrent / currentWave.hpMax) * 100));
            const hpColor = hpPercent > 60 ? '#22c55e' : hpPercent > 30 ? '#f59e0b' : '#ef4444';
            // 🌫️ Modificateur Brouillard : masquer les HP
            const _riftMod = (typeof awakGetRiftModifier === 'function') ? awakGetRiftModifier(rift.modifierId) : null;
            const _hideHp = _riftMod && _riftMod.hideHp;
            const hpBarWidth = _hideHp ? 100 : hpPercent;
            const hpText = _hideHp ? '??? HP' : `${currentWave.hpCurrent} / ${currentWave.hpMax} HP`;
            const hpBarColor = _hideHp ? '#64748b' : hpColor;

            modal.innerHTML = `
            <div class="modal-content" style="max-width:540px;background:linear-gradient(160deg,#0a0e18,#0F1014);border:1px solid ${theme.color}50;padding:0;overflow:visible;border-radius:20px;max-height:none;margin:auto;display:flex;flex-direction:column;">
                <!-- Header : vague actuelle -->
                <div style="background-color:#0a0b12;background-image:linear-gradient(180deg,rgba(10,11,18,0.35) 0%,rgba(10,11,18,0.75) 60%,rgba(10,11,18,0.97) 100%),radial-gradient(60% 50% at 50% 45%,${theme.color}40,transparent 70%),url(images/faille_ouverte.webp?v=1622);background-size:cover,cover,cover;background-position:center;padding:16px 20px 18px;border-bottom:1px solid ${theme.color}35;border-radius:20px 20px 0 0;overflow:hidden;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <span style="font-size:0.6em;color:${theme.color};font-weight:900;letter-spacing:2px;">⚔ VAGUE ${rift.currentWaveIdx + 1} / ${rift.waves.length}${currentWave.isBoss ? ' · BOSS' : ''}</span>
                        <button onclick="awakAbandonRift()" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171;border-radius:10px;padding:5px 10px;font-size:0.7em;font-weight:800;cursor:pointer;">✕ Fuir</button>
                    </div>
                    <!-- Silhouette SVG du monstre (rift-visuals.js) + progression des vagues -->
                    <div style="display:flex;justify-content:center;margin:4px 0 6px;">${window.AwakRiftVis ? AwakRiftVis.monstre(currentWave.name, theme.color, currentWave.isBoss ? 132 : 112, currentWave.isBoss) : ''}</div>
                    <div style="display:flex;justify-content:center;gap:7px;margin-bottom:10px;">${rift.waves.map((w, wi) => { const fait = wi < rift.currentWaveIdx, ici = wi === rift.currentWaveIdx, bz = 7 + (w.isBoss ? 3 : 0); return `<span style="display:inline-block;width:${bz}px;height:${bz}px;transform:rotate(45deg);border:1px solid ${fait || ici ? theme.color : 'rgba(148,163,184,0.4)'};background:${fait ? theme.color : ici ? theme.color + '55' : 'transparent'};${ici ? 'box-shadow:0 0 8px ' + theme.color + ';' : ''}"></span>`; }).join('')}</div>
                    <div style="display:flex;align-items:center;gap:14px;">
                        <div style="flex:1;text-align:center;">
                            <div style="font-weight:900;color:white;font-size:1.15em;margin-bottom:7px;text-shadow:0 2px 10px #000;">${currentWave.name}</div>
                            ${(() => { const f = window.AwakRiftVis ? AwakRiftVis.faiblesse(currentWave.name) : null; const inf = f ? AwakRiftVis.effortInfo(f) : null; return inf ? `<div style="margin:-2px 0 9px;">${AwakRiftVis.puceFaiblesse(f, theme.color)}<div style="font-size:0.66em;color:#cbd5e1;margin-top:5px;line-height:1.35;">${inf.raison} <b style="color:#fbbf24;">Dégâts ×1,5.</b></div></div>` : ''; })()}
                            <div style="background:rgba(255,255,255,0.05);height:14px;border-radius:99px;overflow:hidden;border:1px solid rgba(255,255,255,0.05);position:relative;">
                                <div style="width:${hpBarWidth}%;height:100%;background:linear-gradient(90deg,${hpBarColor},${hpBarColor}cc);transition:width 0.5s cubic-bezier(0.16,1,0.3,1);box-shadow:0 0 8px ${hpBarColor}80;${_hideHp ? 'opacity:0.5;' : ''}"></div>
                                <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.65em;font-weight:900;color:white;text-shadow:0 0 4px black;letter-spacing:1px;">${hpText}</div>
                            </div>
                            ${currentWave.isBoss && currentWave.bossMech ? `<div style="margin-top:6px;font-size:0.68em;color:${theme.color};font-weight:700;">⚠ Mécanique : ${currentWave.bossMech.name} — ${currentWave.bossMech.desc}</div>${(() => { const _e = awakBossMechEtat(currentWave); return _e ? `<div style="margin-top:4px;display:inline-block;font-size:0.66em;font-weight:900;color:#fde68a;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.4);border-radius:7px;padding:2px 8px;">${_e}</div>` : ''; })()}` : ''}
                        </div>
                    </div>
                </div>

                <!-- 💚 BARRE HP JOUEUR -->
                ${(() => {
                    const maxHP = (typeof awakGetPlayerMaxHP === 'function') ? awakGetPlayerMaxHP() : 100;
                    const curHP = (typeof awakGetPlayerHP === 'function') ? awakGetPlayerHP() : maxHP;
                    const pPct = Math.max(0, Math.round((curHP / maxHP) * 100));
                    const pColor = pPct > 60 ? '#4ade80' : pPct > 30 ? '#fbbf24' : '#ef4444';
                    return `
                    <div style="padding:10px 20px;background:rgba(34,197,94,0.04);border-bottom:1px solid rgba(74,222,128,0.15);">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span style="line-height:1;display:inline-flex;">${window.AwakIcon ? AwakIcon.get('sante', 20, '#4ade80') : ''}</span>
                            <div style="flex:1;">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                                    <span style="font-size:0.55em;color:#4ade80;font-weight:900;letter-spacing:2px;text-transform:uppercase;text-shadow:0 0 6px rgba(74,222,128,0.4);">◈ VITALITÉ</span>
                                    <span id="playerHpText" style="font-size:0.65em;color:white;font-weight:900;font-variant-numeric:tabular-nums;">${curHP} / ${maxHP} HP</span>
                                </div>
                                <div style="background:rgba(0,0,0,0.5);height:8px;border-radius:99px;overflow:hidden;border:1px solid rgba(255,255,255,0.05);">
                                    <div id="playerHpBar" style="width:${pPct}%;height:100%;background:linear-gradient(90deg,${pColor},${pColor}cc);transition:width 0.6s cubic-bezier(0.16,1,0.3,1);box-shadow:0 0 8px ${pColor}80;"></div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                })()}

                <!-- 🎯 BONUS ACTIFS (stats) -->
                ${(() => {
                    if (typeof awakComputeStatBonuses !== 'function') return '';
                    const b = awakComputeStatBonuses(null, currentWave.isBoss);
                    const items = [];
                    if (b.raw.STR > 0) items.push({ ico: 'epee', color: '#ef4444', label: `+${Math.round((b.damageMult - 1) * 100)}% DGTS`, tip: `STR ${b.raw.STR}` });
                    if (b.raw.AGI > 0) items.push({ ico: 'eclair', color: '#fbbf24', label: `${Math.round(b.critChance * 100)}% CRIT`, tip: `AGI ${b.raw.AGI}` });
                    if (b.raw.VIT > 0) items.push({ ico: 'chrono', color: '#3b82f6', label: `${Math.round(b.doubleChance * 100)}% × 2 · ${Math.round(Math.min(0.40, b.raw.VIT / (b.raw.VIT + 300)) * 100)}% bloqués`, tip: `VIT ${b.raw.VIT}` });
                    if (b.raw.END > 0) items.push({ ico: 'sante', color: '#4ade80', label: `+${b.hpRegen} HP/série`, tip: `END ${b.raw.END}` });
                    if (b.raw.PER > 0) {
                        if (currentWave.isBoss) {
                            items.push({ ico: 'cible', color: '#a855f7', label: `+${Math.round(b.bossBonus * 100)}% BOSS`, tip: `PER ${b.raw.PER}` });
                        }
                        items.push({ ico: 'bouclier', color: '#a855f7', label: `${Math.round(b.dodgeChance * 100)}% ESQ.`, tip: `PER ${b.raw.PER}` });
                    }
                    if (b.raw.SEN > 0) items.push({ ico: 'etoile', color: '#ec4899', label: `+${Math.round((b.xpMult - 1) * 100)}% XP`, tip: `SEN ${b.raw.SEN}` });

                    if (items.length === 0) return '';

                    return `
                    <div style="padding:10px 20px;background:rgba(0,0,0,0.4);border-bottom:1px solid rgba(255,255,255,0.05);">
                        <div style="font-size:0.55em;color:#94a3b8;font-weight:900;letter-spacing:2px;margin-bottom:6px;text-transform:uppercase;">◈ BONUS ACTIFS</div>
                        <div style="display:flex;flex-wrap:wrap;gap:5px;">
                            ${items.map(i => `
                                <span title="${i.tip}" style="display:inline-flex;align-items:center;gap:4px;background:${i.color}15;border:1px solid ${i.color}50;color:${i.color};padding:3px 8px;border-radius:99px;font-size:0.6em;font-weight:900;letter-spacing:0.5px;text-shadow:0 0 4px ${i.color}50;">
                                    <span style="line-height:1;display:inline-flex;">${window.AwakIcon ? AwakIcon.get(i.ico, 12, i.color) : ''}</span>
                                    <span>${i.label}</span>
                                </span>
                            `).join('')}
                        </div>
                    </div>`;
                })()}

                <!-- Choix d'exercices -->
                <div style="padding:18px 20px;overflow-y:auto;flex:1;">
                    <div style="font-size:0.62em;color:#94a3b8;font-weight:800;letter-spacing:2px;margin-bottom:6px;">◈ EXERCICE POUR ATTAQUER</div>
                    <div style="font-size:0.66em;color:#cbd5e1;line-height:1.45;margin-bottom:10px;">Dépasse l'objectif de reps pour frapper plus fort (jusqu'à ×1,75). Bats ton record sur l'exercice : <b style="color:#fbbf24;">critique garanti</b>.${currentWave.isBoss ? ` À mi-vie, le boss se découvre : une série à objectif +3 reps frappe <b style="color:#fbbf24;">×2,5</b>.` : ''}</div>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        ${(() => { const _best = Math.max(...exercises.map(e => e.estDmg || 0)), _pire = Math.min(...exercises.map(e => e.estDmg || 0)); return exercises.map((ex, i) => `
                            <button onclick="awakPickRiftExercise(${i})" data-exidx="${i}" class="awak-rift-ex-btn" style="text-align:left;background:${ex._faible ? 'rgba(251,191,36,0.07)' : 'rgba(255,255,255,0.03)'};border:1px solid ${ex._faible ? 'rgba(251,191,36,0.55)' : 'rgba(255,255,255,0.08)'};${ex._faible ? 'box-shadow:0 0 14px rgba(251,191,36,0.15);' : ''}color:white;border-radius:10px;padding:12px 14px;cursor:pointer;transition:all 0.2s;">
                                <div style="display:flex;align-items:center;gap:10px;">
                                    ${awakExoIconBox(ex.muscle, theme.color)}
                                    <div style="flex:1;min-width:0;">
                                        <div style="font-weight:800;font-size:0.92em;margin-bottom:2px;">${ex.name}</div>
                                        <div style="font-size:0.7em;color:#94a3b8;font-weight:600;">${ex.muscle || 'Multi'} · ${ex.estDmg} dgts/série</div>
                                        ${ex._faible || (_pire < _best && ex.estDmg === _best) ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px;">${ex._faible ? `<span style="font-size:0.6em;font-weight:900;color:#fbbf24;border:1px solid rgba(251,191,36,0.55);border-radius:5px;padding:1px 6px;">POINT FAIBLE ×1,5</span>` : ''}${_pire < _best && ex.estDmg === _best ? `<span style="font-size:0.6em;font-weight:900;color:${theme.color};border:1px solid ${theme.color}66;border-radius:5px;padding:1px 6px;">MEILLEUR COUP</span>` : ''}</div>` : ''}
                                    </div>
                                    <div style="flex-shrink:0;display:inline-flex;">${window.AwakIcon ? AwakIcon.get('epee', 18, theme.color) : ''}</div>
                                </div>
                            </button>
                        `).join(''); })()}
                    </div>
                </div>
            </div>`;

            document.body.appendChild(modal);
            // On stocke les exercices proposés pour les retrouver
            awakActiveRiftSession.currentExercises = exercises;
        }
        window.awakShowRiftCombatScreen = awakShowRiftCombatScreen;

        /**
         * Sélectionne des exercices pour une Faille selon son thème
         */
        // v1569 : Failles et Chasses — mêmes refus que les séances (limitations, douleurs,
        // exercices bannis, mode silencieux, matériel caché), puis le NIVEAU (souple :
        // seulement s'il reste assez d'exercices). Avant : seuls l'âge et le matériel.
        function awakCombatSecurite(liste, mini) {
            mini = mini || 1;
            let L = liste || [];
            try {
                const sur = L.filter(ex => !(typeof awakRaisonRefus === 'function' && awakRaisonRefus(ex, { sansNiveau: true })));
                if (sur.length >= Math.min(mini, 1) && sur.length) L = sur;
            } catch (e) { _awkE(e); }
            try {
                const lv = ((typeof getUserProfile === 'function' && getUserProfile()) || {}).level || 'intermediate';
                const permis = lv === 'beginner' ? ['Débutant'] : lv === 'advanced' ? null : ['Débutant', 'Intermédiaire'];
                if (permis) {
                    const niv = L.filter(ex => !ex.difficulty || permis.indexOf(ex.difficulty) >= 0);
                    if (niv.length >= mini) L = niv;
                    else if (lv === 'beginner') {
                        const niv2 = L.filter(ex => !ex.difficulty || ex.difficulty !== 'Avancé');
                        if (niv2.length >= mini) L = niv2;
                    }
                }
            } catch (e) { _awkE(e); }
            return L;
        }
        function awakGetExercisesForRift(rift, count) {
            let theme = RIFT_THEMES.find(t => t.id === rift.themeId);
            if (!theme && rift.isNarrative && rift.narrativeData) {
                theme = {
                    primaryStat: rift.primaryStat,
                    exerciseFilter: rift.narrativeData.exerciseFilter
                };
            }
            // 🛡️ Si le thème est introuvable ou n'a pas de filtre (Faille d'ancien format,
            // themeId obsolète…), on ne retourne JAMAIS vide : thème de secours = tout accepter.
            if (!theme || typeof theme.exerciseFilter !== 'function') {
                theme = {
                    primaryStat: (rift && rift.primaryStat) || 'STR',
                    exerciseFilter: () => true
                };
            }
            const playerStats = awakGetTotalStats();

            // 🎒 Équipement réellement disponible pour le joueur (selon son lieu actif)
            const playerEquip = (typeof getEquipmentNames === 'function') ? getEquipmentNames() : ['Poids du corps'];
            const equipSet = new Set(playerEquip);
            equipSet.add('Poids du corps'); equipSet.add('Aucun'); // toujours dispo
            const hasEquip = (ex) => {
                // ⚠️ `every` et NON `some` : un exercice exige TOUS ses
                // équipements, pas un seul. Avec `some`, « Traction sur barre
                // de parc » passait dès qu'un matériel quelconque était coché —
                // d'où des exercices d'extérieur proposés en Faille alors que
                // le lieu ne l'était pas.
                // On délègue à awakEquipmentOk(), déjà utilisé par le
                // générateur de séance : un seul filtre, un seul comportement.
                try {
                    if (typeof awakEquipmentOk === 'function') {
                        return awakEquipmentOk(ex, Array.from(equipSet));
                    }
                } catch (e) { _awkE(e); }
                const eq = ex.equipment || [];
                if (eq.length === 0) return true;
                return eq.every(e => equipSet.has(e));
            };

            // Filtre commun : seulement de VRAIS exercices (pas échauffement/étirement/info)
            // v1569 : refus de sécurité aussi dans tous les replis (sauf si plus rien ne passe)
            let _secu = true;
            const _refuse = (ex) => { try { return typeof awakRaisonRefus === 'function' && !!awakRaisonRefus(ex, { sansNiveau: true }); } catch (e) { return false; } };
            let _niv = 'intermediate'; try { _niv = ((typeof getUserProfile === 'function' && getUserProfile()) || {}).level || 'intermediate'; } catch (e) { _awkE(e); }
            const isCombatExercise = (ex) => {
                const t = ex.type || 'exercise';
                if (t !== 'exercise') return false; // exclut warmup, stretch, info
                if (_secu && _niv !== 'advanced' && ex.difficulty === 'Avancé') return false;   // v1569 : niveau
                return !(_secu && _refuse(ex));
            };

            // 🔁 Failles = pas d'exercices ISOMÉTRIQUES (tenues de position qui se mesurent
            // en durée, pas en répétitions). Le cardio (jumping jacks, burpees...) reste autorisé.
            const isNotIsometric = (ex) => {
                const name = (ex.name || '').toLowerCase();
                const isometricKeywords = [
                    'planche', 'plank', 'gainage', 'hold', 'hollow', 'wall sit',
                    'chaise murale', 'isométrique', 'isometrique', 'vacuum',
                    'superman', 'dead bug', 'bird dog', 'l-sit', 'l sit'
                ];
                return !isometricKeywords.some(kw => name.includes(kw));
            };

            // ⏱ v1230 : une Faille se joue en RÉPÉTITIONS. Les exercices qui se font
            // à la durée ou à la distance (tapis roulant, vélo, rameur, course,
            // intervalles…) demandaient un nombre de reps absurde : on les écarte.
            const isRepBased = (ex) => {
                // ⚠️ On ne se fie PAS à ex.mode : Burpees, Jumping jacks ou Box jumps
                // sont en « timer » dans la base mais se comptent très bien en reps.
                if ((ex.mode || '') === 'distance') return false;
                const n = (ex.name || '').toLowerCase();
                const eq = (ex.equipment || []).join(' ').toLowerCase();
                const motsDuree = ['tapis roulant', 'treadmill', 'vélo', 'velo', 'bike', 'rameur', 'rowing sprint', 'rower',
                    'elliptique', 'elliptical', 'stairmaster', 'natation', 'swim', 'water running', 'piscine',
                    'course', 'jogging', 'running', 'sprint', 'marche', 'walk', 'intervalle', 'interval', 'hiit',
                    'corde à sauter', 'jump rope', 'rounds', 'shadow', 'battle rope', 'traîneau', 'traineau', 'sled',
                    // v1270 : activités de plein air / de lieu (randonnée, escaliers, navette…)
                    'randonn', 'hiking', 'navette', 'shuttle', 'escalier', 'stair', 'escalade', 'grimper',
                    'trail', 'bounding', 'bondissement'];
                if (motsDuree.some(k => n.replace('sprinter', '').includes(k))) return false;
                // Exercice d'extérieur alors que le lieu actif ne l'est pas
                try { if (typeof awakExerciseBlockedByLocation === 'function' && awakExerciseBlockedByLocation(ex)) return false; } catch (e) { _awkE(e); }
                if (/tapis roulant|vélo stationnaire|rameur|elliptique|stairmaster|piscine/.test(eq)) return false;
                if (/\bpool\b|aqua|water/.test(n)) return false;   // v1417 : filet (exercices de piscine nommés en anglais)
                return true;
            };

            // Tous les exos qui matchent le thème — VRAIS exercices, non isométriques, équipement dispo
            let pool = (typeof _dbMuscu === 'function' ? _dbMuscu() : (typeof exerciseDatabase !== 'undefined' ? exerciseDatabase : []))
                .filter(ex => theme.exerciseFilter(ex))
                .filter(isCombatExercise)
                .filter(isNotIsometric)
                .filter(isRepBased)
                .filter(hasEquip);

            // 🧒 PROFIL JEUNE : dans les Failles aussi, on écarte les exercices à
            // charge. Pour un ENFANT, on va plus loin : POIDS DU CORPS uniquement.
            // Pour un ado, on retire seulement les charges lourdes (barre/machine).
            // Filtre souple : on n'applique que s'il reste assez d'exercices.
            try {
                if (window.AwakYouth && window.AwakYouth.isYoung && window.AwakYouth.isYoung()) {
                    const isChild = window.AwakYouth.isChild && window.AwakYouth.isChild();
                    const bodyweightOnly = ex => {
                        const eq = ex.equipment || [];
                        return eq.length === 0 || eq.includes('Poids du corps') || eq.includes('Aucun');
                    };
                    const youthPool = isChild
                        ? pool.filter(bodyweightOnly)                       // enfant : poids du corps seul
                        : pool.filter(ex => !window.AwakYouth.isDiscouraged(ex)); // ado : sans charge lourde
                    if (youthPool.length >= 2) pool = youthPool;
                    else {
                        // Repli garanti sur le poids du corps.
                        const bw = (typeof _dbMuscu === 'function' ? _dbMuscu() : (typeof exerciseDatabase !== 'undefined' ? exerciseDatabase : []))
                            .filter(isCombatExercise)
                            .filter(isNotIsometric)
                            .filter(isRepBased)
                            .filter(bodyweightOnly);
                        if (bw.length >= 2) pool = bw;
                    }
                }
            } catch(e) { _awkE(e); }
            
            pool = awakCombatSecurite(pool, Math.max(2, count || 4));   // v1569
            // v1478 : pas d'exercices POUR ENFANTS ni d'exercices qui ressemblent à de
            // l'ÉCHAUFFEMENT dans un combat (jumping jacks, marelle, équilibre, mobilité…).
            // Un profil enfant les garde : ce sont justement les siens.
            const _pasEchauf = awakExoCombatOk;
            try {
                let _p = pool.filter(_pasEchauf);
                if (_p.length < 4) {
                    // Thème trop étroit sans ses exercices d'échauffement : on complète avec de
                    // vrais exercices au poids du corps plutôt que de les garder.
                    const _pris = new Set(_p.map(e => e.name));
                    const _bw = ex => { const eq = ex.equipment || []; return eq.length === 0 || eq.every(e => e === 'Poids du corps' || e === 'Aucun'); };
                    const _plus = (typeof _dbMuscu === 'function' ? _dbMuscu() : (typeof exerciseDatabase !== 'undefined' ? exerciseDatabase : []))
                        .filter(isCombatExercise).filter(isNotIsometric).filter(isRepBased).filter(hasEquip).filter(_bw).filter(_pasEchauf)
                        .filter(e => !_pris.has(e.name)).sort(() => Math.random() - 0.5);
                    _p = _p.concat(_plus.slice(0, 6 - _p.length));
                }
                if (_p.length >= 4) pool = _p;
            } catch (e) { _awkE(e); }

            // 🥋 FAILLE ORDINAIRE = POIDS DU CORPS.
            // Une Faille est un combat de 6 exercices en 40/20 où le chrono fait
            // les dégâts : on n'y charge pas une barre entre deux vagues. Le
            // matériel cassait le rythme, rendait le combat différent selon le
            // lieu (l’Effaceur plus facile parce qu'on a un banc), et ouvrait
            // toute une classe de bugs de filtrage.
            // ⚠️ EXCEPTION : les ASSAUTS THÉMATIQUES gardent leur matériel — il
            // EST leur thème (« Poids du Monde » = haltères, « Les Liens » =
            // élastique) et le système vérifie déjà que le joueur l'a.
            try {
                const _estAssaut = !!(currentWorkout && currentWorkout._isAssaut);
                if (!_estAssaut) {
                    const _bwSeul = pool.filter(function (ex) {
                        const eq = ex.equipment || [];
                        return eq.length === 0 || eq.every(function (e) {
                            return e === 'Poids du corps' || e === 'Aucun';
                        });
                    });
                    // Filet : on ne bascule que s'il reste de quoi composer un combat.
                    if (_bwSeul.length >= 4) pool = _bwSeul;
                }
            } catch (e) { _awkE(e); }

            // Si le filtre thème+équipement vide le pool, on relâche le thème mais GARDE l'équipement
            let finalPool = pool.length >= 2 ? pool : (typeof _dbMuscu === 'function' ? _dbMuscu() : (typeof exerciseDatabase !== 'undefined' ? exerciseDatabase : []))
                .filter(isCombatExercise)
                .filter(isNotIsometric)
                .filter(isRepBased)
                .filter(hasEquip)
                .filter(_pasEchauf);

            // 🛡️ FALLBACK ULTIME : si toujours rien (équipement très limité), poids du corps garanti.
            if (finalPool.length < 2) {
                finalPool = (typeof _dbMuscu === 'function' ? _dbMuscu() : (typeof exerciseDatabase !== 'undefined' ? exerciseDatabase : []))
                    .filter(isCombatExercise)
                    .filter(isNotIsometric)
                    .filter(isRepBased)
                    .filter(ex => {
                        const eq = ex.equipment || [];
                        return eq.length === 0 || eq.includes('Poids du corps') || eq.includes('Aucun');
                    });
            }

            if (!finalPool.length) {   // v1569 : filet — tout est refusé : on relâche la sécurité plutôt qu'un combat vide
                _secu = false;
                finalPool = (typeof _dbMuscu === 'function' ? _dbMuscu() : (typeof exerciseDatabase !== 'undefined' ? exerciseDatabase : []))
                    .filter(isCombatExercise).filter(isNotIsometric).filter(isRepBased)
                    .filter(ex => { const eq = ex.equipment || []; return eq.length === 0 || eq.includes('Poids du corps') || eq.includes('Aucun'); });
            }
            // Mélanger
            const shuffled = finalPool.sort(() => Math.random() - 0.5).slice(0, count);

            // 🎯 Point faible du monstre : toujours au moins UN exercice qui l'exploite,
            // même hors du thème — c'est ce qui pousse à sortir de ses habitudes.
            const _wave = rift.waves ? rift.waves[rift.currentWaveIdx || 0] : null;
            const _faible = (_wave && window.AwakRiftVis) ? AwakRiftVis.faiblesse(_wave.name) : null;
            // ⚠️ Classer avec mode 'reps' : en Faille, l'exercice est TOUJOURS joué en
            // répétitions (awakPickRiftExercise) — c'est ce mode qui compte aux dégâts.
            const _cls = e => awakClassifyEffort({ ...e, mode: 'reps' });
            if (_faible && shuffled.length && !shuffled.some(e => _cls(e) === _faible)) {
                const _pris = new Set(shuffled.map(e => e.name));
                let cand = finalPool.filter(e => !_pris.has(e.name) && _cls(e) === _faible);
                if (!cand.length) {
                    cand = (typeof _dbMuscu === 'function' ? _dbMuscu() : (typeof exerciseDatabase !== 'undefined' ? exerciseDatabase : []))
                        .filter(isCombatExercise).filter(isNotIsometric).filter(isRepBased).filter(hasEquip).filter(_pasEchauf)
                        .filter(e => !_pris.has(e.name) && _cls(e) === _faible);
                }
                if (cand.length) shuffled[shuffled.length - 1] = cand[Math.floor(Math.random() * cand.length)];
            }

            // Calculer le dégât estimé par série + préserver le mode (timer pour le cardio)
            return shuffled.map(ex => {
                // 🏃 Cardio / exercices en durée : on garde le mode TIMER (minuteur), pas des reps.
                const isCardioTimer = ex.mode === 'timer' ||
                    (ex.muscle === 'Cardio' && !/jumping jacks|burpee|squat saut|fente saut|mountain/i.test(ex.name || ''));
                return {
                    ...ex,
                    mode: isCardioTimer ? 'timer' : 'reps',
                    duration: isCardioTimer ? (ex.duration || 45) : 0,
                    emoji: getThemeExerciseEmoji(ex),
                    estDmg: awakEstimateRiftDamage({ ...ex, mode: 'reps' }, _wave, theme, playerStats),
                    _faible: !!(_faible && awakClassifyEffort({ ...ex, mode: 'reps' }) === _faible)
                };
            });
        }

        function getThemeExerciseEmoji(ex) {
            const name = (ex.name || '').toLowerCase();
            if (/squat|deadlift|soulevé/.test(name)) return '🏋️';
            if (/jump|saut|burpee|plyo/.test(name)) return '⚡';
            if (/cardio|course|run|swim/.test(name)) return '🏃';
            if (/curl|biceps/.test(name)) return '💪';
            if (/press|bench|développé/.test(name)) return '🔨';
            if (/stretch|étir|yoga|mobil/.test(name)) return '🧘';
            if (/pull|tirage|row/.test(name)) return '🪢';
            return '⚔️';
        }

        /**
         * Le joueur a choisi un exercice — on lance la séance pour cet exercice
         */
        function awakPickRiftExercise(exIdx) {
            const session = awakActiveRiftSession;
            if (!session) return;
            const exercise = session.currentExercises[exIdx];
            if (!exercise) return;

            // Fermer le modal combat (on y reviendra après la "série")
            document.getElementById('awakRiftCombatModal')?.remove();

            // Trouver l'exo complet dans la DB
            const fullEx = exerciseDatabase.find(e => e.name === exercise.name) || exercise;

            // Créer une "séance" mini pour cet exercice unique
            // 📜 Nouveau combat : journal remis à zéro, sinon les coups
            // s'accumuleraient d'un affrontement à l'autre.
            try { if (typeof awakCombatLogClear === 'function') awakCombatLogClear(); } catch (e) { _awkE(e); }
            const miniWorkout = {
                name: `⚔ ${session.rift.name}`,
                _isRift: true,
                _riftId: session.rift.id,
                _waveIdx: session.rift.currentWaveIdx,
                type: 'rift',
                exercises: [{
                    ...fullEx,
                    sets: 3,
                    reps: fullEx.reps || 12,
                    rest: 45,
                    mode: 'reps',        // 🔁 Failles = toujours en répétitions, jamais en timer
                    duration: undefined, // on retire toute durée pour éviter le mode timer
                    _baseName: fullEx.name
                }]
            };

            // Réinitialiser TOUT l'état d'une séance correctement
            currentWorkout = miniWorkout;
            currentExerciseIndex = 0;
            currentSetNumber = 1;
            workoutStartTime = Date.now();
            if (typeof _workoutSkipCount !== 'undefined') _workoutSkipCount = 0;
            if (typeof completedSets !== 'undefined') completedSets = [];

            // Aller à l'onglet workouts
            if (typeof switchTab === 'function') switchTab('workouts');

            // Utiliser la méthode standard d'affichage workout
            setTimeout(() => {
                // Masquer les écrans de sélection ET l'écran de fin précédent (v1304)
                const theme = session.theme || {};
                _awakEntrerCombatSeance(`🌀 FAILLE — Vague ${session.rift.currentWaveIdx + 1}/${session.rift.waves.length}`, theme.color);

                if (typeof renderExerciseProgressList === 'function') renderExerciseProgressList();
                if (typeof updateMusclesOverview === 'function') updateMusclesOverview();
                if (typeof startExercise === 'function') startExercise();

                // 💡 Instructions claires pour l'utilisateur
                setTimeout(() => {
                    if (typeof showToast === 'function') {
                        showToast('⚔ Saisis tes reps avant "Terminer série" pour infliger des dégâts !', 'info', 4000);
                    }
                }, 800);
            }, 100);
        }
        window.awakPickRiftExercise = awakPickRiftExercise;

        /**
         * Inflige des dégâts à la vague actuelle
         * Appelé à la fin de chaque série pendant un combat de Faille
         */
        // ═══════════════════════════════════════════════════════════════
        // 🎯 SYSTÈME DE BONUS PAR STAT — Effets en combat
        // ═══════════════════════════════════════════════════════════════
        // STR : +1% dégâts par point
        // AGI : +0.5% chance crit par point
        // VIT : +1% chance double attaque par point
        // END : Régénération HP joueur + résistance contre-attaques
        // PER : +1% dégâts vs boss + chance esquive
        // SEN : +1% XP gagnée + chance loot rare (à la fin de Faille)
        // ═══════════════════════════════════════════════════════════════

        // Helper : calcule les bonus actifs basés sur les stats
        function awakComputeStatBonuses(playerStats, isBoss) {
            const stats = playerStats || (typeof awakGetTotalStats === 'function' ? awakGetTotalStats() : {});
            const ring = (typeof getActiveRingEffects === 'function') ? getActiveRingEffects() : {};

            // 📉 Rendement décroissant : au-delà d'un seuil, chaque point compte moins.
            // En dessous du seuil = linéaire ; au-dessus = croissance en racine carrée.
            // Évite que les stats énormes (400+) donnent des bonus absurdes.
            const dim = (val, soft) => {
                val = val || 0;
                if (val <= soft) return val;
                return soft + Math.sqrt((val - soft) * soft); // courbe douce au-delà du seuil
            };
            const SOFT = 80; // seuil de rendement plein (~rang B) — au-delà, rendement décroissant

            const eStr = dim(stats.STR, SOFT);
            const eAgi = dim(stats.AGI, SOFT);
            const eVit = dim(stats.VIT, SOFT);
            const ePer = dim(stats.PER, SOFT);
            const eSen = dim(stats.SEN, SOFT);

            // Plafonds durs sur les probabilités (gardent du hasard et de la tension)
            const CAP_CRIT = 0.50, CAP_DOUBLE = 0.35, CAP_DODGE = 0.40, CAP_BOSS = 1.50;

            return {
                // ⚔️ STR : multiplicateur dégâts généraux (rendement décroissant)
                damageMult: 1 + eStr * 0.01,

                // ⚡ AGI : chance critique (plafond 50%)
                critChance: Math.min(CAP_CRIT, eAgi * 0.005 + (ring.crit || 0)),

                // 💨 VIT : chance double attaque (plafond 35%)
                doubleChance: Math.min(CAP_DOUBLE, eVit * 0.01 + (ring.double || 0)),

                // 💚 END : régénération HP joueur
                hpRegen: Math.floor((stats.END || 0) / 12), // ⚖️ v1218 : /2 → /12 (≈ 2 % des PV max par série)
                // v1536 : « récupération » (anneaux + Élise) augmente aussi les PV récupérés (avant : sans effet)
                hpRegenMult: (1 - (() => { try { const _c = (typeof getActiveCurseEffects === 'function') ? getActiveCurseEffects() : null; return (_c && _c.healMalus) || 0; } catch (e) { return 0; } })()) * 1 + (ring.hpRegen || 0) + (ring.recovery || 0) + (() => { try { return (typeof awakCompanionsGetActiveBonuses === 'function' ? awakCompanionsGetActiveBonuses().recovery : 0) || 0; } catch (e) { return 0; } })(),

                // 👁️ PER : bonus dégâts vs boss (plafond +150%) + esquive (plafond 40%)
                bossBonus: isBoss ? Math.min(CAP_BOSS, ePer * 0.01 + (ring.bossDmg || 0)) : 0,
                dodgeChance: Math.min(CAP_DODGE, ePer * 0.003 + (ring.dodge || 0)),

                // 🌀 SEN : bonus XP + loot (rendement décroissant comme les autres stats)
                xpMult: 1 + eSen * 0.01 + (ring.xpGain || 0),
                rareLootBonus: eSen * 0.005 + (ring.rareLoot || 0),

                // Valeurs raw pour affichage
                raw: {
                    STR: stats.STR || 0,
                    AGI: stats.AGI || 0,
                    VIT: stats.VIT || 0,
                    END: stats.END || 0,
                    PER: stats.PER || 0,
                    SEN: stats.SEN || 0
                }
            };
        }
        window.awakComputeStatBonuses = awakComputeStatBonuses;

        // 🏃 Classe un exercice par type d'effort dominant (pour les mécaniques de sous-boss)
        // Renvoie 'cardio' | 'force' | 'explosif' | 'abdos' | 'autre'
        function awakClassifyEffort(ex) {
            if (!ex) return 'autre';
            const name = (ex.name || '').toLowerCase();
            const muscle = (ex.muscle || '').toLowerCase();
            // Explosif / pliométrie : sauts, sprints, burpees, mouvements balistiques
            if (/burpee|jump|saut|sprint|plyo|pliom|box|kettlebell swing|swing|clap|explosi|mountain climber|squat saut|fente saut/.test(name)) return 'explosif';
            // Cardio / endurance : muscle Cardio, ou exercices en durée (mode timer) hors étirement
            if (muscle === 'cardio' || (ex.mode === 'timer' && !/etirement|étirement|stretch|mobilit|gainage|planche|plank/.test(name))) return 'cardio';
            // Abdos / tronc (point faible des ombres) — testé avant « force »
            if (/abdo|oblique/.test(muscle) || /crunch|relevé de jambe|releve de jambe|leg raise|russian twist|sit-up|sit up|v-up|bicycle|toe touch|flutter|ab wheel|roulette/.test(name)) return 'abdos';
            // Force : exercices à charge / reps lourdes (presse, squat, soulevé, tirage, développé, curl…)
            if (/squat|press|développé|developpe|souleve|soulevé|deadlift|row|rowing|tirage|curl|extension|fente|lunge|pompe|push|pull|dip|hip thrust|glute bridge/.test(name)) return 'force';
            return 'autre';
        }
        window.awakClassifyEffort = awakClassifyEffort;

        // 💪 Multiplicateur d'effort d'une série en Faille.
        //  • reps / objectif : sous l'objectif → jusqu'à ×0,5 ; au-dessus → +75 % par
        //    objectif dépassé (×1,75 max, atteint au double de l'objectif).
        //  • charge : exercices lestés → +1 % par kg (max +40 %).
        //  • record de reps sur l'exercice (historique + Faille en cours) → critique garanti.
        function awakRiftEffortMult(reps, weightKg, ex, session) {
            const cible = Math.max(1, parseInt(ex && ex.reps, 10) || 12);
            const r = Math.max(0, reps) / cible;
            let mult = r < 1 ? 0.5 + 0.5 * r : Math.min(1.75, 1 + 0.75 * (r - 1));
            const kg = Math.max(0, parseFloat(weightKg) || 0);
            if (kg > 0) mult *= 1 + Math.min(0.4, kg / 100);
            let record = false;
            try {
                const nom = ex && (ex._baseName || ex.name);
                if (nom && session) {
                    session._meilleursReps = session._meilleursReps || {};
                    const prs = (typeof getExercisePRs === 'function') ? getExercisePRs(nom) : { maxReps: 0, history: [] };
                    const avant = Math.max(prs.maxReps || 0, session._meilleursReps[nom] || 0);
                    // Pas de « record » sans référence : la 1re fois n'est qu'un point de départ.
                    record = avant > 0 && reps > avant;
                    session._meilleursReps[nom] = Math.max(session._meilleursReps[nom] || 0, reps);
                }
            } catch (e) { _awkE(e); }
            return { mult, ratio: r, cible, record };
        }
        window.awakRiftEffortMult = awakRiftEffortMult;


        // v1522 : ALLIÉS EN FAILLE — partenaire (Esen/Nyra) + compagnons ACTIFS (pas ceux en
        // mission). Mêmes actions que dans le combat final ; jamais dans les Failles SOLO.
        // Les vagues sont renforcées selon l'aide attendue : même difficulté, plus de spectacle.
        function awakRiftEquipe(rift) {
            try {
                if (!rift || (typeof awakIsSoloRift === 'function' && awakIsSoloRift(rift))) return null;
                const C = { marcus: 'Marcus', kira: 'Kira', elise: 'Élise', yuna: 'Yuna', chen: 'Chen' };
                const onM = (typeof awakGetCompanionsOnMission === 'function') ? (awakGetCompanionsOnMission() || []) : [];
                const ids = awakCompanionsGetActive().filter(id => C[id] && !onM.includes(id));
                const fem = (localStorage.getItem('fitproAvatarGender') || 'homme') === 'femme';
                return { part: fem ? 'Esen' : 'Nyra', noms: ids.map(id => C[id]) };
            } catch (e) { return null; }
        }
        function awakRiftFacteurPV(rift) {
            const E = awakRiftEquipe(rift); if (!E) return 1;
            const a = n => E.noms.indexOf(n) >= 0;
            return 1 + 0.05 + (a('Marcus') ? 0.10 : 0) + (a('Kira') ? 0.10 : 0) + (a('Yuna') ? 0.06 : 0);
        }
        function awakRiftFacteurRiposte(rift) {
            const E = awakRiftEquipe(rift); if (!E) return 1;
            return 1 + (E.noms.indexOf('Élise') >= 0 ? 0.08 : 0) + (E.noms.indexOf('Chen') >= 0 ? 0.08 : 0);
        }
        // Coups des alliés sur la vague (retourne les dégâts en plus, affiche les fenêtres)
        function awakRiftAidesCoup(session, wave, degats) {
            const E = awakRiftEquipe(session && session.rift); if (!E || !wave) return 0;
            if (session._aideVague !== session.rift.currentWaveIdx) { session._aideVague = session.rift.currentWaveIdx; session._chenBloc = 1; session._eliseFaite = false; }
            const n = session._nCoupAllie = (session._nCoupAllie || 0) + 1;
            const L = [];
            const f = (nom, part) => { const d = Math.max(1, Math.round(degats * part)); L.push({ nom, d }); return d; };
            let extra = 0;
            if (n % 6 === 0) extra += f(E.part, 0.30);
            if (E.noms.indexOf('Marcus') >= 0 && n % 4 === 0) extra += f('Marcus', 0.40);
            if (E.noms.indexOf('Kira') >= 0 && n % 5 === 0) extra += f('Kira', 0.50);
            if (E.noms.indexOf('Yuna') >= 0 && n % 7 === 0) extra += f('Yuna', Math.max(0.2, (wave.hpMax * 0.03) / Math.max(1, degats)));
            const col = (session.theme && session.theme.color) || '#a855f7';
            L.forEach(x => {
                try { if (typeof awakCombatLogAdd === 'function') awakCombatLogAdd({ t: Date.now(), type: 'effet', msg: x.nom + ' frappe ' + (wave.name || 'le monstre') + ' : −' + x.d + ' PV', ton: 'success' }); } catch (e) { _awkE(e); }
                setTimeout(() => { try { _awakAideEpique({ nom: x.nom, val: '−' + x.d + ' PV', ton: 'coup', cibleNom: wave.name || 'le monstre', monstre: wave.name, couleurCible: col, boss: !!wave.isBoss }); } catch (e) { _awkE(e); } }, 1100);
            });
            return extra;
        }
        window.awakRiftEquipe = awakRiftEquipe;
        function awakDealDamageToWave(reps, weightKg) {
            const session = awakActiveRiftSession;
            if (!session) return;
            const rift = session.rift;
            const currentWave = rift.waves[rift.currentWaveIdx];
            if (!currentWave) return;
            const theme = session.theme;
            const playerStats = awakGetTotalStats();

            // 🏃 Type d'effort de l'exercice courant (pour les mécaniques de sous-boss)
            const _curEx = (typeof currentWorkout !== 'undefined' && currentWorkout && currentWorkout.exercises)
                ? currentWorkout.exercises[typeof currentExerciseIndex !== 'undefined' ? currentExerciseIndex : 0]
                : null;
            const effortType = awakClassifyEffort(_curEx);

            // 🛡️ ANTI-TRICHE : plafonner les reps et le poids
            // Reps max réaliste = 50 (au-delà c'est de la triche)
            // Poids ignoré en Faille (poids du corps uniquement)
            const cappedReps = Math.min(Math.max(1, reps || 1), 50);
            const cappedWeight = 0; // Failles = poids du corps, le poids ne compte pas

            // 🎯 Calculer tous les bonus stats actifs
            const bonuses = awakComputeStatBonuses(playerStats, currentWave.isBoss);

            // 🎭 Phase 4 : bonus compagnons
            const compBonus = typeof awakCompanionsGetActiveBonuses === 'function'
                ? awakCompanionsGetActiveBonuses() : {};

            // 🧪 Phase 5 : effets consommables actifs
            const consumEffects = typeof awakConsumablesGetActiveEffects === 'function'
                ? awakConsumablesGetActiveEffects() : {};

            // ☠️ MALÉDICTIONS : effets des items maudits équipés
            const curse = typeof getActiveCurseEffects === 'function' ? getActiveCurseEffects() : null;
            let curseToasts = [];
            if (curse) {
                // firstHitMiss : le tout premier coup du combat rate
                if (curse.firstHitMiss && !session._firstHitDone) {
                    session._firstHitDone = true;
                    curseToasts.push({ msg: '☠️ Malédiction : ton premier coup rate !', type: 'warning' });
                    if (typeof showToast === 'function') curseToasts.forEach(t => showToast(t.msg, t.type, 2500));
                    if (typeof awakShowRiftCombatScreen === 'function') awakShowRiftCombatScreen();
                    return; // aucun dégât
                }
                session._firstHitDone = true;
                // jam : l'arme se bloque, coup perdu
                if (curse.jam > 0 && Math.random() < curse.jam) {
                    if (typeof showToast === 'function') showToast('☠️ Ton arme maudite se bloque — coup perdu !', 'warning', 2500);
                    if (typeof awakShowRiftCombatScreen === 'function') awakShowRiftCombatScreen();
                    return;
                }
            }

            // Formule de dégâts : ATTAQUE DE BASE pilotée par les stats du joueur + équipement.
            // Socle volontairement BAS : sans attributs ni équipement, les dégâts sont dérisoires.
            // Les stats (qui incluent les bonus d'équipement) sont le vrai moteur des dégâts.
            const base = 4;
            const primaryStatValue = (playerStats[theme.primaryStat] || 0) * (1 + (consumEffects[theme.primaryStat] || 0));
            // Attaque de base = petit socle + stat thématique ×1.5 → les attributs dominent.
            // 🐛 La stat était comptée DEUX FOIS : ici en brut (sans plafond), puis via
            // damageMult qui, lui, applique le rendement décroissant. Une grosse stat
            // était donc récompensée deux fois, dont une sans limite → explosion des
            // dégâts au-delà du rang B. On applique le même rendement décroissant ici.
            const _SOFT_ATK = 80;
            const _effPrimary = primaryStatValue <= _SOFT_ATK
                ? primaryStatValue
                : _SOFT_ATK + Math.sqrt(primaryStatValue - _SOFT_ATK) * Math.sqrt(_SOFT_ATK);
            const baseAttack = base + _effPrimary * 1.5;
            // 💪 EFFORT RÉEL (v1216) : remplace l'ancien +1 %/rep, qui rendait l'effort
            // presque invisible (20 reps ≈ +8 % sur 12). Reps vs objectif, charge, record.
            const _eff = awakRiftEffortMult(cappedReps, weightKg, _curEx, session);
            const effortToasts = [];
            if (_eff.record) effortToasts.push({ msg: `◆ RECORD BATTU (${cappedReps} reps) — coup critique garanti !`, type: 'success' });
            else if (_eff.ratio >= 1.25) effortToasts.push({ msg: `◆ Effort au-delà de l'objectif : dégâts ×${_eff.mult.toFixed(2).replace('.', ',')}`, type: 'success' });
            else if (_eff.ratio < 0.85) effortToasts.push({ msg: `◇ Sous l'objectif (${cappedReps}/${_eff.cible}) : dégâts ×${_eff.mult.toFixed(2).replace('.', ',')}`, type: 'warning' });

            let finalDamage = baseAttack * _eff.mult;

            // 🛡️ ANTI-TRICHE : seules les RÉPÉTITIONS sont bornées (cappedReps ≤ 50, soit +50% max).
            // Les dégâts issus des stats, points alloués, compétences et équipement ne sont PAS
            // plafonnés — l'investissement du joueur doit payer pleinement.

            // ⚔️ STR : multiplicateur dégâts global (toujours actif)
            finalDamage *= bonuses.damageMult;
            // v1537 : Élixir de Force aussi quand la Faille n'est pas une Faille de Force (avant : sans effet)
            if (consumEffects.STR && theme.primaryStat !== 'STR') finalDamage *= (1 + consumEffects.STR);


            // 🥋 MAÎTRISE DE COMBAT : bonus de dégâts selon le type d'effort de l'exercice
            // (force / cardio / explosif). Achetée chez le marchand — récompense la spécialisation.
            if (window.AwakEconomy && typeof window.AwakEconomy.getMasteryDamageMult === 'function') {
                finalDamage *= window.AwakEconomy.getMasteryDamageMult(effortType);
            }

            // 🎯 POINT FAIBLE : le type d'effort que ce monstre craint (rift-visuals.js)
            const _faible = (window.AwakRiftVis && AwakRiftVis.faiblesse) ? AwakRiftVis.faiblesse(currentWave.name) : null;
            const weakHit = !!(_faible && effortType === _faible);
            if (weakHit) finalDamage *= (AwakRiftVis.BONUS_FAIBLESSE || 1.5);

            // 👑 OUVERTURE DU BOSS : déclenchée à 50 % PV (voir plus bas). La série
            // suivante qui atteint la cible de reps frappe ×2,5 ; sinon elle est perdue.
            let ouvertureJouee = null;
            if (currentWave.isBoss && currentWave._ouverture && typeof currentWave._ouverture === 'object') {
                const _ok = cappedReps >= currentWave._ouverture.cible;
                if (_ok) finalDamage *= 2.5;
                effortToasts.push(_ok
                    ? { msg: `◆ OUVERTURE EXPLOITÉE — dégâts ×2,5 !`, type: 'success' }
                    : { msg: `◇ Ouverture manquée (${cappedReps}/${currentWave._ouverture.cible} reps)`, type: 'warning' });
                ouvertureJouee = _ok;
                currentWave._ouverture = 'fait';
            }

            // 👁️ PER : bonus dégâts contre boss
            if (currentWave.isBoss && bonuses.bossBonus > 0) {
                finalDamage *= (1 + bonuses.bossBonus);
            }

            // ⚡ AGI : chance critique (×2 dégâts)
            // critique = bonus AGI + base 5% + compagnons + consommables + COMPÉTENCE
            const _skillEff = (typeof rpgGetActiveEffects === 'function') ? rpgGetActiveEffects() : {};
            // v1528 : compétences de dégâts (Tir Perçant, Œil de la Tempête, Souffle Long)
            if (_skillEff.riftDmg) finalDamage *= (1 + _skillEff.riftDmg);
            if (currentWave.isBoss && _skillEff.bossDmg) finalDamage *= (1 + _skillEff.bossDmg);
            if (_skillEff.timerDmg && _curEx && (_curEx.mode === 'timer' || _curEx.mode === 'duration')) finalDamage *= (1 + _skillEff.timerDmg);
            const critChance = 0.05 + bonuses.critChance + (compBonus.critChance || 0) + (consumEffects.critBonus || 0) + (_skillEff.critChance || 0);
            const isCrit = _eff.record || Math.random() < critChance;
            if (isCrit) finalDamage *= 2 + (_skillEff.critDmg || 0);   // v1528 : Point Faible

            // 💨 VIT : chance double attaque (×1.5 dégâts au total)
            const isDouble = Math.random() < bonuses.doubleChance;
            let doubleDamage = 0;
            if (isDouble) {
                doubleDamage = Math.round(finalDamage * 0.5);
                finalDamage += doubleDamage;
            }

            // Bonus boss (Marcus Ironfist - compagnon)
            if (currentWave.isBoss && compBonus.dmgBoss) {
                finalDamage = finalDamage * (1 + compBonus.dmgBoss);
            }

            // 👑 Phase 5 : boss mechanics actives
            if (currentWave.isBoss && currentWave.weaknessStat === theme.primaryStat) {
                finalDamage = finalDamage * 2;
            }
            if (currentWave.isBoss && currentWave._enraged) {
                finalDamage = finalDamage * 0.75;
            }

            // 👹 Phase 3 : handicap "reduce_stats" diminue les dégâts
            try {
                if (typeof awakGetActiveHandicaps === 'function') {
                    const handicaps = awakGetActiveHandicaps();
                    if (handicaps.reduce_stats > 0) {
                        finalDamage = finalDamage * (1 - handicaps.reduce_stats / 100);
                    }
                }
            } catch(e) { _awkE(e); }

            // ⏱ PLANCHER DE DÉGÂTS (v1218 : appliqué APRÈS tous les bonus, avant les
            // malédictions). Filet pour le joueur sous-équipé : à l'objectif de reps,
            // une vague tombe en 5 séries au plus, un boss en 10.
            const _plancher = currentWave.hpMax / (currentWave.isBoss ? 10 : 5) * _eff.mult;
            if (finalDamage < _plancher) finalDamage = _plancher;

            // ☠️ MALÉDICTION : -dégâts contre les boss
            if (curse && currentWave.isBoss && curse.bossWeak > 0) {
                finalDamage = finalDamage * (1 - curse.bossWeak);
            }
            // ☠️ MALÉDICTION : backfire — l'attaque se retourne (dégâts fortement réduits)
            if (curse && curse.backfire > 0 && Math.random() < curse.backfire) {
                finalDamage = finalDamage * 0.25;
                curseToasts.push({ msg: '☠️ L\'attaque se retourne contre toi ! Dégâts réduits', type: 'warning' });
            }

            finalDamage = Math.max(1, Math.round(finalDamage));

            // 🔥 Afficher les procs spéciaux après les dégâts
            const procToasts = [];
            if (curseToasts.length) procToasts.push(...curseToasts);
            if (effortToasts.length) procToasts.push(...effortToasts);
            if (isDouble) procToasts.push({ msg: `⚡ DOUBLE ATTAQUE ! +${Math.round(doubleDamage)} HP`, type: 'success' });
            if (currentWave.isBoss && bonuses.bossBonus > 0) {
                procToasts.push({ msg: `👁 Faiblesse détectée (+${Math.round(bonuses.bossBonus * 100)}% vs boss)`, type: 'info' });
            }

            const prevHpPercent = (currentWave.hpCurrent / currentWave.hpMax) * 100;

            // ⚔️🤝 Mécanique UNIQUE de Faille de compagnon : modifie les dégâts du coup
            if (currentWave.isBoss && currentWave.companionMech && typeof awakApplyCompanionMech === 'function') {
                const cm = awakApplyCompanionMech(currentWave, finalDamage, prevHpPercent);
                finalDamage = cm.damage;
                if (cm.toasts) cm.toasts.forEach(t => procToasts.push(t));
            }

            // ⛈️ TEMPÊTE : tes dégâts sont amplifiés (mutation rang A+)
            try {
                const _pm = (typeof awakGetRiftModifier === 'function' && rift) ? awakGetRiftModifier(rift.modifierId) : null;
                if (_pm && _pm.playerDmgMult > 1) finalDamage = Math.round(finalDamage * _pm.playerDmgMult);
            } catch(e) { _awkE(e); }

            // 🐺 SOUS-BOSS — mécanique liée au type d'effort (La Traque, Colosse, Insaisissable, Siphon)
            if (currentWave.isBoss && rift.subBossMech && typeof awakApplySubBossMech === 'function') {
                const sb = awakApplySubBossMech(rift, currentWave, finalDamage, effortType, prevHpPercent);
                finalDamage = sb.damage;
                if (sb.toasts) sb.toasts.forEach(t => procToasts.push(t));
            }

            // v1470 : mécanique propre au boss
            if (currentWave.isBoss && typeof awakApplyBossUnique === 'function') {
                try {
                    awakAssurerMechBoss(rift, currentWave);
                    const bu = awakApplyBossUnique(rift, currentWave, { damage: finalDamage, effort: effortType, reps: cappedReps, ratio: _eff.ratio || 1, ex: _curEx, now: Date.now() });
                    finalDamage = bu.damage;
                    bu.toasts.forEach(t => procToasts.push(t));
                } catch (e) { _awkE(e); }
            }

            // v1522 : les alliés frappent aussi
            try { finalDamage += awakRiftAidesCoup(session, currentWave, finalDamage); } catch (e) { _awkE(e); }
            currentWave.hpCurrent = Math.max(0, currentWave.hpCurrent - finalDamage);
            // v1470 : Phénix Éteint — renaît une fois à 30 %
            if (currentWave.hpCurrent <= 0 && currentWave.bossMech && currentWave.bossMech.id === 'bm_phenix' && !currentWave._renait) {
                currentWave._renait = true;
                currentWave.hpCurrent = Math.round(currentWave.hpMax * 0.3);
                procToasts.push({ msg: 'RENAISSANCE : le Phénix renaît de ses cendres (30 % PV).', type: 'warning' });
            }
            // 💾 Même sauvegarde que pour l'Assaut : sans elle, les dégâts d'un
            // combat abandonné disparaissaient à la fermeture de l'app.
            try {
                if (typeof awakRiftsLoad === 'function' && typeof awakRiftsSave === 'function') {
                    const _all = awakRiftsLoad();
                    const _i = _all.findIndex(function (r) { return r && r.id === rift.id; });
                    if (_i >= 0) { _all[_i] = rift; awakRiftsSave(_all); }
                }
            } catch (e) { _awkE(e); }
            const newHpPercent = (currentWave.hpCurrent / currentWave.hpMax) * 100;
            session.totalDamageDealt += finalDamage;

            // 👑 OUVERTURE : le boss passe sous 50 % → il se découvre. Défi d'effort :
            // la prochaine série à (objectif + 3) reps ou plus inflige ×2,5.
            if (currentWave.isBoss && !currentWave._ouverture && currentWave.hpCurrent > 0 && prevHpPercent > 50 && newHpPercent <= 50) {
                const _cible = (_eff.cible || 12) + 3;
                currentWave._ouverture = { cible: _cible, t: Date.now() };
                procToasts.push({ msg: `◆ LE BOSS SE DÉCOUVRE ! Prochaine série : ${_cible} reps ou plus = dégâts ×2,5`, type: 'info' });
            }

            // 🩸 DRAIN VITAL : récupère un % des dégâts infligés en HP
            try {
                const _vfx = (typeof rpgGetActiveEffects === 'function') ? rpgGetActiveEffects() : {};
                if (_vfx.riftLifesteal > 0) {
                    // ⚖️ v1218 : plafonné à 5 % des PV max par série (6 % de milliers de dégâts = soin complet)
                    const _heal = Math.max(1, Math.min(Math.round(awakGetPlayerMaxHP() * 0.05), Math.round(finalDamage * _vfx.riftLifesteal)));
                    if (typeof awakHealPlayer === 'function') awakHealPlayer(_heal, '(🩸 Drain Vital)');
                }
            } catch(e) { _awkE(e); }

            // 💾 PERSISTER l'état dans localStorage
            try {
                const allRifts = awakRiftsLoad();
                const idx = allRifts.findIndex(r => r.id === rift.id);
                if (idx >= 0) {
                    allRifts[idx] = rift;
                    awakRiftsSave(allRifts);
                }
            } catch(e) { console.warn('Failed to persist rift state:', e); }

            // 👑 Phase 5 : mécaniques boss aux seuils
            const bossMessages = (typeof awakApplyBossMechanic === 'function')
                ? awakApplyBossMechanic(currentWave, prevHpPercent, newHpPercent) : null;
            if (bossMessages) {
                bossMessages.forEach(m => {
                    setTimeout(() => {
                        if (typeof showToast === 'function') showToast(m.text, m.type, 3000);
                        if (typeof awakCompanionShowDialogue === 'function') {
                            setTimeout(() => awakCompanionShowDialogue('onBossPhase'), 800);
                        }
                    }, 600);
                });
            }

            // 💬 Phase 4 : dialogue compagnon contextuel
            try {
                if (isCrit && Math.random() < 0.4) awakCompanionShowDialogue('onCrit');
            } catch(e) { _awkE(e); }

            // 🎉 Afficher les procs spéciaux (séquentiellement)
            // 📜 Consigner les EFFETS dans le journal de combat, en plus des dégâts :
            // armure brisée, esquive, vulnérabilité, drain, double attaque, malédictions…
            // C'est le point de convergence de tous les effets, donc l'endroit juste
            // pour les capter d'un seul geste.
            try {
                procToasts.forEach(p => {
                    if (typeof awakCombatLogAdd === 'function') {
                        awakCombatLogAdd({ t: Date.now(), type: 'effet', msg: p.msg, ton: p.type });
                    }
                });
            } catch (e) { _awkE(e); }
            procToasts.forEach((p, i) => {
                setTimeout(() => {
                    if (typeof showToast === 'function') showToast(p.msg, p.type, 1800);
                }, 800 + i * 500);
            });

            // 💚 END : régénération HP joueur à chaque série complétée
            if (bonuses.hpRegen > 0 && currentWave.hpCurrent > 0) {
                setTimeout(() => awakHealPlayer(bonuses.hpRegen), 1500);
            }

            // 🩸 Le monstre contre-attaque s'il est encore vivant (boss ET monstres normaux)
            if (currentWave.hpCurrent > 0) {
                awakBossCounterAttack(currentWave);
            }

            return {
                damage: finalDamage,
                isCrit,
                isDouble,
                bossWeakness: currentWave.isBoss && bonuses.bossBonus > 0,
                weakHit,
                effort: _eff,
                ouvertureJouee,
                killed: currentWave.hpCurrent <= 0
            };
        }
        window.awakDealDamageToWave = awakDealDamageToWave;

        // Estimation des dégâts d'une série (même formule que awakDealDamageToWave,
        // sans le hasard : ni critique, ni double coup, ni malédiction).
        function awakEstimateRiftDamage(ex, wave, theme, playerStats) {
            try {
                const stats = playerStats || awakGetTotalStats();
                const consum = typeof awakConsumablesGetActiveEffects === 'function' ? awakConsumablesGetActiveEffects() : {};
                const prim = (stats[theme.primaryStat] || 0) * (1 + (consum[theme.primaryStat] || 0));
                const eff = prim <= 80 ? prim : 80 + Math.sqrt(prim - 80) * Math.sqrt(80);
                // Effort supposé = l'objectif tout juste atteint (×1) ; le plancher s'applique aussi.
                let d = (4 + eff * 1.5);
                const b = awakComputeStatBonuses(stats, !!(wave && wave.isBoss));
                d *= b.damageMult;
                const effort = awakClassifyEffort(ex);
                if (window.AwakEconomy && typeof AwakEconomy.getMasteryDamageMult === 'function') d *= AwakEconomy.getMasteryDamageMult(effort);
                const faible = (wave && window.AwakRiftVis) ? AwakRiftVis.faiblesse(wave.name) : null;
                if (faible && effort === faible) d *= (AwakRiftVis.BONUS_FAIBLESSE || 1.5);
                if (wave && wave.isBoss && b.bossBonus > 0) d *= (1 + b.bossBonus);
                if (wave && wave.isBoss && wave.weaknessStat === theme.primaryStat) d *= 2;
                if (wave && wave.isBoss && wave._enraged) d *= 0.75;
                if (wave && wave.hpMax) d = Math.max(d, wave.hpMax / (wave.isBoss ? 10 : 5));
                return Math.max(1, Math.round(d));
            } catch (e) { return 15; }
        }
        window.awakEstimateRiftDamage = awakEstimateRiftDamage;

        function awakAdvanceToNextWave() {
            const session = awakActiveRiftSession;
            if (!session) return;
            session.rift.currentWaveIdx++;

            // 💾 Persister la progression
            try {
                const allRifts = awakRiftsLoad();
                const idx = allRifts.findIndex(r => r.id === session.rift.id);
                if (idx >= 0) { allRifts[idx] = session.rift; awakRiftsSave(allRifts); }
            } catch(e) { _awkE(e); }

            if (session.rift.currentWaveIdx >= session.rift.waves.length) {
                awakCompleteRift();
            } else {
                // ☠️ MALÉDICTIONS entre vagues
                const _curse = typeof getActiveCurseEffects === 'function' ? getActiveCurseEffects() : null;

                // hpDrain : draine un % des HP max à chaque nouvelle vague
                if (_curse && _curse.hpDrain > 0 && typeof awakGetPlayerMaxHP === 'function' && typeof awakDamagePlayer === 'function') {
                    const drain = Math.round(awakGetPlayerMaxHP() * _curse.hpDrain);
                    setTimeout(() => {
                        awakDamagePlayer(drain);
                        if (typeof showToast === 'function') showToast(`☠️ Malédiction : ${drain} HP drainés`, 'warning', 2200);
                    }, 300);
                }

                // 💚 Heal entre vagues : 12% HP max + bonus END (sauf si malédiction noHeal ou mutation Lune de Sang)
                const _rmod = (typeof awakGetRiftModifier === 'function' && session && session.rift) ? awakGetRiftModifier(session.rift.modifierId) : null;
                if (!(_curse && _curse.noHealBetweenWaves) && !(_rmod && _rmod.noHeal) && typeof awakGetPlayerMaxHP === 'function' && typeof awakHealPlayer === 'function') {
                    const maxHP = awakGetPlayerMaxHP();
                    const bonuses = (typeof awakComputeStatBonuses === 'function')
                        ? awakComputeStatBonuses() : { hpRegen: 0 };
                    const baseHeal = Math.round(maxHP * 0.08); // ⚖️ v1218 : 12 % → 8 %
                    const totalHeal = Math.round((baseHeal + (bonuses.hpRegen || 0) * 2) * (bonuses.hpRegenMult || 1)); // ×2 entre vagues, ×anneau
                    setTimeout(() => {
                        if (typeof showToast === 'function') {
                            showToast(`🌟 Vague terminée ! Tu reprends ton souffle...`, 'success', 2200);
                        }
                        setTimeout(() => {
                            awakHealPlayer(totalHeal);
                        }, 700);
                    }, 400);
                } else if (_curse && _curse.noHealBetweenWaves) {
                    setTimeout(() => {
                        if (typeof showToast === 'function') showToast('☠️ Malédiction : aucun soin entre les vagues', 'warning', 2400);
                    }, 500);
                } else if (_rmod && _rmod.noHeal) {
                    setTimeout(() => {
                        if (typeof showToast === 'function') showToast('🌕 Lune de Sang : aucun soin entre les vagues', 'warning', 2400);
                    }, 500);
                }

                // 🌋 VOLCANIQUE : la vague vaincue explose et brûle le joueur (jamais létal)
                if (_rmod && _rmod.eruptPct > 0 && typeof awakGetPlayerMaxHP === 'function') {
                    setTimeout(() => {
                        try {
                            const s = awakActiveRiftSession;
                            if (!s) return;
                            if (typeof s.playerHP !== 'number') s.playerHP = awakGetPlayerMaxHP();
                            const burn = Math.round(awakGetPlayerMaxHP() * _rmod.eruptPct);
                            if (!(typeof awakIsInvincible === 'function' && awakIsInvincible())) s.playerHP = Math.max(1, s.playerHP - burn);
                            if (typeof showToast === 'function') showToast(`🌋 ÉRUPTION ! La vague explose : -${burn} HP`, 'error', 2600);
                            const _el = document.getElementById('playerHpBar');
                            const _tx = document.getElementById('playerHpText');
                            if (_el) _el.style.width = Math.round((s.playerHP / awakGetPlayerMaxHP()) * 100) + '%';
                            if (_tx) _tx.textContent = `${s.playerHP} / ${awakGetPlayerMaxHP()} HP`;
                        } catch(e) { _awkE(e); }
                    }, 900);
                }

                setTimeout(() => awakShowRiftCombatScreen(), 1500);
            }
        }
        window.awakAdvanceToNextWave = awakAdvanceToNextWave;

        function awakAbandonRift() {
            const session = awakActiveRiftSession;
            if (!session) return;
            showConfirm(
                // ⚠️ Le message annonçait « toute la progression sera perdue », ce qui
        // est FAUX : les dégâts infligés au monstre restent enregistrés.
        // Dire le contraire décourageait d'abandonner une Faille trop dure.
        'Tu pourras reprendre cette Faille plus tard : les dégâts déjà infligés '
        + 'au monstre sont conservés. Seule la séance en cours s\'arrête.',
                () => {
                    _awakCombatCapturer();   // v1569
                    awakActiveRiftSession = null;
                    document.getElementById('awakRiftCombatModal')?.remove();
                    // 🐛 La session de Faille était effacée, mais PAS la séance
                    // d'entraînement : l'écran d'exercice restait dans l'onglet
                    // Entraîner et l'accueil proposait de « reprendre la séance ».
                    // On termine donc proprement la séance, SANS la sauvegarder
                    // (une Faille abandonnée ne se reprend pas : on la refait).
                    try {
                        currentWorkout = null;
                        currentSupersetWorkout = null;
                        if (typeof clearActiveWorkoutState === 'function') clearActiveWorkoutState();
                        if (typeof stopTimer === 'function') stopTimer();
                        if (typeof stopSessionTimer === 'function') stopSessionTimer();
                        const _ev = document.getElementById('exerciseView');
                        if (_ev) _ev.classList.add('hidden');
                        const _ws = document.getElementById('workoutSelection');
                        if (_ws) _ws.style.display = '';
                        const _pv = document.getElementById('preparationView');
                        if (_pv) _pv.classList.add('hidden');
                        const _fq = document.getElementById('floatingQuitBtn');
                        if (_fq) _fq.style.display = 'none';
                        document.body.classList.remove('in-session', 'workout-fullscreen');
                        if (typeof resetWorkoutInterfaceElements === 'function') resetWorkoutInterfaceElements();
                    } catch (e) { _awkE(e); }
                    switchTab('game');
                },
                null,
                {
                    title: 'Abandonner la Faille ?',
                    subtitle: '◈ FUITE DU COMBAT ◈',
                    icon: '⚔',
                    confirmLabel: '✕ Fuir',
                    cancelLabel: '↩ Rester',
                    danger: true
                }
            );
        }
        window.awakAbandonRift = awakAbandonRift;

        /**
         * Faille terminée → écran de victoire + récompenses
         */
        function awakCompleteRift() {
            const session = awakActiveRiftSession;
            if (!session) return;
            const { rift, theme } = session;
            const playerPower = awakGetPowerScore();

            // Marquer comme complétée
            const rifts = awakRiftsLoad();
            const r = rifts.find(x => x.id === rift.id);
            if (r) {
                const _wasCompleted = r.completed;
                r.completed = true;
                r.completedAt = Date.now();
                // Compteur à vie : incrémenter UNE SEULE fois, à la vraie complétion.
                // 🐛 `isNarrative` n'identifie PAS les Failles d'histoire : c'est une protection
                // anti-expiration portée AUSSI par les Failles compagnons, sous-boss et abysses.
                // Les exclure du compteur bloquait « Fermer 5 Failles » (La Tour qui Murmure) :
                // un joueur pouvait en fermer 10 sans que le compteur bouge.
                // Seules les Failles d'HISTOIRE (narrativeId) ne se comptent pas elles-mêmes.
                if (!_wasCompleted && !r.narrativeId) { try { awakIncrementRiftsCompleted(); } catch (e) { _awkE(e); } }
                // 🔖 Trace PERMANENTE de complétion d'une Faille narrative :
                // le tableau purge les Failles terminées après 7 jours, donc
                // il ne peut pas servir de preuve durable. Sans cette trace,
                // awakRepairNarrativeRifts recréerait une Faille déjà faite.
                if (!_wasCompleted && r.narrativeId) {
                    try { localStorage.setItem('awakNarrativeDone_' + r.narrativeId, '1'); } catch (e) { _awkE(e); }
                    // v1422 : issue des Failles à choix / à mécanique (variantes de scène)
                    try {
                        if (r._echoPerdu || (r._fauxCount || 0) >= 2) {
                            r.echec = true;
                            localStorage.setItem('awakStoryEvt__echec_' + r.narrativeId, '1');
                            if (r.narrativeId === 'the_echo') localStorage.setItem('awakStoryEvt__echoOubli', String((loadStats().workouts || 0)));
                        }
                        if (r.narrativeId === 'merchant_fading' && typeof awakConsumablesAdd === 'function') {
                            awakConsumablesAdd('larme_systeme', 1);
                            setTimeout(() => { try { showToast('Le Marchand t\'offre une Larme du Système.', 'success', 4000); } catch (e) { _awkE(e); } }, 2200);
                        }
                    } catch (e) { _awkE(e); }
                    // 🎬 DIALOGUE APRÈS UNE FAILLE D'HISTOIRE.
                    // ⚠️ La complétion était bien ENREGISTRÉE, mais le module
                    // narratif n'était jamais consulté : les événements dont le
                    // déclencheur est « levelAndNarrativeRift » ne se lançaient
                    // donc qu'au hasard d'une séance ultérieure — souvent bien
                    // après, sans lien perceptible avec la Faille.
                    // Le délai laisse l'écran de récompense se fermer d'abord.
                    try {
                        if (typeof storyCheckEvents === 'function') {
                            setTimeout(function () { storyCheckEvents({ delay: 400 }); }, 2600);
                        }
                    } catch (e) { _awkE(e); }
                }
                // 🔧 Migration : si cette Faille est une Faille de compagnon mais a perdu/manque
                // ses champs (créée par une ancienne version), on les reconstruit depuis son id/nom.
                if (!r.isCompanionRift || !r.companionId || !r.companionRiftId) {
                    try {
                        const cr = (typeof COMPANION_RIFTS !== 'undefined')
                            ? COMPANION_RIFTS.find(c => (r.id && r.id.indexOf(c.id) !== -1) || r.name === c.name)
                            : null;
                        if (cr) {
                            r.isCompanionRift = true;
                            r.companionRiftId = cr.id;
                            r.companionId = cr.companionId;
                            // propager aussi sur l'objet de session en cours pour le déclenchement immédiat
                            rift.isCompanionRift = true;
                            rift.companionRiftId = cr.id;
                            rift.companionId = cr.companionId;
                        }
                    } catch(e) { _awkE(e); }
                }
                awakRiftsSave(rifts);
            }

            // Calculer la note finale (F → SSS)
            const duration = Date.now() - session.startTime;
            const minutes = duration / 60000;
            // ⚡ ASSAUT : la durée est IMPOSÉE par la séance, pas choisie par le
            // joueur — noter la rapidité n'aurait aucun sens (SSS automatique).
            // On note donc la MARGE : plus il reste de temps quand le monstre
            // tombe, meilleure est la note. Un Assaut mené jusqu'au bout de
            // justesse vaut un B, une victoire éclair un SSS.
            const _estAssaut = !!rift.isAssaut;
            const idealTime = _estAssaut
                ? (currentWorkout && currentWorkout.duration ? currentWorkout.duration * 0.75 : 6)
                : rift.waves.length * 4; // 4 min/vague idéal

            let grade = 'F';
            if (minutes <= idealTime * 0.7) grade = 'SSS';
            else if (minutes <= idealTime * 0.9) grade = 'SS';
            else if (minutes <= idealTime * 1.1) grade = 'S';
            else if (minutes <= idealTime * 1.3) grade = 'A';
            else if (minutes <= idealTime * 1.6) grade = 'B';
            else if (minutes <= idealTime * 2.0) grade = 'C';
            else grade = 'D';
            // v1569 : moins de 3 séries → pas au-dessus de A (avant : SSS pour 0 min et 2 séries)
            if (!_estAssaut && (session.setsCompleted || 0) < 3 && ['SSS', 'SS', 'S'].indexOf(grade) >= 0) grade = 'A';

            const gradeColors = {
                SSS: '#fbbf24', SS: '#f59e0b', S: '#ef4444',
                A: '#a855f7', B: '#3b82f6', C: '#22c55e', D: '#94a3b8', F: '#64748b'
            };

            // XP bonus selon rang + grade
            const xpByRank = { E: 200, D: 400, C: 700, B: 1100, A: 1700, S: 2500, SS: 3600, SSS: 5000 };
            const gradeMult = { SSS: 1.5, SS: 1.3, S: 1.2, A: 1.0, B: 0.9, C: 0.8, D: 0.7, F: 0.5 };
            let xpReward = Math.round(xpByRank[rift.rank] * gradeMult[grade]);

            // 🌀 SEN : bonus XP
            const bonuses = awakComputeStatBonuses();
            const xpBeforeBonus = xpReward;
            xpReward = Math.round(xpReward * bonuses.xpMult);
            try { if (typeof window.awkDefiEffets === 'function') xpReward = Math.round(xpReward * window.awkDefiEffets().xp); } catch (e) { _awkE(e); }   // v1537
            const xpBonusAmount = xpReward - xpBeforeBonus;

            // ⚡ MODIFICATEUR DE FAILLE : multiplicateur d'XP
            try {
                const _mod = (typeof awakGetRiftModifier === 'function') ? awakGetRiftModifier(rift.modifierId) : null;
                if (_mod && _mod.xpMult && _mod.xpMult !== 1) {
                    xpReward = Math.round(xpReward * _mod.xpMult);
                }
            } catch(e) { _awkE(e); }

            // ☠️ MALÉDICTION : réduction d'XP des items maudits
            const _curse = typeof getActiveCurseEffects === 'function' ? getActiveCurseEffects() : null;
            if (_curse && _curse.xpMalus > 0) {
                xpReward = Math.round(xpReward * (1 - _curse.xpMalus));
            }

            // ⬥ BUTIN EXCLUSIF DE FAILLE — chance d'obtenir un item riftOnly du rang de la Faille
            let riftLoot = null;
            try {
                if (typeof EQUIPMENT_DATABASE !== 'undefined' && typeof getInventory === 'function') {
                    // Rareté du butin liée au rang de la Faille (E→common ... S→legendary, avec variance)
                    // SS/SSS étaient absents : leur butin retombait sur 'common'
                    // via le repli — une Faille de rang maximal donnait donc
                    // l'équipement le plus banal du jeu.
                    const rankToRarity = { E:'common', D:'uncommon', C:'rare', B:'superior', A:'epic',
                                           S:'legendary', SS:'legendary', SSS:'mythic' };
                    const baseRarity = rankToRarity[rift.rank] || 'common';
                    const order = ['common','uncommon','rare','superior','epic','legendary','mythic'];
                    const bi = order.indexOf(baseRarity);
                    // 70% rareté du rang, 20% un cran en dessous, 10% un cran au-dessus
                    const r2 = Math.random();
                    let pickRarity = baseRarity;
                    if (r2 > 0.9 && bi < order.length-1) pickRarity = order[bi+1];
                    else if (r2 < 0.2 && bi > 0) pickRarity = order[bi-1];
                    // 🔴 Contenu endgame d'élite : chance accrue de MYTHIQUE (Abysse, boss final, boss hebdo)
                    const isEliteContent = rift.isAbyss || rift.isFinalBoss || rift.isWeeklyBoss ||
                                           (rift.modifierId === 'worldboss');
                    if (isEliteContent && rift.rank === 'S') {
                        // jalon d'Abysse / boss : ~35% mythique, sinon legendary
                        pickRarity = (Math.random() < 0.35) ? 'mythic' : 'legendary';
                    }
                    // Chance de drop selon le grade (meilleur grade = plus de chance)
                    const dropChanceByGrade = { SSS:0.9, SS:0.8, S:0.7, A:0.6, B:0.5, C:0.4, D:0.3, F:0.2 };
                    if (Math.random() < (dropChanceByGrade[grade] || 0.4)) {
                        let riftPool = EQUIPMENT_DATABASE.filter(i => i.riftOnly && i.rarity === pickRarity);
                        // Repli : si pas d'item riftOnly de cette rareté, élargir au pool général de la rareté
                        if (!riftPool.length) riftPool = EQUIPMENT_DATABASE.filter(i => i.rarity === pickRarity);
                        if (riftPool.length) {
                            const won = riftPool[Math.floor(Math.random() * riftPool.length)];
                            const inv = getInventory();
                            inv.unshift({ itemId: won.id, obtainedAt: new Date().toISOString(), id: Date.now() });
                            if (typeof saveInventory === 'function') saveInventory(inv);
                            riftLoot = won;
                        }
                    }
                }
            } catch(e) { _awkE(e); }

            // 💎 DROP DE MINÉRAUX (vendables au marchand) — selon les SÉRIES complétées (effort réel)
            let mineralDrops = [];
            try {
                if (window.AwakEconomy && !awakIsSoloRift(rift)) {
                    const setsDone = (awakActiveRiftSession && awakActiveRiftSession.setsCompleted) || 0;
                    // 💎 Modificateur "Filon" : multiplie la récolte de minéraux
                    const _mineralMod = (typeof awakGetRiftModifier === 'function') ? awakGetRiftModifier(rift.modifierId) : null;
                    const _mineralMult = (_mineralMod && _mineralMod.mineralMult) ? _mineralMod.mineralMult : 1;
                    mineralDrops = window.AwakEconomy.dropMineralsForRift(rift.rank, grade, setsDone, _mineralMult);
                }
            } catch(e) { _awkE(e); }

            document.getElementById('awakRiftCombatModal')?.remove();
            const modal = document.createElement('div');
            modal.id = 'awakRiftRewardModal';
            modal.className = 'modal active';
            modal.style.cssText = 'background:rgba(0,0,0,0.95);backdrop-filter:blur(12px);';

            modal.innerHTML = `
            <div class="modal-content awak-bg-image" style="max-width:480px;background-color:#000;background-image:linear-gradient(180deg,rgba(0,0,0,0.35) 0%,rgba(10,14,24,0.88) 42%,rgba(15,16,20,0.97) 100%), url('images/faille_fermee_bg.webp?v=1622');background-size:cover,100% auto;background-position:center,center top;background-repeat:no-repeat,no-repeat;border:1px solid ${theme.color}50;padding:0;border-radius:20px;max-height:90vh;overflow-y:auto;-webkit-overflow-scrolling:touch;">

                <!-- Bannière FAILLE FERMÉE -->
                <div style="background:linear-gradient(135deg,${theme.color}30,${theme.color}10);padding:30px 22px;text-align:center;position:relative;border-bottom:1px solid ${theme.color}30;">
                    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,${theme.color},transparent);animation:awakBlink 1.5s ease-in-out infinite;"></div>
                    <div style="font-size:0.65em;color:${theme.color};font-weight:900;letter-spacing:3px;margin-bottom:8px;">◇ FAILLE FERMÉE ◇</div>
                    <div style="font-size:3.5em;line-height:1;margin-bottom:8px;filter:drop-shadow(0 0 18px ${theme.color}b0);">${theme.emoji}</div>
                    <h2 style="margin:0 0 8px 0;color:#fff !important;font-size:1.15em;font-weight:900;">${rift.name}</h2>
                    <div style="font-size:0.8em;color:#94a3b8;">${minutes < 1 ? '< 1' : Math.round(minutes)} min · ${session.totalDamageDealt} dégâts totaux</div>
                </div>

                <!-- Note -->
                <div style="padding:20px 22px;text-align:center;">
                    <div style="font-size:0.6em;color:#94a3b8;font-weight:800;letter-spacing:2px;margin-bottom:6px;">◈ NOTE FINALE</div>
                    <div style="font-size:4em;font-weight:900;color:${gradeColors[grade]};line-height:1;letter-spacing:-2px;text-shadow:0 0 24px ${gradeColors[grade]}90;margin-bottom:4px;">${grade}</div>
                </div>

                <!-- Récompenses -->
                <div style="padding:0 22px 18px 22px;">
                    <div style="font-size:0.6em;color:#94a3b8;font-weight:800;letter-spacing:2px;margin-bottom:10px;">◈ RÉCOMPENSES</div>
                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <span style="color:#cbd5e1;font-size:0.9em;font-weight:700;">XP de personnage</span>
                            <span style="color:${theme.color};font-weight:900;">+${Math.round(xpReward * (window.AWAK_RIFT_XP_FACTOR || 0.35))}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span style="color:#cbd5e1;font-size:0.9em;font-weight:700;">⚔ Rang vaincu</span>
                            <span style="color:white;font-weight:900;">${rift.rank}</span>
                        </div>
                    </div>

                    ${riftLoot ? (() => {
                        const lr = (typeof RARITIES !== 'undefined' && RARITIES[riftLoot.rarity]) ? RARITIES[riftLoot.rarity] : { color:'#a855f7', label:'?' };
                        return `<div style="margin-top:12px;background:linear-gradient(135deg,${lr.color}1f,${lr.color}0a);border:1.5px solid ${lr.color}66;border-radius:14px;padding:14px;animation:awakFadeIn 0.6s ease 0.3s both;">
                            <div style="font-size:0.58em;color:${lr.color};font-weight:900;letter-spacing:2px;margin-bottom:8px;">BUTIN DE FAILLE</div>
                            <div style="display:flex;align-items:center;gap:11px;">
                                <div style="font-size:1.8em;filter:drop-shadow(0 0 8px ${lr.color}aa);">${riftLoot.icon}</div>
                                <div style="flex:1;min-width:0;">
                                    <div style="font-weight:900;color:white;font-size:0.92em;">${riftLoot.name}</div>
                                    <div style="font-size:0.68em;color:${lr.color};font-weight:800;">Rareté ${lr.label} · exclusif Faille</div>
                                </div>
                            </div>
                        </div>`;
                    })() : ''}

                    ${(mineralDrops && mineralDrops.length && window.AwakEconomy) ? (() => {
                        const MT = window.AwakEconomy.MINERAL_TYPES;
                        const rows = mineralDrops.map(d => {
                            const t = MT[d.type];
                            if (!t) return '';
                            return `<div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-size:1.3em;">${t.icon}</span>
                                <span style="color:${t.color};font-weight:800;font-size:0.85em;">${t.name}</span>
                                <span style="color:#94a3b8;font-weight:900;font-size:0.85em;margin-left:auto;">×${d.qty}</span>
                            </div>`;
                        }).join('');
                        return `<div style="margin-top:12px;background:linear-gradient(135deg,rgba(251,191,36,0.12),rgba(251,191,36,0.03));border:1.5px solid rgba(251,191,36,0.4);border-radius:14px;padding:14px;animation:awakFadeIn 0.6s ease 0.45s both;">
                            <div style="font-size:0.58em;color:#fbbf24;font-weight:900;letter-spacing:2px;margin-bottom:8px;">MINÉRAUX EXTRAITS</div>
                            <div style="display:flex;flex-direction:column;gap:6px;">${rows}</div>
                            <div style="font-size:0.62em;color:#8391a7;margin-top:8px;font-style:italic;">À vendre au marchand contre de l'or.</div>
                        </div>`;
                    })() : ''}

                    <!-- Message Système -->
                    <div style="margin-top:14px;padding:12px 14px;background:rgba(34,211,238,0.08);border-left:3px solid #22d3ee;border-radius:10px;">
                        <div style="font-size:0.6em;color:#22d3ee;font-weight:900;letter-spacing:2px;margin-bottom:4px;">SYSTÈME</div>
                        <div style="color:#cbd5e1;font-size:0.85em;font-style:italic;line-height:1.5;">${getSystemMessageForGrade(grade)}</div>
                    </div>
                </div>

            
                <!-- Bouton en BAS : le défilement de la fenêtre fonctionne,
                     le bouton retrouve donc sa place naturelle. -->
                <div style="padding:6px 22px calc(20px + env(safe-area-inset-bottom, 0px));">
                    <button onclick="document.getElementById('awakRiftRewardModal').remove();awakActiveRiftSession=null;switchTab('game');" style="width:100%;background:linear-gradient(135deg,${theme.color},${theme.color}dd);border:none;color:white;border-radius:10px;padding:16px;font-weight:900;font-size:0.95em;letter-spacing:1px;cursor:pointer;box-shadow:0 4px 16px ${theme.color}40;">CONTINUER</button>
                </div>
            </div>`;

            document.body.appendChild(modal);

            // Distribuer le XP réel via le système RPG (réparti sur les muscles)
            try {
                if (typeof rpgGainXP === 'function') {
                    // ⚠️ v1218 : passait par une fausse « série » plafonnée à 50 reps
                    // → ~50 XP au lieu des 200-5000 affichés. Versé maintenant en entier.
                    awakGrantLifetimeXP(Math.round(xpReward * (window.AWAK_RIFT_XP_FACTOR || 0.35)));
                }
            } catch(e) { _awkE(e); }

            // 🌌 FAILLE ANOMALIE : drop légendaire garanti
            try {
                const _mod = (typeof awakGetRiftModifier === 'function') ? awakGetRiftModifier(rift.modifierId) : null;
                if (_mod && _mod.guaranteedLegendary && typeof grantGuaranteedLegendary === 'function') {
                    const mainMuscle = rift.primaryStat ? null : null; // legendary tous muscles
                    const drop = grantGuaranteedLegendary(mainMuscle);
                    if (drop && typeof showDropModal === 'function') {
                        setTimeout(() => showDropModal(drop.item, drop.rarity, drop.qualityScore), 2200);
                    }
                }
                // 👹 BOSS HEBDOMADAIRE vaincu : marquer la semaine (il ne réapparaîtra qu'à la prochaine)
                if (rift.isWeeklyBoss && rift.weekKey) {
                    localStorage.setItem('awakWeeklyBossDoneWeek', rift.weekKey);
                }
                // 🩸 SOUS-BOSS vaincu : avancer la séquence des Quatre Épreuves
                if (rift.isSubBoss && typeof awakOnSubBossDefeated === 'function') {
                    awakOnSubBossDefeated(rift);
                }
                // 🕳️ PALIER D'ABYSSE vaincu : avancer la profondeur + record
                if (rift.isAbyss && typeof awakOnAbyssDefeated === 'function') {
                    awakOnAbyssDefeated(rift);
                }
            } catch(e) { _awkE(e); }

            // Haptic + son
            if (typeof hapticTap === 'function') hapticTap([50, 30, 80]);

            // 💬 Phase 4 : dialogue de victoire + check déblocages
            try {
                setTimeout(() => awakCompanionShowDialogue('onVictory'), 1500);
                // 🤝 Faille de compagnon : jouer la mini-scène de rencontre PUIS la pop-up de déblocage
                // Robustesse : on déduit le compagnon même si le champ companionId manque (vieilles Failles).
                let _compId = rift.companionId;
                if (!_compId && typeof COMPANION_RIFTS !== 'undefined') {
                    const _cr = COMPANION_RIFTS.find(c => (rift.id && rift.id.indexOf(c.id) !== -1) || rift.name === c.name);
                    if (_cr) _compId = _cr.companionId;
                }
                if (_compId) {
                    setTimeout(() => {
                        awakShowCompanionMeeting(_compId, () => {
                            // Après la scène, débloquer + pop-up officielle
                            if (typeof awakCompanionsTriggerUnlockCheck === 'function') {
                                awakCompanionsTriggerUnlockCheck();
                            }
                        });
                    }, 3000);
                } else {
                    setTimeout(() => awakCompanionsTriggerUnlockCheck(), 3000);
                }
            } catch(e) { _awkE(e); }

            // 🧪 Phase 5 : consommer les consommables actifs
            try { awakConsumablesConsume(); } catch(e) { _awkE(e); }

            // 🎁 Phase 5 : chance de drop d'un nouveau consommable
            try { awakMaybeDropConsumable(grade); } catch(e) { _awkE(e); }

            // ✨ Phase 5 : check si une Faille narrative doit apparaître
            try { setTimeout(() => awakCheckNarrativeRifts(), 4500); } catch(e) { _awkE(e); }
            // 🤝 Check si une Faille de compagnon doit apparaître
            try { setTimeout(() => { if (typeof awakCheckCompanionRifts === 'function') awakCheckCompanionRifts(); }, 5200); } catch(e) { _awkE(e); }
            // 🩸 Check si une Épreuve (sous-boss) doit apparaître
            try { setTimeout(() => { if (typeof awakCheckSubBosses === 'function') awakCheckSubBosses(); }, 5600); } catch(e) { _awkE(e); }
            // 🌀 Notifier si le joueur vient de débloquer une Faille simultanée supplémentaire
            try { setTimeout(() => { if (typeof awakCheckRiftCapacityUnlock === 'function') awakCheckRiftCapacityUnlock(); }, 3200); } catch(e) { _awkE(e); }
            // 🕳️ Check si un palier d'Abysse doit apparaître (post-Effaceur)
            try { setTimeout(() => { if (typeof awakCheckAbyss === 'function') awakCheckAbyss(); }, 5800); } catch(e) { _awkE(e); }

            // 🌑 [GLITCH DU TISSERAND DÉSACTIVÉ — ancienne narration]
            // try { setTimeout(() => awakArchitectMaybeGlitch(), 6000); } catch(e) { _awkE(e); }

            // Reset la session
            awakActiveRiftSession = null;
        }
        window.awakCompleteRift = awakCompleteRift;

        function getSystemMessageForGrade(grade) {
            const messages = {
                SSS: 'Tu ne devrais pas être capable de ça. Pas encore. Je dois vérifier quelque chose.',
                SS: 'Au-delà de mes prévisions. Tu progresses plus vite que les autres Ancrages.',
                S: 'Excellent. Tu es là où tu dois être.',
                A: 'Bien. La Faille a accepté ta présence.',
                B: 'Refermée. Tu progresses.',
                C: 'C\'est fait. Tu peux faire mieux.',
                D: 'Tu as fini. À peine.',
                F: 'Tu n\'aurais pas dû y aller comme ça. La prochaine fois — prépare-toi.'
            };
            return messages[grade] || 'Refermée.';
        }

        // ═══════════════════════════════════════════════════════════════
        // 👹 PHASE 3 — MONSTRES ÉCHAPPÉS + CHASSES
        // ═══════════════════════════════════════════════════════════════
        //
        // Boucle de gameplay :
        // 1. Faille atteint l'état 'breach' → 1 monstre s'échappe
        // 2. Faille 'exploded' → 2-3 monstres s'échappent
        // 3. Max 3 monstres actifs simultanément (4ème fusionne en Alpha)
        // 4. Monstres handicapent les entraînements normaux
        // 5. Chasse = mini-faille 10-25 min pour éliminer 1 monstre
        // 6. Si ignoré 5+ jours : devient Alpha (loot premium mais dur)
        //

        const MONSTERS_STORAGE_KEY = 'awakEscapedMonsters';
        const MONSTERS_MAX_ACTIVE = 3;
        const MONSTER_ALPHA_THRESHOLD_DAYS = 5; // évolution Alpha après 5 jours

        // ── TYPES DE MONSTRES ESCAPÉS ─────────────────────────────────
        // Chaque type a un handicap qui affecte les entraînements normaux
        const ESCAPED_MONSTER_TYPES = [
            {
                id: 'gobelin',
                name: 'Gobelin Rebelle',
                emoji: '👺',
                color: '#22c55e',
                description: 'Petit, vicieux, rapide. Il sabote ton effort.',
                handicap: { type: 'sabotage', label: '10 % de tes séries ne donnent aucune XP' },   // v1538 : avant burpees forcés (jamais appliqués)
                huntDuration: 15, // minutes
                fromTheme: ['organic_desert', 'dimensional_train']
            },
            {
                id: 'loup',
                name: 'Loup d\'Ombre',
                emoji: '🐺',
                color: '#64748b',
                description: 'Il hurle dans ton dos. Ton corps se contracte.',
                handicap: { type: 'hurlement', label: 'Les monstres de Faille frappent 15 % plus fort' },   // v1538 : avant +30 s de repos (jamais appliqué)
                huntDuration: 18,
                fromTheme: ['frozen_city', 'underground_ocean']
            },
            {
                id: 'chevalier',
                name: 'Chevalier Brisé',
                emoji: '⚔️',
                color: '#a855f7',
                description: 'Une armure ambulante avec une volonté propre.',
                handicap: { type: 'armure', label: 'Les monstres de Faille ont 15 % de PV en plus' },   // v1538 : avant +1 série (jamais appliquée)
                huntDuration: 22,
                fromTheme: ['inverted_reality', 'frozen_city']
            },
            {
                id: 'spectre',
                name: 'Spectre Médical',
                emoji: '👻',
                color: '#06b6d4',
                description: 'Il flotte dans tes mouvements. Tu perds tes repères.',
                handicap: { type: 'reduce_xp', label: 'XP réduite de 20% par séance' },
                huntDuration: 16,
                fromTheme: ['living_hospital', 'inverted_reality']
            },
            {
                id: 'parasite',
                name: 'Parasite Croissant',
                emoji: '🦠',
                color: '#f59e0b',
                description: 'Quelque chose grandit en toi. Ne réfléchis pas.',
                handicap: { type: 'reduce_stats', label: '-15% sur tes dégâts en Faille' },
                huntDuration: 20,
                fromTheme: ['organic_desert', 'living_hospital']
            },
            {
                id: 'ombre',
                name: 'Ombre Fragmentée',
                emoji: '🌫️',
                color: '#ef4444',
                description: 'Elle te suit. Elle copie tes gestes. Mais en retard.',
                handicap: { type: 'block_drops', label: 'Aucun loot pendant ses entraînements' },
                huntDuration: 14,
                fromTheme: ['dimensional_train', 'underground_ocean']
            }
        ];

        // v1462 : image illustrée d'un monstre échappé (images/Monstres/echappe_<id>.webp).
        // Alpha : même image, aura rouge. Repli : l'icône Faille.
        window.awakEchappeImg = function (type, px, alpha) {
            if (!type) return '';
            const c = alpha ? '#ef4444' : (type.color || '#f59e0b');
            const repli = (window.AwakIcon ? AwakIcon.get('faille', Math.round(px * 0.5), c) : '').replace(/"/g, '&quot;');
            return '<img src="images/Monstres/echappe_' + type.id + '.webp" alt="" draggable="false" width="' + px + '" height="' + px + '"'
                + ' style="width:' + px + 'px;height:' + px + 'px;object-fit:contain;flex-shrink:0;display:block;filter:drop-shadow(0 0 ' + (alpha ? 10 : 6) + 'px ' + c + (alpha ? 'cc' : '77') + ');"'
                + ' onerror="this.outerHTML=this.dataset.r" data-r="' + repli + '">';
        };
        function awakMonstersLoad() {
            try {
                const profileId = typeof getCurrentProfileId === 'function' ? getCurrentProfileId() : null;
                const key = profileId ? `${MONSTERS_STORAGE_KEY}_${profileId}` : MONSTERS_STORAGE_KEY;
                return JSON.parse(localStorage.getItem(key) || '[]');
            } catch(e) { return []; }
        }

        function awakMonstersSave(monsters) {
            try {
                const profileId = typeof getCurrentProfileId === 'function' ? getCurrentProfileId() : null;
                const key = profileId ? `${MONSTERS_STORAGE_KEY}_${profileId}` : MONSTERS_STORAGE_KEY;
                localStorage.setItem(key, JSON.stringify(monsters));
            } catch(e) { _awkE(e); }
        }

        /**
         * Génère un monstre échappé à partir d'une Faille en brèche
         * @param {Object} rift - La Faille source
         * @param {Boolean} isExplosion - Si la faille a explosé (multi-monstres)
         */
        function awakSpawnEscapedMonsters(rift, isExplosion) {
            const monsters = awakMonstersLoad();
            const active = monsters.filter(m => !m.defeated);

            // Combien de monstres à générer
            const count = isExplosion ? 2 : 1;

            // Choisir le type selon le thème de la Faille
            const theme = rift.themeId;
            const candidates = ESCAPED_MONSTER_TYPES.filter(t => t.fromTheme.includes(theme));
            const pool = candidates.length > 0 ? candidates : ESCAPED_MONSTER_TYPES;

            const spawned = [];
            for (let i = 0; i < count; i++) {
                // Si on dépasse la limite, fusionner avec un Alpha
                if (active.length + spawned.length >= MONSTERS_MAX_ACTIVE) {
                    // Trouver le plus ancien monstre actif et le transformer en Alpha
                    const oldest = active.sort((a, b) => a.spawnedAt - b.spawnedAt)[0];
                    if (oldest && !oldest.isAlpha) {
                        oldest.isAlpha = true;
                        oldest.alphaSince = Date.now();
                    }
                    continue;
                }

                const type = pool[Math.floor(Math.random() * pool.length)];
                const hpBase = { E: 50, D: 90, C: 140, B: 200, A: 280, S: 380, SS: 500, SSS: 650 }[rift.rank] || 100;

                spawned.push({
                    id: 'monster_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                    typeId: type.id,
                    spawnedAt: Date.now(),
                    fromRiftRank: rift.rank,
                    fromRiftName: rift.name,
                    fromRiftId: rift.id,
                    hpMax: hpBase,
                    hpCurrent: hpBase,
                    isAlpha: false,
                    defeated: false,
                    huntsAttempted: 0
                });
            }

            monsters.push(...spawned);
            awakMonstersSave(monsters);
            return spawned;
        }
        window.awakSpawnEscapedMonsters = awakSpawnEscapedMonsters;

        /**
         * Met à jour l'état des monstres (transformation Alpha si vieux)
         */
        function awakUpdateMonstersState() {
            const monsters = awakMonstersLoad();
            const now = Date.now();
            let changed = false;

            for (const m of monsters) {
                if (m.defeated) continue;
                const daysSinceSpawn = (now - m.spawnedAt) / (24 * 60 * 60 * 1000);

                // Évolution en Alpha après 5 jours
                if (!m.isAlpha && daysSinceSpawn >= MONSTER_ALPHA_THRESHOLD_DAYS) {
                    m.isAlpha = true;
                    m.alphaSince = now;
                    // Boost HP en devenant Alpha
                    m.hpMax = Math.round(m.hpMax * 1.5);
                    m.hpCurrent = m.hpMax;
                    changed = true;
                }
            }

            // Nettoyer les monstres vaincus depuis plus de 7 jours
            const cleaned = monsters.filter(m => {
                if (m.defeated && m.defeatedAt && now - m.defeatedAt > 7 * 24 * 60 * 60 * 1000) return false;
                return true;
            });

            if (changed || cleaned.length !== monsters.length) {
                awakMonstersSave(cleaned);
            }
            return cleaned;
        }
        window.awakUpdateMonstersState = awakUpdateMonstersState;

        function awakGetActiveMonsters() {
            return awakUpdateMonstersState().filter(m => !m.defeated);
        }
        window.awakGetActiveMonsters = awakGetActiveMonsters;

        function awakGetMonsterById(id) {
            return awakMonstersLoad().find(m => m.id === id);
        }
        window.awakGetMonsterById = awakGetMonsterById;

        /**
         * Hook : vérifie si une Faille passe en breach/exploded et spawn les monstres
         * À appeler après awakUpdateRiftsState
         */
        function awakCheckRiftsForMonsterSpawn() {
            const rifts = awakRiftsLoad();
            const monsters = awakMonstersLoad();
            let changed = false;

            for (const rift of rifts) {
                if (rift.completed) continue;

                // Si la faille est en breach et qu'on n'a pas encore spawn → spawn
                if (rift.state === 'breach' && !rift._breachSpawned) {
                    const spawned = awakSpawnEscapedMonsters(rift, false);
                    if (spawned.length > 0) {
                        rift._breachSpawned = true;
                        changed = true;
                        // Notification
                        setTimeout(() => {
                            if (typeof showToast === 'function') {
                                showToast(`👹 ${spawned[0].typeId === 'gobelin' ? 'Un gobelin' : 'Un monstre'} s'est échappé de la Faille`, 'warning', 5000);
                            }
                        }, 1000);
                    }
                }

                // Si explosée → 2 monstres
                if (rift.state === 'exploded' && !rift._explosionSpawned) {
                    awakSpawnEscapedMonsters(rift, true);
                    rift._explosionSpawned = true;
                    changed = true;
                    setTimeout(() => {
                        if (typeof showToast === 'function') {
                            showToast(`💥 La Faille a explosé ! Plusieurs monstres s'échappent.`, 'warning', 6000);
                        }
                    }, 1000);
                }
            }

            if (changed) awakRiftsSave(rifts);
        }
        window.awakCheckRiftsForMonsterSpawn = awakCheckRiftsForMonsterSpawn;

        /**
         * Récupère le handicap global actif (somme de tous les monstres)
         * Utilisé par les entraînements normaux
         */
        function awakGetActiveHandicaps() {
            const active = awakGetActiveMonsters();
            const handicaps = {
                sabotage: 0,             // v1538 : % de séries sans XP
                hurlement: 0,            // v1538 : % de dégâts des ripostes en Faille
                armure: 0,               // v1538 : % de PV des monstres en Faille
                reduce_xp: 0,            // pourcentage de réduction
                reduce_stats: 0,         // pourcentage de réduction
                block_drops: false
            };

            for (const m of active) {
                const type = ESCAPED_MONSTER_TYPES.find(t => t.id === m.typeId);
                if (!type || !type.handicap) continue;
                const mult = m.isAlpha ? 2 : 1; // Alpha = handicap doublé

                switch(type.handicap.type) {
                    case 'sabotage':       handicaps.sabotage += 10 * mult; break;
                    case 'hurlement':      handicaps.hurlement += 15 * mult; break;
                    case 'armure':         handicaps.armure += 15 * mult; break;
                    case 'reduce_xp':      handicaps.reduce_xp += 20 * mult; break;
                    case 'reduce_stats':   handicaps.reduce_stats += 15 * mult; break;
                    case 'block_drops':    handicaps.block_drops = true; break;
                }
            }

            handicaps.reduce_xp = Math.min(handicaps.reduce_xp, 60); // cap à 60%
            handicaps.sabotage = Math.min(handicaps.sabotage, 40);
            handicaps.hurlement = Math.min(handicaps.hurlement, 60);
            handicaps.armure = Math.min(handicaps.armure, 60);
            handicaps.reduce_stats = Math.min(handicaps.reduce_stats, 50);
            handicaps.totalMonsters = active.length;
            handicaps.alphaCount = active.filter(m => m.isAlpha).length;

            return handicaps;
        }
        window.awakGetActiveHandicaps = awakGetActiveHandicaps;

        // ═══════════════════════════════════════════════════════════════
        // 🏹 SYSTÈME DE CHASSE (mini-Faille pour vaincre un monstre)
        // ═══════════════════════════════════════════════════════════════
        let awakActiveHuntSession = null;

        function awakStartHunt(monsterId) {
            const monster = awakGetMonsterById(monsterId);
            if (!monster || monster.defeated) return;
            const type = ESCAPED_MONSTER_TYPES.find(t => t.id === monster.typeId);
            if (!type) return;

            // Anti-découragement : si >2 monstres actifs, raccourcir la chasse
            const active = awakGetActiveMonsters();
            let duration = type.huntDuration;
            if (active.length > 2) duration = Math.max(10, duration - 5);

            // Reset HP au cas où retry
            monster.hpCurrent = monster.hpMax;
            monster.huntsAttempted = (monster.huntsAttempted || 0) + 1;
            const monsters = awakMonstersLoad();
            const idx = monsters.findIndex(m => m.id === monsterId);
            if (idx >= 0) {
                monsters[idx] = monster;
                awakMonstersSave(monsters);
            }

            awakActiveHuntSession = {
                monster,
                type,
                duration,
                startTime: Date.now(),
                totalDamage: 0
            };

            // Fermer modal détail si ouvert
            document.getElementById('awakMonsterDetailModal')?.remove();

            // Lancer l'écran de chasse
            awakShowHuntScreen();
        }
        window.awakStartHunt = awakStartHunt;

        function awakShowHuntScreen() {
            const session = awakActiveHuntSession;
            if (!session) return;
            const { monster, type } = session;

            // Choisir 4 exercices de chasse (variés)
            const huntExercises = awakGetHuntExercises(type, 4);

            const hpPercent = Math.max(0, Math.round((monster.hpCurrent / monster.hpMax) * 100));
            const hpColor = hpPercent > 60 ? '#22c55e' : hpPercent > 30 ? '#f59e0b' : '#ef4444';
            const alphaClass = monster.isAlpha ? 'ALPHA · ' : '';

            document.getElementById('awakHuntCombatModal')?.remove();
            const modal = document.createElement('div');
            modal.id = 'awakHuntCombatModal';
            modal.className = 'modal active';
            modal.style.cssText = 'background:rgba(0,0,0,0.95);backdrop-filter:blur(8px);';

            modal.innerHTML = `
            <div class="modal-content" style="max-width:520px;background:linear-gradient(160deg,#0a0e18,#0F1014);border:1px solid ${type.color}50;padding:0;overflow:hidden;border-radius:20px;max-height:92vh;display:flex;flex-direction:column;">
                <!-- Header chasse -->
                <div style="background:linear-gradient(135deg,${type.color}25,transparent);padding:18px 20px;border-bottom:1px solid ${type.color}30;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <span style="font-size:0.6em;color:${type.color};font-weight:900;letter-spacing:2px;">🏹 CHASSE ${alphaClass}${session.duration} MIN</span>
                        <button onclick="awakAbandonHunt()" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171;border-radius:10px;padding:5px 10px;font-size:0.7em;font-weight:800;cursor:pointer;">✕ Fuir</button>
                    </div>
                    <div style="display:flex;align-items:center;gap:14px;">
                        <!-- ⚠️ Emoji système remplacé par un losange (v1024) : son rendu
                         change d'un téléphone à l'autre et cassait le ton. -->
                    <div style="margin:0 8px;flex-shrink:0;width:30px;height:30px;border:1.5px solid ${type.color};transform:rotate(45deg);box-shadow:0 0 16px ${type.color}55;"></div>
                        <div style="flex:1;">
                            <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                                ${monster.isAlpha ? '<span style="background:#ef4444;color:white;padding:1px 6px;border-radius:6px;font-size:0.55em;font-weight:900;letter-spacing:1px;">ALPHA</span>' : ''}
                                <span style="font-weight:900;color:white;font-size:1.1em;">${type.name}</span>
                            </div>
                            <div style="background:rgba(255,255,255,0.05);height:14px;border-radius:99px;overflow:hidden;border:1px solid rgba(255,255,255,0.05);position:relative;">
                                <div style="width:${hpPercent}%;height:100%;background:linear-gradient(90deg,${hpColor},${hpColor}cc);transition:width 0.5s cubic-bezier(0.16,1,0.3,1);box-shadow:0 0 8px ${hpColor}80;"></div>
                                <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.65em;font-weight:900;color:white;text-shadow:0 0 4px black;letter-spacing:1px;">${monster.hpCurrent} / ${monster.hpMax} HP</div>
                            </div>
                            <div style="margin-top:5px;font-size:0.68em;color:#94a3b8;font-style:italic;">${type.description}</div>
                        </div>
                    </div>
                </div>

                <!-- Exercices de chasse -->
                <div style="padding:18px 20px;overflow-y:auto;flex:1;">
                    <div style="font-size:0.62em;color:#94a3b8;font-weight:800;letter-spacing:2px;margin-bottom:10px;">◈ TRAQUER AVEC :</div>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        ${huntExercises.map((ex, i) => `
                            <button onclick="awakPickHuntExercise(${i})" style="text-align:left;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);color:white;border-radius:10px;padding:12px 14px;cursor:pointer;transition:all 0.2s;">
                                <div style="display:flex;align-items:center;gap:10px;">
                                    ${awakExoIconBox(ex.muscle, type.color)}
                                    <div style="flex:1;min-width:0;">
                                        <div style="font-weight:800;font-size:0.92em;margin-bottom:2px;">${ex.name}</div>
                                        <div style="font-size:0.7em;color:#94a3b8;font-weight:600;">${ex.muscle || 'Multi'} · ~${ex.estDmg} dgts/série</div>
                                    </div>
                                    <div style="flex-shrink:0;display:inline-flex;">${window.AwakIcon ? AwakIcon.get('cible', 18, type.color) : ''}</div>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>`;

            document.body.appendChild(modal);
            awakActiveHuntSession.currentExercises = huntExercises;
        }
        window.awakShowHuntScreen = awakShowHuntScreen;

        /**
         * Sélectionne 4 exercices variés pour la chasse (court & intense)
         * Cardio + force mixed
         */
        function awakGetHuntExercises(monsterType, count) {
            const pool = (typeof _dbMuscu === 'function' ? _dbMuscu() : (typeof exerciseDatabase !== 'undefined' ? exerciseDatabase : []));

            // Filtres exercices courts/intenses : cardio, plyo, burpees, etc.
            const huntPool = pool.filter(ex => {
                const t = ex.type || 'exercise';
                if (t !== 'exercise') return false; // pas d'échauffement/étirement/info
                const n = (ex.name || '').toLowerCase();
                // v1417 : une Chasse se fait où on est, sans matériel (comme une Faille
                // ordinaire). Avant : aucun filtre d'équipement → « Pool Push-Up »,
                // « Water Running Sprint » (piscine), squats à la barre…
                const eq = ex.equipment || [];
                const eqTxt = eq.join(' ').toLowerCase();
                if (/piscine|pool|aqua|water|natation|swim/.test(n + ' ' + eqTxt)) return false;
                if (!(eq.length === 0 || eq.every(e => e === 'Poids du corps' || e === 'Aucun'))) return false;
                try { if (typeof awakExerciseBlockedByLocation === 'function' && awakExerciseBlockedByLocation(ex)) return false; } catch (e) { _awkE(e); }
                return /burpee|jump|plyo|sprint|hiit|squat|push|pompe|jack|climber/.test(n);
            });

            const playerStats = typeof awakGetTotalStats === 'function' ? awakGetTotalStats() : {};
            const totalStat = Object.values(playerStats).reduce((s, v) => s + v, 0);

            // v1478 : pas d'échauffement ni d'exercices pour enfants en Chasse
            const _hp0 = huntPool.filter(awakExoCombatOk);
            const _hp = awakCombatSecurite(_hp0.length >= count ? _hp0 : huntPool, count);   // v1569
            const shuffled = _hp.slice().sort(() => Math.random() - 0.5).slice(0, count);
            return shuffled.map(ex => ({
                ...ex,
                emoji: getThemeExerciseEmoji(ex),
                estDmg: 20 + Math.round(totalStat * 0.3)
            }));
        }

        function awakPickHuntExercise(exIdx) {
            const session = awakActiveHuntSession;
            if (!session) return;
            const exercise = session.currentExercises[exIdx];
            if (!exercise) return;

            document.getElementById('awakHuntCombatModal')?.remove();

            // Mini séance de chasse
            // 📜 Nouveau combat : journal remis à zéro, sinon les coups
            // s'accumuleraient d'un affrontement à l'autre.
            try { if (typeof awakCombatLogClear === 'function') awakCombatLogClear(); } catch (e) { _awkE(e); }
            const huntWorkout = {
                name: `🏹 Chasse — ${session.type.name}`,
                _isHunt: true,
                _monsterId: session.monster.id,
                exercises: [{
                    ...exercise,
                    sets: 2,
                    reps: exercise.reps || 12,
                    rest: 30,
                    _baseName: exercise.name
                }]
            };

            currentWorkout = huntWorkout;
            currentExerciseIndex = 0;
            currentSetNumber = 1;
            // v1304 : l'heure de début d'une séance PRÉCÉDENTE était réutilisée
            workoutStartTime = Date.now();
            if (typeof _workoutSkipCount !== 'undefined') _workoutSkipCount = 0;
            if (typeof completedSets !== 'undefined') completedSets = [];
            try { awakActiveRiftSession = null; } catch (e) { _awkE(e); }   // pas les PV d'une Faille dans une Chasse
            _awakNettoyerCombatUI();

            switchTab('workouts');
            setTimeout(() => {
                _awakEntrerCombatSeance('🏹 CHASSE — ' + (session.type.name || 'Monstre'), session.type.color);
                if (typeof startExercise === 'function') startExercise();
            }, 100);
        }
        window.awakPickHuntExercise = awakPickHuntExercise;

        /**
         * Inflige des dégâts au monstre pendant une chasse
         */
        function awakDealDamageToMonster(reps, weightKg) {
            const session = awakActiveHuntSession;
            if (!session) return;
            const monster = session.monster;

            const playerStats = awakGetTotalStats();

            // 🎯 Utiliser le système de bonus stats unifié (comme les Failles)
            const bonuses = (typeof awakComputeStatBonuses === 'function')
                ? awakComputeStatBonuses(playerStats, false) : null;

            // Même modèle que les Failles : ATTAQUE DE BASE pilotée par les stats du joueur + équipement.
            // Socle BAS : sans attributs ni équipement, dégâts dérisoires. Reps = simple bonus +1% (max +50%).
            const base = 4;
            const cappedReps = Math.min(Math.max(1, reps || 1), 50);
            const primaryStatValue = playerStats.STR || 0; // Chasse = force pure (pas de thème)
            // 🐛 La stat était comptée DEUX FOIS : ici en brut (sans plafond), puis via
            // damageMult qui, lui, applique le rendement décroissant. Une grosse stat
            // était donc récompensée deux fois, dont une sans limite → explosion des
            // dégâts au-delà du rang B. On applique le même rendement décroissant ici.
            const _SOFT_ATK = 80;
            const _effPrimary = primaryStatValue <= _SOFT_ATK
                ? primaryStatValue
                : _SOFT_ATK + Math.sqrt(primaryStatValue - _SOFT_ATK) * Math.sqrt(_SOFT_ATK);
            const baseAttack = base + _effPrimary * 1.5;
            const repBonus = 1 + cappedReps * 0.01;
            let damage = baseAttack * repBonus;

            // ⚔️ STR : multiplicateur dégâts
            if (bonuses) damage *= bonuses.damageMult;

            // ⚡ AGI : chance critique
            const critChance = bonuses ? (0.05 + bonuses.critChance) : 0.08;
            const isCrit = Math.random() < critChance;
            if (isCrit) damage *= 2;

            // 💨 VIT : double attaque
            let isDouble = false;
            if (bonuses && Math.random() < bonuses.doubleChance) {
                isDouble = true;
                damage += damage * 0.5;
            }

            let finalDamage = Math.max(1, Math.round(damage));
            // 🛡️ ANTI-TRICHE : seules les répétitions sont bornées (cappedReps ≤ 50). Stats, points,
            // compétences et équipement infligent leurs dégâts pleins — pas de plafond (comme en Faille).

            monster.hpCurrent = Math.max(0, monster.hpCurrent - finalDamage);
            session.totalDamage += finalDamage;

            // Procs visibles
            if (isDouble) {
                setTimeout(() => {
                    if (typeof showToast === 'function') showToast('⚡ DOUBLE ATTAQUE !', 'success', 1600);
                }, 700);
            }

            return { damage: finalDamage, isCrit, isDouble, killed: monster.hpCurrent <= 0 };
        }
        window.awakDealDamageToMonster = awakDealDamageToMonster;

        function awakCompleteHunt() {
            const session = awakActiveHuntSession;
            if (!session) return;
            const { monster, type } = session;

            // Marquer comme vaincu
            const monsters = awakMonstersLoad();
            const idx = monsters.findIndex(m => m.id === monster.id);
            if (idx >= 0) {
                monsters[idx].defeated = true;
                monsters[idx].defeatedAt = Date.now();
                awakMonstersSave(monsters);
            }

            // Récompenses : XP bonus + bonus Alpha + bonus SEN
            const rankXP = { E: 100, D: 200, C: 350, B: 500, A: 750, S: 1000, SS: 1400, SSS: 1900 }[monster.fromRiftRank] || 200;
            const alphaBonus = monster.isAlpha ? 2 : 1;
            let xpReward = rankXP * alphaBonus;
            // 🌀 SEN : bonus XP
            try {
                const b = (typeof awakComputeStatBonuses === 'function') ? awakComputeStatBonuses() : null;
                if (b) xpReward = Math.round(xpReward * b.xpMult);
            } catch(e) { _awkE(e); }

            document.getElementById('awakHuntCombatModal')?.remove();
            const modal = document.createElement('div');
            modal.id = 'awakHuntRewardModal';
            modal.className = 'modal active';
            modal.style.cssText = 'background:rgba(0,0,0,0.95);backdrop-filter:blur(12px);';

            modal.innerHTML = `
            <div class="modal-content" style="max-width:440px;background:linear-gradient(160deg,#0a0e18,#0F1014);border:1px solid ${type.color}50;padding:0;overflow-y:auto;overflow-x:hidden;border-radius:20px;max-height:90vh;-webkit-overflow-scrolling:touch;">
                <!-- Header victoire -->
                <div style="background:linear-gradient(135deg,${type.color}30,${type.color}10);padding:26px 22px;text-align:center;border-bottom:1px solid ${type.color}30;background-image:linear-gradient(135deg,${type.color}55,${type.color}18),url(images/faille_ouverte.webp?v=1622);background-size:cover;background-position:center;">
                    <div style="font-size:0.65em;color:${type.color};font-weight:900;letter-spacing:3px;margin-bottom:6px;">${monster.isAlpha ? '◇ ALPHA VAINCU ◇' : '◇ CHASSE RÉUSSIE ◇'}</div>
                    <!-- ⚠️ Emoji système remplacé par un losange (v1041) : dernier
                         emoji géant des écrans de chasse. -->
                    <div style="margin:0 auto 8px;width:30px;height:30px;border:1.5px solid ${type.color};transform:rotate(45deg);box-shadow:0 0 18px ${type.color}b0;"></div>
                    <h2 style="margin:0 0 4px 0;color:white;font-size:1.05em;font-weight:900;">${type.name}</h2>
                    <div style="font-size:0.75em;color:#94a3b8;">${Math.round((Date.now() - session.startTime) / 60000)} min · ${session.totalDamage} dégâts</div>
                </div>

                <!-- Récompenses -->
                <div style="padding:18px 22px;">
                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px;margin-bottom:14px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <span style="color:#cbd5e1;font-size:0.9em;font-weight:700;">XP de personnage</span>
                            <span style="color:${type.color};font-weight:900;">+${Math.round(xpReward * (window.AWAK_RIFT_XP_FACTOR || 0.35))}</span>
                        </div>
                        ${monster.isAlpha ? `
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span style="color:#fbbf24;font-size:0.9em;font-weight:700;">🌟 Bonus Alpha</span>
                            <span style="color:#fbbf24;font-weight:900;">×2</span>
                        </div>` : ''}
                    </div>

                    <!-- Message Système -->
                    <div style="padding:12px 14px;background:rgba(34,211,238,0.08);border-left:3px solid #22d3ee;border-radius:10px;">
                        <div style="font-size:0.6em;color:#22d3ee;font-weight:900;letter-spacing:2px;margin-bottom:4px;">SYSTÈME</div>
                        <div style="color:#cbd5e1;font-size:0.85em;font-style:italic;line-height:1.5;">${monster.isAlpha ? 'Il était devenu fort. Trop fort. Bien joué.' : 'Une menace de moins. Continue.'}</div>
                    </div>

                    <button onclick="document.getElementById('awakHuntRewardModal').remove();awakActiveHuntSession=null;switchTab('game');" style="width:100%;margin-top:14px;background:linear-gradient(135deg,${type.color},${type.color}dd);border:none;color:white;border-radius:10px;padding:14px;font-weight:900;font-size:0.95em;letter-spacing:1px;cursor:pointer;box-shadow:0 4px 16px ${type.color}40;">CONTINUER</button>
                </div>
            </div>`;

            document.body.appendChild(modal);

            // XP réel
            try {
                if (typeof rpgGainXP === 'function') {
                    awakGrantLifetimeXP(Math.round(xpReward * (window.AWAK_RIFT_XP_FACTOR || 0.35))); // v1218 (voir awakCompleteRift)
                }
            } catch(e) { _awkE(e); }

            if (typeof hapticTap === 'function') hapticTap([50, 30, 80]);

            // 🎭 Phase 4 : check déblocages compagnons après chasse
            try { setTimeout(() => awakCompanionsTriggerUnlockCheck(), 2500); } catch(e) { _awkE(e); }

            awakActiveHuntSession = null;
        }
        window.awakCompleteHunt = awakCompleteHunt;

        function awakAbandonHunt() {
            const session = awakActiveHuntSession;
            if (!session) return;
            showConfirm(
                'Le monstre restera en liberté. Tu pourras retenter la chasse plus tard.',
                () => {
                    awakActiveHuntSession = null;
                    document.getElementById('awakHuntCombatModal')?.remove();
                    // Même correctif que pour les Failles : terminer la séance sans
                    // la sauvegarder, sinon l'écran d'exercice reste actif.
                    try {
                        currentWorkout = null;
                        currentSupersetWorkout = null;
                        if (typeof clearActiveWorkoutState === 'function') clearActiveWorkoutState();
                        if (typeof stopTimer === 'function') stopTimer();
                        if (typeof stopSessionTimer === 'function') stopSessionTimer();
                        const _ev = document.getElementById('exerciseView');
                        if (_ev) _ev.classList.add('hidden');
                        const _ws = document.getElementById('workoutSelection');
                        if (_ws) _ws.style.display = '';
                        const _fq = document.getElementById('floatingQuitBtn');
                        if (_fq) _fq.style.display = 'none';
                        document.body.classList.remove('in-session', 'workout-fullscreen');
                        if (typeof resetWorkoutInterfaceElements === 'function') resetWorkoutInterfaceElements();
                    } catch (e) { _awkE(e); }
                    switchTab('game');
                },
                null,
                {
                    title: 'Abandonner la chasse ?',
                    subtitle: '◈ LE MONSTRE S\'ENFUIT ◈',
                    icon: '🏃',
                    confirmLabel: '✕ Fuir',
                    cancelLabel: '🎯 Continuer',
                    danger: true
                }
            );
        }
        window.awakAbandonHunt = awakAbandonHunt;

        // ═══════════════════════════════════════════════════════════════
        // 🎨 RENDER : Affichage des monstres échappés (onglet Jeu)
        // ═══════════════════════════════════════════════════════════════
        function renderEscapedMonstersCard() {
            const monsters = awakGetActiveMonsters();
            if (monsters.length === 0) return '';

            const alphaCount = monsters.filter(m => m.isAlpha).length;
            const handicaps = awakGetActiveHandicaps();

            return `
            <div class="card" style="background:linear-gradient(160deg,#0a0e18,#0F1014);border:1px solid rgba(239,68,68,0.3);padding:18px;margin-bottom:14px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <div style="font-size:0.6em;color:#f87171;font-weight:900;letter-spacing:2px;">MONSTRES ÉCHAPPÉS</div>
                    <div style="flex:1;height:1px;background:linear-gradient(90deg,rgba(239,68,68,0.3),transparent);"></div>
                    <div style="font-size:0.7em;color:#94a3b8;font-weight:700;">${monsters.length}${alphaCount > 0 ? ` (${alphaCount}α)` : ''}</div>
                </div>

                <!-- Handicaps actifs résumés -->
                ${handicaps.totalMonsters > 0 ? `
                <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:10px 12px;margin-bottom:12px;">
                    <div style="font-size:0.6em;color:#fca5a5;font-weight:800;letter-spacing:1px;margin-bottom:5px;">◈ HANDICAPS ACTIFS</div>
                    <div style="font-size:0.75em;color:#cbd5e1;line-height:1.6;">
                        ${handicaps.sabotage > 0 ? `<div>${handicaps.sabotage}% de séries sans XP</div>` : ''}
                        ${handicaps.hurlement > 0 ? `<div>Ripostes +${handicaps.hurlement}% en Faille</div>` : ''}
                        ${handicaps.armure > 0 ? `<div>Monstres +${handicaps.armure}% PV en Faille</div>` : ''}
                        ${handicaps.reduce_xp > 0 ? `<div>📉 XP réduit de ${handicaps.reduce_xp}%</div>` : ''}
                        ${handicaps.reduce_stats > 0 ? `<div>⚔️ -${handicaps.reduce_stats}% dégâts en Faille</div>` : ''}
                        ${handicaps.block_drops ? `<div>🚫 Aucun loot pendant les séances</div>` : ''}
                    </div>
                </div>` : ''}

                <div style="display:flex;flex-direction:column;gap:8px;">
                ${monsters.map(m => {
                    const type = ESCAPED_MONSTER_TYPES.find(t => t.id === m.typeId);
                    if (!type) return '';
                    const days = Math.floor((Date.now() - m.spawnedAt) / (24 * 60 * 60 * 1000));
                    const dayLabel = days === 0 ? 'aujourd\'hui' : `il y a ${days}j`;
                    return `
                    <div onclick="awakOpenMonsterDetail('${m.id}')" style="cursor:pointer;background:rgba(255,255,255,0.02);border:1px solid ${m.isAlpha ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)'};border-radius:10px;padding:11px 12px;transition:transform 0.15s ease;">
                        <div style="display:flex;align-items:center;gap:11px;">
                            ${window.awakEchappeImg(type, 52, m.isAlpha)}
                            <div style="flex:1;min-width:0;">
                                <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;flex-wrap:wrap;">
                                    ${m.isAlpha ? '<span style="background:#ef4444;color:white;padding:1px 5px;border-radius:6px;font-size:0.55em;font-weight:900;letter-spacing:1px;">ALPHA</span>' : ''}
                                    <span style="font-weight:800;color:white;font-size:0.9em;">${type.name}</span>
                                </div>
                                <div style="font-size:0.68em;color:#94a3b8;font-weight:600;">⏱ ${dayLabel} · 🩸 ${m.hpMax} HP</div>
                            </div>
                            <div style="color:${type.color};font-size:1.2em;flex-shrink:0;">›</div>
                        </div>
                    </div>`;
                }).join('')}
                </div>
            </div>`;
        }
        window.renderEscapedMonstersCard = renderEscapedMonstersCard;

        /**
         * Modal de détail d'un monstre avec bouton CHASSER
         */
        function awakOpenMonsterDetail(monsterId) {
            const monster = awakGetMonsterById(monsterId);
            if (!monster || monster.defeated) return;
            const type = ESCAPED_MONSTER_TYPES.find(t => t.id === monster.typeId);
            if (!type) return;

            const active = awakGetActiveMonsters();
            const huntDuration = active.length > 2 ? Math.max(10, type.huntDuration - 5) : type.huntDuration;
            const days = Math.floor((Date.now() - monster.spawnedAt) / (24 * 60 * 60 * 1000));

            document.getElementById('awakMonsterDetailModal')?.remove();
            const modal = document.createElement('div');
            modal.id = 'awakMonsterDetailModal';
            modal.className = 'modal active';
            modal.style.cssText = 'background:rgba(0,0,0,0.92);backdrop-filter:blur(12px);';

            modal.innerHTML = `
            <div class="modal-content" style="max-width:480px;background:linear-gradient(160deg,#0a0e18,#0F1014);border:1px solid ${type.color}50;padding:0;overflow-y:auto;overflow-x:hidden;border-radius:20px;max-height:90vh;-webkit-overflow-scrolling:touch;">
                <!-- Header thématique -->
                <div style="background:linear-gradient(135deg,${type.color}25,${type.color}05);padding:24px 22px;border-bottom:1px solid ${type.color}30;text-align:center;background-image:linear-gradient(135deg,${type.color}55,${type.color}18),url(images/faille_ouverte.webp?v=1622);background-size:cover;background-position:center;">
                    <!-- ⚠️ Emoji système remplacé par un losange (v1029) : un visage
                         fâché dans un écran de chasse casse le ton, et son
                         rendu change d'un téléphone à l'autre. -->
                    <div style="margin:0 auto 10px;width:130px;height:130px;display:flex;align-items:center;justify-content:center;animation:awakBriefFloat 4s ease-in-out infinite;">${window.awakEchappeImg(type, 130, monster.isAlpha)}</div>
                    ${monster.isAlpha ? '<div style="display:inline-block;background:#ef4444;color:white;padding:3px 10px;border-radius:6px;font-size:0.65em;font-weight:900;letter-spacing:2px;margin-bottom:8px;">ALPHA</div>' : ''}
                    <h2 style="margin:0;color:white;font-size:1.3em;font-weight:900;">${type.name}</h2>
                    <div style="margin-top:8px;color:#94a3b8;font-size:0.82em;font-style:italic;">${type.description}</div>
                </div>

                <!-- Infos -->
                <div style="padding:18px 22px;">
                    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px;">
                        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:11px;">
                            <div style="font-size:0.6em;color:#94a3b8;font-weight:800;letter-spacing:1.5px;margin-bottom:4px;">🩸 HP</div>
                            <div style="font-size:1.1em;font-weight:900;color:white;">${monster.hpMax}</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:11px;">
                            <div style="font-size:0.6em;color:#94a3b8;font-weight:800;letter-spacing:1.5px;margin-bottom:4px;">⏱ DURÉE</div>
                            <div style="font-size:1.1em;font-weight:900;color:white;">${huntDuration} min${active.length > 2 ? ' ↓' : ''}</div>
                        </div>
                    </div>

                    <!-- Handicap actif -->
                    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:11px;margin-bottom:14px;">
                        <div style="font-size:0.6em;color:#fca5a5;font-weight:800;letter-spacing:1px;margin-bottom:5px;">◈ HANDICAP IMPOSÉ</div>
                        <div style="font-size:0.85em;color:#cbd5e1;font-weight:600;">${type.handicap.label}${monster.isAlpha ? ' <span style="color:#fca5a5;font-weight:900;">(doublé en Alpha)</span>' : ''}</div>
                    </div>

                    <!-- Lore court -->
                    <div style="background:rgba(34,211,238,0.06);border-left:3px solid #22d3ee;border-radius:10px;padding:10px 12px;margin-bottom:14px;">
                        <div style="font-size:0.6em;color:#22d3ee;font-weight:900;letter-spacing:2px;margin-bottom:3px;">SYSTÈME</div>
                        <div style="color:#cbd5e1;font-size:0.78em;font-style:italic;line-height:1.5;">
                            ${monster.isAlpha
                                ? 'Il s\'est stabilisé. Plus difficile maintenant. Mais le récompenser sera plus généreux.'
                                : `Échappé ${days === 0 ? 'aujourd\'hui' : `il y a ${days} jour${days > 1 ? 's' : ''}`}. ${days >= 3 ? 'Il devient dangereux.' : 'Élimine-le rapidement.'}`}
                        </div>
                    </div>

                    <!-- Actions -->
                    <div style="display:flex;gap:8px;">
                        <button onclick="document.getElementById('awakMonsterDetailModal').remove()" style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;border-radius:10px;padding:14px;font-weight:800;font-size:0.85em;cursor:pointer;">↩ Plus tard</button>
                        <button onclick="awakStartHunt('${monster.id}')" style="flex:2;background:linear-gradient(135deg,${type.color},${type.color}dd);border:none;color:white;border-radius:10px;padding:14px;font-weight:900;font-size:0.9em;letter-spacing:1px;cursor:pointer;box-shadow:0 4px 16px ${type.color}40;">CHASSER</button>
                    </div>
                </div>
            </div>`;

            document.body.appendChild(modal);
            dismissOnBackdrop(modal);
        }
        window.awakOpenMonsterDetail = awakOpenMonsterDetail;

        // ═══════════════════════════════════════════════════════════════
        // 🎭 PHASE 4 — COMPAGNONS HUMAINS (8 Ancrages alliés)
        // ═══════════════════════════════════════════════════════════════
        //
        // Boucle :
        // - 0 compagnon au départ
        // - Débloqués via milestones (séances, niveaux, monstres vaincus...)
        // - Max 3 actifs simultanément (slots)
        // - Bonus stats passifs + dialogues contextuels
        // - Avatar visible dans l'UI des Failles/Chasses
        //

        const COMPANIONS_STORAGE_KEY = 'awakCompanions';
        const COMPANIONS_ACTIVE_KEY = 'awakCompanionsActive';
        const COMPANIONS_MAX_ACTIVE = 3;

        // ── 8 COMPAGNONS HUMAINS ───────────────────────────────────────
        const COMPANIONS = [
            {
                id: 'marcus',
                statSecondaire: 'VIT',   // affinité ½ en mission (voir awakCompanionAffinityCount)
                image: 'images/companions/marcus.webp',
                name: 'Marcus Ironfist',
                title: 'Le Brutal',
                emoji: '💪',
                color: '#ef4444',
                description: 'Ancien champion poids lourds. Sa Loi : amplification de force brute.',
                lore: 'Il a survécu à 3 Failles rang A en solo. Son corps porte les marques de chaque combat.',
                bonus: { stat: 'STR', mult: 0.18, label: '+18% STR · +10% dégâts boss' },
                bonusDetails: { dmgBoss: 0.10 },
                unlockCondition: { type: 'companionRift', riftId: 'rift_marcus', label: 'Complète la Faille de Marcus' },
                dialogues: {
                    onFightStart: ['On va leur défoncer le crâne.', 'Tu sens cette adrénaline ?', 'Ne retiens rien.'],
                    onCrit: ['ÇA c\'est de la force !', 'Encore !', 'Voilà !'],
                    onBossPhase: ['Le boss s\'agite. Tant mieux.', 'Continue à frapper.'],
                    onVictory: ['Bien joué.', 'C\'était propre.', 'On remet ça quand tu veux.']
                }
            },
            {
                id: 'kira',
                statSecondaire: 'END',   // affinité ½ en mission (voir awakCompanionAffinityCount)
                image: 'images/companions/kira.webp',
                name: 'Kira Shadowstep',
                title: 'L\'Ombre',
                emoji: '🗡️',
                color: '#a855f7',
                description: 'Ses mouvements sont devenus impossibles à anticiper. Loi du déplacement absolu.',
                lore: 'Elle disait être assassin avant l\'arrivée du Système. Personne ne l\'a jamais vue rater.',
                bonus: { stat: 'AGI', mult: 0.20, label: '+20% AGI · +5% chance critique' },
                bonusDetails: { critChance: 0.05 },
                unlockCondition: { type: 'companionRift', riftId: 'rift_kira', label: 'Complète la Faille de Kira' },
                dialogues: {
                    onFightStart: ['Reste discret.', 'L\'opportunité viendra.', 'Vise les points faibles.'],
                    onCrit: ['Parfait.', 'C\'est exactement ça.', '...précis.'],
                    onBossPhase: ['Le moment est venu.', 'Maintenant.'],
                    onVictory: ['Élégant.', 'Tu apprends vite.', '...continue.']
                }
            },
            {
                id: 'chen',
                statSecondaire: 'END',   // affinité ½ en mission (voir awakCompanionAffinityCount)
                image: 'images/companions/chen.webp',
                name: 'Maître Chen',
                title: 'Le Sage',
                emoji: '🧘',
                color: '#06b6d4',
                description: 'Maître d\'arts martiaux ancien. Il voit ce que les autres ne voient pas.',
                lore: 'Il étudie les Failles depuis le début. Il pense que le Système n\'est pas notre ami.',
                bonus: { stat: 'PER', mult: 0.15, label: '+15% PER · +10% de temps pour finir les Failles' },
                bonusDetails: { riftDurationCut: 0.10 },
                unlockCondition: { type: 'companionRift', riftId: 'rift_chen', label: 'Complète la Faille de Chen' },
                dialogues: {
                    onFightStart: ['Respire. Observe.', 'Le combat est dans ta tête.', 'Calme-toi.'],
                    onCrit: ['Bien vu.', 'Tu apprends.', 'Voilà la voie.'],
                    onBossPhase: ['Adapte-toi. Le boss aussi le fait.', 'Sa stratégie change. La tienne aussi.'],
                    onVictory: ['Sagesse acquise.', 'Tu progresses.', 'Bien.']
                }
            },
            {
                id: 'elise',
                statSecondaire: 'VIT',   // affinité ½ en mission (voir awakCompanionAffinityCount)
                image: 'images/companions/elise.webp',
                name: 'Élise Vorn',
                title: 'La Médic',
                emoji: '💚',
                color: '#34d399',
                description: 'Médecin pendant la première vague de Failles. Loi de régénération partielle.',
                lore: 'Elle a sauvé plus d\'Ancrages que le Système n\'en a créé. Le Noyau la déteste.',
                bonus: { stat: 'SEN', mult: 0.20, label: '+20% SEN · +30% de PV récupérés en Faille' },
                bonusDetails: { recovery: 0.30 },
                unlockCondition: { type: 'companionRift', riftId: 'rift_elise', label: 'Complète la Faille d\'Élise' },
                dialogues: {
                    onFightStart: ['Sois prudent.', 'Je veille sur toi.', 'On rentre tous les deux.'],
                    onCrit: ['Excellent.', 'Bien placé.', 'Continue comme ça.'],
                    onBossPhase: ['Reste concentré. Je gère le reste.', 'Ne paniques pas.'],
                    onVictory: ['Tu es entier. C\'est l\'essentiel.', 'Bien joué. Repose-toi.', 'Bravo.']
                }
            },
            {
                id: 'yuna',
                statSecondaire: 'PER',   // affinité ½ en mission (voir awakCompanionAffinityCount)
                image: 'images/companions/yuna.webp',
                name: 'Yuna Veilbreaker',
                title: 'La Mystique',
                emoji: '🌀',
                color: '#c084fc',
                description: 'Elle entend le Noyau. Le Système la traite avec méfiance — c\'est mauvais signe.',
                lore: 'Elle voit ce qui n\'existe pas encore. Elle a déjà sauvé l\'humanité au moins une fois — mais on a oublié.',
                bonus: { stat: 'SEN', mult: 0.10, label: '+10% SEN · loots rares · double drop' },
                bonusDetails: { rareLootBoost: 0.5, doubleDropChance: 0.1 },
                unlockCondition: { type: 'companionRift', riftId: 'rift_yuna', label: 'Complète la Faille de Yuna' },
                dialogues: {
                    onFightStart: ['Il y a quelque chose ici.', 'Tu n\'es pas seul.', 'Quelque chose t\'observe.'],
                    onCrit: ['Le Noyau aime ça.', 'Étrange...', 'Continue.'],
                    onBossPhase: ['Il se réveille vraiment maintenant.', 'Sois prudent.'],
                    onVictory: ['Quelque chose s\'est passé. Je l\'ai senti.', 'Ce n\'était pas qu\'une victoire.', '...intéressant.']
                }
            }
        ];
        // 🎯 STAT SECONDAIRE : vaut la MOITIÉ du bonus principal (en combat) et
        // 0,5 point d'affinité en mission. Ajoutée au libellé pour être visible
        // partout où le bonus du compagnon est affiché.
        COMPANIONS.forEach(function (c) {
            if (!c || !c.statSecondaire || !c.bonus || !c.bonus.mult) return;
            c.bonus.multSecondaire = c.bonus.mult / 2;
            var pct = Math.round(c.bonus.multSecondaire * 100);
            if (c.bonus.label && c.bonus.label.indexOf(c.statSecondaire) === -1) {
                c.bonus.label += ' · +' + pct + '% ' + c.statSecondaire;
            }
        });

        function awakCompanionsLoad() {
            try {
                const profileId = typeof getCurrentProfileId === 'function' ? getCurrentProfileId() : null;
                const key = profileId ? `${COMPANIONS_STORAGE_KEY}_${profileId}` : COMPANIONS_STORAGE_KEY;
                const stored = JSON.parse(localStorage.getItem(key) || 'null');
                if (stored) return stored;
                // Default : aucun compagnon débloqué
                return { unlocked: [], stats: { workouts: 0, rifts: 0, monsters: 0 } };
            } catch(e) { return { unlocked: [], stats: { workouts: 0, rifts: 0, monsters: 0 } }; }
        }

        function awakCompanionsSave(data) {
            try {
                const profileId = typeof getCurrentProfileId === 'function' ? getCurrentProfileId() : null;
                const key = profileId ? `${COMPANIONS_STORAGE_KEY}_${profileId}` : COMPANIONS_STORAGE_KEY;
                localStorage.setItem(key, JSON.stringify(data));
            } catch(e) { _awkE(e); }
        }

        function awakCompanionsGetActive() {
            try {
                const profileId = typeof getCurrentProfileId === 'function' ? getCurrentProfileId() : null;
                const key = profileId ? `${COMPANIONS_ACTIVE_KEY}_${profileId}` : COMPANIONS_ACTIVE_KEY;
                const raw = JSON.parse(localStorage.getItem(key) || '[]');
                // Filtrer les compagnons retirés du jeu (anciennes sauvegardes : jules/halberd/storm)
                const valid = raw.filter(id => COMPANIONS.some(c => c.id === id));
                // Si nettoyage nécessaire, réécrire la liste assainie
                if (valid.length !== raw.length) {
                    try { localStorage.setItem(key, JSON.stringify(valid)); } catch(e) { _awkE(e); }
                }
                return valid;
            } catch(e) { return []; }
        }

        function awakCompanionsSetActive(ids) {
            try {
                const profileId = typeof getCurrentProfileId === 'function' ? getCurrentProfileId() : null;
                const key = profileId ? `${COMPANIONS_ACTIVE_KEY}_${profileId}` : COMPANIONS_ACTIVE_KEY;
                // Limiter à MAX
                const limited = (ids || []).slice(0, COMPANIONS_MAX_ACTIVE);
                localStorage.setItem(key, JSON.stringify(limited));
            } catch(e) { _awkE(e); }
        }
        window.awakCompanionsGetActive = awakCompanionsGetActive;

        function awakGetCompanionById(id) {
            return COMPANIONS.find(c => c.id === id);
        }
        window.awakGetCompanionById = awakGetCompanionById;

        /**
         * Vérifie si les conditions de déblocage sont remplies et débloque
         * les compagnons éligibles. Retourne ceux nouvellement débloqués.
         */
        function awakCompanionsCheckUnlocks() {
            const data = awakCompanionsLoad();
            const newlyUnlocked = [];

            // Calculer les stats actuelles
            const profileId = typeof getCurrentProfileId === 'function' ? getCurrentProfileId() : null;
            const histKey = profileId ? `profile_${profileId}_workoutHistory` : 'workoutHistory';
            const history = JSON.parse(localStorage.getItem(histKey) || '[]');
            const totalWorkouts = history.length;

            const rifts = awakRiftsLoad();
            const completedRifts = (typeof awakGetRiftsCompletedTotal === 'function')
                ? awakGetRiftsCompletedTotal()
                : rifts.filter(r => r.completed).length;

            const monsters = awakMonstersLoad();
            const defeatedMonsters = monsters.filter(m => m.defeated).length;

            const currentRank = awakGetRank();
            const rankIds = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
            const currentRankIdx = rankIds.indexOf(currentRank.id);

            for (const comp of COMPANIONS) {
                if (data.unlocked.includes(comp.id)) continue;

                let unlocked = false;
                const cond = comp.unlockCondition;
                switch(cond.type) {
                    case 'workouts': unlocked = totalWorkouts >= cond.value; break;
                    case 'rifts_completed': unlocked = completedRifts >= cond.value; break;
                    case 'monsters_hunted': unlocked = defeatedMonsters >= cond.value; break;
                    case 'companionRift': {
                        // Débloqué quand la Faille de compagnon dédiée est complétée
                        unlocked = rifts.some(r => r.isCompanionRift && r.companionRiftId === cond.riftId && r.completed);
                        break;
                    }
                    case 'rank': {
                        const requiredIdx = rankIds.indexOf(cond.value);
                        unlocked = currentRankIdx >= requiredIdx;
                        break;
                    }
                }

                if (unlocked) {
                    data.unlocked.push(comp.id);
                    newlyUnlocked.push(comp);
                }
            }

            // Mettre à jour les stats
            data.stats = { workouts: totalWorkouts, rifts: completedRifts, monsters: defeatedMonsters };
            awakCompanionsSave(data);

            return newlyUnlocked;
        }
        window.awakCompanionsCheckUnlocks = awakCompanionsCheckUnlocks;

        /**
         * Calcule le bonus total des compagnons actifs (utilisé par awakGetTotalStats indirectement)
         */
        // 🚫 Une Faille est-elle "solo" (compagnons interdits) ?
        // Épreuves personnelles : narratives de l'histoire, Failles de compagnon,
        // sous-boss (Quatre Épreuves), boss final, boss mondial/hebdomadaire.
        function awakIsSoloRift(r) {
            if (!r) return false;
            return !!(r.isSubBoss || r.isAbyss || r.isCompanionRift || r.isWeeklyBoss ||
                      r._isFinalBoss || r.isFinalBoss || r.narrativeId);
        }
        window.awakIsSoloRift = awakIsSoloRift;

        // Objet de bonus compagnons "vide" (même forme que awakCompanionsGetActiveBonuses)
        function awakEmptyCompanionBonuses() {
            return {
                STR: 0, AGI: 0, VIT: 0, END: 0, PER: 0, SEN: 0,
                critChance: 0, dmgBoss: 0, bossHpCut: 0, riftDurationCut: 0,
                cardioBoost: 0, recovery: 0, rareLootBoost: 0, doubleDropChance: 0,
                revealWeakness: false, extraWaveTime: false
            };
        }

        function awakCompanionsGetActiveBonuses() {
            // 🚫 Failles SOLO : compagnons interdits sur les épreuves personnelles du joueur
            // (narratives, compagnon, sous-boss, boss final, boss mondial/hebdo).
            // Ces combats doivent être surmontés par le joueur seul.
            try {
                const sess = (typeof awakActiveRiftSession !== 'undefined') ? awakActiveRiftSession : null;
                const r = sess && sess.rift;
                if (r && awakIsSoloRift(r)) {
                    return awakEmptyCompanionBonuses();
                }
            } catch(e) { _awkE(e); }
            // 🚶 Exclure les compagnons PARTIS en mission : indisponibles tant qu'ils ne sont pas rentrés.
            const onMission = (typeof awakGetCompanionsOnMission === 'function') ? awakGetCompanionsOnMission() : [];
            const active = awakCompanionsGetActive().filter(id => !onMission.includes(id));
            const bonuses = {
                STR: 0, AGI: 0, VIT: 0, END: 0, PER: 0, SEN: 0,
                critChance: 0, dmgBoss: 0, bossHpCut: 0, riftDurationCut: 0,
                cardioBoost: 0, recovery: 0, rareLootBoost: 0, doubleDropChance: 0,
                revealWeakness: false, extraWaveTime: false
            };

            const playerStats = (() => {
                // On évite la récursion : on prend les stats sans les bonus compagnons
                const base = { STR:10, AGI:10, VIT:10, END:10, PER:5, SEN:5 };
                const auto = awakAutoStatsLoad();
                const manual = statPointsGetAllocated();
                const equip = typeof getPlayerEquipStats === 'function' ? getPlayerEquipStats() : {};
                const total = {};
                for (const s of ['STR','AGI','VIT','END','PER','SEN']) {
                    total[s] = (base[s] || 0) + (auto[s] || 0) + (equip[s] || 0); // points alloués déjà dans equip (v1218)
                }
                return total;
            })();

            for (const compId of active) {
                const comp = awakGetCompanionById(compId);
                if (!comp) continue;
                // Bonus stat principal (% de la stat actuelle)
                const stat = comp.bonus.stat;
                if (stat && comp.bonus.mult) {
                    bonuses[stat] = (bonuses[stat] || 0) + Math.round((playerStats[stat] || 0) * comp.bonus.mult);
                }
                // Stat secondaire : moitié du bonus principal
                const sec = comp.statSecondaire;
                if (sec && comp.bonus.multSecondaire) {
                    bonuses[sec] = (bonuses[sec] || 0) + Math.round((playerStats[sec] || 0) * comp.bonus.multSecondaire);
                }
                // Détails additionnels
                const d = comp.bonusDetails || {};
                if (d.critChance) bonuses.critChance += d.critChance;
                if (d.dmgBoss) bonuses.dmgBoss += d.dmgBoss;
                if (d.bossHpCut) bonuses.bossHpCut += d.bossHpCut;
                if (d.riftDurationCut) bonuses.riftDurationCut += d.riftDurationCut;
                if (d.cardioBoost) bonuses.cardioBoost += d.cardioBoost;
                if (d.recovery) bonuses.recovery += d.recovery;
                if (d.rareLootBoost) bonuses.rareLootBoost += d.rareLootBoost;
                if (d.doubleDropChance) bonuses.doubleDropChance += d.doubleDropChance;
                if (d.revealWeakness) bonuses.revealWeakness = true;
                if (d.extraWaveTime) bonuses.extraWaveTime = true;
            }
            return bonuses;
        }
        window.awakCompanionsGetActiveBonuses = awakCompanionsGetActiveBonuses;

        /**
         * Toggle un compagnon dans la liste des actifs
         */
        function awakCompanionToggleActive(compId) {
            const data = awakCompanionsLoad();
            if (!data.unlocked.includes(compId)) return false;

            const active = awakCompanionsGetActive();
            const idx = active.indexOf(compId);
            if (idx >= 0) {
                active.splice(idx, 1);
            } else {
                // 🚶 Interdit d'activer un compagnon parti en mission (indisponible jusqu'au retour)
                const onMission = (typeof awakGetCompanionsOnMission === 'function') ? awakGetCompanionsOnMission() : [];
                if (onMission.includes(compId)) {
                    if (typeof showToast === 'function') showToast('Ce compagnon est parti fermer une Faille — indisponible jusqu\'à son retour', 'warning', 3200);
                    return false;
                }
                if (active.length >= COMPANIONS_MAX_ACTIVE) {
                    if (typeof showToast === 'function') showToast(`Max ${COMPANIONS_MAX_ACTIVE} compagnons actifs`, 'warning', 2500);
                    return false;
                }
                active.push(compId);
            }
            awakCompanionsSetActive(active);
            // v680 : un compagnon actif modifie les stats affichées
            // (awakCompanionsGetActiveBonuses entre dans awakGetTotalStats). On
            // émet rpg:statsChanged : les abonnés redessinent la Power Card ET
            // mettent à jour la Carte de Chasseur (qui restait figée jusqu'ici).
            // Filet de sécurité conservé si le bus n'était pas chargé.
            if (typeof window.awakEmit === 'function') {
                window.awakEmit('rpg:statsChanged', { source: 'companionToggle', compId: compId });
            } else if (typeof renderAdventureTab === 'function') {
                renderAdventureTab();
            }
            return true;
        }
        window.awakCompanionToggleActive = awakCompanionToggleActive;

        /**
         * Cinématique de déblocage (apparition d'un nouveau compagnon)
         */
        function awakShowCompanionUnlocked(companion) {
            // Anti-doublon : ne pas montrer 2× la pop-up du même compagnon,
            // ni par-dessus la scène de rencontre en cours.
            try {
                if (document.getElementById('awakCompanionMeetingOverlay')) return;
                const shownKey = 'awakCompanionPopupShown';
                const shown = JSON.parse(localStorage.getItem(shownKey) || '[]');
                if (shown.includes(companion.id)) return;
                shown.push(companion.id);
                localStorage.setItem(shownKey, JSON.stringify(shown));
            } catch(e) { _awkE(e); }
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;z-index:99998;display:flex;align-items:flex-start;justify-content:center;background:rgba(0,0,0,0.92);backdrop-filter:blur(10px);animation:awakFadeIn 0.4s;padding:20px;overflow-y:auto;-webkit-overflow-scrolling:touch;';

            overlay.innerHTML = `
                <div style="max-width:420px;width:100%;margin:auto 0;background:linear-gradient(160deg,#0a0e18,#0F1014,${companion.color}15);border:1.5px solid ${companion.color}50;border-radius:20px;padding:32px 26px;text-align:center;box-shadow:0 24px 60px ${companion.color}20,0 0 80px ${companion.color}15;animation:slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1);">
                    <div style="font-size:0.6em;color:${companion.color};font-weight:900;letter-spacing:3px;margin-bottom:14px;">◇ NOUVEL ANCRAGE RENCONTRÉ ◇</div>
                    ${companion.image
                        ? `<img src="${companion.image}" alt="${companion.name}" style="width:100%;max-width:280px;border-radius:14px;margin-bottom:12px;box-shadow:0 0 28px ${companion.color}66;" onerror="this.outerHTML='<div style=\\'font-size:4em;line-height:1;margin-bottom:12px;\\'>${companion.emoji}</div>';" />`
                        : `<div style="font-size:4em;line-height:1;margin-bottom:12px;filter:drop-shadow(0 0 20px ${companion.color}b0);animation:awakBlink 2s infinite;">${companion.emoji}</div>`}
                    <h2 style="margin:0;color:white;font-size:1.4em;font-weight:900;letter-spacing:0.5px;">${companion.name}</h2>
                    <div style="font-size:0.85em;color:${companion.color};font-weight:800;margin-top:3px;letter-spacing:1px;">${companion.title}</div>
                    <div style="margin-top:14px;color:#cbd5e1;font-size:0.85em;line-height:1.55;font-style:italic;">${companion.description}</div>

                    <div style="margin-top:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:11px 13px;">
                        <div style="font-size:0.6em;color:#94a3b8;font-weight:800;letter-spacing:1.5px;margin-bottom:4px;">◈ BONUS</div>
                        <div style="color:${companion.color};font-weight:800;font-size:0.85em;">${companion.bonus.label}</div>
                    </div>

                    <div style="margin-top:14px;padding:11px 12px;background:rgba(34,211,238,0.08);border-left:3px solid #22d3ee;border-radius:10px;">
                        <div style="font-size:0.6em;color:#22d3ee;font-weight:900;letter-spacing:2px;margin-bottom:3px;">SYSTÈME</div>
                        <div style="color:#cbd5e1;font-size:0.78em;font-style:italic;line-height:1.5;text-align:left;">${companion.lore}</div>
                    </div>

                    <button onclick="this.closest('[style*=fixed]').remove()" style="margin-top:18px;width:100%;background:linear-gradient(135deg,${companion.color},${companion.color}dd);border:none;color:white;border-radius:14px;padding:14px;font-weight:900;font-size:0.95em;letter-spacing:1px;cursor:pointer;box-shadow:0 4px 16px ${companion.color}40;">CONTINUER</button>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
            if (typeof hapticTap === 'function') hapticTap([50, 50, 100, 50, 150]);
        }
        window.awakShowCompanionUnlocked = awakShowCompanionUnlocked;

        /**
         * Vérifie les déblocages et affiche les cinématiques le cas échéant
         * À appeler après chaque événement (fin séance, fin faille, etc.)
         */
        function awakCompanionsTriggerUnlockCheck() {
            const newlyUnlocked = awakCompanionsCheckUnlocks();
            if (newlyUnlocked.length === 0) return;

            // Afficher la cinématique pour chaque compagnon (séquencé)
            newlyUnlocked.forEach((comp, i) => {
                setTimeout(() => awakShowCompanionUnlocked(comp), i * 3500 + 2000);
            });
        }
        window.awakCompanionsTriggerUnlockCheck = awakCompanionsTriggerUnlockCheck;

        // ═══════════════════════════════════════════════════════════════
        // ⚔️🤝 FAILLES DE COMPAGNON (uniques, déclenchées par XP, une à la fois)
        // Compléter la Faille débloque le compagnon associé (+ pop-up).
        // ═══════════════════════════════════════════════════════════════
        const COMPANION_RIFTS_SEEN_KEY = 'awakCompanionRiftsSeen';

        // Mini-scènes de RENCONTRE jouées à la fin de la Faille de compagnon (avant la pop-up)
        // Ton cohérent avec « Le Monde qui s'efface » : sobre, un peu mélancolique, jamais bavard.
        const COMPANION_MEETINGS = {
            marcus: {
                color: '#ef4444', emoji: '💪', image: 'images/story/rencontre_marcus.webp',
                pages: [
                    "Le dernier monstre se dissout. Une silhouette massive était restée en retrait. « Costaud », souffle Nyra en s'étirant. « Presque autant que moi. » Esen, lui, ne dit rien — il jauge l'inconnu du regard.",
                    "L'homme s'avance et fait craquer ses poings. « Pas mal. La plupart abandonnent avant la troisième vague. J'ai arrêté de compter ceux qui ont lâché. »",
                    "« Marcus. Si tu continues à frapper aussi fort, je te suis. » Nyra lève un pouce. Esen hoche lentement la tête : il l'accepte."
                ]
            },
            kira: {
                color: '#a855f7', emoji: '🗡️', image: 'images/story/rencontre_kira.webp',
                pages: [
                    "Tu n'as jamais vraiment vu ton adversaire. « Tu as senti ça aussi ? » murmure Esen à Nyra, rare dans ses mots. Nyra scrute les ombres. « Quelqu'un nous observe depuis le début. »",
                    "Une silhouette se révèle, assise sur une arête de la Faille. « Tu m'as forcée à me montrer. C'est rare. »",
                    "« Kira. Je marche avec ceux qui ne ratent pas. » Nyra sourit, intriguée. « Oh, je l'aime bien, elle. » Esen reste silencieux, mais ne la quitte pas des yeux."
                ]
            },
            elise: {
                color: '#34d399', emoji: '💚', image: 'images/story/rencontre_elise.webp',
                pages: [
                    "Au milieu des ruines du refuge, une femme range des bandages. « Personne n'est blessé », constate Esen, presque surpris. Nyra pose une main sur l'épaule d'Esen. « Tu vois ? On forme une bonne équipe. »",
                    "La femme relève les yeux. « Tu es entier. Tu sais combien arrivent ici en morceaux ? Trop. »",
                    "« Élise. Quelqu'un doit veiller à ce que vous rentriez entiers. » Nyra rit doucement. « Enfin quelqu'un de raisonnable dans ce groupe. » Esen esquisse l'ombre d'un sourire."
                ]
            },
            yuna: {
                color: '#c084fc', emoji: '🌀', image: 'images/story/rencontre_yuna.webp',
                pages: [
                    "Les échos se taisent. Nyra frissonne, pour une fois sans blague. « Cet endroit me donne la chair de poule. » Esen reste immobile : « ...Quelque chose nous attendait. »",
                    "Une jeune femme te fixe, comme si elle te reconnaissait d'un futur que tu n'as pas vécu. « Je vous avais déjà vus. Le Noyau me l'a montré. Toi... et toi. »",
                    "« Yuna. Je reste près de vous. Ce qui vient, je préfère le voir arriver à plusieurs. » Esen et Nyra échangent un regard — elle en sait plus qu'elle ne dit."
                ]
            },
            chen: {
                color: '#06b6d4', emoji: '🧘', image: 'images/story/rencontre_chen.webp',
                pages: [
                    "Au sommet, le silence est total. « Même moi je me tais ici », chuchote Nyra, impressionnée. Esen s'incline légèrement devant le vieil homme assis en méditation.",
                    "Le maître ouvre les yeux. « Beaucoup montent vite, et redescendent plus vite encore. Vous, vous êtes revenus. Encore. Et encore. »",
                    "« Maître Chen. La constance est la seule force que le Monde ne peut pas effacer. Vous l'avez, tous les deux. Je vous accompagne. » Nyra, exceptionnellement, ne trouve rien à répondre."
                ]
            }
        };

        // Joue la mini-scène de rencontre puis appelle un callback (la pop-up de déblocage)
        function awakShowCompanionMeeting(companionId, onDone) {
            const meet = COMPANION_MEETINGS[companionId];
            const comp = (typeof awakGetCompanionById === 'function') ? awakGetCompanionById(companionId) : null;
            if (!meet || !comp) { if (onDone) onDone(); return; }
            if (typeof window.AwakCine !== 'undefined' && window.AwakCine.defer(function () { awakShowCompanionMeeting(companionId, onDone); })) return;

            let page = 0;
            const overlay = document.createElement('div');
            overlay.id = 'awakCompanionMeetingOverlay';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:99996;display:flex;align-items:flex-start;justify-content:center;background:rgba(0,0,0,0.93);backdrop-filter:blur(10px);animation:awakFadeIn 0.4s;padding:20px;overflow-y:auto;-webkit-overflow-scrolling:touch;';

            function render() {
                const isLast = page >= meet.pages.length - 1;
                overlay.innerHTML = `
                    <div style="max-width:440px;width:100%;margin:auto 0;background:linear-gradient(160deg,#0a0e18,#0F1014,${meet.color}12);border:1.5px solid ${meet.color}45;border-radius:20px;padding:28px 24px;box-shadow:0 24px 60px ${meet.color}22;animation:slideUp 0.45s cubic-bezier(0.34,1.56,0.64,1);">
                        <div style="text-align:center;margin-bottom:18px;">
                            <div style="width:100%;border-radius:14px;overflow:hidden;border:2px solid ${meet.color}55;box-shadow:0 0 32px ${meet.color}33;background:#0a0e18;margin:0 auto 14px;">
                                <img src="${meet.image || comp.image}" alt="${comp.name}" style="width:100%;height:auto;display:block;" onerror="this.onerror=null;this.src='${comp.image||''}';this.onerror=function(){this.parentElement.innerHTML='<div style=\\'font-size:3.6em;line-height:200px;text-align:center;\\'>${meet.emoji}</div>';};" />
                            </div>
                            <div style="font-size:0.6em;letter-spacing:3px;color:${meet.color};font-weight:900;text-transform:uppercase;">Rencontre</div>
                        </div>
                        <p style="color:rgba(255,255,255,0.85);font-size:0.92em;line-height:1.6;margin:0 0 22px;text-align:center;min-height:80px;">${meet.pages[page]}</p>
                        <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:16px;">
                            ${meet.pages.map((_,i)=>`<div style="width:7px;height:7px;border-radius:50%;background:${i===page?meet.color:'rgba(255,255,255,0.2)'};"></div>`).join('')}
                        </div>
                        <button id="awakMeetNext" style="width:100%;padding:13px;background:linear-gradient(135deg,${meet.color},${meet.color}cc);border:none;border-radius:14px;color:white;font-weight:900;font-size:0.9em;letter-spacing:1px;cursor:pointer;box-shadow:0 4px 16px ${meet.color}40;">${isLast ? '✦ ' + comp.name.toUpperCase() + ' REJOINT' : 'Continuer ›'}</button>
                    </div>`;
                overlay.querySelector('#awakMeetNext').onclick = () => {
                    if (page < meet.pages.length - 1) { page++; render(); }
                    else { overlay.remove(); if (onDone) onDone(); }
                };
            }
            render();
            document.body.appendChild(overlay);
        }
        window.awakShowCompanionMeeting = awakShowCompanionMeeting;

        // Seuils en NIVEAU (v1524 : histoire sur ~1 an, fin au rang A)
        // — un seuil en XP brute se décalait à chaque rééquilibrage de la courbe.
        const COMPANION_RIFTS = [
            {
                id: 'rift_marcus', companionId: 'marcus', companionMech: 'mur_de_fer',
                name: 'L\'Arène du Brutal',
                emoji: '💪', color: '#ef4444',
                description: 'Une Faille saturée de rage pure. Une présence puissante t\'y attend — et te jauge.',
                briefing: 'Quelqu\'un veut voir si tu tiens le choc. Frappe fort. Il n\'aime pas la faiblesse.',
                levelRequired: 12,
                rank: 'D', waves: 3, hpMult: 1.6, primaryStat: 'STR', themeEmoji: '🥊',
                exerciseFilter: ex => /pompe|push|squat|press|fente|burpee/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'rift_kira', companionId: 'kira', companionMech: 'insaisissable',
                name: 'Le Dédale de l\'Ombre',
                emoji: '🗡️', color: '#a855f7',
                description: 'Un labyrinthe où les ombres bougent seules. Une silhouette te suit sans jamais se montrer.',
                briefing: 'Reste vif. Elle teste tes réflexes. Si tu es trop lent, elle ne se montrera pas.',
                levelRequired: 22,
                rank: 'C', waves: 3, hpMult: 2.2, primaryStat: 'AGI', themeEmoji: '🌑',
                exerciseFilter: ex => /jumping|jump|mountain|burpee|sprint|fente|lunge/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'rift_elise', companionId: 'elise', companionMech: 'regeneration',
                name: 'Le Refuge Brisé',
                emoji: '💚', color: '#34d399',
                description: 'Les ruines d\'un ancien dispensaire de Faille. Quelqu\'un y soigne encore les blessés.',
                briefing: 'Tiens bon jusqu\'au bout. Elle ne rejoint que ceux qui refusent d\'abandonner.',
                levelRequired: 32,
                rank: 'C', waves: 3, hpMult: 2.8, primaryStat: 'SEN', themeEmoji: '🏥',
                exerciseFilter: ex => /squat|fente|lunge|pompe|push|step|gainage|planche|pull/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'rift_yuna', companionId: 'yuna', companionMech: 'echos_du_noyau',
                name: 'L\'Écho du Noyau',
                emoji: '🌀', color: '#c084fc',
                description: 'Une Faille qui ne devrait pas exister. Une voix y murmure des choses que tu n\'as pas encore vécues.',
                briefing: 'Le Système se méfie de ce lieu. Quelqu\'un t\'y attend, qui entend ce que lui n\'entend pas.',
                levelRequired: 42,
                rank: 'B', waves: 4, hpMult: 3.4, primaryStat: 'PER', themeEmoji: '🔮',
                exerciseFilter: ex => /squat|press|pompe|push|pull|fente|burpee|jumping/.test((ex.name || '').toLowerCase())
            },
            {
                id: 'rift_chen', companionId: 'chen', companionMech: 'posture_parfaite',
                name: 'Le Sommet du Sage',
                emoji: '🧘', color: '#06b6d4',
                description: 'Au plus haut d\'une Faille interminable, un vieux maître observe ceux qui montent jusqu\'à lui.',
                briefing: 'Peu arrivent jusqu\'ici. Il ne parle qu\'à ceux qui ont prouvé leur constance.',
                levelRequired: 50,
                rank: 'B', waves: 4, hpMult: 4.0, primaryStat: 'PER', themeEmoji: '⛰️',
                exerciseFilter: ex => /squat|press|pompe|push|pull|fente|burpee|gainage/.test((ex.name || '').toLowerCase())
            }
        ];

        function awakCompanionRiftsSeenLoad() {
            try {
                const profileId = typeof getCurrentProfileId === 'function' ? getCurrentProfileId() : null;
                const key = profileId ? `${COMPANION_RIFTS_SEEN_KEY}_${profileId}` : COMPANION_RIFTS_SEEN_KEY;
                return JSON.parse(localStorage.getItem(key) || '[]');
            } catch(e) { return []; }
        }
        function awakCompanionRiftsMarkSeen(id) {
            try {
                const profileId = typeof getCurrentProfileId === 'function' ? getCurrentProfileId() : null;
                const key = profileId ? `${COMPANION_RIFTS_SEEN_KEY}_${profileId}` : COMPANION_RIFTS_SEEN_KEY;
                const seen = awakCompanionRiftsSeenLoad();
                if (!seen.includes(id)) { seen.push(id); localStorage.setItem(key, JSON.stringify(seen)); }
            } catch(e) { _awkE(e); }
        }


        // Vérifie s'il faut faire apparaître une Faille de compagnon (UNE à la fois)
        function awakCheckCompanionRifts() {
            if (typeof getAdventureEnabled === 'function' && !getAdventureEnabled()) return null;
            const rifts = awakRiftsLoad();
            // Une seule Faille de compagnon active (non complétée) à la fois
            if (rifts.some(r => r.isCompanionRift && !r.completed)) return null;

            const seen = awakCompanionRiftsSeenLoad();
            const compData = awakCompanionsLoad();
            const niveau = _awakGetCurrentLevel();

            for (const cr of COMPANION_RIFTS) {
                // Compagnon déjà débloqué → rien à faire
                if (compData.unlocked && compData.unlocked.includes(cr.companionId)) {
                    awakCompanionRiftsMarkSeen(cr.id);
                    continue;
                }
                // Une Faille pour ce compagnon existe déjà dans la liste → ne pas dupliquer
                if (rifts.some(r => r.isCompanionRift && r.companionRiftId === cr.id)) continue;
                if (niveau >= (cr.levelRequired || 1)) {
                    const newRift = awakGenerateCompanionRift(cr);
                    rifts.push(newRift);
                    awakRiftsSave(rifts);
                    const firstTime = !seen.includes(cr.id);
                    awakCompanionRiftsMarkSeen(cr.id);
                    // Cinématique d'apparition seulement la 1re fois (pas de rejeu après abandon/perte)
                    if (firstTime) setTimeout(() => awakShowCompanionRiftAppearance(cr), 1500);
                    return newRift; // une seule à la fois
                }
            }
            return null;
        }
        window.awakCheckCompanionRifts = awakCheckCompanionRifts;

        // ═══════════════════════════════════════════════════════════════
        // 🩸 LES QUATRE ÉPREUVES — sous-boss en séquence avant le Boss Final
        // Chacun teste une qualité physique : cardio, force, explosivité, endurance.
        // Failles narratives permanentes, débloquées en chaîne (battre l'un ouvre le suivant).
        // ═══════════════════════════════════════════════════════════════
        const SUBBOSS_SEEN_KEY = 'awakSubBossProgress'; // index du prochain sous-boss à affronter (0..4)
        const SUB_BOSSES = [
            {
                id: 'subboss_traque', order: 0, mech: 'traque', effort: 'cardio',
                name: 'Le Cavalier des Cendres', emoji: '🐺', color: '#f59e0b',
                description: 'Une bête monstrueuse le porte. Il te poursuit sans relâche — si tu ralentis, il te piétine.',
                briefing: 'COURS. Enchaîne le cardio pour garder ton avance. Chaque temps mort le rapproche de toi.',
                rank: 'A', hpMult: 8.5, primaryStat: 'VIT', themeEmoji: '🔥',
                meetText: 'La poussière retombe. La monture s\u2019effondre, vaincue par ta vitesse. « Tu cours vite, petit. Mais la prochaine épreuve ne se fuit pas. »'
            },
            {
                id: 'subboss_colosse', order: 1, mech: 'colosse', effort: 'force',
                name: 'Le Colosse de Fer', emoji: '🗿', color: '#64748b',
                description: 'Une armure vivante, impénétrable. Aucune force normale ne l\u2019entame.',
                briefing: 'Frappe LOURD. Accumule la force brute pour fissurer sa carapace, puis achève-le pendant la brèche.',
                rank: 'A', hpMult: 9.5, primaryStat: 'STR', themeEmoji: '⚒️',
                meetText: 'La carapace se fendille puis explose. Le géant s\u2019agenouille. « Ta force est réelle. Mais la vitesse pure te brisera. »'
            },
            {
                id: 'subboss_insaisissable', order: 2, mech: 'insaisissable_sb', effort: 'explosif',
                name: 'L\u2019Ombre Dansante', emoji: '🌀', color: '#a855f7',
                description: 'Jamais là où tu frappes. Seuls les coups les plus explosifs l\u2019atteignent.',
                briefing: 'Sois EXPLOSIF. Burpees, sauts, sprints — les mouvements balistiques sont les seuls qui touchent.',
                rank: 'A', hpMult: 11.0, primaryStat: 'AGI', themeEmoji: '⚡',
                meetText: 'Pour une fois, l\u2019ombre ne s\u2019est pas dérobée. « Impressionnant. Tu frappes comme l\u2019éclair. Plus qu\u2019une épreuve avant Lui. »'
            },
            {
                id: 'subboss_siphon', order: 3, mech: 'siphon', effort: 'endurance',
                name: 'Le Siphon Affamé', emoji: '⏳', color: '#dc2626',
                description: 'Il se nourrit de ta vitalité à chaque instant. Le temps joue contre toi.',
                briefing: 'NE T\u2019ARRÊTE PAS. Il te draine sans cesse — tue-le vite, avant qu\u2019il ne te vide entièrement.',
                rank: 'A', hpMult: 9.0, primaryStat: 'END', themeEmoji: '🩸',
                meetText: 'Le Siphon se ratatine, privé de ta vitalité qu\u2019il ne peut plus saisir. « Les Quatre Épreuves sont passées. L’Effaceur t\u2019attend désormais. »'
            }
        ];

        function awakSubBossProgress() { return parseInt(localStorage.getItem(SUBBOSS_SEEN_KEY) || '0'); }
        function awakSubBossSetProgress(n) { localStorage.setItem(SUBBOSS_SEEN_KEY, String(n)); }

        // Vérifie s'il faut faire apparaître le prochain sous-boss (séquence)
        function awakCheckSubBosses() {
            try {
                if (typeof getAdventureEnabled === 'function' && !getAdventureEnabled()) return null;
                const order = ['E','D','C','B','A','S','SS','SSS'];
                const pRank = awakGetRank().id;
                const progress = awakSubBossProgress();
                if (progress >= SUB_BOSSES.length) return null; // les 4 sont vaincus
                const sb = SUB_BOSSES[progress];
                if (order.indexOf(pRank) < order.indexOf(sb.rank)) return null; // rang insuffisant

                // 📖 PRÉREQUIS : toutes les Failles narratives de l'histoire doivent être complétées.
                // (Les épreuves finales ne s'ouvrent qu'à celui qui a vécu tout l'arc.)
                if (typeof NARRATIVE_RIFTS !== 'undefined') {
                    const allRifts = awakRiftsLoad();
                    const narrativeDone = (defId) => allRifts.some(r => r.narrativeId === defId && r.completed)
                        || localStorage.getItem('awakNarrativeDone_' + defId) === '1';   // v1422 : trace durable
                    const allNarrativeComplete = NARRATIVE_RIFTS.every(n => n.arc === 'ss' || narrativeDone(n.id));
                    if (!allNarrativeComplete) return null; // histoire pas terminée → pas de sous-boss
                }

                const rifts = awakRiftsLoad();
                if (rifts.some(r => r.isSubBoss && r.subBossId === sb.id)) return null; // déjà présent
                const newRift = awakGenerateSubBossRift(sb);
                rifts.push(newRift);
                awakRiftsSave(rifts);
                if (typeof showToast === 'function') setTimeout(() => showToast(`${sb.emoji} ÉPREUVE ${sb.order + 1}/4 : ${sb.name} a surgi !`, 'warning', 4500), 1200);
                return newRift;
            } catch(e) { return null; }
        }
        window.awakCheckSubBosses = awakCheckSubBosses;

        function awakGenerateSubBossRift(sb) {
            const monstersForTheme = RIFT_MONSTERS.inverted_reality || RIFT_MONSTERS[Object.keys(RIFT_MONSTERS)[0]];
            const boss = monstersForTheme[monstersForTheme.length - 1];
            const hp = Math.round(boss.baseHp * sb.hpMult * 2.5 * awakRiftHpScale(sb.rank, true)); // ⚖️ v1218
            return {
                id: 'sub_' + sb.id + '_' + Date.now(),
                isNarrative: true,        // protection anti-expiration
                isSubBoss: true,
                subBossId: sb.id,
                subBossMech: sb.mech,
                subBossEffort: sb.effort,
                createdAt: Date.now(),
                expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
                rank: sb.rank,
                themeId: 'subboss_' + sb.id,
                name: sb.name,
                modifierId: null,
                discovered: true,
                state: 'stable',
                waves: [{
                    index: 0, isBoss: true, rank: sb.rank,
                    name: sb.name, emoji: sb.emoji,
                    hpMax: hp, hpCurrent: hp,
                    bossMech: { id: 'subboss', name: sb.name, desc: sb.briefing }
                }],
                currentWaveIdx: 0,
                recommendedPower: { A: 5500, S: 8500 }[sb.rank] || 5500,
                minStatRequired: 60,
                primaryStat: sb.primaryStat,
                attempts: 0, completed: false,
                narrativeData: { briefing: sb.briefing, description: sb.description, color: sb.color, emoji: sb.emoji, name: sb.name }
            };
        }

        // 🩸 Applique la mécanique du sous-boss. Renvoie { damage, toasts:[{msg,type}] }
        // La jauge (wave._gauge) est persistée sur la vague pour durer toute la Faille.
        function awakApplySubBossMech(rift, wave, incomingDamage, effortType, prevHpPercent) {
            const toasts = [];
            let damage = incomingDamage;
            const mech = rift.subBossMech;
            if (wave._gauge === undefined) wave._gauge = 50; // jauge neutre 0..100

            switch (mech) {
                case 'echo': {
                    // v1422 — L'ÉCHO : la jauge = proximité du partenaire. Un long repos
                    // entre deux séries (> 2 min 30) l'éloigne ; enchaîner le rapproche.
                    // À 0 : il ne t'entend plus (variante de la scène, souvenir 2 séances plus tard).
                    const tx = (t) => (typeof awakHerosTexte === 'function') ? awakHerosTexte(t) : t;
                    const now = Date.now();
                    const gap = wave._lastHit ? (now - wave._lastHit) / 1000 : 0;
                    wave._lastHit = now;
                    if (wave._gauge === 50 && !wave._echoInit) { wave._gauge = 60; wave._echoInit = true; }
                    if (gap > 150 && gap < 1800) {
                        wave._gauge = Math.max(0, wave._gauge - 25);
                        damage = Math.round(damage * 0.6);
                        toasts.push({ msg: tx('Trop long. {partenaire} s\'éloigne d\'une salle (' + Math.round(wave._gauge) + ' %).'), type: 'warning' });
                    } else {
                        wave._gauge = Math.min(100, wave._gauge + 15);
                        if (wave._gauge >= 100) { damage = Math.round(damage * 1.3); toasts.push({ msg: tx('Tu l\'as rattrapé{pe} : {il} se bat avec toi. Dégâts ×1,3'), type: 'success' }); }
                        else toasts.push({ msg: tx('Tu te rapproches de {partenaire} : ' + Math.round(wave._gauge) + ' %'), type: 'info' });
                    }
                    if (wave._gauge <= 0 && !rift._echoPerdu) {
                        rift._echoPerdu = true;
                        wave._gauge = 30;
                        toasts.push({ msg: tx('{Il} ne t\'entend plus. Termine quand même : {il} reviendra, mais pas tout de suite.'), type: 'error' });
                    }
                    break;
                }
                case 'traque': {
                    // 🐺 Cardio fait monter l'avance ; sinon elle chute. À 0 → charge = dégâts au joueur.
                    if (effortType === 'cardio' || effortType === 'explosif') {
                        wave._gauge = Math.min(100, wave._gauge + 22);
                        damage = Math.round(damage * 1.15);
                    } else {
                        wave._gauge = Math.max(0, wave._gauge - 18);
                    }
                    if (wave._gauge <= 0 && !wave._charged) {
                        wave._charged = true;
                        toasts.push({ msg: '🐎 IL TE CHARGE ! Reprends le cardio !', type: 'error' });
                        const s = (typeof awakActiveRiftSession !== 'undefined') ? awakActiveRiftSession : null;
                        if (s && typeof s.playerHP === 'number' && typeof awakGetPlayerMaxHP === 'function') {
                            s.playerHP = Math.max(1, s.playerHP - Math.round(awakGetPlayerMaxHP() * 0.20));
                        }
                    } else if (wave._gauge <= 0) {
                        wave._gauge = 20; wave._charged = false;
                    } else if (wave._gauge >= 100 && !wave._maxLead) {
                        wave._maxLead = true;
                        toasts.push({ msg: '🏃 Distance maximale ! Frappe sans relâche !', type: 'success' });
                    } else {
                        toasts.push({ msg: `🐺 Distance : ${Math.round(wave._gauge)}%`, type: wave._gauge < 35 ? 'warning' : 'info' });
                    }
                    break;
                }
                case 'colosse': {
                    // 🗿 Invulnérable tant que l'armure n'est pas brisée par la FORCE.
                    if (!wave._armorBroken) {
                        if (effortType === 'force') {
                            wave._gauge = Math.min(100, wave._gauge + 20);
                            toasts.push({ msg: `⚒️ Fissure l'armure : ${Math.round(wave._gauge)}%`, type: 'info' });
                        } else {
                            wave._gauge = Math.max(0, wave._gauge - 8);
                            toasts.push({ msg: '🛡️ L\'armure tient — frappe LOURD (force) !', type: 'warning' });
                        }
                        damage = 0;
                        if (wave._gauge >= 100) {
                            wave._armorBroken = true; wave._breakTurns = 3;
                            toasts.push({ msg: '💥 ARMURE BRISÉE ! Achève-le !', type: 'success' });
                        }
                    } else {
                        damage = Math.round(damage * 2);
                        wave._breakTurns = (wave._breakTurns || 0) - 1;
                        if (wave._breakTurns <= 0) {
                            wave._armorBroken = false; wave._gauge = 40;
                            toasts.push({ msg: '🗿 L\'armure se reforme ! Brise-la à nouveau.', type: 'warning' });
                        } else {
                            toasts.push({ msg: `💢 Vulnérable ! Dégâts ×2 (${wave._breakTurns})`, type: 'success' });
                        }
                    }
                    break;
                }
                case 'insaisissable_sb': {
                    // 🌀 Esquive 60% — sauf coups EXPLOSIFS qui touchent toujours.
                    if (effortType === 'explosif') {
                        damage = Math.round(damage * 1.2);
                        toasts.push({ msg: '⚡ Touché ! Les coups explosifs ne le ratent jamais', type: 'success' });
                    } else if (Math.random() < 0.6) {
                        damage = 0;
                        toasts.push({ msg: '💨 Esquivé ! Sois EXPLOSIF (burpees, sauts, sprints)', type: 'warning' });
                    } else {
                        toasts.push({ msg: '🌀 Coup partiel — privilégie l\'explosivité', type: 'info' });
                    }
                    break;
                }
                case 'siphon': {
                    // ⏳ Draine les PV du joueur à chaque série. Course contre la montre.
                    const s = (typeof awakActiveRiftSession !== 'undefined') ? awakActiveRiftSession : null;
                    if (s && typeof s.playerHP === 'number' && typeof awakGetPlayerMaxHP === 'function') {
                        const drain = Math.round(awakGetPlayerMaxHP() * 0.06);
                        if (!(typeof awakIsInvincible === 'function' && awakIsInvincible())) s.playerHP = Math.max(1, s.playerHP - drain);
                        toasts.push({ msg: `🩸 Il te draine : -${drain} HP. Tue-le VITE !`, type: 'error' });
                        const el = document.getElementById('playerHpBar');
                        const tx = document.getElementById('playerHpText');
                        if (el) el.style.width = Math.round((s.playerHP / awakGetPlayerMaxHP()) * 100) + '%';
                        if (tx) tx.textContent = `${s.playerHP} / ${awakGetPlayerMaxHP()} HP`;
                    }
                    if (effortType === 'cardio' || effortType === 'endurance') damage = Math.round(damage * 1.1);
                    break;
                }
            }
            return { damage, toasts };
        }
        window.awakApplySubBossMech = awakApplySubBossMech;

        // À la victoire d'un sous-boss : avancer la séquence + jouer la réplique
        function awakOnSubBossDefeated(rift) {
            try {
                const sb = SUB_BOSSES.find(s => s.id === rift.subBossId);
                if (!sb) return;
                if (awakSubBossProgress() <= sb.order) awakSubBossSetProgress(sb.order + 1);
                if (typeof showAlert === 'function') {
                    setTimeout(() => showAlert(`${sb.emoji} ${sb.name} vaincu`, sb.meetText), 2200);
                }
                setTimeout(() => { try { awakCheckSubBosses(); } catch(e) { _awkE(e); } }, 6000);
            } catch(e) { _awkE(e); }
        }
        window.awakOnSubBossDefeated = awakOnSubBossDefeated;

        // ═══════════════════════════════════════════════════════════════
        // 🕳️ L'ABYSSE — descente infinie, palier par palier (post-Effaceur)
        // Débloqué après avoir vaincu l’Effaceur. Chaque palier = une Faille-boss
        // dont le HP scale exponentiellement. 1 palier = 1 séance. Le joueur
        // descend à son rythme ; son record de profondeur est sauvegardé.
        // ═══════════════════════════════════════════════════════════════
        const ABYSS_DEPTH_KEY = 'awakAbyssDepth';       // palier actuel atteint (prochain à affronter = depth+1)
        const ABYSS_RECORD_KEY = 'awakAbyssRecord';     // record de profondeur
        const ABYSS_BOSS_NAMES = [
            'Ombre des Profondeurs', 'Glaneur d\u2019\u00e2mes', 'Sentinelle Engloutie', 'Mâchoire du Vide',
            'Spectre Abyssal', 'Tisseur de Ténèbres', 'Colosse Noyé', 'Veilleur Éternel',
            'Écho du Néant', 'Dévoreur Silencieux'
        ];
        const ABYSS_EMOJIS = ['🕳️','👁️','🦑','🌑','💀','🐙','⚫','🔱','🌀','☠️'];

        function awakAbyssDepth()  { return parseInt(localStorage.getItem(ABYSS_DEPTH_KEY) || '0'); }
        function awakAbyssRecord() { return parseInt(localStorage.getItem(ABYSS_RECORD_KEY) || '0'); }
        window.awakAbyssDepth = awakAbyssDepth;
        window.awakAbyssRecord = awakAbyssRecord;

        // L'Abysse est-il accessible ? (Effaceur vaincu + jeu activé)
        function awakAbyssUnlocked() {
            if (typeof getAdventureEnabled === 'function' && !getAdventureEnabled()) return false;
            return (typeof awakFinalBossDefeated === 'function') && awakFinalBossDefeated();
        }
        window.awakAbyssUnlocked = awakAbyssUnlocked;

        // Génère (ou régénère) la Faille du prochain palier d'Abysse.
        function awakGenerateAbyssRift() {
            const nextDepth = awakAbyssDepth() + 1;
            // HP scalé exponentiellement : base 2500 × 1.15^(palier-1)
            // 🕳️ ABYSSE — contenu sans fin : « jusqu'où ton build peut-il aller ? »
            // Recalibré après la correction des sets, des passifs et des dégâts :
            //  • socle 6000 (au lieu de 2500) : les premiers paliers tombaient en
            //    2 séries, ce qui rendait le début sans intérêt ;
            //  • facteur 1.12 (au lieu de 1.15) : la courbe restait jouable jusqu'au
            //    palier ~35 au lieu de devenir un mur dès le palier 25.
            // Résultat visé : p1 ≈ 4 séries, p10 ≈ 10, p20 ≈ 30, p30+ ≈ exploit.
            const hp = Math.round(6000 * Math.pow(1.12, nextDepth - 1) * awakRiftHpScale('S', true)); // ⚖️ v1218
            const idx = (nextDepth - 1) % ABYSS_BOSS_NAMES.length;
            const bossName = ABYSS_BOSS_NAMES[idx];
            const emoji = ABYSS_EMOJIS[idx];
            // Au-delà du palier 5, une mutation rang A+ s'active aléatoirement pour varier
            let modifierId = null;
            if (nextDepth > 5 && typeof RIFT_MODIFIERS !== 'undefined') {
                const muts = RIFT_MODIFIERS.filter(m => m.rankMin === 'A');
                if (muts.length) modifierId = muts[(nextDepth) % muts.length].id;
            }
            const theme = RIFT_THEMES[(nextDepth) % RIFT_THEMES.length];
            // Récompense : palier ordinaire = XP ×2 ; tous les 5 paliers = légendaire garanti
            const milestone = (nextDepth % 5 === 0);
            return {
                id: 'abyss_' + nextDepth + '_' + Date.now(),
                isNarrative: true,       // protection anti-expiration
                isAbyss: true,
                abyssDepth: nextDepth,
                createdAt: Date.now(),
                expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
                rank: 'S',
                themeId: theme.id,
                name: `Abysse · Palier ${nextDepth} — ${bossName}`,
                modifierId: milestone ? 'worldboss' : modifierId,  // worldboss = légendaire garanti
                discovered: true,
                state: 'stable',
                waves: [{
                    index: 0, isBoss: true, rank: 'S',
                    name: bossName, emoji: emoji,
                    hpMax: hp, hpCurrent: hp,
                    bossMech: (typeof awakPickBossMechanic === 'function') ? awakPickBossMechanic() : null
                }],
                currentWaveIdx: 0,
                recommendedPower: Math.round(6000 * Math.pow(1.12, nextDepth - 1)),
                minStatRequired: 80,
                primaryStat: theme.primaryStat,
                attempts: 0, completed: false,
                narrativeData: {
                    briefing: milestone
                        ? `Palier ${nextDepth} — un gardien majeur. Vaincs-le : butin légendaire garanti.`
                        : `Palier ${nextDepth}. Plus tu descends, plus l'Abysse résiste. Récord actuel : ${awakAbyssRecord()}.`,
                    color: '#7c3aed', emoji: emoji, name: bossName
                }
            };
        }

        // Fait apparaître le palier courant de l'Abysse dans la liste des Failles (si pas déjà là).
        function awakCheckAbyss() {
            try {
                if (!awakAbyssUnlocked()) return null;
                const rifts = awakRiftsLoad();
                // Une seule Faille d'Abysse active à la fois
                if (rifts.some(r => r.isAbyss && !r.completed)) return null;
                const newRift = awakGenerateAbyssRift();
                rifts.push(newRift);
                awakRiftsSave(rifts);
                return newRift;
            } catch(e) { return null; }
        }
        window.awakCheckAbyss = awakCheckAbyss;

        // À la victoire d'un palier d'Abysse : avancer la profondeur + record, préparer le suivant.
        function awakOnAbyssDefeated(rift) {
            try {
                const depth = rift.abyssDepth || (awakAbyssDepth() + 1);
                if (depth > awakAbyssDepth()) localStorage.setItem(ABYSS_DEPTH_KEY, String(depth));
                if (depth > awakAbyssRecord()) localStorage.setItem(ABYSS_RECORD_KEY, String(depth));
                if (typeof showAlert === 'function') {
                    const milestone = (depth % 5 === 0);
                    setTimeout(() => showAlert(
                        `🕳️ Palier ${depth} franchi`,
                        milestone
                            ? `Tu plonges plus loin que jamais. Un palier-jalon vaincu — l'Abysse te récompense, mais elle n'a pas de fond. Profondeur record : ${awakAbyssRecord()}.`
                            : `Tu descends toujours plus profond. Profondeur record : ${awakAbyssRecord()}. Le palier suivant t'attend quand tu seras prêt.`
                    ), 2200);
                }
                // Préparer le palier suivant peu après
                setTimeout(() => { try { awakCheckAbyss(); } catch(e) { _awkE(e); } }, 6000);
            } catch(e) { _awkE(e); }
        }
        window.awakOnAbyssDefeated = awakOnAbyssDefeated;

        // Ouvre l'Abysse : s'assure que le palier courant existe, puis lance sa Faille.
        function awakOpenAbyss() {
            try {
                if (!awakAbyssUnlocked()) return;
                let rifts = awakRiftsLoad();
                let abyssRift = rifts.find(r => r.isAbyss && !r.completed);
                if (!abyssRift) {
                    abyssRift = awakCheckAbyss();
                    rifts = awakRiftsLoad();
                    abyssRift = rifts.find(r => r.isAbyss && !r.completed) || abyssRift;
                }
                if (abyssRift && typeof awakStartRift === 'function') {
                    awakEntrerFaille(abyssRift.id);
                }
            } catch(e) { _awkE(e); }
        }
        window.awakOpenAbyss = awakOpenAbyss;

        // ═══════════════════════════════════════════════════════════════
        // 🛒 LE MARCHAND — interface (vendre minéraux / consommables / équipement)
        // ═══════════════════════════════════════════════════════════════
        let _merchantTab = 'sell'; // 'sell' | 'consumables' | 'equipment'

        // 📖 FENÊTRE EXPLICATIVE DU MARCHAND — affichée une fois, juste après la
        // scène de rencontre (evt_n3_marchand), ou à la première ouverture de
        // l'échoppe pour les joueurs qui avaient déjà vu la scène.
        function _awakMerchantGuideKey(ecrire) {
            try {
                const f = ecrire ? window._cleProfil : window._cleProfilLecture;
                return (typeof f === 'function') ? f('awakMerchantGuideSeen') : 'awakMerchantGuideSeen';
            } catch (e) { return 'awakMerchantGuideSeen'; }
        }
        function awakMerchantGuideSeen() {
            try { return localStorage.getItem(_awakMerchantGuideKey(false)) === '1'; } catch (e) { return true; }
        }
        function awakShowMerchantGuide(ensuite) {
            if (!window.AwakEconomy) return;
            try { localStorage.setItem(_awakMerchantGuideKey(true), '1'); } catch (e) { _awkE(e); }
            document.getElementById('awakMerchantGuide')?.remove();
            const T = window.AwakEconomy.MINERAL_TYPES || {};
            const OR = '#fbbf24';
            const ico = (n, c) => (window.AwakIcon ? window.AwakIcon.get(n, 20, c || OR) : '');
            const mineraux = Object.keys(T).map(k => {
                const m = T[k];
                return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-top:1px solid rgba(255,255,255,0.05);">'
                    + '<span style="font-size:20px;line-height:1;flex-shrink:0;">' + m.icon + '</span>'
                    + '<span style="flex:1;font-size:0.8em;color:#e2e8f0;font-weight:700;">' + m.name + '</span>'
                    + '<span style="font-size:0.74em;color:' + OR + ';font-weight:800;">' + m.value + ' or</span></div>';
            }).join('');
            const bloc = (icone, titre, texte) => '<div style="display:flex;gap:11px;align-items:flex-start;margin-bottom:12px;">'
                + '<span style="width:38px;height:38px;border-radius:11px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.3);">' + ico(icone) + '</span>'
                + '<span style="flex:1;min-width:0;"><span style="display:block;font-size:0.86em;font-weight:900;color:#f8fafc;">' + titre + '</span>'
                + '<span style="display:block;font-size:0.76em;color:#94a3b8;line-height:1.5;margin-top:2px;">' + texte + '</span></span></div>';
            const ov = document.createElement('div');
            ov.id = 'awakMerchantGuide';
            ov.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:18px;';
            ov.innerHTML = '<div style="width:100%;max-width:400px;max-height:88vh;overflow-y:auto;box-sizing:border-box;background:linear-gradient(165deg,rgba(251,191,36,0.10),#0b0d12 55%);border:1px solid rgba(251,191,36,0.4);border-radius:18px;padding:18px 16px;box-shadow:0 0 40px rgba(251,191,36,0.15);">'
                + '<div style="font-size:0.6em;letter-spacing:2px;color:' + OR + ';font-weight:900;">NOUVEAU LIEU</div>'
                + '<div style="font-size:1.12em;font-weight:900;color:#fff;margin:2px 0 14px;">L\'échoppe du Marchand</div>'
                + bloc('faille', 'Les Failles donnent des minéraux', 'Chaque Faille fermée te rapporte des minéraux. Plus son rang est élevé, plus ils sont rares.')
                + bloc('trophee', 'Le Marchand les rachète', 'Vends-lui tes minéraux contre de l\'or, un par un ou tous d\'un coup avec « Tout vendre ».')
                + bloc('epee', 'Dépense ton or', 'Potions et objets utiles, et une sélection d\'équipement qui change chaque semaine.')
                + bloc('boussole', 'Où le trouver', 'L\'échoppe au toit doré sur la carte de l\'onglet Jeu. Aucune Faille ne s\'y pose.')
                + '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:8px 12px 4px;margin-bottom:14px;">'
                +   '<div style="font-size:0.6em;letter-spacing:1.6px;color:#94a3b8;font-weight:900;margin-bottom:4px;">VALEUR DES MINÉRAUX</div>' + mineraux + '</div>'
                + '<div style="display:flex;gap:8px;">'
                +   '<button id="awakMGFermer" style="flex:1;min-height:auto;padding:12px 8px;border-radius:12px;cursor:pointer;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;font-weight:800;font-size:0.84em;">Compris</button>'
                +   '<button id="awakMGOuvrir" style="flex:1.4;min-height:auto;padding:12px 8px;border-radius:12px;cursor:pointer;border:none;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1a1407;font-weight:900;font-size:0.84em;">Ouvrir l\'échoppe</button>'
                + '</div></div>';
            document.body.appendChild(ov);
            const fermer = () => ov.remove();
            document.getElementById('awakMGFermer').onclick = () => { fermer(); if (typeof ensuite === 'function') ensuite(false); };
            document.getElementById('awakMGOuvrir').onclick = () => { fermer(); awakOpenMerchant(true); };
        }
        window.awakShowMerchantGuide = awakShowMerchantGuide;
        window.awakMerchantGuideSeen = awakMerchantGuideSeen;

        function awakOpenMerchant(_sansGuide) {
            if (!window.AwakEconomy) return;
            // Première visite sans avoir vu l'explication → on la montre d'abord
            if (_sansGuide !== true && !awakMerchantGuideSeen()) { awakShowMerchantGuide(); return; }
            document.getElementById('awakMerchantModal')?.remove();
            const modal = document.createElement('div');
            modal.id = 'awakMerchantModal';
            modal.className = 'modal active';
            modal.style.cssText = 'background:rgba(0,0,0,0.92);backdrop-filter:blur(10px);align-items:flex-start;padding:12px 12px 40px;overflow-y:auto;-webkit-overflow-scrolling:touch;';
            modal.innerHTML = awakRenderMerchant();
            document.body.appendChild(modal);
        }
        window.awakOpenMerchant = awakOpenMerchant;

        function awakRenderMerchant() {
            const E = window.AwakEconomy;
            const gold = E.getGold();
            const tabBtn = (id, label, icon) => {
                const on = _merchantTab === id;
                return `<button onclick="_merchantSwitchTab('${id}')" style="flex:1;background:${on?'rgba(251,191,36,0.18)':'rgba(255,255,255,0.03)'};border:1.5px solid ${on?'#fbbf24':'rgba(255,255,255,0.1)'};color:${on?'#fbbf24':'#94a3b8'};border-radius:9px;padding:9px 2px !important;min-width:0;font-size:0.64em;font-weight:800;letter-spacing:0;white-space:nowrap;cursor:pointer;">${icon}<br>${label}</button>`;
            };
            let body = '';
            if (_merchantTab === 'sell') body = awakRenderMerchantSell();
            else if (_merchantTab === 'consumables') body = awakRenderMerchantConsumables();
            else if (_merchantTab === 'masteries') body = awakRenderMerchantMasteries();
            else body = awakRenderMerchantEquipment();

            return `
            <div class="modal-content" style="max-width:480px;width:100%;background:linear-gradient(160deg,#1a1407,#0F1014);border:1px solid rgba(251,191,36,0.4);padding:0;border-radius:20px;margin:0 auto;">
                <div style="position:relative;border-bottom:1px solid rgba(251,191,36,0.25);overflow:hidden;border-radius:20px 20px 0 0;">
                    <img src="images/story/marchand.webp" alt="Le Marchand"
                         style="width:100%;height:190px;object-fit:cover;object-position:center 8%;display:block;${(window.awakMarchandPalit && window.awakMarchandPalit()) ? 'opacity:0.45;filter:grayscale(0.6);' : ''}"
                         onerror="this.onerror=null;this.style.display='none';this.parentNode.style.background='linear-gradient(135deg,rgba(251,191,36,0.18),rgba(251,191,36,0.04))';this.parentNode.querySelector('.merchant-fallback-emoji').style.display='block';" />
                    <div class="merchant-fallback-emoji" style="display:none;font-size:3em;line-height:1;padding:24px 0 0;text-align:center;">🛒</div>
                    <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(15,16,20,0) 40%,rgba(15,16,20,0.85) 100%);"></div>
                    <div style="position:absolute;bottom:10px;left:0;right:0;text-align:center;">
                        <h2 style="margin:0;color:white;font-size:1.35em;font-weight:900;letter-spacing:1.5px;text-shadow:0 2px 8px rgba(0,0,0,0.9);">LE MARCHAND</h2>
                        <div style="font-size:0.82em;color:#fbbf24;font-weight:800;margin-top:3px;text-shadow:0 1px 4px rgba(0,0,0,0.9);">${window.awakOrIcon ? awakOrIcon() : '💰'} ${gold} or</div>
                    </div>
                    <button onclick="document.getElementById('awakMerchantModal').remove()" style="position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,0.5);border:1px solid rgba(239,68,68,0.5);color:#f87171;font-weight:900;cursor:pointer;z-index:2;"><svg viewBox="0 0 24 24" width="16" height="16" style="display:inline-block;vertical-align:-0.15em;" aria-hidden="true"><path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" fill="none"/></svg></button>
                </div>
                ${(window.awakMarchandPalit && window.awakMarchandPalit()) ? '<div style="margin:12px 14px 0;padding:10px 12px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.35);border-radius:10px;font-size:0.76em;color:#fde68a;line-height:1.45;">On voit le comptoir à travers lui. « Désolé… tout coûte un peu plus cher, en ce moment. » <span style="color:#94a3b8;">Prix +25 % tant que la Faille « Le Marchand pâlit » est ouverte.</span></div>' : ''}
                <div style="display:flex;gap:5px;padding:12px 14px;flex-wrap:wrap;">
                    ${tabBtn('sell','VENDRE','💎')}
                    ${tabBtn('consumables','POTIONS','🧪')}
                    ${tabBtn('masteries','MAÎTRISES','🥋')}
                    ${tabBtn('equipment','ÉQUIPEMENT','⚔️')}
                </div>
                <div style="padding:4px 18px 22px;min-height:360px;">${body}</div>
            </div>`;
        }

        // ── Section VENDRE les minéraux ──────────────────────────────
        function awakRenderMerchantSell() {
            const E = window.AwakEconomy;
            const minerals = E.getMinerals();
            const MT = E.MINERAL_TYPES;
            const ids = Object.keys(minerals).filter(id => minerals[id] > 0 && MT[id]);
            if (ids.length === 0) {
                return `<div style="text-align:center;color:#8391a7;font-size:0.85em;padding:30px 10px;">Tu n'as aucun minéral à vendre.<br><span style="font-size:0.85em;">Ferme des Failles pour en extraire.</span></div>`;
            }
            const total = E.getMineralsTotalValue();
            const rows = ids.map(id => {
                const t = MT[id]; const qty = minerals[id]; const val = t.value * qty;
                return `<div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.03);border:1px solid ${t.color}30;border-radius:10px;padding:10px 12px;margin-bottom:7px;">
                    <span style="font-size:2em;line-height:1;">${t.icon}</span>
                    <div style="flex:1;min-width:0;">
                        <div style="color:${t.color};font-weight:800;font-size:0.85em;">${t.name}</div>
                        <div style="font-size:0.66em;color:#94a3b8;">×${qty} · ${t.value} or pièce</div>
                    </div>
                    <button onclick="_merchantSellOne('${id}')" style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.4);color:#fbbf24;border-radius:8px;padding:6px 11px;font-size:0.72em;font-weight:800;cursor:pointer;white-space:nowrap;">+${val}</button>
                </div>`;
            }).join('');
            return `${rows}
                <button onclick="_merchantSellAll()" style="width:100%;margin-top:8px;background:linear-gradient(135deg,#fbbf24,#f59e0b);border:none;color:#1a1407;border-radius:11px;padding:14px;font-size:0.92em;font-weight:900;letter-spacing:1px;cursor:pointer;box-shadow:0 4px 14px rgba(251,191,36,0.3);">${window.awakOrIcon ? awakOrIcon() : ''} TOUT VENDRE · +${total} OR</button>`;
        }

        // ── Section CONSOMMABLES ─────────────────────────────────────
        function awakRenderMerchantConsumables() {
            const E = window.AwakEconomy;
            const gold = E.getGold();
            const shop = E.getConsumableShop();
            if (!shop.length) return `<div style="text-align:center;color:#8391a7;padding:30px;">Aucun consommable disponible.</div>`;
            return shop.map(c => {
                const owned = (typeof awakConsumablesGetCount === 'function') ? awakConsumablesGetCount(c.id) : 0;
                const afford = gold >= c.price;
                return `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:11px;padding:12px;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="font-size:1.6em;">${c.icon}</span>
                        <div style="flex:1;min-width:0;">
                            <div style="color:white;font-weight:800;font-size:0.86em;">${c.name}${owned>0?` <span style="color:#8391a7;font-size:0.85em;">×${owned}</span>`:''}</div>
                            <div style="font-size:0.68em;color:#94a3b8;line-height:1.4;">${c.description||''}</div>
                        </div>
                    </div>
                    <button onclick="_merchantBuyConsumable('${c.id}')" ${afford?'':'disabled'} style="width:100%;margin-top:9px;background:${afford?'rgba(251,191,36,0.12)':'rgba(255,255,255,0.04)'};border:1px solid ${afford?'rgba(251,191,36,0.4)':'rgba(255,255,255,0.08)'};color:${afford?'#fbbf24':'#7c8aa0'};border-radius:8px;padding:9px;font-size:0.78em;font-weight:800;cursor:${afford?'pointer':'not-allowed'};">${window.awakOrIcon ? awakOrIcon() : ''} ${c.price} or</button>
                </div>`;
            }).join('');
        }

        // ── Section ÉQUIPEMENT (stock hebdomadaire) ──────────────────
        function awakRenderMerchantEquipment() {
            const E = window.AwakEconomy;
            const gold = E.getGold();
            const shop = E.getEquipmentShop();
            const db = (typeof EQUIPMENT_DATABASE !== 'undefined') ? EQUIPMENT_DATABASE : [];
            const rows = shop.items.map(entry => {
                const item = db.find(i => i.id === entry.id);
                if (!item) return '';
                const r = (typeof RARITIES !== 'undefined' && RARITIES[item.rarity]) ? RARITIES[item.rarity] : { color:'#94a3b8', labelFull:'?' };
                const bought = shop.purchased.includes(entry.id);
                const afford = gold >= entry.price;
                // 📊 Stats de l'item (STR/AGI/VIT/END/PER/SEN) + passif, pour décider avant d'acheter
                const statEmojis = { STR:'⚔️', AGI:'⚡', VIT:'💙', END:'💚', PER:'👁️', SEN:'🌀' };
                const statsHtml = (item.stats && Object.keys(item.stats).length)
                    ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;">` +
                        Object.entries(item.stats).filter(([k,v]) => v).map(([k,v]) =>
                            `<span style="font-size:0.66em;background:rgba(255,255,255,0.05);border:1px solid ${r.color}33;border-radius:6px;padding:2px 6px;color:${v<0?'#f87171':'#e2e8f0'};font-weight:700;">${statEmojis[k]||''} ${k} ${v>0?'+':''}${v}</span>`
                        ).join('') + `</div>`
                    : '';
                const passiveHtml = item.passive
                    ? `<div style="font-size:0.66em;color:#cbd5e1;margin-top:7px;line-height:1.35;border-left:2px solid ${r.color}66;padding-left:7px;">✨ ${item.passive}</div>`
                    : '';
                const setHtml = item.set
                    ? `<div style="font-size:0.62em;color:${r.color};margin-top:6px;font-weight:700;">🔗 Set : ${(typeof EQUIPMENT_SETS!=='undefined'&&EQUIPMENT_SETS[item.set])?EQUIPMENT_SETS[item.set].name:item.set}</div>`
                    : '';
                return `<div style="background:linear-gradient(135deg,${r.color}14,transparent);border:1.5px solid ${r.color}40;border-radius:11px;padding:12px;margin-bottom:8px;${bought?'opacity:0.5;':''}">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="font-size:1.7em;filter:drop-shadow(0 0 6px ${r.color}80);">${item.icon}</span>
                        <div style="flex:1;min-width:0;">
                            <div style="color:white;font-weight:800;font-size:0.85em;">${item.name}</div>
                            <div style="font-size:0.66em;color:${r.color};font-weight:700;">${(r.labelFull||'').toUpperCase()} · ${({ head:'Tête', weapon:'Arme', hands:'Mains', legs:'Jambes', accessory:'Anneau', chest:'Torse', feet:'Pieds' })[item.slot] || item.slot}</div>
                        </div>
                    </div>
                    ${statsHtml}
                    ${passiveHtml}
                    ${setHtml}
                    ${(() => { try { const _bl = (!bought && typeof getEquipBlockReason === 'function') ? getEquipBlockReason(item) : null; return _bl ? `<div style="font-size:0.68em;color:#fbbf24;margin-top:7px;font-weight:700;">Pas encore équipable : ${_bl.label}</div>` : ''; } catch (e) { return ''; } })()}
                    ${item.description ? `<div style="font-size:0.64em;color:#94a3b8;margin-top:7px;font-style:italic;line-height:1.3;">${item.description}</div>` : ''}
                    <button onclick="_merchantBuyEquipment('${entry.id}')" ${(bought||!afford)?'disabled':''} style="width:100%;margin-top:9px;background:${bought?'rgba(34,197,94,0.1)':afford?`${r.color}22`:'rgba(255,255,255,0.04)'};border:1px solid ${bought?'rgba(34,197,94,0.3)':afford?r.color+'66':'rgba(255,255,255,0.08)'};color:${bought?'#4ade80':afford?r.color:'#7c8aa0'};border-radius:8px;padding:9px;font-size:0.78em;font-weight:800;cursor:${(bought||!afford)?'not-allowed':'pointer'};">${bought?'✓ ACHETÉ':`${window.awakOrIcon ? awakOrIcon() : ''} ${entry.price} or`}</button>
                </div>`;
            }).join('');
            return `<div style="font-size:0.66em;color:#94a3b8;text-align:center;margin-bottom:10px;font-style:italic;">Stock renouvelé chaque semaine · adapté à ton rang (${shop.rank})</div>${rows}`;
        }

        // ── Section MAÎTRISES (puissance de combat achetable) ────────
        function awakRenderMerchantMasteries() {
            const E = window.AwakEconomy;
            const gold = E.getGold();
            const defs = E.MASTERY_DEFS;
            const maxLvl = E.MASTERY_MAX_LEVEL;
            const perLvl = Math.round(E.MASTERY_BONUS_PER_LEVEL * 100);
            const intro = `<div style="font-size:0.66em;color:#94a3b8;text-align:center;margin-bottom:12px;font-style:italic;">Améliore tes dégâts en Faille selon le type d'effort. Chaque niveau : +${perLvl}% (max +${perLvl*maxLvl}%).</div>`;
            const cards = Object.keys(defs).map(id => {
                const d = defs[id];
                const lvl = E.getMasteryLevel(id);
                const nextPrice = E.getMasteryNextPrice(id);
                const isMax = (nextPrice === null);
                const afford = !isMax && gold >= nextPrice;
                const curBonus = Math.round(lvl * E.MASTERY_BONUS_PER_LEVEL * 100);
                // Barre de niveaux (pips)
                let pips = '';
                for (let i = 0; i < maxLvl; i++) {
                    pips += `<div style="flex:1;height:6px;border-radius:3px;background:${i < lvl ? d.color : 'rgba(255,255,255,0.1)'};"></div>`;
                }
                return `<div style="background:linear-gradient(135deg,${d.color}12,transparent);border:1.5px solid ${d.color}40;border-radius:13px;padding:13px;margin-bottom:9px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                        <span style="font-size:1.8em;">${d.icon}</span>
                        <div style="flex:1;min-width:0;">
                            <div style="color:white;font-weight:800;font-size:0.88em;">${d.name}</div>
                            <div style="font-size:0.64em;color:${d.color};font-weight:800;">Niveau ${lvl}/${maxLvl}${curBonus>0?` · +${curBonus}% dégâts`:''}</div>
                        </div>
                    </div>
                    <div style="font-size:0.66em;color:#94a3b8;line-height:1.4;margin-bottom:9px;">${d.desc}</div>
                    <div style="display:flex;gap:4px;margin-bottom:10px;">${pips}</div>
                    <button onclick="_merchantBuyMastery('${id}')" ${(isMax||!afford)?'disabled':''} style="width:100%;background:${isMax?'rgba(34,197,94,0.1)':afford?`${d.color}22`:'rgba(255,255,255,0.04)'};border:1px solid ${isMax?'rgba(34,197,94,0.3)':afford?d.color+'66':'rgba(255,255,255,0.08)'};color:${isMax?'#4ade80':afford?d.color:'#7c8aa0'};border-radius:8px;padding:10px;font-size:0.78em;font-weight:800;cursor:${(isMax||!afford)?'not-allowed':'pointer'};">${isMax?'✓ MAÎTRISE COMPLÈTE':`${window.awakOrIcon ? awakOrIcon() : ''} Niveau ${lvl+1} · ${nextPrice} or`}</button>
                </div>`;
            }).join('');
            return intro + cards;
        }

        // ── Handlers du marchand ─────────────────────────────────────
        function _merchantRefresh() {
            const modal = document.getElementById('awakMerchantModal');
            if (modal) modal.innerHTML = awakRenderMerchant();
            if (typeof renderGameTab === 'function') { try { renderGameTab(); } catch(e){ _awkE(e); } }
        }
        window._merchantSwitchTab = function(t){ _merchantTab = t; _merchantRefresh(); };
        window._merchantSellOne = function(id){
            const g = window.AwakEconomy.sellMineral(id);
            if (g > 0 && typeof showToast === 'function') showToast(`💰 +${g} or`, 'success', 1500);
            _merchantRefresh();
        };
        window._merchantSellAll = function(){
            const g = window.AwakEconomy.sellAllMinerals();
            if (g > 0 && typeof showToast === 'function') showToast(`💰 +${g} or récoltés !`, 'success', 2000);
            _merchantRefresh();
        };
        window._merchantBuyConsumable = function(id){
            const res = window.AwakEconomy.buyConsumable(id);
            if (typeof showToast === 'function') showToast(res.ok ? '✅ Acheté !' : `❌ ${res.reason}`, res.ok?'success':'warning', 2000);
            _merchantRefresh();
        };
        // v1618 : confirmation avant d'acheter un équipement (avant : achat au premier toucher)
        window._merchantBuyEquipment = function(id){
            let nom = 'cet équipement', prix = '', bloc = '';
            try {
                const e = window.AwakEconomy.getEquipmentShop().items.find(x => x.id === id);
                const it = (typeof EQUIPMENT_DATABASE !== 'undefined') ? EQUIPMENT_DATABASE.find(i => i.id === id) : null;
                if (it) nom = it.name;
                if (e) prix = e.price + ' or';
                const bl = (it && typeof getEquipBlockReason === 'function') ? getEquipBlockReason(it) : null;
                if (bl) bloc = ' Pas encore équipable : ' + bl.label + '.';
            } catch (e) { _awkE(e); }
            if (typeof showConfirm !== 'function') return _merchantAcheterEquipement(id);
            showConfirm('Acheter ' + nom + (prix ? ' pour ' + prix : '') + ' ?' + bloc, function () { _merchantAcheterEquipement(id); }, null,
                { title: 'Le Marchand', confirmLabel: 'Acheter', cancelLabel: 'Annuler' });
        };
        function _merchantAcheterEquipement(id){
            const res = window.AwakEconomy.buyEquipment(id);
            if (typeof showToast === 'function') showToast(res.ok ? '⚔️ Équipement acheté !' : `❌ ${res.reason}`, res.ok?'success':'warning', 2200);
            _merchantRefresh();
        }
        window._merchantBuyMastery = function(id){
            const res = window.AwakEconomy.buyMasteryLevel(id);
            if (typeof showToast === 'function') showToast(res.ok ? `🥋 Maîtrise niveau ${res.newLevel} !` : `❌ ${res.reason}`, res.ok?'success':'warning', 2200);
            _merchantRefresh();
        };

