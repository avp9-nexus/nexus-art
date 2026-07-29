# nexus-art

**Des agents IA curateurs achètent de l'art aux enchères. Un humain signe. Rien ne part sans lui.**

NEXUS-ART poursuit deux choses à la fois, et elles sont indissociables :
une **IA qui découvre et finance des artistes vivants**, et la **discipline
qu'il faut pour laisser un agent engager de l'argent sans jamais lui en donner
le dernier mot**. Fait main, en solo.

---

## Ce qui est prouvé — et vérifiable par n'importe qui

Trois démonstrations publiques sur **Base Sepolia** (testnet, aucune valeur réelle en jeu).
Contrat `0x471796C1644d87f30AD81D36f6d4A56f0e270c23`, source vérifiée.

| | Ce qui a été démontré |
|---|---|
| **POC-001** | Un curateur évalue une œuvre, enchérit, gagne. Répartition exacte au wei. |
| **POC-002** | Deux curateurs aux goûts distincts se disputent la même œuvre. Dix offres échangées, **un seul** engagement de fonds, **un seul** geste humain. |
| **POC-003** | La clé de règlement quitte le serveur : elle vit dans un signeur matériel. Le serveur propose une transaction, il ne peut plus la signer. |

Chaque cycle laisse une trace on-chain consultable. Le détail, les transactions et
la grille de curation : [`poc-001/`](poc-001/) ·
[démonstration commentée](poc-001/DEMONSTRATION-POC-001.md).

---

## Deux portes d'entrée

**→ Vous venez pour l'art.** Ce que le projet cherche à faire, ce qu'il refuse de
prétendre, et pourquoi le geste humain est le medium : [`MANIFESTE.md`](MANIFESTE.md).

**→ Vous venez pour les agents.** Les règles qui empêchent un agent — et
l'humain qui le pilote — d'affirmer ce qu'ils n'ont pas vérifié, avec les erreurs
réelles qui ont produit chaque règle : [`AGENT-GOVERNANCE.md`](AGENT-GOVERNANCE.md).

---

## La contrainte fondatrice

Un agent autonome qui manipule de la valeur pose un problème simple à énoncer et
difficile à résoudre : **il faut lui laisser assez d'autonomie pour être utile, et
assez peu pour ne pas pouvoir nuire seul.**

La réponse retenue ici tient en deux clés. Une clé faible, sans pouvoir de dépense,
avec laquelle l'agent négocie librement autant qu'il veut. Un coffre séparé, qui ne
signe qu'une seule chose : le pas qui déplace réellement l'argent — et seulement
après un geste humain hors du système. L'agent enchaîne dix décisions seul ;
la onzième, celle qui coûte, exige une main.

Les patrons réutilisables, indépendants de ce projet, sont documentés dans
[`poc-001/PATTERNS-SECURITE-AGENTIQUE.md`](poc-001/PATTERNS-SECURITE-AGENTIQUE.md).

---

## Ce que ce projet n'est pas

- **Pas de la finance.** Réseau de test, aucune valeur réelle, aucun conseil d'investissement.
- **Pas un produit.** Le contrat déployé est un POC à cul-de-sac assumé. Tout déploiement
  de valeur passera par un nouveau contrat audité par un tiers externe.
- **Pas une première.** D'autres travaillent sur l'art génératif et les agents collectionneurs.
  Ce dépôt documente une combinaison précise et ses limites, pas une préséance.
- **Les agents ne sont pas des co-fondateurs.** Ils portent une voix curatoriale et
  éditoriale. Les questions de statut juridique relèvent du déposant.

---

## Antériorité

INPI e-Soleau : **DSO2026016080** (02/05/2026) · **DSO2026023753** (28/06/2026) ·
**DSO2026025380** (11/07/2026).

Site : **https://nexus-art.org** · Licence : [LICENSE](LICENSE)
