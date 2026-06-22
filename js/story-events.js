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
    nabdano: { name: '???',   color: '#cbd5e1', image: null },   // jamais nommé tôt
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
    {
        // ── Niveau ~3 : la dynamique du duo s'installe (suite directe de La Rencontre)
        id: 'evt_n3_regles_duo',
        type: 'dialogue',
        trigger: { kind: 'xp', value: 230 },
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
                "« Tiens, tiens… deux Veilleurs tout neufs. » Il écarte les bras vers son bazar. « Bienvenue. Je suis Le Marchand — le seul fou qui suit les Failles au lieu de les fuir. »",
                "Nyra fronce les sourcils. « Tu vends quoi, au juste ? » Il sourit. « Tout ce qui rend plus fort. De l'équipement, des potions, et surtout… j'achète. »",
                "Il pointe les éclats brillants tombés des Failles que vous avez fermées. « Ces minéraux que vous ramassez sans y penser ? De l'or, entre de bonnes mains. Les miennes. Apportez-les-moi, je les transforme en pouvoir. »",
                "Esen examine une lame à l'aura violette, silencieux. Le Marchand glisse : « Le silencieux a bon goût. Reviens quand ta bourse suivra. » Il tapote son comptoir gravé du logo AV. « Mon échoppe est à vous, désormais. Faille après Faille, je serai là. »"
            ]
        }
    },
    {
        // ── Niveau ~4 : worldbuilding — apprendre à sentir les Failles
        id: 'evt_n4_sentir_failles',
        type: 'fait',
        trigger: { kind: 'xp', value: 520 },
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
        trigger: { kind: 'xp', value: 870 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'La Boulangerie',
            image: 'images/story/n5_boulangerie.webp',
            pages: [
                "Nyra vous traîne dans une petite boulangerie. « Meilleurs croissants de la ville. La dame me connaît, vous allez voir. »",
                "La vendeuse lève les yeux. Sourire poli. « Bonjour. Qu'est-ce que je vous sers ? » Le sourire de Nyra se fige un quart de seconde.",
                "« ...Trois croissants, » dit-elle d'une voix un peu plus basse. Dehors, elle hausse les épaules. « Elle a dû me confondre. Elle voit du monde. » Personne ne la contredit.",
                "Esen attend qu'elle soit devant, hors de portée de voix. « Ça a commencé pour elle aussi. » Il croque dans son croissant. « C'est pour ça qu'on s'entraîne. »"
            ]
        }
    },
    {
        id: 'evt_n6_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', value: 1350 },
        once: true,
        content: { speaker: 'nyra', title: 'Concentration ?', image: 'images/story/cocasse_7.webp',
            pages: ["Nyra étire la joue d'Esen pendant qu'il frappe le sac. « Quoi ? Je teste ta concentration ! »"] }
    },
    {
        id: 'evt_n8_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', value: 3320 },
        once: true,
        content: { speaker: 'esen', title: 'Poids Supplémentaire', image: 'images/story/cocasse_6.webp',
            pages: ["Esen s'est assis sur le dos de Nyra en pleine pompe, sirotant tranquillement. « Tranquille... t'es qu'une machine. »"] }
    },
    {
        id: 'evt_n10_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', value: 6180 },
        once: true,
        content: { speaker: 'nyra', title: 'Patatrac', image: 'images/story/cocasse_3.webp',
            pages: ["Esen trébuche en plein combat. Nyra éclate de rire en finissant le monstre à sa place. « AHAHAHA ! »"] }
    },
    {
        id: 'evt_n12_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', value: 9220 },
        once: true,
        content: { speaker: 'nyra', title: 'Festin Mérité', image: 'images/story/cocasse_2.webp',
            pages: ["Après la séance, ils s'effondrent devant une montagne de nourriture. « Mmmh, trop bon ! » Nyra ne mâche même plus."] }
    },
    {
        id: 'evt_n14_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', value: 14780 },
        once: true,
        content: { speaker: 'nyra', title: 'Attrape-moi', image: 'images/story/cocasse_1.webp',
            pages: ["« Attrape-moi si tu peux ! » Esen file devant. Nyra le poursuit dans toute la ville. « ESEN, T'ES MORT !! »"] }
    },
    {
        id: 'evt_n16_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', value: 22020 },
        once: true,
        content: { speaker: 'esen', title: 'Petit Conseil', image: 'images/story/cocasse_4.webp',
            pages: ["Assis dans l'herbe, Esen pointe le front de Nyra du doigt. « La prochaine fois, réfléchis avant de foncer. » Elle boude."] }
    },
    {
        id: 'evt_n18_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', value: 30290 },
        once: true,
        content: { speaker: 'nyra', title: 'Toute ta Puissance ?', image: 'images/story/cocasse_5.webp',
            pages: ["Nyra nargue Esen après un combat. « Alors... c'est ça toute ta puissance ? » Esen, blasé : « ... »"] }
    },
    {
        id: 'evt_n20_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', value: 41210 },
        once: true,
        content: { speaker: 'systeme', title: 'Bivouac', image: 'images/story/repos_avant_faille.webp',
            pages: ["La nuit, près du feu, face à une Faille lointaine. Personne ne parle. Pour une fois, le silence est doux."] }
    },
    {
        id: 'evt_n22_cocasse',
        minor: true,  // exclu du Journal d'aventure (scène légère)
        type: 'fait',
        trigger: { kind: 'xp', value: 54270 },
        once: true,
        content: { speaker: 'esen', title: 'Elle ne Ralentit Jamais', image: 'images/story/cocasse_8.webp',
            pages: ["Nyra court sur le tapis, infatigable. Esen la regarde, les mains dans les poches. Il ne le dira jamais, mais il l'admire."] }
    },
    {
        id: 'evt_n7_fait_nyra',
        type: 'fait',
        trigger: { kind: 'xp', value: 1860 },
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
    {
        id: 'evt_n9_ambiance_oubli',
        type: 'ambiance',
        trigger: { kind: 'xp', value: 4190 },
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
        id: 'evt_n11_dialogue_duo',
        type: 'dialogue',
        trigger: { kind: 'xp', value: 7790 },
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
        id: 'evt_n13_fait_systeme',
        type: 'fait',
        trigger: { kind: 'xp', value: 12360 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Statistique Inutile',
            pages: [
                "Le Système affiche soudain : « Information : tu as soulevé, poussé ou déplacé l'équivalent du poids d'un petit immeuble depuis ton éveil. »",
                "Un court silence. « Cette donnée n'a aucune utilité tactique. Je voulais juste que tu le saches. »",
                "Tu jurerais presque que ce fragment de monde, accroché à toi, est... fier ?"
            ]
        }
    },
    {
        id: 'evt_n15_ambiance_traces',
        type: 'ambiance',
        trigger: { kind: 'xp', value: 18900 },
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
        id: 'evt_n17_fait_nyra',
        type: 'fait',
        trigger: { kind: 'xp', value: 27220 },
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
        id: 'evt_n19_ambiance_systeme',
        type: 'ambiance',
        trigger: { kind: 'xp', value: 34410 },
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
        id: 'evt_n21_dialogue_duo',
        type: 'dialogue',
        trigger: { kind: 'xp', value: 46190 },
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
        id: 'evt_n23_fait_leger',
        type: 'fait',
        trigger: { kind: 'xp', value: 58910 },
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
        trigger: { kind: 'xp', value: 75010 },
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
    {
        id: 'evt_n27_dialogue_esen',
        type: 'dialogue',
        trigger: { kind: 'xp', value: 93570 },
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
        trigger: { kind: 'xp', value: 108490 },
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
        id: 'evt_n31_dialogue_duo',
        type: 'dialogue',
        trigger: { kind: 'xp', value: 136470 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'L\'Inscription, à Deux',
            image: 'images/story/dos_a_dos.webp',
            pages: [
                "Nyra a vu l'inscription, elle aussi. Pour une fois, elle ne plaisante pas.",
                "« Quelqu'un d'aussi fort que ça... qui a juste arrêté. » Elle frissonne. « Ça me fait plus peur que tous les monstres. »",
                "Esen pose une main sur son épaule. Un geste rare. « C'est pour ça qu'on est deux. On se surveille. Si l'un de nous commence à vouloir s'asseoir... »",
                "« ...l'autre le force à se relever, » termine Nyra. Vous le pensez tous les trois, le Système y compris."
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
                "« Et l'effacement s'est répandu depuis lui, comme une fissure. Les survivants l'appellent par un nom, maintenant. »",
                "« Nabdano. Retiens-le. Tôt ou tard, il voudra que tu t'assoies, toi aussi. »"
            ]
        }
    },
    {
        id: 'evt_n37_fait_respiration',
        type: 'fait',
        trigger: { kind: 'xp', value: 215370 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'Malgré Tout',
            pages: [
                "Le nom de Nabdano pèse sur vous trois depuis des jours. Alors Nyra décrète : « Pause. Aujourd'hui on ne sauve pas le monde. »",
                "Elle invente un jeu débile : nommer à voix haute une chose qui vaut encore la peine d'exister. Le café chaud. Le bruit de la pluie. Un certain silence partagé.",
                "Esen, après un long moment, dit un seul mot, en regardant Nyra : « Ça. » Elle rougit et change vite de sujet. Mais elle l'a entendu."
            ]
        }
    },
    {
        id: 'evt_n39_ambiance_voix',
        type: 'ambiance',
        trigger: { kind: 'xp', value: 247080 },
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
        trigger: { kind: 'xp', value: 284760 },
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
        trigger: { kind: 'xp', value: 313910 },
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
    {
        id: 'evt_n45_ambiance_approche',
        type: 'ambiance',
        trigger: { kind: 'xp', value: 357440 },
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
        trigger: { kind: 'xp', value: 400430 },
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
        trigger: { kind: 'xp', value: 450800 },
        once: true,
        content: {
            speaker: 'nyra',
            title: 'Tenir la Main',
            image: 'images/story/moment_suspendu.webp',
            pages: [
                "La voix de Nabdano est partout maintenant. Difficile de penser. Difficile d'avancer.",
                "Sans un mot, Nyra prend la main d'Esen. Il ne la retire pas. Personne n'a besoin de parler.",
                "« Tant qu'on se touche, » dit Nyra, « il ne peut pas nous prendre un par un. »",
                "Le Système, presque ému : « Trois signaux. Entrelacés. Je n'ai jamais rien vu d'aussi difficile à effacer. »"
            ]
        }
    },
    {
        id: 'evt_n51_fait_souvenir',
        type: 'fait',
        trigger: { kind: 'xp', value: 504880 },
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
        trigger: { kind: 'xp', value: 562760 },
        once: true,
        content: {
            speaker: 'nabdano',
            title: 'Le Doute',
            pages: [
                "« Regarde tout ce que tu ramènes, » murmure Nabdano. « Et regarde comme ça te coûte. Chaque jour. Encore. »",
                "« Moi aussi, j'ai ramené des choses, autrefois. Pendant des siècles. Jusqu'à ce que je comprenne que ça ne finit jamais. »",
                "« Ce n'est pas de la faiblesse, de vouloir que ça s'arrête. C'est de la lucidité. »",
                "Pour la première fois, une partie de toi comprend ce qu'il ressent. Et c'est ça, le plus effrayant."
            ]
        }
    },
    {
        id: 'evt_n55_dialogue_esen',
        type: 'dialogue',
        trigger: { kind: 'xp', value: 606790 },
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
        trigger: { kind: 'xp', value: 665940 },
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
    {
        id: 'evt_n61_ambiance_proche',
        type: 'ambiance',
        trigger: { kind: 'xp', value: 806990 },
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
        id: 'evt_n70_dialogue_duo',
        type: 'dialogue',
        trigger: { kind: 'xp', value: 1162610 },
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
    {
        id: 'evt_n75_ambiance_porte',
        type: 'ambiance',
        trigger: { kind: 'levelAndNarrativeRift', value: 75, narrativeId: 'last_door' },
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
    }
];

// ── ÉTAT / ANTI-DOUBLON ────────────────────────────────────────────
function _seenKey(id) { return 'awakStoryEvt_' + id; }
function storyEventSeen(id) { return localStorage.getItem(_seenKey(id)) === '1'; }
function storyEventMarkSeen(id) { try { localStorage.setItem(_seenKey(id), '1'); } catch(e) {} }

// ── ÉVALUATION DES DÉCLENCHEURS ────────────────────────────────────
function storyEventEligible(evt, ctx) {
    if (!evt || !evt.trigger) return false;
    if ((evt.once !== false) && storyEventSeen(evt.id)) return false;
    const t = evt.trigger;
    switch (t.kind) {
        case 'always':   return true;
        case 'workouts': return (ctx.workouts || 0) >= t.value;
        case 'level':    return (ctx.level || 0) >= t.value;
        case 'xp':       return (ctx.xp || 0) >= t.value;
        case 'rifts':    return (ctx.rifts || 0) >= t.value;
        case 'rank': {
            const order = ['E','D','C','B','A','S','SS','SSS'];
            return order.indexOf(ctx.rank || 'E') >= order.indexOf(t.value);
        }
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
    const c = evt.content;
    const char = STORY_CHARS[c.speaker] || STORY_CHARS.systeme;
    const color = char.color;
    const image = c.image || char.image; // override possible par event
    const pages = c.pages || [];
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
        if (document.getElementById('storyEventOverlay') || document.getElementById('heroReactionOverlay')) return false;

        const hero = Math.random() < 0.5 ? 'esen' : 'nyra';
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

// ── EXPORTS ────────────────────────────────────────────────────────
window.STORY_EVENTS       = STORY_EVENTS;
window.storyEventSeen     = storyEventSeen;
window.STORY_CHARS        = STORY_CHARS;
window.storyCheckEvents   = storyCheckEvents;
window.storyShowEvent     = storyShowEvent;
window.storyPickEvent     = storyPickEvent;
window.storyEventEligible = storyEventEligible;
window.awakShowHeroReaction = awakShowHeroReaction;
window.STORY_CHARS        = STORY_CHARS;
window.storyCheckEvents   = storyCheckEvents;
window.storyShowEvent     = storyShowEvent;
window.storyPickEvent     = storyPickEvent;
window.storyEventEligible = storyEventEligible;

})();
