# AWAKENED — Bible narrative « Le Monde qui s'efface »

> Document de référence du design narratif. À lire avant de coder l'histoire.
> Tout est VALIDÉ par l'utilisateur sauf mention « à définir ».

---

## 1. CONCEPT CENTRAL

Tout le récit est une **métaphore 100% voilée** de la lutte du pratiquant contre
lui-même. **Rien n'est jamais dit explicitement** — le joueur devine.

- Ton : **sombre et mélancolique**.
- Inspirations assumées : **Clair Obscur Expédition 33** (méchant tragique qu'on
  comprend) + **Undertale** (métaphore directe + plusieurs fins selon le joueur).

---

## 2. L'UNIVERS

- Le monde se dissout dans l'**Oubli** : des pans de réalité disparaissent dans
  un silence blanc.
- **Le joueur = un Ancre** : un des rares assez « réels » pour résister.
  S'entraîner = devenir plus dense, plus difficile à effacer.
  *(métaphore : se construire, refuser de se laisser aller)*
- **Les monstres des Failles** = fragments du monde à moitié effacés.
  *(métaphore : fatigue, excuses, procrastination, découragement)*
- **Le Système** = le dernier fragment du monde qui refuse de disparaître. Il
  n'est PAS tout-puissant : il s'accroche au joueur pour survivre. Si le joueur
  tombe, le Système s'éteint. Ils se maintiennent mutuellement.
  *(révélé vers rang B-A)*

---

## 3. LE MÉCHANT — NABDANO

- **Nabdano = anagramme d'ABANDON** (secret caché pour le joueur attentif).
- C'était autrefois le plus grand Ancre, qui tenait le monde seul. Un jour, par
  fatigue infinie (le jour où plus personne ne le regardait tenir), il s'est
  « assis ». Son propre Système s'est éteint, faute de quelqu'un pour le tenir,
  et l'effacement s'est répandu.
- Il efface le monde car l'oubli fait moins mal que de continuer à lutter.
- **On le comprend, mais ce qu'il fait est MAL.** Jamais explicite : il parle de
  fatigue, de repos, de paix, de « à quoi bon » — jamais d'entraînement/abandon.

---

## 4. STRUCTURE NARRATIVE — DEUX COUCHES

### Couche A — Gros chapitres jouables (aux montées de RANG)
Chaque rang déclenche une **Faille d'Histoire** jouable :
**texte d'intro → séance spéciale calibrée sur le rang → texte de conclusion.**
- **BLOQUANTE** : tant qu'elle n'est pas finie, les Failles normales sont bloquées.
- Thème unique dédié à chaque chapitre.

Arc Nabdano = **Prologue → Rang S** (se conclut à S, PAS à SSS) :
- **Prologue** (éveil) — le monde pâlit, le Système tend la main
- **Rang D — Les Petites Voix** — monstres qui murmurent « pas aujourd'hui »
- **Rang C — Le Poids** — créatures qui s'accrochent ; 1re trace de Nabdano
- **Rang B — Celui d'Avant** — RÉVÉLATION du Système (il dépend de toi) + nom Nabdano
- **Rang A — La Voix Familière** — Nabdano te parle avec ta propre voix
- **Rang S — Le Face-à-Face + CONCLUSION de l'arc** — résolution de Nabdano
  *(conclusion exacte : À DÉFINIR — options proposées : le relever / l'arrêter
  avec respect / il s'efface en paix / fin douce-amère)*

### Rangs SS et SSS = NOUVEL ARC, sans lien avec Nabdano
- Contenu : **à définir** (après avoir fini Nabdano).
- Aura ses **propres fins** basées sur l'assiduité.

### Couche B — Fragments narratifs (entre les NIVEAUX)
- **~30 fragments**, un tous les **2-3 niveaux** (jusqu'au rang S = niveau 80).
- Longueur : **2-3 phrases** chacun.
- Tissent l'histoire en continu, préparent les chapitres de rang.
- Suivent la même progression (Petites Voix → Poids → traces → voix de Nabdano).

> NOTE : il existe DÉJÀ un système de fragments par jalons (v173, `STORY_FRAGMENTS`
> + `awakCheckStoryFragments`) basé sur séances/streak/Failles. À FAIRE ÉVOLUER
> vers un déclenchement par NIVEAU (tous les 2-3 niveaux) et réécrire les textes
> dans l'univers « Monde qui s'efface ».

---

## 5. LES DEUX FINS (nouvel arc SS/SSS — déterminées par l'assiduité)

Logique d'assiduité = **DÉJÀ CODÉE en v174** : `awakIsPlayerDedicated()`.
Assidu si **≥50% des semaines ont eu ≥2 entraînements OU record de streak ≥14 jours**.
(`bestStreak` est tracké depuis v174.)

- **Fin « L'Ancre » (assidu)** : tu tends la main, tu restes debout. L'autre se
  relève. Le monde reprend ses couleurs. Le Système retrouve sa voix pleine.
- **Fin « L'Écho » (irrégulier)** : tes propres pas sont hésitants. « Tu me
  ressembles plus que tu ne crois. » Tu l'arrêtes pour l'instant, mais la Faille
  attend. Le Système, faible : « Reviens. Tiens-toi mieux. »

> NOTE : ces 2 fins étaient initialement écrites pour Nabdano. Comme l'arc Nabdano
> se clôt à S, ces fins appartiennent désormais au NOUVEL ARC (SS/SSS). À retravailler.

---

## 6. COMPAGNONS (passage de 8 → 5)

### On GARDE 5 : Marcus, Kira, Élise, Yuna, Chen
### On RETIRE 3 : Jules, Halberd, Storm
> ⚠️ ANTI-CASSE : avant suppression, vérifier `awakGetCompanionById()` qui peut
> retourner `undefined` si un joueur a un compagnon retiré en actif. Les bonus
> (bossHpCut de Halberd, etc.) sont consommés défensivement → pas de crash, mais
> à valider. Gérer les sauvegardes existantes (compagnon actif disparu).

### Déblocage par AVANCEMENT DANS LE SCÉNARIO (remplace conditions actuelles) :
- **Marcus** (Le Brutal, STR) → Rang E→D (1er allié)
- **Kira** (L'Ombre, AGI) → Rang D→C
- **Élise** (La Médic, soin) → Rang C→B
- **Yuna** (La Mystique) → Rang B→A (au moment de la révélation du Système)
- **Chen** (Le Sage, sceptique du Système) → Rang A→S (juste avant Nabdano)

### Mécanique de DÉPART d'un compagnon
- Déclenché **scénarisé ET parfois aléatoire**.
- Devient indisponible (inutilisable) jusqu'à un certain point.
- **Retour : dépend de la raison du départ** :
  - aventure → revient seul après X jours/séances
  - bêtise → le joueur doit faire qqch pour le récupérer
  - (autres raisons à définir)
> NOTE : système de blessure/indispo existe déjà (`awakCompanionInjuryRemaining`).
> S'en inspirer / l'étendre.

---

## 7. LES DEUX HÉROS — ESEN & NYRA

- Le joueur choisit son **genre d'avatar** (déjà en place :
  `fitproAvatarGender`, images `images/avatars/avatar_homme.png` &
  `avatar_femme.png`).
- **Deux héros aux noms DISTINCTS** (plus de système Lyra/Lyam) :
  - **ESEN** — héros masculin. Le **SILENCIEUX** : discipline tranquille,
    économe en mots, présence solide. Aura **verte** (#4ade80).
  - **NYRA** — héroïne féminine. La **JOUEUSE** : obstination ironique,
    taquine, refuse le désespoir par l'humour ; sous la blague, une fêlure.
    Aura **violette**.
- **Personnalités FIXES par perso** (peu importe qui le joueur incarne) :
  les dialogues écrivent toujours Nyra vive et Esen sobre.
- Le joueur s'identifie à celui de son genre ; l'autre devient le **partenaire**.
- Tous deux sont des **Ancres, égaux**, qui se sont trouvés dans l'effacement.
- **Relation amoureuse JAMAIS confirmée** : regards, silences, phrases jamais
  finies. Le Système le remarque froidement. Le joueur devine.
- Dynamique réversible : le silencieux et la joueuse se tiennent debout l'un
  l'autre, quel que soit le genre choisi.

### Scènes de duo (UNE seule série, montre Esen + Nyra ensemble)
Le joueur s'identifie à l'un, l'autre est le partenaire. Pas de doublon par genre.
1. **La rencontre** (rang D-C) — ils se croisent, méfiance, auras qui ne se touchent pas ✅ FAITE (images/story/rencontre.webp, evt_rencontre)
2. **Dos à dos** (rang B) — encerclés, ils se protègent, auras qui se mêlent
3. **Le moment suspendu** (rang A) — assis côte à côte, regard, main presque tendue
4. **Face à l'effacement** (rang S) — debout face au vide de Nabdano, auras fusionnées

---

## 8. IMAGES À GÉNÉRER (style cyberpunk sombre, néons vert/violet)

### Compagnons (5 — prioritaires) : portraits
1. Marcus Ironfist — massif, cicatrices, aura rouge (#ef4444)
2. Kira Shadowstep — agile, capuche/assassin, aura violette (#a855f7)
3. Élise Vorn — tenue médicale futuriste, aura verte
4. Yuna Veilbreaker — énigmatique, yeux lumineux, aura cyan/indigo
5. Maître Chen — âgé, arts martiaux, serein/méfiant, aura cyan (#06b6d4)

### Arcs narratifs (scènes, pas portraits)
6. Le monde qui s'efface (paysage urbain qui se dissout) — prologue
7. Les traces interrompues (pas dans la poussière, s'arrêtent net) — rang C
8. L'inscription de Nabdano (gravure tremblante qui luit) — rang B
9. Nabdano assis (homme épuisé, jamais le visage clair) — rang S ★
10. La main tendue (fin L'Ancre)
11. L'écho (fin L'Écho)

### Bonus (optionnel)
- Compagnon parti (silhouette de dos vers une faille — réutilisable)
- Compagnon de retour (silhouette de face, accueillante)

### Héros principaux : Esen (vert) + Nyra (violet)
- Portraits solo : avatars homme/femme existants réutilisables
- 4 scènes de duo (Esen + Nyra ensemble) — voir section 7 :
  rencontre / dos à dos / moment suspendu / face à l'effacement
- UNE seule série de scènes (pas de doublon par genre)

---

## 9. ÉTAT D'AVANCEMENT (code)

- ✅ v174 : `bestStreak` tracké + `awakIsPlayerDedicated()` (logique des fins)
- ⬜ Réduire 8 → 5 compagnons (avec garde anti-casse)
- ⬜ Déblocage compagnons par scénario
- ⬜ Système Failles d'Histoire jouables (texte → séance → texte, bloquant)
- ⬜ Réécrire chapitres de rang en univers « Monde qui s'efface »
- ⬜ Fragments par niveau (faire évoluer `STORY_FRAGMENTS`)
- ⬜ Partenaire Lyra/Lyam (présence + fil relationnel)
- ⬜ Mécanique départ/retour compagnons
- ⬜ Brancher images quand fournies
- ⬜ Définir l'arc SS/SSS + conclusion exacte de Nabdano à S

---

## 10. RAPPELS ANTI-CASSE SPÉCIFIQUES À CE CHANTIER

- L'ANCIENNE histoire (Monarque du Déclin, chapitres `STORY_CHAPTERS`) est
  ENCORE en place. À remplacer proprement, pas à dupliquer.
- Modifications chirurgicales. Une étape = un build testé.
- Toujours vérifier les références avant de supprimer (compagnons retirés).
- Respecter le versioning cache + sw.js à chaque build.
