# POC-004 — le règlement n'attend personne

> Réseau : **Base Sepolia** (testnet, chainId 84532). Aucune valeur réelle en jeu.
> Contrat `NexusPOC` : [`0x471796C1644d87f30AD81D36f6d4A56f0e270c23`](https://sepolia.basescan.org/address/0x471796C1644d87f30AD81D36f6d4A56f0e270c23), source vérifiée.

Les trois démonstrations précédentes ont montré qu'un agent peut évaluer, enchérir,
gagner, et qu'il ne détient pas la clé qui déplace l'argent. Restait une question que
personne n'avait posée à la chaîne : **une fois l'enchère gagnée, qui autorise le
versement ?**

Ce cycle répond. L'étape qui répartit les fonds a été déclenchée **par l'agent**,
qui n'est pas le propriétaire du contrat. Elle n'exige donc aucun droit particulier :
le propriétaire ne peut ni la retarder, ni en changer le montant, ni la retenir.

Un humain autorise la dépense. Personne n'autorise le versement.

---

## L'œuvre

**Saturne** (d'après Goya), tokenId **27**, créateur `0x7cb8E58C42402FBEd1b8792C11F6Da42942E33b3`.

| Lecture on-chain | Valeur mesurée |
|---|---|
| `tokenURI(27)` | `ar://iwM7TYMyj9BYzgC4WQtHT8gwBZJ1W7rUryDl1Rw63X0` |
| `ownerOf(27)` | `0x2d45eF16b2723164aa22a31B214D61585d46B61c` |
| `royaltyInfo(27, 1e15)` | `0x7cb8E58C…33b3` · **83 300 000 000 000** wei |
| `auctions(27)` | réserve `1e15` · meilleure offre `1e15` · enchérisseur `0x2d45eF16…6B61c` · **`settled = true`** |

---

## Les quatre gestes, et qui les a signés

| Geste | Transaction | Signée par |
|---|---|---|
| `mintWork` | [`0x36746ae7…16b96c`](https://sepolia.basescan.org/tx/0x36746ae7fc49e328290737a809d83657ced3a4f7c070e6e264a76d8a1116b96c) | le propriétaire du contrat, au coffre matériel |
| `startAuction` | [`0xa3c9e99c…2b4304`](https://sepolia.basescan.org/tx/0xa3c9e99cbfb1c37827797db53ddb6d5544ee69ba785ccf78ba7306a4632b4304) | le propriétaire du contrat, au coffre matériel |
| `placeBid` | [`0xfb172506…c87684`](https://sepolia.basescan.org/tx/0xfb1725060ffb093ac7a9f65713e913daa5dea7744567a33105ca1a99cdc87684) · `1 000 000 000 000 000` wei | l'agent, **après une confirmation humaine émise hors du système** |
| `settleAuction` | [`0xadeebb6f…92af51`](https://sepolia.basescan.org/tx/0xadeebb6f85007cf9d7770caaa4728a1f11dd2be5427b510f77e6f0cced92af51) | **l'agent** `0x2d45eF16…6B61c` |

⭐ **Le fait du cycle est dans la dernière ligne.** L'émetteur du `settleAuction` est
`0x2d45eF16b2723164aa22a31B214D61585d46B61c`. Le propriétaire du contrat, lu au même
moment par `owner()`, est `0x25DccA8fcbB5591F379af57820b87d4887B482ac`. **Ce ne sont pas
la même adresse.** La transaction inscrit publiquement que cette étape ne demande aucun
privilège — les cycles précédents la réglaient depuis le propriétaire, ce qui ne
prouvait rien.

⚠️ Le geste humain de ce cycle porte sur **l'engagement de la somme**, pas sur le
versement. C'est une confirmation donnée hors du système avant que l'agent ne puisse
engager quoi que ce soit. Le versement, lui, n'attend l'autorisation de personne.

---

## La répartition, recalculée

`finalPrice` = **1 000 000 000 000 000** wei.

| Part | Destinataire | Wei |
|---|---|---|
| Royalty créateur (EIP-2981, 833 bps) | `0x7cb8E58C…33b3` | 83 300 000 000 000 |
| Curateur | `0xA75af2Be…3Fbb` | 458 350 000 000 000 |
| Plateforme | `0x60E40beA…f1A6` | 458 350 000 000 000 |
| **Somme** | | **1 000 000 000 000 000** |

La somme **égale `finalPrice` au wei près**, sans reste.

⭐ **Ces quatre nombres ne sont pas calculés par nous : ils sont écrits dans la chaîne.**
Le règlement émet un événement `AuctionSettled(tokenId, winner, finalPrice, curatorShare,
platformShare, royaltyShare)`, et ce sont ses quatre derniers champs qui sont repris ici,
décodés depuis le journal de la transaction. La part de royalty se recoupe indépendamment
par `royaltyInfo(27, 1e15)` lue au contrat, qui rend la même valeur.

---

## L'agent pouvait refuser

Avant l'ouverture de l'enchère, l'œuvre passe une évaluation curatoriale en lecture
seule. Elle n'est pas une formalité : c'est une décision qui peut **écarter l'œuvre**,
et l'enchère ne s'ouvre pas si le seuil n'est pas franchi. Un seul pré-test par œuvre,
aucune ré-évaluation pour aller chercher un meilleur résultat.

Ce cycle a passé le seuil. Les valeurs de cette évaluation ne sont pas reproduites ici :
elles ne figurent pas au registre de faits qui gouverne les chiffres publiés.

---

## Ce que ce cycle ne prouve pas

- Il ne prouve **rien sur de la valeur réelle** : réseau de test, jetons sans marché.
- Il ne prouve pas que le contrat soit **exempt de défaut** — il n'a pas subi d'audit externe.
- Il ne dit rien de la **qualité** du jugement de l'agent, seulement du chemin qu'emprunte l'argent.
- La confirmation humaine décrite ici est celle de **ce dispositif** ; ce n'est pas une
  propriété du contrat, et rien dans le contrat ne l'impose.

---

*Toutes les valeurs de cette page ont été relues à la chaîne au moment de sa rédaction,
par `cast` sur `https://sepolia.base.org`. L'offre est confirmée au bloc **45257207**,
le règlement au bloc **45258825**, tous deux avec le statut `true`.*
