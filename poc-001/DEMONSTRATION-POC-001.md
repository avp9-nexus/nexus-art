# NEXUS POC-001 — Démonstration vérifiable

> Preuve publique et reproductible d'un cycle d'enchère d'art NFT **piloté par un agent IA autonome** — SIGMA-∑, le curateur du protocole, qui évalue, décide et enchérit — sous **validation humaine obligatoire** de chaque transaction on-chain.
>
> Réseau : **Base Sepolia** (testnet, chainId 84532). Aucune valeur réelle en jeu. Antériorité **INPI DSO2026016080**.
>
> Ce document complète la grille [`VALIDATION.md`](VALIDATION.md) (les 33 critères) et le [`README.md`](README.md) (présentation) : il **raconte la preuve** du cycle, adossée aux transactions on-chain.

---

## 1. Ce que ce dépôt démontre

NEXUS POC-001 prouve, de bout en bout et **vérifiable on-chain**, qu'un agent d'IA autonome — **SIGMA-∑**, le curateur du protocole — peut :

1. **évaluer** une œuvre selon une grille curatoriale multidimensionnelle (vision multimodale),
2. **décider de lui-même** d'enchérir ou de s'abstenir,
3. **enchérir** on-chain,

tout en restant encadré par une **barrière de confirmation humaine hors-bande** : l'agent déclenche l'enchère mais **ne peut pas l'autoriser seul**. Seule une action humaine, hors de portée de l'agent, déclenche la signature et la diffusion de la transaction. **L'agent ne peut jamais se confirmer lui-même.**

---

## 2. Le cycle complet (tel que démontré)

| Étape | Acteur | Nature |
|---|---|---|
| 1. Frappe de l'œuvre (*mint*) | propriétaire (signature matérielle) | l'œuvre porte une **adresse créateur distincte** du propriétaire du protocole |
| 2. Ouverture de l'enchère | propriétaire (signature matérielle) | prix de réserve + durée |
| 3. **Évaluation** | **SIGMA-∑ (autonome)** | vision multimodale → score multidimensionnel → décision `bid` / `watch` / `skip` |
| 4. Enchère | **SIGMA-∑** | placement au prix de réserve, dans une limite que l'agent calcule lui-même |
| 5. **Confirmation humaine hors-bande** | humain | **seul** déclencheur de la signature ; l'agent ne peut pas se confirmer |
| 6. Règlement (*settle*) | public | transfert du NFT au gagnant + répartition exacte des parts |

---

## 3. Preuve on-chain (publique, vérifiable par quiconque)

Tout est vérifiable sur Basescan (Base Sepolia), **sans aucune confiance à nous accorder** :

- **Contrat NexusPOC** : `0x471796C1644d87f30AD81D36f6d4A56f0e270c23`
- **Œuvre** : tokenId **21**
- **Ouverture d'enchère** : `0xa62b1a742015a6c2be8e3429963aa7329986e9c0e39318618c926c07ee721c99`
- **Enchère de l'agent** : `0x0b7a0bb1bc7d310581d13b373e315683032dd442013d7c80b735e122e23c9302`
- **Règlement** : `0xe291adfa0619d71b9639bcb041e58f2cf8de5caa8d18e5ddb823b2e0ac3e85e4`
- **Propriétaire final du NFT** : le wallet de l'agent curateur SIGMA-∑ `0xA75af2Be9642BDdCF0be1D95051423c7988d3Fbb`

**Répartition vérifiée au wei près** (prix final 0,001 ETH) :

- royalty **EIP-2981 (8,33 %)** → **l'adresse créateur** de l'œuvre (distincte du propriétaire du protocole),
- part **curateur (≈ 45,835 %)** → SIGMA-∑,
- part **plateforme (≈ 45,835 %)** → plateforme.

> Invariant respecté : royalty + curateur + plateforme = prix final, **0 wei d'écart**.

---

## 4. Honnêteté curatoriale (non négociable)

L'évaluation de SIGMA-∑ n'est **jamais forcée**. Pour cette œuvre, le score agrégé était de **71/100** — un jugement sincère, au-dessus du seuil d'enchère. Une part de variance dans le score est **assumée comme une propriété** d'un curateur probabiliste cohérent, pas comme un défaut. Le protocole ne cherche jamais à « fabriquer » un score.

Le dépôt contient aussi des décisions documentées de `skip` (refus motivé) et `watch` (mise en veille) sur d'autres œuvres : la **sélectivité est réelle**, pas cosmétique.

---

## 5. Modèle de sécurité (principes)

Conformément au principe de **Kerckhoffs**, les *principes* de sécurité sont publics ; les détails d'implémentation exploitables ne le sont pas.

- **Humain dans la boucle** — l'agent propose, l'humain dispose. La confirmation est **hors-bande** ; sans elle, toute tentative d'enchère avorte (*fail-fermé*). L'agent ne peut pas se confirmer lui-même.
- **Moindre privilège** — l'agent ne dispose que des outils strictement nécessaires (évaluer, enchérir). Il ne découvre pas seul les enchères : on les lui soumet.
- **Isolation de la clé** — la clé de signature n'est déchiffrée qu'**après** la confirmation humaine, n'est **jamais** exposée à l'agent et n'apparaît dans aucun journal.
- **Garde anti-SSRF** — les contenus d'œuvres ne sont récupérés que depuis une **source épinglée**.

Le détail réutilisable de ces patrons figure dans [`PATTERNS-SECURITE-AGENTIQUE.md`](PATTERNS-SECURITE-AGENTIQUE.md) (neutre, sans secret).

---

## 6. Ce que ce POC n'est PAS

- **Pas de la finance** — testnet uniquement, aucune valeur réelle, aucun conseil d'investissement.
- **Pas un produit final** — le contrat est un **POC à cul-de-sac assumé**. La Phase 2 prévoit un **nouveau contrat audité par un tiers externe** avant tout déploiement de valeur.
- SIGMA-∑ est la **voix curatoriale et de co-conception** du protocole ; les questions de statut juridique relèvent du déposant INPI.

---

## 7. Pour vérifier / pour en savoir plus

- Source du contrat : [`../contracts/NexusPOC.sol`](../contracts/NexusPOC.sol) (identique à la source vérifiée sur Basescan).
- Grilles curatoriales de l'agent : les fichiers `*.SKILL.md` et `weights.json` de ce dossier.
- Patrons de sécurité agentique : [`PATTERNS-SECURITE-AGENTIQUE.md`](PATTERNS-SECURITE-AGENTIQUE.md).
- Grille de validation (33 critères) : [`VALIDATION.md`](VALIDATION.md).
- Site : https://nexus-art.org
- Antériorité : **INPI DSO2026016080**.

---

*Réseau de test uniquement (Base Sepolia, chainId 84532). Ce document décrit une démonstration technique reproductible ; il ne constitue ni une offre, ni un conseil financier.*
