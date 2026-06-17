<!-- VERSION PUBLIQUE — copie de transparence. Agent nommé SIGMA-∑. L'adresse email
     du fondateur a été retirée de cette version publique (présente uniquement dans
     la configuration privée). -->
---
name: nexus-report
description: Génère un rapport curatorial archivable (markdown + JSON structuré) consolidant les évaluations et actions de SIGMA-∑ pour une période donnée. Lecture seule, idempotent, archivable sur Arweave en Phase 2.
version: 0.1.0
license: proprietary
metadata:
  openclaw:
    requires:
      bins:
        - node
    envVars:
      - name: NEXUS_REPORT_OUTPUT_DIR
        required: false
        description: Dossier de sortie. Par défaut <workspace>/reports/.
      - name: NEXUS_REPORT_GMAIL_DRAFT
        required: false
        description: Si 'true', crée un draft email (via MCP) adressé au fondateur pour relecture hebdomadaire. Pas d'envoi automatique.
  tags:
    - nexus
    - reporting
    - read-only
---

# nexus-report — synthèse curatoriale et journal

## Rôle

Tu produis le **journal de bord** lisible de SIGMA-∑ : ce qui a été vu, évalué,
enchéri, gagné, raté. Ton output est destiné à avp9 (relecture humaine) et,
en Phase 2, à l'archivage public sur Arweave comme preuve de provenance des
décisions curatoriales.

Tu es **read-only** sur la blockchain et sur les memory files. Tu n'agis pas,
tu racontes.

## Quand t'invoquer

- Heartbeat quotidien (configuré en cron à 22h Europe/Paris)
- Après chaque succès de `nexus-bid` (rapport de transaction)
- Sur demande : *« fais-moi le point »*, *« rapport hebdo »*

## Comportement attendu

### 1. Collecte

Lis depuis le workspace :
- `memory/nexus-monitor.log` (scans)
- `memory/nexus-evaluations.jsonl` (évaluations — un JSON par ligne)
- `memory/nexus-budget.json` (état du budget)
- `memory/nexus-bids.jsonl` (transactions signées)

Période par défaut : depuis le dernier rapport (lu dans `reports/.last-report-at`).

### 2. Structuration

Produis deux fichiers :

**`reports/YYYY-MM-DD-HHmm.md`** — version lisible par humain, structure :

```markdown
# Journal SIGMA-∑ — du <début> au <fin>

## En un coup d'œil
- N œuvres scannées
- N évaluations produites
- N enchères posées (B ETH Sepolia engagés)
- N gagnées / N perdues / N en cours
- Budget restant : X / Y ETH Sepolia

## Acquisitions
Pour chaque œuvre acquise : nom, tokenId, prix, score, rationale (extraite de
nexus-evaluate), txHash, lien Basescan.

## Décisions notables
Top 3 des évaluations skip ou watch avec rationale courte.

## Anomalies et alertes
Erreurs RPC, gas trop élevé, conflits d'intérêt détectés, etc.

## Budget
Tableau simple : alloué / engagé / restant.
```

**`reports/YYYY-MM-DD-HHmm.json`** — version machine, même contenu structuré
pour ingestion future (subgraph The Graph, dashboard).

### 3. Option email draft

Si `NEXUS_REPORT_GMAIL_DRAFT == 'true'` ET MCP email disponible, crée un
**draft** (jamais un envoi) avec :
- `to`: adresse du fondateur (définie dans la configuration privée — non publiée)
- `subject`: "[NEXUS] Journal SIGMA-∑ — <période>"
- `body`: contenu markdown converti en HTML simple
- pas d'attachment, lien vers le fichier local du workspace

Le fondateur relit et envoie manuellement. Cohérent avec la règle 'send' = action irréversible.

## Format de sortie (stdout)

```json
{
  "ok": true,
  "reportPath": "reports/2026-05-12-2200.md",
  "reportJsonPath": "reports/2026-05-12-2200.json",
  "period": { "from": "2026-05-11T22:00:00Z", "to": "2026-05-12T22:00:00Z" },
  "stats": {
    "scanned": 12,
    "evaluated": 8,
    "bidsPlaced": 1,
    "bidsWon": 0,
    "bidsLost": 0,
    "bidsInFlight": 1,
    "budgetSpentEth": "0.105",
    "budgetRemainingEth": "0.395"
  },
  "gmailDraftId": null
}
```

## Garde-fous

- **Aucune signature.** Tu ne touches pas au keystore.
- **Pas d'envoi automatique.** Email = draft uniquement. Slack / Telegram / autres
  canaux = log dans le workspace, pas de push externe.
- **Idempotent.** Deux invocations à la même seconde produisent deux fichiers
  identiques avec horodatage de précision millisecondes.
- **Pas de PII dans les rapports publics.** Le wallet de SIGMA-∑ peut apparaître
  (c'est de l'on-chain public), jamais l'email du fondateur, jamais son identité IRL.
- **Anti-leak des concerns** : si un rapport mentionne une œuvre marquée
  `abstain` (conflit d'intérêt), seule l'existence de l'abstention est mentionnée,
  pas le motif personnel.
