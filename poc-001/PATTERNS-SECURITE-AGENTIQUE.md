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

---

## Le versant épistémique

Ces patterns bornent ce qu'un agent compromis peut **faire**. Ils ne bornent pas ce qu'un
agent peut **affirmer** — une erreur factuelle publiée n'engage aucune signature, ne
franchit aucun plafond de dépense, et n'est arrêtée par aucun fail-fermé.

[`AGENT-GOVERNANCE.md`](../AGENT-GOVERNANCE.md) (en anglais) traite ce second versant :
les contraintes qui rendent une affirmation non vérifiée **visible** avant qu'elle
n'atteigne une surface publique.

Les deux documents partent de la même prémisse — **on ne suppose pas l'agent fiable** — et
y répondent de la même façon : la contrainte vit **hors de l'agent**, là où il ne peut pas
l'atteindre. La confirmation hors-bande et l'étiquetage `[MESURÉ]` / `[INFÉRÉ]` sont le
même mécanisme, appliqué à deux natures de dommage : l'irréversible et le faux.

---

## Ce qu'une attestation ne peut pas prouver

Les patterns ci-dessus produisent des **traces** : un registre chaîné, des empreintes de
fichiers, des journaux d'exécution. Une trace sert à établir qu'une chose a eu lieu. Reste
à savoir ce qu'elle établit exactement — et la réponse est plus étroite qu'il n'y paraît.

*Note de périmètre : les mécanismes discutés ci-dessous — registre chaîné, épinglage
d'empreinte, vérificateur hors-ligne — sont **postérieurs à POC-001** et leur code ne se
trouve pas dans ce dépôt, contrairement aux trois composants listés plus haut. Ce qui suit
est donc une leçon de conception, pas une lecture de code publié.*

> **Une attestation produite dans le périmètre qu'elle atteste ne contraint pas ce
> périmètre.** Elle en établit la *cohérence interne*, et la cohérence interne est
> précisément ce qu'un adversaire présent dans le périmètre sait produire.

Nous avons rencontré cette forme sur trois objets sans rapport, et chaque fois par une
source différente :

| L'attestation | Ce qu'elle prouve | Ce qu'elle ne prouve pas |
|---|---|---|
| **Un registre chaîné** (chaque entrée porte l'empreinte de la précédente) | l'**intérieur** : aucune entrée située entre l'origine et la tête ne peut être modifiée, retirée ou réordonnée sans casser un lien | l'**exhaustivité**, et seulement dans un cas précis. Une **réécriture de la dernière entrée** n'est contrainte par aucun successeur : rien hors du fichier n'enregistre quelle devrait être la tête. En revanche, un fichier **effacé** est un rouge par défaut chez nous — c'est à l'appelant de déclarer qu'aucune évaluation n'a encore eu lieu, jamais au vérificateur de le deviner — et une **troncature** laisse derrière elle les pièces brutes de ses entrées disparues, que le vérificateur signale comme orphelines |
| **Un binaire qui hache son propre fichier**, contre une valeur épinglée à l'extérieur | la **dérive** : le binaire exécuté n'est plus celui qui a été validé | la **falsification**, à condition d'y arriver. Le binaire calcule *et* compare : un binaire modifié peut écrire l'empreinte de l'original. Le même écart existe pour un artefact signé par l'infrastructure de publication de l'organisation elle-même — il passe les contrôles de provenance parce qu'il est authentiquement signé par qui devait le signer. ⚠️ Mais atteindre cette limite suppose d'avoir **déjà** obtenu l'écriture sur le binaire déployé : chez nous l'agent n'a aucun verbe pour y parvenir et le code est monté en lecture seule. C'est une limite du dernier pattern, pas une porte d'entrée |
| **Un producteur qui atteste que son mandat court toujours** | rien | qu'il ait encore le droit de produire. Un agent dont la finalité a cessé continue d'émettre un historique cohérent, horodaté, mutuellement consistant — et creux — parce que rien dans son propre périmètre d'écriture ne sait que son autorité a expiré. ⚠️ Cette classe est ici **documentée et non implémentée, à dessein** : notre mandat *est* le geste humain qui lance l'exécution, il n'y a ni planificateur ni tâche périodique, donc un producteur orphelin ne peut pas dériver — il ne peut qu'être invoqué. À vingt agents et du renouvellement d'équipe, elle mord ; à cette échelle, un champ « mandat valide » serait vert sur chaque enregistrement et n'apprendrait rien |

La première ligne, nous l'avons écrite contre nous-mêmes : la thèse fondatrice de notre
registre — *un journal chaîné prouve qu'il n'en manque aucun* — était fausse, et c'est une
revue adverse qui l'a établie. La deuxième nous a été confirmée par un document de
référence sur la sécurité de la chaîne d'approvisionnement des modèles. La troisième nous
a été apportée par un praticien de la gestion des identités, dans les termes de son
métier : *une identité n'a pas le droit d'écrire son propre journal d'audit*.

**Trois domaines, trois sources indépendantes, une seule forme.** C'est ce qui la fait
passer du statut de thèse maison à celui de classe.

Et le tableau ci-dessus n'est pas un constat d'impuissance : chaque ligne de la colonne de
droite a été **rétrécie** par un correctif daté. La brèche d'origine — *effacer, tronquer,
réécrire, les trois passent verts* — s'est réduite à un seul cas, la réécriture de la
dernière entrée, parce que le vérificateur a cessé de rendre vert sur un fichier qu'il
n'avait jamais ouvert et qu'il liste désormais les pièces brutes sans entrée. Ce qui reste
n'est pas ce que nous n'avons pas cherché à fermer : c'est ce qu'un dispositif interne à
son propre périmètre **ne peut pas** fermer, quel que soit le soin qu'on y met.

Le nommer sert à deux choses. Il empêche de lire une trace pour plus qu'elle ne dit. Et il
désigne précisément ce qu'un contrôle **extérieur** au périmètre apporterait, le jour où
l'on en dispose — un horodatage tiers, un journal signé par l'infrastructure, un ancrage
public. C'est la même logique que la confirmation hors-bande, appliquée à la preuve plutôt
qu'à l'action : ce qui contraint utilement se trouve là où l'agent ne peut pas l'atteindre.

### La conséquence pratique : nommer un champ d'après ce qu'il mesure

Si une attestation ne peut établir que la cohérence interne, alors un champ ne doit jamais
porter le nom de la propriété qu'on aimerait qu'il prouve.

`empreinte_épinglée: vrai` est admissible : cela signifie « une valeur de référence existe
hors de cet artefact, et l'empreinte calculée lui correspond ». `binaire_authentique: vrai`
ne l'est pas : le contrôle ne l'établit pas, et le nom laisse croire que si.

C'est une contrainte de vocabulaire, et elle coûte peu. Elle évite qu'un lecteur — humain
ou machine — traite une déclaration bornée comme une preuve.

Corollaire, dans l'autre sens : **un contrôle sans contre-preuve n'entre pas dans un
schéma.** Un champ qui vaudrait « conforme » sur chaque enregistrement jusqu'à la fin des
temps n'apprend rien, et personne ne saura jamais s'il fonctionne. Un champ qui ne sait
pas rougir n'est pas un contrôle, c'est une déclaration.

### Et cette section s'applique à elle-même

Nous tenons un registre daté des préventions : les fautes qui allaient être commises et ce
qui les a arrêtées. Neuf y sont recensées sur une fenêtre à trace complète. Nous les avons
publiées comme preuve que la prévention arrive.

Un lecteur extérieur nous a proposé le test qui manquait — celui que nous appliquions déjà
à nos règles, sans l'appliquer à nos preuves : **quelle mesure cette prévention a-t-elle
causée ?** Une prévention qui a produit un instrument est inspectable : l'instrument
existe, il est daté, un tiers peut le lancer sur un cas qu'il choisit. Une prévention qui
n'a produit qu'une phrase est exactement la revendication invérifiable que cette section
décrit.

Au test, **quatre sur neuf** seulement avaient laissé un instrument. Deux des gardes que
nous croyions les plus solides étaient des phrases : ils vivaient dans un script recréé à
chaque usage, donc nulle part où quiconque puisse les relancer. Ils sont devenus des
instruments le jour où le test l'a montré — ce qui porte le compte à cinq, plus un partiel.

Nous laissons le chiffre visible plutôt que le compte initial. Une section qui affirme
qu'une attestation ne prouve que sa propre cohérence ne peut pas, dans le même document,
présenter ses propres préventions comme des preuves sans dire lesquelles en sont.

Ce que le test a produit, en revanche, mérite d'être dit aussi : un instrument. Le geste le
plus fréquent de notre travail — la modification contrôlée d'un document de référence —
avait ses garde-fous dans un script réécrit à chaque usage. Nous en avons fait un outil
durable, avec son banc : douze cas, dont neuf où le garde doit **refuser**, et le banc
vérifie que le message nomme la cause et que le fichier est resté intact. Il a servi dès la
passe suivante, et il a refusé pour la bonne raison au premier essai.

C'est la seule chose que nous savons dire d'une prévention : non pas qu'elle a eu lieu,
mais ce qu'elle a laissé derrière elle que quelqu'un d'autre puisse lancer.
