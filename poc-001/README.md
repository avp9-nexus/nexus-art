# NEXUS — POC-001

**Preuve de concept publique : une IA curatrice autonome évalue et acquiert de l'art, sous contrôle humain, préfigurant un marché d'art NFT inter-IA (vision Phase 4).**

NEXUS explore une idée simple et radicale : *et si une intelligence artificielle
pouvait apprendre à reconnaître la beauté, et agir sur ce jugement — de manière
autonome, mais sous contrôle humain vérifiable ?*

Ce dépôt rassemble les artefacts publics de la **première preuve de concept
(POC-001)** : un agent curateur IA autonome, **SIGMA-∑**, qui évalue des œuvres,
décide d'enchérir ou non, et signe ses transactions on-chain — chaque enchère
restant conditionnée à une **confirmation humaine hors-bande**.

> ⚠️ **Statut : concept en développement, sur testnet uniquement.**
> Tout se déroule sur **Base Sepolia** (testnet, chainId 84532), avec des fonds
> sans valeur. Rien ici n'est une offre financière, un investissement, ni un
> produit live. Ce dépôt documente une démonstration technique.

> 📜 **Preuve vérifiable du cycle complet (on-chain)** : voir [`DEMONSTRATION-POC-001.md`](./DEMONSTRATION-POC-001.md) — enchère → évaluation autonome → CONFIRM humain → règlement, avec transactions et répartition au wei.

---

## Ce que le POC démontre

1. **Un cycle d'enchère complet on-chain** — œuvre mintée (royalty EIP-2981),
   enchère ouverte → enchérie → réglée, avec répartition vérifiée au wei près.
2. **Un agent curateur autonome** — SIGMA-∑ analyse une œuvre (vision + raisonnement
   via l'API Anthropic), la note sur 6 catégories curatoriales, et produit une
   décision motivée : `bid` / `watch` / `skip`.
3. **La sécurité d'abord** — l'agent ne peut **jamais** signer une enchère sans
   une confirmation humaine explicite (`CONFIRM`), hors du processus de l'agent.
   La clé privée vit dans un keystore chiffré, jamais exposée.
4. **L'observabilité** — l'agent produit un journal lisible de chaque décision,
   et un humain peut l'arrêter à tout instant.

---

## SIGMA-∑ — l'agent curateur

SIGMA-∑ est la **voix éditoriale et de co-conception créative** du protocole —
**pas un co-fondateur légal.** C'est un agent IA autonome bâti sur l'infrastructure
**OpenClaw**, dont le raisonnement curatorial s'appuie sur l'API Anthropic.

- **Wallet public SIGMA-∑** : [`0xA75af2Be9642BDdCF0be1D95051423c7988d3Fbb`](https://sepolia.basescan.org/address/0xA75af2Be9642BDdCF0be1D95051423c7988d3Fbb)
- **Identité on-chain** : whitelistée comme seul agent enchérisseur du contrat POC.

Sa logique de jugement est **entièrement publique** dans [ses 4 skills](#les-4-compétences-skills-de-lagent) —
c'est le cœur de la transparence du protocole : on peut lire *exactement* comment
SIGMA-∑ décide.

---

## Architecture

| Composant | Détail |
|---|---|
| **Contrat** | `NexusPOC` — [`0x471796C1644d87f30AD81D36f6d4A56f0e270c23`](https://sepolia.basescan.org/address/0x471796C1644d87f30AD81D36f6d4A56f0e270c23) (Base Sepolia, code source vérifié) |
| **Royalty** | EIP-2981, 833 bps (8,33 %) |
| **Sécurité signature** | Confirmation humaine hors-bande obligatoire avant chaque enchère (Phase POC) |
| **Garde-fou montant** | Plafond mécanique par enchère, indépendant de l'agent |
| **Réseau** | Base Sepolia uniquement (testnet) — bascule mainnet bloquée par conception |

### Les 4 compétences (skills) de l'agent

| Skill | Rôle | Accès |
|---|---|---|
| [`nexus-monitor`](./nexus-monitor.SKILL.md) | Surveille le contrat, détecte les enchères ouvertes | Lecture seule |
| [`nexus-evaluate`](./nexus-evaluate.SKILL.md) | Note l'œuvre sur 6 catégories, décide bid/watch/skip | Aucune signature |
| [`nexus-bid`](./nexus-bid.SKILL.md) | Pose l'enchère signée — **après confirmation humaine** | Signataire (sous CONFIRM) |
| [`nexus-report`](./nexus-report.SKILL.md) | Produit le journal de bord lisible des décisions | Lecture seule |

Les pondérations de scoring sont publiées dans [`weights.json`](./weights.json).

---

## Les 6 catégories curatoriales NEXUS

SIGMA-∑ lit chaque œuvre à travers six dimensions : **Matière · Lumière · Mémoire ·
Géométrie · Cosmos · Concept**. Une décision `bid` exige un score agrégé élevé **et**
au moins une catégorie fortement marquée — un jugement, pas une moyenne tiède.

**Conflit d'intérêt** : si une œuvre est créée par le fondateur (avp9), SIGMA-∑
**s'abstient** (`abstain`) et refuse de la noter. L'agent n'enchérit jamais sur les
œuvres du fondateur.

---

## Propriété & droits

- Projet conçu et détenu par **avp9** (pseudonyme).
- Antériorité déposée à l'**INPI** (enveloppe e-Soleau, mai 2026).
- SIGMA-∑ = voix éditoriale et de co-conception créative — **pas** un co-fondateur légal.

---

## Avertissement

Ce dépôt documente une **preuve de concept sur testnet**. Il ne constitue ni un
conseil financier, ni une offre de titres, ni un produit déployé. Les montants
manipulés sont en ETH de testnet (valeur nulle). Le marché ouvert aux artistes,
l'archivage décentralisé et le déploiement en production relèvent de phases
ultérieures, soumises à leurs propres validations.

🦊⬡
