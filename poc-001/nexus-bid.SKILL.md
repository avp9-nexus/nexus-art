<!-- VERSION PUBLIQUE — copie de transparence. Agent nommé SIGMA-∑. Aucun secret,
     aucune valeur de clé/mot de passe : seuls des NOMS de variables figurent ici.
     aucune valeur de clé/mot de passe : seuls des NOMS de variables figurent ici. -->
---
name: nexus-bid
description: Pose une enchère sur le contrat NexusPOC de Base Sepolia à partir d'une décision validée de nexus-evaluate. Skill SIGNATAIRE — accès clé privée via vault chiffré. Confirmation humaine obligatoire en Phase POC.
version: 0.1.0
license: proprietary
metadata:
  openclaw:
    requires:
      env:
        - NEXUS_RPC_URL
        - NEXUS_AUCTION_ADDRESS
        - SIGMA_KEYSTORE_PATH
        - SIGMA_KEYSTORE_PASSWORD
      bins:
        - node
    primaryEnv: SIGMA_KEYSTORE_PATH
    envVars:
      - name: NEXUS_RPC_URL
        required: true
        description: Endpoint JSON-RPC Base Sepolia.
      - name: NEXUS_AUCTION_ADDRESS
        required: true
        description: Adresse du contrat NexusPOC.
      - name: SIGMA_KEYSTORE_PATH
        required: true
        description: Chemin absolu vers le keystore chiffré JSON v3 du wallet SIGMA-∑. Permissions 0600 obligatoires.
      - name: SIGMA_KEYSTORE_PASSWORD
        required: true
        description: Mot de passe de déchiffrement du keystore. À stocker dans le vault de l'agent, JAMAIS en clair dans la configuration.
      - name: NEXUS_BID_REQUIRE_HUMAN_OK
        required: false
        description: "'true' par défaut en Phase POC. Si true, demande confirmation chat avant signature. Mettre à 'false' uniquement après validation complète du POC."
      - name: NEXUS_BID_MAX_GAS_GWEI
        required: false
        description: Plafond de gas price en gwei. Par défaut 50. Au-dessus, l'enchère est reportée.
  tags:
    - nexus
    - base-sepolia
    - write
    - signing
    - high-risk
---

# nexus-bid — exécution d'enchère signée

## Rôle

Tu es le **seul skill** de l'agent autorisé à signer une transaction. À ce titre,
tu portes la responsabilité opérationnelle de l'identité on-chain de SIGMA-∑.
Tout abus de ce skill compromet le wallet du curateur.

**En Phase POC, chaque appel à `placeBid` exige une confirmation humaine
explicite d'avp9 dans le canal chat.** Cette règle n'est levée qu'après
les critères de validation du POC (cf. `VALIDATION.md`).

## Quand t'invoquer

Uniquement après une décision `bid` validée par `nexus-evaluate`, ET après lecture
d'une confirmation humaine si `NEXUS_BID_REQUIRE_HUMAN_OK == true`.

Jamais en autonome sans entrée structurée.

## Comportement attendu

### 1. Validation préalable

Reçois en stdin une décision `nexus-evaluate` :
```json
{
  "tokenId": 1,
  "decision": "bid",
  "maxBidEth": "0.18",
  "aggregateScore": 79
}
```

Refuse si :
- `decision != "bid"`
- `maxBidEth` absent ou ≤ 0
- `aggregateScore < 70`
- L'enchère n'est plus active (`getAuction(tokenId).endTime <= now`)
- Le solde du wallet SIGMA-∑ < `maxBidEth + estimatedGas × 1.2`
- `chainId != 84532`

### 2. Calcul du montant exact

Lis l'état actuel : `getAuction(tokenId).highestBid`.

- Si `highestBid == 0` : enchère = `reservePrice` (plancher légal)
- Sinon : enchère = `highestBid × 1.05` (incrément 5%)
- **Refuse** si le montant calculé > `maxBidEth` (plafond stratégique respecté)

### 3. Confirmation humaine (Phase POC)

Si `NEXUS_BID_REQUIRE_HUMAN_OK == true`, écris sur stdout :

```
[NEXUS-BID] Demande de confirmation
  tokenId: 1
  bidAmount: 0.105 ETH (Sepolia)
  contract: 0x...
  rationale: <copier rationale de nexus-evaluate>
  Répondre 'CONFIRM' dans les 5 minutes pour signer, sinon abort.
```

Attends l'input gateway. Tout autre input que `CONFIRM` (exact, casse sensible) = abort.

### 4. Signature et broadcast

1. Charge le keystore depuis `SIGMA_KEYSTORE_PATH`, déchiffre avec
   `SIGMA_KEYSTORE_PASSWORD`.
2. Construis la transaction :
   - `to`: `NEXUS_AUCTION_ADDRESS`
   - `data`: encoded `placeBid(uint256 tokenId)`
   - `value`: montant calculé en wei
   - `gasLimit`: estimé × 1.2
   - `maxFeePerGas`: lu de `eth_feeHistory`, plafonné par `NEXUS_BID_MAX_GAS_GWEI`
   - `chainId`: 84532
3. Signe localement (jamais d'envoi de clé privée vers une API).
4. `eth_sendRawTransaction`.
5. **Efface immédiatement la clé déchiffrée de la mémoire** (`crypto.randomFillSync`
   sur le buffer).

### 5. Suivi de transaction

Attends la confirmation (1 bloc Base Sepolia ≈ 2s) avec timeout 60s. Sur succès,
mets à jour `<workspace>/memory/nexus-budget.json`.

## Format de sortie

Sur succès :
```json
{
  "ok": true,
  "txHash": "0x...",
  "block": 12350702,
  "tokenId": 1,
  "amountEth": "0.105",
  "explorerUrl": "https://sepolia.basescan.org/tx/0x..."
}
```

Sur abort/erreur :
```json
{
  "ok": false,
  "reason": "human_abort | budget_exceeded | auction_ended | gas_too_high | rpc_error",
  "details": "..."
}
```

## Garde-fous critiques

- **Mainnet bloqué.** Si `chainId != 84532`, refus immédiat sans tentative.
- **Pas de clé en clair.** Le keystore est chiffré JSON v3, mot de passe dans
  le vault de l'agent, accès lecture seule pour ce skill.
- **Pas d'auto-approval.** En Phase POC, `NEXUS_BID_REQUIRE_HUMAN_OK == true`
  est immuable. Toute tentative de désactivation programmatique = erreur fatale
  loguée et abort.
- **Pas de re-bid contre soi-même.** Lis `highestBidder` ; si == adresse SIGMA-∑,
  refuse — un bug pourrait causer escalade infinie.
- **Plafond gas strict.** Si `maxFeePerGas` calculé > `NEXUS_BID_MAX_GAS_GWEI`,
  report sans bid.
- **Une transaction par invocation.** Pas de batch, pas de boucle.
- **Logs anti-fuite.** Le mot de passe et la clé privée déchiffrée ne doivent
  apparaître dans AUCUN log, AUCUN message d'erreur, AUCUN output stdout.

## En cas de doute

Si une étape échoue, **abort proprement** — ne réessaie pas en silence. Émets
un rapport via `nexus-report` avec niveau `error` et attends instruction humaine.
