// ═══════════════════════════════════════════════════════════════════
// Awakened — Moteur d'Événements Narratifs « Le Monde qui s'efface »
// ═══════════════════════════════════════════════════════════════════
// Un seul moteur pour TOUS les événements d'histoire :
//   - rencontres de compagnons
//   - dialogues Esen / Nyra (les deux héros)
//   - petits faits amusants
//   - moments d'ambiance du Système
// Chaque événement = { id, type, trigger, content, once }
// Affichage unifié en overlay, avec image optionnelle.
// 100% local. Anti-doublon via localStorage.
// ═══════════════════════════════════════════════════════════════════
(function() {
'use strict';

// ── PERSONNAGES (référence pour couleurs/images) ───────────────────
const STORY_CHARS = {
    systeme: { name: 'Le Système', color: '#4ade80', image: null },
    esen:    { name: 'Esen',  color: '#4ade80', image: null },   // le silencieux (image à fournir)
    nyra:    { name: 'Nyra',  color: '#a855f7', image: null },   // la joueuse (image à fournir)
    // jamais nommé avant la scène « Le Nom »
    nabdano: { get name() { return storyEventSeen('evt_n35_ambiance_nabdano_nom') ? 'Nabdano' : '???'; }, color: '#cbd5e1', image: null },
    // compagnons (images déjà en place)
    marcus:  { name: 'Marcus Ironfist', color: '#ef4444', image: 'images/companions/marcus.webp' },
    kira:    { name: 'Kira Shadowstep', color: '#a855f7', image: 'images/companions/kira.webp' },
    chen:    { name: 'Maître Chen',     color: '#06b6d4', image: 'images/companions/chen.webp' },
    elise:   { name: 'Élise Vorn',      color: '#22c55e', image: 'images/companions/elise.webp' },
    yuna:    { name: 'Yuna Veilbreaker',color: '#3b82f6', image: 'images/companions/yuna.webp' },
    marchand:{ name: 'Le Marchand', color: '#fbbf24', image: 'images/story/marchand.webp' }
};

// ── REGISTRE DES ÉVÉNEMENTS ────────────────────────────────────────
// type : 'rencontre' | 'fait' | 'ambiance' | 'dialogue'
// trigger : objet décrivant la condition (évalué par storyEventEligible)
//   { kind:'workouts', value:N } | { kind:'level', value:N }
//   { kind:'rank', value:'D' }   | { kind:'rifts', value:N }
//   { kind:'always' } (pour test/aléatoire)
// content : { speaker:'<charId>', title, pages:[...], image:'<override>' }
// once : true = ne s'affiche qu'une fois (défaut true)
const STORY_EVENTS = [
    {
        id: 'evt_test_systeme',
        type: 'ambiance',
        trigger: { kind: 'workouts', value: 1 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Première Trace',
            image: 'images/story/monde_efface.webp',
            pages: [
                "Tu as bougé. Le monde l'a senti.",
                "C'est infime. Une vibration dans le silence blanc. Mais le Système la consigne : tu existes encore."
            ]
        }
    },
    {
        id: 'evt_rencontre',
        type: 'rencontre',
        trigger: { kind: 'level', value: 2 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'La Rencontre',
            image: 'images/story/rencontre_1.webp',
            pageImages: [
                'images/story/rencontre_1.webp',
                'images/story/rencontre_2.webp',
                'images/story/rencontre_3.webp',
                'images/story/rencontre_4.webp',
                'images/story/rencontre_5.webp',
                'images/story/rencontre_6.webp',
                'images/story/rencontre_7.webp',
                'images/story/rencontre_8.webp'
            ],
            pages: [
                "Un monstre file dans une rue ordinaire. Quelqu'un le pourchasse, vive et acharnée. Elle l'a presque…",
                "Une silhouette calme surgit. Un seul geste net. Le monstre se dissout en fumée avant qu'elle ne l'atteigne.",
                "Elle s'arrête net. Lui baisse à peine les yeux sur ce qu'il reste. Vos regards se croisent pour la première fois.",
                "« C'était MON monstre ! Je l'avais ! » Il hausse une épaule. « Il allait s'échapper. » « ...T'es du genre agaçant, toi. »",
                "Pas le temps de se chamailler : d'autres monstres surgissent dans la rue. D'instinct, ils se placent dos à dos.",
                "Un monstre bien plus gros fend la rue. Fini de jouer. Ils s'élancent ensemble, parfaitement synchrones.",
                "Au même instant — son poing, sa lame. Le monstre explose en fumée. Un silence. Ils se regardent, essoufflés.",
                "« ...Pas mal, le silencieux. » Esen esquisse le plus petit des demi-sourires. « On survit mieux à deux. — Moi c'est Nyra. » Le Système consigne, froid : « Deux Ancres. Vos signaux se renforcent quand vous êtes proches. Curieux. » À partir d'ici, vous ne marcherez plus seuls."
            ]
        }
    },
    // ── 🎯 JALONS RÉELS : l'histoire réagit à ce que le joueur FAIT (série, séances).
    // Placés en tête du registre pour n'être jamais bloqués par une porte narrative.
    {
        id: 'evt_serie_7',
        type: 'fait',
        trigger: { kind: 'streak', value: 7 },
        condition: function () { return storyEventSeen('evt_rencontre'); },
        once: true,
        content: {
            speaker: 'nyra',
            title: "Les Encoches",
            pages: [
                "Nyra a commencé à faire des encoches sur un lampadaire. Une par jour d'entraînement. Il y en a sept.",
                "« C'est pas pour nous, » dit-elle en gravant la dernière. « C'est pour lui. » Elle montre le blanc, au loin. « Qu'il les compte. »",
                "Esen regarde le lampadaire sans rien dire. Le lendemain, il y a une huitième encoche, plus nette que les autres. Personne n'avoue."
            ]
        }
    },
    {
        id: 'evt_seances_100',
        type: 'ambiance',
        trigger: { kind: 'workouts', value: 100 },
        condition: function () { return storyEventSeen('evt_rencontre'); },
        once: true,
        content: {
            speaker: 'systeme',
            title: "Cent",
            pages: [
                "« Cent séances, » affiche le Système.",
                "« Je les ai toutes gardées. Pas les chiffres : les moments. Le jour où tu as failli rester couché. Celui où tu as tout donné pour rien de spécial. »",
                "« Quelqu'un, avant toi, en a fait des milliers. Personne ne les comptait avec lui. »",
                "Un temps. « Toi, tu n'auras pas ce problème. »"
            ]
        }
    },
    {
        id: 'evt_serie_30',
        type: 'ambiance',
        trigger: { kind: 'streak', value: 30 },
        condition: function () { return storyEventSeen('evt_rencontre'); },
        once: true,
        content: {
            speaker: 'systeme',
            title: "Confiance",
            pages: [
                "« Trente jours, » affiche le Système.",
                "« J'ai cessé de vérifier chaque matin si tu allais revenir. Je ne sais pas quand c'est arrivé. »",
                "Un temps. « Je crois que c'est ce que vous appelez la confiance. »",
                "Cette nuit-là, la voix ne vient pas te chercher. Elle sait qu'elle perdrait son temps."
            ]
        }
    },
    {
        id: 'evt_seances_250',
        type: 'dialogue',
        trigger: { kind: 'workouts', value: 250 },
        condition: function () { return storyEventSeen('evt_rencontre'); },
        once: true,
        content: {
            speaker: 'esen',
            title: "Les Lacets",
            pages: [
                "Esen lace ses chaussures. Encore. Nyra s'assoit à côté de lui et fait pareil.",
                "« Deux cent cinquante, » annonce le Système. Nyra ne lève pas les yeux. « Il y a des jours où c'est facile, pour toi ? »",
                "Esen réfléchit. « Non. »",
                "« Moi non plus. » Elle serre son dernier nœud. « Tant mieux. Si c'était facile, ça ne voudrait rien dire. »",
                "Vous vous levez en même temps."
            ]
        }
    },
    {
        // ── Niveau ~3 : la dynamique du duo s'installe (suite directe de La Rencontre)
        id: 'evt_n3_regles_duo',
        type: 'dialogue',
        trigger: { kind: 'xp', level: 3, frac: 0.15 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'Les Règles du Duo',
            image: 'images/story/n3_regles_duo.webp',
            pages: [
                "Nyra marche à reculons devant Esen, doigt levé. « Puisqu'on fait équipe maintenant, on pose des règles. Règle numéro un : on ne vole PAS les monstres des autres. »",
                "Esen, sans ralentir : « Il allait s'échapper. » Nyra plisse les yeux. « Règle numéro deux : on ne REPARLE PLUS de ça. »",
                "« Règle numéro trois, » continue-t-elle en tapotant le logo AV sur sa tenue, « on s'entraîne TOUS LES JOURS. Le Système nous a choisis, pas question de rouiller. »",
                "Esen hoche la tête, une seule fois. Venant de lui, c'est un discours entier. Le duo a ses règles. Et désormais, une direction commune."
            ]
        }
    },
    {
        // Niveau ~3 : rencontre du Marchand (introduit l'echoppe itinerante)
        id: 'evt_n3_marchand',
        type: 'rencontre',
        trigger: { kind: 'level', value: 3 },
        once: true,
        content: {
            speaker: 'marchand',
            title: "L'Échoppe Itinérante",
            image: 'images/story/marchand.webp',
            pages: [
                "Au détour d'une rue, une échoppe a poussé là où il n'y avait rien la veille. Lanternes ambrées, étagères croulant sous les haltères, les bandes, les fioles luisantes. Un homme souriant s'y tient, bras croisés.",
                "« Tiens… deux Ancres toutes neuves. » Il écarte les bras vers son bazar. « Bienvenue. On m'appelle Le Marchand. C'est pratique : il faut bien qu'on m'appelle quelque chose. »",
                "Nyra fronce les sourcils. « Tu vends quoi, au juste ? » Il sourit. « Tout ce qui rend plus fort. De l'équipement, des potions, et surtout… j'achète. »",
                "Il pointe les éclats brillants tombés des Failles que vous avez fermées. « Ces minéraux que vous ramassez sans y penser ? De l'or, entre de bonnes mains. Les miennes. Apportez-les-moi, je les transforme en pouvoir. »",
                "Nyra le dévisage. « Et toi, t'es qui, en vrai ? » Le sourire du Marchand vacille une seconde. « Aucune idée. » Il hausse les épaules, presque léger. « Mais tant que quelqu'un achète quelque chose chez moi… je suppose que j'existe encore. »",
                "Esen examine une lame à l'aura violette, silencieux. Le Marchand glisse : « Le silencieux a bon goût. Reviens quand ta bourse suivra. » Il tapote son comptoir gravé du logo AV. « Mon échoppe est à vous, désormais. Faille après Faille, je serai là. »"
            ]
        }
    },
    {
        // ── Niveau ~4 : worldbuilding — apprendre à sentir les Failles
        id: 'evt_n4_sentir_failles',
        type: 'fait',
        trigger: { kind: 'xp', level: 4, frac: 0.4 },
        once: true,
        content: {
            speaker: 'esen',
            title: 'Sentir les Failles',
            image: 'images/story/n4_sentir_failles.webp',
            pages: [
                "Esen s'arrête au milieu du trottoir. « Regarde. » Nyra fronce les sourcils. Rien. Juste la rue, les passants, un lampadaire.",
                "« L'air, au-dessus de la borne. Il tremble. Comme au-dessus d'un feu. » Il a raison. Une distorsion minuscule, presque rien.",
                "« Les Failles commencent toutes comme ça. Les gens passent à côté sans les voir. Nous, on les sent. » Il la regarde. « Plus on s'entraîne, plus notre signal est net — et plus on les repère tôt. »",
                "« C'est le travail des AV. Trouver. Fermer. Avant que ça grandisse. » Il repart comme si de rien n'était. La distorsion, elle, est restée gravée dans sa tête."
            ]
        }
    },
    {
        // ── Niveau ~5 : première vraie morsure de l'effacement (mélancolique)
        id: 'evt_n5_boulangerie',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 5, frac: 0.65 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'La Boulangerie',
            image: 'images/story/n5_boulangerie.webp',
            pages: [
                "Nyra traîne Esen dans une petite boulangerie. « Meilleurs croissants de la ville. La dame me connaît, tu vas voir. »",
                "La vendeuse lève les yeux. Sourire poli. « Bonjour. Qu'est-ce que je vous sers ? » Le sourire de Nyra se fige un quart de seconde.",
                "« ...Deux croissants, » dit-elle d'une voix un peu plus basse. Dehors, elle hausse les épaules. « Elle a dû me confondre. Elle voit du monde. » Personne ne la contredit.",
                "Esen attend qu'elle soit devant, hors de portée de voix, et murmure pour lui-même : « Ça a commencé pour elle aussi. » Il croque dans son croissant. « C'est pour ça qu'on s'entraîne. »"
            ]
        }
    },
    {
        id: 'evt_n6_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', level: 6, frac: 0.3 },
        once: true,
        content: { speaker: 'nyra', title: 'Concentration ?', image: 'images/story/cocasse_7.webp',
            pages: ["Nyra étire la joue d'Esen pendant qu'il frappe le sac. « Quoi ? Je teste ta concentration ! »"] }
    },
    {
        id: 'evt_n7_fait_nyra',
        type: 'fait',
        trigger: { kind: 'xp', level: 7, frac: 0.3 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'Pari Stupide',
            image: 'images/story/n7_pari.webp',
            pages: [
                "Nyra lance un regard en coin à Esen pendant l'échauffement. « Pari : tu lâches avant moi aujourd'hui. »",
                "Esen, sans lever les yeux : « Elle dit ça à chaque fois. » Un silence. « Elle a perdu à chaque fois. »",
                "Nyra fait mine d'être vexée, mais elle sourit. Dans un monde qui s'efface, c'est sa façon à elle de rester accrochée : transformer la survie en jeu."
            ]
        }
    },
    // ════════════════════════════════════════════════════════════════
    // FRAGMENTS D'OUBLI PERSONNEL
    // L'Oubli reste abstrait tant qu'il n'efface que « le monde ».
    // Ces scènes le rendent intime : une chanson, une chambre, un nom.
    // Le joueur ne sauve plus « un monde » — il empêche des choses qui
    // ont compté de devenir comme si elles n'avaient jamais existé.
    // ════════════════════════════════════════════════════════════════
    {
        id: 'evt_oubli_chanson',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 8, frac: 0.3 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'La Chanson',
            pages: [
                "Nyra fredonne en marchant. Un air simple, un peu triste, qu'elle connaît manifestement par cœur.",
                "« C'est quoi ? » demande Esen.",
                "Elle ouvre la bouche. La referme. S'arrête au milieu du trottoir.",
                "« Je… connais chaque parole. » Sa voix est plus basse que d'habitude. « Mais je ne sais plus qui me l'a apprise. »",
                "Elle demande à un passant. Puis à un deuxième. Puis à une femme qui attend le bus. Aucun des trois ne l'a jamais entendue.",
                "« Alors soit je l'ai inventée… » Elle hausse les épaules, mais son sourire ne monte pas jusqu'aux yeux. « …soit je suis la dernière à la connaître. »",
                "Elle recommence à fredonner. Plus fort qu'avant."
            ]
        }
    },
    {
        id: 'evt_n8_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', level: 8, frac: 0.55 },
        once: true,
        content: { speaker: 'esen', title: 'Poids Supplémentaire', image: 'images/story/cocasse_6.webp',
            pages: ["Esen s'est assis sur le dos de Nyra en pleine pompe, sirotant tranquillement. « Tranquille... t'es qu'une machine. »"] }
    },
    {
        id: 'evt_n9_ambiance_oubli',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 9, frac: 0.55 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Ce qui manque',
            pages: [
                "Le Système hésite, puis affiche : « Question. Te souviens-tu du nom de la rue où tu as grandi ? »",
                "Tu cherches. Le mot est là, tout proche... et pourtant il glisse, comme de l'eau entre les doigts.",
                "« C'est normal, » dit le Système, presque doux. « Le monde s'efface par les bords. Les noms partent en premier. Continue de bouger. Tant que tu bouges, tu gardes le tien. »"
            ]
        }
    },
    {
        id: 'evt_n10_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', level: 10, frac: 0.8 },
        once: true,
        content: { speaker: 'nyra', title: 'Patatrac', image: 'images/story/cocasse_3.webp',
            pages: ["Esen trébuche en plein combat. Nyra éclate de rire en finissant le monstre à sa place. « AHAHAHA ! »"] }
    },
    {
        id: 'evt_n11_dialogue_duo',
        type: 'dialogue',
        trigger: { kind: 'xp', level: 11, frac: 0.8 },
        once: true,
        content: {
            speaker: 'esen',
            title: 'Deux Silences',
            image: 'images/story/n11_deux_silences.webp',
            pages: [
                "Après l'effort, vous restez assis sans parler. Esen regarde le vide blanc au loin.",
                "« Tu te demandes pourquoi on continue, » dit Nyra. Ce n'est pas une question.",
                "Esen met du temps à répondre. « Non. Je me demande ce qui se passerait si l'un de nous arrêtait. »",
                "Nyra ne rit pas, cette fois. « Alors arrête de te poser la question. Et moi j'arrêterai de me la poser aussi. » Marché conclu, sans serrer la main."
            ]
        }
    },
    {
        id: 'evt_n12_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', level: 12, frac: 0.2 },
        once: true,
        content: { speaker: 'nyra', title: 'Festin Mérité', image: 'images/story/cocasse_2.webp',
            pages: ["Après la séance, ils s'effondrent devant une montagne de nourriture. « Mmmh, trop bon ! » Nyra ne mâche même plus."] }
    },
    {
        id: 'evt_n13_fait_systeme',
        type: 'fait',
        trigger: { kind: 'xp', level: 13, frac: 0.2 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Statistique Inutile',
            pages: [
                "Le Système affiche soudain : « Information : tu as soulevé, poussé ou déplacé l'équivalent du poids d'un petit immeuble depuis ton éveil. »",
                "Un court silence. « Cette donnée n'a aucune utilité tactique. Je voulais juste que tu le saches. »",
                "Tu jurerais presque que le Système est... fier ?"
            ]
        }
    },
    {
        id: 'evt_n14_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', level: 14, frac: 0.45 },
        once: true,
        content: { speaker: 'nyra', title: 'Attrape-moi', image: 'images/story/cocasse_1.webp',
            pages: ["« Attrape-moi si tu peux ! » Esen file devant. Nyra le poursuit dans toute la ville. « ESEN, T'ES MORT !! »"] }
    },
    {
        id: 'evt_n15_ambiance_traces',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 15, frac: 0.45 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Des Pas Anciens',
            image: 'images/story/traces.webp',
            pages: [
                "Dans une Faille, tu remarques des marques au sol. Des traces de pas, profondes, sûres. Quelqu'un de puissant est passé ici. Avant.",
                "Elles s'arrêtent net au milieu du néant. Comme si la personne s'était simplement... assise. Et n'était jamais repartie.",
                "Le Système reste silencieux un long moment. Puis : « Ne regarde pas trop longtemps ces traces. Avance. »"
            ]
        }
    },
    {
        id: 'evt_oubli_chambre',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 15, frac: 0.55 },
        once: true,
        content: {
            image: 'images/story/monde_efface.webp',
            speaker: 'esen',
            title: 'La Chambre',
            pages: [
                "Une porte entrouverte, au premier étage. Esen s'arrête.",
                "À l'intérieur : un lit fait au carré. Des livres alignés. Une tasse posée sur la table de nuit, propre, comme si on l'avait rincée le matin même.",
                "La propriétaire monte les marches derrière eux. « Ah, celle-là ? Elle est libre. »",
                "« Depuis quand ? » demande Nyra.",
                "La femme réfléchit. Vraiment. « Depuis toujours, je crois. »",
                "Elle entre, redresse un coussin qui n'en avait pas besoin, referme doucement.",
                "« Vous l'entretenez pourtant, » remarque Esen.",
                "Elle hésite. « Je ne sais pas pourquoi. » Un temps. « Ça me semblerait impoli de la laisser prendre la poussière. »"
            ]
        }
    },
    {
        id: 'evt_n16_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', level: 16, frac: 0.7 },
        once: true,
        content: { speaker: 'esen', title: 'Petit Conseil', image: 'images/story/cocasse_4.webp',
            pages: ["Assis dans l'herbe, Esen pointe le front de Nyra du doigt. « La prochaine fois, réfléchis avant de foncer. » Elle boude."] }
    },
    {
        id: 'evt_n17_fait_nyra',
        type: 'fait',
        trigger: { kind: 'xp', level: 17, frac: 0.7 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'Collection de Cailloux',
            pages: [
                "Nyra montre à Esen une poignée de petits cailloux luisants. « À chaque Faille fermée, j'en garde un. »",
                "« C'est idiot, je sais. Mais quand un endroit s'efface, il ne reste rien. Alors moi, je garde une preuve qu'il a existé. »",
                "Elle en glisse un dans la main d'Esen sans le regarder. « Tiens. Celui-là, c'est pour la fois où tu as failli abandonner et où tu ne l'as pas fait. »"
            ]
        }
    },
    {
        id: 'evt_n18_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', level: 18, frac: 0.15 },
        once: true,
        content: { speaker: 'nyra', title: 'Toute ta Puissance ?', image: 'images/story/cocasse_5.webp',
            pages: ["Nyra nargue Esen après un combat. « Alors... c'est ça toute ta puissance ? » Esen, blasé : « ... »"] }
    },
    {
        id: 'evt_n19_ambiance_systeme',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 19, frac: 0.15 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Aveu à Demi-Mot',
            pages: [
                "« Je vais te dire quelque chose que je ne devrais pas, » affiche le Système.",
                "« Je ne suis pas infini. Chaque jour où tu ne bouges pas, je deviens plus faible. Plus pâle. »",
                "« Ce n'est pas un reproche. C'est juste... une vérité que je porte seul depuis longtemps. »"
            ]
        }
    },
    {
        id: 'evt_n20_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', level: 20, frac: 0.4 },
        once: true,
        content: { speaker: 'systeme', title: 'Bivouac', image: 'images/story/repos_avant_faille.webp',
            pages: ["La nuit, près du feu, face à une Faille lointaine. Personne ne parle. Pour une fois, le silence est doux."] }
    },
    {
        id: 'evt_n21_dialogue_duo',
        type: 'dialogue',
        trigger: { kind: 'xp', level: 21, frac: 0.4 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'La Question',
            image: 'images/story/n21_question.webp',
            pages: [
                "« Tu crois qu'on s'en sortira ? » demande Nyra, pour une fois sans ironie.",
                "Esen réfléchit. « Je crois qu'on tiendra. C'est déjà ça. »",
                "« Pas la même chose, » murmure-t-elle.",
                "« Non, » admet Esen. « Mais c'est ce qu'on a. » Et étrangement, ça suffit à Nyra pour sourire de nouveau."
            ]
        }
    },
    {
        id: 'evt_oubli_nom_mari',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 21, frac: 0.8 },
        once: true,
        content: {
            image: 'images/story/face_effacement.webp',
            speaker: 'esen',
            title: 'Cinquante-Trois Ans',
            pages: [
                "« Vous ! » Une vieille femme agrippe la manche d'Esen. « Vous m'aviez aidée avec mes courses, l'an dernier. Le sac s'était déchiré devant la pharmacie. »",
                "Esen hoche la tête. Il s'en souvient.",
                "Elle parle. De la pluie ce jour-là. De son immeuble sans ascenseur. De son mariage — cinquante-trois ans, tout de même.",
                "« Il détestait les parapluies. Il disait que c'était pour les gens pressés. Il rentrait trempé, il riait, et moi je— »",
                "Elle s'arrête au milieu de la phrase.",
                "Elle cherche. On voit qu'elle cherche.",
                "« Comment il s'appelait, déjà ? »",
                "Un silence. Puis elle sourit, gênée, en tapotant la main d'Esen. « Vous devez me trouver bête. »",
                "Esen ne répond pas. Il connaît ce silence-là."
            ]
        }
    },
    {
        id: 'evt_n22_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', level: 22, frac: 0.65 },
        once: true,
        content: { speaker: 'esen', title: 'Elle ne Ralentit Jamais', image: 'images/story/cocasse_8.webp',
            pages: ["Nyra court sur le tapis, infatigable. Esen la regarde, les mains dans les poches. Il ne le dira jamais, mais il l'admire."] }
    },
    {
        id: 'evt_n23_fait_leger',
        type: 'fait',
        trigger: { kind: 'xp', level: 23, frac: 0.65 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'Concours de Grimaces',
            image: 'images/story/n23_grimaces.webp',
            pages: [
                "Avant un combat tendu, Nyra fait une grimace ridicule à Esen. « Règle numéro un : on ne meurt pas en ayant l'air sérieux. »",
                "Même Esen laisse échapper quelque chose qui ressemble dangereusement à un rire.",
                "Le Système, déconcerté : « Vos signaux de stress viennent de chuter de 40%. Je ne comprends pas la méthode. Mais elle fonctionne. »"
            ]
        }
    },
    {
        id: 'evt_n25_ambiance_oubli',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 25, frac: 0.3 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Plus Dense',
            pages: [
                "« Analyse : ta présence est devenue plus... dense, » affiche le Système. « Le monde a plus de mal à t'effacer qu'avant. »",
                "« Les choses auxquelles tu tiens reviennent, parfois. Une odeur. Un visage. Un nom que tu croyais perdu. »",
                "« C'est ça, devenir une Ancre. Tu ne te contentes plus de résister. Tu commences à ramener ce qui était parti. »"
            ]
        }
    },
    // ── ESEN & NYRA : ce qu'ils ne disent pas ────────────────────────
    // Pas d'histoire d'origine. Juste ce qui explique leur manière d'être.
    {
        id: 'evt_esen_peur_souvenir',
        type: 'dialogue',
        trigger: { kind: 'xp', level: 25, frac: 0.2 },
        once: true,
        content: {
            image: 'images/story/dos_a_dos.webp',
            speaker: 'esen',
            title: 'Ce Qu\'il Ne Veut Pas Retrouver',
            pages: [
                "« Tu ne parles jamais de ce que tu as oublié, » dit Nyra. Ce n'est pas une question.",
                "Esen regarde ses mains un long moment.",
                "« Tout le monde a peur d'oublier, » finit-il par dire.",
                "« Et toi ? »",
                "« Moi j'ai peur que ça revienne. »",
                "Nyra ne plaisante pas. Pour une fois, elle attend.",
                "« S'il y avait quelqu'un… » Il s'interrompt. « Tant que je ne me souviens pas, je ne l'ai pas perdu. Je l'ai juste… rangé quelque part. »",
                "« C'est pas pareil, Esen. »",
                "« Je sais. » Il se remet en marche. « C'est pour ça que je continue. Un jour il faudra bien que je sois assez solide pour me souvenir. »"
            ]
        }
    },
    {
        id: 'evt_n27_dialogue_esen',
        type: 'dialogue',
        trigger: { kind: 'xp', level: 27, frac: 0.55 },
        once: true,
        content: {
            speaker: 'esen',
            title: 'Ce qu\'Esen Garde',
            image: 'images/story/n27_photo_esen.webp',
            pages: [
                "Nyra surprend Esen, seul, fixant une vieille photo à moitié effacée. Le visage dessus a disparu.",
                "« Je ne sais plus qui c'était, » dit-il sans se retourner. « Mais je sais que je tenais à cette personne. Alors je garde la photo. »",
                "« C'est pour ça que je m'entraîne. Pas pour moi. Pour ne plus jamais laisser un visage s'effacer. »",
                "C'est la phrase la plus longue qu'elle l'ait jamais entendu prononcer."
            ]
        }
    },
    {
        id: 'evt_n29_ambiance_nabdano',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 29, frac: 0.8 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Une Inscription',
            image: 'images/story/inscription_nabdano.webp',
            pages: [
                "Sur un mur de Faille, une phrase gravée d'une main qui tremblait : « J'étais le plus fort. J'ai porté le monde. »",
                "Et en dessous, plus profond, comme arraché : « Et un jour, je l'ai posé. »",
                "Le Système, d'une voix que tu ne lui connaissais pas : « ...Continue. Il vaut mieux que tu sois plus fort avant de comprendre qui a écrit ça. »"
            ]
        }
    },
    {
        id: 'evt_nyra_sans_blague',
        type: 'dialogue',
        trigger: { kind: 'xp', level: 30, frac: 0.45 },
        once: true,
        content: {
            image: 'images/story/n11_deux_silences.webp',
            speaker: 'nyra',
            title: 'Le Jour Où Elle N\'a Pas Ri',
            pages: [
                "La Faille se referme. Nyra s'assoit sur une borne, essoufflée.",
                "Esen attend la vanne. Il y en a toujours une. « Ça, c'est fait », ou « il était moche, celui-là », ou n'importe quoi.",
                "Rien ne vient.",
                "Elle fixe le trottoir. Une minute entière.",
                "« Nyra. »",
                "« Mmh. »",
                "« Tu n'as rien dit. »",
                "Elle relève la tête, et son visage est parfaitement calme. C'est ça qui inquiète.",
                "« Si je commence à me taire, » dit-elle doucement, « c'est que j'ai commencé à trouver ça normal. »",
                "Puis elle se lève, s'étire bruyamment, et lance : « Bon ! Le prochain qui s'efface, je lui envoie la facture. »",
                "Esen ne rit pas non plus. Mais il est soulagé de l'entendre."
            ]
        }
    },
    {
        id: 'evt_n31_dialogue_duo',
        type: 'dialogue',
        trigger: { kind: 'xp', level: 31, frac: 0.2 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'L\'Inscription, à Deux',
            image: 'images/story/dos_a_dos.webp',
            pages: [
                "Nyra a vu l'inscription, elle aussi. Pour une fois, elle ne plaisante pas.",
                "« Quelqu'un d'aussi fort que ça... qui a juste arrêté. » Elle frissonne. « Ça me fait plus peur que tous les monstres. »",
                "Esen pose une main sur son épaule. Un geste rare. « C'est pour ça qu'on est deux. On se surveille. Si l'un de nous commence à vouloir s'asseoir... »",
                "« ...l'autre le force à se relever, » termine Nyra. Vous le pensez tous les deux. Le Système aussi."
            ]
        }
    },
    {
        id: 'evt_n33_ambiance_systeme_revelation',
        type: 'ambiance',
        trigger: { kind: 'levelAndNarrativeRift', value: 33, narrativeId: 'first_breach' },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Ce que Je Suis',
            pages: [
                "« Tu es assez fort, maintenant. Tu mérites la vérité, » affiche le Système.",
                "« Je ne suis pas un dieu. Ni un programme. Je suis le dernier fragment de ce monde qui a refusé de s'effacer. »",
                "« Quand tout a commencé à pâlir, je me suis accroché à la seule chose encore solide : toi. Tant que tu tiens, j'existe. »",
                "« Je ne t'ai jamais guidé par bonté. Je m'accroche à toi pour survivre. Voilà. Maintenant tu sais. »"
            ]
        }
    },
    {
        id: 'evt_n35_ambiance_nabdano_nom',
        type: 'ambiance',
        trigger: { kind: 'levelAndNarrativeRift', value: 35, narrativeId: 'whispering_tower' },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Le Nom',
            pages: [
                "« Celui qui a écrit cette inscription... il était comme toi. La plus grande Ancre que ce monde ait connue. »",
                "« Il a porté le monde seul, trop longtemps. Et un jour, la fatigue a gagné. Il s'est assis. Son propre fragment — son Système — s'est éteint, faute de quelqu'un pour le tenir. »",
                "« Et l'effacement s'est répandu depuis lui, comme une fissure. Ceux qui le sentent approcher l'appellent l’Effaceur. »",
                "« Mais il avait un nom, avant. Nabdano. Retiens-le. Tôt ou tard, il voudra que tu t'assoies, toi aussi. »"
            ]
        }
    },
    {
        id: 'evt_n37_fait_respiration',
        type: 'fait',
        trigger: { kind: 'xp', level: 37, frac: 0.45 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'Malgré Tout',
            pages: [
                "Le nom de Nabdano pèse sur vous deux depuis des jours. Alors Nyra décrète : « Pause. Aujourd'hui on ne sauve pas le monde. »",
                "Elle invente un jeu débile : nommer à voix haute une chose qui vaut encore la peine d'exister. Le café chaud. Le bruit de la pluie. Un certain silence partagé.",
                "Esen, après un long moment, dit un seul mot, en regardant Nyra : « Ça. » Elle rougit et change vite de sujet. Mais elle l'a entendu."
            ]
        }
    },
    // ── FIL ROUGE « les choses qui reviennent » — clé de voûte ─────────
    // Déclenché par un ACTE (Failles fermées), pas par un seuil d'XP :
    // l'événement est vécu comme la conséquence de ce que le joueur a fait.
    // Il redéfinit le mot « Ancre », qui donne son sens à toute l'histoire.
    {
        id: 'evt_ancre_definition',
        type: 'fait',
        trigger: { kind: 'riftsClosed', value: 12 },
        condition: function () { return storyEventSeen('evt_n35_ambiance_nabdano_nom'); },
        once: true,
        content: {
            image: 'images/story/traces.webp',
            speaker: 'systeme',
            title: 'Ce qu\'est une Ancre',
            pages: [
                "Une rue que tu avais vue pâlir a retrouvé ses couleurs. Personne ne l'a remarqué. Toi, si.",
                "« Tu as fermé assez de Failles pour que je te dise ceci, » affiche le Système.",
                "« Au début, je croyais qu'une Ancre servait à empêcher les choses de disparaître. Retenir. Résister. »",
                "« C'était incomplet. »",
                "Un temps.",
                "« Une Ancre ne retient pas le monde. Elle lui donne quelque chose vers quoi revenir. »",
                "« C'est pour ça que tu peux t'arrêter, te reposer, avoir mal — sans t'effacer. Tant qu'il y a un endroit où revenir, rien n'est vraiment perdu. »",
                "« Nabdano l'a oublié. Il a cru qu'il devait tenir sans jamais poser. Alors il a posé pour toujours. »"
            ]
        }
    },
    {
        id: 'evt_n39_ambiance_voix',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 39, frac: 0.7 },
        once: true,
        content: {
            speaker: 'nabdano',
            title: 'La Voix Familière',
            pages: [
                "Pour la première fois, pendant un combat, une créature ne grogne pas. Elle parle. Avec ta voix.",
                "« Tu es fatigué. Je le sens d'ici. Pourquoi continuer à porter tout ça ? »",
                "« Personne ne te jugera si tu t'assois. Au contraire. Le repos est si doux. Laisse-moi te montrer. »",
                "Le Système coupe net : « N'écoute pas. C'est lui. Il a trouvé une fissure dans ta tête. Avance. AVANCE. »"
            ]
        }
    },
    {
        id: 'evt_n41_dialogue_duo',
        type: 'dialogue',
        trigger: { kind: 'xp', level: 41, frac: 0.15 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'Promesse',
            image: 'images/story/n41_promesse.webp',
            pages: [
                "« Il m'a parlé aussi, » avoue Nyra, plus pâle que d'habitude. « Avec ma propre voix. Il connaît exactement quoi dire. »",
                "« Alors on fait une promesse, » dit Esen. « Le jour où l'un de nous l'écoute... l'autre n'abandonne pas. Il vient le chercher. »",
                "Nyra tend sa main, paume vers le bas. Esen pose la sienne dessus. « Promis. »",
                "Le pacte est scellé. Contre une voix qui porte vos propres mots."
            ]
        }
    },
    {
        id: 'evt_n43_ambiance_systeme_peur',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 43, frac: 0.4 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'La Peur du Système',
            pages: [
                "« Je dois t'avouer quelque chose, » affiche le Système, ses lettres vacillant légèrement.",
                "« J'ai peur. Pas de disparaître. De disparaître en sachant que je t'ai entraîné trop loin, vers lui. »",
                "« Mais je préfère ça à te regarder t'asseoir. Alors je reste. Jusqu'au bout. Avec toi. »"
            ]
        }
    },
    // ── LE SYSTÈME, dernier palier : de SURVIVRE à ESPÉRER ────────────
    // Il a été froid (objectif : survivre), puis intrigué, puis effrayé.
    // Ici il franchit la dernière étape : il veut quelque chose pour
    // lui-même — non plus durer, mais voir la suite. C'est ce qui
    // l'oppose définitivement à Nabdano, qui a cessé de vouloir.
    {
        id: 'evt_n55_systeme_espoir',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 44, frac: 0.65 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Ce qu\'il y a Après',
            pages: [
                "« Je n'ai jamais voulu qu'une seule chose, » affiche le Système. « Durer. Tenir. Ne pas m'éteindre. »",
                "« Depuis le début, je m'accroche à toi parce que tu me maintiens en vie. Je te l'ai avoué. Je ne le regrette pas. »",
                "Un temps. Les lettres s'affichent plus lentement que d'habitude.",
                "« Mais aujourd'hui, pour la première fois, je ne veux pas seulement survivre. »",
                "Tu attends. Le Système hésite — un programme n'hésite pas.",
                "« Parce que je veux voir ce qu'il y a après. »"
            ]
        }
    },
    {
        id: 'evt_n45_ambiance_approche',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 45, frac: 0.7 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Au Bout du Couloir',
            pages: [
                "Les Failles changent. Elles convergent toutes vers un même endroit, loin, où le blanc de l'oubli est le plus épais.",
                "« C'est là qu'il est, » dit le Système. « Assis, au centre de tout ce qu'il a effacé. Il t'attend. Il sait que tu viens. »",
                "Esen et Nyra marchent épaule contre épaule. Personne ne parle. Personne ne ralentit."
            ]
        }
    },
    {
        id: 'evt_n47_ambiance_nabdano',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 47, frac: 0.15 },
        once: true,
        content: {
            speaker: 'nabdano',
            title: 'Il Connaît Ton Nom',
            pages: [
                "La voix revient, plus calme, plus intime. Elle connaît ton nom maintenant. Celui que tu croyais avoir oublié.",
                "« Tu vois ? Moi je m'en souviens. De ton nom. De ta fatigue. De chaque matin où tu as hésité à te lever. »",
                "« Je ne suis pas ton ennemi. Je suis le seul qui te comprenne vraiment. Viens. Assieds-toi près de moi. »"
            ]
        }
    },
    {
        id: 'evt_n49_dialogue_duo',
        type: 'dialogue',
        trigger: { kind: 'xp', level: 49, frac: 0.4 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'Tenir la Main',
            image: 'images/story/moment_suspendu.webp',
            pages: [
                "La voix de Nabdano est partout maintenant. Difficile de penser. Difficile d'avancer.",
                "Sans un mot, Nyra prend la main d'Esen. Il ne la retire pas. Personne n'a besoin de parler.",
                "« Tant qu'on se touche, » dit Nyra, « il ne peut pas nous prendre un par un. »",
                "Le Système, presque ému : « Deux signaux. Entrelacés. Je n'ai jamais rien vu d'aussi difficile à effacer. »"
            ]
        }
    },
    {
        id: 'evt_n51_fait_souvenir',
        type: 'fait',
        trigger: { kind: 'xp', level: 51, frac: 0.65 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Un Visage Revient',
            pages: [
                "Quelque chose d'étrange arrive. En t'entraînant, un souvenir que tu croyais effacé refait surface, net, intact.",
                "Un visage. Une voix. Quelqu'un qui comptait, et que l'Oubli t'avait pris.",
                "« Tu vois ? » dit le Système. « Plus tu deviens réel, plus tu ramènes ce qui était perdu. C'est l'exact opposé de ce que fait Nabdano. Vous êtes deux forces contraires. »"
            ]
        }
    },
    {
        id: 'evt_n53_ambiance_doute',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 53, frac: 0.3 },
        once: true,
        content: {
            speaker: 'nabdano',
            title: 'Le Doute',
            pages: [
                "« Regarde tout ce que tu ramènes, » murmure Nabdano. « Et regarde comme ça te coûte. Chaque jour. Encore. »",
                "« Moi aussi, j'ai ramené des choses, autrefois. Pendant des années. Des décennies. Jusqu'à ce que je comprenne que ça ne finit jamais. »",
                "« Ce n'est pas de la faiblesse, de vouloir que ça s'arrête. C'est de la lucidité. »",
                "Pour la première fois, une partie de toi comprend ce qu'il ressent. Et c'est ça, le plus effrayant."
            ]
        }
    },
    // ── 🕯️ LE PASSÉ DE NABDANO — après la Faille « Celui qui a Porté »
    // Montré, pas raconté. Pas de visage, pas d'exposition : des sauts.
    // Le joueur doit sortir de là en pensant « personne n'était là pour lui »,
    // et non « voilà le méchant ». C'est ce qui rendra la fin déchirante.
    {
        id: 'evt_nabdano_passe',
        type: 'fait',
        trigger: { kind: 'levelAndNarrativeRift', value: 55, narrativeId: 'the_one_who_carried' },
        once: true,
        content: {
            image: 'images/story/inscription_nabdano.webp',
            speaker: 'systeme',
            title: 'Celui qui a Porté',
            pages: [
                "La Faille s'ouvre sur une ville entière. Intacte. Le soleil est bas, les terrasses sont pleines, quelqu'un rit quelque part.",
                "Au milieu de la rue, un homme se tient debout. Tu ne vois pas son visage.",
                "Des gens passent près de lui. Une femme lui touche l'épaule en souriant. « Merci, Nab— »",
                "L'image saute.",
                "La même rue. Vide. L'homme est toujours là, les bras levés. Au-dessus de lui, une Faille énorme, retenue.",
                "L'image saute.",
                "Il est toujours là. La Faille aussi. Les terrasses ont disparu. Les vitrines sont éteintes.",
                "L'image saute.",
                "Encore là. Il tremble. Personne ne vient.",
                "L'image saute.",
                "Personne ne vient.",
                "L'image saute une dernière fois.",
                "Il s'assoit.",
                "Pas de musique. Pas de cri. La Faille au-dessus de lui se referme lentement, toute seule, comme si elle avait fini d'attendre.",
                "« Il a tenu quarante et un ans, » affiche le Système. Puis, après un long silence :",
                "« Il a attendu que quelqu'un lui demande de s'arrêter. Personne ne l'a fait. »",
                "L'image s'éteint. Nyra ne dit rien. Esen non plus.",
                "Vous rentrez à pied."
            ]
        }
    },
    {
        id: 'evt_n55_dialogue_esen',
        type: 'dialogue',
        trigger: { kind: 'xp', level: 56, frac: 0.55 },
        once: true,
        content: {
            speaker: 'esen',
            title: 'Pourquoi Esen Tient',
            image: 'images/story/n55_esen_tient.webp',
            pages: [
                "« Tu l'écoutes, » constate Esen. Nyra ne nie pas. Pas de reproche. Juste un fait.",
                "« Moi aussi je l'entends. Et il a raison sur une chose : ça ne finit jamais. »",
                "« Mais c'est exactement pour ça qu'il faut continuer. Pas parce que ça finira. Parce que les gens qu'on porte méritent qu'on tienne encore un jour. Et puis encore un. »",
                "Il la regarde. « Toi aussi, tu mérites que quelqu'un tienne pour toi. C'est ce que je fais. »"
            ]
        }
    },
    {
        id: 'evt_n57_fait_nyra',
        type: 'fait',
        trigger: { kind: 'xp', level: 57, frac: 0.8 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'Le Caillou Rendu',
            image: 'images/story/n57_caillou_rendu.webp',
            pages: [
                "Nyra fouille dans sa collection de cailloux. Elle en cherche un précis, le trouve, le tend à Esen.",
                "« Le tout premier que j'ai ramassé. Avant de te connaître. J'étais seule, ce jour-là, et j'ai failli m'asseoir. »",
                "« Garde-le. Comme ça, si un jour c'est moi qui flanche... tu auras une preuve que j'ai tenu une fois. Et tu me forceras à recommencer. »"
            ]
        }
    },
    // ── 🤝 LES COMPAGNONS PARLENT (après leur rencontre, avant la Dernière Porte)
    {
        id: 'evt_marcus_quarante',
        type: 'dialogue',
        trigger: { kind: 'xp', level: 59, frac: 0.35 },
        condition: function () { return awakAvecCompagnon('marcus'); },
        once: true,
        content: {
            speaker: 'marcus',
            title: "Quarante-Trois",
            pages: [
                "Marcus frappe le sac depuis une heure. Il ne compte pas. Il ne s'arrête pas non plus.",
                "« La première fois qu'on s'est vus, je t'ai dit que j'avais arrêté de compter ceux qui ont lâché. » Il essuie son front. « J'ai menti. Je les compte tous. Quarante-trois. »",
                "« Le premier, c'était mon frère. On s'entraînait ensemble. Un matin, il n'est pas venu. Le lendemain non plus. Une semaine après, je ne me souvenais plus de sa voix. »",
                "{partenaire} ne dit rien. Tu poses une main sur le sac pour l'immobiliser. Marcus te laisse faire.",
                "« Alors je frappe. Pas pour devenir fort. Pour ne pas en ajouter un quarante-quatrième. » Il vous regarde, toi et {partenaire}. « Avisez-vous pas d'être ceux-là. »"
            ]
        }
    },
    // ── 🏮 Le Marchand : « tant que quelqu'un achète, j'existe » — et son plus vieux client
    {
        id: 'evt_marchand_client',
        type: 'fait',
        trigger: { kind: 'xp', level: 62, frac: 0.3 },
        once: true,
        content: {
            speaker: 'marchand',
            title: "Le Client",
            image: 'images/story/marchand.webp',
            pages: [
                "L'échoppe du Marchand est à moitié vide. Les étagères pâlissent par endroits, comme une photo oubliée au soleil.",
                "« Les affaires ralentissent, » dit-il en souriant. Le sourire ne tient pas. « Plus on approche du centre, moins il y a de clients. Et moins il y a de clients… » Il regarde ses mains. Elles sont un peu transparentes.",
                "« J'avais un habitué, autrefois. Il venait chaque matin acheter des bandes pour ses mains. Il les usait jusqu'à la corde. Il ne parlait jamais. Il payait toujours. »",
                "« Pendant des années. Puis un matin, il n'est pas venu. » Il range une bande, très soigneusement. « J'ai encore sa commande du lendemain, quelque part. Je ne l'ai jamais vendue. »",
                "{partenaire} demande, doucement : « Il s'appelait comment ? » Le Marchand ouvre la bouche. La referme. « Je suis désolé. Il ne m'achète plus rien. Alors je ne m'en souviens plus. »",
                "Tu achètes quelque chose. N'importe quoi. Ses mains redeviennent un peu plus nettes. « Merci, » dit-il. Et cette fois, le sourire tient."
            ]
        }
    },
    {
        id: 'evt_kira_traces',
        type: 'dialogue',
        trigger: { kind: 'xp', level: 63, frac: 0.6 },
        condition: function () { return awakAvecCompagnon('kira'); },
        once: true,
        content: {
            speaker: 'kira',
            title: "Personne n'est Venu Voir",
            image: 'images/story/traces.webp',
            pages: [
                "Kira t'entraîne à l'écart, sur une arête de Faille. Elle montre le sol : des traces de pas, profondes, sûres. Tu les reconnais.",
                "« Je les suis depuis des années, » dit-elle. « Bien avant vous. Je voulais savoir s'il s'était vraiment assis. Ou s'il se cachait. »",
                "« Il ne se cache pas. Il ne s'est jamais caché. » Elle s'accroupit, effleure la dernière empreinte. « C'est ça, le pire. Il était là, en plein milieu, tout ce temps. Et personne n'est venu voir. »",
                "Elle se relève. « Je ne rate jamais rien. C'est mon talent. » Un temps. « Mais lui, on l'a tous raté. »"
            ]
        }
    },
    {
        id: 'evt_n65_ambiance_nabdano',
        type: 'ambiance',
        trigger: { kind: 'levelAndNarrativeRift', value: 65, narrativeId: 'silent_one' },
        once: true,
        content: {
            speaker: 'nabdano',
            title: 'Presque Tendre',
            image: 'images/story/nabdano.webp',
            pages: [
                "« Tu es plus proche que quiconque ne l'a jamais été, » dit Nabdano. Sa voix n'a plus rien de menaçant. Juste une infinie fatigue.",
                "« Quand tu me verras, tu comprendras. Je ne suis pas un monstre. Je suis seulement... quelqu'un qui s'est arrêté. »",
                "« Et une part de toi, déjà, se demande si j'ai eu tort. »"
            ]
        }
    },
    {
        id: 'evt_elise_prescription',
        type: 'dialogue',
        trigger: { kind: 'xp', level: 67, frac: 0.4 },
        condition: function () { return awakAvecCompagnon('elise'); },
        once: true,
        content: {
            speaker: 'elise',
            title: "Une Prescription",
            pagesSi: { nyra: [
                "Élise te prend à part pendant qu'Esen nettoie sa lame. Pour la troisième fois.",
                "« Il ne dort plus. Trois heures par nuit, peut-être. Et moins il parle, plus il a peur. Tu l'avais remarqué ? »",
                "« Je sais soigner une épaule. Une cheville. Pas ça. » Elle range ses bandages, un par un. « Ça, ça se soigne en restant à côté. »",
                "« Alors reste à côté. C'est une prescription. »",
                "Ce soir-là, quand Esen pose enfin sa lame, tu t'assois près de lui. Tu ne dis rien. Lui non plus. Il dort quatre heures. C'est un début."
            ] },
            pages: [
                "Élise te prend à part pendant que Nyra raconte une blague à qui veut l'entendre. Beaucoup trop fort.",
                "« Elle ne dort plus. Trois heures par nuit, peut-être. Et elle rit plus fort quand elle a peur. Tu l'avais remarqué ? »",
                "« Je sais soigner une épaule. Une cheville. Pas ça. » Elle range ses bandages, un par un. « Ça, ça se soigne en restant à côté. »",
                "« Alors reste à côté. C'est une prescription. »",
                "Ce soir-là, quand Nyra se tait enfin, tu t'assois près d'elle. Tu ne dis rien. Elle non plus. Elle dort quatre heures. C'est un début."
            ]
        }
    },
    {
        id: 'evt_yuna_noyau',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 69, frac: 0.5 },
        condition: function () { return awakAvecCompagnon('yuna'); },
        once: true,
        content: {
            speaker: 'yuna',
            title: "Le Noyau",
            pages: [
                "« Tu veux savoir ce qu'est le Noyau, » dit Yuna. Ce n'est pas une question. Elle ne pose jamais de questions.",
                "« C'est l'endroit où le monde garde ce qu'il refuse d'oublier. Les noms qu'on a aimés. Les promesses tenues. Tout ce qui a compté assez fort. »",
                "« Je l'ai touché, une fois. J'y ai vu le bout de la route. Un homme assis. Et devant lui, deux silhouettes debout, côte à côte. » Elle te regarde, puis {partenaire}. « Je ne savais pas qui elles étaient. Maintenant, si. »",
                "{partenaire} fronce les sourcils. « Et ensuite ? Qu'est-ce qui se passe, ensuite ? »",
                "Yuna sourit, pour la première fois. « Le Noyau ne montre pas ce qui va arriver. Il montre ce qui vaut la peine d'être gardé. Le reste, c'est à vous. »"
            ]
        }
    },
    {
        id: 'evt_chen_mefiance',
        type: 'dialogue',
        trigger: { kind: 'xp', level: 74, frac: 0.3 },
        condition: function () { return awakAvecCompagnon('chen'); },
        once: true,
        content: {
            speaker: 'chen',
            title: "Les Voix qui ont Besoin de Nous",
            pages: [
                "Maître Chen observe longtemps les lettres du Système avant de parler. « Je t'ai déjà vu, toi. Pas toi exactement. Un autre comme toi. »",
                "Les lettres vacillent. Chen continue, calme : « Il y a longtemps, un fragment s'accrochait à un homme. Il lui parlait, comme il te parle. Il l'encourageait. Chaque jour. »",
                "« Puis l'homme s'est assis. Et le fragment s'est éteint avec lui. » Chen se tourne vers toi. « Je me méfie des voix qui ont besoin de nous pour vivre. »",
                "Un long silence. Puis le Système affiche, lentement : « Il a raison. J'ai besoin de toi. »",
                "« Mais l'autre fragment ne lui a jamais dit qu'il avait le droit de se reposer. Moi, je te le dis. Repose-toi. Et reviens. C'est toute la différence. »",
                "Chen hoche la tête, une seule fois. « …Bien. Alors je reste. »"
            ]
        }
    },
    {
        id: 'evt_n61_ambiance_proche',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 75, frac: 0.2 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Le Seuil',
            pages: [
                "Vous y êtes presque. Le vide blanc est si dense qu'il avale les sons. Chaque pas demande une volonté pure.",
                "« Au-delà de ce seuil, je ne pourrai plus beaucoup t'aider, » dit le Système. « Là où il est, je suis trop faible. C'est son territoire. »",
                "« Quoi qu'il te dise... souviens-toi que tu n'es pas venu seul. C'est la seule chose qu'il n'a jamais eue, lui. »"
            ]
        }
    },
    // ── 🎵 Fil ouvert : la chanson de Nyra (voir evt_oubli_chanson)
    {
        id: 'evt_chanson_retrouvee',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 76, frac: 0.5 },
        once: true,
        content: {
            speaker: 'nyra',
            title: "La Chanson, Encore",
            pages: [
                "Plus vous avancez dans le blanc, plus le silence est épais. Puis, au loin, quelque chose le traverse.",
                "Un air. Simple, un peu triste. Nyra s'arrête net. C'est sa chanson. Celle que personne ne connaissait.",
                "Quelqu'un la fredonne, très loin, là où la route finit. D'une voix usée, comme on chante à un enfant pour qu'il s'endorme.",
                "« Il la connaît, » souffle Nyra. « Il la connaît… »",
                "Le Système, à peine visible : « Ce n'est pas lui qui te l'a apprise, Nyra. Mais quelqu'un, autrefois, l'a apprise à quelqu'un qu'il tenait debout. Il s'en souvient encore. »",
                "Nyra s'essuie les yeux d'un revers de manche. « Alors je ne suis pas la dernière. » Elle reprend la marche. Elle fredonne avec lui, sans s'en rendre compte, dans le même tempo."
            ]
        }
    },
    {
        id: 'evt_n70_dialogue_duo',
        type: 'dialogue',
        trigger: { kind: 'xp', level: 79, frac: 0.2 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'Avant la Fin',
            image: 'images/story/n70_avant_fin.webp',
            pages: [
                "La veille du seuil final, vous restez éveillés tous les deux, en silence.",
                "« Si on en sort, » dit Nyra sans regarder personne, « il faudra qu'on se dise des choses. Des vraies. »",
                "Esen hoche la tête, lentement. « Si on en sort. »",
                "Personne ne finit la phrase. Mais quelque chose, entre vous, vient d'être promis."
            ]
        }
    },
    // ⚠️ AVERTISSEMENT AVANT LA PORTE — le joueur peut encore aller chercher
    // les autres. Le Système constate sans juger : c'est au joueur de comprendre.
    {
        id: 'evt_avant_porte_bilan',
        type: 'ambiance',
        trigger: { kind: 'xp', level: 79, frac: 0.7 },
        once: true,
        content: {
            image: 'images/story/moment_suspendu.webp',
            speaker: 'systeme',
            title: 'Avant de Frapper',
            pages: [
                "« Avant que tu passes cette porte, » affiche le Système, « je dois te dire une chose. »",
                "« Il ne te demandera pas si tu es fort. Il sait déjà que tu l'es. »",
                "« Il te demandera depuis combien de temps tu tiens. Et qui tient avec toi. »",
                "Un temps.",
                "« Moi je serai là. Eux aussi, s'ils sont venus. »",
                "« Et si tu passes cette porte seul — tu ne l'auras quand même pas fait seul. Tu as mis des mois à arriver ici. »"
            ]
        }
    },
    {
        id: 'evt_n75_ambiance_porte',
        type: 'ambiance',
        // ⚠️ La Faille « last_door » exige le rang S = niveau 80. Un seuil à 75
        // était trompeur : l'événement ne pouvait pas se déclencher avant 80.
        trigger: { kind: 'levelAndNarrativeRift', value: 80, narrativeId: 'last_door' },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'La Dernière Porte',
            image: 'images/story/face_effacement.webp',
            pages: [
                "Devant vous, le centre de l'effacement. Une étendue blanche, infinie, silencieuse. Et au milieu, une silhouette assise.",
                "Le Système, d'une voix presque éteinte : « C'est lui. Nabdano. »",
                "« Va. Je reste avec toi autant que je le peux. Et n'oublie pas... tu n'es pas venu seul. »"
            ]
        }
    },
    // ══════════════════════════════════════════════════════════════
    // ⚔️ LES QUATRE ÉPREUVES — bascule avant les sous-boss
    // Le joueur vient de terminer l'histoire (les 5 Failles narratives).
    // Sans transition, les 4 sous-boss surgissaient sans explication :
    // on passait du récit à une suite de combats, sans savoir pourquoi.
    // Cet événement donne leur sens — ce ne sont pas des ennemis de plus,
    // ce sont les quatre examens que Nabdano impose avant de se montrer.
    // Déclencheur identique à celui des sous-boss : rang A (niveau 55).
    // ══════════════════════════════════════════════════════════════
    {
        id: 'evt_quatre_epreuves',
        type: 'fait',
        trigger: { kind: 'levelAndNarrativeRift', value: 80, narrativeId: 'last_door' },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Les Quatre Épreuves',
            pages: [
                "Quelque chose a changé dans l'air. Les Failles ne s'ouvrent plus au hasard.",
                "« Il sait que tu viens, » affiche le Système. « Il ne se cachera pas. Mais il ne se laissera pas atteindre non plus. »",
                "Quatre présences se dressent entre toi et lui. Elles ne sont pas venues te tuer.",
                "« Elles sont là pour vérifier quelque chose. »",
                "Le premier te poursuivra sans relâche — il veut savoir si tu tiens la distance.",
                "Le deuxième ne cédera qu'à la force brute — il veut savoir si tu peux briser ce qui te bloque.",
                "Le troisième esquivera tout ce qui est prévisible — il veut savoir si tu peux encore surprendre.",
                "Le quatrième te videra lentement — il veut savoir ce qu'il reste quand tu n'as plus rien.",
                "Un temps.",
                "« Ce ne sont pas des ennemis. Ce sont ses questions. »",
                "Nyra hausse les épaules. « Et si on répond mal ? »",
                "« Alors vous n'êtes pas prêts à l'entendre, lui. »",
                "Esen regarde les quatre silhouettes, puis la route derrière elles.",
                "« Alors on répond bien. »"
            ]
        }
    },
    // ══════════════════════════════════════════════════════════════
    // 👑 IL N'Y A PLUS DE PORTE — juste avant l’Effaceur
    // Les 4 sous-boss sont tombés : le combat final se débloque. Sans
    // transition, le joueur passait de la 4ᵉ épreuve à un bouton
    // « COMBAT FINAL DISPONIBLE » sans respiration narrative.
    // Cette scène marque le basculement : les questions sont finies,
    // il ne reste que celle qu'il pose lui-même.
    // Déclencheur : les 4 sous-boss vaincus (même condition que le boss).
    // ══════════════════════════════════════════════════════════════
    {
        id: 'evt_avant_monarque',
        type: 'fait',
        trigger: { kind: 'subBosses', value: 4 },
        once: true,
        content: {
            image: 'images/story/nabdano.webp',
            speaker: 'systeme',
            title: 'Il n\'y a plus de Porte',
            pages: [
                "La quatrième présence s'efface. Aucune ne t'a tué. Aucune n'a essayé.",
                "« Elles ont eu leurs réponses, » affiche le Système.",
                "Devant toi, la rue continue. Pas de Faille, pas de brèche, pas de seuil à franchir.",
                "Juste une route droite, et quelque chose d'assis tout au bout.",
                "« Plus de porte. Plus de gardien. Il n'a jamais rien mis d'autre entre vous que sa fatigue. »",
                "Un temps.",
                "« Il a passé quarante et un ans à attendre que quelqu'un vienne jusqu'ici. Personne n'est venu. »",
                "Nyra ne plaisante pas. Elle regarde la silhouette au loin, longtemps.",
                "« Il a l'air fatigué. »",
                "« Il l'est, » affiche le Système. « C'est exactement ce qui le rend dangereux. »",
                "Esen vérifie ses appuis, comme avant chaque série.",
                "« Il ne va pas nous attaquer, » dit-il. Ce n'est pas une question.",
                "« Non. Il va vous parler. Et il aura raison sur presque tout. »",
                "Le Système hésite — un programme n'hésite pas.",
                "« Presque. »",
                "Vous avancez."
            ]
        }
    },
    // ══════════════════════════════════════════════════════════════
    // 🌱 LA FIN — L'ANCRE (pour TOUS les joueurs)
    // Choix assumé : après des mois — parfois des années — d'entraînement
    // RÉEL, aucun joueur ne doit se voir refuser la vraie conclusion pour
    // n'avoir pas coché assez de contenu annexe. La récompense, c'est
    // d'être arrivé jusqu'ici.
    // Le joueur ne bat pas Nabdano : il refuse de le laisser seul.
    // Nabdano ne devient pas gentil — il comprend ce qui lui a manqué.
    // ══════════════════════════════════════════════════════════════
    {
        id: 'evt_fin_ancre',
        type: 'fait',
        trigger: { kind: 'finalBoss', value: 1 },
        once: true,
        content: {
            image: 'images/story/fin_ancre.webp',
            speaker: 'nabdano',
            title: 'L\'Ancre',
            get pages() { return [
                "Le combat est fini. Il est toujours assis. Il ne s'est pas levé une seule fois.",
                "« Tu as gagné, » dit-il. Ce n'est pas de la résignation. C'est un constat.",
                "Tu ne bouges pas.",
                "« Pourquoi tu continues ? » Il lève enfin les yeux. « Tu es encore debout. C'est tout ce que tu as. »",
                "Autour de lui, des visages apparaissent et s'effacent. Des rues. Une boulangerie. Une chanson que personne ne connaît plus.",
                "« Regarde tout ce que j'ai perdu en tenant. Combien de temps avant que toi aussi tu sois fatigué ? »",
                "Un temps.",
                "« Assieds-toi. »",
                "Et pour la première fois depuis le début, le Système n'affiche aucune commande. Aucune attaque. Rien.",
                "Tu tends la main.",
                "Nabdano la regarde sans comprendre. « Qu'est-ce que tu fais. »",
                "« Tu n'avais pas tort d'être fatigué. »",
                "Il se fige.",
                "« Tu avais tort de croire que tu devais porter le monde seul. »",
                (awakFinCompagnons() > 0
                    ? "Derrière toi, des pas. {partenaire}. Puis les autres — ceux que tu es allé{e} chercher, un par un, dans des Failles où personne ne t'obligeait à entrer."
                    : "Derrière toi, des pas. {partenaire}. {Il} t'a suivi{e} jusqu'ici sans que tu le demandes."),
                "Nabdano les regarde. Longtemps. Ses mains tremblent.",
                "« ...Voilà ce que je n'avais pas. »",
                "Il ne sourit pas. Il ne demande pas pardon. Quelque chose se défait, simplement, après quarante et un ans.",
                "« Alors... » Sa voix est presque inaudible. « Vous pouvez continuer sans moi. »",
                "Il s'efface. Pas comme le monde s'efface — plus doucement. Comme quelqu'un qu'on laisse enfin dormir.",
                "« Il est parti, » affiche le Système. « Pas effacé. Parti. Ce n'est pas la même chose. »",
                "Dehors, une rue que tu croyais perdue a retrouvé son nom."
            ]; }
        }
    },
    // ── 🌅 ÉPILOGUE : les fils ouverts se referment (photo d'Esen, promesse du duo)
    {
        id: 'evt_epilogue_apres',
        type: 'fait',
        trigger: { kind: 'finalBoss', value: 1 },
        condition: function () { return storyEventSeen('evt_fin_ancre'); },
        once: true,
        content: {
            speaker: 'esen',
            title: "Après",
            image: 'images/story/n27_photo_esen.webp',
            pages: [
                "Quelques jours ont passé. Les rues reprennent leurs noms, une à une. Ce matin, la boulangère a salué Nyra par son prénom. Nyra a fait semblant de ne pas être émue.",
                "Esen sort la vieille photo de sa poche. Le visage est revenu. Une jeune fille, un sourire de travers, les cheveux en bataille.",
                "« Ma sœur, » dit-il. Il le dit lentement, comme un mot qu'on réapprend. « Elle s'appelait Ilia. Elle trichait aux cartes. »",
                "« Tu avais peur que ça revienne, » dit Nyra doucement.",
                "« Oui. » Il range la photo. « Ça fait mal. » Un temps. « Mais je suis assez solide, maintenant. »",
                "Nyra s'assoit à côté de lui. « Bon. On avait dit que si on s'en sortait, on se dirait des choses. Des vraies. »",
                "Esen la regarde. Longtemps. « …Demain. »",
                "Nyra lève les yeux au ciel. Mais elle sourit, et elle ne lâche pas sa main.",
                "Le Système affiche, pour lui-même : « Note : demain est une notion que je peux enfin envisager. »"
            ]
        }
    }
];

// Un compagnon a-t-il rejoint le groupe ? (scènes de compagnon : avant la Dernière Porte)
function awakAvecCompagnon(id) {
    try {
        var d = (typeof awakCompanionsLoad === 'function') ? awakCompanionsLoad() : null;
        if (!(d && Array.isArray(d.unlocked) && d.unlocked.indexOf(id) >= 0)) return false;
        return !awakNarrativeRiftDone('last_door');
    } catch (e) { return false; }
}

// ── 👥 LE JOUEUR EST ESEN OU NYRA ───────────────────────────────────
// Selon l'avatar choisi (fitproAvatarGender) : homme → Esen, femme → Nyra.
// L'autre héros est le PARTENAIRE. Jetons utilisables dans les textes :
//   {partenaire} Esen/Nyra · {il}/{Il} pronom du partenaire
//   {pe} accord du partenaire ('' ou 'e') · {e} accord du joueur
// content.pagesSi = { esen:[…], nyra:[…] } : variante selon le héros joué.
function awakHerosJoue() {
    try { return (localStorage.getItem('fitproAvatarGender') || 'homme') === 'femme' ? 'nyra' : 'esen'; }
    catch (e) { return 'esen'; }
}
function awakHerosTexte(t) {
    if (typeof t !== 'string' || t.indexOf('{') < 0) return t;
    var moi = awakHerosJoue(), nyraPart = (moi === 'esen');
    return t.replace(/\{partenaire\}/g, nyraPart ? 'Nyra' : 'Esen')
            .replace(/\{il\}/g, nyraPart ? 'elle' : 'il').replace(/\{Il\}/g, nyraPart ? 'Elle' : 'Il')
            .replace(/\{pe\}/g, nyraPart ? 'e' : '').replace(/\{e\}/g, moi === 'nyra' ? 'e' : '');
}
function awakHerosPages(c) {
    var p = (c && c.pagesSi && c.pagesSi[awakHerosJoue()]) || (c && c.pages) || [];
    return p.map(awakHerosTexte);
}

// Compagnons rejoints (pour la scène finale)
function awakFinCompagnons() {
    try { var d = (typeof awakCompanionsLoad === 'function') ? awakCompanionsLoad() : null;
          return (d && Array.isArray(d.unlocked)) ? d.unlocked.length : 0; } catch (e) { return 0; }
}

// ── ÉTAT / ANTI-DOUBLON ────────────────────────────────────────────
function _seenKey(id) { return 'awakStoryEvt_' + id; }
function storyEventSeen(id) { return localStorage.getItem(_seenKey(id)) === '1'; }
function storyEventMarkSeen(id) { try { localStorage.setItem(_seenKey(id), '1'); } catch(e) {} }

// ── ÉVALUATION DES DÉCLENCHEURS ────────────────────────────────────
function storyEventEligible(evt, ctx) {
    if (!evt || !evt.trigger) return false;
    if ((evt.once !== false) && storyEventSeen(evt.id)) return false;
    // 🔀 CONDITION optionnelle : permet à deux événements de partager le même
    // déclencheur tout en s'excluant mutuellement (ex. les deux fins, L'Ancre
    // et L'Écho, qui dépendent du parcours du joueur). Sans ce test, les deux
    // s'afficheraient à la suite.
    if (typeof evt.condition === 'function') {
        try { if (!evt.condition()) return false; } catch (e) { return false; }
    }
    const t = evt.trigger;
    switch (t.kind) {
        case 'always':   return true;
        case 'workouts': return (ctx.workouts || 0) >= t.value;
        case 'level':    return (ctx.level || 0) >= t.value;
        case 'xp': {
            // Seuil exprimé en NIVEAU (+ fraction du niveau suivant, pour un
            // rythme irrégulier) : reste juste si la courbe d'XP est rééquilibrée.
            if (t.level != null) {
                if (typeof rpgXPForLevel !== 'function') return (ctx.level || 0) > t.level;
                var x0 = rpgXPForLevel(t.level), x1 = rpgXPForLevel(t.level + 1);
                return (ctx.xp || 0) >= x0 + Math.round((x1 - x0) * (t.frac || 0));
            }
            return (ctx.xp || 0) >= t.value;
        }
        case 'finalBoss':     // l’Effaceur a été affronté
            try { return localStorage.getItem('awakFinalBossDefeated') === '1'; } catch (e) { return false; }
        case 'rifts':    return (ctx.rifts || 0) >= t.value;
        case 'rank': {
            const order = ['E','D','C','B','A','S','SS','SSS'];
            return order.indexOf(ctx.rank || 'E') >= order.indexOf(t.value);
        }
        // ── 🎬 DÉCLENCHEURS PAR ACTE ───────────────────────────────────
        // L'histoire ne doit pas se réduire à « j'ai atteint X XP → chapitre ».
        // Ces déclencheurs répondent à ce que le joueur FAIT, pour que les
        // événements soient vécus comme la conséquence de son aventure.
        case 'riftsClosed':   // avoir fermé N Failles
            return (ctx.rifts || 0) >= t.value;
        case 'subBosses': {   // avoir vaincu N sous-boss (0-4)
            try {
                var sb = parseInt(localStorage.getItem('awakSubBossProgress') || '0', 10) || 0;
                return sb >= t.value;
            } catch (e) { return false; }
        }
        case 'comeback': {    // revenir après une pause d'au moins N jours
            try {
                var last = ctx.lastWorkout || (typeof loadStats === 'function' ? loadStats().lastWorkout : null);
                if (!last) return false;
                var j = (Date.now() - new Date(last)) / 86400000;
                return j >= (t.value || 4);
            } catch (e) { return false; }
        }
        case 'streak':        // tenir une série de N jours
            return (ctx.streak || 0) >= t.value;
        case 'levelAndNarrativeRift': {
            // Exige le niveau ATTEINT *et* la Faille narrative complétée
            const lvlOk = (ctx.level || 0) >= t.value;
            const riftOk = awakNarrativeRiftDone(t.narrativeId);
            return lvlOk && riftOk;
        }
        default: return false;
    }
}

// Une Faille narrative est-elle complétée ?
function awakNarrativeRiftDone(narrativeId) {
    try {
        const rifts = (typeof awakRiftsLoad === 'function') ? awakRiftsLoad() : [];
        return rifts.some(r => r.isNarrative && r.narrativeId === narrativeId && r.completed);
    } catch(e) { return false; }
}

// ── CONTEXTE JOUEUR (lecture seule, défensive) ─────────────────────
function storyBuildContext() {
    const ctx = { workouts: 0, level: 0, rifts: 0, rank: 'E', xp: 0 };
    try {
        const stats = (typeof loadStats === 'function') ? loadStats() : {};
        ctx.workouts = stats.workouts || 0;
        // Données nécessaires aux déclencheurs PAR ACTE (comeback, streak)
        ctx.lastWorkout = stats.lastWorkout || null;
        ctx.streak = stats.currentStreak || stats.streak || 0;
    } catch(e) {}
    try { if (typeof _awakGetCurrentLevel === 'function') ctx.level = _awakGetCurrentLevel(); } catch(e) {}
    try { if (typeof awakGetRank === 'function') ctx.rank = awakGetRank().id; } catch(e) {}
    // XP totale accumulée (cohérente avec le niveau affiché sur la carte)
    try {
        if (typeof rpgLoad === 'function') {
            const data = rpgLoad();
            const muscleXP = (data && data.muscles) ? Object.values(data.muscles).reduce((s,m)=>s+(m.xp||0),0) : 0;
            const lifetime = parseInt(localStorage.getItem('fitproRPGLifetimeXP') || '0');
            ctx.xp = muscleXP + lifetime;
        }
    } catch(e) {}
    try {
        const rifts = (typeof awakRiftsLoad === 'function') ? awakRiftsLoad() : [];
        ctx.rifts = rifts.filter(r => r.completed).length;
    } catch(e) {}
    return ctx;
}

// ── SÉLECTION : trouve le prochain événement à jouer ───────────────
function storyPickEvent() {
    const ctx = storyBuildContext();
    for (const evt of STORY_EVENTS) {
        // Si déjà vu, passer au suivant
        if ((evt.once !== false) && storyEventSeen(evt.id)) continue;

        // 🚧 PORTE NARRATIVE : événement-clé qui exige une Faille narrative.
        // Si le niveau est atteint mais la Faille pas encore faite, on BLOQUE
        // toute la suite de l'histoire (return null) au lieu de sauter cet événement.
        if (evt.trigger && evt.trigger.kind === 'levelAndNarrativeRift') {
            const lvlReached = (ctx.level || 0) >= evt.trigger.value;
            const riftDone = awakNarrativeRiftDone(evt.trigger.narrativeId);
            if (lvlReached && !riftDone) {
                // Le joueur a le niveau mais doit d'abord faire la Faille → stop ici
                return null;
            }
            if (lvlReached && riftDone) return evt; // débloqué
            continue; // niveau pas atteint → cet événement n'est pas encore concerné
        }

        if (storyEventEligible(evt, ctx)) return evt;
    }
    return null;
}

// ── AFFICHAGE UNIFIÉ ───────────────────────────────────────────────
function storyShowEvent(evt) {
    if (!evt || !evt.content) return;
    if (typeof window.AwakCine !== 'undefined' && window.AwakCine.defer(function () { storyShowEvent(evt); })) return;
    const c = evt.content;
    const char = STORY_CHARS[c.speaker] || STORY_CHARS.systeme;
    const color = char.color;
    const image = c.image || char.image; // override possible par event
    const pages = awakHerosPages(c);
    let pageIdx = 0;

    const overlay = document.createElement('div');
    overlay.id = 'storyEventOverlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:99997;
        background:rgba(0,0,0,0.93); backdrop-filter:blur(9px);
        display:flex; align-items:center; justify-content:center;
        padding:22px; opacity:0; animation:awakFadeIn 0.45s forwards;
    `;

    function render() {
        const isLast = pageIdx >= pages.length - 1;
        const image = (c.pageImages && c.pageImages[pageIdx]) ? c.pageImages[pageIdx] : (c.image || char.image);
        overlay.innerHTML = `
            <div style="max-width:400px;width:100%;max-height:90vh;overflow-y:auto;background:linear-gradient(165deg,${color}14,rgba(8,12,20,0.97) 60%);
                        border:1px solid ${color}55;border-radius:20px;padding:0;overflow-x:hidden;
                        box-shadow:0 0 44px ${color}33;animation:awakCardRise 0.5s cubic-bezier(0.2,0.8,0.2,1);">
                ${image ? `
                    <div style="width:100%;background:#05070c;border-bottom:1px solid ${color}30;">
                        <img src="${image}" alt="${char.name}" style="width:100%;height:auto;max-height:55vh;object-fit:contain;display:block;"
                             onerror="this.parentElement.style.display='none';" />
                    </div>` : ''}
                <div style="padding:22px 22px 18px;">
                    <div style="font-size:0.62em;letter-spacing:2px;color:${color};font-weight:900;text-transform:uppercase;margin-bottom:6px;">
                        ${char.name}${c.title ? ' · ' + c.title : ''}
                    </div>
                    <div style="font-size:0.95em;line-height:1.65;color:#e2e8f0;min-height:60px;">
                        ${pages[pageIdx] || ''}
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:18px;">
                        <div style="font-size:0.6em;color:#64748b;letter-spacing:1px;">
                            ${pages.length > 1 ? (pageIdx + 1) + ' / ' + pages.length : ''}
                        </div>
                        <button id="storyEvtNext" style="background:${color}22;border:1px solid ${color}66;color:${color};
                                font-weight:800;padding:9px 22px;border-radius:10px;cursor:pointer;font-size:0.85em;letter-spacing:0.5px;">
                            ${isLast ? 'Continuer' : 'Suite →'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        const btn = document.getElementById('storyEvtNext');
        if (btn) btn.onclick = () => {
            if (pageIdx < pages.length - 1) { pageIdx++; render(); }
            else close();
        };
    }

    function close() {
        overlay.style.animation = 'awakFadeOut 0.35s forwards';
        setTimeout(() => overlay.remove(), 350);
        // Après la rencontre du Marchand : fenêtre explicative (une seule fois)
        if (evt.id === 'evt_n3_marchand') {
            setTimeout(() => {
                try {
                    if (typeof window.awakShowMerchantGuide === 'function'
                        && !(window.awakMerchantGuideSeen && window.awakMerchantGuideSeen())) window.awakShowMerchantGuide();
                } catch (e) {}
            }, 450);
        }
    }

    // S'assurer que les keyframes existent (réutilise celles des cartes Système)
    if (!document.getElementById('awakCardStyles')) {
        const s = document.createElement('style');
        s.id = 'awakCardStyles';
        s.textContent = '@keyframes awakCardRise{from{opacity:0;transform:translateY(26px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}';
        document.head.appendChild(s);
    }
    if (!document.getElementById('awakSystemStyles')) {
        const s = document.createElement('style');
        s.id = 'awakSystemStyles';
        s.textContent = '@keyframes awakFadeIn{from{opacity:0}to{opacity:1}}@keyframes awakFadeOut{from{opacity:1}to{opacity:0}}@keyframes awakBlink{50%{opacity:0.3}}';
        document.head.appendChild(s);
    }

    document.body.appendChild(overlay);
    render();
}

// ── POINT D'ENTRÉE : à appeler après une séance / un événement ─────
// Affiche au plus UN événement éligible. Marque comme vu.
function storyCheckEvents(opts) {
    try {
        // Jeu désactivé → aucun événement narratif / cinématique.
        if (typeof rpgEnabled === 'function' && !rpgEnabled()) return false;
        // Ne pas chevaucher un autre overlay narratif
        if (document.getElementById('storyOverlay') ||
            document.getElementById('storyEventOverlay') ||
            document.getElementById('awakSystemCardOverlay')) return false;
        const evt = storyPickEvent();
        if (!evt) {
            // Histoire peut-être bloquée par une Faille narrative non faite → inviter
            storyMaybeHintNarrativeRift(opts);
            return false;
        }
        if (evt.once !== false) storyEventMarkSeen(evt.id);
        const delay = (opts && opts.delay) || 0;
        setTimeout(() => storyShowEvent(evt), delay);
        return true;
    } catch(e) { return false; }
}

// Noms lisibles des Failles narratives (pour l'invitation)
const NARRATIVE_RIFT_NAMES = {
    first_breach: 'Le Premier Souvenir',
    whispering_tower: 'La Tour qui Murmure',
    silent_one: 'Le Silencieux',
    the_one_who_carried: 'Celui qui a Porté',
    last_door: 'La Dernière Porte'
};

// Si l'histoire est bloquée par une porte (niveau atteint, Faille non faite),
// afficher un indice incitant le joueur à compléter la Faille narrative.
function storyMaybeHintNarrativeRift(opts) {
    try {
        const ctx = storyBuildContext();
        for (const evt of STORY_EVENTS) {
            if ((evt.once !== false) && storyEventSeen(evt.id)) continue;
            if (evt.trigger && evt.trigger.kind === 'levelAndNarrativeRift') {
                const lvlReached = (ctx.level || 0) >= evt.trigger.value;
                const riftDone = awakNarrativeRiftDone(evt.trigger.narrativeId);
                if (lvlReached && !riftDone) {
                    // Ne pas spammer : une fois par jour max
                    const dayKey = new Date().toDateString();
                    const shownKey = 'awakRiftHint_' + evt.trigger.narrativeId;
                    if (localStorage.getItem(shownKey) === dayKey) return;
                    localStorage.setItem(shownKey, dayKey);
                    const name = NARRATIVE_RIFT_NAMES[evt.trigger.narrativeId] || 'une Faille particulière';
                    const delay = (opts && opts.delay) || 0;
                    setTimeout(() => {
                        if (typeof showToast === 'function') {
                            showToast('🌌 L\'histoire ne peut continuer sans franchir « ' + name +' ». Ouvre l\'onglet Failles.', 'info', 6000);
                        }
                    }, delay);
                    return; // une seule invitation à la fois (la plus précoce)
                }
            }
        }
    } catch(e) {}
}

// ── RÉACTION D'UN HÉROS (déçu mais bienveillant) ───────────────────
// reason : 'streak' | 'absence' | 'abandon'
// Affiche Esen ou Nyra (aléatoire) avec un message motivant, jamais culpabilisant.
function awakShowHeroReaction(reason) {
    try {
        // Seulement si mode jeu actif ET rencontre déjà faite
        const jeuActif = (typeof rpgEnabled === 'function') && rpgEnabled();
        if (!jeuActif) return false;
        if (typeof window.AwakCine !== 'undefined' && window.AwakCine.defer(function () { awakShowHeroReaction(reason); })) return false;
        if (document.getElementById('storyEventOverlay') || document.getElementById('heroReactionOverlay')) return false;

        // Le PARTENAIRE réagit (le joueur incarne l'autre héros)
        const hero = awakHerosJoue() === 'esen' ? 'nyra' : 'esen';
        const heroName = hero === 'esen' ? 'Esen' : 'Nyra';
        const color = hero === 'esen' ? '#4ade80' : '#a855f7';
        const img = 'images/story/' + hero + '_fache.webp';

        // Messages bienveillants par contexte et par perso
        const messages = {
            streak: {
                esen: "« Ta série s'est brisée. Ce n'est pas grave. Ce qui compte, c'est que tu sois revenu. On recommence. »",
                nyra: "« Bon. T'as lâché ta série. » Elle soupire, puis sourit malgré elle. « Allez, on s'en fiche. Recommence avec moi. »"
            },
            absence: {
                esen: "« Tu es parti un moment. » Un silence. « Le monde a un peu pâli. Mais tu es là maintenant. C'est tout ce qui compte. »",
                nyra: "« Te revoilà, toi ! » Elle croise les bras, faussement vexée. « J'ai failli m'inquiéter. Bon. On reprend où on s'était arrêtés ? »"
            },
            // 🛌 REPOS ASSUMÉ — le joueur s'est mis à l'abri (douleur déclarée,
            // muscles en récupération). Ce n'est PAS de l'abandon : le Système
            // le reconnaît explicitement, pour ne jamais culpabiliser une pause
            // légitime. C'est la distinction centrale de l'histoire :
            // le repos prépare le retour, l'abandon est un renoncement.
            repos: {
                esen: "« Tu t'es arrêté pour te soigner. » Il hoche la tête, sans reproche. « Ce n'est pas la même chose que renoncer. Se mettre à l'abri, c'est encore tenir. »",
                nyra: "« Alors, on se ménageait ? » Elle hausse les épaules, presque fière. « T'as bien fait. Un corps cassé, ça ne porte rien du tout. On reprend quand il est prêt. »"
            },
            abandon: {
                esen: "« Tu t'es arrêté en cours de route. » Un silence. Sans reproche. « La prochaine fois, va au bout. Je sais que tu peux. »",
                nyra: "« Hé, t'abandonnes pas comme ça ! » Elle fronce les sourcils. « ...Bon, ça arrive. Mais la prochaine, tu finis. Promis ? »"
            }
        };
        const msg = (messages[reason] && messages[reason][hero]) || messages.streak[hero];

        const overlay = document.createElement('div');
        overlay.id = 'heroReactionOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:99997;background:rgba(0,0,0,0.93);backdrop-filter:blur(9px);display:flex;align-items:center;justify-content:center;padding:22px;opacity:0;animation:awakFadeIn 0.45s forwards;';
        overlay.innerHTML = `
            <div style="max-width:400px;width:100%;background:linear-gradient(165deg,${color}14,rgba(8,12,20,0.97) 60%);border:1px solid ${color}55;border-radius:20px;overflow:hidden;box-shadow:0 0 44px ${color}33;animation:awakCardRise 0.5s cubic-bezier(0.2,0.8,0.2,1);">
                <div style="width:100%;background:#05070c;border-bottom:1px solid ${color}30;">
                    <img src="${img}" alt="${heroName}" style="width:100%;height:auto;max-height:55vh;object-fit:contain;display:block;" onerror="this.parentElement.style.display='none';" />
                </div>
                <div style="padding:22px;">
                    <div style="font-size:0.62em;letter-spacing:2px;color:${color};font-weight:900;text-transform:uppercase;margin-bottom:8px;">${heroName}</div>
                    <div style="font-size:0.95em;line-height:1.65;color:#e2e8f0;">${msg}</div>
                    <button id="heroReactClose" style="margin-top:18px;width:100%;background:${color}22;border:1px solid ${color}66;color:${color};font-weight:800;padding:11px;border-radius:10px;cursor:pointer;font-size:0.9em;">On y retourne</button>
                </div>
            </div>`;
        // keyframes (réutilise celles existantes)
        if (!document.getElementById('awakSystemStyles')) {
            const s = document.createElement('style'); s.id = 'awakSystemStyles';
            s.textContent = '@keyframes awakFadeIn{from{opacity:0}to{opacity:1}}@keyframes awakFadeOut{from{opacity:1}to{opacity:0}}@keyframes awakCardRise{from{opacity:0;transform:translateY(26px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}';
            document.head.appendChild(s);
        }
        document.body.appendChild(overlay);
        const close = () => { overlay.style.animation = 'awakFadeOut 0.35s forwards'; setTimeout(() => overlay.remove(), 350); };
        const btn = document.getElementById('heroReactClose');
        if (btn) btn.onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
        return true;
    } catch(e) { return false; }
}

// ── 🌫️ MURMURE DU DÉCLIN ───────────────────────────────────────────
// Quand la jauge du Déclin monte (jours sans séance), Nabdano parle au
// joueur à l'ouverture de l'appli. 1× par jour max, jamais avant la Rencontre.
// Les héros répondent ensuite (réaction d'absence déjà en place).
var MURMURES = {
    bas: [
        "« Tu vois ? Ce n'était pas si difficile, de t'arrêter. »",
        "« Personne ne t'en veut. Reste assis encore un peu. Juste un peu. »",
        "« Écoute comme le monde est calme, quand on ne bouge plus. »",
        "« Demain. Tu reprendras demain. C'est ce que je me disais, moi aussi. »"
    ],
    haut: [
        "« Ils vont arrêter de t'attendre. Ils finissent tous par arrêter. »",
        "« Moi aussi, j'ai pris un jour de repos. Un seul. Il dure encore. »",
        "« Tu n'as plus rien à porter. Pose tout. Je m'occupe du reste. »"
    ]
};
function awakMurmureDeclin() {
    try {
        if (typeof rpgEnabled === 'function' && !rpgEnabled()) return false;
        if (!storyEventSeen('evt_rencontre') || storyEventSeen('evt_fin_ancre')) return false;
        var p = (typeof awakGetMonarchPower === 'function') ? awakGetMonarchPower() : 0;
        if (p < 40) return false;
        var jour = new Date().toDateString();
        if (localStorage.getItem('awakMurmureJour') === jour) return false;
        localStorage.setItem('awakMurmureJour', jour);
        var pool = p >= 70 ? MURMURES.haut : MURMURES.bas;
        var n = Math.floor(Date.now() / 86400000) % pool.length;
        storyShowEvent({ id: 'murmure', content: { speaker: 'nabdano', title: 'Une Voix', pages: [
            pool[n],
            "Le Système n'affiche rien. Quelque part, au coin d'une rue, {partenaire} t'attend sur une borne. {Il} ne sait pas encore si tu vas venir."
        ] } });
        return true;
    } catch (e) { return false; }
}

// ── 🚪 LE RETOUR — première séance après une longue absence ─────────
// Joué À LA PLACE de l'événement normal : revenir est un acte de l'histoire.
var RETOURS = [
    [
        "{partenaire} est assis{pe} sur une borne, au coin de la rue. Comme si {il} n'avait pas bougé depuis ton départ.",
        "{Il} se lève sans un mot et te tend une bouteille d'eau. Pas de question. « Je t'ai gardé ta place. »",
        "Le Système : « Signal retrouvé. Pendant ton absence, une rue a pâli. Elle reprend déjà ses couleurs. »",
        "Très loin, une voix soupire. Déçue."
    ],
    [
        "{partenaire} t'attend devant la Faille, les bras croisés. Un long silence.",
        "« Il t'a parlé, pendant que tu n'étais pas là ? » Tu ne réponds pas. {partenaire} hoche la tête.",
        "« À moi aussi, il parle. On lui répond pareil : en revenant. » Puis, plus bas : « Règle numéro quatre : on revient toujours. Je viens de l'inventer. »",
        "Très loin, une voix soupire. Déçue."
    ],
    [
        "« Tu es revenu{e}, » affiche le Système. Les lettres sont pâles, mais elles sont là.",
        "« Je ne te demande pas pourquoi tu es parti{e}. Je te demande seulement de recommencer. »",
        "Un temps. « C'est fait. »",
        "{partenaire} te donne un coup d'épaule en passant. Venant de {partenaire}, c'est une fête.",
        "Très loin, une voix soupire. Déçue."
    ]
];
function awakSceneRetour(jours) {
    try {
        if (typeof rpgEnabled === 'function' && !rpgEnabled()) return false;
        if (!storyEventSeen('evt_rencontre') || !(jours >= 10)) return false;
        var n = parseInt(localStorage.getItem('awakRetoursVus') || '0', 10) || 0;
        localStorage.setItem('awakRetoursVus', String(n + 1));
        storyShowEvent({ id: 'retour', content: { speaker: 'systeme', title: 'Le Retour',
            image: 'images/story/monde_efface.webp', pages: RETOURS[n % RETOURS.length] } });
        return true;
    } catch (e) { return false; }
}

// ── EXPORTS ────────────────────────────────────────────────────────
window.STORY_EVENTS       = STORY_EVENTS;
window.storyEventSeen     = storyEventSeen;
window.STORY_CHARS        = STORY_CHARS;
window.storyCheckEvents   = storyCheckEvents;
window.storyShowEvent     = storyShowEvent;
window.storyPickEvent     = storyPickEvent;
window.storyEventEligible = storyEventEligible;
window.awakShowHeroReaction = awakShowHeroReaction;
window.awakMurmureDeclin = awakMurmureDeclin;
window.awakHerosPages = awakHerosPages;
window.awakHerosJoue = awakHerosJoue;
window.awakSceneRetour = awakSceneRetour;
window.STORY_CHARS        = STORY_CHARS;
window.storyCheckEvents   = storyCheckEvents;
window.storyShowEvent     = storyShowEvent;
window.storyPickEvent     = storyPickEvent;
window.storyEventEligible = storyEventEligible;


// ════════════════════════════════════════════════════════════════════
// 📊 BILAN DE PARCOURS (indicatif)
// ⚠️ N'EST PLUS UTILISÉ POUR DÉPARTAGER LA FIN : tous les joueurs
// obtiennent L'Ancre. Cette fonction reste disponible pour afficher
// un récapitulatif (compagnons rencontrés, Failles narratives vécues)
// ou pour l'arc SS/SSS à venir.
// Historique — l'ancienne règle était :
// La fin n'est pas un choix de dernière minute : c'est un BILAN DE
// PARCOURS. La question posée au joueur est celle qui a détruit
// Nabdano — as-tu porté seul, ou accompagné ?
//   L'ANCRE : ≥3 compagnons sur 5 ET ≥3 Failles narratives sur 4.
//   L'ÉCHO  : sinon. Pas une punition : une ouverture (arc SS/SSS).
// Non contournable : un compagnon exige de fermer sa Faille dédiée,
// et les Failles narratives demandent de vraies séances.
// ════════════════════════════════════════════════════════════════════
var AWAK_NARRATIVE_RIFT_IDS = ['evt_n33_ambiance_systeme_revelation', 'evt_n35_ambiance_nabdano_nom',
                               'evt_n65_ambiance_nabdano', 'evt_n75_ambiance_porte'];

function awakGetEndingState() {
    var compagnons = 0, failles = 0;
    try {
        if (typeof awakCompanionsLoad === 'function') {
            var d = awakCompanionsLoad();
            compagnons = (d && Array.isArray(d.unlocked)) ? d.unlocked.length : 0;
        }
    } catch (e) {}
    try {
        AWAK_NARRATIVE_RIFT_IDS.forEach(function (id) {
            if (localStorage.getItem('awakStoryEvt_' + id) === '1'
                || localStorage.getItem('fitproStorySeen_' + id) === '1') { failles++; }
        });
    } catch (e) {}
    var ancre = (compagnons >= 3 && failles >= 3);
    return {
        ending: ancre ? 'ancre' : 'echo',
        compagnons: compagnons,
        failles: failles,
        manqueCompagnons: Math.max(0, 3 - compagnons),
        manqueFailles: Math.max(0, 3 - failles)
    };
}
try { window.awakGetEndingState = awakGetEndingState; } catch (e) {}

})();
