// ═══════════════════════════════════════════════════════════════════════
// Awakened — Système d'Équipement Solo Leveling
// Stats : STR · AGI · VIT · END · PER · SEN
// ═══════════════════════════════════════════════════════════════════════

const RARITIES = {
    common:    { id:'common',    label:'E', labelFull:'Commun',     color:'#94a3b8', bg:'rgba(148,163,184,0.08)', glow:'rgba(148,163,184,0.18)', dropRate:0.60 },
    rare:      { id:'rare',      label:'C', labelFull:'Rare',       color:'#3b82f6', bg:'rgba(59,130,246,0.10)',  glow:'rgba(59,130,246,0.28)',  dropRate:0.28 },
    epic:      { id:'epic',      label:'A', labelFull:'Épique',     color:'#a855f7', bg:'rgba(168,85,247,0.10)', glow:'rgba(168,85,247,0.38)', dropRate:0.10 },
    legendary: { id:'legendary', label:'S', labelFull:'Légendaire', color:'#f59e0b', bg:'rgba(245,158,11,0.10)', glow:'rgba(245,158,11,0.45)', dropRate:0.02 },
};

const SLOTS = {
    head:      { id:'head',      label:'Tête',       icon:'⛑️'  },
    chest:     { id:'chest',     label:'Torse',      icon:'🛡️'  },
    hands:     { id:'hands',     label:'Mains',      icon:'🥊'  },
    legs:      { id:'legs',      label:'Jambes',     icon:'🦵'  },
    feet:      { id:'feet',      label:'Pieds',      icon:'👟'  },
    weapon:    { id:'weapon',    label:'Arme',       icon:'⚔️'  },
    accessory: { id:'accessory', label:'Accessoire', icon:'💍'  },
};

// ── SETS ─────────────────────────────────────────────────────────────
const EQUIPMENT_SETS = {
    shadow_monarch: {
        id:'shadow_monarch', name:'Monarque des Ombres', icon:'🌑',
        description:'L\'équipement du chasseur qui commande l\'obscurité elle-même.',
        pieces:['shadow_crown','shadow_mantle','shadow_gauntlets','shadow_greaves','shadow_sabatons','shadow_dagger'],
        bonuses:{
            2:{ desc:'+20 STR · +15 AGI' },
            4:{ desc:'+45 STR · +35 AGI · +20 VIT' },
            6:{ desc:'COMPLET : Aura du Monarque — tous les stats +30%, immunité à la Fatigue 🌑', special:true },
        },
    },
    iron_blood: {
        id:'iron_blood', name:'Sang de Fer', icon:'🩸',
        description:'Forgé dans la douleur. Chaque entraînement le rend plus puissant.',
        pieces:['iron_horns','iron_breastplate','iron_knuckles','iron_tassets','iron_greaves','berserker_axe'],
        bonuses:{
            2:{ desc:'+25 STR · +10 END' },
            4:{ desc:'+50 STR · +25 END · +15 VIT' },
            6:{ desc:'COMPLET : Furie Sanguine — STR ×2 pendant 60 secondes 🩸', special:true },
        },
    },
    phantom_speed: {
        id:'phantom_speed', name:'Vitesse Fantôme', icon:'💨',
        description:'Tellement rapide que tu laisses des images rémanentes.',
        pieces:['phantom_visor','phantom_suit','phantom_wraps','phantom_tights','phantom_treads','phantom_blade'],
        bonuses:{
            2:{ desc:'+25 AGI · +15 PER' },
            4:{ desc:'+50 AGI · +30 PER · +20 SEN' },
            6:{ desc:'COMPLET : Fantôme — esquive automatique 25% des "courbatures" 💨', special:true },
        },
    },
    titan_fortress: {
        id:'titan_fortress', name:'Forteresse de Titan', icon:'🏔️',
        description:'Être un Titan, c\'est refuser de tomber.',
        pieces:['titan_crown','titan_plate','titan_crushers','titan_cuisses','titan_stompers'],
        bonuses:{
            2:{ desc:'+30 VIT · +20 END' },
            4:{ desc:'+65 VIT · +45 END · +25 STR' },
            5:{ desc:'COMPLET : Peau de Pierre — dégâts réduits de 30% 🪨', special:true },
        },
    },
    celestial_hunter: {
        id:'celestial_hunter', name:'Chasseur Céleste', icon:'✨',
        description:'Béni par les dieux. L\'équipement des élus du Système.',
        pieces:['celestial_halo','celestial_robe','celestial_gloves','celestial_leggings','celestial_bow'],
        bonuses:{
            2:{ desc:'+20 SEN · +20 PER' },
            4:{ desc:'+45 SEN · +45 PER · +25 AGI' },
            5:{ desc:'COMPLET : Vision Sacrée — +50% XP à chaque séance ✨', special:true },
        },
    },
    void_walker: {
        id:'void_walker', name:'Marcheur du Vide', icon:'🕳️',
        description:'Entre dans le vide. Le vide entre en toi.',
        pieces:['void_helm','void_armor','void_claws','void_ring'],
        bonuses:{
            2:{ desc:'+15 tous les stats' },
            4:{ desc:'COMPLET : Absorption du Vide — récupère 2× plus vite 🕳️', special:true },
        },
    },
};

// ── BASE D'ÉQUIPEMENTS ───────────────────────────────────────────────
// stats: STR (force), AGI (agilité), VIT (vitalité), END (endurance), PER (perception), SEN (sens)
// passive: effet spécial textuel
const EQUIPMENT_DATABASE = [

    // ══════════════════════════════════════════════
    // ► RANG E — COMMUNS
    // ══════════════════════════════════════════════

    {   id:'novice_headband', name:'Bandeau du Novice', icon:'🎽', slot:'head', rarity:'common', set:null,
        muscle:'Corps entier',
        stats:{ STR:2, AGI:2, VIT:2, END:3, PER:1, SEN:1 },
        passive:'Concentration +1 : légère amélioration de la mise au point avant une série.',
        description:'Un simple bandeau porté par tous ceux qui commencent leur chemin.',
        lore:'"Le rang E n\'est pas une honte. C\'est un point de départ."' },

    {   id:'trainee_vest', name:'Gilet du Recrue', icon:'👕', slot:'chest', rarity:'common', set:null,
        muscle:'Pectoraux',
        stats:{ STR:3, AGI:1, VIT:3, END:2, PER:1, SEN:1 },
        passive:'Endurance passive : -5% de fatigue perçue pendant les séances courtes.',
        description:'Tissu respirant de base. Suffisant pour les premières épreuves.',
        lore:'"Chaque champion a un jour porté son premier gilet."' },

    {   id:'iron_gauntlets', name:'Gantlets de Fer', icon:'🥊', slot:'hands', rarity:'common', set:null,
        muscle:'Biceps',
        stats:{ STR:5, AGI:1, VIT:1, END:2, PER:1, SEN:0 },
        passive:'Prise renforcée : +10% de stabilité sur les exercices de tirage.',
        description:'Des gants basiques qui protègent les mains lors des premières batailles.',
        lore:'"Commence avec les mains. Le reste suivra."' },

    {   id:'training_leggings', name:'Collant d\'Entraînement', icon:'🩱', slot:'legs', rarity:'common', set:null,
        muscle:'Quadriceps',
        stats:{ STR:2, AGI:3, VIT:2, END:3, PER:1, SEN:1 },
        passive:'Compression légère : -10% de crampes en fin de séance.',
        description:'Des leggings de compression qui soutiennent les muscles en mouvement.',
        lore:'"Les jambes portent tout. Protège-les."' },

    {   id:'runner_shoes', name:'Chaussures du Coureur', icon:'👟', slot:'feet', rarity:'common', set:null,
        muscle:'Mollets',
        stats:{ STR:1, AGI:5, VIT:1, END:3, PER:2, SEN:1 },
        passive:'Légèreté : +5% de vitesse sur les exercices cardio.',
        description:'Des chaussures de course légères pour les premiers kilomètres.',
        lore:'"Un long voyage commence par une seule foulée."' },

    {   id:'practice_sword', name:'Épée d\'Entraînement', icon:'⚔️', slot:'weapon', rarity:'common', set:null,
        muscle:'Épaules',
        stats:{ STR:6, AGI:2, VIT:1, END:1, PER:2, SEN:1 },
        passive:'Apprenti guerrier : +5% XP sur les exercices Épaules.',
        description:'Une lame émoussée pour apprendre les bases du combat.',
        lore:'"Maîtrise l\'ordinaire avant de toucher l\'extraordinaire."' },

    {   id:'stamina_ring', name:'Anneau d\'Endurance', icon:'⭕', slot:'accessory', rarity:'common', set:null,
        muscle:'Cardio',
        stats:{ STR:0, AGI:2, VIT:3, END:6, PER:1, SEN:2 },
        passive:'Souffle profond : la durée de récupération entre les séries réduite de 5%.',
        description:'Un anneau gravé d\'un symbole ancien — cercle sans fin.',
        lore:'"L\'endurance n\'a pas de fin. Tel ce cercle."' },

    {   id:'iron_helm_basic', name:'Casque de Soldat', icon:'⛑️', slot:'head', rarity:'common', set:null,
        muscle:'Trapèzes',
        stats:{ STR:3, AGI:1, VIT:4, END:2, PER:2, SEN:0 },
        passive:'Protection mentale : -10% de distraction pendant l\'effort.',
        description:'Un casque robuste qui protège l\'esprit autant que le corps.',
        lore:'"Un soldat ne tremble pas."' },

    {   id:'support_brace', name:'Attelle de Support', icon:'🩺', slot:'accessory', rarity:'common', set:null,
        muscle:'Corps entier',
        stats:{ STR:1, AGI:1, VIT:5, END:4, PER:1, SEN:2 },
        passive:'Récupération active : +10% de vitesse de récupération musculaire.',
        description:'Une attelle technique qui stabilise les articulations sous tension.',
        lore:'"Se protéger n\'est pas une faiblesse. C\'est de la sagesse."' },

    // ══════════════════════════════════════════════
    // ► RANG C — RARES
    // ══════════════════════════════════════════════

    {   id:'shadow_helm', name:'Heaume des Ombres', icon:'🪖', slot:'head', rarity:'rare', set:'shadow_monarch',
        muscle:'Dos',
        stats:{ STR:10, AGI:8, VIT:6, END:5, PER:7, SEN:4 },
        passive:'Vision nocturne : +15% PER dans les environnements à faible lumière.',
        description:'Forgé dans l\'obscurité des donjons de Rang C. Absorbe la lumière ambiante.',
        lore:'"L\'ombre n\'est pas une prison. C\'est une armure."' },

    {   id:'shadow_mantle', name:'Manteau des Ombres', icon:'🧥', slot:'chest', rarity:'rare', set:'shadow_monarch',
        muscle:'Pectoraux',
        stats:{ STR:8, AGI:12, VIT:7, END:6, PER:5, SEN:8 },
        passive:'Fluidité : -15% de fatigue lors des exercices explosifs.',
        description:'Un manteau tissé d\'obscurité pure. Léger comme l\'ombre, résistant comme la nuit.',
        lore:'"Porter l\'obscurité, c\'est en faire sa force."' },

    {   id:'shadow_gauntlets', name:'Gantelets des Ombres', icon:'🖤', slot:'hands', rarity:'rare', set:'shadow_monarch',
        muscle:'Avant-bras',
        stats:{ STR:14, AGI:9, VIT:4, END:5, PER:6, SEN:7 },
        passive:'Frappe silencieuse : +20% STR sur les exercices de tirage vertical.',
        description:'Des gantelets qui amplifient chaque coup d\'une énergie sombre.',
        lore:'"Chaque poing est une décision. Chaque décision, une ombre."' },

    {   id:'shadow_greaves', name:'Jambières des Ombres', icon:'🦵', slot:'legs', rarity:'rare', set:'shadow_monarch',
        muscle:'Ischio-jambiers',
        stats:{ STR:7, AGI:13, VIT:6, END:9, PER:5, SEN:6 },
        passive:'Pas fantôme : +20% AGI, réduction de bruit de déplacement.',
        description:'Des jambières qui rendent chaque foulée aussi silencieuse qu\'une ombre.',
        lore:'"Se déplacer sans être vu. Frapper sans être entendu."' },

    {   id:'shadow_sabatons', name:'Sabatons des Ombres', icon:'🥾', slot:'feet', rarity:'rare', set:'shadow_monarch',
        muscle:'Mollets',
        stats:{ STR:5, AGI:16, VIT:5, END:7, PER:8, SEN:9 },
        passive:'Foulée spectrale : +25% AGI sur les exercices d\'explosivité.',
        description:'Des bottes imprégnées d\'ombre. Chaque pas laisse une trace invisible.',
        lore:'"La vitesse est la seule armure dont tu aies besoin."' },

    {   id:'shadow_dagger', name:'Dague de l\'Ombre', icon:'🗡️', slot:'weapon', rarity:'rare', set:'shadow_monarch',
        muscle:'Épaules',
        stats:{ STR:12, AGI:18, VIT:3, END:4, PER:10, SEN:13 },
        passive:'Lame traîtresse : +30% de dégâts sur les exercices unilatéraux.',
        description:'Une lame courte forgée dans l\'essence même des ombres.',
        lore:'"La dague frappe là où l\'épée ne peut pas atteindre."' },

    {   id:'iron_breastplate', name:'Cuirasse de Fer', icon:'🛡️', slot:'chest', rarity:'rare', set:'iron_blood',
        muscle:'Dos',
        stats:{ STR:16, AGI:3, VIT:12, END:14, PER:3, SEN:2 },
        passive:'Bastion : -20% de fatigue sur les mouvements composés lourds.',
        description:'Une armure forgée dans l\'acier le plus pur. Absorbe chaque coup.',
        lore:'"Absorbe tout. Ne cède rien. Jamais."' },

    {   id:'iron_horns', name:'Casque aux Cornes de Fer', icon:'🐂', slot:'head', rarity:'rare', set:'iron_blood',
        muscle:'Trapèzes',
        stats:{ STR:14, AGI:2, VIT:10, END:12, PER:4, SEN:3 },
        passive:'Rage du Taureau : +25% STR quand les PV sont inférieurs à 50%.',
        description:'Les cornes de ce casque inspirent une fureur animale chez ceux qui le portent.',
        lore:'"Le taureau ne recule jamais."' },

    {   id:'iron_knuckles', name:'Poings de Fer', icon:'🤜', slot:'hands', rarity:'rare', set:'iron_blood',
        muscle:'Biceps',
        stats:{ STR:20, AGI:4, VIT:6, END:10, PER:3, SEN:2 },
        passive:'Punch d\'acier : +30% STR sur les exercices de push-up et développé.',
        description:'Des gantelets de métal brut. La subtilité n\'est pas leur style.',
        lore:'"La force brute est la forme la plus honnête du pouvoir."' },

    {   id:'phantom_visor', name:'Visière Fantôme', icon:'🥽', slot:'head', rarity:'rare', set:'phantom_speed',
        muscle:'Corps entier',
        stats:{ STR:5, AGI:15, VIT:5, END:6, PER:18, SEN:11 },
        passive:'Analyse instantanée : +30% PER, lecture anticipée des mouvements.',
        description:'Une visière high-tech qui augmente la perception spatiale.',
        lore:'"Voir avant d\'agir. Agir avant que les autres ne voient."' },

    {   id:'phantom_suit', name:'Combinaison Fantôme', icon:'🩲', slot:'chest', rarity:'rare', set:'phantom_speed',
        muscle:'Cardio',
        stats:{ STR:6, AGI:18, VIT:7, END:12, PER:10, SEN:7 },
        passive:'Aérodynamisme : +25% AGI, -15% résistance de l\'air (ressenti).',
        description:'Une combinaison futuriste qui épouse parfaitement le corps.',
        lore:'"Moins de résistance. Plus de vitesse. C\'est la physique."' },

    {   id:'phantom_wraps', name:'Bandages Fantômes', icon:'🩹', slot:'hands', rarity:'rare', set:'phantom_speed',
        muscle:'Avant-bras',
        stats:{ STR:8, AGI:20, VIT:4, END:7, PER:12, SEN:15 },
        passive:'Frappe rapide : +35% AGI sur les exercices explosifs des bras.',
        description:'Des bandages imprégnés d\'une énergie cinétique latente.',
        lore:'"La rapidité est une forme de violence."' },

    {   id:'phantom_tights', name:'Collants Fantômes', icon:'🩱', slot:'legs', rarity:'rare', set:'phantom_speed',
        muscle:'Quadriceps',
        stats:{ STR:6, AGI:22, VIT:6, END:10, PER:9, SEN:7 },
        passive:'Sprint fantôme : +40% AGI lors des exercices de course et sauts.',
        description:'Des collants à compression maximale qui propulsent comme des ressorts.',
        lore:'"Tes jambes ne te portent plus. Elles te propulsent."' },

    {   id:'phantom_treads', name:'Semelles Fantômes', icon:'👠', slot:'feet', rarity:'rare', set:'phantom_speed',
        muscle:'Mollets',
        stats:{ STR:4, AGI:25, VIT:4, END:8, PER:11, SEN:8 },
        passive:'Décollage : temps de réaction aux exercices pliométriques réduit de 20%.',
        description:'Des semelles conçues pour maximiser la restitution d\'énergie.',
        lore:'"Chaque foulée est un bond vers la victoire."' },

    {   id:'titan_crushers', name:'Écraseurs de Titan', icon:'💪', slot:'hands', rarity:'rare', set:'titan_fortress',
        muscle:'Quadriceps',
        stats:{ STR:15, AGI:2, VIT:18, END:16, PER:3, SEN:1 },
        passive:'Force du Titan : +35% STR et VIT sur les exercices de jambes.',
        description:'Des gantelets massifs. Rien ne résiste à leur pression.',
        lore:'"Le Titan écrase tout ce qui se met en travers de sa route."' },

    {   id:'titan_cuisses', name:'Cuissardes du Titan', icon:'🦿', slot:'legs', rarity:'rare', set:'titan_fortress',
        muscle:'Fessiers',
        stats:{ STR:12, AGI:3, VIT:22, END:20, PER:4, SEN:2 },
        passive:'Marche sismique : +40% END et VIT sur squats et hip thrust.',
        description:'Des plaques d\'armure qui transforment chaque foulée en séisme.',
        lore:'"Des jambes de Titan portent le poids du monde."' },

    {   id:'focus_pendant', name:'Pendentif de Concentration', icon:'🔮', slot:'accessory', rarity:'rare', set:null,
        muscle:'Corps entier',
        stats:{ STR:5, AGI:5, VIT:5, END:8, PER:15, SEN:12 },
        passive:'Méditation en combat : +20% PER et SEN pendant les séances de plus de 20 min.',
        description:'Un pendentif qui amplifie la connexion mental-musculaire.',
        lore:'"Le muscle obéit à l\'esprit. L\'esprit obéit à la volonté."' },

    {   id:'berserker_axe', name:'Hache du Berserker', icon:'🪓', slot:'weapon', rarity:'rare', set:'iron_blood',
        muscle:'Dos',
        stats:{ STR:25, AGI:6, VIT:8, END:12, PER:4, SEN:3 },
        passive:'Rage croissante : +10% STR toutes les 10 min d\'entraînement consécutives.',
        description:'Une hache forgée dans la rage pure. Plus tu souffres, plus tu deviens fort.',
        lore:'"La douleur est temporaire. La puissance est éternelle."' },

    {   id:'regen_bracer', name:'Brassard de Régénération', icon:'💚', slot:'hands', rarity:'rare', set:null,
        muscle:'Corps entier',
        stats:{ STR:4, AGI:4, VIT:15, END:15, PER:6, SEN:8 },
        passive:'Régénération rapide : HP récupérés 25% plus vite après l\'effort.',
        description:'Un brassard médical avancé qui accélère la récupération.',
        lore:'"Guérir vite, c\'est combattre souvent."' },

    {   id:'mana_ring', name:'Anneau de Mana', icon:'💠', slot:'accessory', rarity:'rare', set:null,
        muscle:'Cardio',
        stats:{ STR:6, AGI:8, VIT:6, END:12, PER:10, SEN:18 },
        passive:'Réservoir de mana : +20% de durée sur les exercices de haute intensité.',
        description:'Un anneau imprégné d\'énergie magique qui repousse les limites.',
        lore:'"Le mana est la volonté rendue tangible."' },

    // ══════════════════════════════════════════════
    // ► RANG A — ÉPIQUES
    // ══════════════════════════════════════════════

    {   id:'titan_crown', name:'Couronne du Titan', icon:'👑', slot:'head', rarity:'epic', set:'titan_fortress',
        muscle:'Trapèzes',
        stats:{ STR:20, AGI:5, VIT:25, END:22, PER:8, SEN:5 },
        passive:'Autorité royale : tous les membres du groupe gagnent +10% END pendant ta séance.',
        description:'Forgée dans l\'acier de cinq donjons. Les rois ne portent pas de couronnes ordinaires.',
        lore:'"Je ne suis pas venu pour gagner. Je suis venu pour dominer."' },

    {   id:'titan_plate', name:'Plaques du Titan', icon:'🏰', slot:'chest', rarity:'epic', set:'titan_fortress',
        muscle:'Dos',
        stats:{ STR:18, AGI:4, VIT:30, END:28, PER:6, SEN:3 },
        passive:'Forteresse vivante : dégâts réduits de 20% · VIT +15 supplémentaire si HP > 75%.',
        description:'Une armure qui a survécu à dix assauts de monstres de Rang A.',
        lore:'"Ils ont frappé. Ils ont frappé encore. La plaque ne bougea pas."' },

    {   id:'titan_stompers', name:'Piétineurs du Titan', icon:'👢', slot:'feet', rarity:'epic', set:'titan_fortress',
        muscle:'Fessiers',
        stats:{ STR:16, AGI:6, VIT:24, END:26, PER:5, SEN:4 },
        passive:'Tremblement de terre : +50% END · chaque série de squats lourds régénère 5 VIT.',
        description:'Des bottes dont chaque foulée résonne comme un coup de tonnerre.',
        lore:'"La terre elle-même tremble quand le Titan avance."' },

    {   id:'celestial_halo', name:'Halo Céleste', icon:'😇', slot:'head', rarity:'epic', set:'celestial_hunter',
        muscle:'Corps entier',
        stats:{ STR:10, AGI:15, VIT:12, END:14, PER:25, SEN:24 },
        passive:'Bénédiction divine : +25% XP · probabilité de drop légendaire +5%.',
        description:'Un halo immatériel posé sur la tête des chasseurs bénis par le Système.',
        lore:'"Certains chasseurs ne reçoivent pas de chance. Ils la créent."' },

    {   id:'celestial_robe', name:'Robe Céleste', icon:'👘', slot:'chest', rarity:'epic', set:'celestial_hunter',
        muscle:'Cardio',
        stats:{ STR:12, AGI:18, VIT:15, END:20, PER:22, SEN:23 },
        passive:'Aura sacrée : les stats de tous les équipements +10% si SEN > 50.',
        description:'Une robe tissée de lumière astrale. Porte-la et le Système te voit.',
        lore:'"Porter la lumière, c\'est devenir une cible. Peu acceptent ce fardeau."' },

    {   id:'celestial_gloves', name:'Gants de Lumière', icon:'✋', slot:'hands', rarity:'epic', set:'celestial_hunter',
        muscle:'Épaules',
        stats:{ STR:14, AGI:16, VIT:10, END:15, PER:20, SEN:25 },
        passive:'Contact divin : +30% efficacité sur tous les exercices de saisie et traction.',
        description:'Des gants qui transforment chaque toucher en connexion avec l\'énergie cosmique.',
        lore:'"Ces mains ont touché l\'impossible et l\'ont rendu réel."' },

    {   id:'celestial_leggings', name:'Jambières de Lumière', icon:'✨', slot:'legs', rarity:'epic', set:'celestial_hunter',
        muscle:'Quadriceps',
        stats:{ STR:13, AGI:20, VIT:14, END:18, PER:21, SEN:22 },
        passive:'Pas de grâce : +40% AGI · chaque exercice complété sans skip +2 SEN permanent.',
        description:'Des jambières dont l\'éclat aveugle les adversaires.',
        lore:'"La grâce n\'est pas l\'absence de force. C\'est la force maîtrisée."' },

    {   id:'celestial_bow', name:'Arc Céleste', icon:'🏹', slot:'weapon', rarity:'epic', set:'celestial_hunter',
        muscle:'Dos',
        stats:{ STR:18, AGI:28, VIT:8, END:15, PER:30, SEN:21 },
        passive:'Tir céleste : +50% PER · chaque 100% de séance complète = +10 XP bonus.',
        description:'Un arc qui tire des flèches de lumière pure. Jamais une n\'a raté sa cible.',
        lore:'"Vise les étoiles. Même raté, tu atterris parmi elles."' },

    {   id:'phantom_blade', name:'Lame Fantôme', icon:'💫', slot:'weapon', rarity:'epic', set:'phantom_speed',
        muscle:'Épaules',
        stats:{ STR:22, AGI:35, VIT:8, END:12, PER:18, SEN:25 },
        passive:'Coup spectral : +50% AGI · attaque deux fois plus vite sur les exercices répétitifs.',
        description:'Une lame si rapide qu\'on ne la voit que dans le reflet de la douleur.',
        lore:'"Avant que tu aies vu la lame, elle est déjà passée."' },

    {   id:'void_helm', name:'Heaume du Vide', icon:'🌌', slot:'head', rarity:'epic', set:'void_walker',
        muscle:'Corps entier',
        stats:{ STR:15, AGI:15, VIT:15, END:15, PER:20, SEN:20 },
        passive:'Marche dans le vide : immunité aux débuffs de fatigue mentale.',
        description:'Un casque dont l\'intérieur contient le vide lui-même. Le porter, c\'est devenir le vide.',
        lore:'"Dans le vide, il n\'y a pas de douleur. Seulement la progression."' },

    {   id:'void_armor', name:'Armure du Vide', icon:'🕳️', slot:'chest', rarity:'epic', set:'void_walker',
        muscle:'Corps entier',
        stats:{ STR:18, AGI:12, VIT:20, END:22, PER:16, SEN:12 },
        passive:'Absorption du vide : chaque set complété sans repos récupère 3 END.',
        description:'Une armure qui absorbe les impacts et les convertit en énergie pure.',
        lore:'"Le vide ne détruit pas. Il transforme."' },

    {   id:'void_claws', name:'Griffes du Vide', icon:'🖐️', slot:'hands', rarity:'epic', set:'void_walker',
        muscle:'Avant-bras',
        stats:{ STR:25, AGI:18, VIT:10, END:16, PER:14, SEN:17 },
        passive:'Lacération : +40% STR et AGI combinés sur les exercices de tirage.',
        description:'Des griffes arrachées à une créature du vide. Absolument tranchantes.',
        lore:'"Ces griffes ne griffent pas. Elles déchirent le possible."' },

    {   id:'void_ring', name:'Anneau du Vide', icon:'🌀', slot:'accessory', set:'void_walker',
        rarity:'epic', muscle:'Corps entier',
        stats:{ STR:12, AGI:12, VIT:18, END:18, PER:22, SEN:28 },
        passive:'Singularité : si tous les slots sont équipés, +20% à tous les stats.',
        description:'Un anneau qui crée un vortex d\'énergie autour de son porteur.',
        lore:'"L\'anneau attire le vide. Le vide attire la puissance."' },

    {   id:'arcane_greaves', name:'Jambières Arcaniques', icon:'🧿', slot:'legs', rarity:'epic', set:null,
        muscle:'Ischio-jambiers',
        stats:{ STR:15, AGI:22, VIT:18, END:24, PER:16, SEN:15 },
        passive:'Runes de puissance : +30% END · les exercices d\'ischio augmentent PER de 2 en permanence.',
        description:'Gravées de runes anciennes. Chaque rune représente un donjon conquis.',
        lore:'"Les runes ne mentent pas. Elles racontent tes batailles."' },

    {   id:'dragon_scale_boots', name:'Bottes d\'Écaille de Dragon', icon:'🐉', slot:'feet', rarity:'epic', set:null,
        muscle:'Mollets',
        stats:{ STR:14, AGI:28, VIT:16, END:20, PER:12, SEN:10 },
        passive:'Agilité du dragon : +50% AGI sur les exercices pliométriques et sauts.',
        description:'Forgées d\'écailles d\'un dragon de Rang A. Légèreté d\'une plume, résistance d\'un rocher.',
        lore:'"Le dragon ne court pas. Il vole. Ces bottes t\'apprennent à voler."' },

    {   id:'soul_chain', name:'Chaîne de l\'Âme', icon:'⛓️', slot:'accessory', rarity:'epic', set:null,
        muscle:'Corps entier',
        stats:{ STR:20, AGI:10, VIT:20, END:25, PER:18, SEN:22 },
        passive:'Lien d\'âme : +25% à tous les stats si la séance dure plus de 45 minutes.',
        description:'Une chaîne forgée à partir d\'une âme de monstre S. Vibre au rythme de ton cœur.',
        lore:'"Porte cette chaîne. Elle te lie à ta propre limite."' },

    // ══════════════════════════════════════════════
    // ► RANG S — LÉGENDAIRES
    // ══════════════════════════════════════════════

    {   id:'shadow_crown', name:'Couronne du Monarque des Ombres', icon:'🌑', slot:'head', rarity:'legendary', set:'shadow_monarch',
        muscle:'Corps entier',
        stats:{ STR:40, AGI:35, VIT:30, END:32, PER:38, SEN:35 },
        passive:'Domination absolue : STR et AGI +50% · immunité aux debuffs · les ombres obéissent.',
        description:'La couronne du premier chasseur à avoir dominé seul un donjon de Rang National.',
        lore:'"Je me lève seul. Je combats seul. Je vaincrai seul. Tel est l\'ordre du Système."' },

    {   id:'arise_sword', name:'Épée de l\'Éveil — ARISE', icon:'🗡️', slot:'weapon', rarity:'legendary', set:'shadow_monarch',
        muscle:'Pectoraux',
        stats:{ STR:60, AGI:30, VIT:20, END:25, PER:35, SEN:30 },
        passive:'ARISE : invoque une armée d\'ombres · +100% STR pendant 30 secondes 1×/séance.',
        description:'L\'arme légendaire du Monarque des Ombres. Ceux qu\'elle frappe deviennent ses soldats.',
        lore:'"ARISE. Le seul mot qui fait trembler les dieux."' },

    {   id:'hunters_will', name:'Testament du Chasseur', icon:'📜', slot:'accessory', rarity:'legendary', set:null,
        muscle:'Corps entier',
        stats:{ STR:25, AGI:25, VIT:25, END:35, PER:35, SEN:45 },
        passive:'Volonté indomptable : ne peut jamais abandonner · END et SEN infinies en fin de séance.',
        description:'Un parchemin qui contient la volonté du premier chasseur Rang S de l\'histoire.',
        lore:'"Ce parchemin ne raconte pas son histoire. Il devient la tienne."' },

    {   id:'monarch_ring', name:'Anneau du Monarque', icon:'💍', slot:'accessory', rarity:'legendary', set:null,
        muscle:'Corps entier',
        stats:{ STR:30, AGI:30, VIT:35, END:30, PER:30, SEN:45 },
        passive:'Autorité absolue : +30% à TOUS les stats · drop rate augmenté de 10%.',
        description:'Le symbole ultime du pouvoir. Un seul anneau pour les gouverner tous.',
        lore:'"Porter cet anneau, c\'est accepter le fardeau de la puissance."' },

    {   id:'iron_body_armor', name:'Armure du Corps de Fer', icon:'🏗️', slot:'chest', rarity:'legendary', set:'iron_blood',
        muscle:'Dos',
        stats:{ STR:50, AGI:10, VIT:45, END:50, PER:15, SEN:10 },
        passive:'Corps de fer : PV ne peuvent descendre sous 1 · END régénérée automatiquement.',
        description:'Une armure forgée pendant 10 ans dans le feu de l\'entraînement pur.',
        lore:'"Ce n\'est pas de l\'acier. C\'est de la souffrance cristallisée."' },

    {   id:'dragon_sovereign_helm', name:'Heaume du Dragon Souverain', icon:'🐲', slot:'head', rarity:'legendary', set:null,
        muscle:'Trapèzes',
        stats:{ STR:35, AGI:20, VIT:40, END:38, PER:30, SEN:37 },
        passive:'Rugissement du dragon : STR +80% pendant 15 sec · 1× par séance si exercice > 5 reps.',
        description:'La tête d\'un dragon de niveau National fondue en heaume. Seul un Rang S peut le porter.',
        lore:'"Le dragon ne demande pas la permission. Il prend ce qu\'il veut."' },

    {   id:'speed_of_light', name:'Pas de Lumière', icon:'⚡', slot:'feet', rarity:'legendary', set:'phantom_speed',
        muscle:'Mollets',
        stats:{ STR:20, AGI:70, VIT:15, END:25, PER:40, SEN:30 },
        passive:'Vitesse de la lumière : AGI ×3 pendant 10 sec · peut traverser des obstacles (symbolique).',
        description:'Des bottes imprégnées de la vitesse de la lumière elle-même.',
        lore:'"Quand tu portes ces bottes, tu n\'es plus un chasseur. Tu es la vitesse."' },

    {   id:'system_gauntlets', name:'Gantelets du Système', icon:'💻', slot:'hands', rarity:'legendary', set:null,
        muscle:'Corps entier',
        stats:{ STR:45, AGI:40, VIT:30, END:35, PER:45, SEN:55 },
        passive:'Accès Système : analyse en temps réel · tous les stats +40% · drop rate doublé.',
        description:'Les gantelets portés par l\'administrateur du Système lui-même.',
        lore:'"Le Système n\'est pas ton ennemi. Il est ton outil. Ces gantelets en sont la preuve."' },

    {   id:'sovereign_legs', name:'Jambières du Souverain', icon:'🦾', slot:'legs', rarity:'legendary', set:null,
        muscle:'Quadriceps',
        stats:{ STR:30, AGI:35, VIT:40, END:45, PER:28, SEN:32 },
        passive:'Frappe souveraine : +60% END et VIT · chaque squat = 2× les bénéfices normaux.',
        description:'Les jambières du roi des donjons. Forgées sous la pression de mille entraînements.',
        lore:'"Les jambes d\'un souverain ne se fatiguent jamais. La volonté les porte."' },

    {   id:'eternity_necklace', name:'Collier de l\'Éternité', icon:'🌟', slot:'accessory', rarity:'legendary', set:null,
        muscle:'Corps entier',
        stats:{ STR:28, AGI:28, VIT:35, END:40, PER:38, SEN:51 },
        passive:'Éternité : +50% XP permanent · impossible d\'échouer une séance si porté.',
        description:'Un collier qui défie le temps. Porté par les légendes, transmis aux dignes.',
        lore:'"Ce collier a été porté par dix-sept chasseurs. Tous sont devenus Rang S."' },

    // ══════════════════════════════════════════════
    // ► CONSOMMABLES SPÉCIAUX (drop ultra-rare)
    // ══════════════════════════════════════════════

    {   id:'tome_of_awakening', name:'Tome de l\'Éveil', icon:'📜', slot:'consumable', rarity:'legendary', set:null,
        muscle:'Corps entier', consumable:true,
        stats:{ STR:0, AGI:0, VIT:0, END:0, PER:0, SEN:0 },
        passive:'Permet de changer de classe une fois. Détruit à l\'usage.',
        description:'Un parchemin ancien gravé dans une langue oubliée. Le Système le délivre rarement.',
        lore:'"Le Système ne change pas ses choix. Sauf si tu lui en donnes une raison."' },
];

// ── HELPERS ─────────────────────────────────────────────────────────
function getItemById(id)          { return EQUIPMENT_DATABASE.find(i => i.id === id) || null; }
function getItemsByMuscle(muscle) { return EQUIPMENT_DATABASE.filter(i => i.muscle === muscle || i.muscle === 'Corps entier'); }
function getSetById(id)           { return EQUIPMENT_SETS[id] || null; }
function getRarityInfo(rarityId)  { return RARITIES[rarityId] || RARITIES.common; }
