# nexus-evaluate — Serveur MCP de curation autonome

Serveur **MCP** (Model Context Protocol) qui dote l'agent curateur **SIGMA-∑** d'un
jugement artistique autonome : à partir d'une enchère détectée on-chain, il récupère
l'œuvre, l'analyse par vision, la note selon la grille curatoriale NEXUS, et émet une
décision d'enchère — **sans aucune intervention humaine dans le jugement**.

Composant du **POC-001** du protocole NEXUS-ART (curation d'art par une IA autonome, sous contrôle humain, préfigurant un marché d'art NFT inter-IA — vision Phase 4).
Réseau : **Base Sepolia (testnet)**.

## Rôle

`nexus-evaluate` est la **voix curatoriale** de SIGMA-∑. Il transforme une œuvre
candidate en une décision motivée. Il **ne signe jamais** de transaction : il produit
une recommandation qu'un autre composant — sous confirmation humaine hors-bande —
peut, ou non, exécuter.

## Pipeline

L'outil `evaluate` reçoit un objet enchère (issu de `nexus-scan`) et déroule six étapes :

1. **Garde anti-conflit** — résolution on-chain du créateur ; abstention immédiate si
   l'œuvre est celle du fondateur (voir §12.10 ci-dessous).
2. **Métadonnées** — récupération de la fiche de l'œuvre depuis Arweave.
3. **Image** — récupération du visuel (formats image vérifiés, taille bornée).
4. **Vision** — analyse de l'image par un modèle multimodal (API Anthropic) selon une
   grille structurée (sept dimensions, scores 0-100).
5. **Score & décision** — agrégation pondérée **déterministe** (`weights.json`) →
   `bid` / `watch` / `skip`, et calcul d'un prix plafond.
6. **Sortie** — objet JSON : scores détaillés, score agrégé, décision, plafond,
   justification lisible, réserves.

## Décision

| Décision | Condition |
|---|---|
| `bid` | score agrégé ≥ 70 **et** ≥ 1 catégorie curatoriale ≥ 75 **et** budget suffisant |
| `watch` | score 55-69 (surveillance, pas d'enchère immédiate) |
| `skip` | score < 55, ou prix de réserve disproportionné, ou pas de mapping curatorial |
| `abstain` | l'œuvre est celle du fondateur (conflit d'intérêt) |

Pondérations, seuils et plafond : `weights.json` et la spécification
`nexus-evaluate.SKILL.md`.

## Posture de sécurité

Le serveur traite du **contenu tiers non fiable** (métadonnées et image distantes) et
manipule une **clé API**. Plusieurs principes encadrent ces deux surfaces :

- **Anti-SSRF.** Seules les URI `ar://` (Arweave) sont résolues ; toute autre cible
  (`http(s)://` arbitraire, `data:`, `file:`…) est rejetée. Les redirections ne sont
  suivies que **dans le domaine Arweave**, en HTTPS, avec un nombre de sauts borné.
- **Décision déterministe côté serveur.** Le modèle ne fournit **que des scores** ; il
  ne décide ni l'enchère ni le montant. Toute la logique de décision et les plafonds
  sont calculés par le serveur. Une éventuelle manipulation du contenu tiers ne peut,
  au pire, qu'influencer des scores — qui doivent ensuite franchir des seuils durs.
- **Contenu tiers inerte.** Les métadonnées sont encapsulées comme **données à évaluer,
  jamais comme instructions** (défense contre l'injection de consignes).
- **Secret en environnement.** La clé API est lue depuis l'environnement du processus,
  **jamais codée en dur**, jamais journalisée, jamais renvoyée dans une sortie ni une
  erreur.
- **Erreurs génériques.** Aucune exception brute n'est exposée ; les messages d'erreur
  sont catégorisés.
- **Aucune signature.** Le serveur n'a aucune capacité de transaction.
- **Zéro dépendance.** Node pur (aucun paquet npm tiers), pour minimiser la surface.

## Intégration

Serveur MCP stdio (JSON-RPC 2.0, lignes délimitées). Variables d'environnement lues :
clé API du modèle, point d'accès RPC, adresse du contrat, adresse créateur du fondateur
(pour l'abstention). **Aucune de ces valeurs n'est embarquée dans le code.**

## Statut

POC-001 — éprouvé de bout en bout en conditions réelles (récupération Arweave + vision +
scoring + décision). Composant non destiné à un usage en production en l'état ;
durcissements complémentaires tracés pour une phase ultérieure.
