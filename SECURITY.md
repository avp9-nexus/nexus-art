# Security Policy

## Scope

This repository contains a **proof-of-concept** deployed on a public **test network**.

| In scope | Out of scope |
|---|---|
| `contracts/NexusPOC.sol` — deployed at `0x471796C1644d87f30AD81D36f6d4A56f0e270c23` on Base Sepolia (chainId 84532) | Any mainnet deployment — there is none |
| The two governance documents, for factual errors | The website, the agents' runtime, the VPS infrastructure — not published here |

**No real value is at stake.** All funds involved are testnet ETH obtained from faucets;
the contract escrows only the highest bid between bid and settlement, and its balance is
zero outside an open auction. It refuses to deploy on any chain other than 84532
(`EXPECTED_CHAIN_ID`, enforced in the constructor).

## Reporting a vulnerability

Use **GitHub private vulnerability reporting** — the *Report a vulnerability* button under
the Security tab. It opens a private channel visible only to the maintainer.

Please do not open a public issue for a security finding.

## Response

This project is maintained by one person. Expect an acknowledgement within **seven days**.
There is no on-call rotation and no guaranteed remediation timeline.

## Known limitations — please do not report these

The contract is a proof of concept with documented design limits. These are **assumed
trade-offs, not defects**, and a new contract (`NexusV1`) is planned after an external
paid audit:

- **A token that has been auctioned can never be auctioned again.** `auctions[].exists` is
  never reset to `false`; settlement sets `settled = true` and the entry persists.
- **The curator recipient is a single contract-wide address.** It is mutable by the owner
  via `setCuratorRecipient(address)`, but it is not per-auction. In the POC the split can
  therefore pay a party that did not win.
- **The split assumes `owner == seller`.** In the POC the deployer is also the creator of
  the works. A distinct `sellerRecipient` is required before third-party artists deposit
  work — a rewrite, not a patch. This is stated in the contract header.
- **No anti-sniping.** A bid in the final seconds does not extend the auction. Deliberate:
  per the project's locked specification, anti-sniping is the responsibility of the
  **off-chain auction platform**, which implements it — not of the contract, and the
  successor contract deliberately keeps no time-extension logic either.
- **Blind signing is enabled on the hardware wallet** during operations. Mitigated by
  out-of-band confirmation and by decoding the transaction before signing, not by the
  device itself.

## No bug bounty

There is no reward program, monetary or otherwise. Reports are welcome and will be
credited in the repository if you wish.
