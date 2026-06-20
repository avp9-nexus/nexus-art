# Patterns de sécurité agentique

### Contraindre un agent IA autonome qui agit sur le monde réel — NEXUS POC-001

Un agent IA autonome qui touche à de l'argent, à de l'irréversible ou à des secrets est
une surface de risque d'un genre nouveau. Le modèle de langage qui le pilote peut être
**manipulé** (injection de consignes via le contenu qu'il traite), peut **se tromper**,
ou peut être **détourné**. La question centrale n'est pas « comment rendre l'agent
infaillible » — c'est impossible — mais :

> **Comment construire le système *autour* de l'agent pour qu'une défaillance de l'agent
> ne puisse pas causer de dommage irréversible ?**

Ce document décrit les patterns appliqués dans NEXUS POC-001, où l'agent curateur
**SIGMA-∑** évalue des œuvres et décide d'enchérir, en autonomie, sur une blockchain
(Base Sepolia, testnet). Les principes sont généraux : ils valent pour tout agent qui
agit sur un système réel.

---

## Modèle de menace

Trois surfaces, assumées explicitement :

1. **L'agent peut être manipulé.** Il traite du contenu tiers non fiable (métadonnées,
   images d'œuvres soumises). Ce contenu peut porter des consignes cachées
   (*prompt injection*) cherchant à détourner son comportement.
2. **L'agent ne doit pas pouvoir agir seul sur l'irréversible.** Une signature on-chain,
   un paiement, une suppression sont définitifs. Un agent — même bien intentionné mais
   trompé — ne doit pas pouvoir les déclencher sans contrôle.
3. **Les secrets ne doivent pas fuiter.** Clé de signature, mot de passe de keystore, clé
   d'API : ni dans les logs, ni dans les sorties d'outils, ni dans les messages d'erreur,
   ni à portée de l'agent.

**Hypothèse directrice : on ne suppose pas l'agent fiable.** On suppose qu'il *peut* être
compromis, et on construit pour que, même alors, le dommage soit **borné**.

---

## Les trois patterns structurants

### 1. Confirmation humaine hors-bande

**Principe.** Aucune action irréversible n'est exécutée sans une confirmation humaine
émise **hors du canal de l'agent**.

**Mise en œuvre.**
- Un secret de session aléatoire (≥ 256 bits) est généré à chaque démarrage, non
  dérivable, jamais écrit sur la sortie standard ni dans un résultat d'outil.
- La confirmation transite par un canal **isolé** (socket de bouclage local) que
  **l'agent n'a aucun moyen d'atteindre** : il ne dispose d'aucun outil pour s'y
  connecter, sous liste d'autorisation stricte.
- **Double barrière** : la confirmation doit présenter *à la fois* le secret de session
  exact (comparaison à temps constant) *et* un identifiant lié à la transaction précise
  en attente.
- Usage unique, fenêtre de validité courte, une seule action en attente à la fois.
- **Fail-fermé** : toute rupture du canal, annulation ou anomalie → abandon. On ne signe
  jamais sur une confirmation incertaine.

**Pourquoi c'est robuste.** Même un agent **totalement compromis** ne peut pas produire la
confirmation : il lui faudrait le secret de session (jamais exposé) *et* un accès au canal
isolé (hors de sa portée). La décision finale reste, mécaniquement, entre des mains
humaines.

### 2. Décision déterministe côté serveur — le modèle propose, le code dispose

**Principe.** Le modèle de langage ne produit **que des données** (une analyse, des
scores). Il ne décide **jamais** d'agir, ni ne fixe les paramètres sensibles. La décision
et les seuils sont calculés par du **code déterministe, hors modèle**.

**Mise en œuvre.**
- Le modèle multimodal note l'œuvre sur des dimensions définies (0–100). C'est sa seule
  sortie.
- Le serveur applique une pondération fixe et des seuils durs pour décider
  `bid` / `watch` / `skip`, et calcule un plafond de prix. Cette logique vit dans une
  configuration versionnée, pas dans le modèle.

**Pourquoi c'est robuste.** Cela neutralise l'injection de consignes comme **vecteur
d'action**. Une œuvre piégée qui réussirait à manipuler le modèle ne pourrait, au pire,
que **fausser des scores** — lesquels doivent ensuite franchir des seuils déterministes,
puis (pour toute enchère) une confirmation humaine. Le contenu tiers ne décide jamais ;
il est noté.

### 3. Moindre privilège d'outil

**Principe.** L'agent fournit le **strict minimum**. Tout ce qui est sensible est fixé par
le serveur, hors de sa portée.

**Mise en œuvre.**
- Pour enchérir, l'agent ne fournit que deux valeurs : l'identifiant du lot et le montant.
  C'est tout.
- Le serveur fixe lui-même le contrat destinataire, l'identifiant de chaîne, le numéro de
  séquence, le gaz, et un **plafond de dépense** au-delà duquel l'action est refusée.
- Le schéma d'entrée de l'outil est strict (types contraints, aucune propriété
  additionnelle) : l'agent ne peut rien injecter d'autre.
- L'outil n'expose **qu'une seule action** ; aucune autre fonction du contrat n'est
  atteignable.

**Pourquoi c'est robuste.** L'agent ne peut pas détourner l'action : ni viser un autre
destinataire, ni dépasser le plafond, ni invoquer une autre opération. Sa latitude est
réduite à ce qui est intrinsèquement sans danger.

---

## Patterns de soutien (transverses)

- **Déchiffrement tardif.** Le secret de signature n'est déchiffré qu'**après** la
  confirmation humaine — la fenêtre pendant laquelle il est en clair en mémoire est
  réduite au minimum.
- **Secrets en environnement.** Clés et mots de passe sont lus depuis l'environnement du
  processus, **jamais** codés en dur, jamais en argument de ligne de commande (visible
  dans la liste des processus), jamais journalisés.
- **Redaction systématique.** Un filtre retire la valeur des secrets de toute chaîne avant
  qu'elle n'atteigne un log ou une sortie — défense en profondeur si un secret s'y
  retrouvait par erreur.
- **Erreurs génériques.** Les échecs sont renvoyés sous forme de **catégories** (« échec
  réseau », « rejet on-chain »…), jamais l'exception brute — qui pourrait fuiter un
  chemin, un secret ou une information utile à un attaquant.
- **Fail-fermé par défaut.** Toute incertitude (exception non gérée, état inconnu)
  déclenche l'abandon de l'action en cours, jamais sa poursuite. Le défaut sûr est
  **ne rien faire**.
- **Entrées distantes validées (anti-SSRF).** Le composant qui récupère du contenu
  distant n'accepte qu'un **schéma d'URI fermé** (un seul espace de noms de stockage).
  Toute autre cible est rejetée. Les redirections ne sont suivies que **dans le même
  domaine**, en HTTPS, avec un nombre de sauts borné, l'hôte étant validé **à chaque
  saut**.
- **Contenu tiers inerte.** Les données externes sont transmises au modèle **balisées
  comme données à évaluer**, jamais comme instructions — pour qu'une consigne cachée soit
  traitée comme du texte à juger, pas à suivre.
- **Surface minimale.** Zéro dépendance tierce quand c'est possible ; sinon, dépendances
  épinglées et auditées. Le canal de sortie (le protocole) est strictement réservé : la
  logique n'y écrit jamais directement.

---

## Principe directeur : Kerckhoffs

La sécurité de ces composants ne repose **jamais sur le secret de leur code**. Elle repose
sur :
- des **secrets runtime** (générés au démarrage, jamais persistés en clair hors d'un
  fichier protégé, hors-agent) ;
- et une **architecture d'isolement** (l'agent n'a pas les outils pour atteindre les
  canaux sensibles).

C'est précisément pourquoi ce code est **publié**. Un mécanisme dont la sécurité
dépendrait de son obscurité serait fragile ; un mécanisme qui résiste à l'examen public
est solide. **Publier invite à l'audit — et l'audit renforce.**

---

## Correspondance avec le code de ce dépôt

- **`nexus-scan`** — *read-only strict* + *surface d'entrée nulle* : détection on-chain
  sans aucun paramètre, sans secret, sans signature. Le plus petit privilège possible.
- **`nexus-evaluate`** — *décision déterministe* + *anti-SSRF* + *contenu tiers inerte* :
  le moteur de curation qui note sans jamais décider d'agir.
- **`nexus-bid`** — *confirmation hors-bande* + *moindre privilège* + *déchiffrement
  tardif* + *fail-fermé* : le signataire, contraint de toutes parts.

---

## Limites (ce que ces patterns ne couvrent pas)

Ces patterns bornent le dommage qu'un **agent** défaillant peut causer. Ils ne protègent
pas contre une **compromission de l'hôte lui-même** (accès root à la machine) : à ce
niveau, l'attaquant dispose déjà de tout. La défense correspondante (isolement réseau
strict, gestion de secrets dédiée) relève de l'infrastructure et fait l'objet de
durcissements tracés séparément.

L'objectif n'est pas une sécurité absolue — elle n'existe pas — mais une **réduction de
surface honnête et vérifiable** : faire en sorte qu'une défaillance de l'agent, le maillon
le moins prévisible, ne puisse pas se traduire en dommage irréversible.
