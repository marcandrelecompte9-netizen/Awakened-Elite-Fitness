// ═══════════════════════════════════════════════════════════════════════
// FitPro Elite — Équipements & Sets
// Style Solo Leveling — chaque équipement est lié à un muscle entraîné
// ═══════════════════════════════════════════════════════════════════════

// ── RARITÉS ────────────────────────────────────────────────────────────
const RARITIES = {
    common:    { id: 'common',    label: 'Commun',    color: '#94a3b8', glow: 'rgba(148,163,184,0.3)', dropRate: 0.60, multiplier: 1.0 },
    rare:      { id: 'rare',      label: 'Rare',      color: '#3b82f6', glow: 'rgba(59,130,246,0.4)',  dropRate: 0.28, multiplier: 1.5 },
    epic:      { id: 'epic',      label: 'Épique',    color: '#a855f7', glow: 'rgba(168,85,247,0.5)',  dropRate: 0.10, multiplier: 2.0 },
    legendary: { id: 'legendary', label: 'Légendaire',color: '#f59e0b', glow: 'rgba(245,158,11,0.6)',  dropRate: 0.02, multiplier: 3.0 },
};

// ── SLOTS ──────────────────────────────────────────────────────────────
const SLOTS = {
    head:      { id: 'head',      label: 'Tête',      icon: '⛑️'  },
    chest:     { id: 'chest',     label: 'Torse',     icon: '🛡️'  },
    hands:     { id: 'hands',     label: 'Mains',     icon: '🥊'  },
    legs:      { id: 'legs',      label: 'Jambes',    icon: '🦵'  },
    feet:      { id: 'feet',      label: 'Pieds',     icon: '👟'  },
    weapon:    { id: 'weapon',    label: 'Arme',      icon: '⚔️'  },
    accessory: { id: 'accessory', label: 'Accessoire',icon: '💍'  },
};

// ── SETS D'ÉQUIPEMENTS ─────────────────────────────────────────────────
const EQUIPMENT_SETS = {
    shadow_warrior: {
        id: 'shadow_warrior',
        name: 'Guerrier des Ombres',
        icon: '🗡️',
        description: 'L\'équipement du chasseur solitaire qui affronte l\'obscurité.',
        pieces: ['shadow_helm', 'shadow_chest', 'shadow_gloves', 'shadow_boots'],
        bonuses: {
            2: { label: '2/4 pièces', stats: { strength: 12 },                    desc: '+12 Force' },
            3: { label: '3/4 pièces', stats: { strength: 12, agility: 10 },       desc: '+12 Force, +10 Agilité' },
            4: { label: '4/4 pièces', stats: { strength: 25, agility: 20, vitality: 15 }, desc: '+25 Force, +20 Agilité, +15 Vitalité', special: 'Aura du Guerrier des Ombres 🌑' },
        },
    },
    titan_body: {
        id: 'titan_body',
        name: 'Corps de Titan',
        icon: '🏔️',
        description: 'La puissance brute du Titan — pour les jambes d\'acier.',
        pieces: ['titan_helm', 'titan_chest', 'titan_legs', 'titan_boots'],
        bonuses: {
            2: { label: '2/4 pièces', stats: { vitality: 15 },                    desc: '+15 Vitalité' },
            3: { label: '3/4 pièces', stats: { vitality: 15, strength: 10 },      desc: '+15 Vitalité, +10 Force' },
            4: { label: '4/4 pièces', stats: { vitality: 35, strength: 20, endurance: 25 }, desc: '+35 Vitalité, +20 Force, +25 Endurance', special: 'Peau de Pierre 🪨' },
        },
    },
    swift_hunter: {
        id: 'swift_hunter',
        name: 'Chasseur Rapide',
        icon: '🏹',
        description: 'Vitesse et précision — l\'équipement de l\'élite des chasseurs.',
        pieces: ['hunter_bow', 'hunter_quiver', 'hunter_cloak', 'hunter_boots'],
        bonuses: {
            2: { label: '2/4 pièces', stats: { agility: 15 },                     desc: '+15 Agilité' },
            3: { label: '3/4 pièces', stats: { agility: 15, endurance: 12 },      desc: '+15 Agilité, +12 Endurance' },
            4: { label: '4/4 pièces', stats: { agility: 30, endurance: 20, strength: 10 }, desc: '+30 Agilité, +20 Endurance, +10 Force', special: 'Flèche Fantôme 👻' },
        },
    },
    iron_core: {
        id: 'iron_core',
        name: 'Noyau de Fer',
        icon: '⚙️',
        description: 'Un corps de fer — l\'équipement du guerrier du core.',
        pieces: ['iron_belt', 'iron_grieves', 'iron_bracers', 'iron_amulet'],
        bonuses: {
            2: { label: '2/4 pièces', stats: { endurance: 12 },                   desc: '+12 Endurance' },
            3: { label: '3/4 pièces', stats: { endurance: 12, vitality: 10 },     desc: '+12 Endurance, +10 Vitalité' },
            4: { label: '4/4 pièces', stats: { endurance: 28, vitality: 18, strength: 12 }, desc: '+28 Endurance, +18 Vitalité, +12 Force', special: 'Âme d\'Acier 🔩' },
        },
    },
};

// ── BASE D'ÉQUIPEMENTS ─────────────────────────────────────────────────
// muscle: le groupe musculaire entraîné qui peut faire dropper cet item
// stats: force, agilité, endurance, vitalité
const EQUIPMENT_DATABASE = [

    // ═══ SET : GUERRIER DES OMBRES (Haut du corps) ═══════════════════
    {
        id: 'shadow_helm',
        name: 'Heaume des Ombres',
        icon: '🪖',
        description: 'Un heaume forgé dans l\'obscurité. Protège l\'esprit.',
        slot: 'head',
        rarity: 'rare',
        set: 'shadow_warrior',
        muscle: 'Dos',
        stats: { strength: 8, agility: 5, endurance: 3, vitality: 4 },
        lore: '"L\'obscurité n\'est pas l\'absence de lumière. C\'est une force."'
    },
    {
        id: 'shadow_chest',
        name: 'Plastron Obscur',
        icon: '🦺',
        description: 'Une armure légère qui absorbe les coups dans l\'ombre.',
        slot: 'chest',
        rarity: 'rare',
        set: 'shadow_warrior',
        muscle: 'Pectoraux',
        stats: { strength: 6, agility: 8, endurance: 5, vitality: 6 },
        lore: '"Porter le fardeau sans montrer la douleur."'
    },
    {
        id: 'shadow_gloves',
        name: 'Gantelets des Ténèbres',
        icon: '🧤',
        description: 'Des gantelets qui augmentent la prise et la vitesse de frappe.',
        slot: 'hands',
        rarity: 'rare',
        set: 'shadow_warrior',
        muscle: 'Avant-bras',
        stats: { strength: 10, agility: 6, endurance: 2, vitality: 2 },
        lore: '"Chaque poing est une décision."'
    },
    {
        id: 'shadow_boots',
        name: 'Bottes de l\'Ombre',
        icon: '🥾',
        description: 'Des bottes silencieuses qui permettent de se déplacer sans bruit.',
        slot: 'feet',
        rarity: 'rare',
        set: 'shadow_warrior',
        muscle: 'Mollets',
        stats: { strength: 4, agility: 12, endurance: 4, vitality: 3 },
        lore: '"La vitesse est la meilleure armure."'
    },

    // ═══ SET : CORPS DE TITAN (Bas du corps) ═════════════════════════
    {
        id: 'titan_helm',
        name: 'Couronne du Titan',
        icon: '👑',
        description: 'Forgée dans l\'acier le plus pur. Symbole de puissance absolue.',
        slot: 'head',
        rarity: 'epic',
        set: 'titan_body',
        muscle: 'Trapèzes',
        stats: { strength: 12, agility: 2, endurance: 8, vitality: 12 },
        lore: '"Les rois ne demandent pas la permission."'
    },
    {
        id: 'titan_chest',
        name: 'Cuirasse du Titan',
        icon: '🛡️',
        description: 'Une protection quasi indestructible. Pèse le poids d\'une montagne.',
        slot: 'chest',
        rarity: 'epic',
        set: 'titan_body',
        muscle: 'Dos',
        stats: { strength: 10, agility: 0, endurance: 12, vitality: 15 },
        lore: '"Absorbe tout. Ne cède rien."'
    },
    {
        id: 'titan_legs',
        name: 'Jambières de Titan',
        icon: '🦿',
        description: 'Des jambières qui transforment chaque pas en séisme.',
        slot: 'legs',
        rarity: 'epic',
        set: 'titan_body',
        muscle: 'Quadriceps',
        stats: { strength: 8, agility: 2, endurance: 15, vitality: 10 },
        lore: '"Des jambes d\'acier portent les épaules d\'un empire."'
    },
    {
        id: 'titan_boots',
        name: 'Sabatons du Titan',
        icon: '👢',
        description: 'Chaque foulée fait trembler le sol sous tes pieds.',
        slot: 'feet',
        rarity: 'epic',
        set: 'titan_body',
        muscle: 'Fessiers',
        stats: { strength: 6, agility: 3, endurance: 12, vitality: 8 },
        lore: '"Avance. Ne recule jamais."'
    },

    // ═══ SET : CHASSEUR RAPIDE (Cardio/Corps entier) ══════════════════
    {
        id: 'hunter_bow',
        name: 'Arc du Chasseur',
        icon: '🏹',
        description: 'Un arc taillé dans le bois des forêts interdites.',
        slot: 'weapon',
        rarity: 'epic',
        set: 'swift_hunter',
        muscle: 'Épaules',
        stats: { strength: 8, agility: 15, endurance: 5, vitality: 4 },
        lore: '"Une flèche bien tirée ne ment jamais."'
    },
    {
        id: 'hunter_quiver',
        name: 'Carquois Fantôme',
        icon: '🎯',
        description: 'Un carquois qui semble ne jamais se vider.',
        slot: 'accessory',
        rarity: 'rare',
        set: 'swift_hunter',
        muscle: 'Cardio',
        stats: { strength: 3, agility: 12, endurance: 10, vitality: 5 },
        lore: '"L\'endurance est une arme."'
    },
    {
        id: 'hunter_cloak',
        name: 'Cape du Chasseur',
        icon: '🧥',
        description: 'Une cape légère qui aide à esquiver les attaques.',
        slot: 'chest',
        rarity: 'rare',
        set: 'swift_hunter',
        muscle: 'Ischio-jambiers',
        stats: { strength: 2, agility: 18, endurance: 6, vitality: 6 },
        lore: '"Invisible jusqu\'au dernier moment."'
    },
    {
        id: 'hunter_boots',
        name: 'Bottes Éclairs',
        icon: '⚡',
        description: 'Des bottes qui permettent des démarrages explosifs.',
        slot: 'feet',
        rarity: 'rare',
        set: 'swift_hunter',
        muscle: 'Mollets',
        stats: { strength: 3, agility: 20, endurance: 8, vitality: 2 },
        lore: '"Plus vite que l\'éclair, plus silencieux que la nuit."'
    },

    // ═══ SET : NOYAU DE FER (Core) ════════════════════════════════════
    {
        id: 'iron_belt',
        name: 'Ceinture de Fer',
        icon: '🔗',
        description: 'Une ceinture qui renforce le centre de gravité.',
        slot: 'accessory',
        rarity: 'rare',
        set: 'iron_core',
        muscle: 'Abdominaux',
        stats: { strength: 6, agility: 4, endurance: 15, vitality: 8 },
        lore: '"Le core est le centre de tout."'
    },
    {
        id: 'iron_grieves',
        name: 'Cnémides d\'Acier',
        icon: '🦵',
        description: 'Des protège-tibias forgés dans l\'acier pur.',
        slot: 'legs',
        rarity: 'rare',
        set: 'iron_core',
        muscle: 'Obliques',
        stats: { strength: 5, agility: 5, endurance: 12, vitality: 10 },
        lore: '"La stabilité est la force cachée."'
    },
    {
        id: 'iron_bracers',
        name: 'Brassards de Fer',
        icon: '💪',
        description: 'Des brassards lourds qui transforment chaque mouvement en effort.',
        slot: 'hands',
        rarity: 'rare',
        set: 'iron_core',
        muscle: 'Biceps',
        stats: { strength: 10, agility: 3, endurance: 10, vitality: 5 },
        lore: '"Les bras sont la volonté rendue visible."'
    },
    {
        id: 'iron_amulet',
        name: 'Amulette du Noyau',
        icon: '🔮',
        description: 'Une amulette ancienne qui renforce la résistance intérieure.',
        slot: 'accessory',
        rarity: 'epic',
        set: 'iron_core',
        muscle: 'Corps entier',
        stats: { strength: 8, agility: 6, endurance: 18, vitality: 12 },
        lore: '"Le vrai pouvoir vient de l\'intérieur."'
    },

    // ═══ ITEMS LÉGENDAIRES STANDALONE ════════════════════════════════
    {
        id: 'sword_of_awakening',
        name: 'Épée de l\'Éveil',
        icon: '🗡️',
        description: 'L\'arme légendaire du premier chasseur rang S. Droppe uniquement après une séance exceptionnelle.',
        slot: 'weapon',
        rarity: 'legendary',
        set: null,
        muscle: 'Pectoraux',
        stats: { strength: 35, agility: 15, endurance: 10, vitality: 10 },
        lore: '"Seuls ceux qui ont brisé leurs limites méritent cette lame."'
    },
    {
        id: 'crown_of_monarch',
        name: 'Couronne du Monarque',
        icon: '👑',
        description: 'La couronne du Monarque des Ombres. Unique au monde.',
        slot: 'head',
        rarity: 'legendary',
        set: null,
        muscle: 'Corps entier',
        stats: { strength: 25, agility: 25, endurance: 25, vitality: 25 },
        lore: '"Je me lève seul. Je combats seul. Je vaincrai seul."'
    },
    {
        id: 'ring_of_tenacity',
        name: 'Anneau de la Ténacité',
        icon: '💍',
        description: 'Un anneau porté par ceux qui ne capitulent jamais.',
        slot: 'accessory',
        rarity: 'legendary',
        set: null,
        muscle: 'Cardio',
        stats: { strength: 10, agility: 10, endurance: 40, vitality: 15 },
        lore: '"La ténacité est la seule magie qui existe vraiment."'
    },

    // ═══ ITEMS COMMUNS (débutants) ════════════════════════════════════
    {
        id: 'basic_gloves',
        name: 'Gants de Combat',
        icon: '🥊',
        description: 'Des gants basiques pour les chasseurs débutants.',
        slot: 'hands',
        rarity: 'common',
        set: null,
        muscle: 'Biceps',
        stats: { strength: 4, agility: 2, endurance: 1, vitality: 1 },
        lore: '"Tout commence quelque part."'
    },
    {
        id: 'basic_boots',
        name: 'Bottes de Débutant',
        icon: '👟',
        description: 'Des bottes simples mais solides.',
        slot: 'feet',
        rarity: 'common',
        set: null,
        muscle: 'Mollets',
        stats: { strength: 1, agility: 4, endurance: 3, vitality: 1 },
        lore: '"Un long voyage commence par un premier pas."'
    },
    {
        id: 'basic_chest',
        name: 'Tunique du Novice',
        icon: '👕',
        description: 'Une tunique légère pour les premières missions.',
        slot: 'chest',
        rarity: 'common',
        set: null,
        muscle: 'Pectoraux',
        stats: { strength: 2, agility: 2, endurance: 3, vitality: 3 },
        lore: '"Le rang E est un commencement, pas une fin."'
    },
    {
        id: 'training_sword',
        name: 'Épée d\'Entraînement',
        icon: '⚔️',
        description: 'Une épée pour s\'exercer. Pas encore prête pour les vrais combats.',
        slot: 'weapon',
        rarity: 'common',
        set: null,
        muscle: 'Épaules',
        stats: { strength: 5, agility: 1, endurance: 1, vitality: 1 },
        lore: '"Maîtrise les bases avant de viser les sommets."'
    },
    {
        id: 'endurance_ring',
        name: 'Anneau d\'Endurance',
        icon: '⭕',
        description: 'Un anneau simple qui augmente légèrement la résistance.',
        slot: 'accessory',
        rarity: 'common',
        set: null,
        muscle: 'Cardio',
        stats: { strength: 0, agility: 1, endurance: 5, vitality: 3 },
        lore: '"Persévère. C\'est la seule règle."'
    },
    {
        id: 'iron_helm',
        name: 'Casque de Fer',
        icon: '⛑️',
        description: 'Un casque de base, solide et fiable.',
        slot: 'head',
        rarity: 'common',
        set: null,
        muscle: 'Trapèzes',
        stats: { strength: 2, agility: 1, endurance: 4, vitality: 4 },
        lore: '"Protège ta tête. Tout commence par là."'
    },
];

// ── HELPER FUNCTIONS ────────────────────────────────────────────────────
function getItemById(id) {
    return EQUIPMENT_DATABASE.find(item => item.id === id) || null;
}

function getItemsByMuscle(muscle) {
    return EQUIPMENT_DATABASE.filter(item => item.muscle === muscle || item.muscle === 'Corps entier');
}

function getSetById(id) {
    return EQUIPMENT_SETS[id] || null;
}

function getRarityInfo(rarityId) {
    return RARITIES[rarityId] || RARITIES.common;
}
